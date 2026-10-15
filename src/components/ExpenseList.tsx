import { useState } from 'react';
import { Trash2, Calendar, ChevronDown, ChevronUp, User } from 'lucide-react';
import type { Expense, Member } from '../types';

interface ExpenseListProps {
  expenses: Expense[];
  members: Member[];
  onDeleteExpense: (id: string) => void;
  isRoomAdmin?: boolean;
}

export const ExpenseList: React.FC<ExpenseListProps> = ({
  expenses,
  members,
  onDeleteExpense,
  isRoomAdmin = true,
}) => {
  const memberMap = new Map(members.map((m) => [m.id, m]));
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  if (expenses.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-8 border border-white/10 text-center text-zinc-400 text-xs">
        No expenses found for this time period. Click <strong className="text-white">+ Add Expense</strong> above to add one!
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400 font-mono">
          📋 Expense Feed ({expenses.length})
        </h2>
        <span className="text-xs text-zinc-500">Tap any item to view breakdown</span>
      </div>

      <div className="space-y-2.5">
        {expenses.map((expense) => {
          const payer = memberMap.get(expense.paidById);
          const isExpanded = expandedId === expense.id;
          const dateObj = new Date(expense.date);
          const dateFormatted = dateObj.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
          });

          return (
            <div
              key={expense.id}
              className="glass-panel glass-card-hover rounded-xl p-3.5 border border-white/5 transition-all overflow-hidden"
            >
              <div
                onClick={() => toggleExpand(expense.id)}
                className="flex items-center justify-between gap-3 cursor-pointer select-none"
              >
                {/* Left: Tag icon + Title + Payer */}
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-md shrink-0"
                    style={{ backgroundColor: payer?.avatarColor || '#e11d48' }}
                  >
                    {payer?.name?.charAt(0) || '₹'}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5 flex-wrap">
                      <span className="truncate max-w-[140px] sm:max-w-xs">{expense.title}</span>
                      <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700/60 shrink-0">
                        {expense.tag}
                      </span>
                    </div>

                    <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 sm:gap-2 mt-0.5 flex-wrap">
                      <span className="truncate max-w-[100px] sm:max-w-none">
                        Paid by <strong className="text-zinc-200">{payer?.name || 'Someone'}</strong>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-zinc-500 shrink-0">
                        <Calendar className="w-3 h-3" />
                        {dateFormatted}
                      </span>
                      {expense.splitType === 'CUSTOM' && (
                        <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-amber-950/70 text-amber-400 border border-amber-800/60 shrink-0">
                          Custom
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Amount & Action buttons */}
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-sm sm:text-base font-extrabold text-white font-mono text-rose-500">
                      ₹{expense.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[10px] text-zinc-500">
                      {expense.splits.length} participants
                    </div>
                  </div>

                  {/* QUICK DELETE BUTTON - ONLY VISIBLE & AUTHORIZED FOR ROOM ADMIN */}
                  {isRoomAdmin && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (
                          window.confirm(
                            `Delete this expense: "${expense.title}" (₹${expense.totalAmount.toLocaleString(
                              'en-IN'
                            )})?\n\nThis will remove only this expense from the ledger.`
                          )
                        ) {
                          onDeleteExpense(expense.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-950/60 border border-transparent hover:border-rose-900/50 transition-all cursor-pointer"
                      title="Delete this individual expense (Room Admin only)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    type="button"
                    className="p-1 rounded-lg text-zinc-500 hover:text-white transition-all cursor-pointer"
                    title={isExpanded ? 'Collapse breakdown' : 'Expand breakdown'}
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Expanded Breakdown */}
              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-white/5 space-y-2.5 text-xs">
                  {expense.customNote && (
                    <div className="p-2 rounded-lg bg-zinc-900/80 text-zinc-300 italic text-[11px] border border-zinc-800">
                      "{expense.customNote}"
                    </div>
                  )}

                  <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider font-mono">
                    Participant Breakdown
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {expense.splits.map((split) => {
                      const participant = memberMap.get(split.memberId);
                      return (
                        <div
                          key={split.memberId}
                          className="p-2 rounded-lg bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-between text-[11px]"
                        >
                          <div className="flex items-center gap-1.5">
                            <User className="w-3 h-3 text-zinc-400" />
                            <span className="font-semibold text-zinc-200">
                              {participant?.name || 'Unknown'}
                            </span>
                            {split.note && (
                              <span className="text-[10px] text-zinc-400 truncate max-w-[120px]">
                                ({split.note})
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-rose-400 font-bold">
                            ₹{split.amount.toFixed(2)}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Delete Expense Action in Expanded View */}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[11px] text-zinc-500 font-mono">
                      {expense.splitType} Split
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (
                          window.confirm(
                            `Delete this expense: "${expense.title}" (₹${expense.totalAmount.toLocaleString(
                              'en-IN'
                            )})?\n\nThis will remove only this expense from the ledger.`
                          )
                        ) {
                          onDeleteExpense(expense.id);
                        }
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-950/80 hover:text-rose-300 border border-rose-900/60 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete This Expense</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
