import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  Users,
  CreditCard,
  ShoppingBag,
  Settings,
  Activity,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  AlertTriangle,
  RefreshCw,
  Edit3,
  Lock,
  Unlock,
  KeyRound,
  DollarSign,
  Store,
  ExternalLink,
  MessageSquare,
  QrCode,
  FileText,
  Copy,
  ChevronDown,
  Filter,
  Check,
  AlertCircle,
  Eye,
  Trash2,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  Deposit,
  Order,
  AdminLog,
  StoreSettings,
  AdminOverviewStats,
  AdminUserItem,
} from '../types';

type AdminTab = 'deposits' | 'users' | 'orders' | 'settings' | 'logs';

export const AdminView: React.FC = () => {
  const { token, refreshSettings } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('deposits');
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Overview Stats
  const [stats, setStats] = useState<AdminOverviewStats | null>(null);

  // Deposits State
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [depositFilter, setDepositFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [depositSearch, setDepositSearch] = useState('');
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [selectedDepositForApprove, setSelectedDepositForApprove] = useState<Deposit | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedDepositForReject, setSelectedDepositForReject] = useState<Deposit | null>(null);
  const [rejectReason, setRejectReason] = useState('Bukti transfer tidak valid atau dana belum masuk');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Users State
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState<'ALL' | 'ACTIVE' | 'BLOCKED'>('ALL');
  // User Balance Adjust Modal
  const [balanceModalOpen, setBalanceModalOpen] = useState(false);
  const [selectedUserForBalance, setSelectedUserForBalance] = useState<AdminUserItem | null>(null);
  const [balanceAdjustType, setBalanceAdjustType] = useState<'add' | 'deduct'>('add');
  const [balanceAdjustAmount, setBalanceAdjustAmount] = useState<number>(10000);
  const [balanceAdjustReason, setBalanceAdjustReason] = useState('Penambahan saldo manual oleh admin');

  // User Reset Password Modal
  const [resetPassModalOpen, setResetPassModalOpen] = useState(false);
  const [selectedUserForPass, setSelectedUserForPass] = useState<AdminUserItem | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');

  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderStatusFilter, setOrderStatusFilter] = useState<'ALL' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'REFUNDED'>('ALL');
  const [orderProductFilter, setOrderProductFilter] = useState<'ALL' | 'AM_ECERAN' | 'AM_BULK'>('ALL');
  const [orderSearch, setOrderSearch] = useState('');

  // Settings State
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);

  // Logs State
  const [logs, setLogs] = useState<AdminLog[]>([]);

  // Show Toast
  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token || localStorage.getItem('azryl_token') || ''}`,
  };

  // Fetch Admin Stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/stats', { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats || data.overview);
      }
    } catch (err) {
      console.error('Error fetching admin stats:', err);
    }
  }, [token]);

  // Fetch Deposits
  const fetchDeposits = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (depositFilter !== 'ALL') params.set('status', depositFilter);
      if (depositSearch.trim()) params.set('search', depositSearch.trim());

      const res = await fetch(`/api/admin/deposits?${params.toString()}`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setDeposits(data.deposits || []);
      }
    } catch (err) {
      console.error('Error fetching deposits:', err);
    } finally {
      setIsLoading(false);
    }
  }, [depositFilter, depositSearch, token]);

  // Fetch Users
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (userSearch.trim()) params.set('search', userSearch.trim());

      const res = await fetch(`/api/admin/users?${params.toString()}`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userSearch, token]);

  // Fetch Orders
  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (orderStatusFilter !== 'ALL') params.set('status', orderStatusFilter);
      if (orderProductFilter !== 'ALL') params.set('product', orderProductFilter);
      if (orderSearch.trim()) params.set('search', orderSearch.trim());

      const res = await fetch(`/api/admin/orders?${params.toString()}`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setIsLoading(false);
    }
  }, [orderStatusFilter, orderProductFilter, orderSearch, token]);

  // Fetch Settings
  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/settings', { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setStoreSettings(data.settings);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  }, [token]);

  // Fetch Logs
  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/logs', { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
    }
  }, [token]);

  // Initial Load and Tab change
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (activeTab === 'deposits') {
      fetchDeposits();
    } else if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'orders') {
      fetchOrders();
    } else if (activeTab === 'settings') {
      fetchSettings();
    } else if (activeTab === 'logs') {
      fetchLogs();
    }
  }, [activeTab, fetchDeposits, fetchUsers, fetchOrders, fetchSettings, fetchLogs]);

  // Handle Approve Deposit Modal Open
  const handleOpenApproveModal = (dep: Deposit) => {
    setSelectedDepositForApprove(dep);
    setApproveModalOpen(true);
  };

  // Handle Approve Deposit Submit
  const handleApproveDepositSubmit = async () => {
    if (!selectedDepositForApprove) return;
    const dep = selectedDepositForApprove;
    setActionLoadingId(dep.id);
    try {
      const res = await fetch(`/api/admin/deposits/${dep.id}/approve`, {
        method: 'POST',
        headers: authHeaders,
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || `Deposit ${dep.id} berhasil disetujui! Saldo user telah bertambah.`);
        setApproveModalOpen(false);
        setSelectedDepositForApprove(null);
        fetchDeposits();
        fetchStats();
      } else {
        showToast(data.error || 'Gagal menyetujui deposit', 'error');
      }
    } catch (err: any) {
      showToast('Terjadi kesalahan jaringan saat konfirmasi deposit', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Reject Deposit
  const handleRejectDepositSubmit = async () => {
    if (!selectedDepositForReject) return;
    setActionLoadingId(selectedDepositForReject.id);
    try {
      const res = await fetch(`/api/admin/deposits/${selectedDepositForReject.id}/reject`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ reason: rejectReason }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || `Deposit ${selectedDepositForReject.id} ditolak`);
        setRejectModalOpen(false);
        setSelectedDepositForReject(null);
        fetchDeposits();
        fetchStats();
      } else {
        showToast(data.error || 'Gagal menolak deposit', 'error');
      }
    } catch (err: any) {
      showToast('Terjadi kesalahan jaringan', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Adjust Balance Submit
  const handleAdjustBalanceSubmit = async () => {
    if (!selectedUserForBalance || balanceAdjustAmount <= 0) return;
    setActionLoadingId(selectedUserForBalance.id);
    try {
      const delta = balanceAdjustType === 'add' ? balanceAdjustAmount : -balanceAdjustAmount;
      const res = await fetch(`/api/admin/users/${selectedUserForBalance.id}/balance`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          amountDelta: delta,
          reason: balanceAdjustReason || 'Penyesuaian manual admin',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Saldo user berhasil diperbarui');
        setBalanceModalOpen(false);
        setSelectedUserForBalance(null);
        fetchUsers();
        fetchStats();
      } else {
        showToast(data.error || 'Gagal mengubah saldo', 'error');
      }
    } catch (err) {
      showToast('Terjadi kesalahan jaringan', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Toggle User Block
  const handleToggleBlock = async (u: AdminUserItem) => {
    const willBlock = !u.isBlocked;
    setActionLoadingId(u.id);
    try {
      const res = await fetch(`/api/admin/users/${u.id}/block`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ isBlocked: willBlock }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || `Status blokir @${u.username} diubah`);
        fetchUsers();
      } else {
        showToast(data.error || 'Gagal mengubah status blokir', 'error');
      }
    } catch (err) {
      showToast('Terjadi kesalahan jaringan', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Reset User Password
  const handleResetPasswordSubmit = async () => {
    if (!selectedUserForPass || newPasswordInput.length < 6) {
      showToast('Password baru minimal 6 karakter', 'error');
      return;
    }
    setActionLoadingId(selectedUserForPass.id);
    try {
      const res = await fetch(`/api/admin/users/${selectedUserForPass.id}/reset-password`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ newPassword: newPasswordInput }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Password user berhasil direset');
        setResetPassModalOpen(false);
        setSelectedUserForPass(null);
        setNewPasswordInput('');
      } else {
        showToast(data.error || 'Gagal mereset password', 'error');
      }
    } catch (err) {
      showToast('Terjadi kesalahan jaringan', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Retry Order
  const handleRetryOrder = async (orderId: string) => {
    setActionLoadingId(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/retry`, {
        method: 'POST',
        headers: authHeaders,
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Retry order berhasil!');
        fetchOrders();
        fetchStats();
      } else {
        showToast(data.error || 'Retry order gagal', 'error');
        fetchOrders();
      }
    } catch (err) {
      showToast('Terjadi kesalahan jaringan saat retry order', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Refund Order
  const handleRefundOrder = async (order: Order) => {
    const reason = window.prompt(
      `Alasan refund pesanan ${order.id} sebesar Rp${order.price.toLocaleString('id-ID')} ke saldo @${order.username}:`,
      'Aktivasi gagal, dikembalikan manual oleh admin'
    );
    if (reason === null) return;

    setActionLoadingId(order.id);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/refund`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || `Pesanan ${order.id} berhasil di-refund!`);
        fetchOrders();
        fetchStats();
      } else {
        showToast(data.error || 'Gagal memproses refund order', 'error');
      }
    } catch (err) {
      showToast('Terjadi kesalahan jaringan', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeSettings) return;
    setSavingSettings(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(storeSettings),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Pengaturan toko berhasil diperbarui!');
        setStoreSettings(data.settings);
        refreshSettings();
      } else {
        showToast(data.error || 'Gagal menyimpan pengaturan', 'error');
      }
    } catch (err) {
      showToast('Terjadi kesalahan saat menyimpan pengaturan', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  // Filtered Users List
  const filteredUsers = users.filter((u) => {
    if (userFilter === 'ACTIVE') return !u.isBlocked && u.status !== 'suspended';
    if (userFilter === 'BLOCKED') return u.isBlocked || u.status === 'suspended';
    return true;
  });

  const pendingDepositsCount = stats?.depositPendingCount ?? deposits.filter((d) => d.status === 'PENDING').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`fixed top-20 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border text-sm font-semibold animate-in fade-in slide-in-from-top-3 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-900/20'
              : 'bg-rose-600 text-white border-rose-500 shadow-rose-900/20'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="rounded-3xl border border-purple-200/80 bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 p-6 sm:p-8 text-white shadow-lg shadow-purple-950/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-purple-500/20 border border-purple-400/30 text-purple-300">
              <ShieldCheck className="w-5 h-5 text-purple-300" />
            </span>
            <span className="text-xs font-bold uppercase tracking-widest text-purple-300">
              Control Panel AzrylStore
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Panel Administrator
          </h1>
          <p className="text-xs sm:text-sm text-purple-200/80 max-w-2xl">
            Kelola dan konfirmasi transaksi deposit, monitor pengguna, retry & refund pesanan, serta kontrol status toko secara terintegrasi dengan Firebase Cloud.
          </p>
        </div>

        {/* Quick Actions / Store Status Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              fetchStats();
              if (activeTab === 'deposits') fetchDeposits();
              if (activeTab === 'users') fetchUsers();
              if (activeTab === 'orders') fetchOrders();
              if (activeTab === 'settings') fetchSettings();
              if (activeTab === 'logs') fetchLogs();
              showToast('Data berhasil diperbarui!');
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-white transition-all active:scale-95"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>

          {storeSettings && (
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/10 border border-white/20 text-xs font-bold">
              <span className={`w-2.5 h-2.5 rounded-full ${storeSettings.isStoreOpen ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
              <span>Toko: {storeSettings.isStoreOpen ? 'BUKA' : 'TUTUP'}</span>
            </div>
          )}
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Pending Deposit Card */}
        <div
          onClick={() => {
            setActiveTab('deposits');
            setDepositFilter('PENDING');
          }}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            pendingDepositsCount > 0
              ? 'bg-amber-500/10 border-amber-300 hover:bg-amber-500/15 text-amber-950'
              : 'bg-white border-purple-100 hover:border-purple-300 text-purple-950'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-amber-700">Deposit Pending</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-xl sm:text-2xl font-extrabold mt-1 text-amber-600">
            {pendingDepositsCount}
          </p>
          <p className="text-[10px] text-amber-800/80 font-medium mt-0.5">
            {pendingDepositsCount > 0 ? 'Perlu tindakan!' : 'Semua beres'}
          </p>
        </div>

        {/* Total Users Card */}
        <div
          onClick={() => setActiveTab('users')}
          className="cursor-pointer p-4 rounded-2xl bg-white border border-purple-100 hover:border-purple-300 text-purple-950 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-purple-600">Total User</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-xl sm:text-2xl font-extrabold mt-1 text-purple-950">
            {stats?.totalUsers ?? users.length}
          </p>
          <p className="text-[10px] text-purple-800/60 font-medium mt-0.5">Pengguna terdaftar</p>
        </div>

        {/* Saldo User Card */}
        <div className="p-4 rounded-2xl bg-white border border-purple-100 text-purple-950">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-emerald-600">Saldo Beredar</span>
            <Wallet className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-lg sm:text-xl font-extrabold mt-1 text-emerald-600 truncate">
            Rp{(stats?.totalUserBalance || 0).toLocaleString('id-ID')}
          </p>
          <p className="text-[10px] text-purple-800/60 font-medium mt-0.5">Total saldo semua user</p>
        </div>

        {/* Total Deposit Disetujui */}
        <div
          onClick={() => {
            setActiveTab('deposits');
            setDepositFilter('APPROVED');
          }}
          className="cursor-pointer p-4 rounded-2xl bg-white border border-purple-100 hover:border-purple-300 text-purple-950 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-blue-600">Deposit Masuk</span>
            <CreditCard className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-lg sm:text-xl font-extrabold mt-1 text-blue-600 truncate">
            Rp{(stats?.totalDeposits || 0).toLocaleString('id-ID')}
          </p>
          <p className="text-[10px] text-purple-800/60 font-medium mt-0.5">Dana masuk disetujui</p>
        </div>

        {/* Total Orders Card */}
        <div
          onClick={() => setActiveTab('orders')}
          className="cursor-pointer p-4 rounded-2xl bg-white border border-purple-100 hover:border-purple-300 text-purple-950 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-indigo-600">Total Pesanan</span>
            <ShoppingBag className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-xl sm:text-2xl font-extrabold mt-1 text-indigo-950">
            {stats?.totalOrders ?? orders.length}
          </p>
          <p className="text-[10px] text-purple-800/60 font-medium mt-0.5">
            {stats?.orderSuccess || 0} sukses / {stats?.orderFailed || 0} gagal
          </p>
        </div>

        {/* Total Omset/Revenue Card */}
        <div className="p-4 rounded-2xl bg-white border border-purple-100 text-purple-950">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-purple-700">Omset Penjualan</span>
            <TrendingUp className="w-4 h-4 text-purple-700" />
          </div>
          <p className="text-lg sm:text-xl font-extrabold mt-1 text-purple-700 truncate">
            Rp{(stats?.totalRevenue || 0).toLocaleString('id-ID')}
          </p>
          <p className="text-[10px] text-purple-800/60 font-medium mt-0.5">Total pesanan sukses</p>
        </div>
      </div>

      {/* Main Admin Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-white border border-purple-200 shadow-sm">
        <button
          onClick={() => setActiveTab('deposits')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all relative ${
            activeTab === 'deposits'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'text-purple-900/70 hover:text-purple-950 hover:bg-purple-50'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Konfirmasi Deposit</span>
          {pendingDepositsCount > 0 && (
            <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-white animate-pulse">
              {pendingDepositsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'users'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'text-purple-900/70 hover:text-purple-950 hover:bg-purple-50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Pantau User</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'orders'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'text-purple-900/70 hover:text-purple-950 hover:bg-purple-50'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Pantau Pesanan</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'settings'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'text-purple-900/70 hover:text-purple-950 hover:bg-purple-50'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Pengaturan Toko</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'logs'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'text-purple-900/70 hover:text-purple-950 hover:bg-purple-50'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Log Aktivitas</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: KONFIRMASI DEPOSIT */}
      {/* ========================================================================= */}
      {activeTab === 'deposits' && (
        <div className="space-y-4">
          {/* Filter and Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-3xl border border-purple-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setDepositFilter('PENDING')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  depositFilter === 'PENDING'
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                    : 'bg-purple-50 text-purple-900 hover:bg-purple-100'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Menunggu ({deposits.filter((d) => d.status === 'PENDING').length})</span>
              </button>
              <button
                onClick={() => setDepositFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  depositFilter === 'ALL'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                    : 'bg-purple-50 text-purple-900 hover:bg-purple-100'
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setDepositFilter('APPROVED')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  depositFilter === 'APPROVED'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'bg-purple-50 text-purple-900 hover:bg-purple-100'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Disetujui</span>
              </button>
              <button
                onClick={() => setDepositFilter('REJECTED')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  depositFilter === 'REJECTED'
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                    : 'bg-purple-50 text-purple-900 hover:bg-purple-100'
                }`}
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Ditolak</span>
              </button>
            </div>

            <div className="relative flex-1 sm:max-w-xs">
              <Search className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={depositSearch}
                onChange={(e) => setDepositSearch(e.target.value)}
                placeholder="Cari ID, Username, Nama..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-purple-200 bg-purple-50/50 text-xs focus:outline-none focus:border-purple-600 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Deposit List */}
          {isLoading ? (
            <div className="p-12 text-center text-purple-600 bg-white rounded-3xl border border-purple-200 flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-8 h-8 animate-spin" />
              <p className="text-xs font-bold">Memuat data deposit...</p>
            </div>
          ) : deposits.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-purple-200 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <h3 className="text-base font-bold text-purple-950">Tidak ada pengajuan deposit</h3>
              <p className="text-xs text-purple-700/70">
                {depositFilter === 'PENDING'
                  ? 'Semua deposit yang diajukan pengguna telah selesai diproses.'
                  : 'Tidak ada riwayat deposit yang cocok dengan kriteria filter.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {deposits.map((dep) => {
                const isPending = dep.status === 'PENDING';
                const isApproved = dep.status === 'APPROVED';
                const isRejected = dep.status === 'REJECTED';

                return (
                  <div
                    key={dep.id}
                    className={`rounded-3xl border p-4 sm:p-5 bg-white shadow-sm transition-all ${
                      isPending
                        ? 'border-amber-300 ring-1 ring-amber-300/50'
                        : isApproved
                        ? 'border-purple-100'
                        : 'border-rose-200/70 bg-rose-50/20'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* Left: Info Deposit */}
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-purple-900 bg-purple-100 px-2.5 py-0.5 rounded-lg border border-purple-200">
                            {dep.id}
                          </span>
                          <span
                            className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                              dep.paymentMethod === 'QRIS'
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}
                          >
                            {dep.paymentMethod}
                          </span>
                          <span
                            className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                              isPending
                                ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                                : isApproved
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-rose-100 text-rose-800 border border-rose-300'
                            }`}
                          >
                            {isPending && <Clock className="w-3 h-3" />}
                            {isApproved && <CheckCircle2 className="w-3 h-3" />}
                            {isRejected && <XCircle className="w-3 h-3" />}
                            <span>{dep.status}</span>
                          </span>
                          <span className="text-[11px] text-purple-600/70">
                            {new Date(dep.createdAt).toLocaleString('id-ID', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1 text-xs">
                          <div>
                            <span className="text-purple-600/70">Username: </span>
                            <span className="font-bold text-purple-950">@{dep.username}</span>
                          </div>
                          <div>
                            <span className="text-purple-600/70">Nama Pengirim: </span>
                            <span className="font-bold text-purple-950">{dep.payerName || '-'}</span>
                          </div>
                          <div>
                            <span className="text-purple-600/70">Nominal: </span>
                            <span className="font-extrabold text-sm text-emerald-600">
                              Rp{dep.amount.toLocaleString('id-ID')}
                            </span>
                          </div>
                        </div>

                        {dep.proofNote && (
                          <div className="p-2.5 rounded-xl bg-purple-50/70 border border-purple-100 text-xs text-purple-900">
                            <span className="font-semibold text-purple-700">Catatan/Bukti: </span>
                            <span>{dep.proofNote}</span>
                          </div>
                        )}

                        {dep.confirmedBy && (
                          <p className="text-[11px] text-purple-600/60 italic">
                            Diproses oleh @{dep.confirmedBy} pada{' '}
                            {dep.confirmedAt ? new Date(dep.confirmedAt).toLocaleString('id-ID') : '-'}
                          </p>
                        )}
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        {isPending && (
                          <>
                            <button
                              disabled={actionLoadingId === dep.id}
                              onClick={() => handleOpenApproveModal(dep)}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50"
                            >
                              {actionLoadingId === dep.id ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4" />
                              )}
                              <span>Setujui (Approve)</span>
                            </button>

                            <button
                              disabled={actionLoadingId === dep.id}
                              onClick={() => {
                                setSelectedDepositForReject(dep);
                                setRejectReason('Bukti transfer tidak valid atau dana belum masuk');
                                setRejectModalOpen(true);
                              }}
                              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all disabled:opacity-50"
                            >
                              <XCircle className="w-4 h-4" />
                              <span>Tolak</span>
                            </button>
                          </>
                        )}

                        {isRejected && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold px-3 py-1.5 rounded-xl border bg-rose-50 text-rose-700 border-rose-200">
                              Telah Ditolak
                            </span>
                            <button
                              disabled={actionLoadingId === dep.id}
                              onClick={() => handleOpenApproveModal(dep)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 text-xs font-bold transition-all disabled:opacity-50"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Setujui Ulang</span>
                            </button>
                          </div>
                        )}

                        {isApproved && (
                          <span className="text-xs font-bold px-3 py-1.5 rounded-xl border bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Telah Disetujui</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PANTAU USER (USER MONITORING) */}
      {/* ========================================================================= */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-3xl border border-purple-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setUserFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  userFilter === 'ALL'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                    : 'bg-purple-50 text-purple-900 hover:bg-purple-100'
                }`}
              >
                Semua ({users.length})
              </button>
              <button
                onClick={() => setUserFilter('ACTIVE')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  userFilter === 'ACTIVE'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'bg-purple-50 text-purple-900 hover:bg-purple-100'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Aktif</span>
              </button>
              <button
                onClick={() => setUserFilter('BLOCKED')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  userFilter === 'BLOCKED'
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                    : 'bg-purple-50 text-purple-900 hover:bg-purple-100'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Diblokir</span>
              </button>
            </div>

            <div className="relative flex-1 sm:max-w-xs">
              <Search className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Cari Username / Email..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-purple-200 bg-purple-50/50 text-xs focus:outline-none focus:border-purple-600 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Users Table / Cards */}
          {isLoading ? (
            <div className="p-12 text-center text-purple-600 bg-white rounded-3xl border border-purple-200 flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-8 h-8 animate-spin" />
              <p className="text-xs font-bold">Memuat daftar pengguna...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-purple-200">
              <Users className="w-10 h-10 text-purple-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-purple-950">Tidak ada pengguna ditemukan</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredUsers.map((u) => {
                const isBlocked = u.isBlocked || u.status === 'suspended';
                const isAdmin = u.role === 'admin';

                return (
                  <div
                    key={u.id}
                    className={`rounded-3xl border p-5 bg-white shadow-sm flex flex-col justify-between space-y-4 transition-all ${
                      isBlocked
                        ? 'border-rose-300 bg-rose-50/20'
                        : isAdmin
                        ? 'border-purple-300 ring-1 ring-purple-300/50'
                        : 'border-purple-100 hover:border-purple-200'
                    }`}
                  >
                    {/* User Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white text-base font-extrabold shadow-sm ${
                            isAdmin
                              ? 'bg-gradient-to-tr from-purple-700 to-indigo-700'
                              : isBlocked
                              ? 'bg-rose-500'
                              : 'bg-gradient-to-tr from-purple-600 to-indigo-600'
                          }`}
                        >
                          {u.username.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-extrabold text-sm text-purple-950">@{u.username}</h4>
                            {isAdmin && (
                              <span className="text-[10px] px-2 py-0.2 rounded-full bg-purple-100 text-purple-800 font-bold border border-purple-200">
                                ADMIN
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-purple-600/70 truncate max-w-[180px]">{u.email}</p>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border ${
                          isBlocked
                            ? 'bg-rose-100 text-rose-800 border-rose-300'
                            : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        }`}
                      >
                        {isBlocked ? 'Diblokir' : 'Aktif'}
                      </span>
                    </div>

                    {/* User Stats Grid */}
                    <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-purple-50/50 border border-purple-100 text-xs">
                      <div>
                        <span className="text-purple-600/70 text-[10px] uppercase font-bold block">Saldo Aktif</span>
                        <span className="font-extrabold text-emerald-600 text-sm">
                          Rp{(u.balance || 0).toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div>
                        <span className="text-purple-600/70 text-[10px] uppercase font-bold block">Total Deposit</span>
                        <span className="font-bold text-purple-950">
                          Rp{(u.totalDepositAmount || 0).toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div>
                        <span className="text-purple-600/70 text-[10px] uppercase font-bold block">Total Pesanan</span>
                        <span className="font-bold text-purple-950">{u.totalOrdersCount || 0} kali</span>
                      </div>
                      <div>
                        <span className="text-purple-600/70 text-[10px] uppercase font-bold block">Terdaftar</span>
                        <span className="text-purple-800 text-[11px]">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString('id-ID') : '-'}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-purple-100">
                      <button
                        onClick={() => {
                          setSelectedUserForBalance(u);
                          setBalanceAdjustAmount(10000);
                          setBalanceAdjustType('add');
                          setBalanceAdjustReason('Penambahan saldo manual oleh admin');
                          setBalanceModalOpen(true);
                        }}
                        className="flex items-center justify-center gap-1 py-2 px-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-[11px] font-bold transition-all"
                        title="Tambah / Kurangi Saldo"
                      >
                        <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Saldo</span>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedUserForPass(u);
                          setNewPasswordInput('');
                          setResetPassModalOpen(true);
                        }}
                        className="flex items-center justify-center gap-1 py-2 px-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-[11px] font-bold transition-all"
                        title="Reset Password Pengguna"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                        <span>Sandi</span>
                      </button>

                      {!isAdmin ? (
                        <button
                          disabled={actionLoadingId === u.id}
                          onClick={() => handleToggleBlock(u)}
                          className={`flex items-center justify-center gap-1 py-2 px-1.5 rounded-xl text-[11px] font-bold transition-all border ${
                            isBlocked
                              ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                          }`}
                          title={isBlocked ? 'Buka Blokir' : 'Blokir Pengguna'}
                        >
                          {isBlocked ? (
                            <>
                              <Unlock className="w-3.5 h-3.5" />
                              <span>Buka</span>
                            </>
                          ) : (
                            <>
                              <Lock className="w-3.5 h-3.5" />
                              <span>Blokir</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <div className="flex items-center justify-center py-2 px-1.5 text-[11px] font-bold text-purple-400">
                          Utama
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: PANTAU PESANAN (ORDERS MANAGEMENT) */}
      {/* ========================================================================= */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-3xl border border-purple-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setOrderStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  orderStatusFilter === 'ALL'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                    : 'bg-purple-50 text-purple-900 hover:bg-purple-100'
                }`}
              >
                Semua Status
              </button>
              <button
                onClick={() => setOrderStatusFilter('PROCESSING')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  orderStatusFilter === 'PROCESSING'
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                    : 'bg-purple-50 text-purple-900 hover:bg-purple-100'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Processing</span>
              </button>
              <button
                onClick={() => setOrderStatusFilter('SUCCESS')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  orderStatusFilter === 'SUCCESS'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'bg-purple-50 text-purple-900 hover:bg-purple-100'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Sukses</span>
              </button>
              <button
                onClick={() => setOrderStatusFilter('FAILED')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  orderStatusFilter === 'FAILED'
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                    : 'bg-purple-50 text-purple-900 hover:bg-purple-100'
                }`}
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Gagal</span>
              </button>
              <button
                onClick={() => setOrderStatusFilter('REFUNDED')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  orderStatusFilter === 'REFUNDED'
                    ? 'bg-slate-700 text-white'
                    : 'bg-purple-50 text-purple-900 hover:bg-purple-100'
                }`}
              >
                Refunded
              </button>
            </div>

            <div className="relative flex-1 sm:max-w-xs">
              <Search className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                placeholder="Cari ID, User, Gmail..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-purple-200 bg-purple-50/50 text-xs focus:outline-none focus:border-purple-600 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Orders List */}
          {isLoading ? (
            <div className="p-12 text-center text-purple-600 bg-white rounded-3xl border border-purple-200 flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-8 h-8 animate-spin" />
              <p className="text-xs font-bold">Memuat daftar pesanan...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-purple-200">
              <ShoppingBag className="w-10 h-10 text-purple-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-purple-950">Belum ada pesanan yang sesuai</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((ord) => {
                const isSuccess = ord.status === 'SUCCESS';
                const isFailed = ord.status === 'FAILED';
                const isProcessing = ord.status === 'PROCESSING' || ord.status === 'PENDING';
                const isRefunded = ord.status === 'REFUNDED';

                return (
                  <div
                    key={ord.id}
                    className="rounded-3xl border border-purple-100 p-4 sm:p-5 bg-white shadow-sm space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-purple-100">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-purple-900 bg-purple-100 px-2.5 py-0.5 rounded-lg border border-purple-200">
                          {ord.id}
                        </span>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200">
                          {ord.product === 'AM_ECERAN' ? 'AM ECERAN (VERIFIKASI)' : `AM BULK (${ord.quantity} AKUN)`}
                        </span>
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                            isSuccess
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : isFailed
                              ? 'bg-rose-100 text-rose-800 border-rose-300'
                              : isProcessing
                              ? 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse'
                              : 'bg-slate-100 text-slate-700 border-slate-300'
                          }`}
                        >
                          {ord.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-purple-600/70">Total:</span>
                        <span className="font-extrabold text-sm text-emerald-600">
                          Rp{ord.price.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>

                    {/* Order Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-purple-600/70">Pemesan: </span>
                        <span className="font-bold text-purple-950">@{ord.username}</span>
                      </div>
                      <div>
                        <span className="text-purple-600/70">Waktu: </span>
                        <span className="text-purple-800">
                          {new Date(ord.createdAt).toLocaleString('id-ID', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </span>
                      </div>
                      {ord.gmail && (
                        <div>
                          <span className="text-purple-600/70">Gmail Target: </span>
                          <span className="font-mono font-bold text-purple-950">{ord.gmail}</span>
                        </div>
                      )}
                    </div>

                    {/* API Result / Messages */}
                    {ord.result && (
                      <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950">
                        <div className="flex items-center justify-between pb-1 font-bold text-emerald-800">
                          <span>Hasil Aktivasi Akun:</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(ord.result || '');
                              showToast('Hasil akun berhasil disalin ke clipboard!');
                            }}
                            className="flex items-center gap-1 text-[11px] text-emerald-700 hover:text-emerald-900"
                          >
                            <Copy className="w-3 h-3" />
                            <span>Salin</span>
                          </button>
                        </div>
                        <pre className="font-mono text-[11px] whitespace-pre-wrap overflow-x-auto select-all">
                          {ord.result}
                        </pre>
                      </div>
                    )}

                    {ord.errorMessage && (
                      <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                        <span className="font-bold">Keterangan Error: </span>
                        <span>{ord.errorMessage}</span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 justify-end">
                      {(isFailed || isProcessing) && (
                        <button
                          disabled={actionLoadingId === ord.id}
                          onClick={() => handleRetryOrder(ord.id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all disabled:opacity-50 active:scale-95"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Retry API</span>
                        </button>
                      )}

                      {!isRefunded && (
                        <button
                          disabled={actionLoadingId === ord.id}
                          onClick={() => handleRefundOrder(ord)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all disabled:opacity-50"
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>Refund Dana</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: PENGATURAN TOKO (STORE SETTINGS) */}
      {/* ========================================================================= */}
      {activeTab === 'settings' && storeSettings && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          {/* Store Open / Close Switch Card */}
          <div className="rounded-3xl border border-purple-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-purple-950 flex items-center gap-2">
                  <Store className="w-5 h-5 text-purple-600" />
                  <span>Status Buka / Tutup Toko</span>
                </h3>
                <p className="text-xs text-purple-600/70 mt-0.5">
                  Jika ditutup, pembeli tidak akan dapat melakukan order atau transaksi sampai toko dibuka kembali.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setStoreSettings((prev) => (prev ? { ...prev, isStoreOpen: !prev.isStoreOpen } : null))
                }
                className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  storeSettings.isStoreOpen ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    storeSettings.isStoreOpen ? 'translate-x-7' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {!storeSettings.isStoreOpen && (
              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-bold text-rose-900">
                  Alasan Tutup Toko (Ditampilkan ke pengguna):
                </label>
                <textarea
                  rows={2}
                  value={storeSettings.closeReason || ''}
                  onChange={(e) =>
                    setStoreSettings((prev) => (prev ? { ...prev, closeReason: e.target.value } : null))
                  }
                  className="w-full p-3 rounded-2xl border border-rose-200 bg-rose-50/50 text-xs text-rose-950 focus:outline-none focus:border-rose-500"
                  placeholder="Contoh: Toko sedang tutup sementara untuk pemeliharaan sistem..."
                />
              </div>
            )}
          </div>

          {/* Pricing & Limits */}
          <div className="rounded-3xl border border-purple-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-base font-extrabold text-purple-950 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-purple-600" />
              <span>Harga Produk & Batasan Limit</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-purple-900">Harga AM Eceran (Rp):</label>
                <input
                  type="number"
                  min={1}
                  value={storeSettings.priceEceran}
                  onChange={(e) =>
                    setStoreSettings((prev) =>
                      prev ? { ...prev, priceEceran: parseInt(e.target.value, 10) || 0 } : null
                    )
                  }
                  className="w-full p-2.5 rounded-xl border border-purple-200 bg-purple-50/50 text-xs font-bold focus:outline-none focus:border-purple-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-purple-900">Harga AM Bulk / Akun (Rp):</label>
                <input
                  type="number"
                  min={1}
                  value={storeSettings.priceBulk}
                  onChange={(e) =>
                    setStoreSettings((prev) =>
                      prev ? { ...prev, priceBulk: parseInt(e.target.value, 10) || 0 } : null
                    )
                  }
                  className="w-full p-2.5 rounded-xl border border-purple-200 bg-purple-50/50 text-xs font-bold focus:outline-none focus:border-purple-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-purple-900">Minimal Deposit (Rp):</label>
                <input
                  type="number"
                  min={100}
                  value={storeSettings.minDeposit}
                  onChange={(e) =>
                    setStoreSettings((prev) =>
                      prev ? { ...prev, minDeposit: parseInt(e.target.value, 10) || 0 } : null
                    )
                  }
                  className="w-full p-2.5 rounded-xl border border-purple-200 bg-purple-50/50 text-xs font-bold focus:outline-none focus:border-purple-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-purple-900">Batas Akun Bulk (Min - Max):</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    value={storeSettings.bulkMin}
                    onChange={(e) =>
                      setStoreSettings((prev) =>
                        prev ? { ...prev, bulkMin: parseInt(e.target.value, 10) || 1 } : null
                      )
                    }
                    className="w-1/2 p-2.5 rounded-xl border border-purple-200 bg-purple-50/50 text-xs font-bold"
                  />
                  <span className="text-xs font-bold text-purple-400">-</span>
                  <input
                    type="number"
                    min={1}
                    value={storeSettings.bulkMax}
                    onChange={(e) =>
                      setStoreSettings((prev) =>
                        prev ? { ...prev, bulkMax: parseInt(e.target.value, 10) || 1 } : null
                      )
                    }
                    className="w-1/2 p-2.5 rounded-xl border border-purple-200 bg-purple-50/50 text-xs font-bold"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Payment & Media URLs */}
          <div className="rounded-3xl border border-purple-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-base font-extrabold text-purple-950 flex items-center gap-2">
              <QrCode className="w-5 h-5 text-purple-600" />
              <span>Metode Pembayaran & Gambar</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-purple-900">Nomor DANA Admin:</label>
                <input
                  type="text"
                  value={storeSettings.danaNumber}
                  onChange={(e) =>
                    setStoreSettings((prev) => (prev ? { ...prev, danaNumber: e.target.value } : null))
                  }
                  className="w-full p-2.5 rounded-xl border border-purple-200 bg-purple-50/50 text-xs font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-purple-900">Atas Nama Akun DANA:</label>
                <input
                  type="text"
                  value={storeSettings.danaName}
                  onChange={(e) =>
                    setStoreSettings((prev) => (prev ? { ...prev, danaName: e.target.value } : null))
                  }
                  className="w-full p-2.5 rounded-xl border border-purple-200 bg-purple-50/50 text-xs font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-purple-900">URL Gambar QRIS:</label>
                <input
                  type="text"
                  value={storeSettings.qrImage}
                  onChange={(e) =>
                    setStoreSettings((prev) => (prev ? { ...prev, qrImage: e.target.value } : null))
                  }
                  className="w-full p-2.5 rounded-xl border border-purple-200 bg-purple-50/50 text-xs font-mono"
                />
                {storeSettings.qrImage && (
                  <div className="mt-2 p-2 rounded-xl bg-purple-50 inline-block border border-purple-100">
                    <img
                      src={storeSettings.qrImage}
                      alt="QRIS Preview"
                      className="w-20 h-20 object-contain rounded-lg"
                      onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-purple-900">URL Foto Produk Alight Motion:</label>
                <input
                  type="text"
                  value={storeSettings.amPhoto}
                  onChange={(e) =>
                    setStoreSettings((prev) => (prev ? { ...prev, amPhoto: e.target.value } : null))
                  }
                  className="w-full p-2.5 rounded-xl border border-purple-200 bg-purple-50/50 text-xs font-mono"
                />
                {storeSettings.amPhoto && (
                  <div className="mt-2 p-2 rounded-xl bg-purple-50 inline-block border border-purple-100">
                    <img
                      src={storeSettings.amPhoto}
                      alt="AM Photo Preview"
                      className="w-20 h-20 object-cover rounded-lg"
                      onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Social Links & Announcement */}
          <div className="rounded-3xl border border-purple-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-base font-extrabold text-purple-950 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-purple-600" />
              <span>Kontak Dukungan & Teks Pengumuman</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-purple-900">Link WhatsApp Admin:</label>
                <input
                  type="text"
                  value={storeSettings.waAdmin}
                  onChange={(e) =>
                    setStoreSettings((prev) => (prev ? { ...prev, waAdmin: e.target.value } : null))
                  }
                  className="w-full p-2.5 rounded-xl border border-purple-200 bg-purple-50/50 text-xs font-mono"
                  placeholder="https://wa.me/6285..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-purple-900">Link Saluran WhatsApp:</label>
                <input
                  type="text"
                  value={storeSettings.waChannel}
                  onChange={(e) =>
                    setStoreSettings((prev) => (prev ? { ...prev, waChannel: e.target.value } : null))
                  }
                  className="w-full p-2.5 rounded-xl border border-purple-200 bg-purple-50/50 text-xs font-mono"
                  placeholder="https://whatsapp.com/channel/..."
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-purple-900">Teks Pengumuman Berjalan (Announcement):</label>
              <textarea
                rows={2}
                value={storeSettings.announcement}
                onChange={(e) =>
                  setStoreSettings((prev) => (prev ? { ...prev, announcement: e.target.value } : null))
                }
                className="w-full p-3 rounded-2xl border border-purple-200 bg-purple-50/50 text-xs focus:outline-none focus:border-purple-600"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingSettings}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white text-xs sm:text-sm font-bold shadow-lg shadow-purple-600/30 transition-all disabled:opacity-50"
            >
              {savingSettings ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>Simpan Perubahan Pengaturan</span>
            </button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: LOG AKTIVITAS ADMIN (AUDIT LOGS) */}
      {/* ========================================================================= */}
      {activeTab === 'logs' && (
        <div className="rounded-3xl border border-purple-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-purple-100">
            <div>
              <h3 className="font-extrabold text-sm text-purple-950 flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-600" />
                <span>Log Aktivitas Sistem & Administrator</span>
              </h3>
              <p className="text-xs text-purple-600/70">
                Audit trail seluruh tindakan approval, penolakan, penyesuaian saldo, dan konfigurasi toko.
              </p>
            </div>
            <button
              onClick={fetchLogs}
              className="p-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Segarkan</span>
            </button>
          </div>

          {logs.length === 0 ? (
            <p className="text-xs text-purple-600/70 text-center py-6">Belum ada riwayat aktivitas log.</p>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-2xl bg-purple-50/50 border border-purple-100 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-purple-950">@{log.adminUsername}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-200/60 font-mono font-bold text-purple-800">
                        {log.action}
                      </span>
                      {log.targetUser && (
                        <span className="text-[11px] text-purple-600">
                          Target: <strong className="text-purple-950">@{log.targetUser}</strong>
                        </span>
                      )}
                    </div>
                    <p className="text-purple-900">{log.description}</p>
                  </div>
                  <span className="text-[11px] text-purple-500 shrink-0 font-medium">
                    {new Date(log.createdAt).toLocaleString('id-ID', {
                      dateStyle: 'short',
                      timeStyle: 'medium',
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SETUJUI / APPROVE DEPOSIT */}
      {/* ========================================================================= */}
      {approveModalOpen && selectedDepositForApprove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-purple-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-purple-100">
              <h3 className="text-base font-extrabold text-emerald-600 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Konfirmasi Persetujuan Deposit</span>
              </h3>
              <button
                onClick={() => setApproveModalOpen(false)}
                className="p-1 rounded-xl text-purple-400 hover:text-purple-700"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-100 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-purple-600">ID Deposit:</span>
                  <span className="font-mono font-bold text-purple-950 bg-white px-2 py-0.5 rounded-md border border-purple-200">
                    {selectedDepositForApprove.id}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-purple-600">Target User:</span>
                  <span className="font-bold text-purple-950">@{selectedDepositForApprove.username}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-purple-600">Nama Pengirim:</span>
                  <span className="font-bold text-purple-950">{selectedDepositForApprove.payerName || '-'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-purple-600">Metode:</span>
                  <span className="font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                    {selectedDepositForApprove.paymentMethod}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-purple-200/60">
                  <span className="text-purple-700 font-bold">Nominal Saldo Ditambahkan:</span>
                  <span className="font-extrabold text-sm text-emerald-600">
                    Rp{selectedDepositForApprove.amount.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {selectedDepositForApprove.proofNote && (
                <div className="p-2.5 rounded-xl bg-purple-50 text-[11px] text-purple-800 border border-purple-100">
                  <span className="font-semibold">Bukti/Catatan: </span>
                  <span>{selectedDepositForApprove.proofNote}</span>
                </div>
              )}

              <div className="p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-emerald-900 text-[11px] leading-relaxed">
                <p className="font-bold mb-0.5">Perhatian:</p>
                <p>Setelah Anda menyetujui, saldo akun <strong>@{selectedDepositForApprove.username}</strong> akan otomatis bertambah sebesar <strong>Rp{selectedDepositForApprove.amount.toLocaleString('id-ID')}</strong> dan status diperbarui menjadi APPROVED.</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-purple-100">
              <button
                onClick={() => setApproveModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-purple-700 hover:bg-purple-50 transition-all"
              >
                Batal
              </button>
              <button
                disabled={actionLoadingId === selectedDepositForApprove.id}
                onClick={handleApproveDepositSubmit}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50 active:scale-95"
              >
                {actionLoadingId === selectedDepositForApprove.id ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Menyetujui...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Ya, Setujui & Tambah Saldo</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: TOLAK DEPOSIT */}
      {/* ========================================================================= */}
      {rejectModalOpen && selectedDepositForReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-purple-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-purple-100">
              <h3 className="text-base font-extrabold text-rose-600 flex items-center gap-2">
                <XCircle className="w-5 h-5" />
                <span>Tolak Pengajuan Deposit</span>
              </h3>
              <button
                onClick={() => setRejectModalOpen(false)}
                className="p-1 rounded-xl text-purple-400 hover:text-purple-700"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-purple-50 border border-purple-100 space-y-1">
                <div className="flex justify-between">
                  <span className="text-purple-600">ID Deposit:</span>
                  <span className="font-mono font-bold">{selectedDepositForReject.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-600">Username:</span>
                  <span className="font-bold">@{selectedDepositForReject.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-600">Nominal:</span>
                  <span className="font-extrabold text-rose-600">
                    Rp{selectedDepositForReject.amount.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-purple-900">Alasan Penolakan:</label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-purple-200 bg-purple-50/50 text-xs focus:outline-none focus:border-rose-500"
                  placeholder="Masukkan alasan tolak..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-purple-100">
              <button
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-purple-700 hover:bg-purple-50"
              >
                Batal
              </button>
              <button
                disabled={actionLoadingId === selectedDepositForReject.id}
                onClick={handleRejectDepositSubmit}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/20 disabled:opacity-50"
              >
                {actionLoadingId === selectedDepositForReject.id ? 'Memproses...' : 'Tolak Deposit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: KELOLA SALDO USER */}
      {/* ========================================================================= */}
      {balanceModalOpen && selectedUserForBalance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-purple-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-purple-100">
              <h3 className="text-base font-extrabold text-purple-950 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-purple-600" />
                <span>Penyesuaian Saldo Pengguna</span>
              </h3>
              <button
                onClick={() => setBalanceModalOpen(false)}
                className="p-1 rounded-xl text-purple-400 hover:text-purple-700"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-purple-50 border border-purple-100 space-y-1">
                <div className="flex justify-between">
                  <span className="text-purple-600">User:</span>
                  <span className="font-bold text-purple-950">@{selectedUserForBalance.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-600">Saldo Saat Ini:</span>
                  <span className="font-extrabold text-emerald-600">
                    Rp{(selectedUserForBalance.balance || 0).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-purple-900">Jenis Aksi:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBalanceAdjustType('add')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      balanceAdjustType === 'add'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                        : 'bg-purple-50 text-purple-900 border-purple-200'
                    }`}
                  >
                    + Tambah Saldo
                  </button>
                  <button
                    type="button"
                    onClick={() => setBalanceAdjustType('deduct')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      balanceAdjustType === 'deduct'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/20'
                        : 'bg-purple-50 text-purple-900 border-purple-200'
                    }`}
                  >
                    - Kurangi Saldo
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-purple-900">Nominal Penyesuaian (Rp):</label>
                <input
                  type="number"
                  min={1}
                  value={balanceAdjustAmount}
                  onChange={(e) => setBalanceAdjustAmount(parseInt(e.target.value, 10) || 0)}
                  className="w-full p-2.5 rounded-xl border border-purple-200 bg-purple-50/50 text-xs font-bold focus:outline-none focus:border-purple-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-purple-900">Alasan / Catatan Penyesuaian:</label>
                <input
                  type="text"
                  value={balanceAdjustReason}
                  onChange={(e) => setBalanceAdjustReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-purple-200 bg-purple-50/50 text-xs focus:outline-none focus:border-purple-600"
                  placeholder="Contoh: Bonus deposit, penyesuaian manual..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-purple-100">
              <button
                onClick={() => setBalanceModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-purple-700 hover:bg-purple-50"
              >
                Batal
              </button>
              <button
                disabled={actionLoadingId === selectedUserForBalance.id}
                onClick={handleAdjustBalanceSubmit}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/20 disabled:opacity-50"
              >
                {actionLoadingId === selectedUserForBalance.id ? 'Menyimpan...' : 'Simpan Saldo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: RESET PASSWORD USER */}
      {/* ========================================================================= */}
      {resetPassModalOpen && selectedUserForPass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-purple-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-purple-100">
              <h3 className="text-base font-extrabold text-purple-950 flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-600" />
                <span>Reset Password Pengguna</span>
              </h3>
              <button
                onClick={() => setResetPassModalOpen(false)}
                className="p-1 rounded-xl text-purple-400 hover:text-purple-700"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-purple-700">
                Atur kata sandi baru untuk akun <strong className="text-purple-950">@{selectedUserForPass.username}</strong> ({selectedUserForPass.email}).
              </p>

              <div className="space-y-1">
                <label className="font-bold text-purple-900">Kata Sandi Baru (Min. 6 Karakter):</label>
                <input
                  type="text"
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-purple-200 bg-purple-50/50 text-xs font-mono font-bold focus:outline-none focus:border-purple-600"
                  placeholder="Masukkan password baru..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-purple-100">
              <button
                onClick={() => setResetPassModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-purple-700 hover:bg-purple-50"
              >
                Batal
              </button>
              <button
                disabled={actionLoadingId === selectedUserForPass.id}
                onClick={handleResetPasswordSubmit}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-md shadow-amber-600/20 disabled:opacity-50"
              >
                {actionLoadingId === selectedUserForPass.id ? 'Menyimpan...' : 'Perbarui Password'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
