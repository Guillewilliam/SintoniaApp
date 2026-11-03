import React, { useState, useEffect } from 'react';
import { UserProfile, Connection } from './types';
import { onAuthProfileChanged, logoutUser } from './services/authService';
import { Navbar } from './components/Navbar';
import { OfflineBanner } from './components/OfflineBanner';
import { FirebaseStatusBanner } from './components/FirebaseStatusBanner';
import { AuthScreen } from './pages/AuthScreen';
import { VerifyEmailScreen } from './pages/VerifyEmailScreen';
import { DashboardScreen } from './pages/DashboardScreen';
import { SessionGameScreen } from './pages/SessionGameScreen';
import { ConnectionProfileScreen } from './pages/ConnectionProfileScreen';
import { CreateInviteModal } from './components/CreateInviteModal';
import { EnterCodeModal } from './components/EnterCodeModal';
import { UserProfileModal } from './components/UserProfileModal';

type AppView = 'dashboard' | 'session' | 'connection_profile';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('sintonia_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  });

  // Navigation state
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);

  // Modals state
  const [showCreateInvite, setShowCreateInvite] = useState(false);
  const [showEnterCode, setShowEnterCode] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);

  // Subscribe to auth state
  useEffect(() => {
    const unsubscribe = onAuthProfileChanged((profile: any) => {
      setCurrentUser(profile);
      setAuthInitialized(true);
      if (profile?.preferences?.theme) {
        setTheme(profile.preferences.theme);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Update theme class on HTML element & localStorage
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('sintonia_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleLogout = async () => {
    await logoutUser();
    setCurrentView('dashboard');
    setSelectedConnection(null);
  };

  const handleStartSession = (conn: Connection) => {
    setSelectedConnection(conn);
    setCurrentView('session');
  };

  const handleSelectConnection = (conn: Connection) => {
    setSelectedConnection(conn);
    setCurrentView('connection_profile');
  };

  if (!authInitialized) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 transition-colors duration-200">
        <span className="w-10 h-10 border-3 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-3"></span>
        <p className="text-xs font-semibold">Iniciando Sintonía PWA...</p>
      </div>
    );
  }

  // 1. Not authenticated -> Auth & Landing screen
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
        <OfflineBanner />
        <Navbar
          user={null}
          onOpenProfile={() => { }}
          onLogout={() => { }}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
        <FirebaseStatusBanner />
        <main className="flex-1">
          <AuthScreen onAuthSuccess={(user) => setCurrentUser(user)} />
        </main>
      </div>
    );
  }

  // 2. Authenticated but unverified email -> Verification screen
  if (!currentUser.emailVerified) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
        <OfflineBanner />
        <Navbar
          user={currentUser}
          onOpenProfile={() => setShowUserProfile(true)}
          onLogout={handleLogout}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
        <main className="flex-1">
          <VerifyEmailScreen
            user={currentUser}
            onVerified={() => setCurrentUser({ ...currentUser, emailVerified: true })}
            onLogout={handleLogout}
          />
        </main>
      </div>
    );
  }

  // 3. Authenticated & Verified -> Main App
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white transition-colors duration-200">
      <OfflineBanner />
      <Navbar
        user={currentUser}
        onOpenProfile={() => setShowUserProfile(true)}
        onLogout={handleLogout}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
      <FirebaseStatusBanner />

      <main className="flex-1 pb-12">
        {currentView === 'dashboard' && (
          <DashboardScreen
            user={currentUser}
            onOpenCreateInvite={() => setShowCreateInvite(true)}
            onOpenEnterCode={() => setShowEnterCode(true)}
            onSelectConnection={handleSelectConnection}
            onStartSession={handleStartSession}
          />
        )}

        {currentView === 'session' && selectedConnection && (
          <SessionGameScreen
            connection={selectedConnection}
            currentUser={currentUser}
            onBack={() => setCurrentView('dashboard')}
            onOpenHistory={() => setCurrentView('connection_profile')}
          />
        )}

        {currentView === 'connection_profile' && selectedConnection && (
          <ConnectionProfileScreen
            connection={selectedConnection}
            currentUser={currentUser}
            onBack={() => setCurrentView('dashboard')}
            onStartSession={handleStartSession}
            onConnectionRemoved={() => {
              setCurrentView('dashboard');
              setSelectedConnection(null);
            }}
          />
        )}
      </main>

      {/* Global Modals */}
      {showCreateInvite && (
        <CreateInviteModal

          onClose={() => setShowCreateInvite(false)}
        />
      )}

      {showEnterCode && (
        <EnterCodeModal
          onClose={() => setShowEnterCode(false)}
          onSuccess={(newConn: any) => {
            setShowEnterCode(false);
          }}
        />
      )}

      {showUserProfile && (
        <UserProfileModal
          user={currentUser}
          onClose={() => setShowUserProfile(false)}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
};

export default App;
