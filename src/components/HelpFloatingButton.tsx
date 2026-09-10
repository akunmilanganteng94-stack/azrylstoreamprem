import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, Bell, X, ExternalLink, Sparkles, ChevronUp, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const HelpFloatingButton: React.FC = () => {
  const { settings } = useAuth();
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [showChannelBanner, setShowChannelBanner] = useState(() => {
    return sessionStorage.getItem('azryl_channel_closed') !== 'true';
  });

  const waAdminUrl = settings?.waAdmin || 'https://wa.me/6285199219856';
  const waChannelUrl = settings?.waChannel || 'https://whatsapp.com/channel/0029VbCwLl7J3jv1QSig1V0C';

  const closeChannelBanner = () => {
    setShowChannelBanner(false);
    sessionStorage.setItem('azryl_channel_closed', 'true');
  };

  return (
    <>
      {/* WhatsApp Channel Promo Banner / Announcement Modal */}
      <AnimatePresence>
        {showChannelBanner && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:w-80 z-40"
          >
            <div className="relative rounded-3xl border border-purple-200 bg-white p-5 shadow-2xl text-purple-950">
              <button
                onClick={closeChannelBanner}
                className="absolute top-3.5 right-3.5 text-purple-400 hover:text-purple-700 p-1 rounded-lg hover:bg-purple-50 transition-colors"
                aria-label="Tutup Banner Saluran"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                  <Bell className="w-5 h-5 animate-bounce" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-purple-600">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>KOMUNITAS RESMI</span>
                  </div>
                  <h4 className="text-sm font-extrabold text-purple-950 mt-0.5">Gabung Saluran AZRYLSTORE</h4>
                  <p className="text-xs text-purple-700 mt-1 leading-relaxed font-medium">
                    Dapatkan update harian, info restock kuota AM, dan informasi promo langsung di WhatsApp.
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-purple-100 flex items-center justify-between gap-2">
                <button
                  onClick={closeChannelBanner}
                  className="text-xs text-purple-600 hover:text-purple-800 font-bold px-2 py-1"
                >
                  Nanti saja
                </button>
                <a
                  href={waChannelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white shadow-sm transition-all active:scale-95"
                >
                  <span>Gabung Sekarang</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Admin Support Button & Popup */}
      <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 flex flex-col items-end">
        <AnimatePresence>
          {isHelpOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="mb-3 w-72 rounded-3xl border border-purple-200 bg-white p-5 shadow-2xl text-purple-950"
            >
              <div className="flex items-center justify-between pb-3 border-b border-purple-100">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-xs font-bold text-emerald-700">Admin Online</span>
                </div>
                <button
                  onClick={() => setIsHelpOpen(false)}
                  className="text-purple-400 hover:text-purple-700 p-1 rounded-md"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="py-3">
                <p className="text-[11px] font-bold text-purple-600 uppercase">BUTUH BANTUAN?</p>
                <h4 className="text-base font-extrabold text-purple-950 mt-0.5">Hubungi Admin</h4>
                <p className="text-xs text-purple-700 mt-1 leading-relaxed font-medium">
                  Ada kendala transaksi, deposit, atau aktivasi Alight Motion? Tim admin siap melayani.
                </p>
              </div>
              <a
                href={waAdminUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-sm font-bold text-white shadow-sm transition-all active:scale-95"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat Admin WhatsApp</span>
              </a>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Floating Trigger Button */}
        <button
          onClick={() => setIsHelpOpen((prev) => !prev)}
          className="flex items-center gap-2.5 px-4 py-3 rounded-full bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-600/30 border border-purple-400/40 transition-all duration-300 hover:scale-105 active:scale-95"
          aria-label="Bantuan Admin WhatsApp"
        >
          <div className="relative">
            <MessageCircle className="w-5 h-5 text-white" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-white" />
          </div>
          <span className="text-xs sm:text-sm font-bold tracking-wide">Bantuan Admin</span>
          {isHelpOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>
    </>
  );
};
