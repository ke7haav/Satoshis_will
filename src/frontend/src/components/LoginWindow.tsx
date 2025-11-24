import { CreditCard, Lock } from 'lucide-react';

interface LoginWindowProps {
  onClose: () => void;
  isActive: boolean;
  onActivate: () => void;
  onLogin: () => void;
}

export default function LoginWindow({ onClose, isActive, onActivate, onLogin }: LoginWindowProps) {
  return (
    <div onClick={onActivate} className={isActive ? '' : 'opacity-75'}>
      {/* Title Bar */}
      <div className="window-titlebar">
        <div className="flex items-center gap-2">
          <Lock size={14} />
          <span>ACCESS_TERMINAL.EXE</span>
        </div>
        <div className="flex gap-1">
          <button className="window-control">_</button>
          <button className="window-control">□</button>
          <button onClick={onClose} className="window-control">×</button>
        </div>
      </div>

      {/* Window Content */}
      <div className="p-8 bg-[#C0C0C0]">
        <div className="text-center space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-24 h-24 bg-[#C0C0C0] bevel flex items-center justify-center">
              <CreditCard className="text-[#000080]" size={48} />
            </div>
          </div>

          {/* Message */}
          <div>
            <h2 className="text-xl font-bold text-black mb-2">SECURITY CLEARANCE REQUIRED</h2>
            <p className="text-sm text-gray-700">
              PLEASE CONNECT HARDWARE WALLET
            </p>
          </div>

          {/* Internet Identity Login Button */}
          <div className="pt-4">
            <button
              onClick={onLogin}
              className="btn-retro px-12 py-4 text-lg font-bold w-full"
            >
              <div className="flex items-center justify-center gap-3">
                <CreditCard size={24} />
                <span>INSERT KEY / CONNECT</span>
              </div>
            </button>
          </div>

          {/* Info */}
          <div className="text-xs text-gray-600 pt-4">
            Click the button above to connect your Internet Identity wallet
          </div>
        </div>
      </div>
    </div>
  );
}

