import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  XCircle,
  RotateCcw,
  RefreshCw,
  ShoppingBag,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Order } from '../types';

export const HistoryView: React.FC = () => {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedResultId, setCopiedResultId] = useState<string | null>(null);

  const fetchOrders = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch('/api/orders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [token]);

  const copyText = (text: string, id: string, type: 'id' | 'result') => {
    navigator.clipboard.writeText(text);
    if (type === 'id') {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } else {
      setCopiedResultId(id);
      setTimeout(() => setCopiedResultId(null), 2000);
    }
    showToast('Tersalin ke papan klip!', 'info');
  };

  const filteredOrders = orders.filter((ord) => {
    const matchSearch =
      ord.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ord.gmail && ord.gmail.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (ord.result && ord.result.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchStatus =
      statusFilter === 'ALL' ||
      ord.status === statusFilter ||
      (statusFilter === 'PENDING' && (ord.status === 'PENDING' || ord.status === 'PROCESSING'));
    return matchSearch && matchStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>SUCCESS</span>
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200 animate-pulse">
            <Clock className="w-3.5 h-3.5" />
            <span>PROCESSING</span>
          </span>
        );
      case 'REFUNDED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-100 text-cyan-800 border border-cyan-200">
            <RotateCcw className="w-3.5 h-3.5" />
            <span>REFUNDED</span>
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <XCircle className="w-3.5 h-3.5" />
            <span>FAILED</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5" />
            <span>PENDING</span>
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-purple-600 mb-1">
            <History className="w-4 h-4" />
            <span>DATA TRANSAKSI REAL-TIME</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-purple-950 tracking-tight font-['Poppins',sans-serif]">
            Riwayat Pesanan
          </h1>
          <p className="text-xs sm:text-sm text-purple-800/70 mt-0.5 font-medium">
            Daftar pesanan Alight Motion Premium, data akun, dan status pengembalian dana.
          </p>
        </div>
        <button
          onClick={fetchOrders}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-purple-50 border border-purple-200 text-purple-900 text-xs font-bold self-start sm:self-auto transition-all shadow-sm active:scale-95"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-purple-600 ${loading ? 'animate-spin' : ''}`} />
          <span>Segarkan Data</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari ID pesanan, email, atau isi hasil..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-purple-200 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 text-xs sm:text-sm text-purple-950 placeholder:text-purple-400 shadow-sm"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: 'Semua' },
            { id: 'SUCCESS', label: 'Success' },
            { id: 'PENDING', label: 'Pending/Proses' },
            { id: 'REFUNDED', label: 'Refunded' },
            { id: 'FAILED', label: 'Failed' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                statusFilter === tab.id
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-white text-purple-700 hover:bg-purple-50 border border-purple-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List / Table */}
      <div className="rounded-3xl border border-purple-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-purple-500 text-xs font-medium">Memuat daftar pesanan...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-16 text-center px-4">
            <ShoppingBag className="w-10 h-10 text-purple-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-purple-950">Tidak ada riwayat pesanan</h3>
            <p className="text-xs text-purple-600 mt-1 max-w-sm mx-auto">
              Pesanan Anda akan tercatat di sini lengkap dengan hasil verifikasi akun Alight Motion.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-purple-100 bg-purple-50/60 text-purple-700 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 pl-6">ID Pesanan</th>
                    <th className="py-3.5">Layanan</th>
                    <th className="py-3.5">Detail Akun / Jumlah</th>
                    <th className="py-3.5">Harga</th>
                    <th className="py-3.5">Waktu</th>
                    <th className="py-3.5">Status</th>
                    <th className="py-3.5 pr-6">Hasil Akun</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-100 text-purple-950 font-medium">
                  {filteredOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-purple-50/50 transition-colors">
                      <td className="py-4 pl-6 font-mono text-purple-700 font-bold">
                        <div className="flex items-center gap-1.5">
                          <span>{ord.id}</span>
                          <button
                            onClick={() => copyText(ord.id, ord.id, 'id')}
                            className="p-1 hover:text-purple-950 text-purple-400"
                            title="Salin ID"
                          >
                            {copiedId === ord.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="py-4 font-bold text-purple-950">
                        {ord.product === 'AM_ECERAN' ? 'AM Eceran' : 'AM Bulk'}
                      </td>
                      <td className="py-4 text-purple-900 font-mono">
                        {ord.product === 'AM_ECERAN' ? ord.gmail : `${ord.quantity} Akun`}
                      </td>
                      <td className="py-4 font-extrabold text-emerald-600">
                        Rp{ord.price.toLocaleString('id-ID')}
                      </td>
                      <td className="py-4 text-purple-700/70">
                        {new Date(ord.createdAt).toLocaleString('id-ID', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </td>
                      <td className="py-4">{getStatusBadge(ord.status)}</td>
                      <td className="py-4 pr-6">
                        {ord.result ? (
                          <div className="flex items-center gap-2 max-w-xs">
                            <span className="truncate font-mono text-purple-950 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200 max-w-[200px]">
                              {ord.result}
                            </span>
                            <button
                              onClick={() => copyText(ord.result || '', ord.id, 'result')}
                              className="p-1.5 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-800 transition-colors"
                              title="Salin Hasil Akun"
                            >
                              {copiedResultId === ord.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        ) : ord.errorMessage ? (
                          <span className="text-rose-600 text-[11px] truncate max-w-[180px] block font-semibold">
                            {ord.errorMessage}
                          </span>
                        ) : (
                          <span className="text-purple-400 italic text-[11px]">Memproses...</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile / Tablet Responsive Card View */}
            <div className="lg:hidden divide-y divide-purple-100">
              {filteredOrders.map((ord) => (
                <div key={ord.id} className="p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-mono text-xs text-purple-700 font-bold">
                      <span>{ord.id}</span>
                      <button
                        onClick={() => copyText(ord.id, ord.id, 'id')}
                        className="p-1 text-purple-400"
                      >
                        {copiedId === ord.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    {getStatusBadge(ord.status)}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-purple-600 block text-[10px] font-bold uppercase">Layanan</span>
                      <span className="font-bold text-purple-950">
                        {ord.product === 'AM_ECERAN' ? 'AM Eceran' : 'AM Bulk'}
                      </span>
                    </div>
                    <div>
                      <span className="text-purple-600 block text-[10px] font-bold uppercase">Harga</span>
                      <span className="font-extrabold text-emerald-600">
                        Rp{ord.price.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-purple-600 block text-[10px] font-bold uppercase">
                        {ord.product === 'AM_ECERAN' ? 'Gmail' : 'Jumlah Akun'}
                      </span>
                      <span className="text-purple-950 font-mono">
                        {ord.product === 'AM_ECERAN' ? ord.gmail : `${ord.quantity} Akun`}
                      </span>
                    </div>
                  </div>

                  {/* Result on Mobile */}
                  {ord.result && (
                    <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-xs flex items-center justify-between gap-2">
                      <div className="font-mono text-purple-950 truncate">{ord.result}</div>
                      <button
                        onClick={() => copyText(ord.result || '', ord.id, 'result')}
                        className="p-1.5 rounded-lg bg-purple-200/70 text-purple-900 shrink-0"
                      >
                        {copiedResultId === ord.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  )}

                  {ord.errorMessage && (
                    <div className="text-rose-600 text-xs font-semibold">
                      <strong>Info:</strong> {ord.errorMessage}
                    </div>
                  )}

                  <div className="text-[10px] text-purple-500 font-medium">
                    {new Date(ord.createdAt).toLocaleString('id-ID', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
