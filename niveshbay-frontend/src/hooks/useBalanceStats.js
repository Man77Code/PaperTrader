import useSWR from 'swr';
import api from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';

const fetcher = (url) => api.get(url).then(r => r.data);

export function useBalanceStats() {
  const { user } = useAuth();

  const { data, error, isLoading, mutate } = useSWR(
    user ? '/balance-stats' : null,
    fetcher,
    { refreshInterval: 15000 }
  );

  return {
    stats: data || null,
    loading: isLoading,
    error: error?.response?.data?.message || (error ? 'Failed to load balance data' : null),
    refresh: mutate,
  };
}
