import React, { useState } from 'react';
import { Share2, PlusCircle, UserPlus, FileText, Check, Sparkles } from 'lucide-react';
import type { TimeFilter } from '../types';

interface HeaderProps {
  timeFilter: TimeFilter;
  setTimeFilter: (f: TimeFilter) => void;
  onOpenAddExpense: () => void;
  onOpenAddMember: () => void;
  onOpenReport: () => void;
  onShareLink: () => void;
  totalGroupSpend: number;
  activeMemberCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  timeFilter,
  setTimeFilter,
  onOpenAddExpense,
  onOpenAddMember,
  onOpenReport,
  onShareLink,
  totalGroupSpend,
  activeMemberCount,
}) => {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    onShareLink();
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <header className="relative w-full pt-6 pb-8 border-b border-white/10">
      {/* Top Bar with Brand & Actions */}
      <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* The Weeknd Inspired Glowing Brand */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-rose-600 via-rose-700 to-amber-600 neon-glow-red p-[1px]">
            <div className="w-full h-full bg-[#0d0d12] rounded-xl flex items-center justify-center">
              <span className="font-heading text-2xl font-black text-rose-500 tracking-tighter">₹</span>
            </div>
            {/* Pulsing micro dot */}
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
                KHARCHA<span className="text-rose-500">SPLIT</span>
              </h1>
              <span className="text-[10px] uppercase font-mono tracking-widest px-2 py-0.5 rounded-full bg-rose-950/80 text-rose-400 border border-rose-800/60">
                After Hours
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-medium">
              Bachelor & Flatmate Ledger • Instant UPI Settle
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/60 transition-all cursor-pointer"
            title="Copies full flatmate ledger URL (Zero database required!)"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Copied Link!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 text-rose-400" />
                <span>Share Ledger</span>
              </>
            )}
          </button>

          <button
            onClick={onOpenReport}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/60 transition-all cursor-pointer"
          >
            <FileText className="w-4 h-4 text-amber-400" />
            <span>WhatsApp Report</span>
          </button>

          <button
            onClick={onOpenAddMember}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/60 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-zinc-300" />
            <span>Flatmates ({activeMemberCount})</span>
          </button>

          <button
            onClick={onOpenAddExpense}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white shadow-lg shadow-rose-950/50 hover:shadow-rose-600/30 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Add Expense</span>
          </button>
        </div>
      </div>

      {/* Hero Stats & Timeline Filter */}
      <div className="max-w-6xl mx-auto px-4 mt-6">
        <div className="glass-panel rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-zinc-400 font-medium">
                {timeFilter === 'ALL'
                  ? 'All-Time Total Spend'
                  : timeFilter === 'THIS_WEEK'
                  ? "This Week's Spend"
                  : "This Month's Spend"}
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight flex items-baseline gap-1">
                <span className="text-rose-500">₹</span>
                {totalGroupSpend.toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </div>
          </div>

          {/* Time Filter Tabs */}
          <div className="flex items-center bg-zinc-900/90 p-1 rounded-xl border border-white/5 self-start md:self-auto">
            <button
              onClick={() => setTimeFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                timeFilter === 'ALL'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-900/40'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setTimeFilter('THIS_MONTH')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                timeFilter === 'THIS_MONTH'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-900/40'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setTimeFilter('THIS_WEEK')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                timeFilter === 'THIS_WEEK'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-900/40'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              This Week
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
