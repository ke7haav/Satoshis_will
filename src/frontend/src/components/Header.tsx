import { Wallet, Square } from 'lucide-react';

interface HeaderProps {
  currentView: 'setup' | 'dashboard' | 'claim';
  onViewChange: (view: 'setup' | 'dashboard' | 'claim') => void;
  openWindows: Set<'setup' | 'dashboard' | 'claim'>;
}

export default function Header({ currentView, onViewChange, openWindows }: HeaderProps) {
  return (
    <div className="start-bar">
      {/* Start Button */}
      <button
        onClick={() => {}}
        className="btn-retro flex items-center gap-2 h-7 px-3 mr-2"
      >
        <Square size={14} />
        <span className="font-bold">START</span>
      </button>

      {/* Window Buttons (Taskbar) */}
      <div className="flex gap-1 flex-1">
        <button
          onClick={() => onViewChange('setup')}
          className={`btn-retro h-7 px-3 text-xs ${
            currentView === 'setup' && openWindows.has('setup')
              ? 'bevel-pressed'
              : ''
          }`}
        >
          INITIALIZE_PROTOCOL.EXE
        </button>
        <button
          onClick={() => onViewChange('dashboard')}
          className={`btn-retro h-7 px-3 text-xs ${
            currentView === 'dashboard' && openWindows.has('dashboard')
              ? 'bevel-pressed'
              : ''
          }`}
        >
          SYSTEM_MONITOR
        </button>
        <button
          onClick={() => onViewChange('claim')}
          className={`btn-retro h-7 px-3 text-xs ${
            currentView === 'claim' && openWindows.has('claim')
              ? 'bevel-pressed'
              : ''
          }`}
        >
          CRITICAL_ALERT
        </button>
      </div>

      {/* System Tray */}
      <div className="flex items-center gap-1">
        <div className="text-xs px-2 py-1 bg-[#C0C0C0] bevel">
          <span className="font-bold">12:00 PM</span>
        </div>
        <button
          className="btn-retro h-7 px-3 flex items-center gap-1 text-xs"
          title="Connect Wallet"
        >
          <Wallet size={12} />
          <span>LOGIN</span>
        </button>
      </div>
    </div>
  );
}
