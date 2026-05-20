import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from models import SellAttempt, Holding


def _signal_sell_frequency(user_id: str, ticker: str, db: Session) -> dict:
    '''
    Signal 1: How many times has this user tried to sell THIS stock
    in the last 15 minutes?

    Basis: Kahneman System 1 — rapid repeated actions without deliberation
    are a hallmark of emotional, non-reflective decision making.

    Scoring: each attempt = 12 pts, capped at 35.
    '''
    window = datetime.utcnow() - timedelta(minutes=15)
    attempts = (
        db.query(SellAttempt)
        .filter(
            SellAttempt.user_id == user_id,
            SellAttempt.ticker  == ticker,
            SellAttempt.attempted_at >= window,
        )
        .count()
    )
    score = min(attempts * 12, 35)
    return {
        'value': attempts,
        'score': score,
        'label': f'{attempts} sell attempt(s) in last 15 min',
        'fired': score > 0,
    }


def _signal_market_dip() -> dict:
    '''
    Signal 2: Is the broad market (Nifty 50) down significantly today?

    Basis: Herding behaviour — retail investors systematically panic-sell
    during market-wide dips even when their stock's fundamentals are fine.

    Scoring: fires only if Nifty < -1.5%. Score = abs(change) * 5, max 25.
    '''
    try:
        nifty = yf.download('^NSEI', period='2d', interval='1d', progress=False)
        if len(nifty) < 2:
            return {'value': 0, 'score': 0, 'label': 'Market data unavailable', 'fired': False}
        today_change = ((nifty['Close'].iloc[-1] - nifty['Close'].iloc[-2])
                        / nifty['Close'].iloc[-2] * 100).item()
        if today_change < -1.5:
            score = min(abs(today_change) * 5, 25)
        else:
            score = 0
        return {
            'value': round(today_change, 2),
            'score': round(score),
            'label': f'Nifty {today_change:+.1f}% today',
            'fired': score > 0,
        }
    except Exception as e:
        return {'value': 0, 'score': 0, 'label': f'Market fetch error: {e}', 'fired': False}

# Mapping for known ticker changes to ensure Yahoo Finance compatibility
TICKER_ALIASES = {
    'ZOMATO': 'ETERNAL',
    # Add other future ticker changes here
}

'''
Now the code correctly fetches the historical data 
 for Zomato without producing the "symbol may be delisted" error.

'''
def resolve_ticker(ticker: str) -> str:
    """Returns the current active ticker for Yahoo Finance if a known alias exists."""
    return TICKER_ALIASES.get(ticker.upper(), ticker.upper())


def _signal_trend_contradiction(ticker: str) -> dict:
    '''
    Signal 3: Is the stock up significantly over 90 days but down today?

    Basis: Myopic loss aversion (Thaler & Benartzi 1995) — investors
    disproportionately weight today's loss vs. the 90-day gain context,
    leading to irrational sell decisions on short-term volatility.

    Scoring: fires if 90d_return > 5% AND today < -2%. Score = 90d * 0.8, max 25.
    '''
    try:
        yf_ticker = resolve_ticker(ticker)
        #yf_ticker because sometimes yfinance does not find the ticker symbol
        #eg : zomato is now ETERNAL so we use yf_ticker
        hist = yf.download(f'{yf_ticker}.NS', period='95d', interval='1d', progress=False)
        if len(hist) < 5:
            return {'value': 0, 'score': 0, 'label': 'History unavailable', 'fired': False}

        price_90d_ago = hist['Close'].iloc[0].item()
        price_yesterday = hist['Close'].iloc[-2].item()
        price_today = hist['Close'].iloc[-1].item()

        return_90d = (price_today - price_90d_ago) / price_90d_ago * 100
        today_change = (price_today - price_yesterday) / price_yesterday * 100

        if return_90d > 5 and today_change < -2:
            score = min(return_90d * 0.8, 25)
        else:
            score = 0

        return {
            'value': round(return_90d, 2),
            'score': round(score),
            'label': f'Up {return_90d:.1f}% in 90d, down {abs(today_change):.1f}% today',
            'fired': score > 0,
            'today_change_pct': round(today_change, 2),
            'current_price': round(price_today, 2),
        }
    except Exception as e:
        return {'value': 0, 'score': 0, 'label': f'Trend fetch error: {e}', 'fired': False}


def _signal_hold_duration(user_id: str, ticker: str, db: Session) -> dict:
    '''
    Signal 4: How long has the user held this stock?

    Basis: Short-termism — selling within 14 days of buying is almost always
    reactive. Behavioural research shows <2 week holds correlate strongly
    with emotionally-driven exits, not strategic rebalancing.

    Scoring: if hold_days < 14, score = max(15 - hold_days, 0).
    '''
    holding = (
        db.query(Holding)
        .filter(Holding.user_id == user_id, Holding.ticker == ticker)
        .first()
    )
    if not holding:
        return {'value': 0, 'score': 0, 'label': 'Holding not found', 'fired': False}

    hold_days = (datetime.utcnow() - holding.buy_date).days
    score = max(15 - hold_days, 0) if hold_days < 14 else 0
    return {
        'value': hold_days,
        'score': score,
        'label': f'Held for {hold_days} days',
        'fired': score > 0,
    }


def compute_score(user_id: str, ticker: str, db: Session) -> dict:
    '''
    Main entry point. Returns full signal breakdown + total score + level.
    Called by POST /api/sell-intent.
    '''
    s1 = _signal_sell_frequency(user_id, ticker, db)
    s2 = _signal_market_dip()
    s3 = _signal_trend_contradiction(ticker)
    s4 = _signal_hold_duration(user_id, ticker, db)

    total = s1['score'] + s2['score'] + s3['score'] + s4['score']
    total = min(total, 100)  # hard cap

    if total < 35:   level = 'low'
    elif total < 65: level = 'medium'
    else:            level = 'high'

    return {
        'score': total,
        'level': level,
        'signals': {
            'sell_frequency':      s1,
            'market_dip':          s2,
            'trend_contradiction': s3,
            'hold_duration':       s4,
        },
        # Convenience fields for llm_caller context builder
        'today_change_pct':  s3.get('today_change_pct', 0),
        'trend_90d_pct':     s3.get('value', 0),
        'market_change_pct': s2.get('value', 0),
        'hold_days':         s4.get('value', 0),
        'current_price':     s3.get('current_price', 0),
    }
