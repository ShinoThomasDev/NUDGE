from sqlalchemy.orm import Session
from datetime import datetime
from models import Holding, SellAttempt, Nudge, Trade

def get_timeline_events(user_id: str, db: Session) -> dict:
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

def compute_portfolio_health(user_id: str, db: Session) -> dict:
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

    # Compute composite score factors
    factor_heed = heed_rate * 0.5
    factor_hold = min(avg_hold, 90) / 90 * 30
    factor_trades = 20 if len(trades) < 10 else max(0, 20 - len(trades))
    
    score = min(100, int(factor_heed + factor_hold + factor_trades))

    return {
        'health_score': score,
        'heed_rate': round(heed_rate, 1),
        'avg_hold_days': round(avg_hold, 1),
        'total_trades': len(trades),
        'total_nudges': total_nudges,
        'breakdown': {
            'heed_score': round(factor_heed, 1),
            'hold_score': round(factor_hold, 1),
            'trade_score': factor_trades,
            'max_heed': 50,
            'max_hold': 30,
            'max_trade': 20
        }
    }

def generate_insight_cards(user_id: str, db: Session) -> dict:
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

def compute_behavioral_profile(user_id: str, db: Session) -> dict:
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
