import { useState, useEffect, useCallback } from 'react';
import { AuthClient } from '@dfinity/auth-client';
import { Actor, HttpAgent } from '@dfinity/agent';

// Import directly from .did.js to avoid process.env issues in index.js
let idlFactory: any = null;
type _SERVICE = any;

// Dynamic import to avoid bundling issues
const loadDeclarations = async () => {
  try {
    // Import directly from the .did.js file to avoid process.env in index.js
    // @ts-ignore - Vite will try to resolve this, but we handle errors gracefully
    const backendDid = await import(/* @vite-ignore */ '../../../declarations/backend/backend.did.js');
    idlFactory = backendDid.idlFactory;
    return true;
  } catch (e: any) {
    // Silently fail - declarations will be loaded when dfx generate is run
    if (e?.message?.includes('Failed to resolve') || e?.code === 'ERR_MODULE_NOT_FOUND') {
      // This is expected if dfx generate hasn't been run yet
      return false;
    }
    console.warn('Error loading declarations:', e);
    return false;
  }
};

// The Canister ID is injected by Vite from .env files during build
// Vite only exposes variables prefixed with VITE_ to the client
const getEnvVar = (key: string, fallback?: string): string | undefined => {
  const meta = import.meta as any;
  const env = meta.env || {};
  
  // Vite standard: try VITE_ prefix first
  if (env[`VITE_${key}`]) return env[`VITE_${key}`];
  
  // Fallback: try exact key (for vite-plugin-environment)
  if (env[key]) return env[key];
  
  return fallback;
};

const canisterId = getEnvVar('VITE_CANISTER_ID_BACKEND') || getEnvVar('CANISTER_ID_BACKEND') || 'uzt4z-lp777-77774-qaabq-cai';

export const useSatoshi = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [principal, setPrincipal] = useState<string | null>(null);
  const [backend, setBackend] = useState<_SERVICE | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [declarationsLoaded, setDeclarationsLoaded] = useState(false);
  const [authClientInstance, setAuthClientInstance] = useState<AuthClient | null>(null); // Store AuthClient instance

  // 0. Load declarations on mount - don't block rendering
  useEffect(() => {
    loadDeclarations().then(loaded => {
      setDeclarationsLoaded(loaded);
    }).catch(err => {
      console.warn('Failed to load declarations:', err);
      setDeclarationsLoaded(false);
    });
  }, []);

  // 1. Initialize Auth Client
  const initAuth = useCallback(async () => {
    try {
      // Configure AuthClient with extended timeouts for Dead Man Switch use case
      // Users might not log in frequently, so we extend session duration
      const authClient = await AuthClient.create({
        idleOptions: {
          idleTimeout: 1000 * 60 * 60 * 24, // 24 hours of inactivity before timeout (default is 10 minutes)
          disableDefaultIdleCallback: true, // Don't reload page on idle
        },
      });
      setAuthClientInstance(authClient); // Store the instance
      
      if (await authClient.isAuthenticated()) {
        // Only try to authenticate if declarations are loaded
        if (declarationsLoaded && idlFactory) {
          await handleAuthenticated(authClient);
        } else {
          // Still set auth state even without backend connection
          const identity = authClient.getIdentity();
          const userPrincipal = identity.getPrincipal().toText();
          setPrincipal(userPrincipal);
          setIsAuthenticated(true);
        }
      }
    } catch (err) {
      console.warn('Auth initialization error:', err);
      // Don't throw - allow app to render
    }
  }, [declarationsLoaded]);

  // 2. Handle Login Success
  const handleAuthenticated = async (authClient: AuthClient) => {
    if (!idlFactory) {
      setError('Backend declarations not loaded. Please run: dfx generate backend');
      return;
    }

    const identity = authClient.getIdentity();
    const userPrincipal = identity.getPrincipal().toText();
    setPrincipal(userPrincipal);
    setIsAuthenticated(true);

    // Create the Actor (Connection to Backend)
    const agent = new HttpAgent({ identity });
    
    // ONLY for local development: fetch root key
    const network = getEnvVar('DFX_NETWORK') || getEnvVar('VITE_DFX_NETWORK') || 'local';
    if (network !== 'ic') {
      await agent.fetchRootKey();
    }

    if (!canisterId) {
      setError('Backend canister ID not found. Please run dfx generate backend and check your .env file.');
      return;
    }

    try {
      const actor = Actor.createActor<_SERVICE>(idlFactory, {
        agent,
        canisterId: canisterId as string,
      });

      setBackend(actor);
    } catch (err: any) {
      setError(`Failed to create actor: ${err.message}`);
    }
  };

  // 3. Login Function
  const login = async () => {
    try {
      // Use stored AuthClient instance if available, otherwise create new one
      let authClient = authClientInstance;
      if (!authClient) {
        authClient = await AuthClient.create();
        setAuthClientInstance(authClient);
      }
      
      // Check if already authenticated (persistent login)
      if (await authClient.isAuthenticated()) {
        console.log('User already authenticated, restoring session...');
        await handleAuthenticated(authClient);
        return; // Don't redirect if already logged in
      }
      
      const network = getEnvVar('DFX_NETWORK') || 'local';
      // Direct access to VITE_ prefixed variable (Vite standard)
      const meta = import.meta as any;
      // Fallback to hardcoded value if env var not found (for local dev)
      const internetIdentityId = meta.env?.VITE_CANISTER_ID_INTERNET_IDENTITY || 
                                  getEnvVar('CANISTER_ID_INTERNET_IDENTITY') ||
                                  'uxrrr-q7777-77774-qaaaq-cai'; // Fallback for local dev
      
      if (!internetIdentityId) {
        setError('Internet Identity canister ID not found. Please run: dfx deploy internet_identity && dfx generate');
        console.error('Missing CANISTER_ID_INTERNET_IDENTITY. Available env vars:', Object.keys(meta.env || {}));
        return;
      }
      
      console.log('Logging in with Internet Identity:', internetIdentityId);
      
      // Set maxTimeToLive to 30 days (in nanoseconds)
      // This extends the authentication delegation from default 8 hours to 30 days
      // Important for Dead Man Switch where users might not log in frequently
      const maxTimeToLive = BigInt(30 * 24 * 60 * 60 * 1_000_000_000); // 30 days in nanoseconds
      
      await authClient.login({
        identityProvider:
          network === 'ic'
            ? 'https://identity.ic0.app'
            : `http://${internetIdentityId}.localhost:4943`, // Local II
        maxTimeToLive: maxTimeToLive, // Extend session to 30 days (default is 8 hours)
        onSuccess: () => {
          // After successful login, the identity is automatically saved to localStorage
          handleAuthenticated(authClient);
        },
      });
    } catch (err: any) {
      setError(`Login failed: ${err.message}`);
      console.error('Login error:', err);
    }
  };

  // 4. Logout Function
  const logout = async () => {
    const authClient = authClientInstance || await AuthClient.create();
    await authClient.logout();
    setIsAuthenticated(false);
    setBackend(null);
    setPrincipal(null);
    setAuthClientInstance(null);
  };

  // --- PROTOCOL FUNCTIONS ---

  const registerWill = async (beneficiaryId: string, btcAddress: string, days: number, digitalWill: string = '') => {
    if (!backend) return;
    setLoading(true);
    try {
      // Convert days to seconds
      const seconds = BigInt(days * 24 * 60 * 60);
      const benPrincipal = await import('@dfinity/principal').then(p => p.Principal.fromText(beneficiaryId));
      
      // Convert digitalWill string to Uint8Array (blob)
      const encryptedSecret = digitalWill ? new TextEncoder().encode(digitalWill) : new Uint8Array(0);
      
      const result = await backend.register_will(benPrincipal, btcAddress, seconds, Array.from(encryptedSecret));
      console.log("Will Registered:", result);
      return result;
    } catch (err: any) {
      console.error(err);
      setError(err.toString());
    } finally {
      setLoading(false);
    }
  };

  const sendHeartbeat = async () => {
    if (!backend) return;
    setLoading(true);
    try {
      await backend.i_am_alive();
      console.log("Heartbeat sent!");
    } catch (err: any) {
      setError(err.toString());
    } finally {
      setLoading(false);
    }
  };

  const getVaultAddress = useCallback(async () => {
    if (!backend) {
      console.warn('getVaultAddress: Backend actor not initialized');
      return "";
    }
    try {
      console.log('Fetching vault BTC address...');
      const address = await backend.get_vault_btc_address();
      console.log('Vault address received:', address);
      return address || "";
    } catch (err: any) {
      console.error('Error fetching vault address:', err);
      setError(`Failed to fetch vault address: ${err.message || err}`);
      return "";
    }
  }, [backend]);

  const getVaultBalance = useCallback(async (address: string): Promise<number> => {
    if (!backend || !address) {
      console.warn('getVaultBalance: Backend actor not initialized or address missing');
      return 0;
    }
    try {
      console.log('Fetching vault BTC balance for address:', address);
      const result = await backend.get_vault_balance(address);
      console.log('Vault BTC balance result:', result);
      
      // Handle Result type: { Ok: BigInt } | { Err: string }
      if ('Ok' in result) {
        const balance = Number(result.Ok);
        console.log('Vault BTC balance received:', balance, 'satoshis');
        return balance;
      } else if ('Err' in result) {
        const errorMsg = result.Err;
        console.error('Error fetching vault BTC balance:', errorMsg);
        setError(`Failed to fetch vault BTC balance: ${errorMsg}`);
        throw new Error(errorMsg);
      } else {
        // Fallback for unexpected format
        console.warn('Unexpected result format:', result);
        return 0;
      }
    } catch (err: any) {
      console.error('Error fetching vault BTC balance:', err);
      const errorMsg = err?.message || err?.toString() || 'Unknown error';
      setError(`Failed to fetch vault BTC balance: ${errorMsg}`);
      throw err; // Re-throw to let caller handle
    }
  }, [backend]);

  const getWillStatus = useCallback(async () => {
    if (!backend) {
      console.warn('getWillStatus: Backend actor not initialized');
      return null;
    }
    try {
      console.log('Fetching will status...');
      const result = await backend.get_will_status();
      if ('Ok' in result) {
        const status = result.Ok;
        console.log('Will status received:', status);
        return {
          heartbeatSeconds: Number(status.heartbeat_seconds),
          lastActive: Number(status.last_active),
        };
      } else {
        throw new Error(result.Err);
      }
    } catch (err: any) {
      console.error('Error fetching will status:', err);
      setError(`Failed to fetch will status: ${err.message || err}`);
      return null;
    }
  }, [backend]);

  const getMyInheritances = useCallback(async () => {
    if (!backend) {
      console.warn('getMyInheritances: Backend actor not initialized');
      return [];
    }
    try {
      console.log('Fetching my inheritances...');
      const result = await backend.get_my_inheritances();
      console.log('Inheritances received:', result);
      return result.map((inheritance: any) => ({
        ownerPrincipal: inheritance.owner_principal.toString(),
        beneficiaryBtcAddress: inheritance.beneficiary_btc_address,
        heartbeatSeconds: Number(inheritance.heartbeat_seconds),
        lastActive: Number(inheritance.last_active),
        timeRemaining: Number(inheritance.time_remaining),
        isExpired: inheritance.is_expired,
      }));
    } catch (err: any) {
      console.error('Error fetching inheritances:', err);
      setError(`Failed to fetch inheritances: ${err.message || err}`);
      return [];
    }
  }, [backend]);

  const claimInheritance = async (ownerId: string) => {
    if (!backend) return;
    setLoading(true);
    try {
      const ownerPrincipal = await import('@dfinity/principal').then(p => p.Principal.fromText(ownerId));
      const result = await backend.claim_inheritance(ownerPrincipal);
      
      if ('Ok' in result) {
        return result.Ok; // This is the encrypted vetKey share
      } else {
        throw new Error(result.Err);
      }
    } catch (err: any) {
      setError(err.toString());
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Delay auth init slightly to ensure app renders first
    const timer = setTimeout(() => {
      initAuth().catch(err => {
        console.warn('Auth init failed:', err);
      });
    }, 100);
    return () => clearTimeout(timer);
  }, [initAuth]);

  return {
    isAuthenticated,
    principal,
    login,
    logout,
    registerWill,
    sendHeartbeat,
    getVaultAddress,
    getVaultBalance,
    getWillStatus,
    getMyInheritances,
    claimInheritance,
    loading,
    error
  };
};