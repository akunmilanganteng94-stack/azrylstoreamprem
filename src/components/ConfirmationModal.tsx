import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'primary' | 'danger' | 'success';
  isLoading?: boolean;
  children?: React.ReactNode;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Konfirmasi',
  cancelText = 'Batal',
  confirmVariant = 'primary',
  isLoading = false,
  children,
}) => {
  if (!isOpen) return null;

  const getButtonStyles = () => {
    switch (confirmVariant) {
      case 'danger':
        return 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-lg shadow-rose-950/40';
      case 'success':
        return 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-950/40';
      case 'primary':
      default:
        return 'bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 hover:from-purple-500 hover:to-indigo-600 text-white shadow-lg shadow-purple-950/40';
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
          onClick={() => !isLoading && onClose()}
          className="fixed inset-0 bg-black/75 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.93, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93, y: 16 }}
          className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-purple-200 bg-white text-purple-950 shadow-2xl p-6 sm:p-7 z-10"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h3 className="text-xl font-bold tracking-tight text-purple-950 flex items-center gap-2">
                {title}
              </h3>
              {description && <p className="text-sm text-purple-700/80 mt-1">{description}</p>}
            </div>
            <button
              onClick={() => !isLoading && onClose()}
              className="rounded-xl p-1.5 text-purple-400 hover:bg-purple-100 hover:text-purple-700 transition-colors"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="my-4">{children}</div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-purple-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl border border-purple-200 bg-purple-50/50 hover:bg-purple-100 text-sm font-semibold text-purple-800 transition-colors disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 ${getButtonStyles()}`}
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{confirmText}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
