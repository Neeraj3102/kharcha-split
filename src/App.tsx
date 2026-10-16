import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Users, Radio, Copy, Check, ShieldCheck, Plus, FileText, Building2 } from 'lucide-react';
import type {
  Member,
  Expense,
  Settlement,
  QuickTag,
  TimeFilter,
  AppState,
  AppTheme,
} from './types';
import {
  loadInitialState,
  saveStateToLocalStorage,
  DEFAULT_INDIAN_TAGS,
  DEMO_STATE,
} from './utils/storage';
import {
  calculateMinimizedSettlements,
  getMemberNetBalances,
} from './utils/minCashFlow';
import { generateUpiQrCode } from './utils/upi';
import { compressStateToUrl } from './utils/urlState';
import {
  getActiveRoomId,
  saveActiveRoomId,
  subscribeToRoomState,
  subscribeToAllRooms,
  pushRoomState,
  getMyMemberId,
  setMyMemberId,
  isUserRoomAdmin,
  transferRoomAdmin,
  deleteSettledTransactionFromRoom,
} from './utils/firebase';
import type { RoomMeta } from './utils/firebase';

// Components
import { Header } from './components/Header';
import { SettlementCards } from './components/SettlementCards';
import { ExpenseList } from './components/ExpenseList';
import { AddExpenseModal } from './components/AddExpenseModal';
import { MemberManager } from './components/MemberManager';
import { QRCodeModal } from './components/QRCodeModal';
import { MarkPaidModal } from './components/MarkPaidModal';
import { ReportModal } from './components/ReportModal';
import { ShareLedgerModal } from './components/ShareLedgerModal';
import { RoomManagerModal } from './components/RoomManagerModal';
import { AdminPortalModal } from './components/AdminPortalModal';
import { TagSpendingChart } from './components/TagSpendingChart';

export function App() {
  const [state, setState] = useState<AppState>(loadInitialState);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('ALL');

  // Active Collaborative Flat Room
  const [activeRoom, setActiveRoom] = useState<{ roomId: string; roomName: string } | null>(
    getActiveRoomId
  );
  const [copiedRoomLink, setCopiedRoomLink] = useState(false);

  // Changeable Theme (Weeknd vs Bumblebee)
  const [theme, setTheme] = useState<AppTheme>(() => {
    try {
      const saved = localStorage.getItem('kharchasplit_theme');
      if (saved === 'weeknd' || saved === 'bumblebee') return saved;
    } catch {
      // ignore
    }
    return 'weeknd';
  });

  // Modals state
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isShareLedgerOpen, setIsShareLedgerOpen] = useState(false);
  const [isRoomManagerOpen, setIsRoomManagerOpen] = useState(false);
  const [isAdminPortalOpen, setIsAdminPortalOpen] = useState(false);
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null);

  // QR Modal state
  const [qrState, setQrState] = useState<{
    isOpen: boolean;
    dataUrl: string;
    upiUri: string;
    toName: string;
    toUpiId: string;
    amount: number;
  }>({
    isOpen: false,
    dataUrl: '',
    upiUri: '',
    toName: '',
    toUpiId: '',
    amount: 0,
  });

  // Mark Paid Modal state
  const [markPaidSettlement, setMarkPaidSettlement] = useState<Settlement | null>(null);

  // Auto-save state to localStorage on every update
  useEffect(() => {
    saveStateToLocalStorage(state);
  }, [state]);

  // Persist theme choice
  useEffect(() => {
    try {
      localStorage.setItem('kharchasplit_theme', theme);
    } catch {
      // ignore
    }
  }, [theme]);

  // Active room metadata and room admin role calculation
  const [roomMeta, setRoomMeta] = useState<RoomMeta | null>(null);
  const [adminRefreshTick, setAdminRefreshTick] = useState(0);

  // Device Identity in the active room (e.g., who "I am" on this device)
  const [myMemberId, setMyMemberIdState] = useState<string | null>(() => {
    const current = getActiveRoomId();
    return current ? getMyMemberId(current.roomId) : null;
  });

  // Keep myMemberId synchronized when active room changes
  useEffect(() => {
    if (activeRoom) {
      setMyMemberIdState(getMyMemberId(activeRoom.roomId));
    } else {
      setMyMemberIdState(null);
    }
  }, [activeRoom?.roomId]);

  const handleSetMyMemberId = (memberId: string, memberName: string) => {
    if (!activeRoom) return;
    setMyMemberId(activeRoom.roomId, memberId, memberName);
    setMyMemberIdState(memberId);
    setAdminRefreshTick((t) => t + 1);
  };

  // Authority check: Is current user the Room Admin? (Local mode has full admin rights)
  const isRoomAdmin = useMemo(() => {
    if (!activeRoom) return true;
    return isUserRoomAdmin(activeRoom.roomId, roomMeta, myMemberId);
  }, [activeRoom, roomMeta, myMemberId, adminRefreshTick]);

  // Active room ref to prevent stale closures during rapid updates
  const activeRoomRef = useRef(activeRoom);
  useEffect(() => {
    activeRoomRef.current = activeRoom;
  }, [activeRoom]);

  // Open Master Admin Portal or switch room via URL hash e.g. #admin or #room=710
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash.includes('#admin')) {
        setIsAdminPortalOpen(true);
      }
      if (hash.includes('#room=')) {
        const rawId = hash.split('#room=')[1]?.split('&')[0]?.trim().toUpperCase();
        if (rawId && (!activeRoomRef.current || activeRoomRef.current.roomId !== rawId)) {
          setActiveRoom({ roomId: rawId, roomName: `Flat ${rawId}` });
        }
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // LIVE ROOM SYNC: Listen for real-time updates from other flatmates via WebSockets
  useEffect(() => {
    setSelectedTagFilter(null);
    setRoomMeta(null);

    if (!activeRoom) {
      // Offline local mode
      setState(loadInitialState());
      return;
    }

    // Clean state while switching/loading room so previous flat's data doesn't cross-contaminate
    setState({
      members: [],
      expenses: [],
      settledTransactions: [],
      customTags: [],
    });

    const unsubscribe = subscribeToRoomState(
      activeRoom.roomId,
      (remoteState, meta) => {
        setState(remoteState);
        if (meta) {
          setRoomMeta(meta);
        }
      },
      (err) => {
        console.warn('Realtime cloud sync fallback:', err);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [activeRoom?.roomId]);

  // Discover active cloud rooms for seamless 1-tap joining when opening on a new device (like a phone)
  const [discoveredRooms, setDiscoveredRooms] = useState<
    Array<{ id: string; name: string; memberCount: number; spend: number }>
  >([]);

  useEffect(() => {
    if (activeRoom) {
      setDiscoveredRooms([]);
      return;
    }

    const unsub = subscribeToAllRooms(
      (allRooms) => {
        const list = Object.entries(allRooms).map(([id, r]) => {
          const members = r.state?.members || [];
          const expenses = r.state?.expenses || [];
          const totalSpend = expenses.reduce((sum, e) => sum + (e.totalAmount || 0), 0);
          return {
            id,
            name: r.meta?.name || `Flat ${id}`,
            memberCount: members.length,
            spend: totalSpend,
          };
        });
        setDiscoveredRooms(list);
      },
      (err) => {
        console.warn('Discovery rooms error:', err);
      }
    );

    return () => {
      if (unsub) unsub();
    };
  }, [activeRoom]);

  // Helper to sync local changes to the shared room
  const syncToCloud = useCallback((newState: AppState) => {
    const currentRoom = activeRoomRef.current;
    if (currentRoom) {
      pushRoomState(currentRoom.roomId, newState, currentRoom.roomName);
    }
  }, []);

  // Combined Tags: Default Indian Quick Tags + Custom User Tags
  const allTags: QuickTag[] = [...DEFAULT_INDIAN_TAGS, ...state.customTags];

  // Filtered Expenses by Time Filter (All, Week, Month) & Selected Tag Filter
  const now = new Date();
  const filteredExpenses = state.expenses.filter((e) => {
    // 1. Tag filter from pie chart
    if (selectedTagFilter && e.tag !== selectedTagFilter) {
      return false;
    }

    // 2. Time filter
    if (timeFilter === 'ALL') return true;
    const expDate = new Date(e.date);

    if (timeFilter === 'THIS_MONTH') {
      return (
        expDate.getMonth() === now.getMonth() &&
        expDate.getFullYear() === now.getFullYear()
      );
    }

    if (timeFilter === 'THIS_WEEK') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(now.getDate() - 7);
      return expDate >= oneWeekAgo;
    }

    return true;
  });

  // Total Group Spend for selected period
  const totalGroupSpend = filteredExpenses.reduce((sum, e) => sum + e.totalAmount, 0);

  // Live Balances & Minimized Settlements (Greedy Min-Cash Flow)
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

  // Check if any modal is currently open to hide the bottom mobile navigation bar
  const isAnyModalOpen =
    isAddExpenseOpen ||
    isAddMemberOpen ||
    isReportOpen ||
    isShareLedgerOpen ||
    isRoomManagerOpen ||
    isAdminPortalOpen ||
    qrState.isOpen ||
    !!markPaidSettlement;

  // Handlers
  const handleAddMember = (newMemberData: Omit<Member, 'id'>) => {
    const newMember: Member = {
      ...newMemberData,
      id: `m-${Date.now()}`,
    };
    const updated = {
      ...state,
      members: [...state.members, newMember],
    };
    setState(updated);
    syncToCloud(updated);
  };

  const handleDeleteMember = (id: string) => {
    if (activeRoom && !isRoomAdmin) {
      alert('Authority restricted: Only the Room Admin can remove flatmates.');
      return;
    }
    const updated = {
      ...state,
      members: state.members.filter((m) => m.id !== id),
      expenses: state.expenses.filter(
        (e) => e.paidById !== id && !e.splits.some((s) => s.memberId === id)
      ),
      settledTransactions: state.settledTransactions.filter(
        (s) => s.fromMemberId !== id && s.toMemberId !== id
      ),
    };
    setState(updated);
    syncToCloud(updated);
  };

  const handleResetAllData = () => {
    if (activeRoom && !isRoomAdmin) {
      alert('Authority restricted: Only the Room Admin can reset the flat ledger.');
      return;
    }
    localStorage.removeItem('kharchasplit_v1_data');
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname);
    }
    const emptyState: AppState = {
      members: [],
      expenses: [],
      settledTransactions: [],
      customTags: [],
    };
    setState(emptyState);
    syncToCloud(emptyState);
  };

  const handleLoadDemoData = () => {
    setState(DEMO_STATE);
    syncToCloud(DEMO_STATE);
  };

  const handleAddExpense = (newExpenseData: Omit<Expense, 'id'>) => {
    const newExpense: Expense = {
      ...newExpenseData,
      id: `exp-${Date.now()}`,
    };
    const updated = {
      ...state,
      expenses: [newExpense, ...state.expenses],
    };
    setState(updated);
    syncToCloud(updated);
  };

  const handleDeleteExpense = (id: string) => {
    if (activeRoom && !isRoomAdmin) {
      alert('Authority restricted: Only the Room Admin can delete expenses.');
      return;
    }
    const updated = {
      ...state,
      expenses: state.expenses.filter((e) => e.id !== id),
    };
    setState(updated);
    syncToCloud(updated);
  };

  const handleAddCustomTag = (tag: QuickTag) => {
    const updated = {
      ...state,
      customTags: [...state.customTags, tag],
    };
    setState(updated);
    syncToCloud(updated);
  };

  // Open QR Code Modal
  const handleOpenQr = async (settlement: Settlement, upiUri: string) => {
    const toMember = state.members.find((m) => m.id === settlement.toMemberId);
    if (!toMember) return;

    try {
      const dataUrl = await generateUpiQrCode(upiUri);
      setQrState({
        isOpen: true,
        dataUrl,
        upiUri,
        toName: toMember.name,
        toUpiId: toMember.upiId,
        amount: settlement.amount,
      });
    } catch (err) {
      console.error(err);
      alert('Could not generate QR code');
    }
  };

  // Open Mark-as-Paid Modal
  const handleOpenMarkPaid = (settlement: Settlement) => {
    setMarkPaidSettlement(settlement);
  };

  // Confirm Settlement (With over-settlement prevention & duplicate suppression to eliminate ghost payment reminders)
  const handleConfirmSettlement = (settlement: Settlement) => {
    // 1. Calculate live net balances before this settlement
    const currentBalances = getMemberNetBalances(
      state.members,
      state.expenses,
      state.settledTransactions
    );

    const debtorDebt = Math.max(0, -(currentBalances[settlement.fromMemberId] || 0));
    const creditorCredit = Math.max(0, currentBalances[settlement.toMemberId] || 0);

    if (debtorDebt < 0.01 || creditorCredit < 0.01) {
      alert('Notice: This payment is already fully balanced! No remaining debt exists between these flatmates.');
      return;
    }

    // 2. Prevent over-settlement: Cap amount to the exact remaining debt
    const cappedAmount = Math.min(settlement.amount, debtorDebt, creditorCredit);
    const roundedAmount = Math.round(cappedAmount * 100) / 100;

    if (roundedAmount < 0.01) {
      return;
    }

    // 3. Deduplication check: ignore if the exact same payment was recorded in the last 15 seconds
    const now = Date.now();
    const isDuplicate = state.settledTransactions.some((s) => {
      if (s.fromMemberId === settlement.fromMemberId && s.toMemberId === settlement.toMemberId) {
        if (Math.abs(s.amount - roundedAmount) < 0.01) {
          const settledTime = s.settledAt ? new Date(s.settledAt).getTime() : 0;
          return now - settledTime < 15000;
        }
      }
      return false;
    });

    if (isDuplicate) {
      console.log('Prevented duplicate settlement submission within 15 seconds.');
      return;
    }

    const newSettledRecord: Settlement = {
      ...settlement,
      id: `settle-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      amount: roundedAmount,
      isSettled: true,
      settledAt: new Date().toISOString(),
    };

    const updated = {
      ...state,
      settledTransactions: [...state.settledTransactions, newSettledRecord],
    };
    setState(updated);
    syncToCloud(updated);
  };

  // Delete / Undo a settled payment (Room Admin only)
  const handleDeleteSettledTransaction = async (transactionId: string) => {
    if (activeRoom && !isRoomAdmin) {
      alert('Authority restricted: Only the Room Admin can undo settled records.');
      return;
    }
    const updated = {
      ...state,
      settledTransactions: state.settledTransactions.filter((s) => s.id !== transactionId),
    };
    setState(updated);
    syncToCloud(updated);

    if (activeRoom) {
      await deleteSettledTransactionFromRoom(activeRoom.roomId, transactionId);
    }
  };

  // Transfer Room Admin powers to another flatmate
  const handleTransferAdmin = async (newMemberId: string, newMemberName: string) => {
    if (!activeRoom) return;
    const ok = await transferRoomAdmin(activeRoom.roomId, newMemberId, newMemberName);
    if (ok) {
      setRoomMeta((prev) =>
        prev
          ? {
              ...prev,
              adminMemberId: newMemberId,
              adminMemberName: newMemberName,
            }
          : null
      );
      setAdminRefreshTick((t) => t + 1);
    }
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'weeknd' ? 'bumblebee' : 'weeknd'));
  };

  const handleCopyRoomInvite = () => {
    if (!activeRoom) return;
    const url = `${window.location.origin}${window.location.pathname}#room=${activeRoom.roomId}`;
    navigator.clipboard.writeText(url);
    setCopiedRoomLink(true);
    setTimeout(() => setCopiedRoomLink(false), 2500);
  };

  const liveShareUrl = compressStateToUrl(state);
  const isBumblebee = theme === 'bumblebee';

  return (
    <div className={`min-h-screen bg-[#08080a] bg-app-grid text-zinc-100 flex flex-col font-sans theme-${theme}`}>
      {/* Header with theme switcher, stats & actions */}
      <Header
        timeFilter={timeFilter}
        setTimeFilter={setTimeFilter}
        onOpenAddExpense={() => setIsAddExpenseOpen(true)}
        onOpenAddMember={() => setIsAddMemberOpen(true)}
        onOpenReport={() => setIsReportOpen(true)}
        onOpenShareLedger={() => setIsShareLedgerOpen(true)}
        onOpenRoomManager={() => setIsRoomManagerOpen(true)}
        activeRoom={activeRoom}
        totalGroupSpend={totalGroupSpend}
        activeMemberCount={state.members.length}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Real-time Flat Room Status Banner */}
      <div className="max-w-6xl w-full mx-auto px-4 pt-4">
        {activeRoom ? (
          <div className="glass-panel rounded-xl px-4 py-2.5 flex items-center justify-between gap-3 border border-emerald-900/50 bg-emerald-950/20">
            <div className="flex items-center gap-2 text-xs">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-zinc-300">
                Connected to <strong className="text-white">{activeRoom.roomName}</strong> (Code:{' '}
                <span className="font-mono text-emerald-400 font-bold">#{activeRoom.roomId}</span>)
              </span>
              {isRoomAdmin ? (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1">
                  👑 Room Admin
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700 text-[10px] font-semibold flex items-center gap-1">
                  👤 Member (Add & Settle)
                </span>
              )}
              <span className="text-zinc-500 hidden sm:inline">• Live sync active</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyRoomInvite}
                className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
              >
                {copiedRoomLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 text-[11px]">Copied Invite!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[11px]">Copy Invite Link</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setIsRoomManagerOpen(true)}
                className="text-[11px] text-zinc-400 hover:text-white underline cursor-pointer"
              >
                Room Details
              </button>
            </div>
          </div>
        ) : (
          <div className="glass-panel rounded-xl p-3.5 sm:p-4 border border-amber-900/40 bg-amber-950/15 text-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-zinc-300">
                <Radio className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
                <div>
                  <strong className="text-white block sm:inline">Working in Local Mode:</strong>{' '}
                  <span className="text-zinc-400">
                    Changes are saved only on this device.
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsRoomManagerOpen(true)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm shrink-0 ${
                  isBumblebee
                    ? 'bg-yellow-400 text-zinc-950 hover:bg-yellow-300'
                    : 'bg-rose-600 text-white hover:bg-rose-500'
                }`}
              >
                + Create or Join Shared Flat Room
              </button>
            </div>

            {discoveredRooms.length > 0 && (
              <div className="pt-2.5 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <span className="text-[11px] text-zinc-300 font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>Active Cloud Rooms Found:</span>
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {discoveredRooms.map((room) => (
                    <button
                      key={room.id}
                      onClick={() => {
                        saveActiveRoomId(room.id, room.name);
                        setActiveRoom({ roomId: room.id, roomName: room.name });
                      }}
                      className="px-3 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95"
                      title="1-tap join this cloud room"
                    >
                      <span>Join #{room.id}</span>
                      <span className="text-[10px] text-emerald-400/80 font-normal">
                        ({room.name} • {room.memberCount} flatmates)
                      </span>
                      <span>➜</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Content Dashboard */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 sm:py-8 space-y-6 sm:space-y-10 pb-28 sm:pb-12">
        {state.members.length === 0 ? (
          <div className="glass-panel rounded-2xl p-8 sm:p-12 text-center border border-white/10 space-y-4 max-w-xl mx-auto my-8">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto border shadow-lg ${
                isBumblebee
                  ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 shadow-yellow-950/40'
                  : 'bg-rose-500/10 text-rose-500 border-rose-500/20 shadow-rose-950/40'
              }`}
            >
              <Users className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white font-heading">
                Welcome to KharchaSplit
              </h2>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                No flatmates or expenses added yet. Add your flatmates to begin splitting shared expenses, or connect to a multiplayer flat room!
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
              <button
                onClick={() => setIsAddMemberOpen(true)}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-lg ${
                  isBumblebee
                    ? 'bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-zinc-950 shadow-yellow-950'
                    : 'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white shadow-rose-950'
                }`}
              >
                + Add Flatmates
              </button>
              <button
                onClick={() => setIsRoomManagerOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 text-xs font-semibold transition-all cursor-pointer"
              >
                + Create or Join Room
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Section 1: Minimized Settlement Cards with UPI & QR */}
            <section>
              <SettlementCards
                settlements={settlements}
                members={state.members}
                settledTransactions={state.settledTransactions}
                myMemberId={myMemberId}
                isRoomAdmin={isRoomAdmin}
                onOpenQr={handleOpenQr}
                onOpenMarkPaid={handleOpenMarkPaid}
                onDeleteSettledTransaction={handleDeleteSettledTransaction}
                onSetMyMemberId={handleSetMyMemberId}
              />
            </section>

            {/* Section 2: Spending by Category / Tag (Pie / Donut Chart & Breakdown) */}
            {state.expenses.length > 0 && (
              <section>
                <TagSpendingChart
                  expenses={state.expenses}
                  tags={allTags}
                  theme={theme}
                  selectedTagFilter={selectedTagFilter}
                  onSelectTagFilter={setSelectedTagFilter}
                />
              </section>
            )}

            {/* Section 3: Chronological Filterable Expense Feed */}
            <section>
              <ExpenseList
                expenses={filteredExpenses}
                members={state.members}
                onDeleteExpense={handleDeleteExpense}
                isRoomAdmin={isRoomAdmin}
              />
            </section>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 pt-6 pb-24 sm:py-6 text-center text-xs text-zinc-500 glass-panel-subtle mt-auto">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-heading font-bold text-white tracking-wider">
              KHARCHA
              <span className={isBumblebee ? 'text-yellow-400' : 'text-rose-500'}>
                SPLIT
              </span>
            </span>
            <span>•</span>
            <span>Zero Cloud Indian Flatmate Ledger</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-[11px] text-zinc-500">
              Split bills fairly • Settle instantly
            </div>
            <span>•</span>
            <button
              onClick={() => setIsAdminPortalOpen(true)}
              className="text-[11px] text-zinc-500 hover:text-rose-400 transition cursor-pointer flex items-center gap-1"
              title="Super-Admin Master Portal"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-zinc-600 hover:text-rose-400" />
              <span>Master Portal</span>
            </button>
          </div>
        </div>
      </footer>

      {/* MOBILE STICKY BOTTOM NAVIGATION BAR (Thumb Friendly on iOS & Android) - ONLY VISIBLE WHEN NO MODAL IS ACTIVE */}
      {!isAnyModalOpen && (
        <nav aria-label="Mobile Navigation" className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0d0d12]/95 backdrop-blur-xl border-t border-white/10 px-3 py-2 pb-safe shadow-[0_-4px_24px_rgba(0,0,0,0.7)]">
          <div className="flex items-center justify-around gap-1 max-w-md mx-auto">
            {/* 1. Flat Room */}
            <button
              onClick={() => setIsRoomManagerOpen(true)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
                activeRoom
                  ? 'text-emerald-400 hover:text-emerald-300'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span className="text-[10px] font-medium mt-0.5 truncate max-w-[64px]">
                {activeRoom ? `#${activeRoom.roomId}` : 'Rooms'}
              </span>
            </button>

            {/* 2. Flatmates */}
            <button
              onClick={() => setIsAddMemberOpen(true)}
              className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-zinc-400 hover:text-white transition-all cursor-pointer relative"
            >
              <Users className="w-4 h-4" />
              <span className="text-[10px] font-medium mt-0.5">
                Flatmates ({state.members.length})
              </span>
            </button>

            {/* 3. Center CTA: + Add Expense */}
            <button
              onClick={() => setIsAddExpenseOpen(true)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold shadow-lg transition-all cursor-pointer active:scale-95 ${
                isBumblebee
                  ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-zinc-950 shadow-yellow-950/60'
                  : 'bg-gradient-to-r from-rose-600 via-rose-700 to-amber-600 text-white shadow-rose-950/80'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Expense</span>
            </button>

            {/* 4. WhatsApp / Export Report */}
            <button
              onClick={() => setIsReportOpen(true)}
              className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-zinc-400 hover:text-white transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4 text-emerald-400" />
              <span className="text-[10px] font-medium mt-0.5">Report</span>
            </button>
          </div>
        </nav>
      )}

      {/* MODALS */}
      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        members={state.members}
        tags={allTags}
        onAddCustomTag={handleAddCustomTag}
        onSaveExpense={handleAddExpense}
      />

      <MemberManager
        isOpen={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
        members={state.members}
        netBalances={netBalances}
        onAddMember={handleAddMember}
        onDeleteMember={handleDeleteMember}
        onResetAllData={handleResetAllData}
        onLoadDemoData={handleLoadDemoData}
        isRoomAdmin={isRoomAdmin}
        myMemberId={myMemberId}
        onSetMyMemberId={handleSetMyMemberId}
        onTransferAdmin={handleTransferAdmin}
        adminMemberId={roomMeta?.adminMemberId}
        adminMemberName={roomMeta?.adminMemberName}
      />

      <QRCodeModal
        isOpen={qrState.isOpen}
        onClose={() => setQrState((prev) => ({ ...prev, isOpen: false }))}
        qrDataUrl={qrState.dataUrl}
        upiUri={qrState.upiUri}
        toName={qrState.toName}
        toUpiId={qrState.toUpiId}
        amount={qrState.amount}
      />

      <MarkPaidModal
        isOpen={!!markPaidSettlement}
        onClose={() => setMarkPaidSettlement(null)}
        settlement={markPaidSettlement}
        members={state.members}
        onConfirmSettlement={handleConfirmSettlement}
      />

      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        expenses={state.expenses}
        members={state.members}
        shareableUrl={liveShareUrl}
        theme={theme}
      />

      <ShareLedgerModal
        isOpen={isShareLedgerOpen}
        onClose={() => setIsShareLedgerOpen(false)}
        state={state}
        theme={theme}
        shareableUrl={liveShareUrl}
      />

      <RoomManagerModal
        isOpen={isRoomManagerOpen}
        onClose={() => setIsRoomManagerOpen(false)}
        activeRoom={activeRoom}
        setActiveRoom={setActiveRoom}
        state={state}
        theme={theme}
        isRoomAdmin={isRoomAdmin}
        roomMeta={roomMeta}
        myMemberId={myMemberId}
        onAdminClaimed={() => setAdminRefreshTick((t) => t + 1)}
        onTransferAdmin={handleTransferAdmin}
      />

      <AdminPortalModal
        isOpen={isAdminPortalOpen}
        onClose={() => {
          setIsAdminPortalOpen(false);
          if (window.location.hash.includes('#admin')) {
            window.history.replaceState(null, '', window.location.pathname);
          }
        }}
        theme={theme}
        onSwitchToRoom={(roomId, roomName) => {
          setActiveRoom({ roomId, roomName });
        }}
      />
    </div>
  );
}

export default App;
