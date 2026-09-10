import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Lock,
  Mail,
  User as UserIcon,
  ArrowRight,
  Sparkles,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
}) => {
  const { login, register } = useAuth();
  const { showToast } = useToast();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [identifier, setIdentifier] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!identifier.trim() || !password) {
      setError('Username/Email dan password wajib diisi');
      return;
    }

    setLoading(true);
    const result = await login(identifier.trim(), password);
    setLoading(false);

    if (result.success) {
      showToast('Berhasil masuk ke AZRYLSTORE!', 'success');
      onClose();
    } else {
      setError(result.error || 'Login gagal');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!username.trim()) {
      setError('Username tidak boleh kosong');
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Format email tidak valid');
      return;
    }
    if (password.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }
    if (password !== confirmPassword) {
      setError('Konfirmasi password tidak cocok');
      return;
    }

    setLoading(true);
    const result = await register(username.trim(), email.trim(), password, confirmPassword);
    setLoading(false);

    if (result.success) {
      showToast('Pendaftaran akun berhasil! Selamat datang.', 'success');
      onClose();
    } else {
      setError(result.error || 'Pendaftaran gagal');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!forgotEmail.trim()) {
      setError('Email wajib diisi');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });
      setLoading(false);
      if (res.ok) {
        setForgotSuccess(true);
      } else {
        const data = await res.json();
        setError(data.error || 'Gagal mengirim instruksi reset');
      }
    } catch {
      setLoading(false);
      setError('Koneksi ke server gagal');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-purple-950/40 backdrop-blur-sm"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-md overflow-hidden rounded-3xl border border-purple-200 bg-white p-6 sm:p-8 text-purple-950 shadow-2xl z-10"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-600 transition-colors"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 mb-3">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-extrabold tracking-tight font-['Poppins',sans-serif] text-purple-950">
              {mode === 'login' && 'Masuk ke Akun'}
              {mode === 'register' && 'Daftar AZRYLSTORE'}
              {mode === 'forgot' && 'Pemulihan Akun'}
            </h3>
            <p className="text-xs text-purple-700 mt-1 font-medium">
              {mode === 'login' && 'Nikmati layanan Alight Motion Premium cepat & murah'}
              {mode === 'register' && 'Lengkapi formulir untuk membuat akun baru'}
              {mode === 'forgot' && 'Masukkan email terdaftar Anda'}
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-xs text-rose-700 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-purple-900 mb-1.5">
                  Username atau Email
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Masukkan username atau email"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-purple-50/50 border border-purple-200 focus:border-purple-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-200 text-sm text-purple-950 placeholder:text-purple-300"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-purple-900">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setError(null);
                    }}
                    className="text-xs text-purple-600 hover:text-purple-800 font-bold"
                  >
                    Lupa Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-purple-50/50 border border-purple-200 focus:border-purple-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-200 text-sm text-purple-950 placeholder:text-purple-300"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-2xl bg-purple-600 hover:bg-purple-700 text-sm font-bold text-white shadow-md transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
              >
                {loading ? 'Memproses...' : 'Masuk Sekarang'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          )}

          {/* Register Form */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-purple-900 mb-1">Username</label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Contoh: azryl_pro"
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-purple-50/50 border border-purple-200 focus:border-purple-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-200 text-sm text-purple-950 placeholder:text-purple-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-purple-900 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@anda.com"
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-purple-50/50 border border-purple-200 focus:border-purple-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-200 text-sm text-purple-950 placeholder:text-purple-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-purple-900 mb-1">
                  Password (min. 6 karakter)
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-purple-50/50 border border-purple-200 focus:border-purple-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-200 text-sm text-purple-950 placeholder:text-purple-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-purple-900 mb-1">
                  Konfirmasi Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi password"
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-purple-50/50 border border-purple-200 focus:border-purple-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-200 text-sm text-purple-950 placeholder:text-purple-300"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-2xl bg-purple-600 hover:bg-purple-700 text-sm font-bold text-white shadow-md transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
              >
                {loading ? 'Mendaftarkan...' : 'Buat Akun Sekarang'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          )}

          {/* Forgot Password Flow */}
          {mode === 'forgot' && (
            <div>
              {forgotSuccess ? (
                <div className="text-center py-4 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-purple-950">Instruksi Terkirim</h4>
                  <p className="text-xs text-purple-700 leading-relaxed font-medium">
                    Silakan hubungi WhatsApp Admin dengan menyertakan email Anda untuk proses reset instan.
                  </p>
                  <button
                    onClick={() => {
                      setMode('login');
                      setForgotSuccess(false);
                      setError(null);
                    }}
                    className="w-full py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-xs font-bold text-white mt-2"
                  >
                    Kembali ke Login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-purple-900 mb-1.5">
                      Email Akun
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
                      <input
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="Masukkan email Anda"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-purple-50/50 border border-purple-200 focus:border-purple-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-200 text-sm text-purple-950 placeholder:text-purple-300"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 rounded-2xl bg-purple-600 hover:bg-purple-700 text-sm font-bold text-white shadow-md active:scale-98 disabled:opacity-50"
                  >
                    {loading ? 'Mengirim...' : 'Kirim Permintaan Reset'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setError(null);
                    }}
                    className="w-full text-xs text-purple-600 hover:text-purple-800 text-center mt-2 font-bold"
                  >
                    Batal & Kembali ke Login
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Switch Mode Footer */}
          <div className="mt-5 pt-4 border-t border-purple-100 text-center">
            {mode === 'login' ? (
              <p className="text-xs text-purple-700 font-medium">
                Belum punya akun?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setError(null);
                  }}
                  className="font-bold text-purple-600 hover:text-purple-800 underline underline-offset-2 ml-1"
                >
                  Daftar Sekarang
                </button>
              </p>
            ) : mode === 'register' ? (
              <p className="text-xs text-purple-700 font-medium">
                Sudah punya akun?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError(null);
                  }}
                  className="font-bold text-purple-600 hover:text-purple-800 underline underline-offset-2 ml-1"
                >
                  Login di Sini
                </button>
              </p>
            ) : null}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
