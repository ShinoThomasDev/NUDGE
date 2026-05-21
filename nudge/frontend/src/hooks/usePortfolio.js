import { useState, useEffect } from 'react';
import { getPortfolio } from '../api';

const USER_ID = 'user_shinothomas_demo';

export default function usePortfolio() {
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPortfolio = async () => {
    setLoading(true);
    try {
      const res = await getPortfolio(USER_ID);
      setPortfolio(res.data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPortfolio(); }, []);

  return { portfolio, loading, error, refetch: fetchPortfolio };
}
