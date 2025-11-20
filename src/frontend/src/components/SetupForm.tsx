import { useState } from 'react';
import { Lock } from 'lucide-react';

interface SetupFormProps {
  onClose: () => void;
  isActive: boolean;
  onActivate: () => void;
}

export default function SetupForm({ onClose, isActive, onActivate }: SetupFormProps) {
  const [beneficiaryId, setBeneficiaryId] = useState('');
  const [btcAddress, setBtcAddress] = useState('');
  const [heartbeatTimer, setHeartbeatTimer] = useState('7776000');
  const [digitalWill, setDigitalWill] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Initializing protocol...', {
      beneficiaryId,
      btcAddress,
      heartbeatTimer,
      digitalWill,
    });
  };

  return (
    <div onClick={onActivate} className={isActive ? '' : 'opacity-75'}>
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
              <option value="2592000">30 Days</option>
              <option value="7776000">90 Days</option>
              <option value="31536000">1 Year</option>
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
              className="btn-retro px-6 py-2 text-sm"
            >
              INITIALIZE PROTOCOL
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
