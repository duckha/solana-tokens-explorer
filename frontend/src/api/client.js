import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
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
