import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Search,
  Trash2,
  ExternalLink,
  Users,
  Receipt,
  IndianRupee,
  Layers,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import type { AppTheme } from '../types';
import {
  subscribeToAllRooms,
  deleteRoom,
  deleteExpenseFromRoom,
  deleteMemberFromRoom,
  getMasterCredentials,
  saveMasterCredentials,
  getFirebaseDb,
  saveActiveRoomId,
} from '../utils/firebase';
import type { FirebaseRoomData } from '../utils/firebase';

interface AdminPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: AppTheme;
  onSwitchToRoom: (roomId: string, roomName: string) => void;
}

export const AdminPortalModal: React.FC<AdminPortalModalProps> = ({
  isOpen,
  onClose,
  theme,
  onSwitchToRoom,
}) => {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('kharchasplit_master_auth') === 'true';
  });
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');

  // Change credentials state
  const [showChangeCreds, setShowChangeCreds] = useState(false);
  const [newMasterId, setNewMasterId] = useState('');
  const [newMasterPass, setNewMasterPass] = useState('');
  const [credsSuccess, setCredsSuccess] = useState('');

  // Rooms data state
  const [rooms, setRooms] = useState<Record<string, FirebaseRoomData>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [inspectorTab, setInspectorTab] = useState<'EXPENSES' | 'MEMBERS' | 'SETTLEMENTS'>('EXPENSES');
  const [actionMsg, setActionMsg] = useState<{ text: string; isError?: boolean } | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const isBumblebee = theme === 'bumblebee';
  const hasDb = !!getFirebaseDb();

  // Listen to all rooms when authenticated and modal is open
  useEffect(() => {
    if (!isOpen || !isAuthenticated) return;

    const unsubscribe = subscribeToAllRooms(
      (data) => {
        setRooms(data);
      },
      (err) => {
        setActionMsg({ text: `Failed to load cloud rooms: ${err.message}`, isError: true });
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isOpen, isAuthenticated]);

  if (!isOpen) return null;

  const showNotification = (text: string, isError = false) => {
    setActionMsg({ text, isError });
    setTimeout(() => setActionMsg(null), 3500);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const creds = getMasterCredentials();

    if (
      loginId.trim().toLowerCase() === creds.id.trim().toLowerCase() &&
      password.trim() === creds.pass.trim()
    ) {
      setIsAuthenticated(true);
      sessionStorage.setItem('kharchasplit_master_auth', 'true');
      setAuthError('');
      setLoginId('');
      setPassword('');
      showNotification('Master Super-Admin Access Granted 🛡️');
    } else {
      setAuthError('Invalid Master Login ID or Password. Access denied.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('kharchasplit_master_auth');
    setSelectedRoomId(null);
    setAuthError('');
  };

  const handleSaveNewCreds = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMasterId.trim() || newMasterPass.trim().length < 4) {
      showNotification('ID must not be empty and Password must be at least 4 characters.', true);
      return;
    }
    saveMasterCredentials(newMasterId.trim(), newMasterPass.trim());
    setCredsSuccess('Master credentials updated successfully!');
    setTimeout(() => {
      setCredsSuccess('');
      setShowChangeCreds(false);
      setNewMasterId('');
      setNewMasterPass('');
    }, 2000);
  };

  // Danger: Delete Room
  const handleDeleteRoom = async (roomId: string, roomName: string) => {
    const confirmText = prompt(
      `⚠️ CRITICAL ACTION: Are you sure you want to permanently delete room "${roomName}" (#${roomId}) from the cloud database?\n\nType DELETE to confirm:`
    );

    if (confirmText !== 'DELETE') {
      showNotification('Deletion cancelled.', true);
      return;
    }

    setIsDeleting(roomId);
    const success = await deleteRoom(roomId);
    setIsDeleting(null);

    if (success) {
      showNotification(`Room #${roomId} was permanently purged from the cloud.`);
      if (selectedRoomId === roomId) {
        setSelectedRoomId(null);
      }
    } else {
      showNotification(`Failed to delete room #${roomId}. Check cloud permissions.`, true);
    }
  };

  // Danger: Delete Expense from Room
  const handleDeleteExpense = async (roomId: string, expenseId: string, title: string) => {
    if (!window.confirm(`Delete expense "${title}" from room #${roomId}?`)) return;

    const success = await deleteExpenseFromRoom(roomId, expenseId);
    if (success) {
      showNotification(`Expense "${title}" deleted from room #${roomId}`);
    } else {
      showNotification(`Failed to delete expense.`, true);
    }
  };

  // Danger: Delete Member from Room
  const handleDeleteMember = async (roomId: string, memberId: string, memberName: string) => {
    if (
      !window.confirm(
        `Remove member "${memberName}" from room #${roomId}? This will remove them from the room ledger.`
      )
    )
      return;

    const success = await deleteMemberFromRoom(roomId, memberId);
    if (success) {
      showNotification(`Member "${memberName}" removed from room #${roomId}`);
    } else {
      showNotification(`Failed to remove member.`, true);
    }
  };

  // Jump into Room
  const handleJumpIntoRoom = (roomId: string, roomName: string) => {
    saveActiveRoomId(roomId, roomName);
    onSwitchToRoom(roomId, roomName);
    onClose();
  };

  // Compute Platform Stats
  const roomEntries = Object.entries(rooms);
  const totalRooms = roomEntries.length;

  let totalPlatformVolume = 0;
  let totalMembersCount = 0;
  let totalExpensesCount = 0;

  roomEntries.forEach(([, roomData]) => {
    const expenses = roomData?.state?.expenses || [];
    const members = roomData?.state?.members || [];
    totalExpensesCount += expenses.length;
    totalMembersCount += members.length;
    expenses.forEach((e) => {
      totalPlatformVolume += Number(e.totalAmount) || 0;
    });
  });

  // Filtered Rooms for search
  const filteredRooms = roomEntries.filter(([id, data]) => {
    const q = searchQuery.toLowerCase();
    const name = data?.meta?.name || '';
    return id.toLowerCase().includes(q) || name.toLowerCase().includes(q);
  });

  const selectedRoomData = selectedRoomId ? rooms[selectedRoomId] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
      <div className="glass-panel w-full max-w-4xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* MODAL HEADER */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span
              className={`p-2 rounded-xl flex items-center justify-center ${
                isBumblebee ? 'bg-yellow-400/10 text-yellow-400' : 'bg-rose-500/10 text-rose-500'
              }`}
            >
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white font-heading">
                  Super Admin Master Portal
                </h2>
                <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full bg-rose-950/80 text-rose-300 border border-rose-800">
                  God Mode
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Global platform oversight, real-time room analytics & complete ledger control
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

        {/* NOTIFICATION BANNER */}
        {actionMsg && (
          <div
            className={`px-6 py-2.5 text-xs flex items-center gap-2 border-b ${
              actionMsg.isError
                ? 'bg-rose-950 border-rose-800 text-rose-200'
                : 'bg-emerald-950 border-emerald-800 text-emerald-200'
            }`}
          >
            {actionMsg.isError ? (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            ) : (
              <CheckCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{actionMsg.text}</span>
          </div>
        )}

        {/* VIEW 1: MASTER LOGIN SCREEN */}
        {!isAuthenticated ? (
          <div className="p-8 sm:p-12 overflow-y-auto flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-950 border border-white/10 flex items-center justify-center shadow-2xl mb-4">
              <Lock className={`w-8 h-8 ${isBumblebee ? 'text-yellow-400' : 'text-rose-500'}`} />
            </div>

            <div className="max-w-md space-y-1 mb-6">
              <h3 className="text-xl font-bold text-white font-heading">
                Master Authentication Required
              </h3>
              <p className="text-xs text-zinc-400">
                This portal provides unrestricted access to all created rooms and balances across the network. Enter your Super-Admin credentials to proceed.
              </p>
            </div>

            <form onSubmit={handleLogin} className="w-full max-w-sm space-y-3.5">
              <div>
                <label className="block text-left text-xs font-semibold text-zinc-300 mb-1">
                  Master Login ID
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={loginId}
                    onChange={(e) => {
                      setLoginId(e.target.value);
                      setAuthError('');
                    }}
                    placeholder="Enter Master ID"
                    autoFocus
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs font-mono focus:outline-none focus:border-rose-500"
                  />
                  <ShieldAlert className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-left text-xs font-semibold text-zinc-300 mb-1">
                  Master Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setAuthError('');
                    }}
                    placeholder="Enter Master Password"
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs font-mono focus:outline-none focus:border-rose-500"
                  />
                  <KeyRound className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {authError && (
                <div className="p-2.5 rounded-lg text-xs bg-rose-950/80 border border-rose-800 text-rose-300 text-left flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="submit"
                className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg ${
                  isBumblebee
                    ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-zinc-950 hover:from-yellow-300'
                    : 'bg-gradient-to-r from-rose-600 to-rose-700 text-white hover:from-rose-500'
                }`}
              >
                <Unlock className="w-4 h-4" />
                <span>Authenticate Super-Admin</span>
              </button>
            </form>
          </div>
        ) : (
          /* VIEW 2: AUTHENTICATED SUPER-ADMIN DASHBOARD */
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {/* TOP BAR WITH CLOUD STATUS & CONTROLS */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-zinc-900/90 border border-white/10">
              <div className="flex items-center gap-2.5">
                <span className="flex h-2.5 w-2.5 relative">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      hasDb ? 'bg-emerald-400' : 'bg-amber-400'
                    }`}
                  ></span>
                  <span
                    className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                      hasDb ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                  ></span>
                </span>
                <span className="text-xs font-mono font-bold text-white">
                  {hasDb
                    ? 'Firebase Realtime Cloud: Live Sync 🟢'
                    : 'Cloud Database: Disconnected (Local Mode)'}
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setShowChangeCreds(!showChangeCreds)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 transition cursor-pointer"
                >
                  {showChangeCreds ? 'Close Settings' : 'Change Master Credentials'}
                </button>
                <button
                  onClick={handleLogout}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-rose-300 hover:text-white bg-rose-950 hover:bg-rose-900 border border-rose-800 transition cursor-pointer"
                >
                  Logout
                </button>
              </div>
            </div>

            {/* CHANGE MASTER CREDENTIALS FORM */}
            {showChangeCreds && (
              <form
                onSubmit={handleSaveNewCreds}
                className="p-4 rounded-xl bg-zinc-900 border border-amber-500/30 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4 text-amber-400" />
                    <span>Update Super-Admin Master Login</span>
                  </h4>
                  {credsSuccess && (
                    <span className="text-xs text-emerald-400 font-bold">{credsSuccess}</span>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                      New Master ID
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Neeraj"
                      value={newMasterId}
                      onChange={(e) => setNewMasterId(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-white text-xs font-mono focus:outline-none focus:border-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                      New Master Password (min 4 chars)
                    </label>
                    <input
                      type="password"
                      placeholder="e.g. 696969"
                      value={newMasterPass}
                      onChange={(e) => setNewMasterPass(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-white text-xs font-mono focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className={`px-4 py-1.5 rounded-lg font-bold text-xs cursor-pointer ${
                    isBumblebee ? 'bg-yellow-400 text-zinc-950' : 'bg-rose-600 text-white'
                  }`}
                >
                  Save New Master Pass
                </button>
              </form>
            )}

            {/* TOP METRICS CARDS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-white/5 space-y-1">
                <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-400 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-rose-400" /> Total Rooms
                </span>
                <div className="text-xl font-bold text-white font-mono">{totalRooms}</div>
                <div className="text-[11px] text-zinc-400">Created across all users</div>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-white/5 space-y-1">
                <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-400 flex items-center gap-1">
                  <IndianRupee className="w-3.5 h-3.5 text-emerald-400" /> Platform Spend
                </span>
                <div className="text-xl font-bold text-emerald-400 font-mono">
                  ₹{totalPlatformVolume.toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-zinc-400">All rooms combined</div>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-white/5 space-y-1">
                <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-400 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-blue-400" /> Flatmates / Users
                </span>
                <div className="text-xl font-bold text-white font-mono">{totalMembersCount}</div>
                <div className="text-[11px] text-zinc-400">Total active members</div>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-white/5 space-y-1">
                <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-400 flex items-center gap-1">
                  <Receipt className="w-3.5 h-3.5 text-amber-400" /> Transactions
                </span>
                <div className="text-xl font-bold text-white font-mono">{totalExpensesCount}</div>
                <div className="text-[11px] text-zinc-400">Logged expenses</div>
              </div>
            </div>

            {/* DRILL-DOWN ROOM INSPECTOR */}
            {selectedRoomId && selectedRoomData ? (
              <div className="p-4 rounded-2xl bg-zinc-900 border border-rose-500/30 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedRoomId(null)}
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition cursor-pointer flex items-center gap-1 text-xs"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back to All Rooms</span>
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white font-heading">
                          {selectedRoomData.meta?.name || `Flat ${selectedRoomId}`}
                        </h3>
                        <span className="px-2 py-0.5 rounded font-mono text-[11px] font-bold bg-zinc-800 text-rose-400 border border-zinc-700">
                          #{selectedRoomId}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400">
                        Last Activity: {selectedRoomData.meta?.updatedAt ? new Date(selectedRoomData.meta.updatedAt).toLocaleString() : 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        handleJumpIntoRoom(
                          selectedRoomId,
                          selectedRoomData.meta?.name || `Flat ${selectedRoomId}`
                        )
                      }
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-zinc-900 bg-white hover:bg-zinc-200 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open Live in Dashboard</span>
                    </button>

                    <button
                      onClick={() =>
                        handleDeleteRoom(
                          selectedRoomId,
                          selectedRoomData.meta?.name || `Flat ${selectedRoomId}`
                        )
                      }
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-rose-300 hover:text-white bg-rose-950 hover:bg-rose-900 border border-rose-800 transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Purge Room</span>
                    </button>
                  </div>
                </div>

                {/* INSPECTOR SUB-TABS */}
                <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                  <button
                    onClick={() => setInspectorTab('EXPENSES')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition ${
                      inspectorTab === 'EXPENSES'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Expenses ({selectedRoomData.state?.expenses?.length || 0})
                  </button>
                  <button
                    onClick={() => setInspectorTab('MEMBERS')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition ${
                      inspectorTab === 'MEMBERS'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Members ({selectedRoomData.state?.members?.length || 0})
                  </button>
                  <button
                    onClick={() => setInspectorTab('SETTLEMENTS')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition ${
                      inspectorTab === 'SETTLEMENTS'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Settlements ({selectedRoomData.state?.settledTransactions?.length || 0})
                  </button>
                </div>

                {/* SUB-TAB 1: EXPENSES LIST */}
                {inspectorTab === 'EXPENSES' && (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {(!selectedRoomData.state?.expenses ||
                      selectedRoomData.state.expenses.length === 0) && (
                      <p className="text-xs text-zinc-500 py-4 text-center">
                        No expenses logged in this room yet.
                      </p>
                    )}
                    {selectedRoomData.state?.expenses?.map((exp) => {
                      const payerName =
                        selectedRoomData.state?.members?.find((m) => m.id === exp.paidById)
                          ?.name || 'Someone';

                      return (
                        <div
                          key={exp.id}
                          className="p-3 rounded-xl bg-zinc-950/70 border border-white/5 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white">{exp.title}</span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-zinc-800 text-zinc-300">
                                {exp.tag || 'General'}
                              </span>
                              <span className="text-[10px] text-zinc-500 font-mono">
                                {new Date(exp.date).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="text-[11px] text-zinc-400">
                              Paid by <strong className="text-zinc-200">{payerName}</strong> • Split:{' '}
                              <span className="capitalize">{exp.splitType.toLowerCase()}</span> among{' '}
                              {exp.splits?.length || 0} flatmates
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-emerald-400 text-sm">
                              ₹{Number(exp.totalAmount).toLocaleString('en-IN')}
                            </span>
                            <button
                              onClick={() =>
                                handleDeleteExpense(selectedRoomId, exp.id, exp.title)
                              }
                              className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-950/40 transition cursor-pointer"
                              title="Delete this expense from room"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* SUB-TAB 2: MEMBERS LIST */}
                {inspectorTab === 'MEMBERS' && (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {(!selectedRoomData.state?.members ||
                      selectedRoomData.state.members.length === 0) && (
                      <p className="text-xs text-zinc-500 py-4 text-center">
                        No members added to this room yet.
                      </p>
                    )}
                    {selectedRoomData.state?.members?.map((member) => (
                      <div
                        key={member.id}
                        className="p-3 rounded-xl bg-zinc-950/70 border border-white/5 flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="font-bold text-white">{member.name}</div>
                          <div className="text-[11px] text-zinc-400 font-mono">
                            UPI: {member.upiId || 'Not set'}
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            handleDeleteMember(selectedRoomId, member.id, member.name)
                          }
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-300 hover:text-white bg-rose-950/60 hover:bg-rose-900 border border-rose-800 transition cursor-pointer flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* SUB-TAB 3: SETTLEMENTS */}
                {inspectorTab === 'SETTLEMENTS' && (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {(!selectedRoomData.state?.settledTransactions ||
                      selectedRoomData.state.settledTransactions.length === 0) && (
                      <p className="text-xs text-zinc-500 py-4 text-center">
                        No settlements recorded in this room yet.
                      </p>
                    )}
                    {selectedRoomData.state?.settledTransactions?.map((settle) => {
                      const fromName =
                        selectedRoomData.state?.members?.find((m) => m.id === settle.fromMemberId)
                          ?.name || 'Someone';
                      const toName =
                        selectedRoomData.state?.members?.find((m) => m.id === settle.toMemberId)
                          ?.name || 'Someone';

                      return (
                        <div
                          key={settle.id}
                          className="p-3 rounded-xl bg-zinc-950/70 border border-white/5 flex items-center justify-between text-xs"
                        >
                          <div className="text-zinc-300">
                            <strong className="text-white">{fromName}</strong> paid{' '}
                            <strong className="text-white">{toName}</strong>
                            <div className="text-[10px] text-zinc-500 font-mono">
                              {settle.settledAt ? new Date(settle.settledAt).toLocaleString() : 'Settled'}
                            </div>
                          </div>
                          <span className="font-mono font-bold text-emerald-400">
                            ₹{Number(settle.amount).toLocaleString('en-IN')}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              /* ROOMS DIRECTORY LIST */
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white font-heading">
                      Active Flat Rooms ({filteredRooms.length})
                    </h3>
                  </div>

                  <div className="relative w-full sm:w-64">
                    <input
                      type="text"
                      placeholder="Search room code or name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white text-xs font-mono focus:outline-none focus:border-rose-500 placeholder:font-sans"
                    />
                    <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {filteredRooms.length === 0 ? (
                  <div className="p-8 rounded-xl bg-zinc-900/50 border border-white/5 text-center text-zinc-400 space-y-2">
                    <p className="text-xs">
                      {searchQuery
                        ? 'No rooms match your search query.'
                        : 'No rooms currently exist in the cloud database. Once your cousin or flatmates create rooms, they will show up here in real time!'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredRooms.map(([roomId, roomData]) => {
                      const roomName = roomData?.meta?.name || `Flat ${roomId}`;
                      const expenses = roomData?.state?.expenses || [];
                      const members = roomData?.state?.members || [];
                      const spend = expenses.reduce((acc, cur) => acc + (Number(cur.totalAmount) || 0), 0);
                      const updatedAt = roomData?.meta?.updatedAt;

                      return (
                        <div
                          key={roomId}
                          className="p-4 rounded-xl bg-zinc-900/90 border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between space-y-3"
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="text-sm font-bold text-white font-heading">
                                  {roomName}
                                </h4>
                                <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-800 text-rose-400 border border-zinc-700">
                                  #{roomId}
                                </span>
                              </div>
                              <span className="font-mono font-bold text-emerald-400 text-sm">
                                ₹{spend.toLocaleString('en-IN')}
                              </span>
                            </div>

                            <div className="text-[11px] text-zinc-400 flex items-center gap-3">
                              <span>👥 {members.length} members</span>
                              <span>🧾 {expenses.length} expenses</span>
                              {updatedAt && (
                                <span className="text-[10px] text-zinc-500 font-mono">
                                  {new Date(updatedAt).toLocaleDateString()}
                                </span>
                              )}
                            </div>

                            {/* Member chips preview */}
                            <div className="flex flex-wrap gap-1 pt-1">
                              {members.slice(0, 4).map((m) => (
                                <span
                                  key={m.id}
                                  className="px-1.5 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-300 font-medium"
                                >
                                  {m.name}
                                </span>
                              ))}
                              {members.length > 4 && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-400 font-mono">
                                  +{members.length - 4} more
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5">
                            <button
                              onClick={() => setSelectedRoomId(roomId)}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-200 hover:text-white bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 transition cursor-pointer flex items-center gap-1.5"
                            >
                              <Search className="w-3.5 h-3.5" />
                              <span>Inspect Data</span>
                            </button>

                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleJumpIntoRoom(roomId, roomName)}
                                className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-zinc-950 bg-white hover:bg-zinc-200 transition cursor-pointer flex items-center gap-1"
                                title="Open this room directly on your dashboard"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>Switch</span>
                              </button>

                              <button
                                onClick={() => handleDeleteRoom(roomId, roomName)}
                                disabled={isDeleting === roomId}
                                className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-950/50 transition cursor-pointer"
                                title="Permanently delete room"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
