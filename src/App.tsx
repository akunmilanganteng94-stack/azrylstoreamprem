import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { Navbar, NavTab } from './components/Navbar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { AuthModal } from './components/AuthModal';
import { HelpFloatingButton } from './components/HelpFloatingButton';
import { LandingView } from './views/LandingView';
import { HomeView } from './views/HomeView';
import { DepositView } from './views/DepositView';
import { OrderAmView } from './views/OrderAmView';
import { HistoryView } from './views/HistoryView';
import { AccountView } from './views/AccountView';
import { AdminView } from './views/AdminView';
import { Sparkles, Loader2 } from 'lucide-react';

export const App: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavTab>('home');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  const openAuth = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-purple-50/50 flex flex-col items-center justify-center p-4">
        <div className="w-14 h-14 rounded-2xl bg-purple-600 flex items-center justify-center text-white shadow-xl shadow-purple-600/30 mb-4 animate-bounce">
          <Sparkles className="w-7 h-7" />
        </div>
        <div className="flex items-center gap-2 text-purple-900 font-bold text-sm">
          <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
          <span>Memuat AZRYLSTORE...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-purple-50/30 text-purple-950 selection:bg-purple-600 selection:text-white pb-20 md:pb-8">
      {/* Top Navigation Bar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        onOpenAuthModal={() => openAuth('login')}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {!user ? (
          /* Non-logged in visitors see the Landing Page */
          <LandingView
            onOpenAuth={(mode) => openAuth(mode)}
            onOpenLogin={() => openAuth('login')}
            onOpenRegister={() => openAuth('register')}
            onExplore={() => openAuth('login')}
          />
        ) : (
          /* Logged in users see the interactive Views */
          <div>
            {currentTab === 'home' && (
              <HomeView onSelectTab={(tab) => setCurrentTab(tab)} />
            )}
            {currentTab === 'deposit' && <DepositView />}
            {currentTab === 'order' && (
              <OrderAmView
                onGoToHistory={() => setCurrentTab('history')}
                onGoToDeposit={() => setCurrentTab('deposit')}
              />
            )}
            {currentTab === 'history' && <HistoryView />}
            {currentTab === 'account' && (
              <AccountView onGoToAdmin={() => setCurrentTab('admin')} />
            )}
            {currentTab === 'admin' && <AdminView />}
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation (when logged in) */}
      {user && (
        <MobileBottomNav
          currentTab={currentTab}
          onSelectTab={(tab) => setCurrentTab(tab)}
        />
      )}

      {/* Floating WhatsApp Help Button */}
      <HelpFloatingButton />

      {/* Authentication Modal (Login / Register / Forgot Password) */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
      />
    </div>
  );
};

export default App;
