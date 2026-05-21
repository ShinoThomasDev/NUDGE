from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
from dotenv import load_dotenv
import yfinance as yf
import json, os

from database import get_db, engine, Base
from models import User, Holding, SellAttempt, Nudge, Trade
from impulsivity_engine import compute_score
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

class NudgeOutcomeRequest(BaseModel):
    nudge_id: int
    heeded:   bool

class ExecuteSellRequest(BaseModel):
    user_id:  str
    ticker:   str
    quantity: int
    nudge_id: int | None = None
    heeded_nudge: bool | None = None

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

    if score < 35:
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
    data = yf.download(f'{req.ticker}.NS', period='1d', interval='1d', progress=False)
    price = float(data['Close'].iloc[-1]) if len(data) else holding.avg_buy_price
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
            data = yf.download(f'{h.ticker}.NS', period='2d', interval='1d', progress=False)
            current = float(data['Close'].iloc[-1])
            prev    = float(data['Close'].iloc[-2]) if len(data) > 1 else current
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
        nifty  = yf.download('^NSEI',  period='2d', interval='1d', progress=False)
        sensex = yf.download('^BSESN', period='2d', interval='1d', progress=False)
        def pct(df): return round(((df['Close'].iloc[-1] - df['Close'].iloc[-2])
                                    / df['Close'].iloc[-2] * 100).item(), 2)
        return {
            'nifty':  {'price': round(float(nifty['Close'].iloc[-1].item()), 2),  'change_pct': pct(nifty)},
            'sensex': {'price': round(float(sensex['Close'].iloc[-1].item()), 2), 'change_pct': pct(sensex)},
        }
    except Exception as e:
        return {'error': str(e)}
