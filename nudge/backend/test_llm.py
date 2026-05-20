# test_llm.py
from llm_caller import generate_nudge
import re

ctx = {
    'ticker':            'ZOMATO',
    'stock_name':        'Zomato',
    'today_change_pct':  -4.8,
    'trend_90d_pct':     12.4,
    'market_change_pct': -2.3,
    'hold_days':         45,
    'level':             'high',
    'signals_fired':     'sell_frequency, market_dip, trend_contradiction',
}

nudge = generate_nudge(ctx)
print('Generated nudge:')
print(nudge)
sentence_count = len(
    re.findall(r'(?<!\d)[.!?](?!\d)', nudge)
)
print(f'Sentence count: {sentence_count}')
