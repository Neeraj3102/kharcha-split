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

const DEFAULT_FIREBASE_CONFIG: FirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

// Default config from environment variables or project defaults
export function getStoredFirebaseConfig(): FirebaseConfig | null {
  // 1. Check localStorage for admin overrides
  try {
    const saved = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as FirebaseConfig;
      if (parsed.apiKey && parsed.databaseURL) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to parse Firebase config:', err);
  }

  // 2. Fallback to project defaults from environment variables
  if (DEFAULT_FIREBASE_CONFIG.apiKey && DEFAULT_FIREBASE_CONFIG.databaseURL) {
    return DEFAULT_FIREBASE_CONFIG;
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

export interface SavedRoom {
  roomId: string;
  roomName: string;
  joinedAt: string;
  lastVisitedAt: string;
  myMemberId?: string;
  myMemberName?: string;
  isAdmin?: boolean;
}

const SAVED_ROOMS_KEY = 'kharchasplit_saved_rooms';
const MY_MEMBER_PREFIX = 'kharchasplit_my_member_';

/**
 * Returns list of rooms this device has joined or created
 */
export function getSavedRooms(): SavedRoom[] {
  try {
    const raw = localStorage.getItem(SAVED_ROOMS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Saves or updates a room in the device's saved rooms list
 */
export function addSavedRoom(
  roomId: string,
  roomName: string,
  myMemberId?: string,
  myMemberName?: string,
  isAdmin?: boolean
): void {
  try {
    const cleanId = roomId.trim().toUpperCase();
    const rooms = getSavedRooms().filter((r) => r.roomId !== cleanId);
    const existing = getSavedRooms().find((r) => r.roomId === cleanId);

    const now = new Date().toISOString();
    const newRoom: SavedRoom = {
      roomId: cleanId,
      roomName: roomName || existing?.roomName || `Flat ${cleanId}`,
      joinedAt: existing?.joinedAt || now,
      lastVisitedAt: now,
      myMemberId: myMemberId || existing?.myMemberId,
      myMemberName: myMemberName || existing?.myMemberName,
      isAdmin: isAdmin !== undefined ? isAdmin : existing?.isAdmin,
    };

    rooms.unshift(newRoom);
    localStorage.setItem(SAVED_ROOMS_KEY, JSON.stringify(rooms.slice(0, 20))); // Keep up to 20 saved flats
  } catch {
    // ignore
  }
}

/**
 * Removes a room from the saved flats list
 */
export function removeSavedRoom(roomId: string): void {
  try {
    const cleanId = roomId.trim().toUpperCase();
    const rooms = getSavedRooms().filter((r) => r.roomId !== cleanId);
    localStorage.setItem(SAVED_ROOMS_KEY, JSON.stringify(rooms));
  } catch {
    // ignore
  }
}

/**
 * Device identity helpers: Track who "I am" in a given room on this device
 */
export function getMyMemberId(roomId: string): string | null {
  try {
    return localStorage.getItem(`${MY_MEMBER_PREFIX}${roomId.trim().toUpperCase()}`);
  } catch {
    return null;
  }
}

export function setMyMemberId(roomId: string, memberId: string, memberName?: string): void {
  try {
    const cleanId = roomId.trim().toUpperCase();
    localStorage.setItem(`${MY_MEMBER_PREFIX}${cleanId}`, memberId);
    // Update in saved rooms as well
    const rooms = getSavedRooms();
    const target = rooms.find((r) => r.roomId === cleanId);
    if (target) {
      target.myMemberId = memberId;
      if (memberName) target.myMemberName = memberName;
      localStorage.setItem(SAVED_ROOMS_KEY, JSON.stringify(rooms));
    }
  } catch {
    // ignore
  }
}

export function clearMyMemberId(roomId: string): void {
  try {
    localStorage.removeItem(`${MY_MEMBER_PREFIX}${roomId.trim().toUpperCase()}`);
  } catch {
    // ignore
  }
}

export function saveActiveRoomId(roomId: string, roomName: string): void {
  try {
    const cleanId = roomId.trim().toUpperCase();
    localStorage.setItem(ACTIVE_ROOM_KEY, JSON.stringify({ roomId: cleanId, roomName }));
    window.location.hash = `room=${cleanId}`;
    addSavedRoom(cleanId, roomName);
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

const ROOM_ADMIN_PREFIX = 'kharchasplit_room_admin_';

export interface RoomMeta {
  id: string;
  name: string;
  adminKey?: string;
  adminMemberId?: string;
  adminMemberName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export function saveRoomAdminKey(roomId: string, adminKey: string): void {
  try {
    localStorage.setItem(`${ROOM_ADMIN_PREFIX}${roomId.trim().toUpperCase()}`, adminKey);
    // Also mark as admin in saved rooms
    const rooms = getSavedRooms();
    const r = rooms.find((x) => x.roomId === roomId.trim().toUpperCase());
    if (r) {
      r.isAdmin = true;
      localStorage.setItem(SAVED_ROOMS_KEY, JSON.stringify(rooms));
    }
  } catch {
    // ignore
  }
}

export function getRoomAdminKey(roomId: string): string | null {
  try {
    return localStorage.getItem(`${ROOM_ADMIN_PREFIX}${roomId.trim().toUpperCase()}`);
  } catch {
    return null;
  }
}

export function clearRoomAdminKey(roomId: string): void {
  try {
    const cleanId = roomId.trim().toUpperCase();
    localStorage.removeItem(`${ROOM_ADMIN_PREFIX}${cleanId}`);
    const rooms = getSavedRooms();
    const r = rooms.find((x) => x.roomId === cleanId);
    if (r) {
      r.isAdmin = false;
      localStorage.setItem(SAVED_ROOMS_KEY, JSON.stringify(rooms));
    }
  } catch {
    // ignore
  }
}

/**
 * Checks if current user is the admin of the room
 */
export function isUserRoomAdmin(
  roomId: string,
  roomMeta?: RoomMeta | null,
  currentMemberId?: string | null
): boolean {
  if (!roomId) return true; // Offline local mode has full admin permissions
  const cleanId = roomId.trim().toUpperCase();

  // 1. If roomMeta specifies an adminMemberId, check if current user matches
  if (roomMeta?.adminMemberId) {
    const myId = currentMemberId || getMyMemberId(cleanId);
    if (myId && myId === roomMeta.adminMemberId) {
      return true;
    }
  }

  // 2. Check stored admin key on device
  const savedKey = getRoomAdminKey(cleanId);
  if (!savedKey) return false;
  if (roomMeta?.adminKey) {
    return savedKey === roomMeta.adminKey;
  }
  return true;
}

/**
 * Transfer admin authority to another flatmate in the room
 */
export async function transferRoomAdmin(
  roomId: string,
  newAdminMemberId: string,
  newAdminMemberName: string
): Promise<boolean> {
  const cleanId = roomId.trim().toUpperCase();
  const db = getFirebaseDb();
  const newAdminKey = `adm_${Math.random().toString(36).slice(2, 9)}_${Date.now().toString(36)}`;

  if (db) {
    try {
      const metaRef = ref(db, `kharcha_rooms/${cleanId}/meta`);
      await update(metaRef, {
        adminMemberId: newAdminMemberId,
        adminMemberName: newAdminMemberName,
        adminKey: newAdminKey,
        updatedAt: new Date().toISOString(),
      });
    } catch (e) {
      console.error('Failed to transfer room admin via Firebase:', e);
      return false;
    }
  }

  // Clear current device's admin key so authority is relinquished
  clearRoomAdminKey(cleanId);
  return true;
}

/**
 * Claim admin authority on this device using Admin PIN or known Admin Key
 */
export async function claimRoomAdminKey(roomId: string, enteredKeyOrPin: string): Promise<boolean> {
  const currentPin = localStorage.getItem('kharchasplit_admin_pin') || '3102';
  const cleanInput = enteredKeyOrPin.trim();
  const db = getFirebaseDb();

  if (db) {
    try {
      const metaRef = ref(db, `kharcha_rooms/${roomId}/meta`);
      const snap = await get(metaRef);
      const meta: RoomMeta = snap.val() || {};

      if (meta.adminKey && (cleanInput === meta.adminKey || cleanInput === currentPin)) {
        saveRoomAdminKey(roomId, meta.adminKey);
        return true;
      }

      if (!meta.adminKey && (cleanInput === currentPin || cleanInput.length >= 4)) {
        const newKey = `adm_${Math.random().toString(36).slice(2, 9)}_${Date.now().toString(36)}`;
        saveRoomAdminKey(roomId, newKey);
        await update(metaRef, { adminKey: newKey });
        return true;
      }
    } catch (e) {
      console.error('Failed to claim admin key via Firebase:', e);
    }
  }

  if (cleanInput === currentPin) {
    const newKey = `adm_${Math.random().toString(36).slice(2, 9)}_${Date.now().toString(36)}`;
    saveRoomAdminKey(roomId, newKey);
    setDeviceApproved(roomId, getDeviceId(), 'Room Admin');
    return true;
  }

  return false;
}

const DEVICE_ID_KEY = 'kharchasplit_device_id';

export function getDeviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = 'dev_' + Math.random().toString(36).slice(2, 9) + '_' + Date.now().toString(36);
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    return 'dev_anon_' + Date.now().toString(36);
  }
}

export interface JoinRequest {
  id: string;
  roomId: string;
  deviceId: string;
  name: string;
  phone?: string;
  requestedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  respondedAt?: string;
}

/**
 * Checks if this device is approved to access the room
 */
export async function checkDeviceApproved(roomId: string, deviceId = getDeviceId()): Promise<boolean> {
  if (!roomId) return true;
  const cleanId = roomId.trim().toUpperCase();

  // If local admin key matches, always approved
  if (isUserRoomAdmin(cleanId)) return true;

  const db = getFirebaseDb();
  if (!db) return true; // offline mode

  try {
    const approvedRef = ref(db, `kharcha_rooms/${cleanId}/approvedDevices/${deviceId}`);
    const snap = await get(approvedRef);
    return snap.exists();
  } catch (err) {
    console.error('Failed to check device approval:', err);
    return false;
  }
}

/**
 * Register a device as approved (e.g. when room created or request accepted)
 */
export async function setDeviceApproved(
  roomId: string,
  deviceId = getDeviceId(),
  name = 'Flatmate'
): Promise<boolean> {
  const cleanId = roomId.trim().toUpperCase();
  const db = getFirebaseDb();
  if (!db) return true;

  try {
    const approvedRef = ref(db, `kharcha_rooms/${cleanId}/approvedDevices/${deviceId}`);
    await set(approvedRef, {
      approvedAt: new Date().toISOString(),
      name,
    });
    return true;
  } catch (err) {
    console.error('Failed to set device approved:', err);
    return false;
  }
}

/**
 * Submit a join request from a new user to the room admin
 */
export async function requestJoinRoom(
  roomId: string,
  name: string,
  phone?: string
): Promise<{ success: boolean; requestId: string }> {
  const cleanId = roomId.trim().toUpperCase();
  const deviceId = getDeviceId();
  const db = getFirebaseDb();
  const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  const requestPayload: JoinRequest = {
    id: requestId,
    roomId: cleanId,
    deviceId,
    name: name.trim(),
    phone: phone?.trim() || '',
    requestedAt: new Date().toISOString(),
    status: 'PENDING',
  };

  if (db) {
    try {
      const reqRef = ref(db, `kharcha_rooms/${cleanId}/joinRequests/${requestId}`);
      await set(reqRef, cleanForFirebase(requestPayload));
    } catch (e) {
      console.error('Failed to submit join request:', e);
      return { success: false, requestId };
    }
  }

  // Remember latest request ID on device
  try {
    localStorage.setItem(`kharchasplit_req_${cleanId}`, requestId);
  } catch {
    // ignore
  }

  return { success: true, requestId };
}

/**
 * Listen for approvals for current device
 */
export function subscribeToDeviceApproval(
  roomId: string,
  onStatusChange: (status: 'APPROVED' | 'PENDING' | 'REJECTED' | 'NONE') => void
): Unsubscribe | null {
  const cleanId = roomId.trim().toUpperCase();
  const deviceId = getDeviceId();
  const db = getFirebaseDb();
  if (!db) {
    onStatusChange('APPROVED');
    return null;
  }

  const roomRef = ref(db, `kharcha_rooms/${cleanId}`);

  return onValue(roomRef, (snapshot) => {
    const room = snapshot.val();
    if (!room) {
      onStatusChange('NONE');
      return;
    }

    // 1. Is device in approvedDevices?
    if (room.approvedDevices && room.approvedDevices[deviceId]) {
      onStatusChange('APPROVED');
      return;
    }

    // 2. Check join requests for this device
    if (room.joinRequests) {
      const requests = safeArray<JoinRequest>(room.joinRequests);
      const myReqs = requests.filter((r) => r.deviceId === deviceId);
      if (myReqs.length > 0) {
        // Find latest
        myReqs.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
        const latest = myReqs[0];
        if (latest.status === 'APPROVED') {
          onStatusChange('APPROVED');
          return;
        } else if (latest.status === 'PENDING') {
          onStatusChange('PENDING');
          return;
        } else if (latest.status === 'REJECTED') {
          onStatusChange('REJECTED');
          return;
        }
      }
    }

    onStatusChange('NONE');
  });
}

/**
 * Super Admin or Room Admin: Subscribe to incoming join requests
 */
export function subscribeToJoinRequests(
  roomId: string,
  onUpdate: (requests: JoinRequest[]) => void
): Unsubscribe | null {
  const cleanId = roomId.trim().toUpperCase();
  const db = getFirebaseDb();
  if (!db) return null;

  const reqRef = ref(db, `kharcha_rooms/${cleanId}/joinRequests`);
  return onValue(reqRef, (snapshot) => {
    const val = snapshot.val();
    const list = safeArray<JoinRequest>(val);
    onUpdate(list);
  });
}

/**
 * Room Admin: Approve a join request
 */
export async function approveJoinRequest(
  roomId: string,
  requestId: string,
  deviceId: string,
  name: string
): Promise<boolean> {
  const cleanId = roomId.trim().toUpperCase();
  const db = getFirebaseDb();
  if (!db) return false;

  try {
    // 1. Add device to approvedDevices
    await set(ref(db, `kharcha_rooms/${cleanId}/approvedDevices/${deviceId}`), {
      approvedAt: new Date().toISOString(),
      name,
    });

    // 2. Update request status to APPROVED
    await update(ref(db, `kharcha_rooms/${cleanId}/joinRequests/${requestId}`), {
      status: 'APPROVED',
      respondedAt: new Date().toISOString(),
    });

    return true;
  } catch (err) {
    console.error('Failed to approve join request:', err);
    return false;
  }
}

/**
 * Room Admin: Reject a join request
 */
export async function rejectJoinRequest(
  roomId: string,
  requestId: string
): Promise<boolean> {
  const cleanId = roomId.trim().toUpperCase();
  const db = getFirebaseDb();
  if (!db) return false;

  try {
    await update(ref(db, `kharcha_rooms/${cleanId}/joinRequests/${requestId}`), {
      status: 'REJECTED',
      respondedAt: new Date().toISOString(),
    });
    return true;
  } catch (err) {
    console.error('Failed to reject join request:', err);
    return false;
  }
}

/**
 * Safely converts any value from Firebase RTDB into an array
 * (Handles Firebase RTDB turning arrays into objects with indexed keys)
 */
export function safeArray<T>(val: any): T[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.filter((item) => item !== null && item !== undefined);
  if (typeof val === 'object') {
    return Object.values(val).filter((item) => item !== null && item !== undefined) as T[];
  }
  return [];
}

/**
 * Subscribes to live room updates via WebSockets.
 * Calls onUpdate whenever any flatmate adds an expense, settles, or edits flatmates!
 */
export function subscribeToRoomState(
  roomId: string,
  onUpdate: (state: AppState, meta?: RoomMeta) => void,
  onError?: (err: Error) => void
): Unsubscribe | null {
  const db = getFirebaseDb();
  if (!db) return null;

  const roomRef = ref(db, `kharcha_rooms/${roomId}`);

  return onValue(
    roomRef,
    (snapshot) => {
      const roomData = snapshot.val();
      if (roomData) {
        const val = roomData.state || {};
        const meta: RoomMeta = roomData.meta || {
          id: roomId,
          name: `Flat ${roomId}`,
          updatedAt: new Date().toISOString(),
        };

        onUpdate(
          {
            members: safeArray(val.members),
            expenses: safeArray(val.expenses),
            settledTransactions: safeArray(val.settledTransactions),
            customTags: safeArray(val.customTags),
          },
          meta
        );
      } else {
        // Fresh or empty room
        onUpdate(
          {
            members: [],
            expenses: [],
            settledTransactions: [],
            customTags: [],
          },
          { id: roomId, name: `Flat ${roomId}` }
        );
      }
    },
    (error) => {
      console.error('Firebase Room Sync Error:', error);
      if (onError) onError(error);
    }
  );
}

/**
 * Deep-clean payload for Firebase Realtime Database
 * Strips all `undefined` keys because Firebase SDK strictly throws:
 * "Error: set failed: value argument contains undefined in property..."
 */
export function cleanForFirebase<T>(obj: T): T {
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch (err) {
    console.error('Failed to sanitize object for Firebase:', err);
    return obj;
  }
}

/**
 * Pushes the updated state to the shared Firebase Realtime Room
 */
export async function pushRoomState(
  roomId: string,
  state: AppState,
  roomName?: string,
  adminKey?: string
): Promise<boolean> {
  const db = getFirebaseDb();
  if (!db) return false;

  try {
    const sanitizedState = cleanForFirebase({
      members: state.members || [],
      expenses: state.expenses || [],
      settledTransactions: state.settledTransactions || [],
      customTags: state.customTags || [],
    });

    const metaRef = ref(db, `kharcha_rooms/${roomId}/meta`);
    const existingMetaSnap = await get(metaRef);
    const existingMeta = existingMetaSnap.val() || {};

    const finalAdminKey = existingMeta.adminKey || adminKey || getRoomAdminKey(roomId);

    await update(metaRef, {
      id: roomId,
      name: roomName || existingMeta.name || `Flat ${roomId}`,
      updatedAt: new Date().toISOString(),
      ...(finalAdminKey ? { adminKey: finalAdminKey } : {}),
      ...(existingMeta.adminMemberId ? { adminMemberId: existingMeta.adminMemberId } : {}),
      ...(existingMeta.adminMemberName ? { adminMemberName: existingMeta.adminMemberName } : {}),
    });

    const stateRef = ref(db, `kharcha_rooms/${roomId}/state`);
    await set(stateRef, sanitizedState);

    if (finalAdminKey) {
      await set(ref(db, `kharcha_rooms/${roomId}/approvedDevices/${getDeviceId()}`), {
        approvedAt: new Date().toISOString(),
        name: 'Room Admin',
      });
    }
    return true;
  } catch (err) {
    console.error('Failed to sync room state to Firebase:', err);
    return false;
  }
}

/**
 * Room Admin / Super Admin: Delete a specific settled transaction from any room
 */
export async function deleteSettledTransactionFromRoom(
  roomId: string,
  settledId: string
): Promise<boolean> {
  const db = getFirebaseDb();
  if (!db) return false;

  try {
    const cleanId = roomId.trim().toUpperCase();
    const snapshot = await get(ref(db, `kharcha_rooms/${cleanId}/state/settledTransactions`));
    if (snapshot.exists()) {
      const raw = snapshot.val();
      const list = safeArray<any>(raw);
      const filtered = list.filter((s: any) => s && s.id !== settledId);
      await set(ref(db, `kharcha_rooms/${cleanId}/state/settledTransactions`), filtered);
      await update(ref(db, `kharcha_rooms/${cleanId}/meta`), {
        updatedAt: new Date().toISOString(),
      });
      return true;
    }
    return false;
  } catch (err) {
    console.error(`Failed to delete settled transaction ${settledId} from room ${roomId}:`, err);
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
      const normalized: Record<string, FirebaseRoomData> = {};

      Object.entries(data).forEach(([roomId, roomRaw]: [string, any]) => {
        if (roomRaw) {
          const st = roomRaw.state || {};
          normalized[roomId] = {
            meta: roomRaw.meta || {
              id: roomId,
              name: `Flat ${roomId}`,
              updatedAt: new Date().toISOString(),
            },
            state: {
              members: safeArray(st.members),
              expenses: safeArray(st.expenses),
              settledTransactions: safeArray(st.settledTransactions),
              customTags: safeArray(st.customTags),
            },
          };
        }
      });

      onUpdate(normalized);
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
      const raw = snapshot.val();
      const expenses = safeArray<any>(raw);
      const filtered = expenses.filter((e: any) => e && e.id !== expenseId);
      await set(ref(db, `kharcha_rooms/${roomId}/state/expenses`), filtered);
      await update(ref(db, `kharcha_rooms/${roomId}/meta`), {
        updatedAt: new Date().toISOString(),
      });
      return true;
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
      const raw = snapshot.val();
      const members = safeArray<any>(raw);
      const filtered = members.filter((m: any) => m && m.id !== memberId);
      await set(ref(db, `kharcha_rooms/${roomId}/state/members`), filtered);
      await update(ref(db, `kharcha_rooms/${roomId}/meta`), {
        updatedAt: new Date().toISOString(),
      });
      return true;
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

