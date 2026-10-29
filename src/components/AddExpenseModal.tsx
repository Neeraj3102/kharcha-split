import React, { useState, useEffect } from 'react';
import { X, Users, Sliders, Tag as TagIcon, Check, AlertCircle, RefreshCw } from 'lucide-react';
import type { Member, QuickTag, SplitType, SplitDetail, Expense, AppTheme } from '../types';
import { sanitizeText, sanitizeAmount } from '../utils/securitySanitizer';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  tags: QuickTag[];
  onAddCustomTag: (tag: QuickTag) => void;
  onSaveExpense: (expense: Omit<Expense, 'id'>, existingId?: string) => void;
  editingExpense?: Expense | null;
  theme?: AppTheme;
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  members,
  tags,
  onAddCustomTag,
  onSaveExpense,
  editingExpense = null,
  theme = 'weeknd',
}) => {
  const isPurple = theme === 'purple';
  const isEditing = Boolean(editingExpense);

  const [title, setTitle] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [paidById, setPaidById] = useState(members[0]?.id || '');
  const [selectedTag, setSelectedTag] = useState('');
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

  // Recurring options
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<'MONTHLY' | 'WEEKLY'>('MONTHLY');

  // Inline custom tag creation
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagLabel, setNewTagLabel] = useState('');

  // Error validation
  const [error, setError] = useState('');

  // Initialize or prefill state when opening or when editingExpense changes
  useEffect(() => {
    if (!isOpen) return;

    if (editingExpense) {
      setTitle(editingExpense.title || '');
      setAmountStr(editingExpense.totalAmount ? String(editingExpense.totalAmount) : '');
      setPaidById(editingExpense.paidById || members[0]?.id || '');
      setSelectedTag(editingExpense.tag || tags[0]?.label || 'General');
      setSplitType(editingExpense.splitType || 'EQUAL');
      setCustomNote(editingExpense.customNote || '');
      setIsRecurring(Boolean(editingExpense.isRecurring));
      setRecurrenceFrequency(editingExpense.recurrenceFrequency || 'MONTHLY');

      if (editingExpense.splitType === 'EQUAL') {
        setSelectedMemberIds(editingExpense.splits.map((s) => s.memberId));
      } else {
        const customMap: Record<string, { amount: string; note: string }> = {};
        members.forEach((m) => {
          const found = editingExpense.splits.find((s) => s.memberId === m.id);
          customMap[m.id] = {
            amount: found ? String(found.amount) : '',
            note: found?.note || '',
          };
        });
        setCustomSplits(customMap);
      }
    } else {
      setTitle('');
      setAmountStr('');
      setPaidById(members[0]?.id || '');
      const generalTag = tags.find((t) => t.label.toLowerCase() === 'general');
      setSelectedTag(generalTag ? generalTag.label : tags[0]?.label || 'General');
      setSplitType('EQUAL');
      setSelectedMemberIds(members.map((m) => m.id));
      const initialCustom: Record<string, { amount: string; note: string }> = {};
      members.forEach((m) => {
        initialCustom[m.id] = { amount: '', note: '' };
      });
      setCustomSplits(initialCustom);
      setCustomNote('');
      setIsRecurring(false);
      setRecurrenceFrequency('MONTHLY');
    }
    setError('');
  }, [isOpen, editingExpense, members, tags]);

  if (!isOpen) return null;

  if (members.length === 0) {
    return (
      <div 
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md cursor-pointer"
      >
        <div 
          onClick={(e) => e.stopPropagation()}
          className="glass-panel w-full max-w-sm rounded-2xl border border-white/10 p-6 text-center space-y-4 cursor-default"
        >
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
    const cleanLabel = sanitizeText(newTagLabel, 30);
    if (!cleanLabel) return;
    const newTag: QuickTag = {
      id: `custom-tag-${Date.now()}`,
      label: cleanLabel,
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
    const cleanTitle = sanitizeText(title, 120);
    if (!cleanTitle) {
      setError('Please provide an expense title (e.g. Swiggy, Wi-Fi, Kamla Didi)');
      return;
    }
    const amountCheck = sanitizeAmount(totalAmount);
    if (!amountCheck.isValid) {
      setError(amountCheck.error || 'Please enter a valid expense amount');
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
          `Custom split amounts must equal ₹${amountCheck.value}. Current difference: ${
            customDifference > 0 ? `₹${customDifference} unallocated` : `₹${Math.abs(customDifference)} over budget`
          }`
        );
        return;
      }

      finalSplits = Object.entries(customSplits)
        .map(([mId, val]) => ({
          memberId: mId,
          amount: sanitizeAmount(val.amount).value || 0,
          note: val.note.trim() ? sanitizeText(val.note, 100) : undefined,
        }))
        .filter((s) => s.amount > 0);

      if (finalSplits.length === 0) {
        setError('Please allocate amounts for flatmates in the custom split');
        return;
      }
    }

    onSaveExpense(
      {
        title: cleanTitle,
        totalAmount: amountCheck.value,
        paidById,
        date: editingExpense ? editingExpense.date : new Date().toISOString(),
        tag: selectedTag,
        splitType,
        splits: finalSplits,
        customNote: customNote.trim() ? sanitizeText(customNote, 250) : undefined,
        isRecurring,
        recurrenceFrequency: isRecurring ? recurrenceFrequency : undefined,
      },
      editingExpense?.id
    );

    // Reset and close
    setTitle('');
    setAmountStr('');
    setCustomNote('');
    setError('');
    onClose();
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="glass-panel w-full max-w-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] cursor-default"
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white text-xs ${
                isPurple ? 'bg-purple-600/30 text-purple-400' : 'bg-rose-600/30 text-rose-400'
              }`}
            >
              {isEditing ? '✏️' : '₹'}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-heading">
                {isEditing ? 'Edit Flatmate Expense' : 'Add Flatmate Expense'}
              </h3>
              <p className="text-[10px] text-zinc-400">
                {isEditing ? 'Update details or adjust split allocations' : 'Record an expense and split it with flatmates'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 flex flex-col">
          <div className="p-4 space-y-4 flex-1">
            {error && (
              <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Title & Amount Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  Expense Description *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Swiggy, Groceries, Electricity"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs placeholder-zinc-500 focus:outline-none transition-all ${
                    isPurple ? 'focus:border-purple-500' : 'focus:border-rose-500'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  Amount (₹) *
                </label>
                <div className="relative">
                  <span className={`absolute left-3 top-2 font-bold text-xs ${isPurple ? 'text-purple-400' : 'text-rose-500'}`}>₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="0.00"
                    value={amountStr}
                    onChange={(e) => setAmountStr(e.target.value)}
                    className={`w-full pl-7 pr-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs font-mono placeholder-zinc-500 focus:outline-none transition-all ${
                      isPurple ? 'focus:border-purple-500' : 'focus:border-rose-500'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Who Paid dropdown */}
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                Who Paid? *
              </label>
              <select
                value={paidById}
                onChange={(e) => setPaidById(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs focus:outline-none transition-all ${
                  isPurple ? 'focus:border-purple-500' : 'focus:border-rose-500'
                }`}
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.upiId})
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Tag Selector */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1">
                  <TagIcon className="w-3 h-3" />
                  <span>Category Tag</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddingTag(!isAddingTag)}
                  className={`text-[11px] font-semibold cursor-pointer ${
                    isPurple ? 'text-purple-400 hover:text-purple-300' : 'text-rose-400 hover:text-rose-300'
                  }`}
                >
                  {isAddingTag ? 'Cancel' : '+ Custom Tag'}
                </button>
              </div>

              {isAddingTag && (
                <div className="flex items-center gap-2 mb-2 p-2 rounded-xl bg-zinc-900/80 border border-zinc-700">
                  <input
                    type="text"
                    placeholder="New tag label (e.g. Milk, Gym)"
                    value={newTagLabel}
                    onChange={(e) => setNewTagLabel(e.target.value)}
                    className="flex-1 px-2.5 py-1 text-xs bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCreateTag}
                    className={`px-3 py-1 rounded-lg text-xs font-bold text-white cursor-pointer ${
                      isPurple ? 'bg-purple-600 hover:bg-purple-500' : 'bg-rose-600 hover:bg-rose-500'
                    }`}
                  >
                    Add
                  </button>
                </div>
              )}

              <div className="flex items-center gap-1.5 flex-wrap">
                {tags.map((tag) => {
                  const isSelected = selectedTag === tag.label;
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => setSelectedTag(tag.label)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-all cursor-pointer ${
                        isSelected
                          ? isPurple
                            ? 'bg-purple-600 text-white shadow-md shadow-purple-900/50'
                            : 'bg-rose-600 text-white shadow-md shadow-rose-900/50'
                          : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                      }`}
                    >
                      <span>{tag.icon}</span>
                      <span>{tag.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Split Type Toggle (Equal vs Custom) */}
            <div className="pt-2 border-t border-white/5">
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5">
                Split Strategy
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-zinc-900/80 border border-zinc-800">
                <button
                  type="button"
                  onClick={() => setSplitType('EQUAL')}
                  className={`py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    splitType === 'EQUAL'
                      ? isPurple
                        ? 'bg-purple-600 text-white shadow'
                        : 'bg-rose-600 text-white shadow'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Split Equally</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSplitType('CUSTOM')}
                  className={`py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    splitType === 'CUSTOM'
                      ? isPurple
                        ? 'bg-purple-600 text-white shadow'
                        : 'bg-rose-600 text-white shadow'
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
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Included flatmates ({selectedMemberIds.length}):</span>
                  {totalAmount > 0 && selectedMemberIds.length > 0 && (
                    <span className="font-mono text-zinc-300 font-bold">
                      ₹{(totalAmount / selectedMemberIds.length).toFixed(2)} / person
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {members.map((m) => {
                    const isChecked = selectedMemberIds.includes(m.id);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleToggleMember(m.id)}
                        className={`p-2 rounded-xl border text-xs flex items-center justify-between transition-all cursor-pointer ${
                          isChecked
                            ? isPurple
                              ? 'bg-purple-950/40 border-purple-700/60 text-white'
                              : 'bg-rose-950/40 border-rose-700/60 text-white'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                            style={{ backgroundColor: m.avatarColor }}
                          >
                            {m.name.charAt(0)}
                          </div>
                          <span className="truncate">{m.name}</span>
                        </div>
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center text-[10px] ${
                            isChecked
                              ? isPurple ? 'bg-purple-600 text-white' : 'bg-rose-600 text-white'
                              : 'bg-zinc-800 text-transparent'
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

            {/* SPLIT TYPE: CUSTOM MODE */}
            {splitType === 'CUSTOM' && (
              <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-white/5 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Assign individual amounts & notes:</span>
                  <button
                    type="button"
                    onClick={handlePrefillCustomEqually}
                    className={`font-semibold cursor-pointer text-[11px] ${
                      isPurple ? 'text-purple-400 hover:text-purple-300' : 'text-rose-400 hover:text-rose-300'
                    }`}
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
                        <span className={`absolute left-2.5 top-2 font-bold text-xs ${isPurple ? 'text-purple-400' : 'text-rose-500'}`}>₹</span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Amount"
                          value={customSplits[m.id]?.amount || ''}
                          onChange={(e) => handleCustomAmountChange(m.id, e.target.value)}
                          className={`w-full pl-6 pr-2 py-1.5 rounded-lg bg-zinc-800 text-xs text-white font-mono placeholder-zinc-500 border border-zinc-700 focus:outline-none ${
                            isPurple ? 'focus:border-purple-500' : 'focus:border-rose-500'
                          }`}
                        />
                      </div>

                      <div className="sm:col-span-5">
                        <input
                          type="text"
                          placeholder="Note: e.g. 2 beers, extra fries"
                          value={customSplits[m.id]?.note || ''}
                          onChange={(e) => handleCustomNoteChange(m.id, e.target.value)}
                          className={`w-full px-2.5 py-1.5 rounded-lg bg-zinc-800 text-xs text-white placeholder-zinc-500 border border-zinc-700 focus:outline-none ${
                            isPurple ? 'focus:border-purple-500' : 'focus:border-rose-500'
                          }`}
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
                className={`w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs placeholder-zinc-500 focus:outline-none transition-all ${
                  isPurple ? 'focus:border-purple-500' : 'focus:border-rose-500'
                }`}
              />
            </div>

            {/* Recurring Expense Toggle (Requirement K5) */}
            <div className="p-3 rounded-xl bg-zinc-900/60 border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-rose-500 focus:ring-rose-500 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Mark as Recurring Bill</span>
                  </span>
                </label>
                {isRecurring && (
                  <select
                    value={recurrenceFrequency}
                    onChange={(e) => setRecurrenceFrequency(e.target.value as 'MONTHLY' | 'WEEKLY')}
                    className="bg-zinc-800 border border-zinc-700 text-white text-[11px] rounded-lg px-2 py-1 focus:outline-none cursor-pointer"
                  >
                    <option value="MONTHLY">Monthly (Rent, Wi-Fi)</option>
                    <option value="WEEKLY">Weekly (Maid, Groceries)</option>
                  </select>
                )}
              </div>
              {isRecurring && (
                <p className="text-[10px] text-zinc-500">
                  Recurring expenses are pinned in the Recurring Bills manager for effortless 1-tap logging every billing cycle.
                </p>
              )}
            </div>
          </div>

          {/* Sticky Submit Footer */}
          <div className="p-4 border-t border-white/10 bg-zinc-950/90 backdrop-blur-md shrink-0">
            <button
              type="submit"
              className={`w-full py-3 rounded-xl text-white text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer shadow-lg active:scale-[0.99] ${
                isPurple
                  ? 'bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-purple-950/60'
                  : 'bg-gradient-to-r from-rose-600 via-rose-700 to-amber-600 hover:from-rose-500 hover:to-amber-500 shadow-rose-950/60'
              }`}
            >
              {isEditing ? 'Save Changes' : 'Record Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
