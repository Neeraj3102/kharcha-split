import React, { useState } from 'react';
import { X, Send, Copy, Check, FileText } from 'lucide-react';
import type { Expense, Member, TimeFilter } from '../types';
import { createExpenseReportWhatsAppUrl } from '../utils/whatsapp';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenses: Expense[];
  members: Member[];
  shareableUrl: string;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  expenses,
  members,
  shareableUrl,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<TimeFilter>('THIS_MONTH');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Filter expenses according to chosen report window
  const now = new Date();
  const filteredExpenses = expenses.filter((e) => {
    if (selectedFilter === 'ALL') return true;
    const expDate = new Date(e.date);

    if (selectedFilter === 'THIS_MONTH') {
      return (
        expDate.getMonth() === now.getMonth() &&
        expDate.getFullYear() === now.getFullYear()
      );
    }

    if (selectedFilter === 'THIS_WEEK') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(now.getDate() - 7);
      return expDate >= oneWeekAgo;
    }

    return true;
  });

  const { url, message } = createExpenseReportWhatsAppUrl(
    filteredExpenses,
    members,
    selectedFilter,
    shareableUrl
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendWhatsApp = () => {
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="glass-panel w-full max-w-lg rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <FileText className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-white font-heading">
                WhatsApp Expense Report
              </h2>
              <p className="text-xs text-zinc-400">
                1-click formatted summary with spenders & tags
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Switcher */}
        <div className="px-6 pt-4 flex items-center gap-2">
          <button
            onClick={() => setSelectedFilter('THIS_WEEK')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              selectedFilter === 'THIS_WEEK'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-950'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            Weekly Report
          </button>
          <button
            onClick={() => setSelectedFilter('THIS_MONTH')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              selectedFilter === 'THIS_MONTH'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-950'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            Monthly Report
          </button>
          <button
            onClick={() => setSelectedFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              selectedFilter === 'ALL'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-950'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            All Time
          </button>
        </div>

        {/* Message Preview */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>WhatsApp Text Preview:</span>
            <span className="text-[11px] text-zinc-500 font-mono">
              {filteredExpenses.length} transactions included
            </span>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950/90 border border-zinc-800 text-xs font-mono text-zinc-300 whitespace-pre-wrap leading-relaxed select-all">
            {message}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-white/10 bg-zinc-950/60 flex items-center gap-3">
          <button
            onClick={handleCopy}
            className="flex-1 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-zinc-400" />
                <span>Copy Text</span>
              </>
            )}
          </button>

          <button
            onClick={handleSendWhatsApp}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-950"
          >
            <Send className="w-4 h-4" />
            <span>Share to WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
};
