import { useState } from 'react';
import Header from './components/Header';
import SetupForm from './components/SetupForm';
import Dashboard from './components/Dashboard';
import ClaimView from './components/ClaimView';

type View = 'setup' | 'dashboard' | 'claim';

function App() {
  const [currentView, setCurrentView] = useState<View>('setup');
  const [openWindows, setOpenWindows] = useState<Set<View>>(new Set(['setup']));

  const toggleWindow = (view: View) => {
    setOpenWindows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(view)) {
        newSet.delete(view);
      } else {
        newSet.add(view);
      }
      return newSet;
    });
    setCurrentView(view);
  };

  const closeWindow = (view: View) => {
    setOpenWindows((prev) => {
      const newSet = new Set(prev);
      newSet.delete(view);
      return newSet;
    });
  };

  return (
    <div className="min-h-screen bg-[#008080] relative pb-12">
      {/* Desktop Background */}
      <div className="absolute inset-0 bg-[#008080]">
        {/* Optional desktop pattern/texture */}
      </div>

      {/* Windows Container */}
      <div className="relative z-10 pt-4 px-4 space-y-4">
        {/* Setup Window */}
        {openWindows.has('setup') && (
          <div className="window max-w-2xl mx-auto">
            <SetupForm 
              onClose={() => closeWindow('setup')}
              isActive={currentView === 'setup'}
              onActivate={() => setCurrentView('setup')}
            />
          </div>
        )}

        {/* Dashboard Window */}
        {openWindows.has('dashboard') && (
          <div className="window max-w-4xl mx-auto">
            <Dashboard 
              onClose={() => closeWindow('dashboard')}
              isActive={currentView === 'dashboard'}
              onActivate={() => setCurrentView('dashboard')}
            />
          </div>
        )}

        {/* Claim Window */}
        {openWindows.has('claim') && (
          <div className="window max-w-2xl mx-auto">
            <ClaimView 
              onClose={() => closeWindow('claim')}
              isActive={currentView === 'claim'}
              onActivate={() => setCurrentView('claim')}
            />
          </div>
        )}
      </div>

      {/* Start Bar */}
      <Header 
        currentView={currentView} 
        onViewChange={toggleWindow}
        openWindows={openWindows}
      />
    </div>
  );
}

export default App;
