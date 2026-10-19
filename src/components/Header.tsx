import React from 'react';
import { Share2, PlusCircle, UserPlus, FileText, Sparkles, Flame, Users, User } from 'lucide-react';
import type { TimeFilter, AppTheme, UserProfile } from '../types';

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
  pendingRequestsCount?: number;
  userProfile?: UserProfile | null;
  onOpenProfile: () => void;
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
  pendingRequestsCount = 0,
  userProfile,
  onOpenProfile,
}) => {
  const isPurple = theme === 'purple';

  return (
    <header className="relative w-full pt-4 pb-6 border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4 space-y-3">
        {/* Tier 1: Brand & Context Controls (Room, Profile, Theme) */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/5">
          {/* Brand with Responsive Logo */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 shrink-0">
            <div
              className={`relative flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl p-[1px] shrink-0 ${
                isPurple
                  ? 'bg-gradient-to-br from-purple-400 via-purple-600 to-indigo-600 shadow-lg shadow-purple-950/60'
                  : 'bg-gradient-to-br from-rose-600 via-rose-700 to-amber-600 neon-glow-red'
              }`}
            >
              <div className="w-full h-full bg-[#0d0d12] rounded-xl flex items-center justify-center">
                <span
                  className={`font-heading text-lg sm:text-xl font-black tracking-tighter ${
                    isPurple ? 'text-purple-400' : 'text-rose-500'
                  }`}
                >
                  {isPurple ? '⚡' : '₹'}
                </span>
              </div>
              {/* Pulsing micro dot */}
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 sm:h-3 sm:w-3">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    isPurple ? 'bg-purple-400' : 'bg-rose-500'
                  }`}
                ></span>
                <span
                  className={`relative inline-flex rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 ${
                    isPurple ? 'bg-purple-500' : 'bg-rose-600'
                  }`}
                ></span>
              </span>
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-extrabold tracking-tight text-white flex items-center gap-1.5 shrink-0 leading-none">
                <span>KHARCHA</span>
                <span className={isPurple ? 'text-purple-400' : 'text-rose-500'}>
                  SPLIT
                </span>
              </h1>
              <p className="text-[10px] sm:text-xs text-zinc-400 font-medium truncate mt-1">
                Flatmate Ledger • Instant UPI Settle
              </p>
            </div>
          </div>

          {/* Right: Room Switcher, User Profile & Theme Toggle */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* MULTIPLAYER FLAT ROOM SWITCHER BUTTON */}
            <button
              onClick={onOpenRoomManager}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer relative shrink-0 ${
                pendingRequestsCount > 0
                  ? 'bg-amber-950/80 border-amber-500/80 text-amber-300 hover:bg-amber-900/60 shadow-lg shadow-amber-950/40'
                  : activeRoom
                  ? 'bg-emerald-950/60 border-emerald-700/80 text-emerald-300 hover:bg-emerald-900/50'
                  : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 border-zinc-700/60'
              }`}
              title="Switch flats or manage shared rooms"
            >
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">{activeRoom ? `Flat #${activeRoom.roomId} ⇄` : 'My Flats ⇄'}</span>
              <span className="sm:hidden text-[11px] font-bold">{activeRoom ? `#${activeRoom.roomId}` : 'Flats'}</span>
              {pendingRequestsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-zinc-950 text-[10px] font-extrabold animate-bounce">
                  +{pendingRequestsCount}
                </span>
              )}
            </button>

            {/* USER PROFILE BUTTON */}
            <button
              onClick={onOpenProfile}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer shrink-0 ${
                userProfile?.name
                  ? 'bg-zinc-900/90 hover:bg-zinc-800 text-white border-zinc-700/80 shadow-sm'
                  : 'bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 border-zinc-700/50'
              }`}
              title="Manage your user profile and receiving UPI QR"
            >
              {userProfile?.name ? (
                <>
                  <div
                    className="w-4 h-4 rounded-full flex items-center justify-center font-bold text-white text-[10px] shrink-0"
                    style={{ backgroundColor: userProfile.avatarColor || '#ff003b' }}
                  >
                    {userProfile.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline max-w-[85px] truncate">{userProfile.name}</span>
                </>
              ) : (
                <>
                  <User className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="hidden sm:inline">Profile</span>
                </>
              )}
            </button>

            {/* THEME TOGGLE SWITCHER */}
            <button
              onClick={onToggleTheme}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs font-bold border transition-all cursor-pointer shrink-0 ${
                isPurple
                  ? 'bg-purple-950/50 text-purple-300 border-purple-700/80 hover:bg-purple-900/50 hover:border-purple-500 shadow-sm'
                  : 'bg-rose-950/40 text-rose-300 border-rose-800/80 hover:bg-rose-900/40'
              }`}
              title="Toggle between Crimson Dark and Purple themes"
            >
              {isPurple ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-purple-400 fill-purple-400" />
                  <span className="hidden sm:inline">Purple</span>
                </>
              ) : (
                <>
                  <Flame className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                  <span className="hidden sm:inline">Crimson</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tier 2: Action Ribbon (Add Expense, Flatmates, PDF, WhatsApp Report) */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar py-0.5">
          {/* Primary Operations */}
          <div className="flex items-center gap-2 shrink-0">
            {/* ADD EXPENSE BUTTON */}
            <button
              onClick={onOpenAddExpense}
              className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-lg shrink-0 ${
                isPurple
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-950/60'
                  : 'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white shadow-rose-950/50 hover:shadow-rose-600/30'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Add Expense</span>
            </button>

            {/* FLATMATE MANAGER */}
            <button
              onClick={onOpenAddMember}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/60 transition-all cursor-pointer shrink-0"
            >
              <UserPlus className="w-4 h-4 text-zinc-300" />
              <span>Flatmates ({activeMemberCount})</span>
            </button>
          </div>

          {/* Export & Sharing Operations */}
          <div className="flex items-center gap-2 shrink-0">
            {/* SHARE LEDGER AS PDF / LINK */}
            <button
              onClick={onOpenShareLedger}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/60 transition-all cursor-pointer shrink-0"
              title="Export complete ledger PDF or copy live flatmate link"
            >
              <Share2 className={`w-4 h-4 ${isPurple ? 'text-purple-400' : 'text-rose-400'}`} />
              <span>Share Ledger</span>
            </button>

            {/* WHATSAPP REPORT */}
            <button
              onClick={onOpenReport}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/60 transition-all cursor-pointer shrink-0"
              title="Generate summary message and window report for WhatsApp"
            >
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>WhatsApp Summary</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hero Stats & Timeline Filter */}
      <div className="max-w-6xl mx-auto px-4 mt-4 sm:mt-6">
        <div className="glass-panel rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className={`p-3 rounded-xl border shrink-0 ${
                isPurple
                  ? 'bg-purple-500/10 border-purple-500/20 text-purple-400'
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
                <span className={isPurple ? 'text-purple-400' : 'text-rose-500'}>₹</span>
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
                  ? isPurple
                    ? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-950'
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
                  ? isPurple
                    ? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-950'
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
                  ? isPurple
                    ? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-950'
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
