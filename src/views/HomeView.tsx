import React, { useEffect, useState } from 'react';
import {
  Wallet,
  ShoppingBag,
  CheckCircle2,
  Clock,
  PlusCircle,
  Zap,
  History,
  Sparkles,
  ArrowRight,
  Copy,
  Check,
  Store,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NavTab } from '../components/Navbar';
import { DashboardStats, Order } from '../types';

interface HomeViewProps {
  onSelectTab: (tab: NavTab) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onSelectTab }) => {
  const { user, token, settings } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const isStoreOpen = settings?.isStoreOpen !== false;
  const amPhotoUrl = settings?.amPhoto || 'https://cdn.phototourl.com/free/2026-09-10-6e54e472-9822-4fa7-91a2-e40f8ed111ac.jpg';

  useEffect(() => {
    const fetchDashboard = async () => {
      if (!token) return;
      try {
        const res = await fetch('/api/user/dashboard', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
          setRecentOrders(data.recentOrders || []);
        }
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [token]);

  const copyOrderId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            SUCCESS
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200 animate-pulse">
            PROCESSING
          </span>
        );
      case 'REFUNDED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 text-cyan-800 border border-cyan-200">
            REFUNDED
          </span>
        );
      case 'FAILED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
            FAILED
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            PENDING
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Store Closed Banner if applicable */}
      {!isStoreOpen && (
        <div className="p-4 sm:p-5 rounded-3xl bg-rose-50 border border-rose-200 shadow-sm flex items-start gap-3">
          <div className="p-2 rounded-xl bg-rose-100 text-rose-700 shrink-0">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase px-2 py-0.5 rounded-full bg-rose-200 text-rose-900">
                Toko Sedang Tutup
              </span>
            </div>
            <p className="text-xs sm:text-sm text-rose-900 font-semibold mt-1">
              {settings?.closeReason ||
                'Toko sedang tutup sementara waktu. Layanan top up dan order dinonaktifkan hingga toko dibuka kembali oleh admin.'}
            </p>
          </div>
        </div>
      )}

      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-purple-600 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>AZRYLSTORE DASHBOARD</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-purple-950 tracking-tight font-['Poppins',sans-serif]">
            Selamat datang, <span className="text-purple-600">@{user?.username}</span>
          </h1>
          <p className="text-xs sm:text-sm text-purple-800/70 mt-0.5 font-medium">
            Kelola saldo dan nikmati aktivasi Alight Motion Premium cepat dalam 1 klik.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onSelectTab('deposit')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-xs sm:text-sm font-bold text-white shadow-md shadow-purple-600/20 transition-all active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Isi Saldo</span>
          </button>
          <button
            onClick={() => onSelectTab('order')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-purple-200 bg-white hover:bg-purple-50 text-xs sm:text-sm font-bold text-purple-800 transition-all shadow-sm active:scale-95"
          >
            <Zap className="w-4 h-4 text-purple-600" />
            <span>Order AM</span>
          </button>
        </div>
      </div>

      {/* Featured Banner with AM Photo */}
      <div className="relative overflow-hidden rounded-3xl border border-purple-200 bg-white p-5 sm:p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex-1 space-y-2 text-left">
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold text-purple-700 uppercase tracking-wide bg-purple-100 px-3 py-1 rounded-full">
              PENGUMUMAN RESMI
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-purple-950">
            Alight Motion Premium Resmi Terjamin
          </h3>
          <p className="text-xs sm:text-sm text-purple-900/80 font-medium leading-relaxed">
            {stats?.announcement ||
              'Server AM Premium Aktif 24/7! Proses verifikasi eceran (Rp300) & bulk (Rp400/akun) otomatis. Silakan hubungi admin bila membutuhkan bantuan.'}
          </p>
          <div className="pt-2">
            <button
              onClick={() => onSelectTab('order')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-xs font-bold text-white shadow-sm transition-all"
            >
              <span>Order Sekarang</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <div className="w-48 sm:w-56 rounded-2xl overflow-hidden border border-purple-200 shadow-md shrink-0 bg-purple-50">
          <img
            src={amPhotoUrl}
            alt="Alight Motion Premium"
            className="w-full h-auto object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>

      {/* 4 Core Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Saldo Saat Ini */}
        <div className="rounded-3xl border border-purple-200 bg-white p-4 sm:p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-purple-700 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Saldo Saat Ini</span>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-emerald-600 font-['Poppins',sans-serif]">
            Rp{(user?.balance ?? stats?.balance ?? 0).toLocaleString('id-ID')}
          </div>
          <button
            onClick={() => onSelectTab('deposit')}
            className="mt-3 text-[11px] font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1 transition-colors"
          >
            <span>Top Up Saldo</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Total Pesanan */}
        <div className="rounded-3xl border border-purple-200 bg-white p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between text-purple-700 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Pesanan</span>
            <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-purple-950 font-['Poppins',sans-serif]">
            {stats?.totalOrders ?? 0}
          </div>
          <div className="mt-3 text-[11px] text-purple-600 font-medium">Semua transaksi pesanan</div>
        </div>

        {/* Pesanan Berhasil */}
        <div className="rounded-3xl border border-purple-200 bg-white p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between text-purple-700 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Pesanan Berhasil</span>
            <div className="p-2 rounded-xl bg-teal-100 text-teal-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-teal-600 font-['Poppins',sans-serif]">
            {stats?.successOrders ?? 0}
          </div>
          <div className="mt-3 text-[11px] text-teal-700 font-medium">Aktif & terverifikasi</div>
        </div>

        {/* Pesanan Pending / Proses */}
        <div className="rounded-3xl border border-purple-200 bg-white p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between text-purple-700 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Pesanan Pending</span>
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-amber-600 font-['Poppins',sans-serif]">
            {stats?.pendingOrders ?? 0}
          </div>
          <div className="mt-3 text-[11px] text-amber-700 font-medium">Sedang diproses</div>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => onSelectTab('deposit')}
          className="rounded-3xl border border-purple-200 bg-white p-5 sm:p-6 cursor-pointer hover:border-purple-400 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <PlusCircle className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-purple-400 group-hover:text-purple-700 transition-colors" />
          </div>
          <h3 className="text-base font-bold text-purple-950 mt-4">+ Isi Saldo</h3>
          <p className="text-xs text-purple-700 mt-1 font-medium leading-relaxed">
            Deposit otomatis via QRIS / DANA mulai Rp1.000 untuk transaksi tanpa repot.
          </p>
        </div>

        <div
          onClick={() => onSelectTab('order')}
          className="rounded-3xl border border-purple-200 bg-white p-5 sm:p-6 cursor-pointer hover:border-purple-400 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <Zap className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-purple-400 group-hover:text-purple-700 transition-colors" />
          </div>
          <h3 className="text-base font-bold text-purple-950 mt-4">Order AM Premium</h3>
          <p className="text-xs text-purple-700 mt-1 font-medium leading-relaxed">
            Pilih AM Eceran (Rp300) atau AM Bulk (Rp400) langsung aktif sekarang.
          </p>
        </div>

        <div
          onClick={() => onSelectTab('history')}
          className="rounded-3xl border border-purple-200 bg-white p-5 sm:p-6 cursor-pointer hover:border-purple-400 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <History className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-purple-400 group-hover:text-purple-700 transition-colors" />
          </div>
          <h3 className="text-base font-bold text-purple-950 mt-4">Riwayat Pesanan</h3>
          <p className="text-xs text-purple-700 mt-1 font-medium leading-relaxed">
            Lihat daftar pesanan, salin data akun, dan lacak status verifikasi secara real-time.
          </p>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="rounded-3xl border border-purple-200 bg-white p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-purple-600" />
            <h3 className="text-base font-bold text-purple-950">Pesanan Terakhir</h3>
          </div>
          <button
            onClick={() => onSelectTab('history')}
            className="text-xs font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1"
          >
            <span>Lihat Semua</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentOrders.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-purple-200 rounded-2xl">
            <ShoppingBag className="w-8 h-8 text-purple-300 mx-auto mb-2" />
            <p className="text-xs text-purple-600 font-medium">Belum ada riwayat pesanan.</p>
            <button
              onClick={() => onSelectTab('order')}
              className="mt-3 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-xs font-bold text-white shadow-sm"
            >
              Order AM Premium Sekarang
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-purple-100 text-purple-700 font-bold uppercase">
                <tr>
                  <th className="pb-3 pl-2">Order ID</th>
                  <th className="pb-3">Produk</th>
                  <th className="pb-3">Detail</th>
                  <th className="pb-3">Harga</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-100 text-purple-950 font-medium">
                {recentOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-purple-50/50 transition-colors">
                    <td className="py-3 pl-2 font-mono text-purple-700 font-bold">
                      <div className="flex items-center gap-1.5">
                        <span>{ord.id}</span>
                        <button
                          onClick={() => copyOrderId(ord.id)}
                          className="p-1 hover:text-purple-950 text-purple-400"
                          title="Salin ID"
                        >
                          {copiedId === ord.id ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-3 font-bold text-purple-950">
                      {ord.product === 'AM_ECERAN' ? 'AM Eceran' : 'AM Bulk'}
                    </td>
                    <td className="py-3 text-purple-900 font-mono">
                      {ord.product === 'AM_ECERAN' ? ord.gmail : `${ord.quantity} akun`}
                    </td>
                    <td className="py-3 font-bold text-emerald-600">
                      Rp{ord.price.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3">{getStatusBadge(ord.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
