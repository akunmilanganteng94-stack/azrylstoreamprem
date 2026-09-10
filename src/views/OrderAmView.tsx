import React, { useState } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  Zap,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Mail,
  Plus,
  Minus,
  Wallet,
  ArrowRight,
  ShieldCheck,
  ExternalLink,
  Copy,
  Check,
  HelpCircle,
  Link as LinkIcon,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { Order } from '../types';

interface OrderAmViewProps {
  onGoToHistory: () => void;
  onGoToDeposit: () => void;
}

export const OrderAmView: React.FC<OrderAmViewProps> = ({ onGoToHistory, onGoToDeposit }) => {
  const { user, token, settings, refreshUser } = useAuth();
  const { showToast } = useToast();

  const isStoreClosed = settings?.isStoreOpen === false;
  const priceEceran = settings?.priceEceran ?? 300;
  const priceBulk = settings?.priceBulk ?? 400;
  const bulkMin = settings?.bulkMin ?? 1;
  const bulkMax = settings?.bulkMax ?? 5;
  const amPhotoUrl = settings?.amPhoto || 'https://cdn.phototourl.com/free/2026-09-10-6e54e472-9822-4fa7-91a2-e40f8ed111ac.jpg';

  const [activeTab, setActiveTab] = useState<'eceran' | 'bulk'>('eceran');

  // Eceran Flow State:
  const [eceranStep, setEceranStep] = useState<'input_email' | 'enter_verify' | 'success'>('input_email');
  const [eceranGmail, setEceranGmail] = useState('');
  const [showEceranModal, setShowEceranModal] = useState(false);
  const [isProcessingEceran, setIsProcessingEceran] = useState(false);
  const [activeEceranOrder, setActiveEceranOrder] = useState<Order | null>(null);

  // Link Verification Input for Step 3
  const [verifLinkInput, setVerifLinkInput] = useState('');
  const [isSubmittingLink, setIsSubmittingLink] = useState(false);
  const [copiedResult, setCopiedResult] = useState(false);

  // Bulk Form State
  const [bulkQuantity, setBulkQuantity] = useState(1);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);
  const [completedBulkOrder, setCompletedBulkOrder] = useState<Order | null>(null);

  const userBalance = user?.balance ?? 0;

  // Trigger celebration confetti
  const triggerConfetti = () => {
    confetti({
      particleCount: 90,
      spread: 75,
      origin: { y: 0.6 },
      colors: ['#9333ea', '#7c3aed', '#6366f1', '#10b981'],
    });
  };

  // --- STEP 1: INPUT EMAIL & VALIDATION ---
  const handleOpenEceranConfirmation = (e: React.FormEvent) => {
    e.preventDefault();
    if (isStoreClosed) {
      showToast(settings?.closeReason || 'Toko sedang tutup. Tidak dapat melakukan pesanan.', 'error');
      return;
    }
    if (!eceranGmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(eceranGmail.trim())) {
      showToast('Masukkan alamat Gmail yang valid', 'warning');
      return;
    }
    if (userBalance < priceEceran) {
      showToast(
        `Saldo tidak mencukupi. Saldo Anda Rp${userBalance.toLocaleString('id-ID')}, dibutuhkan Rp${priceEceran.toLocaleString('id-ID')}`,
        'error'
      );
      return;
    }
    setShowEceranModal(true);
  };

  // --- STEP 2: KONFIRMASI & POTONG SALDO ---
  const handleConfirmEceranOrder = async () => {
    setIsProcessingEceran(true);
    try {
      const res = await fetch('/api/orders/eceran', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          gmail: eceranGmail.trim(),
        }),
      });
      const data = await res.json();
      setIsProcessingEceran(false);
      setShowEceranModal(false);
      refreshUser();

      if (res.ok) {
        setActiveEceranOrder(data.order);
        showToast('Saldo Rp300 berhasil dipotong! Silakan masukkan link verifikasi.', 'success');
        setEceranStep('enter_verify');
        setVerifLinkInput('');
      } else {
        showToast(data.error || 'Pesanan gagal diproses', 'error');
      }
    } catch {
      setIsProcessingEceran(false);
      showToast('Terjadi gangguan jaringan saat memproses pesanan', 'error');
    }
  };

  // --- STEP 3: SUBMIT VERIFICATION LINK ---
  const handleSubmitVerificationLink = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeEceranOrder) {
      showToast('Data pesanan tidak ditemukan', 'error');
      return;
    }
    if (!verifLinkInput.trim()) {
      showToast('Silakan tempelkan link verifikasi dari Alight Motion', 'warning');
      return;
    }

    setIsSubmittingLink(true);
    try {
      const res = await fetch(`/api/orders/${activeEceranOrder.id}/submit-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ link: verifLinkInput.trim() }),
      });
      const data = await res.json();
      setIsSubmittingLink(false);

      if (res.ok) {
        showToast(data.message || 'Verifikasi sukses! Akun Premium telah aktif.', 'success');
        triggerConfetti();
        setActiveEceranOrder(data.order);
        setEceranStep('success');
        refreshUser();
      } else {
        showToast(data.error || 'Link verifikasi gagal atau kedaluwarsa', 'error');
      }
    } catch {
      setIsSubmittingLink(false);
      showToast('Gagal menghubungi server untuk verifikasi', 'error');
    }
  };

  const handleResetEceran = () => {
    setEceranStep('input_email');
    setEceranGmail('');
    setVerifLinkInput('');
    setActiveEceranOrder(null);
  };

  // --- BULK HANDLERS ---
  const bulkTotalPrice = bulkQuantity * priceBulk;

  const handleOpenBulkConfirmation = () => {
    if (isStoreClosed) {
      showToast(settings?.closeReason || 'Toko sedang tutup.', 'error');
      return;
    }
    if (userBalance < bulkTotalPrice) {
      showToast(
        `Saldo Anda Rp${userBalance.toLocaleString('id-ID')}, dibutuhkan Rp${bulkTotalPrice.toLocaleString('id-ID')}`,
        'error'
      );
      return;
    }
    setShowBulkModal(true);
  };

  const handleConfirmBulkOrder = async () => {
    setIsProcessingBulk(true);
    try {
      const res = await fetch('/api/orders/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          quantity: bulkQuantity,
        }),
      });
      const data = await res.json();
      setIsProcessingBulk(false);
      setShowBulkModal(false);
      refreshUser();

      if (res.ok) {
        if (data.warning) {
          showToast(data.message, 'warning');
        } else {
          showToast(data.message, 'success');
          triggerConfetti();
        }
        setCompletedBulkOrder(data.order);
      } else {
        showToast(data.error || 'Pesanan bulk gagal diproses', 'error');
      }
    } catch {
      setIsProcessingBulk(false);
      showToast('Terjadi gangguan jaringan saat memproses bulk', 'error');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedResult(true);
    setTimeout(() => setCopiedResult(false), 2000);
    showToast('Tersalin ke papan klip!', 'info');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Header & Balance Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-purple-100">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-purple-600 mb-1">
            <Sparkles className="w-4 h-4" />
            <span>LAYANAN ALIGHT MOTION PREMIUM</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-purple-950 tracking-tight font-['Poppins',sans-serif]">
            Order Alight Motion Premium
          </h1>
          <p className="text-xs sm:text-sm text-purple-800/70 mt-1 font-medium">
            Pilih layanan eceran langsung via Gmail Anda atau pesanan akun bulk instan.
          </p>
        </div>

        {/* User Balance Badge */}
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-purple-200 shadow-sm self-start sm:self-auto">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider block">
              SALDO ANDA
            </span>
            <span className="text-base font-extrabold text-purple-950 font-['Poppins',sans-serif]">
              Rp{userBalance.toLocaleString('id-ID')}
            </span>
          </div>
          <button
            onClick={onGoToDeposit}
            className="ml-2 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-xs font-bold text-white transition-all shadow-sm active:scale-95"
          >
            + Isi Saldo
          </button>
        </div>
      </div>

      {/* AM Photo Banner */}
      <div className="rounded-3xl border border-purple-200 bg-white p-4 shadow-sm flex items-center gap-4">
        <img
          src={amPhotoUrl}
          alt="Alight Motion Preview"
          className="w-20 h-20 rounded-2xl object-cover border border-purple-200 shadow-sm shrink-0"
          referrerPolicy="no-referrer"
        />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 font-bold uppercase">
              Resmi & Bergaransi
            </span>
          </div>
          <h3 className="text-base font-bold text-purple-950 mt-1">Alight Motion Premium Pro</h3>
          <p className="text-xs text-purple-700 mt-0.5">
            Fitur lengkap tanpa watermark, ekspor XML preset, dan semua efek editing terbuka.
          </p>
        </div>
      </div>

      {/* Store Closed Banner */}
      {isStoreClosed && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3 shadow-sm">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-rose-900">Toko Sedang Tutup</h4>
            <p className="text-xs text-rose-700 mt-0.5">
              {settings?.closeReason || 'Layanan order sementara dinonaktifkan oleh admin. Anda tidak dapat melakukan order saat ini.'}
            </p>
          </div>
        </div>
      )}

      {/* Tabs Switcher */}
      <div className="flex p-1.5 rounded-2xl bg-purple-100/70 border border-purple-200 max-w-md mx-auto">
        <button
          onClick={() => setActiveTab('eceran')}
          className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'eceran'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25'
              : 'text-purple-800 hover:text-purple-950'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>AM PREMIUM ECERAN</span>
        </button>
        <button
          onClick={() => setActiveTab('bulk')}
          className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'bulk'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25'
              : 'text-purple-800 hover:text-purple-950'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>AM PREMIUM BULK</span>
        </button>
      </div>

      {/* PRODUCT 1: AM PREMIUM ECERAN */}
      {activeTab === 'eceran' && (
        <div>
          {/* STEP 1: MASUKKAN EMAIL */}
          {eceranStep === 'input_email' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-12 gap-6"
            >
              {/* Form Card */}
              <div className="md:col-span-7 rounded-3xl border border-purple-200 bg-white/95 backdrop-blur-xl p-6 sm:p-8 shadow-md shadow-purple-900/5 space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
                      PRODUK 1
                    </span>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-purple-950 mt-1.5">
                      AM PREMIUM ECERAN
                    </h2>
                    <p className="text-xs text-purple-800/70 mt-1">
                      Aktivasi / verifikasi AM Premium langsung ke akun Gmail pribadi Anda.
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 font-['Poppins',sans-serif]">
                      Rp{priceEceran.toLocaleString('id-ID')}
                    </span>
                    <span className="text-[11px] text-purple-700/70 font-semibold block">/ akun</span>
                  </div>
                </div>

                <form onSubmit={handleOpenEceranConfirmation} className="space-y-4 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-purple-950 mb-1.5">
                      1. Masukkan Email Gmail Anda
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500" />
                      <input
                        type="email"
                        required
                        disabled={isStoreClosed}
                        value={eceranGmail}
                        onChange={(e) => setEceranGmail(e.target.value)}
                        placeholder="contoh: akunanda@gmail.com"
                        className="w-full pl-10 pr-4 py-3 rounded-2xl bg-purple-50/50 border border-purple-200 focus:border-purple-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-sm text-purple-950 placeholder:text-purple-300 font-medium transition-all disabled:opacity-50"
                      />
                    </div>
                    <p className="text-[11px] text-purple-700/80 mt-1.5 font-medium">
                      Pastikan email aktif dan bisa membuka aplikasi Gmail untuk melihat tautan verifikasi.
                    </p>
                  </div>

                  {/* Balance Status */}
                  {userBalance < priceEceran ? (
                    <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                        <span>Saldo Anda Rp{userBalance.toLocaleString('id-ID')} (Kurang Rp{(priceEceran - userBalance).toLocaleString('id-ID')})</span>
                      </div>
                      <button
                        type="button"
                        onClick={onGoToDeposit}
                        className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-bold hover:bg-rose-700 transition-colors"
                      >
                        Top Up
                      </button>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 text-purple-900 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                      <span>Saldo mencukupi. Sisa saldo setelah order: <strong>Rp{(userBalance - priceEceran).toLocaleString('id-ID')}</strong></span>
                    </div>
                  )}

                  {/* Next button */}
                  <button
                    type="submit"
                    disabled={userBalance < priceEceran || isStoreClosed}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white font-bold text-sm shadow-md shadow-purple-600/25 transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
                  >
                    <span>Lanjutkan ke Konfirmasi (Rp{priceEceran.toLocaleString('id-ID')})</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </div>

              {/* Info Guide */}
              <div className="md:col-span-5 rounded-3xl border border-purple-200 bg-white/95 p-6 shadow-md shadow-purple-900/5 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-purple-950 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                  <span>Alur Order AM Eceran:</span>
                </h3>

                <div className="space-y-3 text-xs text-purple-900/80 leading-relaxed">
                  <div className="flex gap-3 items-start p-3 rounded-2xl bg-purple-50/70 border border-purple-100">
                    <span className="w-6 h-6 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      1
                    </span>
                    <div>
                      <strong className="text-purple-950 block">Masukkan Email</strong>
                      Input email Gmail yang ingin Anda daftarkan ke AM Premium.
                    </div>
                  </div>

                  <div className="flex gap-3 items-start p-3 rounded-2xl bg-purple-50/70 border border-purple-100">
                    <span className="w-6 h-6 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      2
                    </span>
                    <div>
                      <strong className="text-purple-950 block">Konfirmasi & Potong Saldo</strong>
                      Saldo Rp300 dipotong dan sistem meminta verifikasi untuk Gmail Anda.
                    </div>
                  </div>

                  <div className="flex gap-3 items-start p-3 rounded-2xl bg-purple-50/70 border border-purple-100">
                    <span className="w-6 h-6 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      3
                    </span>
                    <div>
                      <strong className="text-purple-950 block">Masukkan Link Verify</strong>
                      Buka email dari Alight Motion, salin link verifikasi dan tempel di formulir untuk aktivasi!
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                  <strong>Jaminan Keamanan:</strong> Jika link tidak valid atau verifikasi gagal, saldo otomatis dikembalikan (refund) tanpa potongan.
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3: TAMPILAN MASUKKAN VERIFY */}
          {eceranStep === 'enter_verify' && activeEceranOrder && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-2xl mx-auto rounded-3xl border-2 border-purple-300 bg-white p-6 sm:p-8 shadow-xl shadow-purple-900/10 space-y-6"
            >
              {/* Top Banner Notice */}
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-900">
                  <h4 className="font-bold text-sm text-emerald-950">
                    Saldo Rp{priceEceran.toLocaleString('id-ID')} Berhasil Dipotong!
                  </h4>
                  <p className="mt-0.5 text-emerald-800">
                    Pesanan Anda <span className="font-mono font-bold">{activeEceranOrder.id}</span> sedang berjalan. Sistem telah meminta link verifikasi untuk email:
                  </p>
                  <div className="mt-1 px-3 py-1 bg-white rounded-lg border border-emerald-300 inline-block font-mono font-bold text-purple-950">
                    {activeEceranOrder.gmail}
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="p-5 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-3">
                <h3 className="text-sm font-bold text-purple-950 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-purple-600" />
                  <span>Langkah Masukkan Verify:</span>
                </h3>
                <ol className="space-y-2 text-xs text-purple-900/90 list-decimal list-inside leading-relaxed font-medium">
                  <li>
                    Buka aplikasi <strong>Gmail</strong> di HP / browser Anda untuk akun <strong className="text-purple-950">{activeEceranOrder.gmail}</strong>.
                  </li>
                  <li>
                    Cari email masuk dari <strong>Alight Motion</strong> / <strong>Alight Creative</strong> (Periksa juga tab <em>Spam</em> atau <em>Promosi</em>).
                  </li>
                  <li>
                    Tekan dan tahan tombol/link verifikasi di email tersebut, lalu pilih <strong>"Salin Alamat Link" (Copy Link)</strong>.
                  </li>
                  <li>
                    Tempelkan link verifikasi tersebut pada kotak di bawah ini, lalu klik <strong>"Kirim & Aktivasi Akun"</strong>.
                  </li>
                </ol>
              </div>

              {/* Form Input Verify */}
              <form onSubmit={handleSubmitVerificationLink} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-purple-950 mb-1.5 flex items-center justify-between">
                    <span>Tempelkan Link Verifikasi Alight Motion Di Sini:</span>
                    <span className="text-[10px] text-purple-600 font-bold">Wajib diisi</span>
                  </label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500" />
                    <input
                      type="url"
                      required
                      value={verifLinkInput}
                      onChange={(e) => setVerifLinkInput(e.target.value)}
                      placeholder="https://alight-creative.firebaseapp.com/__/auth/links?link=..."
                      className="w-full pl-10 pr-4 py-3 rounded-2xl bg-purple-50/50 border border-purple-200 focus:border-purple-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-xs sm:text-sm text-purple-950 placeholder:text-purple-300 font-mono transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingLink || !verifLinkInput.trim()}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white font-bold text-sm shadow-lg shadow-purple-600/25 transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
                >
                  {isSubmittingLink ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Sedang Mengaktifkan Akun Premium...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5" />
                      <span>Kirim & Aktivasi Akun Sekarang</span>
                    </>
                  )}
                </button>
              </form>

              {/* Assistance & Cancel/Reset */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-purple-100 text-xs">
                <button
                  type="button"
                  onClick={handleResetEceran}
                  className="inline-flex items-center gap-1.5 text-purple-700 hover:text-purple-950 font-bold transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Ganti Email / Order Ulang</span>
                </button>
                <a
                  href={`https://wa.me/${(settings?.waAdmin || '6285199219856').replace(/\D/g, '')}?text=${encodeURIComponent(
                    `Halo Admin AZRYLSTORE, saya butuh bantuan verifikasi order AM Eceran ${activeEceranOrder.id} untuk email ${activeEceranOrder.gmail}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700 font-bold"
                >
                  <HelpCircle className="w-4 h-4" />
                  <span>Email belum masuk? Hubungi Admin</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </motion.div>
          )}

          {/* STEP 4: SUCCESS VIEW */}
          {eceranStep === 'success' && activeEceranOrder && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-xl mx-auto rounded-3xl border-2 border-emerald-300 bg-white p-6 sm:p-8 shadow-2xl shadow-emerald-600/10 text-center space-y-6"
            >
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <span className="text-xs px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold uppercase tracking-wider">
                  SUKSES DIAKTIFKAN
                </span>
                <h2 className="text-2xl font-extrabold text-purple-950 mt-2 font-['Poppins',sans-serif]">
                  Akun AM Premium Telah Aktif!
                </h2>
                <p className="text-xs sm:text-sm text-purple-800/80 mt-1">
                  Selamat! Layanan Alight Motion Premium untuk akun <strong className="text-purple-950">{activeEceranOrder.gmail}</strong> siap digunakan.
                </p>
              </div>

              {/* Result Credentials Card */}
              <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 text-left space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-purple-900">Detail Hasil Pesanan:</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(activeEceranOrder.result || '')}
                    className="inline-flex items-center gap-1 text-purple-700 hover:text-purple-950 font-bold"
                  >
                    {copiedResult ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedResult ? 'Tersalin' : 'Salin Data'}</span>
                  </button>
                </div>
                <div className="p-3 rounded-xl bg-white border border-purple-200 font-mono text-xs text-purple-950 whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {activeEceranOrder.result || `Aktivasi AM Premium sukses untuk ${activeEceranOrder.gmail}`}
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleResetEceran}
                  className="px-5 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95"
                >
                  Pesan Lagi
                </button>
                <button
                  type="button"
                  onClick={onGoToHistory}
                  className="px-5 py-3 rounded-2xl bg-purple-100 hover:bg-purple-200 text-purple-900 font-bold text-xs sm:text-sm transition-all"
                >
                  Lihat Riwayat Pesanan
                </button>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* PRODUCT 2: AM PREMIUM BULK */}
      {activeTab === 'bulk' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-12 gap-6"
        >
          {/* Bulk Form */}
          <div className="md:col-span-7 rounded-3xl border border-purple-200 bg-white/95 backdrop-blur-xl p-6 sm:p-8 shadow-md shadow-purple-900/5 space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
                  PRODUK 2
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-purple-950 mt-1.5">
                  AM PREMIUM BULK
                </h2>
                <p className="text-xs text-purple-800/70 mt-1">
                  Pesan akun Alight Motion Premium siap pakai secara instan dalam jumlah banyak.
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 font-['Poppins',sans-serif]">
                  Rp{priceBulk.toLocaleString('id-ID')}
                </span>
                <span className="text-[11px] text-purple-700/70 font-semibold block">/ akun</span>
              </div>
            </div>

            <div className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-purple-950 mb-1.5">
                  Jumlah Akun ({bulkMin} - {bulkMax} akun per transaksi)
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={bulkQuantity <= bulkMin || isStoreClosed}
                    onClick={() => setBulkQuantity((prev) => Math.max(bulkMin, prev - 1))}
                    className="w-12 h-12 rounded-2xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 flex items-center justify-center font-bold transition-all disabled:opacity-40"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <div className="flex-1 py-3 text-center rounded-2xl bg-purple-50/50 border border-purple-200 font-extrabold text-xl text-purple-950 font-['Poppins',sans-serif]">
                    {bulkQuantity} Akun
                  </div>
                  <button
                    type="button"
                    disabled={bulkQuantity >= bulkMax || isStoreClosed}
                    onClick={() => setBulkQuantity((prev) => Math.min(bulkMax, prev + 1))}
                    className="w-12 h-12 rounded-2xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 flex items-center justify-center font-bold transition-all disabled:opacity-40"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Price Calculation Box */}
              <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 space-y-2">
                <div className="flex items-center justify-between text-xs text-purple-800">
                  <span>Harga per akun:</span>
                  <span className="font-bold text-purple-950">Rp{priceBulk.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex items-center justify-between text-sm font-bold text-purple-950 pt-2 border-t border-purple-200">
                  <span>Total Harga:</span>
                  <span className="text-xl text-emerald-600 font-['Poppins',sans-serif]">
                    Rp{bulkTotalPrice.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-purple-700">
                  <span>Saldo Anda:</span>
                  <span>Rp{userBalance.toLocaleString('id-ID')}</span>
                </div>
              </div>

              {/* Balance Check */}
              {userBalance < bulkTotalPrice ? (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>Saldo tidak mencukupi</span>
                  </div>
                  <button
                    type="button"
                    onClick={onGoToDeposit}
                    className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-bold hover:bg-rose-700 transition-colors"
                  >
                    + Isi Saldo
                  </button>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 text-purple-900 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>Saldo mencukupi untuk pembelian bulk ini.</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleOpenBulkConfirmation}
                disabled={userBalance < bulkTotalPrice || isStoreClosed}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-sm shadow-md shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
              >
                <span>Konfirmasi & Potong Saldo (Rp{bulkTotalPrice.toLocaleString('id-ID')})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Bulk Information */}
          <div className="md:col-span-5 rounded-3xl border border-purple-200 bg-white/95 p-6 shadow-md shadow-purple-900/5 space-y-4">
            <h3 className="text-sm font-bold text-purple-950 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Ketentuan AM Premium Bulk:</span>
            </h3>

            <ul className="space-y-3 text-xs text-purple-900/80 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-600 mt-1.5 shrink-0" />
                <span>Pesan 1 hingga 5 akun sekaligus dalam satu kali klik.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-600 mt-1.5 shrink-0" />
                <span>Akun yang selesai diproses otomatis disimpan pada <strong>Riwayat Pesanan</strong>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-600 mt-1.5 shrink-0" />
                <span>Data akun dapat disalin langsung berupa email & password siap pakai.</span>
              </li>
            </ul>
          </div>
        </motion.div>
      )}

      {/* Confirmation Modal - Eceran */}
      <ConfirmationModal
        isOpen={showEceranModal}
        onClose={() => !isProcessingEceran && setShowEceranModal(false)}
        onConfirm={handleConfirmEceranOrder}
        title="Konfirmasi Pesanan AM Eceran"
        description="Saldo Anda akan dipotong untuk memulai aktivasi AM Premium."
        confirmText="Konfirmasi & Potong Saldo"
        cancelText="Batal"
        isLoading={isProcessingEceran}
      >
        <div className="space-y-3 p-4 rounded-2xl bg-purple-50 border border-purple-200 text-xs text-purple-950">
          <div className="flex justify-between">
            <span className="text-purple-700">Layanan:</span>
            <span className="font-bold">AM Premium Eceran</span>
          </div>
          <div className="flex justify-between">
            <span className="text-purple-700">Email Target:</span>
            <span className="font-mono font-bold">{eceranGmail}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-purple-700">Biaya:</span>
            <span className="font-bold text-emerald-600 text-sm">Rp{priceEceran.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-purple-200">
            <span className="text-purple-700">Saldo saat ini:</span>
            <span>Rp{userBalance.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between font-bold text-sm text-purple-950">
            <span>Sisa Saldo:</span>
            <span className="text-emerald-600">Rp{(userBalance - priceEceran).toLocaleString('id-ID')}</span>
          </div>
        </div>
      </ConfirmationModal>

      {/* Confirmation Modal - Bulk */}
      <ConfirmationModal
        isOpen={showBulkModal}
        onClose={() => !isProcessingBulk && setShowBulkModal(false)}
        onConfirm={handleConfirmBulkOrder}
        title="Konfirmasi Pesanan Bulk"
        description="Periksa kembali jumlah akun dan total biaya yang akan dipotong dari saldo."
        confirmText="Konfirmasi & Potong Saldo"
        cancelText="Batal"
        isLoading={isProcessingBulk}
      >
        <div className="space-y-3 p-4 rounded-2xl bg-purple-50 border border-purple-200 text-xs text-purple-950">
          <div className="flex justify-between">
            <span className="text-purple-700">Layanan:</span>
            <span className="font-bold">AM Premium Bulk</span>
          </div>
          <div className="flex justify-between">
            <span className="text-purple-700">Jumlah:</span>
            <span className="font-bold">{bulkQuantity} Akun</span>
          </div>
          <div className="flex justify-between">
            <span className="text-purple-700">Total Biaya:</span>
            <span className="font-bold text-emerald-600 text-sm">Rp{bulkTotalPrice.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-purple-200">
            <span className="text-purple-700">Saldo saat ini:</span>
            <span>Rp{userBalance.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between font-bold text-sm text-purple-950">
            <span>Sisa Saldo:</span>
            <span className="text-emerald-600">Rp{(userBalance - bulkTotalPrice).toLocaleString('id-ID')}</span>
          </div>
        </div>
      </ConfirmationModal>

      {/* Completed Bulk Order Modal */}
      {completedBulkOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/60 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-3xl border border-purple-200 bg-white p-6 shadow-2xl space-y-4 text-purple-950">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Pesanan Bulk Berhasil Diproses!</h3>
                <p className="text-xs text-purple-700 font-mono">Order ID: {completedBulkOrder.id}</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 text-xs space-y-2">
              <div className="flex items-center justify-between text-purple-900">
                <span className="font-bold">Hasil Akun Bulk:</span>
                {completedBulkOrder.result && (
                  <button
                    onClick={() => copyToClipboard(completedBulkOrder.result || '')}
                    className="flex items-center gap-1 text-purple-700 hover:text-purple-950 font-bold"
                  >
                    {copiedResult ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedResult ? 'Tersalin' : 'Salin Akun'}</span>
                  </button>
                )}
              </div>
              <div className="p-3 rounded-xl bg-white border border-purple-200 font-mono text-xs text-purple-950 whitespace-pre-wrap max-h-48 overflow-y-auto">
                {completedBulkOrder.result || 'Akun siap digunakan.'}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setCompletedBulkOrder(null)}
                className="px-4 py-2.5 rounded-xl border border-purple-200 hover:bg-purple-50 text-xs font-bold text-purple-800 transition-colors"
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  setCompletedBulkOrder(null);
                  onGoToHistory();
                }}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-xs font-bold text-white transition-all shadow-sm"
              >
                Buka Riwayat Pesanan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
