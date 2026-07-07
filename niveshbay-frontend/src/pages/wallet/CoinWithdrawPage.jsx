import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCoinNetworks } from '../../hooks/useCoinNetworks';
import { useWithdrawals } from '../../hooks/useWithdrawals';
import { initiateWithdraw, confirmWithdraw } from '../../api/wallet';
import { formatAmount } from '../../utils/formatCurrency';
import Navbar from '../../components/layout/Navbar';
import { useAuth } from '../../context/AuthContext';
import { useBalanceStats } from '../../hooks/useBalanceStats';
import toast from 'react-hot-toast';

export default function CoinWithdrawPage() {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { stats } = useBalanceStats();
  const { coin, networks, spot, loading: coinLoading } = useCoinNetworks(symbol);
  const { withdrawals, refresh: refreshWithdrawals } = useWithdrawals(symbol);

  const [selectedNetwork, setSelectedNetwork] = useState(networks[0]?.network_name || '');
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState('form'); // form | otp | done
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [txnId, setTxnId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const network = networks.find(n => n.network_name === selectedNetwork);
  const fee = network ? parseFloat(network.withdraw_fee) : 0;
  const minW = network ? parseFloat(network.min_withdraw) : 0;
  const maxW = network ? parseFloat(network.max_withdraw) : 0;
  const numAmount = parseFloat(amount) || 0;
  const netAmount = Math.max(0, numAmount - fee);

  async function handleInitiate(e) {
    e.preventDefault();
    if (!address.trim()) return toast.error('Enter a withdrawal address');
    if (numAmount <= 0) return toast.error('Enter a valid amount');
    if (minW > 0 && numAmount < minW) return toast.error(`Minimum withdrawal: ${minW} ${symbol}`);
    if (maxW > 0 && numAmount > maxW) return toast.error(`Maximum withdrawal: ${maxW} ${symbol}`);
    if (!selectedNetwork) return toast.error('Select a network');

    setSubmitting(true);
    try {
      const res = await initiateWithdraw({ coin: symbol, network: selectedNetwork, address, amount: numAmount });
      if (res.status === 1) {
        setStep('otp');
        setEmail(user?.email || '');
        toast.success('OTP sent to your email');
      } else {
        toast.error(res.message || 'Initiation failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initiate withdrawal');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirm(e) {
    e.preventDefault();
    if (otp.length !== 6) return toast.error('Enter 6-digit OTP');
    if (!email) return toast.error('Email is required');

    setSubmitting(true);
    try {
      const res = await confirmWithdraw({
        coin: symbol, network: selectedNetwork, address, amount: numAmount, otp, email
      });
      if (res.status === 1) {
        setTxnId(res.txn_id);
        setStep('done');
        refreshWithdrawals();
        toast.success('Withdrawal submitted!');
      } else {
        toast.error(res.message || 'Confirmation failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to confirm withdrawal');
    } finally {
      setSubmitting(false);
    }
  }

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
        <div className="flex items-center gap-2 text-xs text-[#848e9c] mb-4">
          <Link to="/wallet" className="hover:text-white transition">Wallet</Link>
          <span>/</span>
          <span className="text-white">Withdraw {symbol}</span>
        </div>

        {step === 'form' && (
          <div className="bg-[#161a1e] border border-[#2b2f36] rounded-lg p-6">
            <h2 className="text-lg font-bold mb-4">Withdraw {symbol}</h2>
            <p className="text-xs text-[#848e9c] mb-6">Available: <span className="text-white font-semibold">{formatAmount(spot)} {symbol}</span></p>

            <form onSubmit={handleInitiate}>
              {/* Network */}
              {networks.length > 0 && (
                <div className="mb-4">
                  <label className="text-xs text-[#848e9c] block mb-2">Network</label>
                  <select value={selectedNetwork} onChange={e => setSelectedNetwork(e.target.value)}
                    className="w-full bg-[#0b0e11] border border-[#2b3548] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#f0b90b]"
                  >
                    {networks.map(n => <option key={n.network_name} value={n.network_name}>{n.network_name}</option>)}
                  </select>
                </div>
              )}

              {/* Address */}
              <div className="mb-4">
                <label className="text-xs text-[#848e9c] block mb-2">Withdrawal Address</label>
                <input type="text" value={address} onChange={e => setAddress(e.target.value)}
                  className="w-full bg-[#0b0e11] border border-[#2b3548] rounded px-3 py-2 text-xs text-white placeholder-[#848e9c] focus:outline-none focus:border-[#f0b90b]"
                  placeholder="Enter the recipient address"
                />
              </div>

              {/* Amount */}
              <div className="mb-4">
                <label className="text-xs text-[#848e9c] block mb-2">Amount</label>
                <div className="relative">
                  <input type="number" step="any" value={amount} onChange={e => setAmount(e.target.value)}
                    className="w-full bg-[#0b0e11] border border-[#2b3548] rounded px-3 py-2 text-xs text-white placeholder-[#848e9c] focus:outline-none focus:border-[#f0b90b]"
                    placeholder="0.00"
                  />
                  <button type="button" onClick={() => setAmount(spot > fee ? (spot - fee).toString() : '0')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[#f0b90b] font-semibold hover:underline"
                  >MAX</button>
                </div>
              </div>

              {/* Fee Preview */}
              {numAmount > 0 && (
                <div className="bg-[#0b0e11] border border-[#2b3548] rounded p-3 text-xs mb-4 space-y-1">
                  <div className="flex justify-between text-[#848e9c]"><span>Fee</span><span>{formatAmount(fee)} {symbol}</span></div>
                  <div className="flex justify-between text-[#848e9c]"><span>You will receive</span><span className="text-white">{formatAmount(netAmount)} {symbol}</span></div>
                </div>
              )}

              <button type="submit" disabled={submitting}
                className="w-full py-2.5 bg-[#f6465d] text-white text-xs font-bold rounded hover:bg-[#f6465d]/90 transition disabled:opacity-50"
              >
                {submitting ? 'Processing...' : 'Withdraw'}
              </button>
            </form>
          </div>
        )}

        {step === 'otp' && (
          <div className="bg-[#161a1e] border border-[#2b2f36] rounded-lg p-6 max-w-md mx-auto">
            <h2 className="text-lg font-bold mb-4">Confirm Withdrawal</h2>
            <p className="text-xs text-[#848e9c] mb-4">Enter the OTP sent to your email to confirm this withdrawal.</p>
            <form onSubmit={handleConfirm}>
              <div className="mb-4">
                <label className="text-xs text-[#848e9c] block mb-2">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full bg-[#0b0e11] border border-[#2b3548] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#f0b90b]"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="text-xs text-[#848e9c] block mb-2">OTP</label>
                <input type="text" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full bg-[#0b0e11] border border-[#2b3548] rounded px-3 py-2 text-xs text-white text-center tracking-[8px] font-mono focus:outline-none focus:border-[#f0b90b]"
                  placeholder="000000"
                  maxLength={6}
                />
              </div>
              <button type="submit" disabled={submitting}
                className="w-full py-2.5 bg-[#f6465d] text-white text-xs font-bold rounded hover:bg-[#f6465d]/90 transition disabled:opacity-50"
              >
                {submitting ? 'Confirming...' : 'Confirm Withdrawal'}
              </button>
              <button type="button" onClick={() => setStep('form')}
                className="w-full py-2 mt-2 text-xs text-[#848e9c] hover:text-white transition"
              >
                Back
              </button>
            </form>
          </div>
        )}

        {step === 'done' && (
          <div className="bg-[#161a1e] border border-[#2b2f36] rounded-lg p-6 text-center">
            <div className="w-12 h-12 bg-[#0ecb81]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-[#0ecb81]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-lg font-bold mb-2">Withdrawal Submitted</h2>
            <p className="text-xs text-[#848e9c] mb-1">Transaction ID: <span className="text-[#f0b90b]">{txnId}</span></p>
            <p className="text-xs text-[#848e9c] mb-6">Pending admin approval.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => navigate('/wallet')} className="px-4 py-2 bg-[#141822] border border-[#2b3548] text-xs text-white rounded hover:bg-[#1e2433] transition">Back to Wallet</button>
              <button onClick={() => navigate('/wallet/history')} className="px-4 py-2 bg-[#f0b90b] text-black text-xs font-bold rounded hover:bg-[#f0b90b]/90 transition">View History</button>
            </div>
          </div>
        )}

        {/* Recent Withdrawals */}
        <div className="bg-[#161a1e] border border-[#2b2f36] rounded-lg p-6 mt-6">
          <h3 className="text-sm font-bold mb-4">Recent Withdrawals</h3>
          {withdrawals.length === 0 ? (
            <p className="text-[#848e9c] text-xs">No recent withdrawals.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2b2f36] text-[#848e9c] text-xs uppercase">
                  <th className="text-left px-3 py-2 font-medium">Address</th>
                  <th className="text-right px-3 py-2 font-medium">Amount</th>
                  <th className="text-right px-3 py-2 font-medium">Fee</th>
                  <th className="text-right px-3 py-2 font-medium">Status</th>
                  <th className="text-right px-3 py-2 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map(w => (
                  <tr key={w.id} className="border-b border-[#1e2433]">
                    <td className="px-3 py-2 text-xs text-[#848e9c] font-mono truncate max-w-[150px]">{w.address}</td>
                    <td className="px-3 py-2 text-xs text-right">{formatAmount(w.amount)}</td>
                    <td className="px-3 py-2 text-xs text-right text-[#f6465d]">{formatAmount(w.charge)}</td>
                    <td className="px-3 py-2 text-xs text-right">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        w.status === 'completed' ? 'bg-[#0ecb81]/10 text-[#0ecb81]' :
                        w.status === 'rejected' ? 'bg-[#f6465d]/10 text-[#f6465d]' :
                        'bg-[#f0b90b]/10 text-[#f0b90b]'
                      }`}>{w.status}</span>
                    </td>
                    <td className="px-3 py-2 text-xs text-right text-[#848e9c]">{new Date(w.date).toLocaleString()}</td>
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
