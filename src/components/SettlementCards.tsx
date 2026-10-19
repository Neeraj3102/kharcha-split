import React, { useState } from 'react';
import { ArrowRight, QrCode, ExternalLink, Check, Sparkles, History, Trash2, ChevronDown, ChevronUp, UserCheck } from 'lucide-react';
import type { Member, Settlement, AppTheme } from '../types';
import { generateUpiUri } from '../utils/upi';

interface SettlementCardsProps {
  settlements: Settlement[];
  members: Member[];
  settledTransactions?: Settlement[];
  myMemberId?: string | null;
  isRoomAdmin?: boolean;
  onOpenQr: (settlement: Settlement, upiUri: string) => void;
  onOpenMarkPaid: (settlement: Settlement) => void;
  onDeleteSettledTransaction?: (id: string) => void;
  onSetMyMemberId?: (id: string, name: string) => void;
  theme?: AppTheme;
}

export const SettlementCards: React.FC<SettlementCardsProps> = ({
  settlements,
  members,
  settledTransactions = [],
  myMemberId,
  isRoomAdmin = true,
  onOpenQr,
  onOpenMarkPaid,
  onDeleteSettledTransaction,
  onSetMyMemberId,
  theme = 'weeknd',
}) => {
  const isPurple = theme === 'purple';
  const memberMap = new Map(members.map((m) => [m.id, m]));
  const [showHistory, setShowHistory] = useState(false);
  const [identityPromptSettlement, setIdentityPromptSettlement] = useState<Settlement | null>(null);

  // Check if current user is allowed to mark a settlement as paid
  const handleMarkPaidClick = (settlement: Settlement) => {
    // 1. Room Admin can always mark paid
    if (isRoomAdmin) {
      onOpenMarkPaid(settlement);
      return;
    }

    // 2. If device has chosen an identity, verify if they are debtor or creditor
    if (myMemberId) {
      const isResponsible =
        myMemberId === settlement.fromMemberId || myMemberId === settlement.toMemberId;

      if (isResponsible) {
        onOpenMarkPaid(settlement);
      } else {
        const fromMember = memberMap.get(settlement.fromMemberId);
        const toMember = memberMap.get(settlement.toMemberId);
        alert(
          `Authority Restricted:\n\nOnly ${fromMember?.name || 'the payer'} (who pays) or ${toMember?.name || 'the receiver'} (who gets paid) or the Room Admin can mark this settlement as paid.`
        );
      }
      return;
    }

    // 3. Device hasn't chosen an identity yet: prompt them to choose who they are
    setIdentityPromptSettlement(settlement);
  };

  const handleIdentitySelected = (chosenMemberId: string) => {
    const chosen = memberMap.get(chosenMemberId);
    if (!chosen || !identityPromptSettlement) return;

    if (onSetMyMemberId) {
      onSetMyMemberId(chosen.id, chosen.name);
    }

    const currentSettle = identityPromptSettlement;
    setIdentityPromptSettlement(null);

    const isResponsible =
      chosen.id === currentSettle.fromMemberId || chosen.id === currentSettle.toMemberId;

    if (isResponsible || isRoomAdmin) {
      onOpenMarkPaid(currentSettle);
    } else {
      const fromMember = memberMap.get(currentSettle.fromMemberId);
      const toMember = memberMap.get(currentSettle.toMemberId);
      alert(
        `Authority Restricted:\n\n${chosen.name} is not part of this payment. Only ${fromMember?.name || 'the payer'} or ${toMember?.name || 'the receiver'} can mark it paid.`
      );
    }
  };

  return (
    <div className="space-y-4">
      {/* Active Settlements Header & Cards */}
      {settlements.length === 0 ? (
        <div className="glass-panel rounded-2xl p-8 border border-white/10 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white font-heading">
            All Settled Up!
          </h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            No flatmate owes any money right now. All shared expenses are completely balanced.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400 font-mono flex items-center gap-2">
              <span>⚡ Minimized Settlements ({settlements.length})</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                isPurple
                  ? 'text-purple-400 bg-purple-950/80 border-purple-800/60'
                  : 'text-rose-400 bg-rose-950/80 border-rose-800/60'
              }`}>
                Greedy Min-Flow Algorithm
              </span>
            </h2>
            <span className="text-xs text-zinc-500 hidden sm:inline">
              Fastest way to zero-balance
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {settlements.map((settlement) => {
              const fromMember = memberMap.get(settlement.fromMemberId);
              const toMember = memberMap.get(settlement.toMemberId);

              if (!fromMember || !toMember) return null;

              const isUserDebtor = myMemberId === fromMember.id;
              const isUserCreditor = myMemberId === toMember.id;
              const canUserSettle = isUserDebtor || isUserCreditor || isRoomAdmin;

              const upiUri = generateUpiUri(
                toMember.upiId,
                toMember.name,
                settlement.amount,
                `Settlement from ${fromMember.name}`
              );

              return (
                <div
                  key={settlement.id}
                  className={`glass-panel glass-card-hover rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-4 border relative overflow-hidden transition-all ${
                    isUserDebtor
                      ? isPurple ? 'border-purple-500/40 bg-purple-950/15' : 'border-rose-500/40 bg-rose-950/15'
                      : isUserCreditor
                      ? 'border-emerald-500/40 bg-emerald-950/15'
                      : 'border-white/5'
                  }`}
                >
                  {/* Visual indicator if it's YOUR payment */}
                  {(isUserDebtor || isUserCreditor) && (
                    <div className="absolute top-2 right-3 text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-200">
                      {isUserDebtor ? '👉 You need to pay' : '👈 You receive this'}
                    </div>
                  )}

                  {/* Top Row: Debtor to Creditor visual */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    {/* Debtor */}
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs shadow-md shrink-0"
                        style={{ backgroundColor: fromMember.avatarColor }}
                      >
                        {fromMember.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white leading-tight flex items-center gap-1">
                          <span>{fromMember.name}</span>
                          {isUserDebtor && (
                            <span className={`text-[9px] font-bold ${isPurple ? 'text-purple-400' : 'text-rose-400'}`}>(You)</span>
                          )}
                        </div>
                        <div className={`text-[10px] font-medium ${isPurple ? 'text-purple-400' : 'text-rose-400'}`}>Owes</div>
                      </div>
                    </div>

                    {/* Arrow & Badge */}
                    <div className="flex flex-col items-center px-2">
                      <ArrowRight className="w-4 h-4 text-zinc-500" />
                      <span className="text-[9px] uppercase font-mono tracking-widest text-zinc-500">
                        pays
                      </span>
                    </div>

                    {/* Creditor */}
                    <div className="flex items-center gap-2.5 text-right">
                      <div>
                        <div className="text-xs font-bold text-white leading-tight flex items-center justify-end gap-1">
                          {isUserCreditor && (
                            <span className="text-[9px] text-emerald-400 font-bold">(You)</span>
                          )}
                          <span>{toMember.name}</span>
                        </div>
                        <div className="text-[10px] text-emerald-400 font-medium">Receives</div>
                      </div>
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs shadow-md shrink-0"
                        style={{ backgroundColor: toMember.avatarColor }}
                      >
                        {toMember.name.charAt(0)}
                      </div>
                    </div>
                  </div>

                  {/* Amount Display */}
                  <div className="flex items-baseline justify-between pt-2 border-t border-white/5">
                    <span className="text-xs text-zinc-400 font-medium">Settlement Amount</span>
                    <span className={`text-xl sm:text-2xl font-extrabold font-mono tracking-tight ${
                      isPurple ? 'text-purple-400' : 'text-rose-500'
                    }`}>
                      ₹{settlement.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* Action Buttons: Pay UPI, QR Code, Mark-as-Paid */}
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    {/* 1. Direct UPI Link (Mobile Launcher) */}
                    {upiUri ? (
                      <a
                        href={upiUri}
                        className="py-2 px-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/60 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all text-center"
                        title="Opens GPay, PhonePe, or Paytm with pre-filled amount"
                      >
                        <ExternalLink className={`w-3.5 h-3.5 ${isPurple ? 'text-purple-400' : 'text-rose-500'}`} />
                        <span className="text-[11px]">Pay UPI</span>
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={() => alert(`No valid UPI ID configured for ${toMember.name}. Please ask them to update their UPI ID in Flatmates.`)}
                        className="py-2 px-2 rounded-xl bg-zinc-900/60 text-zinc-500 border border-zinc-800 text-xs font-medium flex items-center justify-center gap-1.5 transition-all text-center cursor-pointer"
                        title="No UPI ID found"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-zinc-600" />
                        <span className="text-[11px]">No UPI</span>
                      </button>
                    )}

                    {/* 2. QR Code (Desktop Scan) */}
                    <button
                      type="button"
                      onClick={() => onOpenQr(settlement, upiUri)}
                      className="py-2 px-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/60 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer text-center"
                      title="Display QR code to scan with phone"
                    >
                      <QrCode className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-[11px]">Show QR</span>
                    </button>

                    {/* 3. Mark as Paid (Restricted to Debtor, Creditor or Admin) */}
                    <button
                      type="button"
                      onClick={() => handleMarkPaidClick(settlement)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-sm text-center ${
                        canUserSettle
                          ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white'
                          : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/80'
                      }`}
                      title={
                        canUserSettle
                          ? 'Confirm payment as settled'
                          : `Restricted: Only ${fromMember.name}, ${toMember.name}, or Admin can confirm`
                      }
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span className="text-[11px]">Mark Paid</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Identity Prompt Modal if device identity is not yet set */}
      {identityPromptSettlement && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="glass-panel w-full max-w-sm rounded-2xl border border-white/10 shadow-2xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                <UserCheck className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-white">Who are you in this flat?</h3>
                <p className="text-[11px] text-zinc-400">
                  Only the payer, receiver, or room admin can settle debts.
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              {members.map((m) => {
                const isParty =
                  m.id === identityPromptSettlement.fromMemberId ||
                  m.id === identityPromptSettlement.toMemberId;

                return (
                  <button
                    key={m.id}
                    onClick={() => handleIdentitySelected(m.id)}
                    className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-xs font-semibold transition-all cursor-pointer ${
                      isParty
                        ? 'bg-emerald-950/40 border-emerald-700/80 text-emerald-300 hover:bg-emerald-900/50'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-white text-[10px]"
                        style={{ backgroundColor: m.avatarColor }}
                      >
                        {m.name.charAt(0)}
                      </div>
                      <span>{m.name}</span>
                    </div>
                    {isParty ? (
                      <span className="text-[10px] text-emerald-400 font-mono font-bold">
                        {m.id === identityPromptSettlement.fromMemberId ? 'Payer' : 'Receiver'}
                      </span>
                    ) : (
                      <span className="text-[10px] text-zinc-500 font-mono">Other Flatmate</span>
                    )}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setIdentityPromptSettlement(null)}
              className="w-full py-2 text-xs font-medium text-zinc-400 hover:text-white transition-all cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Settlement History Accordion & Duplicate / Ghost Cleanup */}
      {settledTransactions.length > 0 && (
        <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
          <button
            onClick={() => setShowHistory((prev) => !prev)}
            className="w-full p-3.5 flex items-center justify-between text-xs font-bold text-zinc-300 hover:text-white hover:bg-zinc-900/40 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-400" />
              <span>Settlement History ({settledTransactions.length} Paid)</span>
              {isRoomAdmin && (
                <span className="text-[10px] font-mono text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-800/60">
                  Admin Undo Available
                </span>
              )}
            </div>
            {showHistory ? (
              <ChevronUp className="w-4 h-4 text-zinc-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-zinc-500" />
            )}
          </button>

          {showHistory && (
            <div className="p-3 pt-0 border-t border-white/5 space-y-2">
              <p className="text-[11px] text-zinc-400 px-1 pt-2">
                All confirmed payments between flatmates. If an accidental duplicate was recorded, the Room Admin can delete it below to restore exact balances.
              </p>
              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                {settledTransactions
                  .slice()
                  .reverse()
                  .map((st) => {
                    const fromMember = memberMap.get(st.fromMemberId);
                    const toMember = memberMap.get(st.toMemberId);
                    const dateFormatted = st.settledAt
                      ? new Date(st.settledAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Settled';

                    return (
                      <div
                        key={st.id}
                        className="p-2.5 rounded-xl bg-zinc-900/60 border border-white/5 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <div>
                            <span className="font-bold text-white">
                              {fromMember?.name || 'Flatmate'}
                            </span>
                            <span className="text-zinc-500 mx-1">paid</span>
                            <span className="font-bold text-white">
                              {toMember?.name || 'Flatmate'}
                            </span>
                            <span className="text-zinc-500 text-[10px] ml-2 font-mono">
                              {dateFormatted}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-emerald-400 text-xs">
                            ₹{st.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>

                          {isRoomAdmin && onDeleteSettledTransaction && (
                            <button
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Undo this settlement?\n\n₹${st.amount} from ${fromMember?.name} to ${toMember?.name} will be removed from settlement history and balances will revert.`
                                  )
                                ) {
                                  onDeleteSettledTransaction(st.id);
                                }
                              }}
                              className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-950/40 transition-all cursor-pointer"
                              title="Undo/Delete this settled payment (Admin only)"
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
          )}
        </div>
      )}
    </div>
  );
};
