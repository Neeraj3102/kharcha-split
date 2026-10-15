import React, { useState, useEffect } from 'react';
import { X, Plus, Users, Sliders, Tag as TagIcon, Check, AlertCircle } from 'lucide-react';
import type { Member, QuickTag, SplitType, SplitDetail, Expense } from '../types';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  tags: QuickTag[];
  onAddCustomTag: (tag: QuickTag) => void;
  onSaveExpense: (expense: Omit<Expense, 'id'>) => void;
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  members,
  tags,
  onAddCustomTag,
  onSaveExpense,
}) => {
  const [title, setTitle] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [paidById, setPaidById] = useState(members[0]?.id || '');
  const [selectedTag, setSelectedTag] = useState(tags[0]?.label || 'Wi-Fi Bill');
  const [splitType, setSplitType] = useState<SplitType>('EQUAL');

  // Multi-select for equal split
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(
    members.map((m) => m.id)
  );

  // Custom split state: map of memberId -> { amount: string, note: string }
  const [customSplits, setCustomSplits] = useState<
    Record<string, { amount: string; note: string }>
  >({});

  // Overarching note for the entire expense
  const [customNote, setCustomNote] = useState('');

  // Inline custom tag creation
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagLabel, setNewTagLabel] = useState('');

  // Error validation
  const [error, setError] = useState('');

  // Update selected member ids when members change
  useEffect(() => {
    if (members.length > 0) {
      if (!paidById) setPaidById(members[0].id);
      setSelectedMemberIds(members.map((m) => m.id));
      
      const initialCustom: Record<string, { amount: string; note: string }> = {};
      members.forEach((m) => {
        initialCustom[m.id] = { amount: '', note: '' };
      });
      setCustomSplits(initialCustom);
    }
  }, [members]);

  if (!isOpen) return null;

  if (members.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <div className="glass-panel w-full max-w-sm rounded-2xl border border-white/10 p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto border border-rose-500/20">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white font-heading">No Flatmates Yet</h3>
            <p className="text-xs text-zinc-400 mt-1">
              Please add at least one flatmate with their UPI ID before creating an expense.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const totalAmount = parseFloat(amountStr) || 0;

  // Toggle member inclusion in Equal Split
  const handleToggleMember = (id: string) => {
    if (selectedMemberIds.includes(id)) {
      if (selectedMemberIds.length > 1) {
        setSelectedMemberIds(selectedMemberIds.filter((mId) => mId !== id));
      }
    } else {
      setSelectedMemberIds([...selectedMemberIds, id]);
    }
  };

  // Helper: Split Equally automatically
  const calculateEqualSplits = (): SplitDetail[] => {
    if (selectedMemberIds.length === 0 || totalAmount <= 0) return [];
    const count = selectedMemberIds.length;
    const share = Math.floor((totalAmount / count) * 100) / 100;
    const remainder = Math.round((totalAmount - share * count) * 100) / 100;

    return selectedMemberIds.map((mId, index) => ({
      memberId: mId,
      amount: index === 0 ? Math.round((share + remainder) * 100) / 100 : share,
    }));
  };

  // Handle Custom Amount changes
  const handleCustomAmountChange = (mId: string, val: string) => {
    setCustomSplits((prev) => ({
      ...prev,
      [mId]: { ...prev[mId], amount: val },
    }));
  };

  // Handle Custom Note per person
  const handleCustomNoteChange = (mId: string, val: string) => {
    setCustomSplits((prev) => ({
      ...prev,
      [mId]: { ...prev[mId], note: val },
    }));
  };

  // Auto-fill custom inputs with equal amounts as a starting point
  const handlePrefillCustomEqually = () => {
    if (totalAmount <= 0) return;
    const equalSplits = calculateEqualSplits();
    const updated: Record<string, { amount: string; note: string }> = { ...customSplits };
    equalSplits.forEach((s) => {
      updated[s.memberId] = {
        amount: s.amount.toString(),
        note: updated[s.memberId]?.note || '',
      };
    });
    setCustomSplits(updated);
  };

  // Sum of custom splits
  const customSum = Object.values(customSplits).reduce(
    (sum, val) => sum + (parseFloat(val.amount) || 0),
    0
  );
  const customDifference = Math.round((totalAmount - customSum) * 100) / 100;

  // Add custom tag handler
  const handleCreateTag = () => {
    if (!newTagLabel.trim()) return;
    const newTag: QuickTag = {
      id: `custom-tag-${Date.now()}`,
      label: newTagLabel.trim(),
      icon: '🏷️',
      isCustom: true,
    };
    onAddCustomTag(newTag);
    setSelectedTag(newTag.label);
    setNewTagLabel('');
    setIsAddingTag(false);
  };

  // Form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide an expense title (e.g. Swiggy, Wi-Fi, Kamla Didi)');
      return;
    }
    if (totalAmount <= 0) {
      setError('Please enter a valid expense amount greater than ₹0');
      return;
    }

    let finalSplits: SplitDetail[] = [];

    if (splitType === 'EQUAL') {
      finalSplits = calculateEqualSplits();
      if (finalSplits.length === 0) {
        setError('At least one flatmate must be included in the split');
        return;
      }
    } else {
      // Custom split validation
      if (Math.abs(customDifference) > 0.05) {
        setError(
          `Custom split amounts must equal ₹${totalAmount}. Current difference: ${
            customDifference > 0 ? `₹${customDifference} unallocated` : `₹${Math.abs(customDifference)} over budget`
          }`
        );
        return;
      }

      finalSplits = Object.entries(customSplits)
        .map(([mId, val]) => ({
          memberId: mId,
          amount: parseFloat(val.amount) || 0,
          note: val.note.trim() ? val.note.trim() : undefined,
        }))
        .filter((s) => s.amount > 0);

      if (finalSplits.length === 0) {
        setError('Please allocate amounts for flatmates in the custom split');
        return;
      }
    }

    onSaveExpense({
      title: title.trim(),
      totalAmount,
      paidById,
      date: new Date().toISOString(),
      tag: selectedTag,
      splitType,
      splits: finalSplits,
      customNote: customNote.trim() ? customNote.trim() : undefined,
    });

    // Reset and close
    setTitle('');
    setAmountStr('');
    setCustomNote('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="glass-panel w-full max-w-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-rose-500/10 text-rose-500">
              <Plus className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-white font-heading">Add Flat Expense</h2>
              <p className="text-xs text-zinc-400">Record a shared Indian household bill</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 sm:space-y-5">
            {error && (
            <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Title & Total Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                Expense Title *
              </label>
              <input
                type="text"
                placeholder="e.g. Zepto Groceries, Cook Salary, Wi-Fi"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-rose-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                Total Amount (₹) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-rose-500 font-bold text-xs">₹</span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  className="w-full pl-7 pr-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs font-mono font-bold focus:outline-none focus:border-rose-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Paid By Selector */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
              Who Paid? *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {members.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaidById(m.id)}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                    paidById === m.id
                      ? 'bg-rose-950/60 border-rose-500 text-white shadow-sm shadow-rose-900/50'
                      : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                  }`}
                >
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                    style={{ backgroundColor: m.avatarColor }}
                  >
                    {m.name.charAt(0)}
                  </div>
                  <span className="truncate">{m.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tags (Requirement 3: Quick tags & custom tags) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1">
                <TagIcon className="w-3.5 h-3.5 text-rose-500" />
                <span>Select Category Tag</span>
              </label>
              {!isAddingTag && (
                <button
                  type="button"
                  onClick={() => setIsAddingTag(true)}
                  className="text-[11px] text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
                >
                  + Add Custom Tag
                </button>
              )}
            </div>

            {/* Custom Tag Input Popup */}
            {isAddingTag && (
              <div className="mb-2 p-2.5 rounded-xl bg-zinc-900 border border-rose-900/60 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g. Diwali Party, Repairs, Taxi"
                  value={newTagLabel}
                  onChange={(e) => setNewTagLabel(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 rounded-lg bg-zinc-800 text-xs text-white placeholder-zinc-500 border border-zinc-700 focus:outline-none focus:border-rose-500"
                />
                <button
                  type="button"
                  onClick={handleCreateTag}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-500 cursor-pointer"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingTag(false)}
                  className="px-2 py-1.5 text-zinc-400 hover:text-white text-xs cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}

            <div className="flex items-center gap-1.5 flex-wrap max-h-28 overflow-y-auto pr-1">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => setSelectedTag(tag.label)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                    selectedTag === tag.label
                      ? 'bg-rose-600 text-white font-semibold shadow-md shadow-rose-950'
                      : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800'
                  }`}
                >
                  <span>{tag.icon}</span>
                  <span>{tag.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Split Mode Selector (Requirement 1 & 2) */}
          <div className="pt-2 border-t border-white/5">
            <label className="block text-[11px] font-semibold text-zinc-400 mb-2">
              Split Strategy
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-zinc-900 border border-white/5">
              <button
                type="button"
                onClick={() => setSplitType('EQUAL')}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  splitType === 'EQUAL'
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-900/50'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Split Equally</span>
              </button>
              <button
                type="button"
                onClick={() => setSplitType('CUSTOM')}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  splitType === 'CUSTOM'
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-900/50'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Custom Split</span>
              </button>
            </div>
          </div>

          {/* SPLIT TYPE: EQUAL MODE */}
          {splitType === 'EQUAL' && (
            <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-white/5 space-y-2">
              <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                <span>Select flatmates to split with:</span>
                <span className="font-mono text-rose-400 font-semibold">
                  {selectedMemberIds.length > 0 && totalAmount > 0
                    ? `₹${(totalAmount / selectedMemberIds.length).toFixed(2)} each`
                    : '₹0.00 each'}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {members.map((m) => {
                  const isChecked = selectedMemberIds.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleToggleMember(m.id)}
                      className={`p-2 rounded-lg text-xs flex items-center justify-between border transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-zinc-800 border-rose-500/80 text-white'
                          : 'bg-zinc-900/50 border-zinc-800 text-zinc-500'
                      }`}
                    >
                      <span className="font-medium truncate">{m.name}</span>
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center text-[10px] ${
                          isChecked ? 'bg-rose-600 text-white' : 'bg-zinc-800 text-transparent'
                        }`}
                      >
                        <Check className="w-3 h-3" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* SPLIT TYPE: CUSTOM MODE (Requirement 2: Custom Split with notes) */}
          {splitType === 'CUSTOM' && (
            <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-white/5 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Assign individual amounts & notes:</span>
                <button
                  type="button"
                  onClick={handlePrefillCustomEqually}
                  className="text-rose-400 hover:text-rose-300 font-semibold cursor-pointer text-[11px]"
                >
                  ⚡ Fill Equally as Starting Point
                </button>
              </div>

              {/* Difference Status Bar */}
              <div
                className={`p-2 rounded-lg text-xs flex items-center justify-between font-mono ${
                  Math.abs(customDifference) <= 0.05
                    ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
                    : 'bg-amber-950/60 border border-amber-800 text-amber-300'
                }`}
              >
                <span>Total: ₹{totalAmount.toFixed(2)}</span>
                <span>Assigned: ₹{customSum.toFixed(2)}</span>
                <span>
                  {Math.abs(customDifference) <= 0.05
                    ? '✓ Balanced'
                    : customDifference > 0
                    ? `Remaining: ₹${customDifference.toFixed(2)}`
                    : `Over: ₹${Math.abs(customDifference).toFixed(2)}`}
                </span>
              </div>

              {/* Flatmate Custom Rows */}
              <div className="space-y-2.5">
                {members.map((m) => (
                  <div
                    key={m.id}
                    className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                  >
                    <div className="sm:col-span-3 flex items-center gap-2">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                        style={{ backgroundColor: m.avatarColor }}
                      >
                        {m.name.charAt(0)}
                      </div>
                      <span className="text-xs font-semibold text-white truncate">{m.name}</span>
                    </div>

                    <div className="sm:col-span-4 relative">
                      <span className="absolute left-2.5 top-2 text-rose-500 font-bold text-xs">₹</span>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Amount"
                        value={customSplits[m.id]?.amount || ''}
                        onChange={(e) => handleCustomAmountChange(m.id, e.target.value)}
                        className="w-full pl-6 pr-2 py-1.5 rounded-lg bg-zinc-800 text-xs text-white font-mono placeholder-zinc-500 border border-zinc-700 focus:outline-none focus:border-rose-500"
                      />
                    </div>

                    <div className="sm:col-span-5">
                      <input
                        type="text"
                        placeholder="Note: e.g. 2 beers, extra fries"
                        value={customSplits[m.id]?.note || ''}
                        onChange={(e) => handleCustomNoteChange(m.id, e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-800 text-xs text-white placeholder-zinc-500 border border-zinc-700 focus:outline-none focus:border-rose-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* General Expense Custom Note */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
              General Expense Note (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Ordered via Zepto for Sunday dinner"
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-rose-500 transition-all"
            />
          </div>
        </div>

        {/* Sticky Mobile-Friendly Submit Footer */}
        <div className="p-4 border-t border-white/10 bg-zinc-950/90 backdrop-blur-md shrink-0">
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 via-rose-700 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-rose-950/60 active:scale-[0.99]"
          >
            Save Flat Expense
          </button>
        </div>
      </form>
    </div>
  </div>
  );
};
