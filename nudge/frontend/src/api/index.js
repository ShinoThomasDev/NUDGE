  import axios from 'axios';

const API = axios.create({ baseURL: import.meta.env.VITE_API_URL });

// ── Portfolio & Market ─────────────────────────────────────────
export const getPortfolio    = (userId) => API.get(`/api/portfolio/${userId}`);
export const getMarketStatus = ()       => API.get('/api/market-status');

// ── Dashboard & Analytics ──────────────────────────────────────
export const getDashboard    = (userId) => API.get(`/api/dashboard/${userId}`);

// ── Sell Flow ──────────────────────────────────────────────────
export const postSellIntent = (userId, ticker, force_nudge = false) =>
  API.post('/api/sell-intent', { user_id: userId, ticker, force_nudge });

export const postNudgeOutcome = (nudgeId, heeded) =>
  API.post('/api/nudge-outcome', { nudge_id: nudgeId, heeded });

export const postExecuteSell = (userId, ticker, quantity, nudgeId, heededNudge) =>
  API.post('/api/execute-sell', {
    user_id: userId, ticker, quantity, nudge_id: nudgeId, heeded_nudge: heededNudge
  });

// ── Phase 1: New Routes ────────────────────────────────────────
export const getTimeline          = (userId) => API.get(`/api/timeline/${userId}`);
export const getJournalEntries    = (userId) => API.get(`/api/journal/${userId}`);
export const postJournalEntry     = (data)   => API.post('/api/journal', data);
export const getPortfolioHealth   = (userId) => API.get(`/api/portfolio-health/${userId}`);
export const getInsightCards      = (userId) => API.get(`/api/insight-cards/${userId}`);
export const getBehavioralProfile = (userId) => API.get(`/api/behavioral-profile/${userId}`);
