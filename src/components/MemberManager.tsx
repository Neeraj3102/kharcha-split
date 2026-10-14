import React, { useState } from 'react';
import { X, UserPlus, Trash2, ShieldCheck, Phone } from 'lucide-react';
import type { Member } from '../types';

interface MemberManagerProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  netBalances: Record<string, number>;
  onAddMember: (member: Omit<Member, 'id'>) => void;
  onDeleteMember: (id: string) => void;
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
}) => {
  const [name, setName] = useState('');
  const [upiId, setUpiId] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a name for the flatmate');
      return;
    }
    if (!upiId.trim() || !upiId.includes('@')) {
      setError('Please enter a valid UPI ID (e.g., name@okhdfcbank, mobile@upi)');
      return;
    }

    const randomColor = AVATAR_COLORS[members.length % AVATAR_COLORS.length];
    onAddMember({
      name: name.trim(),
      upiId: upiId.trim().toLowerCase(),
      phone: phone.trim() ? phone.replace(/[^0-9]/g, '') : undefined,
      avatarColor: randomColor,
    });

    setName('');
    setUpiId('');
    setPhone('');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-lg rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-rose-500/10 text-rose-500">
              <UserPlus className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-white font-heading">Manage Flatmates</h2>
              <p className="text-xs text-zinc-400">Add flatmate details with UPI ID for 1-click settlements</p>
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
            <h3 className="text-xs uppercase font-mono tracking-wider text-rose-400 font-bold">
              + Add New Flatmate
            </h3>
            
            {error && (
              <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
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
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800/90 border border-zinc-700 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-rose-500 transition-all"
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
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800/90 border border-zinc-700 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-rose-500 font-mono transition-all"
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
                className="w-full px-3 py-2 rounded-lg bg-zinc-800/90 border border-zinc-700 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-rose-500 font-mono transition-all"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white text-xs font-bold transition-all cursor-pointer shadow-md"
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

            <div className="space-y-2">
              {members.map((member) => {
                const balance = netBalances[member.id] || 0;
                const isCreditor = balance > 0.01;
                const isDebtor = balance < -0.01;

                return (
                  <div
                    key={member.id}
                    className="p-3 rounded-xl bg-zinc-900/40 border border-white/5 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm shadow-md"
                        style={{ backgroundColor: member.avatarColor }}
                      >
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span>{member.name}</span>
                          <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded">
                            {member.upiId}
                          </span>
                        </div>
                        {member.phone && (
                          <div className="text-[10px] text-zinc-500 flex items-center gap-1">
                            <Phone className="w-2.5 h-2.5 text-emerald-500" />
                            <span>+91 {member.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
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

                      {members.length > 2 && (
                        <button
                          onClick={() => onDeleteMember(member.id)}
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-950/40 transition-all cursor-pointer"
                          title="Remove Flatmate"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-white/10 bg-zinc-950/60 flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-rose-500" />
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
