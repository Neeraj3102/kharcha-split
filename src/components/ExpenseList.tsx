import { useState, useMemo } from 'react';
import { Trash2, Calendar, ChevronDown, ChevronUp, User, Search, X, Pencil, RefreshCw } from 'lucide-react';
import type { Expense, Member, AppTheme } from '../types';

interface ExpenseListProps {
  expenses: Expense[];
  members: Member[];
  onDeleteExpense: (id: string) => void;
  onEditExpense?: (expense: Expense) => void;
  selectedMemberId?: string | null;
  onSelectMemberId?: (id: string | null) => void;
  isRoomAdmin?: boolean;
  theme?: AppTheme;
}

export const ExpenseList: React.FC<ExpenseListProps> = ({
  expenses,
  members,
  onDeleteExpense,
  onEditExpense,
  selectedMemberId = null,
  onSelectMemberId,
  isRoomAdmin = true,
  theme = 'weeknd',
}) => {
  const isPurple = theme === 'purple';
  const memberMap = new Map(members.map((m) => [m.id, m]));
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // Instant Search & Member Filter computation
  const filteredList = useMemo(() => {
    return expenses.filter((exp) => {
      // 1. Member filter (payer or participant)
      if (selectedMemberId) {
        const isPayer = exp.paidById === selectedMemberId;
        const isParticipant = exp.splits.some((s) => s.memberId === selectedMemberId);
        if (!isPayer && !isParticipant) return false;
      }

      // 2. Search term (title, tag, customNote, payer name, or amount)
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const payerName = memberMap.get(exp.paidById)?.name.toLowerCase() || '';
        const titleMatch = exp.title.toLowerCase().includes(query);
        const tagMatch = exp.tag.toLowerCase().includes(query);
        const noteMatch = exp.customNote?.toLowerCase().includes(query) || false;
        const payerMatch = payerName.includes(query);
        const amountMatch = exp.totalAmount.toString().includes(query);

        if (!titleMatch && !tagMatch && !noteMatch && !payerMatch && !amountMatch) {
          return false;
        }
      }

      return true;
    });
  }, [expenses, selectedMemberId, searchTerm, memberMap]);

  return (
    <div className="space-y-3">
      {/* Header & Search Bar (K7) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400 font-mono">
            📋 Expense Feed ({filteredList.length} of {expenses.length})
          </h2>
          <span className="text-xs text-zinc-500 sm:hidden">Tap item to view breakdown</span>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search title, payer, tag..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-8 pr-7 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none transition-all ${
              isPurple ? 'focus:border-purple-500' : 'focus:border-rose-500'
            }`}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2 top-2 text-zinc-400 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Member Filter Chips (K2) */}
      {members.length > 1 && onSelectMemberId && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          <button
            onClick={() => onSelectMemberId(null)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all cursor-pointer ${
              selectedMemberId === null
                ? isPurple
                  ? 'bg-purple-600 text-white'
                  : 'bg-rose-600 text-white'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            All Flatmates
          </button>
          {members.map((m) => {
            const isSelected = selectedMemberId === m.id;
            return (
              <button
                key={m.id}
                onClick={() => onSelectMemberId(isSelected ? null : m.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 flex items-center gap-1.5 transition-all cursor-pointer ${
                  isSelected
                    ? isPurple
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-rose-600 text-white shadow-md'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: m.avatarColor }}
                />
                <span>{m.name}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* List items */}
      {filteredList.length === 0 ? (
        <div className="glass-panel rounded-2xl p-8 border border-white/10 text-center text-zinc-400 text-xs">
          {searchTerm || selectedMemberId
            ? 'No expenses match your search or filter criteria.'
            : 'No expenses found for this time period. Click "+ Add Expense" above to add one!'}
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredList.map((expense) => {
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
                  {/* Left: Avatar + Title + Payer */}
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
                        {expense.isRecurring && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 flex items-center gap-1 shrink-0">
                            <RefreshCw className="w-2.5 h-2.5" />
                            <span>{expense.recurrenceFrequency || 'MONTHLY'}</span>
                          </span>
                        )}
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
                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    <div className="text-right">
                      <div
                        className={`text-sm sm:text-base font-extrabold font-mono ${
                          isPurple ? 'text-purple-400' : 'text-rose-500'
                        }`}
                      >
                        ₹{expense.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-[10px] text-zinc-500">
                        {expense.splits.length} participants
                      </div>
                    </div>

                    {/* EDIT EXPENSE BUTTON (K1) */}
                    {onEditExpense && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditExpense(expense);
                        }}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-amber-400 hover:bg-amber-950/60 border border-transparent hover:border-amber-900/50 transition-all cursor-pointer"
                        title="Edit this expense"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* DELETE BUTTON (Admin only) */}
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
                        <Trash2 className="w-3.5 h-3.5" />
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

                    {/* Actions in Expanded View */}
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-[11px] text-zinc-500 font-mono">
                        {expense.splitType} Split
                      </span>
                      <div className="flex items-center gap-2">
                        {onEditExpense && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditExpense(expense);
                            }}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-amber-400 hover:bg-amber-950/80 border border-amber-900/60 transition-all cursor-pointer"
                          >
                            <Pencil className="w-3 h-3" />
                            <span>Edit Expense</span>
                          </button>
                        )}
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
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-950/80 border border-rose-900/60 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
