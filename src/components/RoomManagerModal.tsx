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
} from '../utils/firebase';
import type { FirebaseConfig, RoomMeta } from '../utils/firebase';

interface RoomManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeRoom: { roomId: string; roomName: string } | null;
  setActiveRoom: (room: { roomId: string; roomName: string } | null) => void;
  state: AppState;
  theme: AppTheme;
  roomMeta?: RoomMeta | null;
  isRoomAdmin?: boolean;
  onAdminClaimed?: () => void;
}

export const RoomManagerModal: React.FC<RoomManagerModalProps> = ({
  isOpen,
  onClose,
  activeRoom,
  setActiveRoom,
  state,
  theme,
  isRoomAdmin = true,
  onAdminClaimed,
}) => {
  const [tab, setTab] = useState<'INVITE' | 'CREATE' | 'JOIN' | 'CONFIG'>(
    activeRoom ? 'INVITE' : 'JOIN'
  );

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

  const isBumblebee = theme === 'bumblebee';
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
                isBumblebee ? 'bg-yellow-400/10 text-yellow-400' : 'bg-rose-500/10 text-rose-500'
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
        <div className="px-6 pt-3 flex items-center gap-1.5 border-b border-white/5 overflow-x-auto">
          {activeRoom && (
            <button
              onClick={() => setTab('INVITE')}
              className={`px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                tab === 'INVITE'
                  ? isBumblebee
                    ? 'border-yellow-400 text-yellow-400'
                    : 'border-rose-500 text-rose-500'
                  : 'border-transparent text-zinc-400 hover:text-white'
              }`}
            >
              Invite Link
            </button>
          )}

          <button
            onClick={() => setTab('CREATE')}
            className={`px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              tab === 'CREATE'
                ? isBumblebee
                  ? 'border-yellow-400 text-yellow-400'
                  : 'border-rose-500 text-rose-500'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            Create New Flat
          </button>

          <button
            onClick={() => setTab('JOIN')}
            className={`px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              tab === 'JOIN'
                ? isBumblebee
                  ? 'border-yellow-400 text-yellow-400'
                  : 'border-rose-500 text-rose-500'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            Join Existing Room
          </button>

          <button
            onClick={() => setTab('CONFIG')}
            className={`px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              tab === 'CONFIG'
                ? isBumblebee
                  ? 'border-yellow-400 text-yellow-400'
                  : 'border-rose-500 text-rose-500'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            {isAdminUnlocked ? (
              <Unlock className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Lock className="w-3.5 h-3.5 text-zinc-400" />
            )}
            <span>Cloud Setup {hasDb ? '🟢' : '⚙️'}</span>
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
              <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-white/5 space-y-2 text-xs">
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
                      isBumblebee
                        ? 'bg-yellow-400 hover:bg-yellow-300 text-zinc-950'
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
                  isBumblebee
                    ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-zinc-950 hover:from-yellow-300'
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
                    isBumblebee
                      ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-zinc-950 hover:from-yellow-300'
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
                        isBumblebee ? 'text-yellow-400' : 'text-rose-500'
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
                        isBumblebee
                          ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-zinc-950 hover:from-yellow-300'
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
                          isBumblebee
                            ? 'bg-yellow-400 text-zinc-950 hover:bg-yellow-300'
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
                          isBumblebee
                            ? 'bg-yellow-400 hover:bg-yellow-300 text-zinc-950'
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
