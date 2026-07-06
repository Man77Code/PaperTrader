import { useAdminStakingPlans } from '../hooks/useStakingPlans';
import { useAdminAllStaking } from '../hooks/useMyStaking';
import AdminStakingPanel from '../components/staking/AdminStakingPanel';

export default function AdminStakingPage() {
    const { plans, isLoading, refreshPlans } = useAdminStakingPlans();
    const { allStakes, isLoading: stakesLoading, refreshAllStaking } = useAdminAllStaking();

    function handleRefresh() {
        refreshPlans();
        refreshAllStaking();
    }

    if (isLoading || stakesLoading) {
        return (
            <div className="min-h-screen bg-[#0b0e11] flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-[#f0b90b] border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0b0e11] text-white">
            <div className="max-w-6xl mx-auto px-4 py-6">
                <h1 className="text-2xl font-bold mb-6">Admin - Staking Management</h1>
                <AdminStakingPanel plans={plans} allStakes={allStakes} onRefresh={handleRefresh} />
            </div>
        </div>
    );
}
