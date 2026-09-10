import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  CreditCard,
  QrCode,
  Copy,
  Check,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Sparkles,
  ArrowRight,
  Info,
  ShieldCheck,
  RefreshCw,
  ChevronLeft,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Deposit } from '../types';

export const DepositView: React.FC = () => {
  const { user, token, settings, refreshUser } = useAuth();
  const { showToast } = useToast();

  const isStoreClosed = settings?.isStoreOpen === false;
  const minDeposit = settings?.minDeposit ?? 1000;
  const qrImage = settings?.qrImage || 'https://cdn.phototourl.com/free/2026-09-10-f548b8a3-78db-462f-bf15-59b7ce782943.jpg';
  const danaNumber = settings?.danaNumber || '085786683784';
  const danaName = settings?.danaName || 'JEJE';

  // Form State
  const [nominal, setNominal] = useState<string>('5000');
  const [payerName, setPayerName] = useState<string>(user?.username || '');
  const [paymentMethod, setPaymentMethod] = useState<'QRIS' | 'DANA'>('QRIS');
  const [proofNote, setProofNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Active Confirmed Payment State (QR and DANA only appear here)
  const [activeDeposit, setActiveDeposit] = useState<Deposit | null>(null);
  const [isConfirmingPaid, setIsConfirmingPaid] = useState<boolean>(false);
  const [copiedDana, setCopiedDana] = useState<boolean>(false);
  const [copiedAmount, setCopiedAmount] = useState<boolean>(false);

  // History State
  const [depositHistory, setDepositHistory] = useState<Deposit[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(true);

  // Preset Nominal
  const presets = [1000, 2000, 5000, 10000, 20000, 50000];

  const fetchDepositHistory = async () => {
    if (!token) return;
    try {
      setIsLoadingHistory(true);
      const res = await fetch('/api/deposits', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDepositHistory(data.deposits || []);
        // If there's an ongoing pending deposit, restore active deposit state
        const pending = (data.deposits || []).find(
          (d: Deposit) => d.status === 'PENDING' && !activeDeposit
        );
        if (pending && !activeDeposit) {
          setActiveDeposit(pending);
        }
      }
    } catch (err) {
      console.error('Failed to load deposit history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchDepositHistory();
  }, [token]);

  const handleCreateDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isStoreClosed) {
      showToast(settings?.closeReason || 'Toko sedang tutup. Tidak dapat melakukan deposit.', 'error');
      return;
    }

    const amountNum = parseInt(nominal.replace(/\D/g, ''), 10);
    if (isNaN(amountNum) || amountNum < minDeposit) {
      showToast(`Nominal deposit minimal Rp${minDeposit.toLocaleString('id-ID')}`, 'warning');
      return;
    }

    if (!payerName.trim()) {
      showToast('Nama pengguna / pengirim wajib diisi', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/deposits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: amountNum,
          payerName: payerName.trim(),
          paymentMethod,
          proofNote,
        }),
      });
      const data = await res.json();
      setIsSubmitting(false);

      if (res.ok) {
        setActiveDeposit(data.deposit);
        showToast('Konfirmasi berhasil! Silakan selesaikan pembayaran via QRIS / DANA.', 'success');
        fetchDepositHistory();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        showToast(data.error || 'Gagal membuat deposit', 'error');
      }
    } catch {
      setIsSubmitting(false);
      showToast('Koneksi ke server terputus', 'error');
    }
  };

  const handleConfirmPaid = async () => {
    if (!activeDeposit) return;
    setIsConfirmingPaid(true);
    try {
      const res = await fetch(`/api/deposits/${activeDeposit.id}/confirm-paid`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setIsConfirmingPaid(false);

      if (res.ok) {
        showToast('Terima kasih! Bukti transfer Anda sedang diverifikasi admin.', 'success');
        fetchDepositHistory();
        refreshUser();
      } else {
        showToast(data.error || 'Gagal mengonfirmasi pembayaran', 'error');
      }
    } catch {
      setIsConfirmingPaid(false);
      showToast('Gagal menghubungi server', 'error');
    }
  };

  const copyToClipboard = (text: string, type: 'dana' | 'amount') => {
    navigator.clipboard.writeText(text);
    if (type === 'dana') {
      setCopiedDana(true);
      setTimeout(() => setCopiedDana(false), 2000);
    } else {
      setCopiedAmount(true);
      setTimeout(() => setCopiedAmount(false), 2000);
    }
    showToast('Tersalin ke papan klip!', 'info');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>APPROVED</span>
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5" />
            <span>REJECTED</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
            <Clock className="w-3.5 h-3.5" />
            <span>MENUNGGU APPROVAL</span>
          </span>
        );
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-purple-600 mb-1">
          <CreditCard className="w-4 h-4" />
          <span>ISI SALDO / TOP UP</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-purple-950 tracking-tight font-['Poppins',sans-serif]">
          Isi Saldo AZRYLSTORE
        </h1>
        <p className="text-xs sm:text-sm text-purple-800/70 mt-1 font-medium">
          Minimal deposit <strong className="text-purple-950">Rp{minDeposit.toLocaleString('id-ID')}</strong>.
          Pembayaran mudah dan aman via QRIS otomatis & transfer DANA.
        </p>
      </div>

      {/* Store Closed Warning Banner */}
      {isStoreClosed && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3 shadow-sm">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-rose-900">Toko Sedang Tutup</h4>
            <p className="text-xs text-rose-700 mt-0.5">
              {settings?.closeReason || 'Layanan isi saldo sementara dinonaktifkan oleh admin. Silakan kembali lagi nanti.'}
            </p>
          </div>
        </div>
      )}

      {/* STEP 1: INITIAL FORM (QR and DANA are hidden here until confirmation) */}
      {!activeDeposit ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Side: Form Deposit */}
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-3xl border border-purple-200 bg-white/95 backdrop-blur-xl p-6 sm:p-7 shadow-md shadow-purple-900/5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-purple-950 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  <span>Formulir Isi Saldo</span>
                </h2>
                <span className="text-xs px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 font-bold">
                  Langkah 1 dari 2
                </span>
              </div>

              <form onSubmit={handleCreateDeposit} className="space-y-4">
                {/* Nominal Input */}
                <div>
                  <label className="block text-xs font-bold text-purple-900 mb-1.5">
                    Nominal Deposit (Min. Rp{minDeposit.toLocaleString('id-ID')})
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-purple-700">
                      Rp
                    </span>
                    <input
                      type="text"
                      required
                      disabled={isStoreClosed}
                      value={nominal}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setNominal(val);
                      }}
                      placeholder="Contoh: 5000"
                      className="w-full pl-12 pr-4 py-3 rounded-2xl bg-purple-50/50 border border-purple-200 focus:border-purple-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-base font-bold text-purple-950 placeholder:text-purple-300 transition-all disabled:opacity-50"
                    />
                  </div>

                  {/* Preset Chips */}
                  <div className="flex flex-wrap gap-2 mt-2.5">
                    {presets.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        disabled={isStoreClosed}
                        onClick={() => setNominal(preset.toString())}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all disabled:opacity-50 ${
                          nominal === preset.toString()
                            ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30'
                            : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
                        }`}
                      >
                        Rp{preset.toLocaleString('id-ID')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Nama Pengguna / Pengirim */}
                <div>
                  <label className="block text-xs font-bold text-purple-900 mb-1.5">
                    Nama Pengguna / Pengirim Transfer
                  </label>
                  <input
                    type="text"
                    required
                    disabled={isStoreClosed}
                    value={payerName}
                    onChange={(e) => setPayerName(e.target.value)}
                    placeholder="Masukkan nama Anda / pengirim"
                    className="w-full px-4 py-2.5 rounded-xl bg-purple-50/50 border border-purple-200 focus:border-purple-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-sm text-purple-950 placeholder:text-purple-300 transition-all disabled:opacity-50"
                  />
                </div>

                {/* Pilihan Metode Pembayaran */}
                <div>
                  <label className="block text-xs font-bold text-purple-900 mb-1.5">
                    Metode Pembayaran
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      disabled={isStoreClosed}
                      onClick={() => setPaymentMethod('QRIS')}
                      className={`flex items-center justify-center gap-2 p-3 rounded-2xl border text-xs font-bold transition-all disabled:opacity-50 ${
                        paymentMethod === 'QRIS'
                          ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/20'
                          : 'bg-purple-50/80 border-purple-200 text-purple-800 hover:bg-purple-100'
                      }`}
                    >
                      <QrCode className="w-4 h-4" />
                      <span>QRIS (Semua Bank/E-Wallet)</span>
                    </button>
                    <button
                      type="button"
                      disabled={isStoreClosed}
                      onClick={() => setPaymentMethod('DANA')}
                      className={`flex items-center justify-center gap-2 p-3 rounded-2xl border text-xs font-bold transition-all disabled:opacity-50 ${
                        paymentMethod === 'DANA'
                          ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/20'
                          : 'bg-purple-50/80 border-purple-200 text-purple-800 hover:bg-purple-100'
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>DANA Transfer</span>
                    </button>
                  </div>
                </div>

                {/* Catatan Tambahan (Opsional) */}
                <div>
                  <label className="block text-xs font-bold text-purple-900 mb-1.5">
                    Catatan Tambahan (Opsional)
                  </label>
                  <input
                    type="text"
                    disabled={isStoreClosed}
                    value={proofNote}
                    onChange={(e) => setProofNote(e.target.value)}
                    placeholder="Contoh: Transfer jam 14:30 via DANA"
                    className="w-full px-4 py-2 rounded-xl bg-purple-50/50 border border-purple-200 text-xs text-purple-950 placeholder:text-purple-300 transition-all disabled:opacity-50"
                  />
                </div>

                {/* Submit / Konfirmasi Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || isStoreClosed}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-sm font-bold text-white shadow-md shadow-purple-600/25 transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Memproses Permintaan...</span>
                    </>
                  ) : isStoreClosed ? (
                    <span>Toko Sedang Tutup</span>
                  ) : (
                    <>
                      <span>Konfirmasi & Tampilkan Pembayaran</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Right Side: Step-by-Step Info */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-3xl border border-purple-200 bg-white/95 p-6 shadow-md shadow-purple-900/5 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-purple-900 flex items-center gap-2">
                <Info className="w-4 h-4 text-purple-600" />
                <span>Cara Kerja Deposit:</span>
              </h3>

              <div className="space-y-3 text-xs text-purple-900/80 leading-relaxed">
                <div className="flex gap-3 items-start p-3 rounded-2xl bg-purple-50/60 border border-purple-100">
                  <span className="w-6 h-6 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    1
                  </span>
                  <div>
                    <strong className="text-purple-950 block">Isi Formulir & Konfirmasi</strong>
                    Masukkan nominal yang ingin Anda isi lalu tekan tombol "Konfirmasi & Tampilkan Pembayaran".
                  </div>
                </div>

                <div className="flex gap-3 items-start p-3 rounded-2xl bg-purple-50/60 border border-purple-100">
                  <span className="w-6 h-6 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    2
                  </span>
                  <div>
                    <strong className="text-purple-950 block">QR & DANA Ditampilkan</strong>
                    Barcode QRIS dan nomor rekening DANA penerima akan langsung muncul setelah Anda mengonfirmasi.
                  </div>
                </div>

                <div className="flex gap-3 items-start p-3 rounded-2xl bg-purple-50/60 border border-purple-100">
                  <span className="w-6 h-6 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    3
                  </span>
                  <div>
                    <strong className="text-purple-950 block">Klik "Saya Sudah Bayar"</strong>
                    Admin akan langsung memvalidasi pembayaran dan saldo otomatis ditambahkan ke akun Anda.
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>
                  AZRYLSTORE menjamin 100% keamanan transaksi saldo Anda dengan konfirmasi cepat admin 24/7.
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* STEP 2: PAYMENT DISPLAY (QR and DANA appear here after confirmation!) */
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-purple-200 bg-white/95 backdrop-blur-2xl p-6 sm:p-8 shadow-xl shadow-purple-900/10 space-y-6"
        >
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-purple-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 font-bold uppercase">
                  ID: {activeDeposit.id}
                </span>
                {getStatusBadge(activeDeposit.status)}
              </div>
              <h3 className="text-xl font-extrabold text-purple-950 mt-1">
                Instruksi Pembayaran Deposit
              </h3>
            </div>

            <button
              onClick={() => setActiveDeposit(null)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-purple-200 text-purple-700 hover:bg-purple-50 text-xs font-bold transition-colors self-start sm:self-auto"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Ganti Nominal / Batal</span>
            </button>
          </div>

          {/* Amount Box */}
          <div className="p-4 sm:p-5 rounded-2xl bg-purple-50/80 border border-purple-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-purple-700">Total yang harus ditransfer:</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-purple-950 font-['Poppins',sans-serif]">
                Rp{activeDeposit.amount.toLocaleString('id-ID')}
              </div>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(activeDeposit.amount.toString(), 'amount')}
              className="px-3 py-2 rounded-xl bg-white hover:bg-purple-100 border border-purple-200 text-purple-700 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
            >
              {copiedAmount ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Salin Nominal</span>
                </>
              )}
            </button>
          </div>

          {/* Toggle between QRIS & DANA */}
          <div className="flex gap-2 p-1 bg-purple-100/60 rounded-2xl w-fit">
            <button
              type="button"
              onClick={() => setPaymentMethod('QRIS')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                paymentMethod === 'QRIS'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-purple-800 hover:text-purple-950'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>Scan QRIS</span>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('DANA')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                paymentMethod === 'DANA'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-purple-800 hover:text-purple-950'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Transfer DANA</span>
            </button>
          </div>

          {/* Payment Method Content */}
          {paymentMethod === 'QRIS' ? (
            <div className="p-6 rounded-3xl bg-purple-50/40 border border-purple-200 text-center space-y-4">
              <div className="space-y-1">
                <h4 className="text-base font-bold text-purple-950 flex items-center justify-center gap-2">
                  <QrCode className="w-5 h-5 text-purple-600" />
                  <span>Scan Kode QRIS di Bawah Ini</span>
                </h4>
                <p className="text-xs text-purple-700 font-medium">
                  Buka aplikasi e-wallet / mobile banking Anda (GoPay, OVO, ShopeePay, DANA, BCA, Livin, dll)
                </p>
              </div>

              <div className="inline-block p-4 bg-white rounded-3xl border-2 border-purple-200 shadow-xl mx-auto">
                <img
                  src={qrImage}
                  alt="QRIS Pembayaran AZRYLSTORE"
                  className="w-56 h-56 sm:w-64 sm:h-64 object-contain rounded-2xl mx-auto"
                  referrerPolicy="no-referrer"
                />
              </div>

              <p className="text-xs font-semibold text-purple-800/80 max-w-sm mx-auto">
                Pastikan nominal transfer tepat sebesar <strong className="text-purple-950">Rp{activeDeposit.amount.toLocaleString('id-ID')}</strong>.
              </p>
            </div>
          ) : (
            <div className="p-6 rounded-3xl bg-purple-50/40 border border-purple-200 space-y-4">
              <h4 className="text-base font-bold text-purple-950 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-purple-600" />
                <span>Detail Transfer DANA</span>
              </h4>

              <div className="p-5 rounded-2xl bg-white border border-purple-200 space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-purple-700">Nomor Akun DANA:</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(danaNumber, 'dana')}
                    className="flex items-center gap-1 text-xs font-bold text-purple-700 hover:text-purple-950"
                  >
                    {copiedDana ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600">Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Nomor</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="text-2xl font-mono font-bold text-purple-950 tracking-wider">
                  {danaNumber}
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-purple-100 text-xs">
                  <span className="text-purple-600 font-medium">Atas Nama (A.N):</span>
                  <span className="font-extrabold text-purple-950 uppercase">{danaName}</span>
                </div>
              </div>

              <div className="text-xs text-purple-800/80 leading-relaxed p-3 bg-purple-100/60 rounded-xl">
                Buka aplikasi DANA &gt; Pilih Kirim &gt; Masukkan nomor di atas &gt; Masukkan nominal Rp{activeDeposit.amount.toLocaleString('id-ID')} &gt; Selesaikan transfer.
              </div>
            </div>
          )}

          {/* Action "Saya Sudah Bayar" */}
          <div className="space-y-3 pt-2">
            {activeDeposit.status === 'PENDING' ? (
              <button
                type="button"
                onClick={handleConfirmPaid}
                disabled={isConfirmingPaid}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 active:scale-98"
              >
                {isConfirmingPaid ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Memverifikasi Pembayaran...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Saya Sudah Bayar (Konfirmasi ke Admin)</span>
                  </>
                )}
              </button>
            ) : activeDeposit.status === 'APPROVED' ? (
              <div className="p-4 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-800 text-center font-bold text-sm flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Deposit telah disetujui! Saldo berhasil ditambahkan.</span>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-rose-100 border border-rose-300 text-rose-800 text-center font-bold text-sm flex items-center justify-center gap-2">
                <XCircle className="w-5 h-5 text-rose-600" />
                <span>Deposit ditolak oleh admin. Silakan buat deposit baru.</span>
              </div>
            )}
            <p className="text-[11px] text-center text-purple-700 font-medium">
              Setelah menekan "Saya Sudah Bayar", admin akan memverifikasi mutasi. Saldo akan otomatis bertambah!
            </p>
          </div>
        </motion.div>
      )}

      {/* Riwayat Deposit User */}
      <div className="rounded-3xl border border-purple-200 bg-white/95 backdrop-blur-xl p-6 sm:p-7 shadow-md shadow-purple-900/5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-600" />
            <h3 className="text-base font-bold text-purple-950">Riwayat Pengisian Saldo Anda</h3>
          </div>
          <button
            onClick={fetchDepositHistory}
            className="p-2 rounded-xl hover:bg-purple-100 text-purple-700 transition-colors"
            title="Muat Ulang"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {isLoadingHistory ? (
          <div className="py-8 text-center text-purple-600 text-xs">Memuat riwayat deposit...</div>
        ) : depositHistory.length === 0 ? (
          <div className="py-8 text-center text-purple-600 text-xs border border-dashed border-purple-200 rounded-2xl">
            Belum ada transaksi deposit.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-purple-100 text-purple-700 font-bold uppercase">
                <tr>
                  <th className="pb-3 pl-2">ID Deposit</th>
                  <th className="pb-3">Metode</th>
                  <th className="pb-3">Nama Pengirim</th>
                  <th className="pb-3">Nominal</th>
                  <th className="pb-3">Waktu</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-100 text-purple-950 font-medium">
                {depositHistory.map((dep) => (
                  <tr key={dep.id} className="hover:bg-purple-50/50 transition-colors">
                    <td className="py-3 pl-2 font-mono text-purple-700 font-bold">{dep.id}</td>
                    <td className="py-3 font-semibold">{dep.paymentMethod}</td>
                    <td className="py-3">{dep.payerName}</td>
                    <td className="py-3 font-bold text-emerald-600">
                      Rp{dep.amount.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 text-purple-800/70">
                      {new Date(dep.createdAt).toLocaleString('id-ID', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </td>
                    <td className="py-3">{getStatusBadge(dep.status)}</td>
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
