import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCoinNetworks } from '../../hooks/useCoinNetworks';
import { useDepositAddress } from '../../hooks/useDepositAddress';
import { useWalletHistory } from '../../hooks/useWalletHistory';
import { useBalanceStats } from '../../hooks/useBalanceStats';
import { formatAmount } from '../../utils/formatCurrency';
import Navbar from '../../components/layout/Navbar';
import toast from 'react-hot-toast';

export default function CoinDepositPage() {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const { stats } = useBalanceStats();
  const [selectedNetwork, setSelectedNetwork] = useState('');
  const { coin, networks, loading: coinLoading } = useCoinNetworks(symbol);
  const { address, loading: addrLoading } = useDepositAddress(symbol, selectedNetwork);
  const { history: deposits, loading: depLoading } = useWalletHistory({ type: 'deposit', asset: symbol, limit: 10 });

  const inrBal = stats?.inr_balance || 0;
  const totalPortfolio = stats?.total_portfolio_value || 0;
  const realizedPnl = stats?.realized_pnl || 0;

  if (coinLoading) {
    return (
      <div className="min-h-screen bg-[#0b0e11]">
        <Navbar balance={inrBal} portfolioValue={totalPortfolio} realizedPnl={realizedPnl} />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="animate-spin w-8 h-8 border-2 border-[#f0b90b] border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0e11] text-white">
      <Navbar balance={inrBal} portfolioValue={totalPortfolio} realizedPnl={realizedPnl} />
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-[#848e9c] mb-4">
          <Link to="/wallet" className="hover:text-white transition">Wallet</Link>
          <span>/</span>
          <span className="text-white">{symbol} Deposit</span>
        </div>

        <div className="bg-[#161a1e] border border-[#2b2f36] rounded-lg p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">Deposit {symbol}</h2>

          {/* Select Network */}
          {networks.length > 0 && (
            <div className="mb-6">
              <label className="text-xs text-[#848e9c] block mb-2">Select Network</label>
              <div className="flex gap-2 flex-wrap">
                {networks.map(n => (
                  <button
                    key={n.network_name}
                    onClick={() => setSelectedNetwork(n.network_name)}
                    className={`px-4 py-2 text-xs rounded border transition ${selectedNetwork === n.network_name ? 'bg-[#f0b90b] text-black border-[#f0b90b]' : 'bg-[#141822] text-[#848e9c] border-[#2b3548] hover:text-white'}`}
                  >
                    {n.network_name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Deposit Address */}
          <div className="mb-6">
            <label className="text-xs text-[#848e9c] block mb-2">Deposit Address</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-[#0b0e11] border border-[#2b3548] rounded px-3 py-2 text-xs text-[#0ecb81] font-mono truncate">
                {addrLoading ? 'Loading...' : address || 'No address generated yet.'}
              </div>
              {address && (
                <button
                  onClick={() => { navigator.clipboard.writeText(address); toast.success('Address copied!'); }}
                  className="px-3 py-2 bg-[#141822] border border-[#2b3548] rounded text-xs text-[#f0b90b] hover:bg-[#1e2433] transition"
                >
                  Copy
                </button>
              )}
            </div>
          </div>

          {/* Info Rows */}
          <div className="grid grid-cols-2 gap-4 text-xs mb-6">
            <div>
              <span className="text-[#848e9c]">Min. Deposit</span>
              <p className="text-white font-semibold mt-0.5">{networks[0] ? formatAmount(networks[0].min_deposit) : '0'} {symbol}</p>
            </div>
            <div>
              <span className="text-[#848e9c]">Confirmations Required</span>
              <p className="text-white font-semibold mt-0.5">{networks[0]?.confirmations_required || 'N/A'}</p>
            </div>
            <div>
              <span className="text-[#848e9c]">Wallet Credited</span>
              <p className="text-[#0ecb81] font-semibold mt-0.5">Spot Wallet</p>
            </div>
          </div>

          <div className="bg-[#0b0e11] border border-[#2b3548] rounded p-3 text-xs text-[#848e9c]">
            Only send {symbol} to this address. Sending any other coin may result in permanent loss.
          </div>
        </div>

        {/* Recent Deposits */}
        <div className="bg-[#161a1e] border border-[#2b2f36] rounded-lg p-6">
          <h3 className="text-sm font-bold mb-4">Recent Deposits</h3>
          {deposits.length === 0 ? (
            <p className="text-[#848e9c] text-xs">No recent deposits.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2b2f36] text-[#848e9c] text-xs uppercase">
                  <th className="text-left px-3 py-2 font-medium">Amount</th>
                  <th className="text-left px-3 py-2 font-medium">Type</th>
                  <th className="text-right px-3 py-2 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {deposits.map(d => (
                  <tr key={d.log_id} className="border-b border-[#1e2433]">
                    <td className="px-3 py-2 text-xs text-[#0ecb81]">+{formatAmount(d.transaction_amount)}</td>
                    <td className="px-3 py-2 text-xs text-[#848e9c]">{d.transaction_type}</td>
                    <td className="px-3 py-2 text-xs text-right text-[#848e9c]">{new Date(d.date).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
