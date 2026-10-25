import React from 'react';
import { X, RefreshCw, ArrowRight } from 'lucide-react';
import type { Expense, Member, AppTheme } from '../types';

interface RecurringExpensesModalProps {
  isOpen: boolean;
  onClose: () => void;
  recurringExpenses: Expense[];
  members: Member[];
  onLogRecurringInstance: (expense: Expense) => void;
  onOpenAddExpense: () => void;
  theme?: AppTheme;
}

export const RecurringExpensesModal: React.FC<RecurringExpensesModalProps> = ({
  isOpen,
  onClose,
  recurringExpenses,
  members,
  onLogRecurringInstance,
  onOpenAddExpense,
  theme = 'weeknd',
}) => {
  if (!isOpen) return null;
  const isPurple = theme === 'purple';
  const memberMap = new Map(members.map((m) => [m.id, m]));

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass-panel w-full max-w-lg rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] cursor-default"
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center text-white ${
                isPurple ? 'bg-purple-600/30 text-purple-400' : 'bg-rose-600/30 text-rose-400'
              }`}
            >
              <RefreshCw className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-heading">Recurring Flat Bills</h3>
              <p className="text-[10px] text-zinc-400">Manage rent, Wi-Fi, cook, maid and regular subscriptions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3 overflow-y-auto flex-1 text-xs">
          {recurringExpenses.length === 0 ? (
            <div className="text-center py-10 space-y-3">
              <div className="w-12 h-12 rounded-full bg-zinc-800 text-zinc-500 flex items-center justify-center mx-auto">
                <RefreshCw className="w-6 h-6 opacity-40" />
              </div>
              <p className="text-zinc-400 font-medium">No recurring bills marked yet.</p>
              <p className="text-[11px] text-zinc-500 max-w-xs mx-auto">
                When adding an expense (like Rent, Cook, or Wi-Fi), check "Mark as Recurring Bill" to save it here for 1-click monthly logging!
              </p>
              <button
                onClick={() => {
                  onClose();
                  onOpenAddExpense();
                }}
                className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer text-xs ${
                  isPurple ? 'bg-purple-600 hover:bg-purple-500 text-white' : 'bg-rose-600 hover:bg-rose-500 text-white'
                }`}
              >
                + Add Recurring Expense
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-[11px] text-zinc-400">
                Tap <strong>"Log for This Month"</strong> to immediately generate an expense entry with the same splits:
              </p>
              {recurringExpenses.map((exp) => {
                const payer = memberMap.get(exp.paidById);
                return (
                  <div
                    key={exp.id}
                    className="p-3 rounded-xl bg-zinc-900/60 border border-white/5 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="font-bold text-white text-xs flex items-center gap-1.5">
                        <span>{exp.title}</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800/60">
                          {exp.recurrenceFrequency || 'MONTHLY'}
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-400 mt-0.5">
                        ₹{exp.totalAmount.toLocaleString('en-IN')} • Paid by{' '}
                        <strong className="text-zinc-300">{payer?.name || 'Someone'}</strong> • {exp.tag}
                      </div>
                    </div>

                    <button
                      onClick={() => onLogRecurringInstance(exp)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                        isPurple
                          ? 'bg-purple-600/30 text-purple-300 hover:bg-purple-600 hover:text-white border border-purple-500/40'
                          : 'bg-rose-600/30 text-rose-300 hover:bg-rose-600 hover:text-white border border-rose-500/40'
                      }`}
                    >
                      <span>Log Now</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
