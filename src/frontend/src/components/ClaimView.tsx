import { useState } from 'react';
import { AlertTriangle, Unlock, Eye, EyeOff, Copy, Check, X } from 'lucide-react';

interface ClaimViewProps {
  onClose: () => void;
  isActive: boolean;
  onActivate: () => void;
}

export default function ClaimView({ onClose, isActive, onActivate }: ClaimViewProps) {
  const [isClaimed, setIsClaimed] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [copied, setCopied] = useState(false);

  // Mock secret data
  const secretData = `Seed Phrase Location:
- Hardware wallet: Safe deposit box #42, First National Bank
- Backup location: Encrypted USB in home safe
- Recovery phrase: [REDACTED - Decrypted upon claim]

Additional Instructions:
- Transfer all BTC to beneficiary address: bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh
- Contact lawyer: John Doe, Esq. (555-0123)
- Estate documents: File cabinet, drawer 3`;

  const handleClaim = () => {
    setIsClaimed(true);
    console.log('Inheritance claimed');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(secretData);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div onClick={onActivate} className={isActive ? '' : 'opacity-75'}>
      {/* Title Bar - Red for Critical Alert */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white px-2 py-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle size={14} />
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
        {/* Protocol Status */}
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
                <span className="ml-2 text-red-400 font-mono">90 days, 0 hours</span>
              </div>
            </div>
          </div>
        </div>

        {/* Claim Button */}
        {!isClaimed && (
          <div className="flex justify-center">
            <button
              onClick={handleClaim}
              className="btn-critical px-12 py-4 text-lg"
            >
              <div className="flex items-center gap-3">
                <Unlock size={24} />
                <span>CLAIM INHERITANCE</span>
              </div>
            </button>
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
