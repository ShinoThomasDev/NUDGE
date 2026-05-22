import yfinance as yf
import pandas as pd
import logging
from datetime import datetime, timedelta

# Setup structured logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
if not logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)
    logger.addHandler(handler)

# Simple in-memory cache
_market_cache = {}
CACHE_TTL_SECONDS = 60

TICKER_ALIASES = {
    'ZOMATO': 'ETERNAL',
    'TATAMOTORS': 'TMPV',
}

def resolve_ticker(ticker: str) -> str:
    """Returns the current active ticker for Yahoo Finance if a known alias exists."""
    return TICKER_ALIASES.get(ticker.upper(), ticker.upper())

def fetch_stock_data(ticker: str, period: str = '5d', interval: str = '1d') -> pd.DataFrame:
    """
    Fetch stock data with caching, fallback, and graceful degradation.
    Returns a pandas DataFrame (can be empty if failed).
    """
    yf_ticker = resolve_ticker(ticker)
    
    # Check cache
    cache_key = f"{yf_ticker}_{period}_{interval}"
    now = datetime.utcnow()
    
    if cache_key in _market_cache:
        cached_data, timestamp = _market_cache[cache_key]
        if (now - timestamp).total_seconds() < CACHE_TTL_SECONDS:
            logger.debug(f"Cache hit for {cache_key}")
            return cached_data

    # Fetch from yfinance
    logger.info(f"Fetching market data for {yf_ticker} (period={period}, interval={interval})")
    try:
        df = yf.download(f"{yf_ticker}.NS" if not yf_ticker.startswith('^') else yf_ticker, 
                         period=period, interval=interval, progress=False, timeout=5)
        
        if 'Close' in df:
            df = df['Close'].dropna()
        else:
            df = df.dropna()
            
        # Save to cache
        _market_cache[cache_key] = (df, now)
        return df

    except Exception as e:
        logger.error(f"Failed to fetch market data for {yf_ticker}: {e}")
        # Return empty Series/DataFrame on failure
        return pd.Series(dtype=float) if 'Close' in locals().get('df', pd.DataFrame()).columns or True else pd.DataFrame()

def get_market_status() -> dict:
    """Get overall market status for Nifty, Sensex, and VIX."""
    try:
        nifty = fetch_stock_data('^NSEI')
        sensex = fetch_stock_data('^BSESN')
        vix = fetch_stock_data('^INDIAVIX')
        
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
        logger.error(f"Market status error: {e}")
        return {'error': str(e)}
