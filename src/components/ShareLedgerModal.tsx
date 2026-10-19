import React, { useState } from 'react';
import { X, FileDown, Share2, Copy, Check, ShieldCheck, Sparkles } from 'lucide-react';
import type { AppState, AppTheme } from '../types';
import { generateFullLedgerPdf, downloadOrSharePdf } from '../utils/pdfGenerator';
import { calculateMinimizedSettlements, getMemberNetBalances } from '../utils/minCashFlow';

interface ShareLedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: AppState;
  theme: AppTheme;
  shareableUrl: string;
}

export const ShareLedgerModal: React.FC<ShareLedgerModalProps> = ({
  isOpen,
  onClose,
  state,
  theme,
  shareableUrl,
}) => {
  const [copied, setCopied] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [pdfStatus, setPdfStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPdf = async () => {
    setPdfGenerating(true);
    setPdfStatus('Generating PDF...');
    try {
      const netBalances = getMemberNetBalances(
        state.members,
        state.expenses,
        state.settledTransactions
      );
      const settlements = calculateMinimizedSettlements(
        state.members,
        state.expenses,
        state.settledTransactions
      );

      const doc = generateFullLedgerPdf(state, netBalances, settlements);
      const filename = `KharchaSplit-Full-Ledger-${new Date().toISOString().slice(0, 10)}.pdf`;
      const result = await downloadOrSharePdf(doc, filename, 'KharchaSplit Flatmate Ledger');
      setPdfStatus(result === 'shared' ? 'Opened Share Sheet!' : 'Downloaded PDF!');
      setTimeout(() => setPdfStatus(null), 3000);
    } catch (err) {
      console.error(err);
      setPdfStatus('Failed to generate PDF');
    } finally {
      setPdfGenerating(false);
    }
  };

  const isPurple = theme === 'purple';

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="glass-panel w-full max-w-md rounded-2xl border border-white/10 shadow-2xl overflow-hidden p-6 space-y-5 cursor-default"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span
              className={`p-2 rounded-lg ${
                isPurple ? 'bg-purple-500/10 text-purple-400' : 'bg-rose-500/10 text-rose-500'
              }`}
            >
              <Share2 className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-white font-heading">Share Flat Ledger</h2>
              <p className="text-xs text-zinc-400">Export as PDF or send live web link</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Option 1: PDF Export (Primary) */}
        <div className="p-4 rounded-xl bg-zinc-900/80 border border-white/5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <FileDown className={`w-4 h-4 ${isPurple ? 'text-purple-400' : 'text-rose-500'}`} />
                <span>Download & Share as PDF</span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                A clean, multi-page PDF summary with all flatmate balances, minimized payments, and the itemized expense list.
              </p>
            </div>
          </div>

          <button
            onClick={handleDownloadPdf}
            disabled={pdfGenerating}
            className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
              isPurple
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-950'
                : 'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white shadow-rose-950'
            }`}
          >
            <FileDown className="w-4 h-4" />
            <span>{pdfStatus || (pdfGenerating ? 'Generating PDF...' : 'Download Full Ledger PDF')}</span>
          </button>
        </div>

        {/* Option 2: Live Link with URL compression */}
        <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 space-y-3">
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-zinc-400" />
              <span>Copy Live Web Link</span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Encodes all flat records into a compressed URL hash. Roommates can open it on their phones with zero login.
            </p>
          </div>

          <button
            onClick={handleCopyLink}
            className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Copied Link to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-zinc-400" />
                <span>Copy Web Link</span>
              </>
            )}
          </button>
        </div>

        {/* Security Note */}
        <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 pt-1">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>No cloud databases. All PDFs and links are generated on your device.</span>
        </div>
      </div>
    </div>
  );
};
