import useSWR from 'swr';
import api from '../api/axiosInstance';

const fetcher = (url) => api.get(url).then(r => r.data);

export function useStakingPlans() {
    const { data, error, isLoading, mutate } = useSWR(
        '/api/v1/staking/plans',
        fetcher,
        { refreshInterval: 30000 }
    );
    return {
        plans: data || [],
        isLoading,
        error,
        refreshPlans: mutate
    };
}

export function useAdminStakingPlans() {
    const { data, error, isLoading, mutate } = useSWR(
        '/api/v1/staking/admin/plans',
        fetcher,
        { refreshInterval: 10000 }
    );
    return {
        plans: data || [],
        isLoading,
        error,
        refreshPlans: mutate
    };
}
