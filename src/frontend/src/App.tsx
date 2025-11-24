import { useState, useEffect } from 'react';
import { useSatoshi } from './hooks/useSatoshi';
import Header from './components/Header';
import SetupForm from './components/SetupForm';
import Dashboard from './components/Dashboard';
import ClaimView from './components/ClaimView';
import LoginWindow from './components/LoginWindow';

type View = 'login' | 'setup' | 'dashboard' | 'claim';

function App() {
  let satoshi;
  try {
    satoshi = useSatoshi();
  } catch (error) {
    console.error('Error initializing useSatoshi:', error);
    // Fallback object to prevent crash
    satoshi = {
      isAuthenticated: false,
      principal: null,
      login: async () => console.error('Login not available'),
      logout: async () => {},
      registerWill: async () => {},
      sendHeartbeat: async () => {},
      getVaultAddress: async () => '',
      claimInheritance: async () => {},
      loading: false,
      error: 'Failed to initialize',
    };
  }
  
  // Track which window is focused - single window view when authenticated
  const [activeWindow, setActiveWindow] = useState<View>(() => {
    return satoshi.isAuthenticated ? 'setup' : 'login';
  });

  // Track time remaining from Dashboard to determine if owner is dead
  const [timeRemaining, setTimeRemaining] = useState<number>(-1); // -1 means no will registered
  const [hasWill, setHasWill] = useState<boolean>(false);
  // Track if beneficiary has expired inheritances
  const [hasExpiredInheritances, setHasExpiredInheritances] = useState<boolean>(false);
  
  // Owner is dead if their will exists AND timer expired
  const ownerIsDead = hasWill && timeRemaining <= 0;
  // Show critical alert if owner is dead OR beneficiary has expired inheritances
  const showCriticalAlert = ownerIsDead || hasExpiredInheritances;

  // Update window when auth state changes
  useEffect(() => {
    if (satoshi.isAuthenticated) {
      // If just logged in, show INITIALIZE_PROTOCOL window in center
      if (activeWindow === 'login') {
        setActiveWindow('setup');
      }
    } else {
      // If logged out, show only login window
      setActiveWindow('login');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [satoshi.isAuthenticated]);

  // Auto-open ClaimView when critical alert should be shown (only if not manually opened another window)
  useEffect(() => {
    if (satoshi.isAuthenticated && showCriticalAlert && activeWindow === 'setup') {
      // Only auto-open if user is still on setup window
      setActiveWindow('claim');
    }
  }, [showCriticalAlert, satoshi.isAuthenticated]);

  // Handle window focus - brings window to front
  const toggleWindow = (view: 'setup' | 'dashboard' | 'claim') => {
    if (!satoshi.isAuthenticated) {
      // Show Windows 95 style error popup
      alert('ACCESS DENIED\n\nAuthentication required to access this feature.');
      return;
    }
    setActiveWindow(view);
  };

  // Close window handler - when authenticated, switch to another window
  const closeWindow = () => {
    if (!satoshi.isAuthenticated) {
      // Can't close login window when not authenticated
      setActiveWindow('login');
    } else {
      // When authenticated, closing switches to another window
      if (activeWindow === 'setup') {
        setActiveWindow('dashboard');
      } else if (activeWindow === 'dashboard') {
        // If critical alert exists, go to claim, otherwise stay on dashboard
        setActiveWindow(showCriticalAlert ? 'claim' : 'setup');
      } else if (activeWindow === 'claim') {
        setActiveWindow('dashboard');
      } else {
        setActiveWindow('setup');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#008080] relative pb-12 overflow-hidden">
      {/* Desktop Background */}
      <div className="absolute inset-0 bg-[#008080]">
        {/* Optional desktop pattern/texture could go here */}
      </div>

      {/* Windows Container - Desktop Layout */}
      <div className="relative z-10 min-h-[calc(100vh-3rem)] pt-4 pb-4 px-4">
        {/* Login Window - Only shown when not authenticated */}
        {!satoshi.isAuthenticated && (
          <div 
            className="window max-w-md w-full mx-auto" 
            style={{ 
              zIndex: activeWindow === 'login' ? 1000 : 100,
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)'
            }}
          >
            <LoginWindow 
              onClose={closeWindow}
              isActive={activeWindow === 'login'}
              onActivate={() => setActiveWindow('login')}
              onLogin={satoshi.login}
            />
          </div>
        )}

        {/* Single Window Focus - Only show active window in center when authenticated */}
        {satoshi.isAuthenticated && (
          <>
            {/* Setup Window - Center (only when active) */}
            {activeWindow === 'setup' && (
              <div 
                className="window max-w-2xl w-full" 
                style={{ 
                  zIndex: 1000,
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  maxWidth: '600px',
                }}
              >
                <SetupForm 
                  onClose={closeWindow}
                  isActive={true}
                  onActivate={() => setActiveWindow('setup')}
                />
              </div>
            )}

            {/* Dashboard Window - Center (only when active) */}
            {activeWindow === 'dashboard' && (
              <div 
                className="window max-w-4xl w-full" 
                style={{ 
                  zIndex: 1000,
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  maxWidth: '800px',
                }}
              >
                <Dashboard 
                  onClose={closeWindow}
                  isActive={true}
                  onActivate={() => setActiveWindow('dashboard')}
                  onTimeRemainingChange={setTimeRemaining}
                  onHasWillChange={setHasWill}
                />
              </div>
            )}

            {/* Claim Window - Center (only when active) */}
            {activeWindow === 'claim' && (
              <div 
                className="window max-w-2xl w-full" 
                style={{ 
                  zIndex: 1000,
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  maxWidth: '600px',
                }}
              >
                <ClaimView 
                  onClose={closeWindow}
                  isActive={true}
                  onActivate={() => setActiveWindow('claim')}
                  isDead={showCriticalAlert}
                  onExpiredInheritancesChange={setHasExpiredInheritances}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Start Bar */}
      <Header 
        activeWindow={activeWindow}
        onWindowToggle={toggleWindow}
        satoshi={{
          isAuthenticated: satoshi.isAuthenticated,
          principal: satoshi.principal,
          login: satoshi.login,
          logout: satoshi.logout,
        }}
        isDead={showCriticalAlert}
      />
    </div>
  );
}

export default App;
