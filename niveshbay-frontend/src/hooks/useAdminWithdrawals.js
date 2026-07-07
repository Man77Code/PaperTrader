import useSWR from 'swr';
import api from '../api/axiosInstance';

const fetcher = (url) => api.get(url).then(r => r.data);

export function useAdminWithdrawals(status = 'pending') {
  const { data, error, isLoading, mutate } = useSWR(
    `/api/v1/admin/withdrawals?status=${status}`,
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
