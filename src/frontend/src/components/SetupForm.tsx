import { useState } from 'react';
import { Lock, Loader2 } from 'lucide-react';
import { useSatoshi } from '../hooks/useSatoshi';

interface SetupFormProps {
  onClose: () => void;
  isActive: boolean;
  onActivate: () => void;
}

export default function SetupForm({ onClose, isActive, onActivate }: SetupFormProps) {
  const { registerWill, loading, error, isAuthenticated } = useSatoshi();
  const [beneficiaryId, setBeneficiaryId] = useState('');
  const [btcAddress, setBtcAddress] = useState('');
  const [heartbeatTimer, setHeartbeatTimer] = useState('90'); // Store days directly
  const [digitalWill, setDigitalWill] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      alert('Please login first');
      return;
    }
    
    // Handle timer value - can be days or seconds
    let days: number;
    if (heartbeatTimer === '30s') {
      // 30 seconds = 30 / (24 * 60 * 60) days = 0.000347... days
      // This will be converted back to seconds in the hook: days * 86400 = 30 seconds
      days = 30 / (24 * 60 * 60);
    } else {
      // Convert days string to number (30, 90, 365)
      days = parseFloat(heartbeatTimer);
    }
    
    if (isNaN(days) || days <= 0) {
      alert('Please select a valid heartbeat timer');
      return;
    }
    
    try {
      const result = await registerWill(beneficiaryId, btcAddress, days, digitalWill);
      if (result) {
        setSuccess(true);
        // Show success alert
        alert('✓ PROTOCOL INITIALIZED\n\nDead Man Switch is now active. Your will has been registered.');
        // Reset form after 3 seconds
        setTimeout(() => {
          setBeneficiaryId('');
          setBtcAddress('');
          setHeartbeatTimer('90');
          setDigitalWill('');
          setSuccess(false);
        }, 3000);
      }
    } catch (err) {
      console.error('Failed to register will:', err);
      alert(`ERROR: Failed to initialize protocol.\n\n${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <div onClick={(e) => {
      // Only activate if clicking on the window container, not on form elements
      if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.window-titlebar')) {
        onActivate();
      }
    }} className={isActive ? '' : 'opacity-75'}>
      {/* Title Bar */}
      <div className="window-titlebar">
        <div className="flex items-center gap-2">
          <Lock size={14} />
          <span>INITIALIZE_PROTOCOL.EXE</span>
        </div>
        <div className="flex gap-1">
          <button className="window-control">_</button>
          <button className="window-control">□</button>
          <button onClick={onClose} className="window-control">×</button>
        </div>
      </div>

      {/* Window Content */}
      <div className="p-4 bg-[#C0C0C0] space-y-4">
        <div className="text-xs font-bold mb-4">
          CONFIGURE DEAD MAN SWITCH PROTOCOL
        </div>
        
        {!isAuthenticated && (
          <div className="bg-yellow-500 text-black p-2 border-2 border-black text-xs font-bold mb-4">
            ⚠️ Please LOGIN first to initialize the protocol
          </div>
        )}
        
        {error && (
          <div className="bg-red-500 text-white p-2 border-2 border-black text-xs font-bold mb-4">
            ERROR: {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-500 text-white p-2 border-2 border-black text-xs font-bold mb-4">
            ✓ Will registered successfully!
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Beneficiary ID */}
          <div>
            <label className="block text-xs font-bold mb-1">
              BENEFICIARY PRINCIPAL ID:
            </label>
            <input
              type="text"
              value={beneficiaryId}
              onChange={(e) => setBeneficiaryId(e.target.value)}
              placeholder="e.g., 6kbp3-k3vff-..."
              className="input-retro w-full"
              required
            />
          </div>

          {/* BTC Address */}
          <div>
            <label className="block text-xs font-bold mb-1">
              BENEFICIARY BTC ADDRESS:
            </label>
            <input
              type="text"
              value={btcAddress}
              onChange={(e) => setBtcAddress(e.target.value)}
              placeholder="bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"
              className="input-retro w-full"
              required
            />
            <div className="text-xs mt-1 text-gray-600">
              Where hard assets will be transferred
            </div>
          </div>

          {/* Heartbeat Timer */}
          <div>
            <label className="block text-xs font-bold mb-1">
              HEARTBEAT TIMER:
            </label>
            <select
              value={heartbeatTimer}
              onChange={(e) => setHeartbeatTimer(e.target.value)}
              className="input-retro w-full"
              required
            >
              <option value="30s">30 Seconds (Testing)</option>
              <option value="30">30 Days</option>
              <option value="90">90 Days</option>
              <option value="365">1 Year</option>
            </select>
            <div className="text-xs mt-1 text-gray-600">
              Time until automatic transfer activation
            </div>
          </div>

          {/* Digital Will */}
          <div>
            <label className="block text-xs font-bold mb-1">
              THE DIGITAL WILL:
            </label>
            <textarea
              value={digitalWill}
              onChange={(e) => setDigitalWill(e.target.value)}
              placeholder="Enter your encrypted secret (seed phrases, keys, instructions)..."
              rows={6}
              className="input-retro w-full resize-none"
              required
            />
            <div className="text-xs mt-1 text-gray-600">
              This will be encrypted and only revealed upon protocol activation
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading || !isAuthenticated}
              className={`btn-retro px-6 py-2 text-sm ${
                loading || !isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin" />
                  INITIALIZING...
                </span>
              ) : (
                'INITIALIZE PROTOCOL'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
