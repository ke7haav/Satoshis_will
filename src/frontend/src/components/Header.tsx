import { Wallet, Square, LogOut, Lock, Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface HeaderProps {
  activeWindow: 'login' | 'setup' | 'dashboard' | 'claim';
  onWindowToggle: (view: 'setup' | 'dashboard' | 'claim') => void;
  satoshi: {
    isAuthenticated: boolean;
    principal: string | null;
    login: () => Promise<void>;
    logout: () => Promise<void>;
  };
  isDead?: boolean;
}

export default function Header({ activeWindow, onWindowToggle, satoshi, isDead = false }: HeaderProps) {
  const [copied, setCopied] = useState(false);

  const shortenPrincipal = (principal: string) => {
    if (principal.length <= 20) return principal;
    return `${principal.slice(0, 6)}...${principal.slice(-6)}`;
  };

  const isWindowOpen = (view: 'setup' | 'dashboard' | 'claim') => {
    return activeWindow === view;
  };

  const handleDisabledClick = () => {
    alert('ACCESS DENIED\n\nAuthentication required to access this feature.');
  };

  const handleCopyPrincipal = async () => {
    if (!satoshi.principal) return;
    
    try {
      await navigator.clipboard.writeText(satoshi.principal);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = satoshi.principal;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

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

      {/* Window Buttons (Taskbar) - Visually disabled when not authenticated */}
      <div className="flex gap-1 flex-1">
        {!satoshi.isAuthenticated ? (
          <>
            {/* Disabled buttons - flat gray look */}
            <button
              onClick={handleDisabledClick}
              className="h-7 px-3 text-xs bg-[#C0C0C0] text-gray-500 border border-gray-600 cursor-pointer flex items-center gap-1"
              style={{
                border: '1px solid #808080',
                boxShadow: 'none',
              }}
            >
              <Lock size={10} />
              INITIALIZE_PROTOCOL.EXE
            </button>
            <button
              onClick={handleDisabledClick}
              className="h-7 px-3 text-xs bg-[#C0C0C0] text-gray-500 border border-gray-600 cursor-pointer flex items-center gap-1"
              style={{
                border: '1px solid #808080',
                boxShadow: 'none',
              }}
            >
              <Lock size={10} />
              SYSTEM_MONITOR
            </button>
            <button
              onClick={handleDisabledClick}
              className="h-7 px-3 text-xs bg-[#C0C0C0] text-gray-500 border border-gray-600 cursor-pointer flex items-center gap-1"
              style={{
                border: '1px solid #808080',
                boxShadow: 'none',
              }}
            >
              <Lock size={10} />
              CRITICAL_ALERT
            </button>
          </>
        ) : (
          <>
            {/* Active buttons - 3D beveled look */}
            <button
              onClick={() => onWindowToggle('setup')}
              className={`btn-retro h-7 px-3 text-xs ${
                isWindowOpen('setup') ? 'bevel-pressed' : ''
              }`}
              title="Initialize Protocol"
            >
              INITIALIZE_PROTOCOL.EXE
            </button>
            <button
              onClick={() => onWindowToggle('dashboard')}
              className={`btn-retro h-7 px-3 text-xs ${
                isWindowOpen('dashboard') ? 'bevel-pressed' : ''
              }`}
              title="System Monitor"
            >
              SYSTEM_MONITOR
            </button>
            <button
              onClick={() => onWindowToggle('claim')}
              className={`btn-retro h-7 px-3 text-xs ${
                isWindowOpen('claim') ? 'bevel-pressed' : ''
              } ${isDead ? 'bg-red-600 text-white' : ''}`}
              title={isDead ? 'CRITICAL: Protocol Activated - Claim Available' : 'Critical Alert (System Secure)'}
            >
              CRITICAL_ALERT
              {isDead && <span className="ml-1 animate-pulse">⚠</span>}
            </button>
          </>
        )}
      </div>

      {/* System Tray */}
      <div className="flex items-center gap-1">
        <div className="text-xs px-2 py-1 bg-[#C0C0C0] bevel">
          <span className="font-bold">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        {!satoshi.isAuthenticated ? (
          <button
            onClick={satoshi.login}
            className="btn-retro h-7 px-3 flex items-center gap-1 text-xs"
            title="Connect Wallet"
          >
            <Wallet size={12} />
            <span>CONNECT</span>
          </button>
        ) : (
          <div className="flex items-center gap-1">
            <button
              onClick={handleCopyPrincipal}
              className="text-xs px-2 py-1 bg-[#C0C0C0] bevel font-mono flex items-center gap-1 hover:bg-[#D4D4D4] transition-colors cursor-pointer"
              title={copied ? 'Copied!' : 'Click to copy Principal ID'}
            >
              <span>{satoshi.principal ? shortenPrincipal(satoshi.principal) : 'USER'}</span>
              {copied ? (
                <Check size={10} className="text-green-600" />
              ) : (
                <Copy size={10} className="opacity-70" />
              )}
            </button>
            <button
              onClick={satoshi.logout}
              className="btn-retro h-7 px-3 flex items-center gap-1 text-xs"
              title="Disconnect"
            >
              <LogOut size={12} />
              <span>DISCONNECT</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
