import { initializeApp, getApps, getApp } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, get, remove, update, Database } from 'firebase/database';
import type { Unsubscribe } from 'firebase/database';
import type { AppState } from '../types';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  databaseURL: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
}

const CONFIG_STORAGE_KEY = 'kharchasplit_firebase_config';
const ACTIVE_ROOM_KEY = 'kharchasplit_active_room';

// Default config from environment variables if provided
export function getStoredFirebaseConfig(): FirebaseConfig | null {
  // 1. Check environment variables
  if (import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_DATABASE_URL) {
    return {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
      databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
      appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
    };
  }

  // 2. Check localStorage
  try {
    const saved = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved) as FirebaseConfig;
    }
  } catch (err) {
    console.error('Failed to parse Firebase config:', err);
  }

  return null;
}

export function saveFirebaseConfig(config: FirebaseConfig): void {
  try {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('Failed to save Firebase config:', err);
  }
}

let firebaseApp: FirebaseApp | null = null;
let database: Database | null = null;

export function getFirebaseDb(): Database | null {
  const config = getStoredFirebaseConfig();
  if (!config || !config.apiKey || !config.databaseURL) {
    return null;
  }

  try {
    if (!firebaseApp) {
      firebaseApp = getApps().length > 0 ? getApp() : initializeApp(config);
    }
    if (!database) {
      database = getDatabase(firebaseApp);
    }
    return database;
  } catch (err) {
    console.error('Failed to initialize Firebase Realtime Database:', err);
    return null;
  }
}

/**
 * Returns the currently active roomId if one was joined
 */
export function getActiveRoomId(): { roomId: string; roomName: string } | null {
  // Check URL hash first e.g. #room=KORA-402
  const hash = window.location.hash;
  if (hash && hash.includes('#room=')) {
    const rawId = hash.split('#room=')[1]?.split('&')[0];
    if (rawId) {
      const cleanId = rawId.trim().toUpperCase();
      return { roomId: cleanId, roomName: `Flat ${cleanId}` };
    }
  }

  // Check localStorage
  try {
    const saved = localStorage.getItem(ACTIVE_ROOM_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // ignore
  }

  return null;
}

export function saveActiveRoomId(roomId: string, roomName: string): void {
  try {
    localStorage.setItem(ACTIVE_ROOM_KEY, JSON.stringify({ roomId, roomName }));
    window.location.hash = `room=${roomId}`;
  } catch {
    // ignore
  }
}

export function clearActiveRoom(): void {
  try {
    localStorage.removeItem(ACTIVE_ROOM_KEY);
    if (window.location.hash.includes('#room=')) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  } catch {
    // ignore
  }
}

/**
 * Subscribes to live room updates via WebSockets.
 * Calls onUpdate whenever any flatmate adds an expense, settles, or edits flatmates!
 */
export function subscribeToRoomState(
  roomId: string,
  onUpdate: (state: AppState) => void,
  onError?: (err: Error) => void
): Unsubscribe | null {
  const db = getFirebaseDb();
  if (!db) return null;

  const roomRef = ref(db, `kharcha_rooms/${roomId}/state`);

  return onValue(
    roomRef,
    (snapshot) => {
      const val = snapshot.val();
      if (val && Array.isArray(val.members)) {
        onUpdate({
          members: val.members || [],
          expenses: val.expenses || [],
          settledTransactions: val.settledTransactions || [],
          customTags: val.customTags || [],
        });
      }
    },
    (error) => {
      console.error('Firebase Room Sync Error:', error);
      if (onError) onError(error);
    }
  );
}

/**
 * Pushes the updated state to the shared Firebase Realtime Room
 */
export async function pushRoomState(roomId: string, state: AppState, roomName?: string): Promise<boolean> {
  const db = getFirebaseDb();
  if (!db) return false;

  try {
    const roomRef = ref(db, `kharcha_rooms/${roomId}`);
    await set(roomRef, {
      meta: {
        id: roomId,
        name: roomName || `Flat ${roomId}`,
        updatedAt: new Date().toISOString(),
      },
      state,
    });
    return true;
  } catch (err) {
    console.error('Failed to sync room state to Firebase:', err);
    return false;
  }
}

/**
 * Checks if a room exists in Firebase
 */
export async function checkRoomExists(roomId: string): Promise<boolean> {
  const db = getFirebaseDb();
  if (!db) return false;

  try {
    const roomRef = ref(db, `kharcha_rooms/${roomId}/meta`);
    const snapshot = await get(roomRef);
    return snapshot.exists();
  } catch (err) {
    console.error('Failed to check room existence:', err);
    return false;
  }
}

export interface FirebaseRoomData {
  meta?: {
    id: string;
    name: string;
    updatedAt: string;
  };
  state?: AppState;
}

/**
 * Super Admin: Listen to all rooms across the platform
 */
export function subscribeToAllRooms(
  onUpdate: (rooms: Record<string, FirebaseRoomData>) => void,
  onError?: (err: Error) => void
): Unsubscribe | null {
  const db = getFirebaseDb();
  if (!db) return null;

  const allRoomsRef = ref(db, 'kharcha_rooms');
  return onValue(
    allRoomsRef,
    (snapshot) => {
      const data = snapshot.val() || {};
      onUpdate(data);
    },
    (err) => {
      console.error('Failed to subscribe to all rooms:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Super Admin: Delete an entire room from Firebase
 */
export async function deleteRoom(roomId: string): Promise<boolean> {
  const db = getFirebaseDb();
  if (!db) return false;

  try {
    const roomRef = ref(db, `kharcha_rooms/${roomId}`);
    await remove(roomRef);
    return true;
  } catch (err) {
    console.error(`Failed to delete room ${roomId}:`, err);
    return false;
  }
}

/**
 * Super Admin: Delete a specific expense from any room
 */
export async function deleteExpenseFromRoom(
  roomId: string,
  expenseId: string
): Promise<boolean> {
  const db = getFirebaseDb();
  if (!db) return false;

  try {
    const snapshot = await get(ref(db, `kharcha_rooms/${roomId}/state/expenses`));
    if (snapshot.exists()) {
      const expenses = snapshot.val();
      if (Array.isArray(expenses)) {
        const filtered = expenses.filter((e: any) => e.id !== expenseId);
        await set(ref(db, `kharcha_rooms/${roomId}/state/expenses`), filtered);
        await update(ref(db, `kharcha_rooms/${roomId}/meta`), {
          updatedAt: new Date().toISOString(),
        });
        return true;
      }
    }
    return false;
  } catch (err) {
    console.error(`Failed to delete expense ${expenseId} from room ${roomId}:`, err);
    return false;
  }
}

/**
 * Super Admin: Remove a specific member from any room
 */
export async function deleteMemberFromRoom(
  roomId: string,
  memberId: string
): Promise<boolean> {
  const db = getFirebaseDb();
  if (!db) return false;

  try {
    const snapshot = await get(ref(db, `kharcha_rooms/${roomId}/state/members`));
    if (snapshot.exists()) {
      const members = snapshot.val();
      if (Array.isArray(members)) {
        const filtered = members.filter((m: any) => m.id !== memberId);
        await set(ref(db, `kharcha_rooms/${roomId}/state/members`), filtered);
        await update(ref(db, `kharcha_rooms/${roomId}/meta`), {
          updatedAt: new Date().toISOString(),
        });
        return true;
      }
    }
    return false;
  } catch (err) {
    console.error(`Failed to delete member ${memberId} from room ${roomId}:`, err);
    return false;
  }
}

const MASTER_ID_KEY = 'kharchasplit_master_id';
const MASTER_PASS_KEY = 'kharchasplit_master_pass';

export function getMasterCredentials(): { id: string; pass: string } {
  return {
    id: localStorage.getItem(MASTER_ID_KEY) || 'Neeraj',
    pass: localStorage.getItem(MASTER_PASS_KEY) || '696969',
  };
}

export function saveMasterCredentials(id: string, pass: string): void {
  localStorage.setItem(MASTER_ID_KEY, id);
  localStorage.setItem(MASTER_PASS_KEY, pass);
}

