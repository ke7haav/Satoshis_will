import { useState, useEffect } from 'react';
import { CreditCard, Lock, Key, Loader2 } from 'lucide-react';

interface LoginWindowProps {
  onClose: () => void;
  isActive: boolean;
  onActivate: () => void;
  onLogin: () => void;
  onLoginWithPrincipal?: (principalId: string) => Promise<boolean>;
  currentPrincipal?: string | null;
}

export default function LoginWindow({ onClose, isActive, onActivate, onLogin, onLoginWithPrincipal, currentPrincipal }: LoginWindowProps) {
  const [principalId, setPrincipalId] = useState(currentPrincipal || '');
  const [loginMode, setLoginMode] = useState<'quick' | 'new'>('quick'); // 'quick' = Principal ID, 'new' = Internet Identity
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update principal ID if currentPrincipal changes
  useEffect(() => {
    if (currentPrincipal) {
      setPrincipalId(currentPrincipal);
    }
  }, [currentPrincipal]);

  const handleQuickLogin = async () => {
    if (!principalId.trim() || !onLoginWithPrincipal) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const success = await onLoginWithPrincipal(principalId.trim());
      if (!success) {
        setError('No stored identity found for this Principal ID. Please use "NEW LOGIN" to create a new identity.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to login with Principal ID');
    } finally {
      setLoading(false);
    }
  };
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
              {loginMode === 'quick' ? 'ENTER PRINCIPAL ID TO LOGIN' : 'PLEASE CONNECT HARDWARE WALLET'}
            </p>
          </div>

          {/* Mode Toggle */}
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => {
                setLoginMode('quick');
                setError(null);
                setPrincipalId('');
              }}
              className={`btn-retro px-4 py-2 text-xs ${
                loginMode === 'quick' ? 'bevel-pressed bg-[#D4D4D4]' : ''
              }`}
            >
              <div className="flex items-center gap-1">
                <Key size={12} />
                QUICK LOGIN
              </div>
            </button>
            <button
              onClick={() => {
                setLoginMode('new');
                setError(null);
                setPrincipalId('');
              }}
              className={`btn-retro px-4 py-2 text-xs ${
                loginMode === 'new' ? 'bevel-pressed bg-[#D4D4D4]' : ''
              }`}
            >
              <div className="flex items-center gap-1">
                <CreditCard size={12} />
                NEW LOGIN
              </div>
            </button>
          </div>

          {/* Quick Login - Principal ID Input */}
          {loginMode === 'quick' && (
            <div className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-bold mb-1 text-left">
                  PRINCIPAL ID:
                </label>
                <input
                  type="text"
                  value={principalId}
                  onChange={(e) => {
                    setPrincipalId(e.target.value);
                    setError(null);
                  }}
                  placeholder="e.g., 6kbp3-k3vff-..."
                  className="input-retro w-full"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && principalId.trim() && onLoginWithPrincipal) {
                      handleQuickLogin();
                    }
                  }}
                />
                {currentPrincipal && (
                  <div className="text-xs mt-1 text-green-600 font-bold text-left">
                    ✓ Stored identity found: {currentPrincipal.slice(0, 10)}...
                  </div>
                )}
                <div className="text-xs mt-1 text-gray-600 text-left">
                  {currentPrincipal 
                    ? 'Enter your Principal ID to verify and login'
                    : 'Enter your Principal ID to check for stored identity'}
                </div>
              </div>

              {error && (
                <div className="bg-red-500 text-white p-2 border-2 border-black text-xs font-bold">
                  ⚠️ {error}
                </div>
              )}
              
              {currentPrincipal && principalId === currentPrincipal && !error && (
                <div className="bg-green-500 text-white p-2 border-2 border-black text-xs font-bold">
                  ✓ Principal ID matches stored identity. Click button to login.
                </div>
              )}

              <button
                onClick={handleQuickLogin}
                disabled={loading || !principalId.trim() || !onLoginWithPrincipal}
                className={`btn-retro px-8 py-3 text-base font-bold w-full ${
                  loading || !principalId.trim() ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      <span>VERIFYING...</span>
                    </>
                  ) : (
                    <>
                      <Key size={20} />
                      <span>LOGIN WITH PRINCIPAL ID</span>
                    </>
                  )}
                </div>
              </button>
            </div>
          )}

          {/* New Login - Internet Identity Button */}
          {loginMode === 'new' && (
            <>
              <div className="pt-4">
                <button
                  onClick={onLogin}
                  className="btn-retro px-12 py-4 text-lg font-bold"
                >
                  <div className="flex items-center gap-3">
                    <CreditCard size={24} />
                    <span>INSERT KEY / CONNECT</span>
                  </div>
                </button>
              </div>

              {/* Info */}
              <div className="text-xs text-gray-600 pt-4">
                Click the button above to connect your Internet Identity wallet
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

