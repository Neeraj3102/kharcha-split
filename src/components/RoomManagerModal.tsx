import React, { useState, useEffect } from 'react';
import {
  X,
  Users,
  Copy,
  Check,
  Plus,
  LogIn,
  Database,
  CloudOff,
  CheckCircle,
  ExternalLink,
  Lock,
  Unlock,
  KeyRound,
  ShieldCheck,
  Eye,
  EyeOff,
  RotateCcw,
  Building2,
  Crown,
  ArrowRight,
  Trash2,
  Search,
  Bell,
  UserCheck,
} from 'lucide-react';
import type { AppState, AppTheme } from '../types';
import {
  getStoredFirebaseConfig,
  saveFirebaseConfig,
  getFirebaseDb,
  pushRoomState,
  saveActiveRoomId,
  clearActiveRoom,
  saveRoomAdminKey,
  claimRoomAdminKey,
  subscribeToAllRooms,
  getSavedRooms,
  removeSavedRoom,
} from '../utils/firebase';
import type { FirebaseConfig, RoomMeta, SavedRoom, JoinRequest } from '../utils/firebase';

interface RoomManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeRoom: { roomId: string; roomName: string } | null;
  setActiveRoom: (room: { roomId: string; roomName: string } | null) => void;
  state: AppState;
  theme: AppTheme;
  roomMeta?: RoomMeta | null;
  isRoomAdmin?: boolean;
  myMemberId?: string | null;
  pendingRequests?: JoinRequest[];
  onAdminClaimed?: () => void;
  onTransferAdmin?: (newAdminMemberId: string, newAdminMemberName: string) => void;
  onApproveJoinRequest?: (requestId: string, deviceId: string, name: string) => Promise<void>;
  onRejectJoinRequest?: (requestId: string) => Promise<void>;
}

export const RoomManagerModal: React.FC<RoomManagerModalProps> = ({
  isOpen,
  onClose,
  activeRoom,
  setActiveRoom,
  state,
  theme,
  roomMeta,
  isRoomAdmin = true,
  myMemberId,
  pendingRequests = [],
  onAdminClaimed,
  onTransferAdmin,
  onApproveJoinRequest,
  onRejectJoinRequest,
}) => {
  const [savedRooms, setSavedRooms] = useState<SavedRoom[]>(getSavedRooms);
  const [searchQuery, setSearchQuery] = useState('');
  const [tab, setTab] = useState<'MY_FLATS' | 'INVITE' | 'SEARCH' | 'REQUESTS' | 'CREATE' | 'JOIN' | 'CONFIG'>(() => {
    if (pendingRequests && pendingRequests.length > 0 && isRoomAdmin) return 'REQUESTS';
    const saved = getSavedRooms();
    if (saved.length > 1) return 'MY_FLATS';
    return activeRoom ? 'INVITE' : 'SEARCH';
  });

  // Keep saved rooms list fresh
  useEffect(() => {
    if (isOpen) {
      setSavedRooms(getSavedRooms());
    }
  }, [isOpen, activeRoom]);

  // Realtime discovery of rooms in Firebase for 1-tap mobile joining
  const [cloudRooms, setCloudRooms] = useState<
    Array<{ id: string; name: string; memberCount: number }>
  >([]);

  useEffect(() => {
    if (!isOpen) return;
    const unsub = subscribeToAllRooms((all) => {
      const list = Object.entries(all).map(([id, r]) => ({
        id,
        name: r.meta?.name || `Flat ${id}`,
        memberCount: (r.state?.members || []).length,
      }));
      setCloudRooms(list);
    });
    return () => {
      if (unsub) unsub();
    };
  }, [isOpen]);

  // Create Room State
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomCode, setNewRoomCode] = useState(
    () => `FLAT-${Math.floor(100 + Math.random() * 900)}`
  );
  const [importCurrentData, setImportCurrentData] = useState(false);

  // Join Room State
  const [joinCode, setJoinCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; isError?: boolean } | null>(null);
  const [transferTargetId, setTransferTargetId] = useState('');

  // Claim Admin State
  const [claimPinInput, setClaimPinInput] = useState('');
  const [claimStatus, setClaimStatus] = useState<{ text: string; isError?: boolean } | null>(null);

  // Firebase Config State
  const [config, setConfig] = useState<FirebaseConfig>(() => {
    return (
      getStoredFirebaseConfig() || {
        apiKey: '',
        authDomain: '',
        databaseURL: '',
        projectId: '',
        appId: '',
      }
    );
  });

  // Admin Lock & Passcode State
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [pinError, setPinError] = useState('');

  // Passcode change management
  const [showChangePin, setShowChangePin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinSuccessMsg, setPinSuccessMsg] = useState('');

  const getAdminPin = (): string => {
    return localStorage.getItem('kharchasplit_admin_pin') || '3102';
  };

  const handleUnlockAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    const currentPin = getAdminPin();
    if (adminPinInput.trim() === currentPin) {
      setIsAdminUnlocked(true);
      setPinError('');
      setAdminPinInput('');
    } else {
      setPinError('Incorrect passcode. Access is restricted to the administrator.');
    }
  };

  const handleLockAdmin = () => {
    setIsAdminUnlocked(false);
    setShowChangePin(false);
    setAdminPinInput('');
    setPinError('');
  };

  const handleChangePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.trim().length < 4) {
      setPinError('New passcode must be at least 4 digits or characters.');
      return;
    }
    if (newPin !== confirmPin) {
      setPinError('Passcodes do not match. Please re-enter.');
      return;
    }
    localStorage.setItem('kharchasplit_admin_pin', newPin.trim());
    setPinSuccessMsg('Admin passcode updated successfully!');
    setNewPin('');
    setConfirmPin('');
    setShowChangePin(false);
    setPinError('');
    setTimeout(() => setPinSuccessMsg(''), 3000);
  };

  const handleResetConfig = () => {
    if (
      window.confirm(
        'Are you sure you want to clear stored cloud credentials and revert to default/offline mode?'
      )
    ) {
      localStorage.removeItem('kharchasplit_firebase_config');
      setConfig({
        apiKey: '',
        authDomain: '',
        databaseURL: '',
        projectId: '',
        appId: '',
      });
      setStatusMsg({ text: 'Cloud credentials cleared. Reloading...' });
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    }
  };

  if (!isOpen) return null;

  const isPurple = theme === 'purple';
  const hasDb = !!getFirebaseDb();

  const inviteUrl = activeRoom
    ? `${window.location.origin}${window.location.pathname}#room=${activeRoom.roomId}`
    : '';

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleClaimAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRoom) return;
    const ok = await claimRoomAdminKey(activeRoom.roomId, claimPinInput);
    if (ok) {
      setClaimStatus({ text: 'Admin authority claimed successfully! You now have full delete authority.' });
      setClaimPinInput('');
      if (onAdminClaimed) onAdminClaimed();
    } else {
      setClaimStatus({ text: 'Incorrect PIN or Admin Key. Standard admin PIN is 3102.', isError: true });
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newRoomName.trim() || `Flat ${newRoomCode}`;
    const cleanCode = newRoomCode.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');

    if (!cleanCode) {
      setStatusMsg({ text: 'Please enter a valid room code', isError: true });
      return;
    }

    // Isolate initial state for the new room (clean empty room by default)
    const initialRoomState: AppState = importCurrentData
      ? state
      : {
          members: [],
          expenses: [],
          settledTransactions: [],
          customTags: [],
        };

    // Generate unique admin key for the creator
    const adminKey = `adm_${Math.random().toString(36).slice(2, 9)}_${Date.now().toString(36)}`;
    saveRoomAdminKey(cleanCode, adminKey);

    // Save active room
    saveActiveRoomId(cleanCode, cleanName);
    setActiveRoom({ roomId: cleanCode, roomName: cleanName });

    // Push initial clean state to Firebase with adminKey
    if (hasDb) {
      await pushRoomState(cleanCode, initialRoomState, cleanName, adminKey);
    }

    if (onAdminClaimed) onAdminClaimed();

    setStatusMsg({ text: `Created room ${cleanCode}! You are the Room Admin with exclusive delete authority.` });
    setTab('INVITE');
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = joinCode.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
    if (!cleanCode) {
      setStatusMsg({ text: 'Please enter a room code to join', isError: true });
      return;
    }

    saveActiveRoomId(cleanCode, `Flat ${cleanCode}`);
    setActiveRoom({ roomId: cleanCode, roomName: `Flat ${cleanCode}` });

    setStatusMsg({ text: `Connected to room ${cleanCode}! Syncing live data...` });
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleLeaveRoom = () => {
    clearActiveRoom();
    setActiveRoom(null);
    setTab('CREATE');
    setStatusMsg({ text: 'Switched to local offline mode' });
  };

  const handleSaveFirebaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!config.apiKey || !config.databaseURL) {
      setStatusMsg({ text: 'Please enter at least API Key and Database URL', isError: true });
      return;
    }
    saveFirebaseConfig(config);
    setStatusMsg({ text: 'Firebase Realtime credentials saved! Reconnecting...' });
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="glass-panel w-full max-w-lg rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`p-2 rounded-lg ${
                isPurple ? 'bg-purple-500/10 text-purple-400' : 'bg-rose-500/10 text-rose-500'
              }`}
            >
              <Users className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-white font-heading">
                Multiplayer Flat Rooms
              </h2>
              <p className="text-xs text-zinc-400">
                Sync shared expenses in real-time across all flatmates
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

        {/* Tab Navigation */}
        <div className="px-6 pt-3 flex items-center gap-1.5 border-b border-white/5 overflow-x-auto no-scrollbar">
          {savedRooms.length > 0 && (
            <button
              onClick={() => setTab('MY_FLATS')}
              className={`px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                tab === 'MY_FLATS'
                  ? isPurple
                    ? 'border-purple-400 text-purple-400'
                    : 'border-rose-500 text-rose-500'
                  : 'border-transparent text-zinc-400 hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>My Flats ({savedRooms.length})</span>
            </button>
          )}

          {activeRoom && (
            <button
              onClick={() => setTab('INVITE')}
              className={`px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer shrink-0 ${
                tab === 'INVITE'
                  ? isPurple
                    ? 'border-purple-400 text-purple-400'
                    : 'border-rose-500 text-rose-500'
                  : 'border-transparent text-zinc-400 hover:text-white'
              }`}
            >
              Room Details
            </button>
          )}

          {/* Pending Requests tab for Room Admin */}
          {isRoomAdmin && pendingRequests && pendingRequests.length > 0 && (
            <button
              onClick={() => setTab('REQUESTS')}
              className={`px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                tab === 'REQUESTS'
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-amber-300 hover:text-amber-200'
              }`}
            >
              <Bell className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>Requests ({pendingRequests.length})</span>
            </button>
          )}

          <button
            onClick={() => setTab('SEARCH')}
            className={`px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
              tab === 'SEARCH'
                ? isPurple
                  ? 'border-purple-400 text-purple-400'
                  : 'border-rose-500 text-rose-500'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search Flats</span>
          </button>

          <button
            onClick={() => setTab('CREATE')}
            className={`px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer shrink-0 ${
              tab === 'CREATE'
                ? isPurple
                  ? 'border-purple-400 text-purple-400'
                  : 'border-rose-500 text-rose-500'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            Create Flat
          </button>

          <button
            onClick={() => setTab('JOIN')}
            className={`px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer shrink-0 ${
              tab === 'JOIN'
                ? isPurple
                  ? 'border-purple-400 text-purple-400'
                  : 'border-rose-500 text-rose-500'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            Join with Code
          </button>

          <button
            onClick={() => setTab('CONFIG')}
            className={`px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              tab === 'CONFIG'
                ? isPurple
                  ? 'border-purple-400 text-purple-400'
                  : 'border-rose-500 text-rose-500'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            {isAdminUnlocked ? (
              <Unlock className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Lock className="w-3.5 h-3.5 text-zinc-400" />
            )}
            <span>Setup {hasDb ? '🟢' : '⚙️'}</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {statusMsg && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                statusMsg.isError
                  ? 'bg-rose-950/80 border-rose-800 text-rose-300'
                  : 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
              }`}
            >
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* TAB 0: MY FLATS (MULTI-ROOM SWITCHER) */}
          {tab === 'MY_FLATS' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-emerald-400" />
                    <span>Your Saved Flats</span>
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Switch between your different flats and apartments in 1 tap
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setTab('CREATE')}
                  className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-semibold border border-zinc-700 transition-all cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>New Flat</span>
                </button>
              </div>

              {savedRooms.length === 0 ? (
                <div className="p-6 rounded-xl bg-zinc-900/40 border border-dashed border-zinc-800 text-center space-y-2">
                  <p className="text-xs text-zinc-400">No flats saved on this device yet.</p>
                  <button
                    onClick={() => setTab('JOIN')}
                    className="text-xs text-emerald-400 hover:underline font-semibold"
                  >
                    Join a Flat using Room Code
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {savedRooms.map((room) => {
                    const isActive = activeRoom?.roomId === room.roomId;

                    return (
                      <div
                        key={room.roomId}
                        className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                          isActive
                            ? 'bg-emerald-950/25 border-emerald-700/60 shadow-sm'
                            : 'bg-zinc-900/60 border-white/5 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border ${
                              isActive
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                            }`}
                          >
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-2 flex-wrap">
                              <span>{room.roomName}</span>
                              <span className="font-mono text-[10px] text-zinc-400 bg-zinc-800/80 px-1.5 py-0.5 rounded border border-zinc-700">
                                #{room.roomId}
                              </span>
                              {isActive && (
                                <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-700 flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                  <span>Active Flat</span>
                                </span>
                              )}
                              {room.isAdmin && (
                                <span className="text-[9px] font-bold text-amber-300 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-800/60 flex items-center gap-0.5">
                                  <Crown className="w-2.5 h-2.5 text-amber-400" />
                                  <span>Admin</span>
                                </span>
                              )}
                            </div>
                            {room.myMemberName && (
                              <div className="text-[10px] text-zinc-400 mt-0.5">
                                Logged in as: <strong className="text-zinc-200">{room.myMemberName}</strong>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          {isActive ? (
                            <button
                              type="button"
                              onClick={() => setTab('INVITE')}
                              className="px-3 py-1.5 rounded-lg bg-emerald-950/80 text-emerald-300 border border-emerald-700/80 text-xs font-bold transition-all cursor-pointer"
                            >
                              Room Details
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                saveActiveRoomId(room.roomId, room.roomName);
                                setActiveRoom({ roomId: room.roomId, roomName: room.roomName });
                                setStatusMsg({ text: `Switched to ${room.roomName} (#${room.roomId})!` });
                                setSavedRooms(getSavedRooms());
                              }}
                              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-emerald-900/60 hover:text-emerald-300 hover:border-emerald-700/60 text-zinc-200 border border-zinc-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                            >
                              <span>Switch</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Remove "${room.roomName}" from your saved flats list?`)) {
                                removeSavedRoom(room.roomId);
                                setSavedRooms(getSavedRooms());
                                if (isActive) {
                                  clearActiveRoom();
                                  setActiveRoom(null);
                                }
                              }
                            }}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-950/40 transition-all cursor-pointer"
                            title="Forget / Remove from saved flats"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="pt-2 flex items-center justify-between text-xs border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setTab('JOIN')}
                  className="text-emerald-400 hover:underline font-semibold"
                >
                  + Join with Room Code
                </button>
                {activeRoom && (
                  <button
                    type="button"
                    onClick={handleLeaveRoom}
                    className="text-zinc-500 hover:text-rose-400 font-medium"
                  >
                    Switch to Local Mode
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB: JOIN REQUESTS (FOR ROOM ADMIN) */}
          {tab === 'REQUESTS' && isRoomAdmin && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Bell className="w-4 h-4 text-amber-400" />
                  <span>Pending Join Requests ({pendingRequests.length})</span>
                </h3>
                <p className="text-[11px] text-zinc-400">
                  New flatmates requesting permission to enter {activeRoom?.roomName}. Only approved flatmates can access the flat.
                </p>
              </div>

              {pendingRequests.length === 0 ? (
                <div className="p-8 rounded-xl bg-zinc-900/40 border border-dashed border-zinc-800 text-center space-y-1">
                  <p className="text-xs font-semibold text-zinc-300">No Pending Requests</p>
                  <p className="text-[11px] text-zinc-500">
                    When someone tries to join with your room link or code, their request will appear here for you to accept.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {pendingRequests.map((req) => {
                    const timeAgo = req.requestedAt
                      ? new Date(req.requestedAt).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Just now';

                    return (
                      <div
                        key={req.id}
                        className="p-3.5 rounded-xl bg-zinc-900 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-sm shrink-0">
                            {req.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-2">
                              <span>{req.name}</span>
                              <span className="text-[9px] font-mono text-zinc-400 bg-zinc-800 px-1.5 py-0.2 rounded">
                                {timeAgo}
                              </span>
                            </div>
                            {req.phone && (
                              <div className="text-[10px] text-zinc-400 mt-0.5">
                                Phone: +91 {req.phone}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          {onApproveJoinRequest && (
                            <button
                              type="button"
                              onClick={async () => {
                                await onApproveJoinRequest(req.id, req.deviceId, req.name);
                                setStatusMsg({ text: `Approved ${req.name}! Access granted.` });
                              }}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer shadow-md flex items-center gap-1"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Accept</span>
                            </button>
                          )}

                          {onRejectJoinRequest && (
                            <button
                              type="button"
                              onClick={async () => {
                                await onRejectJoinRequest(req.id);
                                setStatusMsg({ text: `Declined request from ${req.name}.` });
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-rose-950 hover:text-rose-400 text-zinc-400 border border-zinc-700 text-xs font-semibold transition-all cursor-pointer"
                            >
                              Decline
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB: SEARCH FLATS */}
          {tab === 'SEARCH' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Search className="w-4 h-4 text-rose-500" />
                  <span>Discover & Search Flats</span>
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Search by flat name or room code to join or request access
                </p>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search flats (e.g. 710, Flat-2, Koramangala)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-rose-500"
                  autoFocus
                />
              </div>

              {/* Filtered list of cloud rooms */}
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {cloudRooms
                  .filter((r) => {
                    if (!searchQuery.trim()) return true;
                    const q = searchQuery.toLowerCase();
                    return r.name.toLowerCase().includes(q) || r.id.toLowerCase().includes(q);
                  })
                  .map((room) => {
                    const isCurrent = activeRoom?.roomId === room.id;

                    return (
                      <div
                        key={room.id}
                        className="p-3 rounded-xl bg-zinc-900/60 border border-white/5 flex items-center justify-between gap-3 hover:border-zinc-700 transition-all"
                      >
                        <div>
                          <div className="text-xs font-bold text-white flex items-center gap-2">
                            <span>{room.name}</span>
                            <span className="font-mono text-[10px] text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded">
                              #{room.id}
                            </span>
                            {isCurrent && (
                              <span className="text-[9px] text-emerald-400 font-bold bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-800">
                                Active
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-zinc-400 mt-0.5">
                            {room.memberCount} flatmates
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            saveActiveRoomId(room.id, room.name);
                            setActiveRoom({ roomId: room.id, roomName: room.name });
                            onClose();
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                            isCurrent
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                              : 'bg-zinc-800 hover:bg-rose-900/60 hover:border-rose-700 text-zinc-200 border border-zinc-700'
                          }`}
                        >
                          <span>{isCurrent ? 'Open' : 'Select / Join'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}

                {cloudRooms.length === 0 && (
                  <div className="p-6 rounded-xl bg-zinc-900/30 border border-dashed border-zinc-800 text-center text-xs text-zinc-500">
                    No other cloud flats discovered yet. Create one with the "Create Flat" tab!
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 1: INVITE LINK (FOR ACTIVE ROOM) */}
          {tab === 'INVITE' && activeRoom && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-zinc-900 border border-white/5 space-y-2 text-center">
                <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-400">
                  Current Flat Room
                </span>
                <div className="text-xl font-bold text-white font-heading">{activeRoom.roomName}</div>
                <div className="inline-block px-3 py-1 rounded-full bg-zinc-800 text-xs font-mono font-bold text-rose-400 border border-zinc-700">
                  Room Code: #{activeRoom.roomId}
                </div>
              </div>

              {/* AUTHORITY & ROLE BADGE */}
              <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-white/5 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`p-1.5 rounded-lg text-sm ${isRoomAdmin ? 'bg-amber-500/20 text-amber-400' : 'bg-zinc-800 text-zinc-400'}`}>
                      {isRoomAdmin ? '👑' : '👤'}
                    </span>
                    <div>
                      <div className="font-bold text-white flex items-center gap-2">
                        <span>{isRoomAdmin ? 'You are the Room Admin' : 'You are a Room Member'}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider ${
                            isRoomAdmin
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                          }`}
                        >
                          {isRoomAdmin ? 'Full Delete Rights' : 'Add & Settle Only'}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400">
                        {isRoomAdmin
                          ? 'You created this room. Only you can delete expenses, remove flatmates, or reset the ledger.'
                          : 'You can add expenses, split bills, and settle with UPI QR. Only the room creator can delete records.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* TRANSFER ROOM ADMIN AUTHORITY TO ANOTHER FLATMATE */}
                {isRoomAdmin && state.members.length > 1 && onTransferAdmin && (
                  <div className="pt-2 border-t border-white/5 space-y-2">
                    <label className="block text-[11px] font-semibold text-zinc-300 flex items-center gap-1.5">
                      <Crown className="w-3.5 h-3.5 text-amber-400" />
                      <span>Transfer Room Admin Authority:</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <select
                        value={transferTargetId}
                        onChange={(e) => setTransferTargetId(e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-white text-xs focus:outline-none focus:border-amber-400"
                      >
                        <option value="">-- Select Flatmate to Make Admin --</option>
                        {state.members
                          .filter((m) => m.id !== myMemberId && m.id !== roomMeta?.adminMemberId)
                          .map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name} ({m.upiId})
                            </option>
                          ))}
                      </select>
                      <button
                        type="button"
                        disabled={!transferTargetId}
                        onClick={() => {
                          const target = state.members.find((m) => m.id === transferTargetId);
                          if (!target) return;
                          if (
                            window.confirm(
                              `👑 Transfer Room Admin authority to ${target.name}?\n\n${target.name} will become the new Room Admin with exclusive delete and management rights. You will become a regular member.`
                            )
                          ) {
                            onTransferAdmin(target.id, target.name);
                            setStatusMsg({ text: `Admin authority transferred to ${target.name}!` });
                            setTransferTargetId('');
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-950 text-xs font-bold transition-all cursor-pointer"
                      >
                        Transfer Admin
                      </button>
                    </div>
                  </div>
                )}

                {!isRoomAdmin && (
                  <form onSubmit={handleClaimAdmin} className="pt-2 border-t border-white/5 space-y-2">
                    <label className="block text-[11px] font-semibold text-zinc-300">
                      Are you the creator on a new device? Claim Admin Authority:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="password"
                        placeholder="Enter Admin PIN (Default: 3102)"
                        value={claimPinInput}
                        onChange={(e) => setClaimPinInput(e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-amber-400"
                      />
                      <button
                        type="submit"
                        className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold transition-all cursor-pointer"
                      >
                        Claim Admin
                      </button>
                    </div>
                    {claimStatus && (
                      <p className={`text-[11px] ${claimStatus.isError ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {claimStatus.text}
                      </p>
                    )}
                  </form>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-zinc-300">
                  Direct Flatmate Invite Link:
                </label>
                <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-2">
                  <span className="text-xs font-mono text-zinc-400 truncate pl-1">{inviteUrl}</span>
                  <button
                    onClick={handleCopyInvite}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                      isPurple
                        ? 'bg-purple-600 hover:bg-purple-500 text-white'
                        : 'bg-rose-600 hover:bg-rose-500 text-white'
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Share this link on WhatsApp. Flatmates who join cannot delete your expenses or flatmates!
                </p>
              </div>

              <div className="pt-2 flex justify-between items-center text-xs text-zinc-500 border-t border-white/5">
                <span>Want to switch rooms?</span>
                <button
                  type="button"
                  onClick={handleLeaveRoom}
                  className="text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
                >
                  Exit Current Room
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: CREATE NEW FLAT */}
          {tab === 'CREATE' && (
            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Flat / Apartment Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Flat 402 - Koramangala, BTM Bachelors"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center justify-between">
                  <span>Room Code (Unique ID)</span>
                  <span className="text-[10px] text-zinc-500">Auto-generated or custom</span>
                </label>
                <input
                  type="text"
                  value={newRoomCode}
                  onChange={(e) => setNewRoomCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs font-mono font-bold focus:outline-none focus:border-rose-500 uppercase"
                />
              </div>

              {state.members.length > 0 && (
                <label className="flex items-start gap-2 p-3 rounded-xl bg-zinc-900/70 border border-white/5 cursor-pointer text-xs text-zinc-300">
                  <input
                    type="checkbox"
                    checked={importCurrentData}
                    onChange={(e) => setImportCurrentData(e.target.checked)}
                    className="mt-0.5 rounded text-rose-500 focus:ring-0"
                  />
                  <span>
                    Copy current {state.members.length} flatmate(s) and expenses into this new room (Leave unchecked to start with a fresh blank flat).
                  </span>
                </label>
              )}

              <button
                type="submit"
                className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md ${
                  isPurple
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-500 shadow-purple-950/60'
                    : 'bg-gradient-to-r from-rose-600 to-rose-700 text-white hover:from-rose-500'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>Create Flat & Generate Link</span>
              </button>
            </form>
          )}

          {/* TAB 3: JOIN EXISTING ROOM */}
          {tab === 'JOIN' && (
            <div className="space-y-4">
              {cloudRooms.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                      <span>Discovered Flat Rooms in Cloud:</span>
                    </label>
                    <span className="text-[10px] text-zinc-500">Tap to join instantly</span>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {cloudRooms.map((room) => (
                      <div
                        key={room.id}
                        className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between gap-3 hover:border-zinc-700 transition-all"
                      >
                        <div>
                          <div className="text-xs font-bold text-white flex items-center gap-2">
                            <span>#{room.id}</span>
                            <span className="text-zinc-400 font-normal">({room.name})</span>
                          </div>
                          <div className="text-[10px] text-zinc-500 mt-0.5">
                            {room.memberCount} flatmates registered
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            saveActiveRoomId(room.id, room.name);
                            setActiveRoom({ roomId: room.id, roomName: room.name });
                            setStatusMsg({ text: `Connected to room #${room.id}! Syncing live data...` });
                            setTimeout(onClose, 800);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
                        >
                          Join Now
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 my-2 text-zinc-600">
                    <div className="h-[1px] flex-1 bg-zinc-800"></div>
                    <span className="text-[10px] uppercase font-mono tracking-wider">or enter room code manually</span>
                    <div className="h-[1px] flex-1 bg-zinc-800"></div>
                  </div>
                </div>
              )}

              <form onSubmit={handleJoinRoom} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Room Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 710 or FLAT-402"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs font-mono font-bold placeholder-zinc-500 focus:outline-none focus:border-rose-500 uppercase"
                  />
                </div>

                <p className="text-[11px] text-zinc-400">
                  Ask your flatmate for their room code or tap the invite link sent via WhatsApp.
                </p>

                <button
                  type="submit"
                  className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md ${
                    isPurple
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-500 shadow-purple-950/60'
                      : 'bg-gradient-to-r from-rose-600 to-rose-700 text-white hover:from-rose-500'
                  }`}
                >
                  <LogIn className="w-4 h-4" />
                  <span>Join & Sync Ledger</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 4: FIREBASE CLOUD SETUP (LOCKED BEHIND ADMIN PASSCODE) */}
          {tab === 'CONFIG' && (
            <div className="space-y-4">
              {!isAdminUnlocked ? (
                /* LOCKED SCREEN FOR NON-ADMINS */
                <div className="p-6 rounded-2xl bg-zinc-900/90 border border-white/10 text-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/10 flex items-center justify-center mx-auto shadow-inner">
                    <Lock
                      className={`w-7 h-7 ${
                        isPurple ? 'text-purple-400' : 'text-rose-500'
                      }`}
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-bold bg-zinc-800 text-zinc-300 border border-white/10">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                      Admin Restricted
                    </div>
                    <h3 className="text-base font-bold text-white font-heading">
                      Cloud Setup Locked
                    </h3>
                    <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                      Firebase database credentials and room sync infrastructure are restricted to the administrator.
                    </p>
                  </div>

                  <form onSubmit={handleUnlockAdmin} className="max-w-xs mx-auto space-y-3 pt-2">
                    <div className="relative">
                      <input
                        type={showPin ? 'text' : 'password'}
                        placeholder="Enter Admin Passcode"
                        value={adminPinInput}
                        onChange={(e) => {
                          setAdminPinInput(e.target.value);
                          setPinError('');
                        }}
                        autoFocus
                        className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-white text-sm text-center font-mono tracking-widest focus:outline-none focus:border-rose-500 placeholder:tracking-normal placeholder:text-xs placeholder:text-zinc-500"
                      />
                      <KeyRound className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <button
                        type="button"
                        onClick={() => setShowPin(!showPin)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer"
                        title={showPin ? 'Hide Passcode' : 'Show Passcode'}
                      >
                        {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {pinError && (
                      <div className="text-xs text-rose-400 bg-rose-950/60 border border-rose-800/60 p-2 rounded-lg">
                        {pinError}
                      </div>
                    )}

                    <button
                      type="submit"
                      className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md ${
                        isPurple
                          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-500 shadow-purple-950/60'
                          : 'bg-gradient-to-r from-rose-600 to-rose-700 text-white hover:from-rose-500'
                      }`}
                    >
                      <Unlock className="w-4 h-4" />
                      <span>Unlock Cloud Setup</span>
                    </button>
                  </form>
                </div>
              ) : (
                /* UNLOCKED ADMIN PANEL */
                <div className="space-y-4">
                  {/* Admin Status Bar */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold text-emerald-300 font-mono">
                        ADMIN MODE ACTIVE
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowChangePin(!showChangePin);
                          setPinError('');
                        }}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 transition cursor-pointer"
                      >
                        {showChangePin ? 'Cancel' : 'Change Passcode'}
                      </button>
                      <button
                        type="button"
                        onClick={handleLockAdmin}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-rose-300 hover:text-rose-100 bg-rose-950/80 hover:bg-rose-900 border border-rose-800/80 flex items-center gap-1 transition cursor-pointer"
                      >
                        <Lock className="w-3 h-3" />
                        <span>Lock</span>
                      </button>
                    </div>
                  </div>

                  {pinSuccessMsg && (
                    <div className="p-2.5 rounded-lg text-xs bg-emerald-950/80 border border-emerald-800 text-emerald-300 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 shrink-0" />
                      <span>{pinSuccessMsg}</span>
                    </div>
                  )}

                  {/* CHANGE PASSCODE FORM */}
                  {showChangePin && (
                    <form
                      onSubmit={handleChangePin}
                      className="p-3.5 rounded-xl bg-zinc-900 border border-white/10 space-y-3"
                    >
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                        <span>Change Admin Passcode</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-400 mb-0.5">
                            New Passcode (min 4 chars)
                          </label>
                          <input
                            type="password"
                            value={newPin}
                            onChange={(e) => setNewPin(e.target.value)}
                            placeholder="Enter new passcode"
                            className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-xs font-mono focus:outline-none focus:border-rose-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-400 mb-0.5">
                            Confirm Passcode
                          </label>
                          <input
                            type="password"
                            value={confirmPin}
                            onChange={(e) => setConfirmPin(e.target.value)}
                            placeholder="Confirm new passcode"
                            className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-xs font-mono focus:outline-none focus:border-rose-500"
                          />
                        </div>
                      </div>
                      {pinError && (
                        <div className="text-xs text-rose-400">{pinError}</div>
                      )}
                      <button
                        type="submit"
                        className={`px-3 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer ${
                          isPurple
                            ? 'bg-purple-600 text-white hover:bg-purple-500'
                            : 'bg-rose-600 text-white hover:bg-rose-500'
                        }`}
                      >
                        Update Passcode
                      </button>
                    </form>
                  )}

                  {/* FIREBASE CONFIGURATION FORM */}
                  <form onSubmit={handleSaveFirebaseConfig} className="space-y-3">
                    <div className="p-3 rounded-xl bg-zinc-900 border border-white/5 space-y-1">
                      <div className="flex items-center gap-2 text-xs font-bold text-white">
                        {hasDb ? (
                          <>
                            <Database className="w-4 h-4 text-emerald-400" />
                            <span>Firebase Realtime Cloud: Connected 🟢</span>
                          </>
                        ) : (
                          <>
                            <CloudOff className="w-4 h-4 text-amber-400" />
                            <span>Firebase Realtime Cloud: Not Configured (Using Offline Local Sync)</span>
                          </>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-400">
                        Google Firebase Realtime Database is <strong>100% free</strong> (Spark plan, 0 credit card needed). Paste your config below or add environment variables to Netlify!
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-400 mb-0.5">
                          apiKey *
                        </label>
                        <input
                          type="text"
                          placeholder="AIzaSy..."
                          value={config.apiKey}
                          onChange={(e) => setConfig({ ...config, apiKey: e.target.value.trim() })}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-[11px] font-mono focus:outline-none focus:border-rose-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-400 mb-0.5">
                          databaseURL *
                        </label>
                        <input
                          type="text"
                          placeholder="https://your-app-default-rtdb.firebaseio.com"
                          value={config.databaseURL}
                          onChange={(e) => setConfig({ ...config, databaseURL: e.target.value.trim() })}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-[11px] font-mono focus:outline-none focus:border-rose-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-400 mb-0.5">
                          projectId
                        </label>
                        <input
                          type="text"
                          placeholder="kharchasplit-app"
                          value={config.projectId}
                          onChange={(e) => setConfig({ ...config, projectId: e.target.value.trim() })}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-[11px] font-mono focus:outline-none focus:border-rose-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-400 mb-0.5">
                          appId
                        </label>
                        <input
                          type="text"
                          placeholder="1:123456789:web:abcdef..."
                          value={config.appId}
                          onChange={(e) => setConfig({ ...config, appId: e.target.value.trim() })}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-[11px] font-mono focus:outline-none focus:border-rose-500"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-3">
                        <a
                          href="https://console.firebase.google.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 underline"
                        >
                          <span>Firebase Console</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        <button
                          type="button"
                          onClick={handleResetConfig}
                          className="text-[11px] text-zinc-500 hover:text-rose-400 flex items-center gap-1 transition cursor-pointer"
                          title="Reset and clear stored credentials"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Clear Credentials</span>
                        </button>
                      </div>

                      <button
                        type="submit"
                        className={`px-4 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                          isPurple
                            ? 'bg-purple-600 hover:bg-purple-500 text-white'
                            : 'bg-rose-600 hover:bg-rose-500 text-white'
                        }`}
                      >
                        Save & Connect
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
