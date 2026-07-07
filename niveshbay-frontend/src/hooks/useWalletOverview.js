import useSWR from 'swr';
import api from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const fetcher = (url) => api.get(url).then(r => r.data);

export function useWalletOverview() {
  const { user } = useAuth();
  const { balanceUpdate } = useSocket();

  const { data, error, isLoading, mutate } = useSWR(
    user ? '/api/v1/wallet/overview' : null,
    fetcher,
    { refreshInterval: 15000 }
  );

  if (balanceUpdate) {
    setTimeout(() => mutate(), 500);
  }

  return {
    overview: data?.overview || [],
    totalEstimated: data?.totalEstimated || 0,
    inrBalance: data?.inrBalance || 0,
    loading: isLoading,
    error: error?.response?.data?.message || (error ? 'Failed to load wallet data' : null),
    refresh: mutate,
  };
}
