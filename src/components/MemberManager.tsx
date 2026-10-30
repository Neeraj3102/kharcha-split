import React, { useState } from 'react';
import { X, UserPlus, Trash2, ShieldCheck, Phone, AlertTriangle, RotateCcw, Crown, UserCheck } from 'lucide-react';
import type { Member, AppTheme } from '../types';
import { sanitizeText, sanitizeUpiId, sanitizePhone } from '../utils/securitySanitizer';

interface MemberManagerProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  netBalances: Record<string, number>;
  onAddMember: (member: Omit<Member, 'id'>) => void;
  onDeleteMember: (id: string) => void;
  onResetAllData: () => void;
  onLoadDemoData: () => void;
  isRoomAdmin?: boolean;
  myMemberId?: string | null;
  onSetMyMemberId?: (id: string, name: string) => void;
  onTransferAdmin?: (newAdminMemberId: string, newAdminMemberName: string) => void;
  adminMemberId?: string;
  adminMemberName?: string;
  theme?: AppTheme;
}

const AVATAR_COLORS = [
  '#ff003b', // Crimson (The Weeknd)
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
  '#10b981', // Emerald
];

export const MemberManager: React.FC<MemberManagerProps> = ({
  isOpen,
  onClose,
  members,
  netBalances,
  onAddMember,
  onDeleteMember,
  onResetAllData,
  onLoadDemoData,
  isRoomAdmin = true,
  myMemberId,
  onSetMyMemberId,
  onTransferAdmin,
  adminMemberId,
  theme = 'weeknd',
}) => {
  const isPurple = theme === 'purple';
  const [name, setName] = useState('');
  const [upiId, setUpiId] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = sanitizeText(name, 50);
    if (!cleanName) {
      setError('Please enter a name for the flatmate');
      return;
    }

    // Check duplicate name
    const isDuplicate = members.some(
      (m) => m.name.trim().toLowerCase() === cleanName.toLowerCase()
    );
    if (isDuplicate) {
      setError(`A flatmate with the name "${cleanName}" already exists. Please use a unique name or add an initial.`);
      return;
    }

    const upiResult = sanitizeUpiId(upiId);
    if (!upiResult.isValid) {
      setError(upiResult.error || 'Please enter a valid UPI ID (e.g., name@okhdfcbank, mobile@upi)');
      return;
    }

    const phoneResult = sanitizePhone(phone);
    if (!phoneResult.isValid) {
      setError(phoneResult.error || 'Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9 (or leave blank)');
      return;
    }

    const randomColor = AVATAR_COLORS[members.length % AVATAR_COLORS.length];
    onAddMember({
      name: cleanName,
      upiId: upiResult.value,
      phone: phoneResult.value || undefined,
      avatarColor: randomColor,
    });

    setName('');
    setUpiId('');
    setPhone('');
    setError('');
  };

  const handleConfirmReset = () => {
    onResetAllData();
    setShowConfirmReset(false);
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-[110] flex items-center justify-center p-2.5 sm:p-4 bg-black/80 backdrop-blur-sm cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="glass-panel w-full max-w-lg rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[90vh] cursor-default"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`p-2 rounded-lg ${isPurple ? 'bg-purple-500/10 text-purple-400' : 'bg-rose-500/10 text-rose-500'}`}>
              <UserPlus className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-white font-heading">Manage Flatmates</h2>
              <p className="text-xs text-zinc-400">Add, remove flatmates, or reset entire ledger</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Add Flatmate Form */}
          <form onSubmit={handleSubmit} className="p-4 rounded-xl bg-zinc-900/60 border border-white/5 space-y-3">
            <h3 className={`text-xs uppercase font-mono tracking-wider font-bold ${isPurple ? 'text-purple-400' : 'text-rose-400'}`}>
              + Add New Flatmate
            </h3>
            
            {error && (
              <div className={`p-2.5 rounded-lg border text-xs ${
                isPurple ? 'bg-purple-950/60 border-purple-800 text-purple-300' : 'bg-rose-950/60 border-rose-800 text-rose-300'
              }`}>
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  Flatmate Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg bg-zinc-800/90 border border-zinc-700 text-white text-xs placeholder-zinc-500 focus:outline-none transition-all ${
                    isPurple ? 'focus:border-purple-500' : 'focus:border-rose-500'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1 flex items-center justify-between">
                  <span>UPI ID *</span>
                  <span className="text-[10px] text-zinc-500">for GPay / PhonePe</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. rahul@okaxis"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg bg-zinc-800/90 border border-zinc-700 text-white text-xs placeholder-zinc-500 focus:outline-none font-mono transition-all ${
                    isPurple ? 'focus:border-purple-500' : 'focus:border-rose-500'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1 flex items-center gap-1">
                <Phone className="w-3 h-3 text-emerald-400" />
                <span>WhatsApp Phone (Optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. 9876543210 (10 digits)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg bg-zinc-800/90 border border-zinc-700 text-white text-xs placeholder-zinc-500 focus:outline-none font-mono transition-all ${
                  isPurple ? 'focus:border-purple-500' : 'focus:border-rose-500'
                }`}
              />
            </div>

            <button
              type="submit"
              className={`w-full py-2.5 rounded-lg text-white text-xs font-bold transition-all cursor-pointer shadow-md ${
                isPurple
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500'
                  : 'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600'
              }`}
            >
              Add to Flat
            </button>
          </form>

          {/* Current Flatmates List */}
          <div className="space-y-3">
            <h3 className="text-xs uppercase font-mono tracking-wider text-zinc-400 font-bold flex items-center justify-between">
              <span>Current Flatmates ({members.length})</span>
              <span className="text-[10px] text-zinc-500">Live Net Balances</span>
            </h3>

            {members.length === 0 ? (
              <div className="p-4 rounded-xl bg-zinc-900/30 border border-dashed border-zinc-800 text-center text-xs text-zinc-500">
                No flatmates in the ledger right now. Add one above!
              </div>
            ) : (
              <div className="space-y-2">
                {members.map((member) => {
                  const balance = netBalances[member.id] || 0;
                  const isCreditor = balance > 0.01;
                  const isDebtor = balance < -0.01;
                  const isThisMemberAdmin =
                    member.id === adminMemberId || (isRoomAdmin && !adminMemberId && members.length > 0 && member.id === members[0].id);
                  const isMe = member.id === myMemberId;

                  return (
                    <div
                      key={member.id}
                      className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                        isMe
                          ? 'bg-emerald-950/20 border-emerald-800/40'
                          : 'bg-zinc-900/40 border-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm shadow-md shrink-0"
                          style={{ backgroundColor: member.avatarColor }}
                        >
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white flex items-center gap-1.5 flex-wrap">
                            <span>{member.name}</span>

                            {isThisMemberAdmin && (
                              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded-full font-semibold flex items-center gap-0.5">
                                <Crown className="w-2.5 h-2.5 text-amber-400" />
                                <span>Admin</span>
                              </span>
                            )}

                            {isMe ? (
                              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 rounded-full font-semibold flex items-center gap-0.5">
                                <UserCheck className="w-2.5 h-2.5 text-emerald-400" />
                                <span>You</span>
                              </span>
                            ) : (
                              onSetMyMemberId && (
                                <button
                                  type="button"
                                  onClick={() => onSetMyMemberId(member.id, member.name)}
                                  className="text-[9px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 px-1.5 py-0.5 rounded cursor-pointer transition-all"
                                  title="Mark yourself as this flatmate on this phone/browser"
                                >
                                  This is Me
                                </button>
                              )
                            )}

                            <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded break-all max-w-[140px] sm:max-w-none">
                              {member.upiId}
                            </span>
                          </div>
                          {member.phone && (
                            <div className="text-[10px] text-zinc-500 flex items-center gap-1 mt-0.5">
                              <Phone className="w-2.5 h-2.5 text-emerald-500" />
                              <span>+91 {member.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                        <div className="text-left sm:text-right">
                          <div
                            className={`text-xs font-mono font-bold ${
                              isCreditor
                                ? 'text-emerald-400'
                                : isDebtor
                                ? 'text-rose-400'
                                : 'text-zinc-400'
                            }`}
                          >
                            {isCreditor ? `+₹${balance}` : isDebtor ? `-₹${Math.abs(balance)}` : '₹0 (Settled)'}
                          </div>
                          <div className="text-[9px] uppercase tracking-wider text-zinc-500">
                            {isCreditor ? 'Gets Back' : isDebtor ? 'Owes Money' : 'Clean Slate'}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          {/* Option to transfer Room Admin powers to this member */}
                          {isRoomAdmin && !isThisMemberAdmin && onTransferAdmin && (
                            <button
                              type="button"
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `👑 Transfer Room Admin powers to ${member.name}?\n\n${member.name} will become the new Room Admin with exclusive delete and management rights. You will become a regular member.`
                                  )
                                ) {
                                  onTransferAdmin(member.id, member.name);
                                }
                              }}
                              className="px-2 py-1 rounded-lg bg-amber-950/60 hover:bg-amber-900 border border-amber-700/60 text-amber-300 text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                              title="Transfer Admin rights to this flatmate"
                            >
                              <Crown className="w-3 h-3 text-amber-400" />
                              <span className="hidden sm:inline">Make Admin</span>
                            </button>
                          )}

                          {/* Can delete individual flatmates - Room Admin Only */}
                          {isRoomAdmin && (
                            <button
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Remove flatmate "${member.name}"?\n\n⚠️ Note: This removes ${member.name} from the flatmate list.\n\n💡 Tip: If you only want to delete a single expense/bill, cancel this and click the trash can icon on that expense in the Expense Feed instead.`
                                  )
                                ) {
                                  onDeleteMember(member.id);
                                }
                              }}
                              className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-950/40 transition-all cursor-pointer"
                              title="Remove Flatmate (Room Admin only)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* DANGER ZONE: Wipe Entire Data & Remove All Flatmates (Room Admin Only) */}
          <div className="pt-4 border-t border-red-950/50 space-y-3">
            <div className="flex items-center gap-1.5 text-rose-500 text-xs font-bold font-mono uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4" />
              <span>Danger Zone</span>
            </div>

            {isRoomAdmin ? (
              !showConfirmReset ? (
                <div className="p-3.5 rounded-xl bg-red-950/20 border border-red-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-white">Reset Entire Ledger</div>
                    <div className="text-[11px] text-zinc-400">
                      Deletes all flatmates, clears all expenses, and wipes local browser storage.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowConfirmReset(true)}
                    className="px-3 py-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete All Data</span>
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-red-950/60 border border-red-600/80 space-y-3">
                  <div className="text-xs text-rose-200 font-semibold leading-relaxed">
                    ⚠️ <strong>Are you absolutely sure?</strong> This will permanently delete all flatmates, remove all recorded expenses, wipe settlement records, and clear your browser cache.
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleConfirmReset}
                      className="flex-1 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all cursor-pointer shadow-md"
                    >
                      Yes, Delete Everything
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowConfirmReset(false)}
                      className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )
            ) : (
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-white/5 text-xs text-zinc-400 flex items-center gap-2">
                <span>🔒</span>
                <span>
                  <strong>Admin Authority:</strong> Only the Room Admin who created this flat room can delete flatmates or reset the ledger.
                </span>
              </div>
            )}

            {/* Optional Reload Demo Flatmates Button */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onLoadDemoData}
                className="text-[11px] text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reload Sample Demo Data</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-white/10 bg-zinc-950/60 flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-1">
            <ShieldCheck className={`w-4 h-4 ${isPurple ? 'text-purple-400' : 'text-rose-500'}`} />
            <span>UPI IDs are kept 100% private in your browser</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-medium text-xs transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
