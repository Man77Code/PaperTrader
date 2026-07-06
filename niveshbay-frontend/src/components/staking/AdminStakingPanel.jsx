import { useState } from 'react';
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

export default function AdminStakingPanel({ plans, allStakes, onRefresh }) {
    const [tab, setTab] = useState('plans');
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({ name: '', min_amount: '', max_amount: '', duration_days: '', apr_percent: '' });

    async function handleCreate(e) {
        e.preventDefault();
        try {
            const res = await api.post('/api/v1/staking/admin/plans', {
                name: form.name,
                min_amount: parseFloat(form.min_amount),
                max_amount: parseFloat(form.max_amount),
                duration_days: parseInt(form.duration_days),
                apr_percent: parseFloat(form.apr_percent)
            });
            if (res.data.status === 1) {
                toast.success('Plan created!');
                setShowCreate(false);
                setForm({ name: '', min_amount: '', max_amount: '', duration_days: '', apr_percent: '' });
                if (onRefresh) onRefresh();
            } else {
                toast.error(res.data.message || 'Failed to create plan.');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Something went wrong.');
        }
    }

    async function handleToggleStatus(planId, currentStatus) {
        try {
            const res = await api.put(`/api/v1/staking/admin/plans/${planId}`, {
                status: currentStatus === 1 ? 0 : 1
            });
            if (res.data.status === 1) {
                toast.success('Plan status updated.');
                if (onRefresh) onRefresh();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update plan.');
        }
    }

    async function handleDelete(planId) {
        if (!confirm('Delete this plan? This cannot be undone.')) return;
        try {
            const res = await api.delete(`/api/v1/staking/admin/plans/${planId}`);
            if (res.data.status === 1) {
                toast.success('Plan deleted.');
                if (onRefresh) onRefresh();
            } else {
                toast.error(res.data.message || 'Failed to delete plan.');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Something went wrong.');
        }
    }

    const activeStakes = allStakes.filter(s => s.status === 'ACTIVE');
    const maturedStakes = allStakes.filter(s => s.status === 'MATURED');
    const totalStaked = allStakes.reduce((s, x) => s + parseFloat(x.stake_amount || 0), 0);

    return (
        <div>
            <div className="flex gap-1 bg-[#0b0e11] rounded-lg p-1 mb-6 border border-[#1e2433] w-fit">
                {[
                    { key: 'plans', label: 'Plans' },
                    { key: 'stakes', label: 'All Stakes' },
                ].map(t => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={`px-4 py-1.5 text-xs font-bold rounded cursor-pointer transition ${
                            tab === t.key ? 'bg-[#f0b90b] text-black' : 'text-[#848e9c] hover:text-white'
                        }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {tab === 'plans' && (
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white font-bold text-sm">Staking Plans</h3>
                        <button
                            onClick={() => setShowCreate(!showCreate)}
                            className="text-xs bg-[#f0b90b] text-black font-bold px-3 py-1.5 rounded hover:bg-[#ffd333] cursor-pointer"
                        >
                            {showCreate ? 'Cancel' : '+ New Plan'}
                        </button>
                    </div>

                    {showCreate && (
                        <form onSubmit={handleCreate} className="bg-[#0b0e11] border border-[#1e2433] rounded-lg p-4 mb-4 space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] text-[#848e9c] block mb-0.5">Name</label>
                                    <input
                                        value={form.name}
                                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                        className="w-full bg-[#141822] border border-[#2b3548] rounded px-2 py-1.5 text-white text-xs focus:outline-none focus:border-[#f0b90b]"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] text-[#848e9c] block mb-0.5">Duration (days)</label>
                                    <input
                                        type="number"
                                        value={form.duration_days}
                                        onChange={e => setForm(f => ({ ...f, duration_days: e.target.value }))}
                                        className="w-full bg-[#141822] border border-[#2b3548] rounded px-2 py-1.5 text-white text-xs focus:outline-none focus:border-[#f0b90b]"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] text-[#848e9c] block mb-0.5">Min Amount</label>
                                    <input
                                        type="number"
                                        step="any"
                                        value={form.min_amount}
                                        onChange={e => setForm(f => ({ ...f, min_amount: e.target.value }))}
                                        className="w-full bg-[#141822] border border-[#2b3548] rounded px-2 py-1.5 text-white text-xs focus:outline-none focus:border-[#f0b90b]"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] text-[#848e9c] block mb-0.5">Max Amount</label>
                                    <input
                                        type="number"
                                        step="any"
                                        value={form.max_amount}
                                        onChange={e => setForm(f => ({ ...f, max_amount: e.target.value }))}
                                        className="w-full bg-[#141822] border border-[#2b3548] rounded px-2 py-1.5 text-white text-xs focus:outline-none focus:border-[#f0b90b]"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] text-[#848e9c] block mb-0.5">APR (%)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={form.apr_percent}
                                        onChange={e => setForm(f => ({ ...f, apr_percent: e.target.value }))}
                                        className="w-full bg-[#141822] border border-[#2b3548] rounded px-2 py-1.5 text-white text-xs focus:outline-none focus:border-[#f0b90b]"
                                        required
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                className="bg-[#f0b90b] text-black font-bold text-xs px-4 py-1.5 rounded hover:bg-[#ffd333] cursor-pointer"
                            >
                                Create Plan
                            </button>
                        </form>
                    )}

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-[#848e9c] text-[10px] uppercase tracking-wider border-b border-[#1e2433]">
                                    <th className="text-left py-3 px-3 font-semibold">Name</th>
                                    <th className="text-right py-3 px-3 font-semibold">Min</th>
                                    <th className="text-right py-3 px-3 font-semibold">Max</th>
                                    <th className="text-right py-3 px-3 font-semibold">Days</th>
                                    <th className="text-right py-3 px-3 font-semibold">APR</th>
                                    <th className="text-center py-3 px-3 font-semibold">Status</th>
                                    <th className="text-right py-3 px-3 font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {plans.map(p => (
                                    <tr key={p.id} className="border-b border-[#1e2433]/50 hover:bg-[#1e2433]/30">
                                        <td className="py-3 px-3 text-white font-semibold text-xs">{p.name}</td>
                                        <td className="py-3 px-3 text-[#848e9c] text-xs text-right">{formatINR(p.min_amount)}</td>
                                        <td className="py-3 px-3 text-[#848e9c] text-xs text-right">{formatINR(p.max_amount)}</td>
                                        <td className="py-3 px-3 text-white text-xs text-right">{p.duration_days}</td>
                                        <td className="py-3 px-3 text-[#0ecb81] text-xs text-right">{p.apr_percent}%</td>
                                        <td className="py-3 px-3 text-center">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${p.status ? 'bg-[#1a3a3a] text-[#0ecb81]' : 'bg-[#3a1a1a] text-[#f6465d]'}`}>
                                                {p.status ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-3 text-right space-x-1">
                                            <button
                                                onClick={() => handleToggleStatus(p.id, p.status)}
                                                className="text-[10px] bg-transparent border border-[#2b3548] text-[#848e9c] px-2 py-1 rounded hover:border-[#f0b90b] hover:text-[#f0b90b] cursor-pointer"
                                            >
                                                {p.status ? 'Deactivate' : 'Activate'}
                                            </button>
                                            <button
                                                onClick={() => handleDelete(p.id)}
                                                className="text-[10px] bg-transparent border border-[#f6465d] text-[#f6465d] px-2 py-1 rounded hover:bg-[#f6465d]/10 cursor-pointer"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {tab === 'stakes' && (
                <div>
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="bg-[#141822] border border-[#1e2433] rounded-lg p-4">
                            <p className="text-[#848e9c] text-[10px] uppercase tracking-wider">Total Staked</p>
                            <p className="text-white font-bold text-lg mt-1">{formatINR(totalStaked)}</p>
                        </div>
                        <div className="bg-[#141822] border border-[#1e2433] rounded-lg p-4">
                            <p className="text-[#848e9c] text-[10px] uppercase tracking-wider">Active</p>
                            <p className="text-[#0ecb81] font-bold text-lg mt-1">{activeStakes.length}</p>
                        </div>
                        <div className="bg-[#141822] border border-[#1e2433] rounded-lg p-4">
                            <p className="text-[#848e9c] text-[10px] uppercase tracking-wider">Matured</p>
                            <p className="text-[#f0b90b] font-bold text-lg mt-1">{maturedStakes.length}</p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-[#848e9c] text-[10px] uppercase tracking-wider border-b border-[#1e2433]">
                                    <th className="text-left py-3 px-3 font-semibold">User</th>
                                    <th className="text-left py-3 px-3 font-semibold">Plan</th>
                                    <th className="text-right py-3 px-3 font-semibold">Staked</th>
                                    <th className="text-right py-3 px-3 font-semibold">Reward</th>
                                    <th className="text-right py-3 px-3 font-semibold">Start</th>
                                    <th className="text-right py-3 px-3 font-semibold">Maturity</th>
                                    <th className="text-center py-3 px-3 font-semibold">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allStakes.map(s => (
                                    <tr key={s.id} className="border-b border-[#1e2433]/50 hover:bg-[#1e2433]/30">
                                        <td className="py-3 px-3">
                                            <div className="text-white font-semibold text-xs">{s.first_name || s.user_id}</div>
                                            <div className="text-[#848e9c] text-[10px]">{s.email || ''}</div>
                                        </td>
                                        <td className="py-3 px-3 text-white text-xs">{s.plan_name}</td>
                                        <td className="py-3 px-3 text-white text-xs text-right">{formatINR(s.stake_amount)}</td>
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
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
