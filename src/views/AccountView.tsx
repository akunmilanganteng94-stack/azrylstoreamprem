import React, { useState } from 'react';
import {
  User as UserIcon,
  Mail,
  Wallet,
  ShieldCheck,
  KeyRound,
  LogOut,
  MessageCircle,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  Lock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface AccountViewProps {
  onGoToAdmin?: () => void;
}

export const AccountView: React.FC<AccountViewProps> = ({ onGoToAdmin }) => {
  const { user, token, logout, settings } = useAuth();
  const { showToast } = useToast();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [loadingPass, setLoadingPass] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);

  const waAdminUrl = settings?.waAdmin || 'https://wa.me/6285199219856';
  const waChannelUrl = settings?.waChannel || 'https://whatsapp.com/channel/0029VbCwLl7J3jv1QSig1V0C';

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);

    if (!oldPassword) {
      setPassError('Password saat ini wajib diisi');
      return;
    }
    if (newPassword.length < 6) {
      setPassError('Password baru minimal 6 karakter');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPassError('Konfirmasi password baru tidak cocok');
      return;
    }

    setLoadingPass(true);
    try {
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          oldPassword,
          newPassword,
          confirmNewPassword,
        }),
      });
      const data = await res.json();
      setLoadingPass(false);

      if (res.ok) {
        showToast('Password berhasil diubah!', 'success');
        setOldPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      } else {
        setPassError(data.error || 'Gagal mengubah password');
      }
    } catch {
      setLoadingPass(false);
      setPassError('Koneksi ke server terputus');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-purple-600 mb-1">
          <UserIcon className="w-4 h-4" />
          <span>PROFIL PENGGUNA</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-purple-950 tracking-tight font-['Poppins',sans-serif]">
          Pengaturan Akun
        </h1>
        <p className="text-xs sm:text-sm text-purple-800/70 mt-0.5 font-medium">
          Kelola informasi akun Anda dan lakukan pembaruan keamanan kata sandi.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Profile Card */}
        <div className="md:col-span-5 space-y-6">
          <div className="rounded-3xl border border-purple-200 bg-white p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 via-purple-700 to-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-md shadow-purple-600/20">
                {user?.username ? user.username.substring(0, 2).toUpperCase() : 'AZ'}
              </div>
              <div>
                <h2 className="text-lg font-bold text-purple-950">@{user?.username}</h2>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold uppercase">
                    {user?.role}
                  </span>
                  {user?.role === 'admin' && (
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-purple-100 text-xs font-medium">
              <div className="flex items-center justify-between py-1 text-purple-950">
                <span className="text-purple-700 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-purple-600" />
                  <span>Email:</span>
                </span>
                <span className="font-bold">{user?.email}</span>
              </div>
              <div className="flex items-center justify-between py-1 text-purple-950">
                <span className="text-purple-700 flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Saldo Aktif:</span>
                </span>
                <span className="font-bold text-emerald-600">
                  Rp{(user?.balance || 0).toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 text-purple-950">
                <span className="text-purple-700 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-purple-600" />
                  <span>Terdaftar:</span>
                </span>
                <span className="text-purple-800">
                  {user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString('id-ID', {
                        dateStyle: 'medium',
                      })
                    : 'Baru saja'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 text-purple-950 border-t border-purple-50 pt-2">
                <span className="text-purple-700 flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span>Database Cloud:</span>
                </span>
                <span className="font-bold text-[11px] text-emerald-700 font-mono">
                  Firebase (azrylampremnew)
                </span>
              </div>
            </div>

            {user?.role === 'admin' && onGoToAdmin && (
              <button
                onClick={onGoToAdmin}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-700 via-purple-800 to-indigo-850 hover:from-purple-800 hover:to-indigo-900 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md shadow-purple-900/20 active:scale-98"
              >
                <ShieldCheck className="w-4 h-4 text-purple-300" />
                <span>Buka Panel Admin (Kelola Deposit & User)</span>
              </button>
            )}

            <button
              onClick={() => logout()}
              className="w-full py-2.5 rounded-2xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all flex items-center justify-center gap-2 active:scale-98"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar dari Akun</span>
            </button>
          </div>

          {/* Social Support Links */}
          <div className="rounded-3xl border border-purple-200 bg-white p-5 space-y-3 text-xs shadow-sm">
            <h3 className="font-bold text-purple-900 uppercase text-[11px] tracking-wider">
              Bantuan & Komunitas
            </h3>
            <a
              href={waAdminUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-2xl bg-purple-50/70 hover:bg-purple-100/70 border border-purple-100 text-purple-900 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span className="font-bold">Hubungi Admin WhatsApp</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-purple-600" />
            </a>
            <a
              href={waChannelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-2xl bg-purple-50/70 hover:bg-purple-100/70 border border-purple-100 text-purple-900 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <ExternalLink className="w-4 h-4 text-purple-600" />
                <span className="font-bold">Saluran Resmi AZRYLSTORE</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-purple-600" />
            </a>
          </div>
        </div>

        {/* Change Password Form */}
        <div className="md:col-span-7">
          <div className="rounded-3xl border border-purple-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-purple-950">Ganti Password</h3>
                <p className="text-xs text-purple-700">Perbarui kata sandi secara berkala demi keamanan.</p>
              </div>
            </div>

            {passError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{passError}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-purple-900 mb-1.5">
                  Password Saat Ini
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
                  <input
                    type="password"
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Masukkan password saat ini"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-purple-50/50 border border-purple-200 focus:border-purple-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-200 text-sm text-purple-950 placeholder:text-purple-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-purple-900 mb-1.5">
                  Password Baru (Min. 6 Karakter)
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-purple-50/50 border border-purple-200 focus:border-purple-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-200 text-sm text-purple-950 placeholder:text-purple-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-purple-900 mb-1.5">
                  Konfirmasi Password Baru
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
                  <input
                    type="password"
                    required
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Ulangi password baru"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-purple-50/50 border border-purple-200 focus:border-purple-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-200 text-sm text-purple-950 placeholder:text-purple-300"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loadingPass}
                className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
              >
                {loadingPass ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memperbarui Password...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Simpan Password Baru</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
