import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Users, Radio, Copy, Check, ShieldCheck, Plus, FileText, Building2, Bell, User } from 'lucide-react';
import type {
  Member,
  Expense,
  Settlement,
  QuickTag,
  TimeFilter,
  AppState,
  AppTheme,
  UserProfile,
  AppNotification,
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
  clearActiveRoom,
  removeSavedRoom,
  clearRoomAdminKey,
  clearMyMemberId,
  subscribeToRoomState,
  subscribeToAllRooms,
  pushRoomState,
  getMyMemberId,
  setMyMemberId,
  isUserRoomAdmin,
  transferRoomAdmin,
  requestJoinRoom,
  subscribeToDeviceApproval,
  subscribeToJoinRequests,
  approveJoinRequest,
  rejectJoinRequest,
  claimRoomAdminKey,
} from './utils/firebase';
import type { RoomMeta, JoinRequest } from './utils/firebase';

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
import { JoinRequestModal } from './components/JoinRequestModal';
import { UserProfileModal } from './components/UserProfileModal';
import { TutorialModal } from './components/TutorialModal';
import { NotificationsModal } from './components/NotificationsModal';
import { RecurringExpensesModal } from './components/RecurringExpensesModal';
import { CsvImportModal } from './components/CsvImportModal';
import { getUserProfile, saveUserProfile } from './utils/userProfile';
import {
  getNotifications,
  saveNotifications,
  createNotification,
} from './utils/notifications';
import { usePwaInstall } from './utils/usePwaInstall';

export function App() {
  const { canInstall, triggerInstall } = usePwaInstall();
  const [state, setState] = useState<AppState>(loadInitialState);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('ALL');

  // Active Collaborative Flat Room
  const [activeRoom, setActiveRoom] = useState<{ roomId: string; roomName: string } | null>(
    getActiveRoomId
  );
  const [copiedRoomLink, setCopiedRoomLink] = useState(false);

  // Changeable Theme (Weeknd vs Purple vs System Auto - K4)
  const [theme, setTheme] = useState<AppTheme>(() => {
    try {
      const saved = localStorage.getItem('kharchasplit_theme');
      if (saved === 'weeknd' || saved === 'purple' || saved === 'system') {
        return saved as AppTheme;
      }
    } catch {
      // ignore
    }
    return 'weeknd';
  });

  // System Dark Mode Listener (K4)
  const [systemPrefersDark, setSystemPrefersDark] = useState(() => {
    try {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches);
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    } catch {
      // ignore
    }
  }, []);

  const effectiveTheme: 'weeknd' | 'purple' = useMemo(() => {
    if (theme === 'system') {
      return systemPrefersDark ? 'weeknd' : 'purple';
    }
    return theme;
  }, [theme, systemPrefersDark]);

  // Notifications State (K9)
  const [notifications, setNotifications] = useState<AppNotification[]>(getNotifications);
  const unreadNotificationsCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const addNotification = useCallback((title: string, message: string, type: AppNotification['type'] = 'INFO') => {
    const notif = createNotification(title, message, type);
    setNotifications((prev) => {
      const updated = [notif, ...prev].slice(0, 50);
      saveNotifications(updated);
      return updated;
    });
  }, []);

  // Modals state
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isShareLedgerOpen, setIsShareLedgerOpen] = useState(false);
  const [isRoomManagerOpen, setIsRoomManagerOpen] = useState(false);
  const [isAdminPortalOpen, setIsAdminPortalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isRecurringOpen, setIsRecurringOpen] = useState(false);
  const [isCsvImportOpen, setIsCsvImportOpen] = useState(false);

  // Filters (K2 Member Filter + Tag Filter)
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null);
  const [selectedMemberFilter, setSelectedMemberFilter] = useState<string | null>(null);

  // New-User Onboarding Tutorial Modal State (Only auto-shows to fresh first-time users)
  // Version check: 'v2' = saw the detailed tour. Anything else (including old 'true') triggers the new tour once.
  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(() => {
    try {
      const hasSeen = localStorage.getItem('kharchasplit_tutorial_seen');
      if (hasSeen === 'v2') return false;

      const hasData = localStorage.getItem('kharchasplit_v2_data');
      if (hasData) {
        try {
          const parsed = JSON.parse(hasData);
          if (parsed && (parsed.members?.length > 0 || parsed.expenses?.length > 0)) {
            // Existing users with real data: show the new tour once, don't suppress it
            return true;
          }
        } catch {
          // ignore
        }
      }
      return true;
    } catch {
      return false;
    }
  });

  // User Profile state
  const [userProfile, setUserProfile] = useState<UserProfile | null>(getUserProfile);

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
  }, [activeRoom]);

  const handleSetMyMemberId = (memberId: string, memberName: string) => {
    if (!activeRoom) return;
    setMyMemberId(activeRoom.roomId, memberId, memberName);
    setMyMemberIdState(memberId);
    setAdminRefreshTick((t) => t + 1);
  };

  // Authority check: Is current user the Room Admin?
  const isRoomAdmin = useMemo(() => {
    void adminRefreshTick;
    if (!activeRoom) return true;
    return isUserRoomAdmin(activeRoom.roomId, roomMeta, myMemberId);
  }, [activeRoom, roomMeta, myMemberId, adminRefreshTick]);

  // Active room ref to prevent stale closures
  const activeRoomRef = useRef(activeRoom);
  useEffect(() => {
    activeRoomRef.current = activeRoom;
  }, [activeRoom]);

  // Room Access Approval State
  const [deviceApprovalStatus, setDeviceApprovalStatus] = useState<
    'APPROVED' | 'PENDING' | 'REJECTED' | 'NONE'
  >(() => {
    const active = getActiveRoomId();
    if (!active) return 'APPROVED';
    if (isUserRoomAdmin(active.roomId)) return 'APPROVED';
    return 'PENDING';
  });
  const [pendingJoinRequests, setPendingJoinRequests] = useState<JoinRequest[]>([]);

  // Disconnect handler
  const handleRoomPurgedDisconnect = useCallback((roomId?: string) => {
    const targetId = roomId || activeRoomRef.current?.roomId;
    if (targetId) {
      removeSavedRoom(targetId);
      clearRoomAdminKey(targetId);
      clearMyMemberId(targetId);
    }
    clearActiveRoom();
    setActiveRoom(null);
    setRoomMeta(null);
    setDeviceApprovalStatus('APPROVED');
    setState(loadInitialState());
  }, []);

  // Monitor device approval status
  useEffect(() => {
    if (!activeRoom) {
      setDeviceApprovalStatus('APPROVED');
      setPendingJoinRequests([]);
      return;
    }

    if (isRoomAdmin) {
      setDeviceApprovalStatus('APPROVED');
      const unsub = subscribeToJoinRequests(activeRoom.roomId, (reqs) => {
        setPendingJoinRequests(reqs.filter((r) => r.status === 'PENDING'));
      });
      return () => {
        if (unsub) unsub();
      };
    }

    const unsubApproval = subscribeToDeviceApproval(
      activeRoom.roomId,
      (status) => {
        setDeviceApprovalStatus(status);
      },
      () => {
        handleRoomPurgedDisconnect(activeRoom.roomId);
      }
    );

    return () => {
      if (unsubApproval) unsubApproval();
    };
  }, [activeRoom, isRoomAdmin, handleRoomPurgedDisconnect]);

  // Real-time bidirectional room synchronization with Firestore
  useEffect(() => {
    if (!activeRoom) return;

    const unsub = subscribeToRoomState(
      activeRoom.roomId,
      (cloudState, meta) => {
        if (cloudState) {
          setState(cloudState);
        }
        if (meta) {
          setRoomMeta(meta);
        }
      },
      () => {
        handleRoomPurgedDisconnect(activeRoom.roomId);
      }
    );

    return () => {
      if (unsub) unsub();
    };
  }, [activeRoom, handleRoomPurgedDisconnect]);

  // Active Public Cloud Rooms Discovery
  const [discoveredRooms, setDiscoveredRooms] = useState<
    { id: string; name: string; memberCount: number; updatedAt: string }[]
  >([]);

  useEffect(() => {
    const unsub = subscribeToAllRooms(
      (allRooms) => {
        const list = Object.entries(allRooms).map(([id, r]) => {
          const members = r.state?.members || [];
          return {
            id,
            name: r.meta?.name || `Flat ${id}`,
            memberCount: members.length,
            updatedAt: r.meta?.updatedAt || new Date().toISOString(),
          };
        });
        const filtered = list.filter((r) => !activeRoom || r.id !== activeRoom.roomId);
        setDiscoveredRooms(filtered);
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

  // Combined Tags
  const allTags: QuickTag[] = [...DEFAULT_INDIAN_TAGS, ...state.customTags];

  // Recurring expenses list (K5)
  const recurringExpenses = useMemo(() => {
    return state.expenses.filter((e) => e.isRecurring);
  }, [state.expenses]);

  // Filtered Expenses by Time Filter, Selected Tag Filter & Member Filter (K2)
  const [appMountTime] = useState(() => Date.now());

  const filteredExpenses = useMemo(() => {
    const now = new Date(appMountTime);
    const curMonth = now.getMonth();
    const curYear = now.getFullYear();
    const oneWeekAgoMs = appMountTime - 7 * 24 * 60 * 60 * 1000;

    return state.expenses.filter((e) => {
      // 1. Tag filter
      if (selectedTagFilter && e.tag !== selectedTagFilter) {
        return false;
      }

      // 2. Member filter (K2: filter expenses where member is payer or recipient)
      if (selectedMemberFilter) {
        const isPayer = e.paidById === selectedMemberFilter;
        const isParticipant = e.splits.some((s) => s.memberId === selectedMemberFilter);
        if (!isPayer && !isParticipant) return false;
      }

      // 3. Time filter
      if (timeFilter === 'ALL') return true;
      const expDate = new Date(e.date);

      if (timeFilter === 'THIS_MONTH') {
        return (
          expDate.getMonth() === curMonth &&
          expDate.getFullYear() === curYear
        );
      }

      if (timeFilter === 'THIS_WEEK') {
        return expDate.getTime() >= oneWeekAgoMs;
      }

      return true;
    });
  }, [state.expenses, selectedTagFilter, selectedMemberFilter, timeFilter, appMountTime]);

  // Active Filter Description (for Member or Tag)
  const activeFilter = useMemo<{ type: 'MEMBER' | 'TAG'; label: string } | null>(() => {
    if (selectedMemberFilter) {
      const member = state.members.find((m) => m.id === selectedMemberFilter);
      return { type: 'MEMBER', label: member ? member.name : 'Selected Flatmate' };
    }
    if (selectedTagFilter) {
      return { type: 'TAG', label: selectedTagFilter };
    }
    return null;
  }, [selectedMemberFilter, selectedTagFilter, state.members]);

  const handleClearFilter = useCallback(() => {
    setSelectedMemberFilter(null);
    setSelectedTagFilter(null);
  }, []);

  // Total Group Spend for selected period (safely handles legacy or custom split values)
  const totalGroupSpend = useMemo(() => {
    const expensesToSum = activeFilter ? filteredExpenses : state.expenses.filter((e) => {
      if (timeFilter === 'ALL') return true;
      const expDate = new Date(e.date);
      const now = new Date(appMountTime);
      if (timeFilter === 'THIS_MONTH') {
        return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
      }
      if (timeFilter === 'THIS_WEEK') {
        const oneWeekAgoMs = appMountTime - 7 * 24 * 60 * 60 * 1000;
        return expDate.getTime() >= oneWeekAgoMs;
      }
      return true;
    });

    return expensesToSum.reduce((sum, e) => {
      const amt = typeof e.totalAmount === 'number' && !isNaN(e.totalAmount) && e.totalAmount > 0
        ? e.totalAmount
        : (e.splits && e.splits.length > 0
            ? e.splits.reduce((s, sp) => s + (Number(sp.amount) || 0), 0)
            : Number(e.totalAmount) || 0);
      return sum + amt;
    }, 0);
  }, [activeFilter, filteredExpenses, state.expenses, timeFilter, appMountTime]);

  // Live Balances & Minimized Settlements
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

  // Check if any modal is currently open
  const isAnyModalOpen =
    isAddExpenseOpen ||
    isAddMemberOpen ||
    isProfileOpen ||
    isTutorialOpen ||
    isReportOpen ||
    isShareLedgerOpen ||
    isRoomManagerOpen ||
    isAdminPortalOpen ||
    isNotificationsOpen ||
    isRecurringOpen ||
    isCsvImportOpen ||
    qrState.isOpen ||
    !!markPaidSettlement;

  // Handlers
  const handleSaveUserProfile = (updatedProfile: UserProfile, syncWithFlatmateId?: string) => {
    setUserProfile(updatedProfile);
    saveUserProfile(updatedProfile);

    if (syncWithFlatmateId) {
      const updatedMembers = state.members.map((m) => {
        if (m.id === syncWithFlatmateId) {
          return {
            ...m,
            name: updatedProfile.name,
            upiId: updatedProfile.upiId || m.upiId,
            phone: updatedProfile.phone || m.phone,
            avatarColor: updatedProfile.avatarColor,
          };
        }
        return m;
      });

      const updated = {
        ...state,
        members: updatedMembers,
      };
      setState(updated);
      syncToCloud(updated);
    }
  };

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
    addNotification('Flatmate Added', `${newMember.name} joined the flat ledger`, 'MEMBER');
  };

  const handleDeleteMember = (id: string) => {
    if (activeRoom && !isRoomAdmin) {
      alert('Authority restricted: Only the Room Admin can remove flatmates.');
      return;
    }
    const memberName = state.members.find((m) => m.id === id)?.name || 'Flatmate';
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
    addNotification('Flatmate Removed', `${memberName} was removed from the flat`, 'MEMBER');
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
    addNotification('Ledger Reset', 'The entire flat ledger was cleared', 'INFO');
  };

  const handleLoadDemoData = () => {
    setState(DEMO_STATE);
    syncToCloud(DEMO_STATE);
    addNotification('Demo Loaded', 'Loaded standard demo data', 'INFO');
  };

  // Add or Edit Expense Handler (K1)
  const handleSaveExpense = (newExpenseData: Omit<Expense, 'id'>, existingId?: string) => {
    if (existingId) {
      // Edit mode (K1)
      const updatedExpenses = state.expenses.map((e) => {
        if (e.id === existingId) {
          return {
            ...newExpenseData,
            id: existingId,
          };
        }
        return e;
      });
      const updated = {
        ...state,
        expenses: updatedExpenses,
      };
      setState(updated);
      syncToCloud(updated);
      addNotification(
        'Expense Updated',
        `"${newExpenseData.title}" was updated to ₹${newExpenseData.totalAmount}`,
        'EXPENSE'
      );
    } else {
      // New expense mode
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
      addNotification(
        'Expense Recorded',
        `Added "${newExpense.title}" (₹${newExpense.totalAmount})`,
        'EXPENSE'
      );
    }
    setEditingExpense(null);
  };

  const handleDeleteExpense = (id: string) => {
    if (activeRoom && !isRoomAdmin) {
      alert('Authority restricted: Only the Room Admin can delete expenses.');
      return;
    }
    const exp = state.expenses.find((e) => e.id === id);
    const updated = {
      ...state,
      expenses: state.expenses.filter((e) => e.id !== id),
    };
    setState(updated);
    syncToCloud(updated);
    addNotification('Expense Deleted', `Deleted "${exp?.title || 'Expense'}"`, 'EXPENSE');
  };

  // 1-Tap Log Recurring Instance (K5)
  const handleLogRecurringInstance = (recurringExp: Expense) => {
    const newInstance: Expense = {
      ...recurringExp,
      id: `exp-${Date.now()}`,
      date: new Date().toISOString(),
      isRecurring: false, // instance is not recurring itself
    };
    const updated = {
      ...state,
      expenses: [newInstance, ...state.expenses],
    };
    setState(updated);
    syncToCloud(updated);
    addNotification(
      'Recurring Bill Logged',
      `Logged monthly instance for "${recurringExp.title}" (₹${recurringExp.totalAmount})`,
      'EXPENSE'
    );
    setIsRecurringOpen(false);
  };

  // Bulk CSV Import (K8)
  const handleImportCsv = (importedExpenses: Omit<Expense, 'id'>[]) => {
    const newExpenses: Expense[] = importedExpenses.map((exp, idx) => ({
      ...exp,
      id: `exp-${Date.now()}-${idx}`,
    }));
    const updated = {
      ...state,
      expenses: [...newExpenses, ...state.expenses],
    };
    setState(updated);
    syncToCloud(updated);
    addNotification(
      'CSV Imported',
      `Successfully added ${newExpenses.length} expenses from CSV`,
      'EXPENSE'
    );
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

  // Confirm Settlement (K3: Records settlement in history log)
  const handleConfirmSettlement = (settlement: Settlement) => {
    const currentBalances = getMemberNetBalances(
      state.members,
      state.expenses,
      state.settledTransactions
    );

    const debtorDebt = Math.max(0, -(currentBalances[settlement.fromMemberId] || 0));
    const creditorCredit = Math.max(0, currentBalances[settlement.toMemberId] || 0);

    if (debtorDebt < 0.01 || creditorCredit < 0.01) {
      alert('Notice: This payment is already fully balanced!');
      return;
    }

    const cappedAmount = Math.min(settlement.amount, debtorDebt, creditorCredit);
    const roundedAmount = Math.round(cappedAmount * 100) / 100;

    if (roundedAmount < 0.01) return;

    const newSettledRecord: Settlement = {
      ...settlement,
      id: `settle-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      amount: roundedAmount,
      isSettled: true,
      settledAt: new Date().toISOString(),
    };

    const fromName = state.members.find((m) => m.id === settlement.fromMemberId)?.name || 'Someone';
    const toName = state.members.find((m) => m.id === settlement.toMemberId)?.name || 'Someone';

    const updated = {
      ...state,
      settledTransactions: [...state.settledTransactions, newSettledRecord],
    };
    setState(updated);
    syncToCloud(updated);
    addNotification(
      'Settlement Confirmed',
      `${fromName} paid ₹${roundedAmount} to ${toName}`,
      'SETTLEMENT'
    );
  };

  // Delete / Undo a settled payment
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
    addNotification('Settlement Undone', 'A settlement was undone and balances restored', 'SETTLEMENT');
  };

  // Transfer Admin Role
  const handleTransferAdmin = async (newMemberId: string, newMemberName: string) => {
    if (!activeRoom || !isRoomAdmin) return;
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
      addNotification('Admin Transferred', `Room admin rights were given to ${newMemberName}`, 'ROOM');
    }
  };

  // Join Requests Handlers
  const handleRequestJoin = async (name: string, phone?: string) => {
    if (!activeRoom) return;
    await requestJoinRoom(activeRoom.roomId, name, phone);
    setDeviceApprovalStatus('PENDING');
  };

  const handleApproveJoinRequest = async (
    requestId: string,
    deviceId: string,
    name: string
  ) => {
    if (!activeRoom) return;
    await approveJoinRequest(activeRoom.roomId, requestId, deviceId, name);

    if (!state.members.some((m) => m.name.toLowerCase() === name.toLowerCase())) {
      const AVATAR_COLORS = ['#ff003b', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#10b981'];
      handleAddMember({
        name,
        upiId: `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}@upi`,
        avatarColor: AVATAR_COLORS[state.members.length % AVATAR_COLORS.length],
      });
    }
  };

  const handleRejectJoinRequest = async (requestId: string) => {
    if (!activeRoom) return;
    await rejectJoinRequest(activeRoom.roomId, requestId);
  };

  const handleClaimAdminFromModal = async (pin: string) => {
    if (!activeRoom) return false;
    const ok = await claimRoomAdminKey(activeRoom.roomId, pin);
    if (ok) {
      setAdminRefreshTick((t) => t + 1);
      setDeviceApprovalStatus('APPROVED');
      return true;
    }
    return false;
  };

  // Toggle Theme: Cycles Crimson -> Purple -> System (K4)
  const toggleTheme = () => {
    setTheme((prev) => {
      if (prev === 'weeknd') return 'purple';
      if (prev === 'purple') return 'system';
      return 'weeknd';
    });
  };

  const handleCopyRoomInvite = () => {
    if (!activeRoom) return;
    const url = `${window.location.origin}${window.location.pathname}#room=${activeRoom.roomId}`;
    navigator.clipboard.writeText(url);
    setCopiedRoomLink(true);
    setTimeout(() => setCopiedRoomLink(false), 2500);
  };

  const liveShareUrl = compressStateToUrl(state);
  const isPurple = effectiveTheme === 'purple';

  return (
    <div
      className={`min-h-screen bg-[#08080a] bg-app-grid text-zinc-100 flex flex-col font-sans theme-${effectiveTheme}`}
    >
      {/* Header with theme switcher, stats & actions */}
      <Header
        timeFilter={timeFilter}
        setTimeFilter={setTimeFilter}
        onOpenAddExpense={() => {
          setEditingExpense(null);
          setIsAddExpenseOpen(true);
        }}
        onOpenAddMember={() => setIsAddMemberOpen(true)}
        onOpenReport={() => setIsReportOpen(true)}
        onOpenShareLedger={() => setIsShareLedgerOpen(true)}
        onOpenRoomManager={() => setIsRoomManagerOpen(true)}
        onOpenRecurringModal={() => setIsRecurringOpen(true)}
        onOpenCsvImport={() => setIsCsvImportOpen(true)}
        canInstall={canInstall}
        onInstallApp={triggerInstall}
        activeRoom={activeRoom}
        totalGroupSpend={totalGroupSpend}
        activeMemberCount={state.members.length}
        theme={theme}
        onToggleTheme={toggleTheme}
        pendingRequestsCount={pendingJoinRequests.length}
        unreadNotificationsCount={unreadNotificationsCount}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        userProfile={userProfile}
        onOpenProfile={() => setIsProfileOpen(true)}
        activeFilter={activeFilter}
        onClearFilter={handleClearFilter}
      />

      {/* Admin Alert: Pending Join Requests Banner */}
      {isRoomAdmin && pendingJoinRequests.length > 0 && activeRoom && (
        <div className="max-w-6xl w-full mx-auto px-4 pt-3">
          <div className="p-3 rounded-xl bg-amber-950/70 border border-amber-500/60 flex items-center justify-between gap-3 shadow-lg animate-pulse">
            <div className="flex items-center gap-2.5 text-xs text-amber-200">
              <Bell className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>{pendingJoinRequests.length} flatmate{pendingJoinRequests.length > 1 ? 's' : ''}</strong> waiting for your approval to enter <strong>{activeRoom.roomName}</strong>!
              </span>
            </div>
            <button
              onClick={() => setIsRoomManagerOpen(true)}
              className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shrink-0 cursor-pointer"
            >
              Review Requests
            </button>
          </div>
        </div>
      )}

      {/* Subheader: Active Room indicator */}
      <div className="max-w-6xl w-full mx-auto px-4 pt-3">
        {activeRoom ? (
          <div className="glass-panel rounded-xl p-3 sm:p-3.5 border border-emerald-900/50 bg-emerald-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center gap-2 text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>
                Live Cloud Room:{' '}
                <strong className="text-white font-heading">{activeRoom.roomName}</strong>{' '}
                <span className="font-mono text-zinc-400 font-bold">#{activeRoom.roomId}</span>
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
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
          <div className="glass-panel rounded-xl p-3 sm:p-4 border border-amber-900/40 bg-amber-950/15 text-xs space-y-2.5">
            <div className="flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2 text-zinc-300 min-w-0">
                <Radio className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
                <div className="text-[11px] sm:text-xs truncate">
                  <strong className="text-white">Local Mode:</strong>{' '}
                  <span className="text-zinc-400 hidden xs:inline">
                    Changes are saved only on this device.
                  </span>
                  <span className="text-zinc-400 xs:hidden">
                    Saved on device
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsRoomManagerOpen(true)}
                className={`px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer shadow-sm shrink-0 whitespace-nowrap ${
                  isPurple
                    ? 'bg-purple-600 text-white hover:bg-purple-500 shadow-purple-950/50'
                    : 'bg-rose-600 text-white hover:bg-rose-500'
                }`}
              >
                <span className="hidden sm:inline">+ Create or Join Shared Flat Room</span>
                <span className="sm:hidden">+ Sync Online ⚡</span>
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
                isPurple
                  ? 'bg-purple-500/10 text-purple-400 border-purple-500/20 shadow-purple-950/40'
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
                  isPurple
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-950'
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
            {/* Section 1: Minimized Settlement Cards with UPI & QR & Settlement History (K3) */}
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
                theme={effectiveTheme}
              />
            </section>

            {/* Section 2: Spending by Category & Per Flatmate Breakdown (K6) */}
            {state.expenses.length > 0 && (
              <section>
                <TagSpendingChart
                  expenses={state.expenses}
                  tags={allTags}
                  members={state.members}
                  theme={effectiveTheme}
                  selectedTagFilter={selectedTagFilter}
                  onSelectTagFilter={setSelectedTagFilter}
                />
              </section>
            )}

            {/* Section 3: Chronological Filterable Expense Feed (K1, K2, K5, K7) */}
            <section>
              <ExpenseList
                expenses={filteredExpenses}
                members={state.members}
                onDeleteExpense={handleDeleteExpense}
                onEditExpense={(exp) => {
                  setEditingExpense(exp);
                  setIsAddExpenseOpen(true);
                }}
                selectedMemberId={selectedMemberFilter}
                onSelectMemberId={setSelectedMemberFilter}
                isRoomAdmin={isRoomAdmin}
                theme={effectiveTheme}
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
              <span className={isPurple ? 'text-purple-400' : 'text-rose-500'}>
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

      {/* Mobile Sticky Navigation */}
      {!isAnyModalOpen && (
        <nav
          aria-label="Mobile Navigation"
          className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0d0d12]/95 backdrop-blur-xl border-t border-white/10 px-3 py-2 pb-safe shadow-[0_-4px_24px_rgba(0,0,0,0.7)]"
        >
          <div className="flex items-center justify-around gap-1 max-w-md mx-auto">
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

            <button
              onClick={() => setIsAddMemberOpen(true)}
              className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-zinc-400 hover:text-white transition-all cursor-pointer relative"
            >
              <Users className="w-4 h-4" />
              <span className="text-[10px] font-medium mt-0.5">
                Flatmates ({state.members.length})
              </span>
            </button>

            <button
              onClick={() => {
                setEditingExpense(null);
                setIsAddExpenseOpen(true);
              }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold shadow-lg transition-all cursor-pointer active:scale-95 ${
                isPurple
                  ? 'bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-600 text-white shadow-purple-950/80'
                  : 'bg-gradient-to-r from-rose-600 via-rose-700 to-amber-600 text-white shadow-rose-950/80'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Expense</span>
            </button>

            <button
              onClick={() => setIsReportOpen(true)}
              className="flex flex-col items-center justify-center py-1 px-2 rounded-xl text-zinc-400 hover:text-white transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4 text-emerald-400" />
              <span className="text-[10px] font-medium mt-0.5">Report</span>
            </button>

            <button
              onClick={() => setIsProfileOpen(true)}
              className="flex flex-col items-center justify-center py-1 px-2 rounded-xl text-zinc-400 hover:text-white transition-all cursor-pointer"
            >
              {userProfile?.name ? (
                <div
                  className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-sm"
                  style={{ backgroundColor: userProfile.avatarColor || '#ff003b' }}
                >
                  {userProfile.name.charAt(0).toUpperCase()}
                </div>
              ) : (
                <User className="w-4 h-4 text-zinc-400" />
              )}
              <span className="text-[10px] font-medium mt-0.5 truncate max-w-[55px]">
                {userProfile?.name ? userProfile.name.split(' ')[0] : 'Profile'}
              </span>
            </button>
          </div>
        </nav>
      )}

      {/* MODALS */}
      {/* 1. Add / Edit Expense Modal (K1, K5) */}
      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => {
          setIsAddExpenseOpen(false);
          setEditingExpense(null);
        }}
        members={state.members}
        tags={allTags}
        onAddCustomTag={handleAddCustomTag}
        onSaveExpense={handleSaveExpense}
        editingExpense={editingExpense}
        theme={effectiveTheme}
      />

      {/* 2. Flatmate Manager */}
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
        theme={effectiveTheme}
      />

      {/* 3. Notifications Modal (K9) */}
      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkAllAsRead={() => {
          const marked = notifications.map((n) => ({ ...n, read: true }));
          setNotifications(marked);
          saveNotifications(marked);
        }}
        onClearAll={() => {
          setNotifications([]);
          saveNotifications([]);
        }}
        theme={effectiveTheme}
      />

      {/* 4. Recurring Bills Modal (K5) */}
      <RecurringExpensesModal
        isOpen={isRecurringOpen}
        onClose={() => setIsRecurringOpen(false)}
        recurringExpenses={recurringExpenses}
        members={state.members}
        onLogRecurringInstance={handleLogRecurringInstance}
        onOpenAddExpense={() => {
          setEditingExpense(null);
          setIsAddExpenseOpen(true);
        }}
        theme={effectiveTheme}
      />

      {/* 5. Bulk CSV Import Modal (K8) */}
      <CsvImportModal
        isOpen={isCsvImportOpen}
        onClose={() => setIsCsvImportOpen(false)}
        members={state.members}
        tags={allTags}
        onImportExpenses={handleImportCsv}
        theme={effectiveTheme}
      />

      {/* 6. UPI QR Modal */}
      <QRCodeModal
        isOpen={qrState.isOpen}
        onClose={() => setQrState((prev) => ({ ...prev, isOpen: false }))}
        qrDataUrl={qrState.dataUrl}
        upiUri={qrState.upiUri}
        toName={qrState.toName}
        toUpiId={qrState.toUpiId}
        amount={qrState.amount}
        theme={effectiveTheme}
      />

      {/* 7. Mark Paid Settlement Modal (K3) */}
      <MarkPaidModal
        isOpen={!!markPaidSettlement}
        onClose={() => setMarkPaidSettlement(null)}
        settlement={markPaidSettlement}
        members={state.members}
        onConfirmSettlement={handleConfirmSettlement}
        theme={effectiveTheme}
      />

      {/* 8. WhatsApp Report Modal */}
      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        expenses={state.expenses}
        members={state.members}
        shareableUrl={liveShareUrl}
        theme={effectiveTheme}
      />

      {/* 9. Share Ledger / PDF Modal */}
      <ShareLedgerModal
        isOpen={isShareLedgerOpen}
        onClose={() => setIsShareLedgerOpen(false)}
        state={state}
        theme={effectiveTheme}
        shareableUrl={liveShareUrl}
      />

      {/* 10. Room Manager Modal */}
      <RoomManagerModal
        isOpen={isRoomManagerOpen}
        onClose={() => setIsRoomManagerOpen(false)}
        activeRoom={activeRoom}
        setActiveRoom={setActiveRoom}
        state={state}
        theme={effectiveTheme}
        isRoomAdmin={isRoomAdmin}
        roomMeta={roomMeta}
        myMemberId={myMemberId}
        pendingRequests={pendingJoinRequests}
        onAdminClaimed={() => setAdminRefreshTick((t) => t + 1)}
        onTransferAdmin={handleTransferAdmin}
        onApproveJoinRequest={handleApproveJoinRequest}
        onRejectJoinRequest={handleRejectJoinRequest}
      />

      {/* 11. User Profile Modal */}
      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        profile={userProfile}
        onSaveProfile={handleSaveUserProfile}
        activeRoom={activeRoom}
        members={state.members}
        myMemberId={myMemberId}
        onSetMyMemberId={handleSetMyMemberId}
        isRoomAdmin={isRoomAdmin}
        netBalances={netBalances}
        expenses={state.expenses}
        theme={effectiveTheme}
        onOpenTutorial={() => setIsTutorialOpen(true)}
      />

      {/* 12. Onboarding Tutorial */}
      <TutorialModal
        isOpen={isTutorialOpen}
        onClose={() => {
          try { localStorage.setItem('kharchasplit_tutorial_seen', 'v2'); } catch { /* ignore */ }
          setIsTutorialOpen(false);
        }}
        onLoadDemo={() => {
          setState(DEMO_STATE);
          saveStateToLocalStorage(DEMO_STATE);
          try { localStorage.setItem('kharchasplit_tutorial_seen', 'v2'); } catch { /* ignore */ }
          setIsTutorialOpen(false);
        }}
        theme={effectiveTheme}
      />

      {/* 13. Knock-to-Join Admin Modal */}
      {activeRoom && !isRoomAdmin && deviceApprovalStatus !== 'APPROVED' && (
        <JoinRequestModal
          isOpen={true}
          roomId={activeRoom.roomId}
          roomName={activeRoom.roomName}
          roomMeta={roomMeta}
          status={deviceApprovalStatus}
          onRequestJoin={handleRequestJoin}
          onCancel={() => {
            clearActiveRoom();
            setActiveRoom(null);
            setDeviceApprovalStatus('APPROVED');
          }}
          onClaimAdmin={handleClaimAdminFromModal}
          theme={effectiveTheme}
        />
      )}

      {/* 14. Super-Admin Portal */}
      <AdminPortalModal
        isOpen={isAdminPortalOpen}
        onClose={() => {
          setIsAdminPortalOpen(false);
          if (window.location.hash.includes('#admin')) {
            window.history.replaceState(null, '', window.location.pathname);
          }
        }}
        theme={effectiveTheme}
        onSwitchToRoom={(roomId, roomName) => {
          setActiveRoom({ roomId, roomName });
        }}
        onRoomPurged={(purgedId) => {
          if (activeRoom && activeRoom.roomId.toUpperCase() === purgedId.toUpperCase()) {
            handleRoomPurgedDisconnect(purgedId);
          }
        }}
      />
    </div>
  );
}

export default App;
