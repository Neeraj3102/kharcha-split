import React, { useState } from 'react';
import { X, Copy, Check, QrCode, ExternalLink } from 'lucide-react';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrDataUrl: string;
  upiUri: string;
  toName: string;
  toUpiId: string;
  amount: number;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  isOpen,
  onClose,
  qrDataUrl,
  upiUri,
  toName,
  toUpiId,
  amount,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(toUpiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="glass-panel w-full max-w-sm rounded-2xl border border-white/10 shadow-2xl overflow-hidden p-6 text-center space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500">
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

        {/* QR Code Container (The Weeknd Neon Frame) */}
        <div className="relative inline-block p-4 bg-white rounded-2xl shadow-xl shadow-rose-950/40">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="UPI QR Code"
              className="w-56 h-56 mx-auto object-contain"
            />
          ) : (
            <div className="w-56 h-56 flex items-center justify-center text-zinc-400 text-xs">
              Generating QR...
            </div>
          )}
        </div>

        {/* Amount & Receiver Info */}
        <div className="space-y-1">
          <div className="text-xs text-zinc-400">Exact Payable Amount</div>
          <div className="text-3xl font-extrabold text-white font-mono tracking-tight text-rose-500">
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
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-rose-950"
        >
          <span>Open Installed UPI App</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
};
