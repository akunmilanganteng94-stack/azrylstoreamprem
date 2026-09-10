import React, { useState } from 'react';
import {
  Wallet,
  PlusCircle,
  Sun,
  Moon,
  LogOut,
  User as UserIcon,
  ShoppingBag,
  History,
  Home,
  CreditCard,
  Menu,
  X,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export type NavTab = 'home' | 'deposit' | 'order' | 'history' | 'account' | 'admin';

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenAuthModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onSelectTab, onOpenAuthModal }) => {
  const { user, logout, isDarkMode, toggleTheme } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: Array<{ id: NavTab; label: string; icon: any; highlight?: boolean }> = [
    { id: 'home', label: 'HOME', icon: Home },
    { id: 'deposit', label: 'ISI SALDO', icon: CreditCard },
    { id: 'order', label: 'ORDER AM', icon: ShoppingBag },
    { id: 'history', label: 'RIWAYAT PESANAN', icon: History },
    { id: 'account', label: 'AKUN', icon: UserIcon },
  ];

  if (user?.role === 'admin') {
    navItems.push({
      id: 'admin',
      label: 'PANEL ADMIN',
      icon: ShieldCheck,
      highlight: true,
    });
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-purple-200/80 bg-white/90 backdrop-blur-xl transition-colors shadow-sm shadow-purple-900/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div
          onClick={() => onSelectTab('home')}
          className="flex items-center gap-2.5 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md shadow-purple-900/10 group-hover:scale-105 transition-transform border border-purple-200/80 bg-white flex items-center justify-center">
            <img
              src="https://cdn.phototourl.com/free/2026-09-10-1fc9669a-0454-4988-b339-76c575b6604b.png"
              alt="AZRYL STORE"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-extrabold tracking-tight text-purple-950 font-['Poppins',sans-serif]">
                AZRYL<span className="text-purple-600">STORE</span>
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 font-bold border border-purple-200">
                PRO
              </span>
            </div>
            <p className="text-[10px] text-purple-800/60 font-medium -mt-1 hidden sm:block">
              Alight Motion Premium Market
            </p>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        {user && (
          <nav className="hidden md:flex items-center gap-1.5 lg:gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold tracking-wide transition-all ${
                    isActive
                      ? item.highlight
                        ? 'bg-gradient-to-r from-purple-800 to-indigo-900 text-white shadow-md shadow-purple-900/25 ring-1 ring-purple-400'
                        : 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                      : item.highlight
                      ? 'bg-purple-100 text-purple-900 hover:bg-purple-200/80 border border-purple-300'
                      : 'text-purple-900/70 hover:text-purple-950 hover:bg-purple-50 border border-transparent'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : item.highlight ? 'text-purple-700' : 'text-purple-600'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        )}

        {/* Right Area: User Balance + Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* User Balance Badge */}
          {user ? (
            <div className="flex items-center gap-2 p-1 pl-3 pr-1 rounded-xl bg-purple-50/90 border border-purple-200 text-purple-950 shadow-sm">
              <div className="flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-purple-600 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-purple-600/80 uppercase font-semibold leading-none">
                    Saldo
                  </span>
                  <span className="text-xs font-bold text-purple-950">
                    Rp{(user.balance || 0).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
              <button
                onClick={() => onSelectTab('deposit')}
                className="flex items-center justify-center p-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white transition-all shadow-sm active:scale-95"
                title="Isi Saldo"
                aria-label="Isi Saldo"
              >
                <PlusCircle className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onOpenAuthModal?.()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-xs sm:text-sm font-bold text-white shadow-md shadow-purple-600/20 transition-all active:scale-95"
            >
              <UserIcon className="w-4 h-4" />
              <span>Login / Daftar</span>
            </button>
          )}

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 transition-colors"
            aria-label="Ganti Tema"
            title={isDarkMode ? 'Beralih ke Light Mode' : 'Beralih ke Dark Mode'}
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-purple-600" />}
          </button>

          {/* Quick Logout for Desktop */}
          {user && (
            <button
              onClick={() => logout()}
              className="hidden sm:flex items-center justify-center p-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
              title="Keluar"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}

          {/* Mobile Menu Button */}
          {user && (
            <button
              onClick={() => setMobileMenuOpen((p) => !p)}
              className="md:hidden p-2 rounded-xl border border-purple-200 bg-purple-50 text-purple-700"
              aria-label="Buka Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {user && mobileMenuOpen && (
        <div className="md:hidden border-t border-purple-200 bg-white/95 backdrop-blur-2xl px-4 py-4 space-y-2 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-purple-100">
            <div>
              <p className="text-xs text-purple-500">Masuk sebagai</p>
              <p className="text-sm font-bold text-purple-950">@{user.username}</p>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-bold uppercase">
              {user.role}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-1.5 pt-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/20'
                      : 'text-purple-900/80 hover:bg-purple-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-purple-600'}`} />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-purple-400" />
                </button>
              );
            })}

            <button
              onClick={() => {
                logout();
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-all pt-3 border-t border-purple-100"
            >
              <LogOut className="w-4 h-4 text-rose-500" />
              <span>Keluar dari Akun</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
