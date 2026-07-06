import useSWR from 'swr';
import api from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';

const fetcher = (url) => api.get(url).then(r => r.data);

export function useMyStaking() {
    const { user } = useAuth();

    const { data, error, isLoading, mutate } = useSWR(
        user ? '/api/v1/staking/my-staking' : null,
        fetcher,
        { refreshInterval: 10000 }
    );

    return {
        stakes: data || [],
        isLoading,
        error,
        refreshMyStaking: mutate
    };
}

export function useAdminAllStaking() {
    const { data, error, isLoading, mutate } = useSWR(
        '/api/v1/staking/admin/all-staking',
        fetcher,
        { refreshInterval: 10000 }
    );

    return {
        allStakes: data || [],
        isLoading,
        error,
        refreshAllStaking: mutate
    };
}
