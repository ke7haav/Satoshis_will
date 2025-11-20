import { useState, useEffect } from 'react';
import { Activity, Clock, Wallet, CheckCircle2 } from 'lucide-react';

interface DashboardProps {
  onClose: () => void;
  isActive: boolean;
  onActivate: () => void;
}

export default function Dashboard({ onClose, isActive, onActivate }: DashboardProps) {
  const [timeRemaining, setTimeRemaining] = useState(7776000); // Mock: 90 days in seconds
  const [vaultBalance] = useState(1.2); // Mock BTC balance
  const [isAlive] = useState(true);
  const [isPressed, setIsPressed] = useState(false);

  // Mock countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(days).padStart(3, '0')}:${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleHeartbeat = () => {
    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 200);
    setTimeRemaining(7776000); // Reset to 90 days
    console.log('Proof of life broadcasted');
  };

  return (
    <div onClick={onActivate} className={isActive ? '' : 'opacity-75'}>
      {/* Title Bar */}
      <div className="window-titlebar">
        <div className="flex items-center gap-2">
          <Activity size={14} />
          <span>SYSTEM_MONITOR</span>
        </div>
        <div className="flex gap-1">
          <button className="window-control">_</button>
          <button className="window-control">□</button>
          <button onClick={onClose} className="window-control">×</button>
        </div>
      </div>

      {/* Window Content */}
      <div className="p-4 bg-[#C0C0C0] space-y-6">
        {/* Heartbeat Button - Centerpiece */}
        <div className="flex justify-center">
          <div className="fieldset-retro">
            <legend>PROOF OF LIFE</legend>
            <div className="flex flex-col items-center gap-4 p-6">
              {/* LED Indicator */}
              <div className="flex items-center gap-3 mb-2">
                <div className={isAlive ? 'led-green' : 'led bg-gray-500'} />
                <span className="text-xs font-bold">
                  {isAlive ? 'SYSTEM ACTIVE' : 'SYSTEM INACTIVE'}
                </span>
              </div>
              
              {/* Pixelated Heartbeat Button */}
              <button
                onClick={handleHeartbeat}
                className={`btn-pixel bg-[#F7931A] text-white font-bold text-lg px-8 py-6 ${
                  isPressed ? 'bevel-pressed' : ''
                }`}
                style={{
                  imageRendering: 'pixelated',
                  imageRendering: '-moz-crisp-edges',
                  imageRendering: 'crisp-edges',
                }}
              >
                <div className="flex flex-col items-center gap-2">
                  <Activity size={32} />
                  <span>BROADCAST</span>
                  <span>PROOF OF LIFE</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Time Until Transfer */}
          <div className="fieldset-retro">
            <legend className="flex items-center gap-2">
              <Clock size={12} />
              TIME UNTIL TRANSFER
            </legend>
            <div className="mt-2">
              <div className="vcr-countdown text-center">
                {formatTime(timeRemaining)}
              </div>
              <div className="text-xs mt-2 text-gray-600 text-center">
                COUNTDOWN ACTIVE
              </div>
            </div>
          </div>

          {/* Vault Balance */}
          <div className="fieldset-retro">
            <legend className="flex items-center gap-2">
              <Wallet size={12} />
              VAULT BALANCE
            </legend>
            <div className="mt-2">
              <div className="bg-black text-[#F7931A] font-bold text-2xl text-center py-3 px-4 border-2 border-gray-800">
                {vaultBalance.toFixed(1)} BTC
              </div>
              <div className="text-xs mt-2 text-gray-600 text-center">
                SECURED IN VAULT
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="fieldset-retro">
            <legend className="flex items-center gap-2">
              <CheckCircle2 size={12} />
              STATUS
            </legend>
            <div className="mt-2">
              <div className="bg-black text-green-500 font-bold text-xl text-center py-3 px-4 border-2 border-gray-800 flex items-center justify-center gap-2">
                <div className="led-green" />
                <span>ALIVE</span>
              </div>
              <div className="text-xs mt-2 text-gray-600 text-center">
                PROTOCOL ACTIVE
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
