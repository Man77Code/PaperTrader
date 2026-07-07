import useSWR from 'swr';
import api from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';

const fetcher = (url) => api.get(url).then(r => r.data);

export function useWalletHistory(params = {}) {
  const { user } = useAuth();

  const query = new URLSearchParams();
  if (params.type) query.set('type', params.type);
  if (params.asset) query.set('asset', params.asset);
  if (params.from) query.set('from', params.from);
  if (params.to) query.set('to', params.to);
  if (params.limit) query.set('limit', params.limit);
  if (params.offset) query.set('offset', params.offset);

  const { data, error, isLoading, mutate } = useSWR(
    user ? `/api/v1/wallet/history?${query.toString()}` : null,
    fetcher,
    { refreshInterval: 15000 }
  );

  return {
    history: data?.history || [],
    total: data?.total || 0,
    loading: isLoading,
    error: error?.response?.data?.message || (error ? 'Failed to load history' : null),
    refresh: mutate,
  };
}
