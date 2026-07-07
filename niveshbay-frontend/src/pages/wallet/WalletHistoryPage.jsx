import { useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useWalletHistory } from '../../hooks/useWalletHistory';
import { useBalanceStats } from '../../hooks/useBalanceStats';
import { formatAmount } from '../../utils/formatCurrency';
import Navbar from '../../components/layout/Navbar';

const TABS = [
  { key: 'all', label: 'Overview' },
  { key: 'deposit', label: 'Deposit' },
  { key: 'withdraw', label: 'Withdraw' },
  { key: 'transfer', label: 'Transfer' },
  { key: 'staking', label: 'Staking' },
  { key: 'trade', label: 'Trade' },
  { key: 'referral', label: 'Distribution' },
  { key: 'others', label: 'Others' },
];

export default function WalletHistoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { stats } = useBalanceStats();
  const activeTab = searchParams.get('type') || 'all';
  const assetFilter = searchParams.get('asset') || '';

  const [localAsset, setLocalAsset] = useState(assetFilter);
  const [from, setFrom] = useState(searchParams.get('from') || '');
  const [to, setTo] = useState(searchParams.get('to') || '');
  const [page, setPage] = useState(0);
  const limit = 30;

  const { history, total, loading, error, refresh } = useWalletHistory({
    type: activeTab === 'all' ? undefined : activeTab,
    asset: assetFilter || undefined,
    from: from || undefined,
    to: to || undefined,
    limit,
    offset: page * limit,
  });

  const totalPages = Math.ceil(total / limit);

  const handleTabChange = (tabKey) => {
    setSearchParams({ type: tabKey });
    setPage(0);
  };

  const applyFilter = () => {
    const params = { type: activeTab };
    if (localAsset) params.asset = localAsset;
    if (from) params.from = from;
    if (to) params.to = to;
    setSearchParams(params);
    setPage(0);
  };

  const resetFilter = () => {
    setLocalAsset('');
    setFrom('');
    setTo('');
    setSearchParams({ type: 'all' });
    setPage(0);
  };

  const txColor = (type) => {
    if (['DEPOSIT', 'ADMIN_BONUS', 'TRADE_BUY', 'PRICE_IMPROVEMENT_REFUND', 'STAKING_MATURITY', 'WITHDRAW_REJECTED_REFUND', 'STAKING_UNSTAKE'].includes(type)) return 'text-[#0ecb81]';
    if (type.startsWith('TRANSFER_')) return 'text-[#f0b90b]';
    return 'text-[#f6465d]';
  };

  const txPrefix = (type) => {
    if (['DEPOSIT', 'ADMIN_BONUS', 'STAKING_MATURITY', 'WITHDRAW_REJECTED_REFUND', 'STAKING_UNSTAKE'].includes(type)) return '+';
    if (['WITHDRAW_REQUEST', 'ORDER_PLACE_BUY', 'ORDER_PLACE_SELL', 'STAKING_SUBSCRIBE'].includes(type)) return '-';
    if (type.startsWith('TRANSFER_')) return '↔';
    return '';
  };

  const inrBal = stats?.inr_balance || 0;
  const totalPortfolio = stats?.total_portfolio_value || 0;
  const realizedPnl = stats?.realized_pnl || 0;

  return (
    <div className="min-h-screen bg-[#0b0e11] text-white">
      <Navbar balance={inrBal} portfolioValue={totalPortfolio} realizedPnl={realizedPnl} />
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-[#848e9c] mb-4">
          <Link to="/wallet" className="hover:text-white transition">Wallet</Link>
          <span>/</span>
          <span className="text-white">History</span>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-6 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`px-4 py-2 text-xs font-semibold rounded transition whitespace-nowrap ${
                activeTab === tab.key ? 'bg-[#f0b90b] text-black' : 'text-[#848e9c] hover:text-white hover:bg-[#1e2433]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filter Row */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <input type="text" value={localAsset} onChange={e => setLocalAsset(e.target.value.toUpperCase())}
            placeholder="Asset" className="bg-[#141822] border border-[#2b3548] rounded px-3 py-1.5 text-xs text-white placeholder-[#848e9c] focus:outline-none focus:border-[#f0b90b] w-24"
          />
          <input type="date" value={from} onChange={e => setFrom(e.target.value)}
            className="bg-[#141822] border border-[#2b3548] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#f0b90b]"
          />
          <input type="date" value={to} onChange={e => setTo(e.target.value)}
            className="bg-[#141822] border border-[#2b3548] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#f0b90b]"
          />
          <button onClick={applyFilter} className="px-3 py-1.5 bg-[#141822] border border-[#2b3548] text-xs text-[#f0b90b] rounded hover:bg-[#1e2433] transition">Apply</button>
          <button onClick={resetFilter} className="px-3 py-1.5 text-xs text-[#848e9c] hover:text-white transition">Reset</button>
        </div>

        {/* Table */}
        <div className="bg-[#161a1e] border border-[#2b2f36] rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2b2f36] text-[#848e9c] text-xs uppercase">
                <th className="text-left px-4 py-3 font-medium">Type</th>
                <th className="text-right px-4 py-3 font-medium">Amount</th>
                <th className="text-right px-4 py-3 font-medium">Fee</th>
                <th className="text-left px-4 py-3 font-medium">Asset</th>
                <th className="text-right px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="text-center py-8"><div className="animate-spin w-6 h-6 border-2 border-[#f0b90b] border-t-transparent rounded-full mx-auto" /></td></tr>
              ) : history.length === 0 ? (
                <tr><td colSpan="5" className="text-center text-[#848e9c] text-xs py-8">
                  {activeTab === 'referral' ? 'No distribution records yet.' : 'No transaction history found.'}
                </td></tr>
              ) : history.map(h => (
                <tr key={h.log_id} className="border-b border-[#1e2433] hover:bg-[#1e2433]/50 transition">
                  <td className="px-4 py-3 text-xs text-[#848e9c]">{h.transaction_type}</td>
                  <td className={`px-4 py-3 text-xs text-right font-semibold ${txColor(h.transaction_type)}`}>
                    {txPrefix(h.transaction_type)}{formatAmount(h.transaction_amount)}
                  </td>
                  <td className="px-4 py-3 text-xs text-right text-[#848e9c]">
                    {parseFloat(h.transaction_fees || 0) > 0 ? formatAmount(h.transaction_fees) : '-'}
                  </td>
                  <td className="px-4 py-3 text-xs text-white">{h.currency_symbol}</td>
                  <td className="px-4 py-3 text-xs text-right text-[#848e9c]">{new Date(h.date).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              className="px-3 py-1.5 text-xs bg-[#141822] border border-[#2b3548] rounded text-[#848e9c] hover:text-white disabled:opacity-40 transition"
            >Previous</button>
            <span className="text-xs text-[#848e9c]">Page {page + 1} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
              className="px-3 py-1.5 text-xs bg-[#141822] border border-[#2b3548] rounded text-[#848e9c] hover:text-white disabled:opacity-40 transition"
            >Next</button>
          </div>
        )}
      </div>
    </div>
  );
}
