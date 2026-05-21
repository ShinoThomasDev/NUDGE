from llm_caller import generate_nudge
import re
import time

TEST_CASES = [
    {
        'ticker': 'ZOMATO',
        'stock_name': 'Zomato',
        'today_change_pct': -4.8,
        'trend_90d_pct': 12.4,
        'market_change_pct': -2.3,
        'hold_days': 45,
        'level': 'high',
        'signals_fired': 'sell_frequency, market_dip, trend_contradiction',
    },
    {
        'ticker': 'INFY',
        'stock_name': 'Infosys',
        'today_change_pct': -1.2,
        'trend_90d_pct': 18.1,
        'market_change_pct': -0.5,
        'hold_days': 120,
        'level': 'medium',
        'signals_fired': 'trend_contradiction',
    },
    {
        'ticker': 'TMPV',
        'stock_name': 'Tata Motors Passenger Vehicles Limited',
        'today_change_pct': -6.1,
        'trend_90d_pct': -8.2,
        'market_change_pct': -3.4,
        'hold_days': 5,
        'level': 'high',
        'signals_fired': 'sell_frequency, market_dip, hold_duration',
    }
]

for i, ctx in enumerate(TEST_CASES, start=1):
    print(f'\n--- TEST CASE {i} ---')

    nudge = generate_nudge(ctx)

    sentence_count = len(
        re.findall(r'(?<!\d)[.!?](?!\d)', nudge)
    )

    print(nudge)
    print(f'Sentence count: {sentence_count}')

    time.sleep(1)