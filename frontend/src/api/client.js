import axios from 'axios';

// Dev: VITE_API_URL is empty → Vite proxy handles /api/*
// Prod same domain: VITE_API_URL is empty → nginx/caddy proxies /api/*
// Prod different domain: VITE_API_URL=https://api.yourdomain.com
const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || '') + '/api',
  timeout: 20000,
});

export const searchTokens = (params) => api.get('/search', { params });
export const getToken = (address) => api.get(`/tokens/${address}`);
export const getPrice = (token, priceChanges = false) => api.get('/price', { params: { token, priceChanges } });
export const getWallet = (owner) => api.get(`/wallet/${owner}`);
export const getTrades = (tokenAddress, params = {}) => api.get(`/trades/${tokenAddress}`, { params });
export const getChart = (token, params = {}) => api.get(`/chart/${token}`, { params });
export const getPnl = (wallet, params = {}) => api.get(`/pnl/${wallet}`, { params });
export const getTopTraders = (params = {}) => api.get('/top-traders/all', { params });

export default api;
