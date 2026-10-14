import React, { useState } from 'react';
import { X, CheckCircle, MessageSquare } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { Member, Settlement } from '../types';
import { createSettlementWhatsAppUrl } from '../utils/whatsapp';

interface MarkPaidModalProps {
  isOpen: boolean;
  onClose: () => void;
  settlement: Settlement | null;
  members: Member[];
  onConfirmSettlement: (settlement: Settlement) => void;
}

export const MarkPaidModal: React.FC<MarkPaidModalProps> = ({
  isOpen,
  onClose,
  settlement,
  members,
  onConfirmSettlement,
}) => {
  const [sendWhatsApp, setSendWhatsApp] = useState(true);

  if (!isOpen || !settlement) return null;

  const fromMember = members.find((m) => m.id === settlement.fromMemberId);
  const toMember = members.find((m) => m.id === settlement.toMemberId);

  const fromName = fromMember?.name || 'Flatmate';
  const toName = toMember?.name || 'Flatmate';
  const toPhone = toMember?.phone;

  const { url, message: previewMessage } = createSettlementWhatsAppUrl(
    fromName,
    toName,
    settlement.amount,
    toPhone
  );

  const handleConfirm = () => {
    // 1. Launch WhatsApp if user opted in
    if (sendWhatsApp) {
      window.open(url, '_blank');
    }

    // 2. Trigger Confetti celebration (The Weeknd Red & Gold theme)
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ff003b', '#f59e0b', '#ffffff', '#ec4899'],
      });
    } catch {
      // ignore
    }

    // 3. Mark settled in state
    onConfirmSettlement(settlement);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="glass-panel w-full max-w-md rounded-2xl border border-white/10 shadow-2xl overflow-hidden p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <CheckCircle className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-white font-heading">Confirm Settlement</h2>
              <p className="text-xs text-zinc-400">Mark debt as fully paid</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Transaction Summary Card */}
        <div className="p-4 rounded-xl bg-zinc-900 border border-white/5 space-y-2 text-center">
          <div className="text-xs text-zinc-400">Settling Debt Between</div>
          <div className="flex items-center justify-center gap-3 text-sm font-bold text-white">
            <span className="text-rose-400">{fromName}</span>
            <span className="text-zinc-500">➔</span>
            <span className="text-emerald-400">{toName}</span>
          </div>
          <div className="text-3xl font-extrabold text-white font-mono text-rose-500 pt-1">
            ₹{settlement.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>

        {/* User Requirement 4: WhatsApp Message Toggle Option */}
        <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-3">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={sendWhatsApp}
              onChange={(e) => setSendWhatsApp(e.target.checked)}
              className="mt-0.5 rounded border-zinc-700 text-rose-600 focus:ring-rose-500 accent-rose-600 cursor-pointer"
            />
            <div className="text-xs">
              <div className="font-semibold text-zinc-200 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>Send WhatsApp Settlement Receipt to {toName}</span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Uncheck this if you just want to mark it paid silently without opening WhatsApp.
              </p>
            </div>
          </label>

          {/* WhatsApp message preview if toggle is ON */}
          {sendWhatsApp && (
            <div className="p-2.5 rounded-lg bg-zinc-950/80 border border-zinc-800/80 text-[11px] font-mono text-zinc-400 whitespace-pre-wrap max-h-24 overflow-y-auto">
              {previewMessage}
            </div>
          )}
        </div>

        {/* Confirm Action Button */}
        <div className="space-y-2">
          <button
            onClick={handleConfirm}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-emerald-950"
          >
            ✓ Confirm & Mark as Paid
          </button>
          <button
            onClick={onClose}
            className="w-full py-2 text-xs font-medium text-zinc-400 hover:text-white transition-all cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
