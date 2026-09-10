import React from 'react';
import { Home, CreditCard, ShoppingBag, History, User, ShieldCheck } from 'lucide-react';
import { NavTab } from './Navbar';
import { useAuth } from '../context/AuthContext';

interface MobileBottomNavProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ currentTab, onSelectTab }) => {
  const { user } = useAuth();

  const items = [
    { id: 'home' as NavTab, label: 'Home', icon: Home },
    { id: 'deposit' as NavTab, label: 'Saldo', icon: CreditCard },
    { id: 'order' as NavTab, label: 'Order', icon: ShoppingBag },
    { id: 'history' as NavTab, label: 'Riwayat', icon: History },
    { id: 'account' as NavTab, label: 'Akun', icon: User },
  ];

  if (user?.role === 'admin') {
    items.push({ id: 'admin' as NavTab, label: 'Admin', icon: ShieldCheck });
  }

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-xl border-t border-purple-200/90 px-2 py-1.5 shadow-lg shadow-purple-900/10 safe-area-bottom">
      <div className={`grid ${user?.role === 'admin' ? 'grid-cols-6' : 'grid-cols-5'} gap-1 items-center`}>
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all ${
                isActive
                  ? 'text-purple-700 font-bold'
                  : 'text-purple-900/50 hover:text-purple-700'
              }`}
            >
              <div
                className={`p-1 rounded-xl transition-all ${
                  isActive ? 'bg-purple-600 text-white scale-110 shadow-sm shadow-purple-600/30' : ''
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight font-semibold">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

