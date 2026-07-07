import { useState, useEffect } from 'react';
import { transferFunds } from '../../api/wallet';
import { formatAmount } from '../../utils/formatCurrency';
import toast from 'react-hot-toast';

const WALLET_TYPES = ['spot', 'funding', 'share'];

export default function TransferModal({ coin, onClose, onSuccess }) {
  const [from, setFrom] = useState('spot');
  const [to, setTo] = useState('funding');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function swap() {
    const tmp = from;
    setFrom(to);
    setTo(tmp);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) return toast.error('Enter a valid amount');
    if (from === to) return toast.error('Source and destination must differ');

    setSubmitting(true);
    try {
      const res = await transferFunds({ coin: coin.coin, from_wallet: from, to_wallet: to, amount: numAmount });
      if (res.status === 1) {
        toast.success(res.message);
        if (onSuccess) onSuccess();
      } else {
        toast.error(res.message || 'Transfer failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Transfer failed');
    } finally {
      setSubmitting(false);
    }
  }

  // Get max from the correct wallet balance
  const sourceBalance = coin ? coin[from] : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-[#161a1e] border border-[#2b2f36] rounded-lg w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2b2f36]">
          <h2 className="text-sm font-bold">Transfer {coin?.coin}</h2>
          <button onClick={onClose} className="text-[#848e9c] hover:text-white transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* From / To */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="text-[10px] text-[#848e9c] uppercase block mb-1">From</label>
              <select value={from} onChange={e => setFrom(e.target.value)}
                className="w-full bg-[#0b0e11] border border-[#2b3548] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#f0b90b]"
              >
                {WALLET_TYPES.map(w => (
                  <option key={w} value={w} disabled={w === to}>{w.charAt(0).toUpperCase() + w.slice(1)} Wallet</option>
                ))}
              </select>
              <p className="text-[10px] text-[#848e9c] mt-1">Available: {formatAmount(coin?.[from] || 0)}</p>
            </div>

            <button type="button" onClick={swap}
              className="mt-5 p-2 rounded-full bg-[#141822] border border-[#2b3548] hover:border-[#f0b90b] transition text-[#848e9c] hover:text-[#f0b90b]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </button>

            <div className="flex-1">
              <label className="text-[10px] text-[#848e9c] uppercase block mb-1">To</label>
              <select value={to} onChange={e => setTo(e.target.value)}
                className="w-full bg-[#0b0e11] border border-[#2b3548] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-[#f0b90b]"
              >
                {WALLET_TYPES.map(w => (
                  <option key={w} value={w} disabled={w === from}>{w.charAt(0).toUpperCase() + w.slice(1)} Wallet</option>
                ))}
              </select>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="text-[10px] text-[#848e9c] uppercase block mb-1">Amount</label>
            <div className="relative">
              <input type="number" step="any" value={amount} onChange={e => setAmount(e.target.value)}
                className="w-full bg-[#0b0e11] border border-[#2b3548] rounded px-3 py-2 text-xs text-white placeholder-[#848e9c] focus:outline-none focus:border-[#f0b90b]"
                placeholder="0.00"
              />
              <button type="button" onClick={() => setAmount(sourceBalance.toString())}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[#f0b90b] font-semibold hover:underline"
              >MAX</button>
            </div>
          </div>

          {/* Preview */}
          {parseFloat(amount) > 0 && from !== to && (
            <div className="bg-[#0b0e11] border border-[#2b3548] rounded p-3 text-xs space-y-1">
              <div className="flex justify-between text-[#848e9c]"><span>From</span><span>{from.charAt(0).toUpperCase() + from.slice(1)} Wallet</span></div>
              <div className="flex justify-between text-[#848e9c]"><span>To</span><span>{to.charAt(0).toUpperCase() + to.slice(1)} Wallet</span></div>
              <div className="flex justify-between text-[#848e9c]"><span>Amount</span><span className="text-white">{formatAmount(parseFloat(amount))} {coin?.coin}</span></div>
            </div>
          )}

          <button type="submit" disabled={submitting || from === to}
            className="w-full py-2.5 bg-[#f0b90b] text-black text-xs font-bold rounded hover:bg-[#f0b90b]/90 transition disabled:opacity-50"
          >
            {submitting ? 'Transferring...' : 'Confirm Transfer'}
          </button>
        </form>
      </div>
    </div>
  );
}
