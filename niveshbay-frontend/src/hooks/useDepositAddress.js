import useSWR from 'swr';
import api from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';

const fetcher = (url) => api.get(url).then(r => r.data);

export function useDepositAddress(coin, network) {
  const { user } = useAuth();

  const shouldFetch = user && coin;

  const { data, error, isLoading, mutate } = useSWR(
    shouldFetch ? `/api/v1/wallet/deposit-address?coin=${coin}&network=${network || ''}` : null,
    fetcher
  );

  return {
    address: data?.address || null,
    loading: isLoading,
    error: error?.response?.data?.message || (error ? 'Failed to load deposit address' : null),
    refresh: mutate,
  };
}
