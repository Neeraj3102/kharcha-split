import React from 'react';
import { ArrowRight, QrCode, ExternalLink, Check, Sparkles } from 'lucide-react';
import type { Member, Settlement } from '../types';
import { generateUpiUri } from '../utils/upi';

interface SettlementCardsProps {
  settlements: Settlement[];
  members: Member[];
  onOpenQr: (settlement: Settlement, upiUri: string) => void;
  onOpenMarkPaid: (settlement: Settlement) => void;
}

export const SettlementCards: React.FC<SettlementCardsProps> = ({
  settlements,
  members,
  onOpenQr,
  onOpenMarkPaid,
}) => {
  const memberMap = new Map(members.map((m) => [m.id, m]));

  if (settlements.length === 0) {
    return (
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
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400 font-mono flex items-center gap-2">
          <span>⚡ Minimized Settlements ({settlements.length})</span>
          <span className="text-[10px] text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded-full border border-rose-800/60">
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

          const upiUri = generateUpiUri(
            toMember.upiId,
            toMember.name,
            settlement.amount,
            `Settlement from ${fromMember.name}`
          );

          return (
            <div
              key={settlement.id}
              className="glass-panel glass-card-hover rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-4 border border-white/5 relative overflow-hidden"
            >
              {/* Top Row: Debtor to Creditor visual */}
              <div className="flex items-center justify-between gap-2">
                {/* Debtor */}
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs shadow-md shrink-0"
                    style={{ backgroundColor: fromMember.avatarColor }}
                  >
                    {fromMember.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white leading-tight">
                      {fromMember.name}
                    </div>
                    <div className="text-[10px] text-rose-400 font-medium">Owes</div>
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
                    <div className="text-xs font-bold text-white leading-tight">
                      {toMember.name}
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
                <span className="text-xl sm:text-2xl font-extrabold text-white font-mono tracking-tight text-rose-500">
                  ₹{settlement.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Action Buttons: Pay UPI, QR Code, Mark-as-Paid */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                {/* 1. Direct UPI Link (Mobile Launcher) */}
                <a
                  href={upiUri}
                  className="py-2 px-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/60 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all text-center"
                  title="Opens GPay, PhonePe, or Paytm with pre-filled amount"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-rose-500" />
                  <span className="text-[11px]">Pay UPI</span>
                </a>

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

                {/* 3. Mark as Paid (with WhatsApp confirmation option) */}
                <button
                  type="button"
                  onClick={() => onOpenMarkPaid(settlement)}
                  className="py-2 px-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-sm text-center"
                  title="Record as paid and optionally send WhatsApp confirmation"
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
  );
};
