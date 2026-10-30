import React, { useState } from 'react';
import { UserCheck, Clock, XCircle, Lock, X } from 'lucide-react';
import type { AppTheme } from '../types';
import type { RoomMeta } from '../utils/firebase';
import { roomPinLimiter } from '../utils/cryptoAuth';

interface JoinRequestModalProps {
  isOpen: boolean;
  roomId: string;
  roomName: string;
  roomMeta?: RoomMeta | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'NONE';
  onRequestJoin: (name: string, phone?: string) => Promise<void>;
  onCancel: () => void;
  onClaimAdmin?: (pin: string) => Promise<boolean>;
  theme: AppTheme;
}

export const JoinRequestModal: React.FC<JoinRequestModalProps> = ({
  isOpen,
  roomId,
  roomName,
  roomMeta,
  status,
  onRequestJoin,
  onCancel,
  onClaimAdmin,
  theme,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Admin PIN bypass
  const [showPinInput, setShowPinInput] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [pinError, setPinError] = useState('');

  if (!isOpen) return null;

  const isPurple = theme === 'purple';
  const adminDisplayName = roomMeta?.adminMemberName || 'Flat Admin';

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Please enter your name so the flat admin recognizes you.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await onRequestJoin(name.trim(), phone.trim() || undefined);
    } catch {
      setErrorMsg('Failed to send join request. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdminBypass = async (e: React.FormEvent) => {
    e.preventDefault();
    const rateCheck = roomPinLimiter.check('join_claim_admin');
    if (rateCheck.isLocked) {
      setPinError(`Security lockout: wait ${rateCheck.remainingSeconds}s before retrying.`);
      return;
    }
    if (!onClaimAdmin) return;
    const ok = await onClaimAdmin(adminPin.trim());
    if (ok) {
      roomPinLimiter.reset('join_claim_admin');
      setPinError('');
    } else {
      const fail = roomPinLimiter.recordFailure('join_claim_admin');
      setPinError(fail.error || 'Incorrect Admin PIN. Access denied.');
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-2.5 sm:p-4 bg-black/85 backdrop-blur-md">
      <div className="glass-panel w-full max-w-md rounded-2xl border border-white/10 shadow-2xl overflow-y-auto max-h-[92dvh] sm:max-h-[90vh] p-4 sm:p-6 space-y-4 sm:space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2.5 rounded-xl ${
                isPurple ? 'bg-purple-500/10 text-purple-400' : 'bg-rose-500/10 text-rose-500'
              }`}
            >
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-heading">
                Admin Authentication Required
              </h2>
              <p className="text-xs text-zinc-400">
                Private Shared Flat • {roomName} (#{roomId})
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer"
            title="Leave room"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Room Info Card */}
        <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-white/5 flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold text-white">{roomName}</div>
            <div className="text-[11px] text-zinc-400">
              Admin: <strong className="text-zinc-200">{adminDisplayName}</strong>
            </div>
          </div>
          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-zinc-800 text-amber-400 border border-zinc-700">
            #{roomId}
          </span>
        </div>

        {/* STATE 1: PENDING APPROVAL (Waiting on Admin) */}
        {status === 'PENDING' && (
          <div className="p-5 rounded-xl bg-amber-950/30 border border-amber-800/60 text-center space-y-3">
            <div className="relative flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/10 text-amber-400 mx-auto">
              <Clock className="w-6 h-6 animate-pulse" />
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-25"></span>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white">Join Request Sent to {adminDisplayName}</h3>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Your request to join <strong>{roomName}</strong> is waiting for the Flat Admin to accept.
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-zinc-950/80 border border-amber-900/40 text-[11px] text-amber-300/90 font-mono">
              ⚡ Live Sync Active: As soon as the admin clicks "Accept", you'll enter the flat automatically!
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={onCancel}
                className="text-xs text-zinc-400 hover:text-white underline cursor-pointer"
              >
                Cancel & Return to Local Mode
              </button>
            </div>
          </div>
        )}

        {/* STATE 2: REJECTED */}
        {status === 'REJECTED' && (
          <div className="p-5 rounded-xl bg-rose-950/30 border border-rose-800/60 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
              <XCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white">Request Declined</h3>
              <p className="text-xs text-zinc-400">
                The Flat Admin has declined the request to join this flat.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-all cursor-pointer"
              >
                Exit Room
              </button>
            </div>
          </div>
        )}

        {/* STATE 3: NONE (NOT YET REQUESTED) */}
        {(status === 'NONE' || !status) && (
          <div className="space-y-4">
            <p className="text-xs text-zinc-300 leading-relaxed">
              To keep your flat's expenses safe, flatmates must request permission before entering.
              Please provide your name so <strong>{adminDisplayName}</strong> can approve your request.
            </p>

            {errorMsg && (
              <div className="p-2.5 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmitRequest} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  Your Full Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Aman Gupta"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  WhatsApp Phone Number (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-lg ${
                  isPurple
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-500 hover:to-indigo-500 shadow-purple-950/40'
                    : 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white hover:from-emerald-500 hover:to-emerald-600 shadow-emerald-950/40'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>{isSubmitting ? 'Sending Request...' : 'Send Request to Flat Admin'}</span>
              </button>
            </form>

            {/* Admin PIN bypass toggle */}
            <div className="pt-2 border-t border-white/5 text-center">
              {!showPinInput ? (
                <button
                  type="button"
                  onClick={() => setShowPinInput(true)}
                  className="text-[11px] text-zinc-500 hover:text-zinc-300 underline cursor-pointer"
                >
                  Are you the Flat Admin on a new device? Enter Admin PIN
                </button>
              ) : (
                <form onSubmit={handleAdminBypass} className="space-y-2 pt-1 text-left">
                  <label className="block text-[11px] font-semibold text-amber-300">
                    Enter Flat Admin PIN:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="password"
                      placeholder="PIN (Default: 3102)"
                      value={adminPin}
                      onChange={(e) => setAdminPin(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-white text-xs focus:outline-none focus:border-amber-400"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold transition-all cursor-pointer"
                    >
                      Unlock Admin
                    </button>
                  </div>
                  {pinError && <p className="text-[11px] text-rose-400">{pinError}</p>}
                </form>
              )}
            </div>

            <button
              type="button"
              onClick={onCancel}
              className="w-full py-2 text-xs font-medium text-zinc-400 hover:text-white transition-all cursor-pointer text-center"
            >
              Cancel & Exit Flat
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
