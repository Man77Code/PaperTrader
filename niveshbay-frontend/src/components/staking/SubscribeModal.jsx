import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/axiosInstance';
import { formatINR } from '../../utils/formatCurrency';

export default function SubscribeModal({ plan, onClose, onSuccess }) {
    const [amount, setAmount] = useState(parseFloat(plan.min_amount));
    const [loading, setLoading] = useState(false);

    const reward = amount * (plan.apr_percent / 100) * plan.duration_days / 365;

    async function handleSubmit(e) {
        e.preventDefault();
        if (amount < parseFloat(plan.min_amount) || amount > parseFloat(plan.max_amount)) {
            toast.error(`Amount must be between ${formatINR(plan.min_amount)} and ${formatINR(plan.max_amount)}`);
            return;
        }
        setLoading(true);
        try {
            const res = await api.post('/api/v1/staking/subscribe', {
                plan_id: plan.id,
                stake_amount: amount
            });
            if (res.data.status === 1) {
                toast.success('Staking subscription successful!');
                onSuccess();
                onClose();
            } else {
                toast.error(res.data.message || 'Subscription failed.');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Something went wrong.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
            <div className="bg-[#141822] border border-[#1e2433] rounded-lg p-6 w-[400px] max-w-[90vw]" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-white font-bold text-lg">{plan.name}</h2>
                    <button onClick={onClose} className="text-[#848e9c] hover:text-white text-xl cursor-pointer">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-[#848e9c] text-xs block mb-1">Stake Amount (INR)</label>
                        <input
                            type="number"
                            step="any"
                            value={amount}
                            onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                            min={plan.min_amount}
                            max={plan.max_amount}
                            className="w-full bg-[#0b0e11] border border-[#2b3548] rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-[#f0b90b]"
                        />
                        <div className="flex justify-between text-[10px] text-[#848e9c] mt-1">
                            <span>Min: {formatINR(plan.min_amount)}</span>
                            <span>Max: {formatINR(plan.max_amount)}</span>
                        </div>
                    </div>
                    <div className="bg-[#0b0e11] rounded p-3 space-y-1.5 text-xs">
                        <div className="flex justify-between">
                            <span className="text-[#848e9c]">APR</span>
                            <span className="text-[#0ecb81] font-semibold">{plan.apr_percent}%</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-[#848e9c]">Duration</span>
                            <span className="text-white font-semibold">{plan.duration_days} days</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-[#848e9c]">Est. Reward</span>
                            <span className="text-[#f0b90b] font-semibold">{formatINR(reward)}</span>
                        </div>
                        <div className="flex justify-between border-t border-[#1e2433] pt-1.5">
                            <span className="text-[#848e9c] font-semibold">Total at Maturity</span>
                            <span className="text-white font-bold">{formatINR(amount + reward)}</span>
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 bg-[#f0b90b] text-black font-bold text-sm rounded hover:bg-[#ffd333] transition disabled:opacity-50 cursor-pointer"
                    >
                        {loading ? 'Processing...' : 'Confirm Stake'}
                    </button>
                </form>
            </div>
        </div>
    );
}
