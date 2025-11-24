import { useState, useEffect, useCallback } from 'react';
import { Activity, Clock, Wallet, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';
import { useSatoshi } from '../hooks/useSatoshi';
import { publicKeyToBitcoinAddress } from '../utils/bitcoinAddress';

interface DashboardProps {
  onClose: () => void;
  isActive: boolean;
  onActivate: () => void;
  onTimeRemainingChange?: (timeRemaining: number) => void;
  onHasWillChange?: (hasWill: boolean) => void;
}

export default function Dashboard({ onClose, isActive, onActivate, onTimeRemainingChange, onHasWillChange }: DashboardProps) {
  const { sendHeartbeat, getVaultAddress, getVaultBalance, getWillStatus, loading, isAuthenticated } = useSatoshi();
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [vaultAddress, setVaultAddress] = useState<string>('');
  const [btcBalance, setBtcBalance] = useState<number | null>(null); // Balance in satoshis
  const [fetchingBalance, setFetchingBalance] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [isAlive] = useState(true);
  const [isPressed, setIsPressed] = useState(false);
  const [fetchingAddress, setFetchingAddress] = useState(false);
  const [heartbeatPulse, setHeartbeatPulse] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [heartbeatSeconds, setHeartbeatSeconds] = useState<number | null>(null);
  const [lastActive, setLastActive] = useState<number | null>(null);

  // Fetch BTC balance for the vault address
  const fetchBtcBalance = useCallback(async (address: string, forceRefresh: boolean = false) => {
    if (!isAuthenticated || !getVaultBalance || !address) {
      setBtcBalance(null);
      setBalanceError(null);
      return;
    }

    // Check localStorage cache first (unless forcing refresh)
    if (!forceRefresh) {
      try {
        const cachedBalance = localStorage.getItem(`btc_balance_${address}`);
        const cachedTimestamp = localStorage.getItem(`btc_balance_timestamp_${address}`);
        if (cachedBalance && cachedTimestamp) {
          const timestamp = parseInt(cachedTimestamp, 10);
          const now = Date.now();
          // Cache valid for 5 minutes
          if (now - timestamp < 5 * 60 * 1000) {
            console.log('Dashboard: Using cached BTC balance from localStorage');
            setBtcBalance(parseInt(cachedBalance, 10));
            setBalanceError(null);
            setFetchingBalance(false);
            return;
          }
        }
      } catch (e) {
        console.warn('Dashboard: Failed to read balance from localStorage:', e);
      }
    }

    setFetchingBalance(true);
    setBalanceError(null);

    try {
      console.log('Dashboard: Fetching BTC balance for address:', address);
      const balance = await getVaultBalance(address);
      console.log('Dashboard: BTC balance received:', balance, 'satoshis');

      // Cache the balance
      try {
        localStorage.setItem(`btc_balance_${address}`, balance.toString());
        localStorage.setItem(`btc_balance_timestamp_${address}`, Date.now().toString());
        console.log('Dashboard: Cached BTC balance to localStorage');
      } catch (e) {
        console.warn('Dashboard: Failed to cache balance to localStorage:', e);
      }

      setBtcBalance(balance);
      setBalanceError(null);
    } catch (err: any) {
      const errorMsg = err?.message || err?.toString() || 'Unknown error';
      setBalanceError(errorMsg);
      console.error('Dashboard: Failed to fetch BTC balance:', err);
      setBtcBalance(null);
    } finally {
      setFetchingBalance(false);
    }
  }, [isAuthenticated, getVaultBalance]);

  // Fetch vault address on mount and when authenticated
  const fetchVaultAddress = useCallback(async (forceRefresh: boolean = false) => {
    if (!isAuthenticated || !getVaultAddress) {
      setVaultAddress('');
      setAddressError(null);
      return;
    }
    
    // Check localStorage cache first (unless forcing refresh)
    if (!forceRefresh) {
      try {
        const cachedAddress = localStorage.getItem('vault_btc_address');
        if (cachedAddress) {
          console.log('Dashboard: Using cached vault BTC address from localStorage');
          setVaultAddress(cachedAddress);
          setAddressError(null);
          setFetchingAddress(false);
          return; // Use cached address, no need to fetch
        }
      } catch (e) {
        console.warn('Dashboard: Failed to read from localStorage:', e);
        // Continue to fetch from backend
      }
    }
    
    setFetchingAddress(true);
    setAddressError(null);
    if (forceRefresh) {
      setVaultAddress(''); // Reset address only on force refresh
    }
    
    try {
      console.log('Dashboard: Fetching vault address from backend...');
      const publicKeyHex = await getVaultAddress();
      console.log('Dashboard: Received public key (hex):', publicKeyHex);
      
      if (publicKeyHex && publicKeyHex.trim()) {
        // Check if it's already a Bitcoin address (starts with 1, 3, bc1, tb1, etc.)
        const isAlreadyAddress = /^(1|3|bc1|tb1|m|n|2)/.test(publicKeyHex.trim());
        
        let finalBtcAddress: string;
        
        if (isAlreadyAddress) {
          // Already a Bitcoin address, use as-is
          console.log('Dashboard: Received address is already a Bitcoin address');
          finalBtcAddress = publicKeyHex.trim();
        } else {
          // It's a public key hex, convert to Bitcoin address
          try {
            console.log('Dashboard: Converting public key to Bitcoin address...');
            // Default to testnet (backend defaults to testnet)
            finalBtcAddress = publicKeyToBitcoinAddress(publicKeyHex.trim(), 'testnet');
            console.log('Dashboard: Converted to Bitcoin address:', finalBtcAddress);
          } catch (conversionError: any) {
            console.error('Dashboard: Failed to convert public key:', conversionError);
            setAddressError(`Conversion failed: ${conversionError.message}`);
            // Still show the hex for debugging
            finalBtcAddress = publicKeyHex.trim();
          }
        }
        
        // Cache the final BTC address in localStorage
        try {
          localStorage.setItem('vault_btc_address', finalBtcAddress);
          console.log('Dashboard: Cached vault BTC address to localStorage');
        } catch (e) {
          console.warn('Dashboard: Failed to cache address to localStorage:', e);
          // Continue anyway, address is still set
        }
        
        setVaultAddress(finalBtcAddress);
        setAddressError(null);
        
        // Fetch balance for the new address (if force refresh, also refresh balance)
        if (forceRefresh) {
          fetchBtcBalance(finalBtcAddress, true);
        } else {
          fetchBtcBalance(finalBtcAddress, false);
        }
      } else {
        setAddressError('Empty response from backend');
        console.warn('Dashboard: Empty or invalid vault address received');
      }
    } catch (err: any) {
      const errorMsg = err?.message || err?.toString() || 'Unknown error';
      setAddressError(errorMsg);
      console.error('Dashboard: Failed to fetch vault address:', err);
    } finally {
      setFetchingAddress(false);
    }
  }, [isAuthenticated, getVaultAddress, fetchBtcBalance]);

  // Fetch BTC balance when vault address is available
  useEffect(() => {
    if (vaultAddress && isAuthenticated) {
      fetchBtcBalance(vaultAddress);
    } else {
      setBtcBalance(null);
      setBalanceError(null);
    }
  }, [vaultAddress, isAuthenticated, fetchBtcBalance]);

  // Fetch will status to get heartbeat timer and last_active
  useEffect(() => {
    const fetchWillStatus = async () => {
      if (!isAuthenticated || !getWillStatus) {
        setHeartbeatSeconds(null);
        setLastActive(null);
        setTimeRemaining(-1); // -1 means no will registered
        if (onHasWillChange) {
          onHasWillChange(false);
        }
        return;
      }

      try {
        console.log('Dashboard: Fetching will status...');
        const status = await getWillStatus();
        if (status) {
          setHeartbeatSeconds(status.heartbeatSeconds);
          setLastActive(status.lastActive);
          console.log('Dashboard: Will status received:', status);
          if (onHasWillChange) {
            onHasWillChange(true);
          }
        } else {
          // No will registered
          setHeartbeatSeconds(null);
          setLastActive(null);
          setTimeRemaining(-1);
          if (onHasWillChange) {
            onHasWillChange(false);
          }
        }
      } catch (err: any) {
        console.error('Dashboard: Failed to fetch will status:', err);
        // No will registered or error
        setHeartbeatSeconds(null);
        setLastActive(null);
        setTimeRemaining(-1);
        if (onHasWillChange) {
          onHasWillChange(false);
        }
      }
    };

    fetchVaultAddress();
    fetchWillStatus();
  }, [isAuthenticated, getVaultAddress, getWillStatus, onHasWillChange]);

  // Calculate and update time remaining based on will status
  useEffect(() => {
    if (heartbeatSeconds === null || lastActive === null) {
      setTimeRemaining(-1); // -1 means no will registered
      if (onTimeRemainingChange) {
        onTimeRemainingChange(-1);
      }
      return;
    }

    const calculateTimeRemaining = () => {
      const now = Math.floor(Date.now() / 1000); // Current time in seconds
      const expirationTime = lastActive + heartbeatSeconds;
      const remaining = Math.max(0, expirationTime - now);
      return remaining;
    };

    // Calculate initial time remaining
    const initialRemaining = calculateTimeRemaining();
    setTimeRemaining(initialRemaining);
    if (onTimeRemainingChange) {
      onTimeRemainingChange(initialRemaining);
    }

    // Update countdown every second
    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining();
      setTimeRemaining(remaining);
      if (onTimeRemainingChange) {
        onTimeRemainingChange(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [heartbeatSeconds, lastActive, onTimeRemainingChange]);

  const formatTime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(days).padStart(3, '0')}:${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const formatBtcBalance = (satoshis: number): string => {
    if (satoshis === 0) return '0 BTC';
    // Convert satoshis to BTC (1 BTC = 100,000,000 satoshis)
    const btc = satoshis / 100_000_000;
    if (btc >= 1) {
      // For amounts >= 1 BTC, show with 8 decimal places
      return `${btc.toFixed(8)} BTC`;
    } else if (btc >= 0.00001) {
      // For amounts >= 0.00001 BTC, show with appropriate precision
      return `${btc.toFixed(8)} BTC`;
    } else {
      // For very small amounts, show in satoshis
      return `${satoshis.toLocaleString()} sats`;
    }
  };

  const handleHeartbeat = async () => {
    if (!isAuthenticated) {
      alert('Please login first');
      return;
    }
    setIsPressed(true);
    try {
      await sendHeartbeat();
      // Refresh will status to get updated last_active timestamp
      if (getWillStatus) {
        const status = await getWillStatus();
        if (status) {
          setHeartbeatSeconds(status.heartbeatSeconds);
          setLastActive(status.lastActive);
        }
      }
      // Trigger pulse animation
      setHeartbeatPulse(true);
      setTimeout(() => setHeartbeatPulse(false), 1000);
    } catch (err) {
      console.error('Failed to send heartbeat:', err);
      alert(`ERROR: Failed to send heartbeat.\n\n${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setTimeout(() => setIsPressed(false), 200);
    }
  };

  return (
    <div onClick={(e) => {
      // Only activate if clicking on the window container, not on interactive elements
      if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.window-titlebar')) {
        onActivate();
      }
    }} className={isActive ? '' : 'opacity-75'}>
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
                disabled={loading || !isAuthenticated}
                className={`btn-pixel bg-[#F7931A] text-white font-bold text-lg px-8 py-6 ${
                  isPressed ? 'bevel-pressed' : ''
                } ${loading || !isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''} ${
                  heartbeatPulse ? 'animate-pulse' : ''
                }`}
                style={{
                  imageRendering: 'pixelated' as any,
                  boxShadow: heartbeatPulse ? '0 0 30px rgba(247, 147, 26, 0.8)' : undefined,
                  transform: heartbeatPulse ? 'scale(1.05)' : undefined,
                  transition: 'all 0.3s ease',
                }}
              >
                <div className="flex flex-col items-center gap-2">
                  {loading ? (
                    <Loader2 size={32} className="animate-spin" />
                  ) : (
                    <Activity size={32} />
                  )}
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
              {timeRemaining < 0 ? (
                <>
                  <div className="bg-black text-gray-500 font-mono text-xs text-center py-3 px-4 border-2 border-gray-800">
                    NO PROTOCOL INITIALIZED
                  </div>
                  <div className="text-xs mt-2 text-gray-600 text-center">
                    Initialize protocol to start countdown
                  </div>
                </>
              ) : (
                <>
                  <div className={`vcr-countdown text-center transition-all duration-300 ${
                    heartbeatPulse ? 'scale-110 brightness-150' : ''
                  }`}>
                    {formatTime(timeRemaining)}
                  </div>
                  <div className="text-xs mt-2 text-gray-600 text-center">
                    COUNTDOWN ACTIVE
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Vault Address */}
          <div className="fieldset-retro">
            <legend className="flex items-center gap-2">
              <Wallet size={12} />
              VAULT BTC ADDRESS
              <button
                onClick={() => fetchVaultAddress(true)}
                disabled={fetchingAddress || !isAuthenticated}
                className="ml-auto btn-retro px-2 py-1 text-xs flex items-center gap-1"
                title="Refresh vault address (force fetch from backend)"
              >
                <RefreshCw size={10} className={fetchingAddress ? 'animate-spin' : ''} />
              </button>
            </legend>
            <div className="mt-2">
              {fetchingAddress ? (
                <div className="bg-black text-gray-500 font-mono text-xs text-center py-3 px-4 border-2 border-gray-800 flex items-center justify-center gap-2">
                  <Loader2 size={14} className="animate-spin" />
                  LOADING...
                </div>
              ) : addressError ? (
                <div className="bg-black text-red-500 font-mono text-xs text-center py-3 px-4 border-2 border-red-800">
                  <div>ERROR: {addressError}</div>
                  <button
                    onClick={() => fetchVaultAddress(true)}
                    className="btn-retro mt-2 px-3 py-1 text-xs"
                  >
                    RETRY
                  </button>
                </div>
              ) : vaultAddress ? (
                <>
                  <div className="bg-black text-[#F7931A] font-mono text-xs text-center py-3 px-4 border-2 border-gray-800 break-all">
                    {vaultAddress}
                  </div>
                  <div className="text-xs mt-2 text-gray-600 text-center">
                    {vaultAddress.startsWith('tb1') || vaultAddress.startsWith('m') || vaultAddress.startsWith('n') 
                      ? 'Testnet Bitcoin Address (Native SegWit)' 
                      : vaultAddress.startsWith('bc1') || vaultAddress.startsWith('1')
                      ? 'Mainnet Bitcoin Address'
                      : 'Your unique vault address'}
                  </div>
                  
                  {/* BTC Balance Display */}
                  <div className="mt-3 pt-3 border-t-2 border-gray-600">
                    <div className="text-xs font-bold mb-1 text-gray-700">BTC BALANCE:</div>
                    {fetchingBalance ? (
                      <div className="bg-black text-gray-500 font-mono text-xs text-center py-2 px-3 border-2 border-gray-800 flex items-center justify-center gap-2">
                        <Loader2 size={12} className="animate-spin" />
                        CHECKING...
                      </div>
                    ) : balanceError ? (
                      <div className="bg-black text-yellow-500 font-mono text-xs text-center py-3 px-4 border-2 border-yellow-800">
                        <div className="font-bold mb-2">⚠️ LOCAL DEVELOPMENT LIMITATION</div>
                        <div className="text-[10px] leading-tight mb-2">
                          {balanceError.includes('not available in local development') || balanceError.includes('not found') ? (
                            <>
                              Bitcoin balance checking requires IC Mainnet deployment.<br/>
                              This feature is not available in local DFX development.
                            </>
                          ) : (
                            balanceError
                          )}
                        </div>
                        <div className="text-[9px] text-yellow-300 mt-2">
                          To test Bitcoin features, deploy to IC Mainnet
                        </div>
                      </div>
                    ) : btcBalance !== null ? (
                      <div className="bg-black text-green-500 font-mono text-base font-bold text-center py-2 px-3 border-2 border-gray-800">
                        {formatBtcBalance(btcBalance)}
                      </div>
                    ) : (
                      <div className="bg-black text-gray-500 font-mono text-xs text-center py-2 px-3 border-2 border-gray-800">
                        Not available
                      </div>
                    )}
                    <div className="flex justify-end mt-1">
                      <button
                        onClick={() => fetchBtcBalance(vaultAddress, true)}
                        disabled={fetchingBalance}
                        className="btn-retro px-2 py-1 text-xs flex items-center gap-1"
                        title="Refresh BTC balance"
                      >
                        <RefreshCw size={10} className={fetchingBalance ? 'animate-spin' : ''} />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-black text-gray-500 font-mono text-xs text-center py-3 px-4 border-2 border-gray-800">
                  {isAuthenticated ? 'Not available - Click refresh' : 'Please login first'}
                </div>
              )}
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

