from models import Holding
from sqlalchemy.orm import Session
from datetime import datetime

STOCK_NAMES = {
    'ETERNAL':     'Zomato',
    'ADANIENT':   'Adani Enterprises',
    'INFY':       'Infosys',
    'HDFCBANK':   'HDFC Bank',
    'TMPV': 'Tata Motors Passenger Vehicles Limited',
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

    sell_ratio = score_result.get('sell_ratio', 0)
    severity = 'Small Trim'
    if sell_ratio >= 1.0: severity = 'Full Liquidation'
    elif sell_ratio >= 0.8: severity = 'Major Exit'
    elif sell_ratio >= 0.5: severity = 'Partial Exit'

    return {
        'ticker':            ticker,
        'stock_name':        STOCK_NAMES.get(ticker, ticker),
        'today_change_pct':  score_result['today_change_pct'],
        'trend_90d_pct':     score_result['trend_90d_pct'],
        'market_change_pct': score_result['market_change_pct'],
        'hold_days':         score_result['hold_days'],
        'level':             score_result['level'],
        'signals_fired':     ', '.join(signals_fired) or 'none',
        'sell_ratio':        sell_ratio,
        'severity':          severity,
    }
