import { formatINR } from '../../utils/formatCurrency';

export default function StakingPlanCard({ plan, subscribed, onSubscribe }) {
    return (
        <div className="bg-[#141822] border border-[#1e2433] rounded-lg p-5 hover:border-[#ffd333]/40 transition flex flex-col">
            <div className="flex items-start justify-between mb-3">
                <div>
                    <h3 className="text-white font-bold text-base">{plan.name}</h3>
                    <p className="text-[#848e9c] text-xs mt-0.5">{plan.duration_days} day lock-in</p>
                </div>
                <div className="text-right">
                    <span className="text-[#0ecb81] font-bold text-xl">{plan.apr_percent}%</span>
                    <p className="text-[#848e9c] text-[10px] uppercase tracking-wider">APR</p>
                </div>
            </div>
            <div className="border-t border-[#1e2433] pt-3 mb-4 space-y-1.5">
                <div className="flex justify-between text-xs">
                    <span className="text-[#848e9c]">Min. Stake</span>
                    <span className="text-white font-semibold">{formatINR(plan.min_amount)}</span>
                </div>
                <div className="flex justify-between text-xs">
                    <span className="text-[#848e9c]">Max. Stake</span>
                    <span className="text-white font-semibold">{formatINR(plan.max_amount)}</span>
                </div>
                <div className="flex justify-between text-xs">
                    <span className="text-[#848e9c]">Est. Reward</span>
                    <span className="text-[#f0b90b] font-semibold">
                        {formatINR(plan.min_amount * (plan.apr_percent / 100) * plan.duration_days / 365)} - {formatINR(plan.max_amount * (plan.apr_percent / 100) * plan.duration_days / 365)}
                    </span>
                </div>
            </div>
            {subscribed ? (
                <div className="mt-auto w-full py-2 bg-[#1e2433] text-[#848e9c] font-bold text-sm rounded text-center">
                    Subscribed
                </div>
            ) : (
                <button
                    onClick={() => onSubscribe(plan)}
                    className="mt-auto w-full py-2 bg-[#f0b90b] text-black font-bold text-sm rounded hover:bg-[#ffd333] transition cursor-pointer"
                >
                    Subscribe
                </button>
            )}
        </div>
    );
}
