import toast from 'react-hot-toast';
import api from '../../api/axiosInstance';
import { formatINR } from '../../utils/formatCurrency';

function StatusBadge({ status }) {
    const map = {
        ACTIVE: 'bg-[#1a3a3a] text-[#0ecb81]',
        MATURED: 'bg-[#3a2e1a] text-[#f0b90b]',
        CLAIMED: 'bg-[#1e2433] text-[#848e9c]',
        UNSTAKED: 'bg-[#3a1a1a] text-[#f6465d]',
    };
    return (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${map[status] || 'bg-[#1e2433] text-[#848e9c]'}`}>
            {status}
        </span>
    );
}

export default function MyStakingTable({ stakes, onRefresh }) {
    async function handleClaim(stakeId) {
        try {
            const res = await api.post('/api/v1/staking/claim', { stake_id: stakeId });
            if (res.data.status === 1) {
                toast.success(`Claimed ${formatINR(res.data.total)} successfully!`);
                if (onRefresh) onRefresh();
            } else {
                toast.error(res.data.message || 'Claim failed.');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Something went wrong.');
        }
    }

    async function handleUnstake(stakeId) {
        if (!confirm('Are you sure you want to unstake early? You will only receive your principal back, no rewards.')) return;
        try {
            const res = await api.post('/api/v1/staking/unsubscribe', { stake_id: stakeId });
            if (res.data.status === 1) {
                toast.success('Stake unstaked. Principal refunded.');
                if (onRefresh) onRefresh();
            } else {
                toast.error(res.data.message || 'Unstake failed.');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Something went wrong.');
        }
    }

    if (!stakes.length) {
        return (
            <div className="text-center py-12 text-[#848e9c] text-sm">
                No staking subscriptions yet. Choose a plan above to get started!
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="text-[#848e9c] text-[10px] uppercase tracking-wider border-b border-[#1e2433]">
                        <th className="text-left py-3 px-3 font-semibold">Plan</th>
                        <th className="text-right py-3 px-3 font-semibold">Staked</th>
                        <th className="text-right py-3 px-3 font-semibold">APR</th>
                        <th className="text-right py-3 px-3 font-semibold">Reward</th>
                        <th className="text-right py-3 px-3 font-semibold">Start</th>
                        <th className="text-right py-3 px-3 font-semibold">Maturity</th>
                        <th className="text-center py-3 px-3 font-semibold">Status</th>
                        <th className="text-right py-3 px-3 font-semibold">Action</th>
                    </tr>
                </thead>
                <tbody>
                    {stakes.map(s => (
                        <tr key={s.id} className="border-b border-[#1e2433]/50 hover:bg-[#1e2433]/30">
                            <td className="py-3 px-3 text-white font-semibold text-xs">{s.plan_name}</td>
                            <td className="py-3 px-3 text-white text-xs text-right">{formatINR(s.stake_amount)}</td>
                            <td className="py-3 px-3 text-[#0ecb81] text-xs text-right">{s.apr_percent}%</td>
                            <td className="py-3 px-3 text-[#f0b90b] text-xs text-right">{formatINR(s.reward_amount || 0)}</td>
                            <td className="py-3 px-3 text-[#848e9c] text-xs text-right">
                                {new Date(s.start_date).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-3 text-[#848e9c] text-xs text-right">
                                {s.maturity_date ? new Date(s.maturity_date).toLocaleDateString() : '-'}
                            </td>
                            <td className="py-3 px-3 text-center">
                                <StatusBadge status={s.status} />
                            </td>
                            <td className="py-3 px-3 text-right">
                                {s.status === 'ACTIVE' && (
                                    <button
                                        onClick={() => handleUnstake(s.id)}
                                        className="text-[10px] bg-transparent border border-[#f6465d] text-[#f6465d] px-2 py-1 rounded hover:bg-[#f6465d]/10 cursor-pointer"
                                    >
                                        Unstake
                                    </button>
                                )}
                                {s.status === 'MATURED' && (
                                    <button
                                        onClick={() => handleClaim(s.id)}
                                        className="text-[10px] bg-[#f0b90b] text-black font-bold px-2 py-1 rounded hover:bg-[#ffd333] cursor-pointer"
                                    >
                                        Claim
                                    </button>
                                )}
                                {(s.status === 'CLAIMED' || s.status === 'UNSTAKED') && (
                                    <span className="text-[10px] text-[#848e9c]">-</span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
