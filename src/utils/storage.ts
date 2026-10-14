import type { AppState, QuickTag } from '../types';
import { decompressStateFromUrl } from './urlState';

export const DEFAULT_INDIAN_TAGS: QuickTag[] = [
  { id: 'tag-maid', label: 'Maid Salary', icon: '🧹' },
  { id: 'tag-cook', label: 'Cook', icon: '👨‍🍳' },
  { id: 'tag-wifi', label: 'Wi-Fi Bill', icon: '📶' },
  { id: 'tag-zepto', label: 'Zepto / Blinkit', icon: '🛒' },
  { id: 'tag-bijli', label: 'Electricity (Bijli)', icon: '⚡' },
  { id: 'tag-rent', label: 'Flat Rent', icon: '🏠' },
  { id: 'tag-swiggy', label: 'Swiggy / Zomato', icon: '🍔' },
  { id: 'tag-water', label: 'Water Can (20L)', icon: '💧' },
  { id: 'tag-cylinder', label: 'LPG Gas Cylinder', icon: '🔥' },
  { id: 'tag-party', label: 'Weekend Chill', icon: '🍷' },
];

export const DEMO_STATE: AppState = {
  members: [
    {
      id: 'm-1',
      name: 'Kabir',
      upiId: 'kabir@okhdfcbank',
      avatarColor: '#ff003b',
    },
    {
      id: 'm-2',
      name: 'Aman',
      upiId: 'aman@apl',
      avatarColor: '#f59e0b',
    },
    {
      id: 'm-3',
      name: 'Rohan',
      upiId: 'rohan@ybl',
      avatarColor: '#ec4899',
    },
  ],
  expenses: [
    {
      id: 'exp-1',
      title: 'Airtel Fiber 300 Mbps',
      totalAmount: 1199,
      paidById: 'm-1', // Kabir paid
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      tag: 'Wi-Fi Bill',
      splitType: 'EQUAL',
      splits: [
        { memberId: 'm-1', amount: 399.66 },
        { memberId: 'm-2', amount: 399.67 },
        { memberId: 'm-3', amount: 399.67 },
      ],
    },
    {
      id: 'exp-2',
      title: 'Blinkit Morning Dairy & Eggs',
      totalAmount: 650,
      paidById: 'm-2', // Aman paid
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      tag: 'Zepto / Blinkit',
      splitType: 'CUSTOM',
      splits: [
        { memberId: 'm-1', amount: 200, note: 'Bread & Butter' },
        { memberId: 'm-2', amount: 250, note: 'Greek Yogurt' },
        { memberId: 'm-3', amount: 200, note: 'Eggs & Milk' },
      ],
      customNote: 'Aman ordered breakfast items',
    },
    {
      id: 'exp-3',
      title: 'Kamla Didi (Maid Salary)',
      totalAmount: 3000,
      paidById: 'm-3', // Rohan paid
      date: new Date().toISOString(),
      tag: 'Maid Salary',
      splitType: 'EQUAL',
      splits: [
        { memberId: 'm-1', amount: 1000 },
        { memberId: 'm-2', amount: 1000 },
        { memberId: 'm-3', amount: 1000 },
      ],
    },
  ],
  settledTransactions: [],
  customTags: [],
};

const STORAGE_KEY = 'kharchasplit_v1_data';

export function loadInitialState(): AppState {
  // First check if a shared URL state exists in window.location.hash
  const urlState = decompressStateFromUrl();
  if (urlState) {
    saveStateToLocalStorage(urlState);
    return urlState;
  }

  // Next check localStorage
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as AppState;
      if (parsed && Array.isArray(parsed.members) && Array.isArray(parsed.expenses)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load state from localStorage:', err);
  }

  // Fallback to initial demo state
  return DEMO_STATE;
}

export function saveStateToLocalStorage(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save state to localStorage:', err);
  }
}
