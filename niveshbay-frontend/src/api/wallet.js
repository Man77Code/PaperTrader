import api from './axiosInstance';

export async function getWalletOverview() {
  const res = await api.get('/api/v1/wallet/overview');
  return res.data;
}

export async function getCoinDetail(symbol) {
  const res = await api.get(`/api/v1/wallet/coin/${symbol}`);
  return res.data;
}

export async function getDepositAddress(coin, network) {
  const res = await api.get('/api/v1/wallet/deposit-address', { params: { coin, network } });
  return res.data;
}

export async function getDeposits(coin, limit = 20, offset = 0) {
  const res = await api.get('/api/v1/wallet/deposits', { params: { coin, limit, offset } });
  return res.data;
}

export async function initiateWithdraw(payload) {
  const res = await api.post('/api/v1/wallet/withdraw/initiate', payload);
  return res.data;
}

export async function confirmWithdraw(payload) {
  const res = await api.post('/api/v1/wallet/withdraw/confirm', payload);
  return res.data;
}

export async function getWithdrawals(coin, limit = 20, offset = 0) {
  const res = await api.get('/api/v1/wallet/withdrawals', { params: { coin, limit, offset } });
  return res.data;
}

export async function transferFunds(payload) {
  const res = await api.post('/api/v1/wallet/transfer', payload);
  return res.data;
}

export async function getWalletHistory(params = {}) {
  const res = await api.get('/api/v1/wallet/history', { params });
  return res.data;
}
