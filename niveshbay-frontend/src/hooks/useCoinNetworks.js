import useSWR from 'swr';
import api from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';

const fetcher = (url) => api.get(url).then(r => r.data);

export function useCoinNetworks(symbol) {
  const { user } = useAuth();

  const { data, error, isLoading } = useSWR(
    user && symbol ? `/api/v1/wallet/coin/${symbol}` : null,
    fetcher,
    { refreshInterval: 30000 }
  );

  return {
    coin: data || null,
    networks: data?.networks || [],
    spot: data?.spot || 0,
    funding: data?.funding || 0,
    share: data?.share || 0,
    inTrade: data?.inTrade || 0,
    total: data?.total || 0,
    price: data?.price || 0,
    loading: isLoading,
    error: error?.response?.data?.message || (error ? 'Failed to load coin data' : null),
  };
}
