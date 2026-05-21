import { useState, useEffect } from 'react';
import { getMarketStatus } from '../api';

export default function useMarket() {
  const [market, setMarket] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMarketStatus()
      .then(r => { setMarket(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return { market, loading };
}
