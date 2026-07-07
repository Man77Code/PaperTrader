import useSWR from 'swr';
import api from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';

const fetcher = (url) => api.get(url).then(r => r.data);

export function useWithdrawals(coin, limit = 20, offset = 0) {
  const { user } = useAuth();

  const params = new URLSearchParams({ limit, offset });
  if (coin) params.set('coin', coin);

  const { data, error, isLoading, mutate } = useSWR(
    user ? `/api/v1/wallet/withdrawals?${params.toString()}` : null,
    fetcher,
    { refreshInterval: 10000 }
  );

  return {
    withdrawals: data?.withdrawals || [],
    loading: isLoading,
    error: error?.response?.data?.message || (error ? 'Failed to load withdrawals' : null),
    refresh: mutate,
  };
}
