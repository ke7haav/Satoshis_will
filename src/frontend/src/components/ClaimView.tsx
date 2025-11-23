import { useState, useEffect } from 'react';
import { AlertTriangle, Unlock, Eye, EyeOff, Copy, Check, Loader2, ShieldCheck, RefreshCw } from 'lucide-react';
import { useSatoshi } from '../hooks/useSatoshi';

interface ClaimViewProps {
  onClose: () => void;
  isActive: boolean;
  onActivate: () => void;
  isDead: boolean;
  onExpiredInheritancesChange?: (hasExpired: boolean) => void;
}

interface InheritanceInfo {
  ownerPrincipal: string;
  beneficiaryBtcAddress: string;
  heartbeatSeconds: number;
  lastActive: number;
  timeRemaining: number;
  isExpired: boolean;
}

export default function ClaimView({ onClose, isActive, onActivate, isDead, onExpiredInheritancesChange }: ClaimViewProps) {
  const { claimInheritance, getMyInheritances, loading, error, isAuthenticated, principal } = useSatoshi();
  const [inheritances, setInheritances] = useState<InheritanceInfo[]>([]);
  const [selectedOwner, setSelectedOwner] = useState<string>('');
  const [isClaimed, setIsClaimed] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [copied, setCopied] = useState(false);
  const [secretData, setSecretData] = useState<string>('');
  const [fetchingInheritances, setFetchingInheritances] = useState(false);

  // Fetch inheritances on mount and when authenticated
  useEffect(() => {
    const fetchInheritances = async () => {
      if (!isAuthenticated || !getMyInheritances) {
        setInheritances([]);
        return;
      }
      setFetchingInheritances(true);
      try {
        const result = await getMyInheritances();
        setInheritances(result);
        // Check if there are expired inheritances
        const hasExpired = result.some((i: InheritanceInfo) => i.isExpired);
        if (onExpiredInheritancesChange) {
          onExpiredInheritancesChange(hasExpired);
        }
        // Auto-select first expired inheritance if available
        const expired = result.find((i: InheritanceInfo) => i.isExpired);
        if (expired) {
          setSelectedOwner(expired.ownerPrincipal);
        }
      } catch (err) {
        console.error('Failed to fetch inheritances:', err);
        if (onExpiredInheritancesChange) {
          onExpiredInheritancesChange(false);
        }
      } finally {
        setFetchingInheritances(false);
      }
    };
    fetchInheritances();
  }, [isAuthenticated, getMyInheritances]);

  const handleClaim = async () => {
    if (!isAuthenticated) {
      alert('Please login first');
      return;
    }
    if (!selectedOwner.trim()) {
      alert('Please select an inheritance to claim');
      return;
    }
    
    try {
      const result = await claimInheritance(selectedOwner);
      if (result) {
        // Convert the blob/bytes to a readable format
        // In a real app, this would be decrypted vetKey data
        const decoder = new TextDecoder();
        const decoded = decoder.decode(new Uint8Array(result));
        setSecretData(decoded || 'Encrypted secret data received. Decryption required.');
        setIsClaimed(true);
      }
    } catch (err: any) {
      console.error('Failed to claim inheritance:', err);
      alert(err.message || 'Failed to claim inheritance');
    }
  };

  const formatTime = (seconds: number) => {
    if (seconds <= 0) return 'EXPIRED';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else {
      return `${minutes}m ${secs}s`;
    }
  };

  const handleCopy = () => {
    if (secretData) {
      navigator.clipboard.writeText(secretData);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div onClick={(e) => {
      // Only activate if clicking on the window container, not on interactive elements
      if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.window-titlebar')) {
        onActivate();
      }
    }} className={isActive ? '' : 'opacity-75'}>
      {/* Title Bar - Red when dead, Blue/Green when alive */}
      <div className={`px-2 py-1 flex items-center justify-between ${
        isDead 
          ? 'bg-gradient-to-r from-red-600 to-red-700 text-white' 
          : 'bg-gradient-to-r from-[#000080] to-[#0000FF] text-white'
      }`}>
        <div className="flex items-center gap-2">
          {isDead ? <AlertTriangle size={14} /> : <ShieldCheck size={14} />}
          <span className="font-bold text-xs">CRITICAL_ALERT</span>
        </div>
        <div className="flex gap-1">
          <button className="window-control">_</button>
          <button className="window-control">□</button>
          <button onClick={onClose} className="window-control">×</button>
        </div>
      </div>

      {/* Window Content */}
      <div className="p-4 bg-[#C0C0C0] space-y-4">
        {!isAuthenticated && (
          <div className="bg-yellow-500 text-black p-2 border-2 border-black text-xs font-bold mb-4">
            ⚠️ Please LOGIN first to claim inheritance
          </div>
        )}
        
        {error && (
          <div className="bg-red-500 text-white p-2 border-2 border-black text-xs font-bold mb-4">
            ERROR: {error}
          </div>
        )}

        {/* Protocol Status - Different content based on isDead or expired inheritances */}
        {(isDead || inheritances.some(i => i.isExpired)) ? (
          <div className="fieldset-retro border-red-600 border-4">
            <legend className="bg-red-600 text-white px-2">PROTOCOL STATUS</legend>
            <div className="p-4 bg-black text-red-600">
              <div className="flex items-center gap-3 mb-3">
                <AlertTriangle className="text-red-600" size={32} />
                <div>
                  <div className="text-2xl font-bold">PROTOCOL ACTIVATED</div>
                  <div className="text-sm text-red-400">Heartbeat timer expired</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs mt-4">
                <div>
                  <span className="text-gray-400">Owner Status:</span>
                  <span className="ml-2 text-red-600 font-bold">DECEASED</span>
                </div>
                <div>
                  <span className="text-gray-400">Time Elapsed:</span>
                  <span className="ml-2 text-red-400 font-mono">Timer expired</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="fieldset-retro border-green-600 border-4">
            <legend className="bg-green-600 text-white px-2">PROTOCOL STATUS</legend>
            <div className="p-4 bg-black text-green-500">
              <div className="flex items-center gap-3 mb-3">
                <ShieldCheck className="text-green-500" size={32} />
                <div>
                  <div className="text-2xl font-bold">SYSTEM SECURE</div>
                  <div className="text-sm text-green-400">PROTOCOL DORMANT</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs mt-4">
                <div>
                  <span className="text-gray-400">Owner Status:</span>
                  <span className="ml-2 text-green-500 font-bold">ALIVE</span>
                </div>
                <div>
                  <span className="text-gray-400">System Status:</span>
                  <span className="ml-2 text-green-400 font-mono">ACTIVE</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Inheritances List */}
        {!isClaimed && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold">
                PENDING INHERITANCES:
              </label>
              <button
                onClick={async () => {
                  if (getMyInheritances) {
                    setFetchingInheritances(true);
                    try {
                      const result = await getMyInheritances();
                      setInheritances(result);
                    } catch (err) {
                      console.error('Failed to refresh:', err);
                    } finally {
                      setFetchingInheritances(false);
                    }
                  }
                }}
                disabled={fetchingInheritances}
                className="btn-retro px-2 py-1 text-xs flex items-center gap-1"
                title="Refresh inheritances"
              >
                <RefreshCw size={10} className={fetchingInheritances ? 'animate-spin' : ''} />
              </button>
            </div>
            
            {fetchingInheritances ? (
              <div className="bg-black text-gray-500 font-mono text-xs text-center py-4 px-4 border-2 border-gray-800 flex items-center justify-center gap-2">
                <Loader2 size={14} className="animate-spin" />
                LOADING INHERITANCES...
              </div>
            ) : inheritances.length === 0 ? (
              <div className="bg-black text-gray-500 font-mono text-xs text-center py-4 px-4 border-2 border-gray-800">
                NO PENDING INHERITANCES
                <div className="text-xs mt-2 text-gray-600">
                  You are not listed as a beneficiary in any registered wills
                </div>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {inheritances.map((inheritance) => (
                  <div
                    key={inheritance.ownerPrincipal}
                    onClick={() => setSelectedOwner(inheritance.ownerPrincipal)}
                    className={`fieldset-retro border-2 cursor-pointer transition-all ${
                      selectedOwner === inheritance.ownerPrincipal
                        ? 'border-[#000080] bg-blue-100'
                        : inheritance.isExpired
                        ? 'border-red-600'
                        : 'border-gray-600'
                    }`}
                  >
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-bold">
                          {inheritance.isExpired ? (
                            <span className="text-red-600">⚠️ EXPIRED - READY TO CLAIM</span>
                          ) : (
                            <span className="text-gray-600">ACTIVE</span>
                          )}
                        </div>
                        <div className="text-xs font-mono text-gray-500">
                          {inheritance.ownerPrincipal.slice(0, 8)}...
                        </div>
                      </div>
                      <div className="text-xs space-y-1">
                        <div>
                          <span className="text-gray-400">Time Remaining:</span>
                          <span className={`ml-2 font-bold ${
                            inheritance.isExpired ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {formatTime(inheritance.timeRemaining)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400">BTC Address:</span>
                          <span className="ml-2 font-mono text-xs">
                            {inheritance.beneficiaryBtcAddress.slice(0, 20)}...
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {inheritances.length > 0 && (
              <div className="text-xs mt-2 text-gray-600">
                <div>Click on an inheritance to select it, then click "CLAIM INHERITANCE"</div>
                <div className="text-yellow-600 font-bold mt-1">
                  ⚠️ Only expired inheritances can be claimed
                </div>
              </div>
            )}
          </div>
        )}

        {/* Claim Button - Only enabled when dead */}
        {!isClaimed && (
          <div className="flex justify-center">
            <button
              onClick={handleClaim}
              disabled={loading || !isAuthenticated || !selectedOwner.trim() || !inheritances.find(i => i.ownerPrincipal === selectedOwner)?.isExpired}
              className={`btn-critical px-12 py-4 text-lg ${
                loading || !isAuthenticated || !selectedOwner.trim() || !inheritances.find(i => i.ownerPrincipal === selectedOwner)?.isExpired
                  ? 'opacity-50 cursor-not-allowed' 
                  : ''
              }`}
            >
              <div className="flex items-center gap-3">
                {loading ? (
                  <Loader2 size={24} className="animate-spin" />
                ) : (
                  <Unlock size={24} />
                )}
                <span>{loading ? 'CLAIMING...' : 'CLAIM INHERITANCE'}</span>
              </div>
            </button>
            {selectedOwner && !inheritances.find(i => i.ownerPrincipal === selectedOwner)?.isExpired && (
              <div className="text-xs text-center mt-2 text-yellow-600 font-bold">
                ⚠️ Selected inheritance timer has not expired yet
              </div>
            )}
            {!selectedOwner && inheritances.length > 0 && (
              <div className="text-xs text-center mt-2 text-gray-600">
                Please select an inheritance from the list above
              </div>
            )}
          </div>
        )}

        {/* Secret Reveal Section */}
        {isClaimed && (
          <div className="fieldset-retro border-4 border-[#000080]">
            <legend className="bg-[#000080] text-white px-2 flex items-center gap-2">
              <Unlock size={12} />
              DIGITAL WILL UNLOCKED
            </legend>
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-600">
                  The encrypted secret has been revealed
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopy}
                    className="btn-retro px-3 py-1 text-xs flex items-center gap-1"
                    title="Copy to clipboard"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    COPY
                  </button>
                  <button
                    onClick={() => setShowSecret(!showSecret)}
                    className="btn-retro px-3 py-1 text-xs flex items-center gap-1"
                    title={showSecret ? 'Hide secret' : 'Show secret'}
                  >
                    {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
                    {showSecret ? 'HIDE' : 'SHOW'}
                  </button>
                </div>
              </div>

              {showSecret ? (
                <div className="bg-black text-green-400 p-4 border-2 border-gray-800 font-mono text-xs whitespace-pre-wrap">
                  {secretData}
                </div>
              ) : (
                <div className="bg-black text-gray-600 p-8 border-2 border-gray-800 text-center">
                  <EyeOff size={48} className="mx-auto mb-2 opacity-50" />
                  <div className="text-xs">Click SHOW to reveal the secret</div>
                </div>
              )}

              <div className="bg-yellow-500 text-black p-2 border-2 border-black text-xs font-bold">
                ⚠️ WARNING: This information is sensitive. Store it securely.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
