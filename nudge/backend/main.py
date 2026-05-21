from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
from dotenv import load_dotenv
import yfinance as yf
import json, os

from database import get_db, engine, Base
from models import User, Holding, SellAttempt, Nudge, Trade, JournalEntry, BehavioralProfile
from impulsivity_engine import compute_score, resolve_ticker
from context_builder import build_context
from llm_caller import generate_nudge

load_dotenv()
Base.metadata.create_all(bind=engine)

app = FastAPI(title='Nudge API')
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv('FRONTEND_URL', 'http://localhost:5173')],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

# ── Pydantic request schemas ──────────────────────────────────────────
class SellIntentRequest(BaseModel):
    user_id: str
    ticker:  str
    force_nudge: bool = False

class NudgeOutcomeRequest(BaseModel):
    nudge_id: int
    heeded:   bool

class ExecuteSellRequest(BaseModel):
    user_id:  str
    ticker:   str
    quantity: int
    nudge_id: int | None = None
    heeded_nudge: bool | None = None

class JournalRequest(BaseModel):
    user_id:    str
    content:    str
    ticker:     str | None = None
    entry_type: str = 'reflection'
    mood:       str | None = None

# ── Routes ───────────────────────────────────────────────────────────

@app.post('/api/sell-intent')
def sell_intent(req: SellIntentRequest, db: Session = Depends(get_db)):
    # 1. Log the attempt (this is  tracks " User tried to sell")
    attempt = SellAttempt(user_id=req.user_id, ticker=req.ticker)
    db.add(attempt)
    db.commit()

    # 2. Score
    result = compute_score(req.user_id, req.ticker, db)
    score  = result['score']
    level  = result['level']

    # 3. No nudge — let trade proceed

    '''low impulsivity → no intervention

Very important product decision.

You do NOT interrupt every sell action.'''

    if score < 35 and not req.force_nudge:
        return {'action': 'proceed', 'score': score}

    # 4. Build LLM context and generate nudge
    context = build_context(req.user_id, req.ticker, result, db)
    message = generate_nudge(context)

    # 5. Save nudge to DB
    nudge = Nudge(
        user_id      = req.user_id,
        ticker       = req.ticker,
        score        = score,
        level        = level,
        message      = message,
        signals_json = json.dumps(result['signals']),
    )
    db.add(nudge)
    db.commit()
    db.refresh(nudge)

    # 6. Mark attempt as nudge-fired
    attempt.nudge_fired = True
    db.commit()

    return {
        'action':   'nudge',
        'nudge_id': nudge.id,
        'score':    score,
        'level':    level,
        'message':  message,
        'signals':  result['signals'],
        'context':  context,
    }


@app.post('/api/nudge-outcome')
def nudge_outcome(req: NudgeOutcomeRequest, db: Session = Depends(get_db)):
    nudge = db.query(Nudge).filter(Nudge.id == req.nudge_id).first()
    if not nudge:
        raise HTTPException(status_code=404, detail='Nudge not found')
    nudge.heeded      = req.heeded
    nudge.responded_at = datetime.utcnow()
    db.commit()
    return {'status': 'ok', 'heeded': req.heeded}


@app.post('/api/execute-sell')
def execute_sell(req: ExecuteSellRequest, db: Session = Depends(get_db)):
    holding = (
        db.query(Holding)
        .filter(Holding.user_id == req.user_id, Holding.ticker == req.ticker)
        .first()
    )
    if not holding:
        raise HTTPException(status_code=404, detail='Holding not found')
    if holding.quantity < req.quantity:
        raise HTTPException(status_code=400, detail='Insufficient quantity')

    # Fetch current price
    yf_ticker = resolve_ticker(req.ticker)
    data = yf.download(f'{yf_ticker}.NS', period='5d', interval='1d', progress=False).dropna()
    price = float(data['Close'].iloc[-1].item()) if len(data) else holding.avg_buy_price
    '''If Yahoo fails or returns empty: 
    fallback to avg_buy_price'''

    trade = Trade(
        user_id      = req.user_id,
        ticker       = req.ticker,
        action       = 'sell',
        quantity     = req.quantity,
        price        = price,
        nudge_id     = req.nudge_id,
        heeded_nudge = req.heeded_nudge,
    )
    db.add(trade)

    holding.quantity -= req.quantity
    if holding.quantity == 0:
        db.delete(holding)

    db.commit()
    return {'status': 'sold', 'price': price, 'quantity': req.quantity}


@app.get('/api/portfolio/{user_id}')
def get_portfolio(user_id: str, db: Session = Depends(get_db)):
    holdings = db.query(Holding).filter(Holding.user_id == user_id).all()
    result = []
    for h in holdings:
        try:
            yf_ticker = resolve_ticker(h.ticker)
            data = yf.download(f'{yf_ticker}.NS', period='5d', interval='1d', progress=False).dropna()
            if len(data) == 0:
                raise ValueError("No valid data")
            current = float(data['Close'].iloc[-1].item())
            prev    = float(data['Close'].iloc[-2].item()) if len(data) > 1 else current
            today_pct = (current - prev) / prev * 100
        except:
            current, today_pct = h.avg_buy_price, 0.0

        result.append({
            'ticker':        h.ticker,
            'stock_name':    h.stock_name,
            'quantity':      h.quantity,
            'avg_buy_price': h.avg_buy_price,
            'current_price': round(current, 2),
            'today_pct':     round(today_pct, 2),
            'total_value':   round(current * h.quantity, 2),
            'pnl':           round((current - h.avg_buy_price) * h.quantity, 2),
        })
    return {'user_id': user_id, 'holdings': result}


@app.get('/api/dashboard/{user_id}')
def get_dashboard(user_id: str, db: Session = Depends(get_db)):
    nudges = db.query(Nudge).filter(Nudge.user_id == user_id).all()
    total  = len(nudges)
    heeded = sum(1 for n in nudges if n.heeded is True)
    return {
        'total_nudges':   total,
        'heeded_nudges':  heeded,
        'heed_rate':      round(heeded / total * 100, 1) if total else 0,
        'nudge_history':  [{'id': n.id, 'ticker': n.ticker, 'score': n.score,
                            'level': n.level, 'message': n.message,
                            'heeded': n.heeded, 'created_at': str(n.created_at)}
                           for n in nudges[-10:]],
    }


@app.get('/api/market-status')
def market_status():
    try:
        def safe_download(ticker):
            df = yf.download(ticker, period='5d', interval='1d', progress=False)
            if 'Close' in df:
                return df['Close'].dropna()
            return df.dropna()
            
        nifty  = safe_download('^NSEI')
        sensex = safe_download('^BSESN')
        vix    = safe_download('^INDIAVIX')
        
        def pct(s): 
            if len(s) < 2: return 0.0
            return round(((s.iloc[-1] - s.iloc[-2]) / s.iloc[-2] * 100).item(), 2)
                                    
        nifty_pct = pct(nifty)
        vix_val = float(vix.iloc[-1].item()) if len(vix) else 15.0

        if vix_val > 20 and nifty_pct < 0:
            mood = 'Extreme Fear'
            mood_color = 'rose'
        elif vix_val > 18 or nifty_pct < -1.0:
            mood = 'Volatile'
            mood_color = 'amber'
        elif vix_val < 13 and nifty_pct > 0:
            mood = 'Greed'
            mood_color = 'emerald'
        else:
            mood = 'Neutral'
            mood_color = 'slate'

        return {
            'nifty':  {'price': round(float(nifty.iloc[-1].item()), 2) if len(nifty) else 0.0,  'change_pct': nifty_pct},
            'sensex': {'price': round(float(sensex.iloc[-1].item()), 2) if len(sensex) else 0.0, 'change_pct': pct(sensex)},
            'vix':    {'price': round(vix_val, 2), 'change_pct': pct(vix)},
            'mood':   {'label': mood, 'color': mood_color}
        }
    except Exception as e:
        return {'error': str(e)}


# ── Phase 1: New Routes ──────────────────────────────────────────

@app.get('/api/timeline/{user_id}')
def get_timeline(user_id: str, db: Session = Depends(get_db)):
    """Build a chronological behavioral timeline from all user activity."""
    events = []

    # Sell attempts
    attempts = db.query(SellAttempt).filter(SellAttempt.user_id == user_id).all()
    for a in attempts:
        events.append({
            'type': 'sell_attempt',
            'description': f'Attempted to sell {a.ticker}',
            'ticker': a.ticker,
            'timestamp': str(a.attempted_at),
        })

    # Nudges
    nudges = db.query(Nudge).filter(Nudge.user_id == user_id).all()
    for n in nudges:
        events.append({
            'type': 'nudge_fired',
            'description': f'AI nudge triggered for {n.ticker} (score: {n.score})',
            'ticker': n.ticker,
            'timestamp': str(n.created_at),
        })
        if n.heeded is True:
            events.append({
                'type': 'nudge_heeded',
                'description': f'Heeded nudge — kept holding {n.ticker}',
                'ticker': n.ticker,
                'timestamp': str(n.responded_at or n.created_at),
            })
        elif n.heeded is False:
            events.append({
                'type': 'nudge_ignored',
                'description': f'Ignored nudge — proceeded to sell {n.ticker}',
                'ticker': n.ticker,
                'timestamp': str(n.responded_at or n.created_at),
            })

    # Trades
    trades = db.query(Trade).filter(Trade.user_id == user_id).all()
    for t in trades:
        events.append({
            'type': 'trade_executed',
            'description': f'Sold {t.quantity} shares of {t.ticker} at ₹{t.price:.2f}',
            'ticker': t.ticker,
            'timestamp': str(t.executed_at),
        })

    # Sort chronologically, newest first
    events.sort(key=lambda e: e['timestamp'], reverse=True)
    return {'events': events}


@app.get('/api/journal/{user_id}')
def get_journal(user_id: str, db: Session = Depends(get_db)):
    entries = (
        db.query(JournalEntry)
        .filter(JournalEntry.user_id == user_id)
        .order_by(JournalEntry.created_at.desc())
        .all()
    )
    return {
        'entries': [{
            'id': e.id, 'ticker': e.ticker, 'entry_type': e.entry_type,
            'content': e.content, 'mood': e.mood, 'created_at': str(e.created_at),
        } for e in entries]
    }


@app.post('/api/journal')
def create_journal(req: JournalRequest, db: Session = Depends(get_db)):
    entry = JournalEntry(
        user_id    = req.user_id,
        ticker     = req.ticker,
        entry_type = req.entry_type,
        content    = req.content,
        mood       = req.mood,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return {'status': 'created', 'id': entry.id}


@app.get('/api/portfolio-health/{user_id}')
def portfolio_health(user_id: str, db: Session = Depends(get_db)):
    """Compute a behavioral health score (0-100) based on trading discipline."""
    nudges = db.query(Nudge).filter(Nudge.user_id == user_id).all()
    trades = db.query(Trade).filter(Trade.user_id == user_id).all()
    holdings = db.query(Holding).filter(Holding.user_id == user_id).all()

    total_nudges = len(nudges)
    heeded = sum(1 for n in nudges if n.heeded is True)
    heed_rate = (heeded / total_nudges * 100) if total_nudges else 50

    # Average hold duration
    avg_hold = 0
    if holdings:
        avg_hold = sum((datetime.utcnow() - h.buy_date).days for h in holdings) / len(holdings)

    # Compute composite score
    score = min(100, int(
        (heed_rate * 0.5) +
        (min(avg_hold, 90) / 90 * 30) +
        (20 if len(trades) < 10 else max(0, 20 - len(trades)))
    ))

    return {
        'health_score': score,
        'heed_rate': round(heed_rate, 1),
        'avg_hold_days': round(avg_hold, 1),
        'total_trades': len(trades),
        'total_nudges': total_nudges,
    }


@app.get('/api/insight-cards/{user_id}')
def insight_cards(user_id: str, db: Session = Depends(get_db)):
    """Generate insight cards from behavioral data."""
    nudges = db.query(Nudge).filter(Nudge.user_id == user_id).all()
    trades = db.query(Trade).filter(Trade.user_id == user_id).all()

    cards = []

    # Most nudged stock
    if nudges:
        from collections import Counter
        ticker_counts = Counter(n.ticker for n in nudges)
        most_reactive = ticker_counts.most_common(1)[0]
        cards.append({
            'type': 'most_reactive',
            'title': 'Most Reactive Stock',
            'value': most_reactive[0],
            'detail': f'{most_reactive[1]} nudges triggered',
        })

    # Best disciplined decision (heeded nudge with highest score)
    heeded_nudges = [n for n in nudges if n.heeded is True]
    if heeded_nudges:
        best = max(heeded_nudges, key=lambda n: n.score)
        cards.append({
            'type': 'best_discipline',
            'title': 'Best Disciplined Decision',
            'value': best.ticker,
            'detail': f'Resisted selling at score {best.score}',
        })

    # Total trades
    if trades:
        cards.append({
            'type': 'total_trades',
            'title': 'Trades Executed',
            'value': str(len(trades)),
            'detail': f'Across {len(set(t.ticker for t in trades))} stocks',
        })

    return {'cards': cards}


@app.get('/api/behavioral-profile/{user_id}')
def behavioral_profile(user_id: str, db: Session = Depends(get_db)):
    """Compute investor personality profile."""
    nudges = db.query(Nudge).filter(Nudge.user_id == user_id).all()
    trades = db.query(Trade).filter(Trade.user_id == user_id).all()
    holdings = db.query(Holding).filter(Holding.user_id == user_id).all()

    total = len(nudges)
    heeded = sum(1 for n in nudges if n.heeded is True)
    heed_rate = (heeded / total * 100) if total else 0

    avg_hold = 0
    if holdings:
        avg_hold = sum((datetime.utcnow() - h.buy_date).days for h in holdings) / len(holdings)

    # Determine profile
    if heed_rate >= 80:
        profile = 'Disciplined Investor'
    elif heed_rate >= 60:
        profile = 'Improving Discipline'
    elif heed_rate >= 30:
        profile = 'Reactive Trader'
    elif total > 0:
        profile = 'Panic Seller'
    else:
        profile = 'New Investor'

    traits = []
    if avg_hold < 14:
        traits.append('Short-term holder')
    elif avg_hold > 90:
        traits.append('Patient investor')
    if len(trades) > 5:
        traits.append('Active trader')
    if heed_rate > 70:
        traits.append('Nudge-responsive')
    if total > 0 and heed_rate < 30:
        traits.append('Volatility sensitive')

    return {
        'profile_type': profile,
        'heed_rate': round(heed_rate, 1),
        'avg_hold_days': round(avg_hold, 1),
        'total_trades': len(trades),
        'total_nudges': total,
        'traits': traits,
    }
