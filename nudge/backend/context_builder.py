from models import Holding
from sqlalchemy.orm import Session
from datetime import datetime

STOCK_NAMES = {
    'ETERNAL':     'Zomato',
    'ADANIENT':   'Adani Enterprises',
    'INFY':       'Infosys',
    'HDFCBANK':   'HDFC Bank',
    'TATAMOTORS': 'Tata Motors',
}

def build_context(user_id: str, ticker: str, score_result: dict, db: Session) -> dict:
    '''
    Takes the output of compute_score() and adds stock_name.
    Returns a flat dict ready to interpolate into the LLM prompt template.
    '''
    signals_fired = [
        name for name, sig in score_result['signals'].items()
        if sig.get('fired', False)
    ]

    return {
        'ticker':            ticker,
        'stock_name':        STOCK_NAMES.get(ticker, ticker),
        'today_change_pct':  score_result['today_change_pct'],
        'trend_90d_pct':     score_result['trend_90d_pct'],
        'market_change_pct': score_result['market_change_pct'],
        'hold_days':         score_result['hold_days'],
        'level':             score_result['level'],
        'signals_fired':     ', '.join(signals_fired) or 'none',
    }
