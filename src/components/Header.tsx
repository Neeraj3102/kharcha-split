import React from 'react';
import { Share2, PlusCircle, UserPlus, FileText, Sparkles, Zap, Flame, Users } from 'lucide-react';
import type { TimeFilter, AppTheme } from '../types';

interface HeaderProps {
  timeFilter: TimeFilter;
  setTimeFilter: (f: TimeFilter) => void;
  onOpenAddExpense: () => void;
  onOpenAddMember: () => void;
  onOpenReport: () => void;
  onOpenShareLedger: () => void;
  onOpenRoomManager: () => void;
  activeRoom: { roomId: string; roomName: string } | null;
  totalGroupSpend: number;
  activeMemberCount: number;
  theme: AppTheme;
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  timeFilter,
  setTimeFilter,
  onOpenAddExpense,
  onOpenAddMember,
  onOpenReport,
  onOpenShareLedger,
  onOpenRoomManager,
  activeRoom,
  totalGroupSpend,
  activeMemberCount,
  theme,
  onToggleTheme,
}) => {
  const isBumblebee = theme === 'bumblebee';

  return (
    <header className="relative w-full pt-6 pb-8 border-b border-white/10">
      {/* Top Bar with Brand & Actions */}
      <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Brand with Theme Badge */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div
            className={`relative flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-xl p-[1px] shrink-0 ${
              isBumblebee
                ? 'bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-500 shadow-lg shadow-yellow-950/60'
                : 'bg-gradient-to-br from-rose-600 via-rose-700 to-amber-600 neon-glow-red'
            }`}
          >
            <div className="w-full h-full bg-[#0d0d12] rounded-xl flex items-center justify-center">
              <span
                className={`font-heading text-xl sm:text-2xl font-black tracking-tighter ${
                  isBumblebee ? 'text-yellow-400' : 'text-rose-500'
                }`}
              >
                {isBumblebee ? '⚡' : '₹'}
              </span>
            </div>
            {/* Pulsing micro dot */}
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 sm:h-3 sm:w-3">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isBumblebee ? 'bg-yellow-400' : 'bg-rose-500'
                }`}
              ></span>
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 ${
                  isBumblebee ? 'bg-yellow-500' : 'bg-rose-600'
                }`}
              ></span>
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-1.5 shrink-0">
                <span>KHARCHA</span>
                <span className={isBumblebee ? 'text-yellow-400' : 'text-rose-500'}>
                  SPLIT
                </span>
              </h1>
              <span
                className={`text-[9px] sm:text-[10px] uppercase font-mono tracking-widest px-2 py-0.5 rounded-full border shrink-0 ${
                  isBumblebee
                    ? 'bg-yellow-950/80 text-yellow-400 border-yellow-700/60'
                    : 'bg-rose-950/80 text-rose-400 border-rose-800/60'
                }`}
              >
                {isBumblebee ? 'Bumblebee' : 'Crimson Dark'}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-zinc-400 font-medium truncate mt-0.5">
              Bachelor & Flatmate Ledger • Instant UPI Settle
            </p>
          </div>
        </div>

        {/* Global Action Buttons - Horizontal Swipe on Mobile, Wrap on Desktop */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
          {/* THEME TOGGLE SWITCHER */}
          <button
            onClick={onToggleTheme}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border transition-all cursor-pointer shrink-0 ${
              isBumblebee
                ? 'bg-yellow-950/40 text-yellow-300 border-yellow-700/80 hover:bg-yellow-900/40'
                : 'bg-rose-950/40 text-rose-300 border-rose-800/80 hover:bg-rose-900/40'
            }`}
            title="Toggle between Crimson Dark and Bumblebee themes"
          >
            {isBumblebee ? (
              <>
                <Zap className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                <span>Bumblebee</span>
              </>
            ) : (
              <>
                <Flame className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                <span>Crimson</span>
              </>
            )}
          </button>

          {/* MULTIPLAYER FLAT ROOM BUTTON */}
          <button
            onClick={onOpenRoomManager}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer shrink-0 ${
              activeRoom
                ? 'bg-emerald-950/60 border-emerald-700/80 text-emerald-300 hover:bg-emerald-900/50'
                : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 border-zinc-700/60'
            }`}
            title="Manage shared flat room and invite links"
          >
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span>{activeRoom ? `Flat #${activeRoom.roomId}` : 'Flat Rooms'}</span>
          </button>

          {/* FLATMATE MANAGER */}
          <button
            onClick={onOpenAddMember}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/60 transition-all cursor-pointer shrink-0"
          >
            <UserPlus className="w-4 h-4 text-zinc-300" />
            <span>Flatmates ({activeMemberCount})</span>
          </button>

          {/* ADD EXPENSE BUTTON */}
          <button
            onClick={onOpenAddExpense}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-lg shrink-0 ${
              isBumblebee
                ? 'bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-zinc-950 shadow-yellow-950/60'
                : 'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white shadow-rose-950/50 hover:shadow-rose-600/30'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Add Expense</span>
          </button>

          {/* SHARE LEDGER AS PDF / LINK */}
          <button
            onClick={onOpenShareLedger}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/60 transition-all cursor-pointer shrink-0"
            title="Export full ledger as PDF or copy shareable link"
          >
            <Share2 className={`w-4 h-4 ${isBumblebee ? 'text-yellow-400' : 'text-rose-400'}`} />
            <span>PDF Export</span>
          </button>

          {/* WHATSAPP REPORT */}
          <button
            onClick={onOpenReport}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/60 transition-all cursor-pointer shrink-0"
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>WhatsApp Report</span>
          </button>
        </div>
      </div>

      {/* Hero Stats & Timeline Filter */}
      <div className="max-w-6xl mx-auto px-4 mt-4 sm:mt-6">
        <div className="glass-panel rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className={`p-3 rounded-xl border shrink-0 ${
                isBumblebee
                  ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
              }`}
            >
              <Sparkles className="w-5 sm:w-6 h-5 sm:h-6 animate-pulse" />
            </div>
            <div>
              <div className="text-[11px] sm:text-xs uppercase tracking-wider text-zinc-400 font-medium">
                {timeFilter === 'ALL'
                  ? 'All-Time Total Spend'
                  : timeFilter === 'THIS_WEEK'
                  ? "This Week's Spend"
                  : "This Month's Spend"}
              </div>
              <div className="text-xl sm:text-3xl font-extrabold text-white font-mono tracking-tight flex items-baseline gap-1">
                <span className={isBumblebee ? 'text-yellow-400' : 'text-rose-500'}>₹</span>
                {totalGroupSpend.toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </div>
          </div>

          {/* Time Filter Tabs - Segmented Control on Mobile */}
          <div className="flex items-center bg-zinc-900/90 p-1 rounded-xl border border-white/5 w-full md:w-auto">
            <button
              onClick={() => setTimeFilter('ALL')}
              className={`flex-1 md:flex-initial px-3 py-1.5 rounded-lg text-xs font-semibold text-center transition-all cursor-pointer ${
                timeFilter === 'ALL'
                  ? isBumblebee
                    ? 'bg-yellow-400 text-zinc-950 font-bold shadow-md shadow-yellow-950'
                    : 'bg-rose-600 text-white shadow-md shadow-rose-900/40'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setTimeFilter('THIS_MONTH')}
              className={`flex-1 md:flex-initial px-3 py-1.5 rounded-lg text-xs font-semibold text-center transition-all cursor-pointer ${
                timeFilter === 'THIS_MONTH'
                  ? isBumblebee
                    ? 'bg-yellow-400 text-zinc-950 font-bold shadow-md shadow-yellow-950'
                    : 'bg-rose-600 text-white shadow-md shadow-rose-900/40'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setTimeFilter('THIS_WEEK')}
              className={`flex-1 md:flex-initial px-3 py-1.5 rounded-lg text-xs font-semibold text-center transition-all cursor-pointer ${
                timeFilter === 'THIS_WEEK'
                  ? isBumblebee
                    ? 'bg-yellow-400 text-zinc-950 font-bold shadow-md shadow-yellow-950'
                    : 'bg-rose-600 text-white shadow-md shadow-rose-900/40'
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
