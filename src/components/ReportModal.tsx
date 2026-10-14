import React, { useState } from 'react';
import { X, Send, Copy, Check, FileText, FileDown } from 'lucide-react';
import type { Expense, Member, TimeFilter, AppTheme } from '../types';
import { createExpenseReportWhatsAppUrl } from '../utils/whatsapp';
import { generateExpenseReportPdf, downloadOrSharePdf } from '../utils/pdfGenerator';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenses: Expense[];
  members: Member[];
  shareableUrl: string;
  theme?: AppTheme;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  expenses,
  members,
  shareableUrl,
  theme = 'weeknd',
}) => {
  const [selectedFilter, setSelectedFilter] = useState<TimeFilter>('THIS_MONTH');
  const [copied, setCopied] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [pdfStatus, setPdfStatus] = useState<string | null>(null);

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

  const handleDownloadPdf = async () => {
    setPdfGenerating(true);
    setPdfStatus('Generating PDF...');
    try {
      const doc = generateExpenseReportPdf(filteredExpenses, members, selectedFilter);
      const filename = `KharchaSplit-Report-${selectedFilter}-${new Date().toISOString().slice(0, 10)}.pdf`;
      const result = await downloadOrSharePdf(doc, filename, 'KharchaSplit Expense Report');
      setPdfStatus(result === 'shared' ? 'Opened Share Sheet!' : 'Downloaded PDF!');
      setTimeout(() => setPdfStatus(null), 3000);
    } catch (err) {
      console.error(err);
      setPdfStatus('Failed to generate PDF');
    } finally {
      setPdfGenerating(false);
    }
  };

  const isBumblebee = theme === 'bumblebee';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="glass-panel w-full max-w-lg rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`p-2 rounded-lg ${
                isBumblebee ? 'bg-yellow-400/10 text-yellow-400' : 'bg-emerald-500/10 text-emerald-400'
              }`}
            >
              <FileText className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-white font-heading">
                Expense Report & PDF Export
              </h2>
              <p className="text-xs text-zinc-400">
                Export itemized summary as PDF or send via WhatsApp
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
                ? isBumblebee
                  ? 'bg-yellow-400 text-zinc-950 font-bold shadow-md shadow-yellow-950'
                  : 'bg-rose-600 text-white shadow-md shadow-rose-950'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            Weekly Report
          </button>
          <button
            onClick={() => setSelectedFilter('THIS_MONTH')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              selectedFilter === 'THIS_MONTH'
                ? isBumblebee
                  ? 'bg-yellow-400 text-zinc-950 font-bold shadow-md shadow-yellow-950'
                  : 'bg-rose-600 text-white shadow-md shadow-rose-950'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            Monthly Report
          </button>
          <button
            onClick={() => setSelectedFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              selectedFilter === 'ALL'
                ? isBumblebee
                  ? 'bg-yellow-400 text-zinc-950 font-bold shadow-md shadow-yellow-950'
                  : 'bg-rose-600 text-white shadow-md shadow-rose-950'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            All Time
          </button>
        </div>

        {/* PDF Quick Download Action Banner */}
        <div className="px-6 pt-4">
          <div className="p-3 rounded-xl bg-zinc-900/90 border border-white/5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FileDown className={`w-4 h-4 ${isBumblebee ? 'text-yellow-400' : 'text-rose-400'}`} />
              <div className="text-xs">
                <span className="font-bold text-white">Share as PDF Document</span>
                <span className="text-zinc-500 block text-[10px]">Formatted table with spenders & tags</span>
              </div>
            </div>
            <button
              onClick={handleDownloadPdf}
              disabled={pdfGenerating}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md ${
                isBumblebee
                  ? 'bg-yellow-400 hover:bg-yellow-300 text-zinc-950'
                  : 'bg-rose-600 hover:bg-rose-500 text-white'
              }`}
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>{pdfStatus || (pdfGenerating ? 'Generating...' : 'Export PDF')}</span>
            </button>
          </div>
        </div>

        {/* Message Preview */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>WhatsApp Text Breakdown:</span>
            <span className="text-[11px] text-zinc-500 font-mono">
              {filteredExpenses.length} transactions included
            </span>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950/90 border border-zinc-800 text-xs font-mono text-zinc-300 whitespace-pre-wrap leading-relaxed select-all max-h-48 overflow-y-auto">
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
                <span className="text-emerald-400">Copied Text!</span>
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
            <span>Send to WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
};
