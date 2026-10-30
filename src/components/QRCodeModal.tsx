import React, { useState } from 'react';
import { X, Copy, Check, QrCode, ExternalLink } from 'lucide-react';
import type { AppTheme } from '../types';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrDataUrl: string;
  upiUri: string;
  toName: string;
  toUpiId: string;
  amount: number;
  theme?: AppTheme;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  isOpen,
  onClose,
  qrDataUrl,
  upiUri,
  toName,
  toUpiId,
  amount,
  theme = 'weeknd',
}) => {
  const isPurple = theme === 'purple';
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(toUpiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-[110] flex items-center justify-center p-2.5 sm:p-4 bg-black/85 backdrop-blur-md cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="glass-panel w-full max-w-sm rounded-2xl border border-white/10 shadow-2xl overflow-hidden p-4 sm:p-6 text-center space-y-4 cursor-default max-h-[92dvh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className={`p-1.5 rounded-lg ${isPurple ? 'bg-purple-500/10 text-purple-400' : 'bg-rose-500/10 text-rose-500'}`}>
              <QrCode className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-white">
              Scan with GPay / PhonePe
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* QR Code Container */}
        <div className={`relative inline-block p-3 sm:p-4 bg-white rounded-2xl shadow-xl max-w-full ${
          isPurple ? 'shadow-purple-950/40' : 'shadow-rose-950/40'
        }`}>
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="UPI QR Code"
              className="w-44 h-44 sm:w-56 sm:h-56 mx-auto object-contain"
            />
          ) : (
            <div className="w-44 h-44 sm:w-56 sm:h-56 flex items-center justify-center text-zinc-400 text-xs">
              Generating QR...
            </div>
          )}
        </div>

        {/* Amount & Receiver Info */}
        <div className="space-y-1">
          <div className="text-xs text-zinc-400">Exact Payable Amount</div>
          <div className={`text-3xl font-extrabold font-mono tracking-tight ${
            isPurple ? 'text-purple-400' : 'text-rose-500'
          }`}>
            ₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs font-semibold text-zinc-200">
            Pay to: <span className="text-white font-bold">{toName}</span>
          </div>
        </div>

        {/* UPI ID Copy Pill */}
        <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between gap-2">
          <span className="text-xs font-mono text-zinc-300 truncate pl-2">{toUpiId}</span>
          <button
            onClick={handleCopyUpi}
            className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white flex items-center gap-1 transition-all cursor-pointer shrink-0"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 text-[10px]">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-[10px]">Copy UPI</span>
              </>
            )}
          </button>
        </div>

        {/* Action Button: Open UPI Link directly (for mobile devices) */}
        <a
          href={upiUri}
          className={`w-full py-2.5 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md ${
            isPurple
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-purple-950'
              : 'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 shadow-rose-950'
          }`}
        >
          <span>Open Installed UPI App</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
};
