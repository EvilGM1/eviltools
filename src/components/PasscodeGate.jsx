import React, { useState } from 'react';
import { Lock, KeyRound, ShieldAlert, Sparkles, ArrowRight } from 'lucide-react';

// SHA-256 hash of the default party passcode
const DEFAULT_PASSCODE_HASH = '0bab7134b8796ca8afd41279f11768ebc8ec50c41044c283347dc546199e8d63';

async function computeSHA256(text) {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  } catch (e) {
    return text;
  }
}

export function PasscodeGate({ onUnlock }) {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanInput = passcode.trim().toLowerCase();
    const inputHash = await computeSHA256(cleanInput);

    if (inputHash === DEFAULT_PASSCODE_HASH) {
      localStorage.setItem('eviltools_auth_unlocked', 'true');
      onUnlock();
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-arcane-950 via-forge-950 to-stone-950 text-parchment-100 flex items-center justify-center p-4">
      <div className={`bg-gradient-to-b from-arcane-900 to-forge-900 border-2 border-gold-500 rounded-3xl max-w-md w-full p-8 shadow-2xl text-center space-y-6 ${shake ? 'animate-bounce' : 'animate-fadeIn'}`}>
        
        {/* Icon & Title */}
        <div className="space-y-3">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-forge-700 to-arcane-700 border-2 border-gold-400 flex items-center justify-center shadow-xl">
            <Lock className="w-8 h-8 text-gold-300" />
          </div>
          <h2 className="text-2xl font-serif font-black tracking-wide text-gold-300">
            EvilTools Restricted Access
          </h2>
          <p className="text-xs text-parchment-400 font-sans leading-relaxed">
            This grimoire & crafting suite is restricted to party members only. Please enter the party secret passcode to enter.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <KeyRound className="w-5 h-5 absolute left-3.5 top-3 text-gold-400" />
            <input
              type="password"
              value={passcode}
              onChange={(e) => {
                setPasscode(e.target.value);
                if (error) setError(false);
              }}
              placeholder="Enter Party Passcode..."
              autoFocus
              className="w-full pl-11 pr-4 py-3 bg-arcane-950 border-2 border-gold-500/60 focus:border-gold-400 rounded-xl text-sm font-bold text-parchment-100 tracking-wider placeholder:text-parchment-600 focus:outline-none focus:ring-2 focus:ring-gold-400/50 shadow-inner"
            />
          </div>

          {error && (
            <div className="p-2.5 rounded-lg bg-red-950/80 border border-red-500 text-red-300 text-xs flex items-center justify-center gap-2">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>Incorrect passcode. Please verify with your GM.</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-gold-600 via-gold-500 to-gold-400 hover:from-gold-500 hover:to-gold-300 text-arcane-950 font-serif font-black text-sm tracking-wide shadow-lg transform active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <span>Enter Grimoire</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Footer info */}
        <div className="pt-2 border-t border-arcane-800 text-[11px] text-parchment-500">
          Pathfinder 2e Remaster Suite &bull; Isolated Private Browser Session
        </div>
      </div>
    </div>
  );
}
