import React, { useState } from 'react';
import { X, Users, Copy, Check, Plus, LogIn, Database, CloudOff, CheckCircle, ExternalLink } from 'lucide-react';
import type { AppState, AppTheme } from '../types';
import {
  getStoredFirebaseConfig,
  saveFirebaseConfig,
  getFirebaseDb,
  pushRoomState,
  saveActiveRoomId,
  clearActiveRoom,
} from '../utils/firebase';
import type { FirebaseConfig } from '../utils/firebase';

interface RoomManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeRoom: { roomId: string; roomName: string } | null;
  setActiveRoom: (room: { roomId: string; roomName: string } | null) => void;
  state: AppState;
  theme: AppTheme;
}

export const RoomManagerModal: React.FC<RoomManagerModalProps> = ({
  isOpen,
  onClose,
  activeRoom,
  setActiveRoom,
  state,
  theme,
}) => {
  const [tab, setTab] = useState<'INVITE' | 'CREATE' | 'JOIN' | 'CONFIG'>(
    activeRoom ? 'INVITE' : 'CREATE'
  );

  // Create Room State
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomCode, setNewRoomCode] = useState(
    () => `FLAT-${Math.floor(100 + Math.random() * 900)}`
  );

  // Join Room State
  const [joinCode, setJoinCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; isError?: boolean } | null>(null);

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

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newRoomName.trim() || `Flat ${newRoomCode}`;
    const cleanCode = newRoomCode.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');

    if (!cleanCode) {
      setStatusMsg({ text: 'Please enter a valid room code', isError: true });
      return;
    }

    // Save active room
    saveActiveRoomId(cleanCode, cleanName);
    setActiveRoom({ roomId: cleanCode, roomName: cleanName });

    // Push initial state to Firebase if configured
    if (hasDb) {
      await pushRoomState(cleanCode, state, cleanName);
    }

    setStatusMsg({ text: `Created room ${cleanCode}! Send the link to your flatmates.` });
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
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
            className={`px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              tab === 'CONFIG'
                ? isBumblebee
                  ? 'border-yellow-400 text-yellow-400'
                  : 'border-rose-500 text-rose-500'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            Cloud Setup {hasDb ? '🟢' : '⚙️'}
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
                  Share this link on WhatsApp. When flatmates tap it, they join the room and see all expenses live!
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
            <form onSubmit={handleJoinRoom} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Enter Room Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. FLAT-402 or KORA-101"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs font-mono font-bold placeholder-zinc-500 focus:outline-none focus:border-rose-500 uppercase"
                />
              </div>

              <p className="text-[11px] text-zinc-400">
                Ask your flatmate for their room code or click the invite link they sent you.
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
          )}

          {/* TAB 4: FIREBASE CLOUD SETUP */}
          {tab === 'CONFIG' && (
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
                <a
                  href="https://console.firebase.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 underline"
                >
                  <span>Open Firebase Console</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

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
          )}
        </div>
      </div>
    </div>
  );
};
