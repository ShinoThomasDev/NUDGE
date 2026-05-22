import api from '../services/api';

// ── Portfolio & Market ─────────────────────────────────────────
export const getPortfolio    = (userId) => api.get(`/api/portfolio/${userId}`);
export const getMarketStatus = ()       => api.get('/api/market-status');

// ── Dashboard & Analytics ──────────────────────────────────────
export const getDashboard    = (userId) => api.get(`/api/dashboard/${userId}`);

// ── Sell Flow ──────────────────────────────────────────────────
export const postSellIntent = (userId, ticker, quantity, force_nudge = false) =>
  api.post('/api/sell-intent', { user_id: userId, ticker, quantity, force_nudge });

export const postNudgeOutcome = (nudgeId, heeded) =>
  api.post('/api/nudge-outcome', { nudge_id: nudgeId, heeded });

export const postExecuteSell = (userId, ticker, quantity, nudgeId, heededNudge) =>
  api.post('/api/execute-sell', {
    user_id: userId, ticker, quantity, nudge_id: nudgeId, heeded_nudge: heededNudge
  });

// ── Phase 1: New Routes ────────────────────────────────────────
export const getTimeline          = (userId) => api.get(`/api/timeline/${userId}`);
export const getJournalEntries    = (userId) => api.get(`/api/journal/${userId}`);
export const postJournalEntry     = (data)   => api.post('/api/journal', data);
export const getPortfolioHealth   = (userId) => api.get(`/api/portfolio-health/${userId}`);
export const getInsightCards      = (userId) => api.get(`/api/insight-cards/${userId}`);
export const getBehavioralProfile = (userId) => api.get(`/api/behavioral-profile/${userId}`);
