import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAdminWithdrawals } from '../hooks/useAdminWithdrawals';
import api from '../api/axiosInstance';
import toast from 'react-hot-toast';

export default function AdminWithdrawalsPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [tab, setTab] = useState('pending');
  const { withdrawals, loading, refresh } = useAdminWithdrawals(tab);
  const [actionId, setActionId] = useState(null);

  async function handleApprove(id) {
    setActionId(id);
    try {
      await api.patch(`/api/v1/admin/withdrawal/${id}/approve`);
      toast.success('Withdrawal approved.');
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve.');
    }
    setActionId(null);
  }

  async function handleReject(id) {
    if (!window.confirm('Reject this withdrawal? Amount will be refunded to user.')) return;
    setActionId(id);
    try {
      await api.patch(`/api/v1/admin/withdrawal/${id}/reject`);
      toast.success('Withdrawal rejected and refunded.');
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject.');
    }
    setActionId(null);
  }

  const tabs = [
    { key: 'pending', label: 'Pending' },
    { key: 'completed', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
  ];

  function statusBadge(status) {
    if (status === 'pending') return 'bg-[#3a2e1a] text-[#f0b90b]';
    if (status === 'completed') return 'bg-[#1a3a3a] text-[#0ecb81]';
    return 'bg-[#3a1a1a] text-[#f6465d]';
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0e11] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[#f0b90b] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0e11] text-white">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Admin - Withdrawals</h1>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/admin/staking')}
              className="bg-transparent border border-[#2b3548] text-[#848e9c] text-xs px-3 py-1.5 rounded hover:text-white hover:border-[#f0b90b] transition"
            >
              Staking
            </button>
            <button
              onClick={() => { logout(); navigate('/admin/login'); }}
              className="bg-transparent border border-[#f6465d] text-[#f6465d] text-xs px-3 py-1.5 rounded hover:bg-[#f6465d]/10 transition"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-[#0b0e11] rounded-lg p-1 mb-6 border border-[#1e2433] w-fit">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`text-xs font-semibold px-4 py-1.5 rounded transition ${
                tab === t.key
                  ? 'bg-[#f0b90b] text-black'
                  : 'text-[#848e9c] hover:text-white'
              }`}
            >
              {t.label} {t.key === 'pending' && withdrawals.length > 0 && `(${withdrawals.length})`}
            </button>
          ))}
        </div>

        {/* Refresh */}
        <button
          onClick={refresh}
          className="text-xs text-[#848e9c] hover:text-[#f0b90b] mb-4 inline-block transition"
        >
          ↻ Refresh
        </button>

        {/* Table */}
        {withdrawals.length === 0 ? (
          <div className="bg-[#141822] border border-[#1e2433] rounded-lg p-8 text-center">
            <p className="text-[#848e9c] text-sm">No {tab} withdrawals.</p>
          </div>
        ) : (
          <div className="overflow-x-auto bg-[#141822] border border-[#1e2433] rounded-lg">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1e2433] text-[#848e9c] text-[10px] uppercase tracking-wider">
                  <th className="text-left py-3 px-3 font-medium">ID</th>
                  <th className="text-left py-3 px-3 font-medium">User</th>
                  <th className="text-left py-3 px-3 font-medium">Email</th>
                  <th className="text-left py-3 px-3 font-medium">Coin</th>
                  <th className="text-right py-3 px-3 font-medium">Amount</th>
                  <th className="text-right py-3 px-3 font-medium">Fee</th>
                  <th className="text-right py-3 px-3 font-medium">Net</th>
                  <th className="text-left py-3 px-3 font-medium">Address</th>
                  <th className="text-left py-3 px-3 font-medium">Txn ID</th>
                  <th className="text-left py-3 px-3 font-medium">Status</th>
                  <th className="text-left py-3 px-3 font-medium">Date</th>
                  {tab === 'pending' && <th className="text-center py-3 px-3 font-medium">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {withdrawals.map(w => (
                  <tr key={w.id} className="border-b border-[#1e2433]/50 hover:bg-[#1e2433]/30">
                    <td className="py-3 px-3 text-xs text-[#848e9c]">{w.id}</td>
                    <td className="py-3 px-3 text-xs">{w.first_name} {w.last_name}</td>
                    <td className="py-3 px-3 text-xs text-[#848e9c]">{w.email}</td>
                    <td className="py-3 px-3 text-xs font-semibold">{w.currency}</td>
                    <td className="py-3 px-3 text-xs text-right">{parseFloat(w.amount).toFixed(4)}</td>
                    <td className="py-3 px-3 text-xs text-right text-[#f6465d]">{parseFloat(w.charge).toFixed(4)}</td>
                    <td className="py-3 px-3 text-xs text-right text-[#0ecb81]">{parseFloat(w.net_amount).toFixed(4)}</td>
                    <td className="py-3 px-3 text-xs text-[#848e9c] max-w-[120px] truncate font-mono" title={w.address}>{w.address}</td>
                    <td className="py-3 px-3 text-xs text-[#848e9c] font-mono">{w.txn_id}</td>
                    <td className="py-3 px-3 text-xs">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${statusBadge(w.status)}`}>
                        {w.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-xs text-[#848e9c] whitespace-nowrap">
                      {new Date(w.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    {tab === 'pending' && (
                      <td className="py-3 px-3 text-center">
                        <div className="flex gap-1.5 justify-center">
                          <button
                            onClick={() => handleApprove(w.id)}
                            disabled={actionId === w.id}
                            className="text-[10px] bg-transparent border border-[#0ecb81] text-[#0ecb81] px-2 py-1 rounded hover:bg-[#0ecb81]/10 disabled:opacity-40 transition min-w-[60px]"
                          >
                            {actionId === w.id ? '...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => handleReject(w.id)}
                            disabled={actionId === w.id}
                            className="text-[10px] bg-transparent border border-[#f6465d] text-[#f6465d] px-2 py-1 rounded hover:bg-[#f6465d]/10 disabled:opacity-40 transition min-w-[60px]"
                          >
                            {actionId === w.id ? '...' : 'Reject'}
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-[#848e9c] text-[10px] mt-4">
          Showing {withdrawals.length} withdrawal(s). Auto-refreshes every 10s.
        </p>
      </div>
    </div>
  );
}
