import React from 'react';
import { motion } from 'motion/react';
import {
  Sparkles,
  Zap,
  ShieldCheck,
  Headphones,
  CheckCircle2,
  ChevronRight,
  ShoppingBag,
  CreditCard,
  Users,
  HelpCircle,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LandingViewProps {
  onOpenAuth?: (mode: 'login' | 'register') => void;
  onOpenLogin?: () => void;
  onOpenRegister?: () => void;
  onExplore?: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  onOpenAuth,
  onOpenLogin,
  onOpenRegister,
  onExplore,
}) => {
  const { settings } = useAuth();
  const priceEceran = settings?.priceEceran ?? 300;
  const priceBulk = settings?.priceBulk ?? 400;
  const amPhotoUrl = settings?.amPhoto || 'https://cdn.phototourl.com/free/2026-09-10-6e54e472-9822-4fa7-91a2-e40f8ed111ac.jpg';

  const handleOpenAuth = (mode: 'login' | 'register') => {
    if (typeof onOpenAuth === 'function') {
      try {
        onOpenAuth(mode);
        return;
      } catch (err) {
        console.error('Error in onOpenAuth:', err);
      }
    }
    if (mode === 'register' && typeof onOpenRegister === 'function') {
      try {
        onOpenRegister();
        return;
      } catch (err) {
        console.error('Error in onOpenRegister:', err);
      }
    }
    if (typeof onOpenLogin === 'function') {
      try {
        onOpenLogin();
        return;
      } catch (err) {
        console.error('Error in onOpenLogin:', err);
      }
    }
  };

  const handleExplore = () => {
    if (typeof onExplore === 'function') {
      try {
        onExplore();
        return;
      } catch (err) {
        console.error('Error in onExplore:', err);
      }
    }
    handleOpenAuth('login');
  };

  const faqs = [
    {
      q: 'Apa itu layanan AM Premium di AZRYLSTORE?',
      a: 'AZRYLSTORE menyediakan layanan aktivasi akun Alight Motion (AM) Premium resmi baik satuan (eceran) maupun borongan (bulk) dengan harga sangat murah dan sistem verifikasi otomatis.',
    },
    {
      q: 'Berapa minimal isi saldo / deposit?',
      a: 'Minimal deposit hanya Rp1.000 melalui QRIS atau transfer DANA. Saldo diproses dan diverifikasi oleh admin dengan cepat.',
    },
    {
      q: 'Bagaimana jika proses verifikasi API mengalami kendala?',
      a: 'Sistem AZRYLSTORE dilengkapi proteksi saldo: jika API eksternal gagal memproses aktivasi, saldo Anda tidak hilang dan langsung dikembalikan (auto-refund) ke akun Anda.',
    },
    {
      q: 'Apakah bisa order banyak akun sekaligus?',
      a: 'Bisa! Kami memiliki produk AM Premium Bulk yang mendukung pembuatan hingga 5 akun sekaligus per satu kali klik.',
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden pb-20">
      {/* Background Subtle Gradient Blobs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-96 bg-purple-200/40 rounded-full blur-[100px] pointer-events-none -z-10" />
      <div className="absolute top-1/3 -left-32 w-80 h-80 bg-indigo-200/30 rounded-full blur-[90px] pointer-events-none -z-10" />
      <div className="absolute top-2/3 -right-32 w-80 h-80 bg-purple-200/40 rounded-full blur-[90px] pointer-events-none -z-10" />

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-16 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-200 bg-white text-xs font-bold text-purple-700 mb-6 shadow-sm"
        >
          <Sparkles className="w-4 h-4 text-purple-600" />
          <span>Layanan Alight Motion Premium #1 Terpercaya</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight font-['Poppins',sans-serif] leading-tight sm:leading-none max-w-4xl mx-auto text-purple-950"
        >
          <span>AZRYLSTORE</span>
          <br />
          <span className="text-purple-600 text-3xl sm:text-5xl lg:text-6xl block mt-2">
            AM Premium Cepat, Mudah & Terjangkau
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-6 text-base sm:text-lg text-purple-800/80 max-w-2xl mx-auto leading-relaxed font-medium"
        >
          Marketplace digital otomatis untuk aktivasi Alight Motion Premium eceran & bulk.
          Mulai dari <strong className="text-purple-900 font-bold">Rp300/akun</strong> dengan sistem saldo aman,
          garansi akun, dan dukungan admin 24 jam.
        </motion.p>

        {/* Official AM Photo Showcase Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="mt-8 max-w-md mx-auto overflow-hidden rounded-3xl border-2 border-purple-300 shadow-xl shadow-purple-900/10 bg-white p-2"
        >
          <img
            src={amPhotoUrl}
            alt="Foto Alight Motion Premium AZRYLSTORE"
            className="w-full h-auto rounded-2xl object-cover"
            referrerPolicy="no-referrer"
          />
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5"
        >
          <button
            onClick={() => handleOpenAuth('register')}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-base shadow-md shadow-purple-600/25 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
          >
            <span>Mulai Sekarang</span>
            <ArrowRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleOpenAuth('login')}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl border border-purple-200 bg-white hover:bg-purple-50 text-purple-900 font-bold text-base transition-all shadow-sm active:scale-95"
          >
            Masuk / Login
          </button>
        </motion.div>
      </div>

      {/* Product Showcase Cards */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 sm:mt-24 relative z-10">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-purple-950 font-['Poppins',sans-serif]">
            Pilihan Produk Unggulan
          </h2>
          <p className="text-xs sm:text-sm text-purple-700 mt-1 font-medium">
            Pilih paket yang sesuai dengan kebutuhan editing dan proyek video Anda.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Product 1: Eceran */}
          <motion.div
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
            className="relative rounded-3xl border border-purple-200 bg-white p-6 sm:p-8 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
          >
            <div className="absolute top-0 right-0 px-4 py-1.5 rounded-bl-2xl bg-purple-600 text-[11px] font-extrabold text-white shadow-sm">
              POPULER
            </div>
            <div>
              <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center mb-4 text-purple-600">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-purple-950">AM PREMIUM ECERAN</h3>
              <p className="text-xs text-purple-700 mt-1 font-medium">
                Aktivasi & verifikasi AM Premium untuk akun Gmail pribadi Anda secara eceran.
              </p>

              <div className="mt-6 mb-6 pb-6 border-b border-purple-100">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-extrabold text-purple-950 font-['Poppins',sans-serif]">
                    Rp{priceEceran.toLocaleString('id-ID')}
                  </span>
                  <span className="text-xs text-purple-600 font-bold">/ akun</span>
                </div>
              </div>

              <ul className="space-y-2.5 text-xs text-purple-900 font-medium mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Aktivasi ke alamat Gmail Anda langsung</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Proses verifikasi otomatis lewat API</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Garansi otomatis saldo kembali jika gagal</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleOpenAuth('register')}
              className="w-full py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-sm font-bold text-white shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <span>Order Eceran Sekarang</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>

          {/* Product 2: Bulk */}
          <motion.div
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
            className="relative rounded-3xl border border-purple-200 bg-white p-6 sm:p-8 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
          >
            <div className="absolute top-0 right-0 px-4 py-1.5 rounded-bl-2xl bg-indigo-600 text-[11px] font-extrabold text-white shadow-sm">
              RESELLER / HEMAT
            </div>
            <div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center mb-4 text-indigo-600">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-purple-950">AM PREMIUM BULK</h3>
              <p className="text-xs text-purple-700 mt-1 font-medium">
                Generate hingga 5 akun AM Premium siap pakai dalam satu proses cepat.
              </p>

              <div className="mt-6 mb-6 pb-6 border-b border-purple-100">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-extrabold text-purple-950 font-['Poppins',sans-serif]">
                    Rp{priceBulk.toLocaleString('id-ID')}
                  </span>
                  <span className="text-xs text-purple-600 font-bold">/ akun (1-5 akun)</span>
                </div>
              </div>

              <ul className="space-y-2.5 text-xs text-purple-900 font-medium mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Fleksibel order 1 hingga 5 akun sekaligus</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Akun siap pakai langsung masuk Riwayat Pesanan</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Cocok untuk kebutuhan tim atau dijual kembali</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleOpenAuth('register')}
              className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-sm font-bold text-white shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <span>Order Bulk Sekarang</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      </div>

      {/* How It Works */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-purple-950 font-['Poppins',sans-serif]">
            Cara Kerja Mudah 4 Langkah
          </h2>
          <p className="text-xs sm:text-sm text-purple-700 mt-1 font-medium">
            Proses simpel yang bisa diselesaikan dalam hitungan menit dari HP Anda.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              step: '1',
              title: 'Daftar Akun',
              desc: 'Buat akun AZRYLSTORE gratis hanya dengan username dan email.',
              icon: Users,
            },
            {
              step: '2',
              title: 'Isi Saldo',
              desc: 'Deposit mulai Rp1.000 via scan QRIS atau transfer akun DANA.',
              icon: CreditCard,
            },
            {
              step: '3',
              title: 'Pilih Produk AM',
              desc: 'Pilih AM Eceran (Rp300) atau AM Bulk (Rp400/akun) sesuai kebutuhan.',
              icon: ShoppingBag,
            },
            {
              step: '4',
              title: 'Selesai & Aktif',
              desc: 'Server backend memproses aktivasi, hasil tersimpan di Riwayat Pesanan.',
              icon: Zap,
            },
          ].map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="relative rounded-3xl border border-purple-200 bg-white p-6 shadow-sm text-left"
              >
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-sm mb-4">
                  {item.step}
                </div>
                <div className="flex items-center gap-2 mb-1.5">
                  <Icon className="w-4 h-4 text-purple-600" />
                  <h4 className="text-base font-bold text-purple-950">{item.title}</h4>
                </div>
                <p className="text-xs text-purple-700 leading-relaxed font-medium">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Keunggulan */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 relative z-10">
        <div className="rounded-3xl border border-purple-200 bg-white p-8 sm:p-12 shadow-sm">
          <div className="text-center mb-8">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-purple-950 font-['Poppins',sans-serif]">
              Kenapa Memilih AZRYLSTORE?
            </h3>
            <p className="text-xs sm:text-sm text-purple-700 mt-1 font-medium">
              Keamanan, kecepatan transaksi, dan transparansi adalah prioritas kami.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="text-center p-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-purple-950">Saldo Terlindungi</h4>
              <p className="text-xs text-purple-700 mt-1 font-medium leading-relaxed">
                Semua pemotongan saldo terikat transaksi aman. Jika API gagal, saldo otomatis dikembalikan.
              </p>
            </div>

            <div className="text-center p-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto mb-3">
                <Zap className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-purple-950">Server Kilat & Handal</h4>
              <p className="text-xs text-purple-700 mt-1 font-medium leading-relaxed">
                Backend otomatis terintegrasi langsung dengan API verifikasi Alight Motion 24 jam nonstop.
              </p>
            </div>

            <div className="text-center p-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center mx-auto mb-3">
                <Headphones className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-purple-950">Customer Support Aktif</h4>
              <p className="text-xs text-purple-700 mt-1 font-medium leading-relaxed">
                Bantuan cepat langsung melalui WhatsApp Admin dan update harian di Saluran Resmi.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 mb-2">
            <HelpCircle className="w-4 h-4" />
            <span>PERTANYAAN UMUM</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-purple-950 font-['Poppins',sans-serif]">
            Pertanyaan yang Sering Diajukan
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-purple-200 bg-white p-5 shadow-sm"
            >
              <h4 className="text-sm sm:text-base font-bold text-purple-950 mb-1.5">{faq.q}</h4>
              <p className="text-xs sm:text-sm text-purple-700 leading-relaxed font-medium">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Final CTA Banner */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 relative z-10">
        <div className="rounded-3xl border border-purple-300 bg-gradient-to-r from-purple-700 via-purple-800 to-indigo-800 p-8 sm:p-10 text-center text-white shadow-xl">
          <h3 className="text-2xl sm:text-3xl font-extrabold font-['Poppins',sans-serif]">
            Siap Aktifkan Alight Motion Premium Anda?
          </h3>
          <p className="text-xs sm:text-sm text-purple-100 mt-2 max-w-xl mx-auto font-medium">
            Bergabunglah dengan ribuan editor video yang mempercayakan kebutuhan AM Premium di AZRYLSTORE.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => handleOpenAuth('register')}
              className="px-6 py-3.5 rounded-2xl bg-white text-purple-900 font-bold text-sm hover:bg-purple-50 shadow-md transition-all active:scale-95"
            >
              Daftar Sekarang
            </button>
            <button
              onClick={handleExplore}
              className="px-6 py-3.5 rounded-2xl border border-white/40 bg-white/10 hover:bg-white/20 text-white font-bold text-sm backdrop-blur-sm transition-all"
            >
              Lihat Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
