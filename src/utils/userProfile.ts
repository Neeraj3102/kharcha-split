import type { UserProfile, Member } from '../types';

const USER_PROFILE_STORAGE_KEY = 'kharchasplit_user_profile';

export const AVATAR_PALETTE = [
  '#ff003b', // Crimson (The Weeknd)
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#3b82f6', // Blue
  '#f97316', // Orange
];

export function getUserProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem(USER_PROFILE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.name === 'string' && parsed.name.trim()) {
        return {
          name: parsed.name.trim(),
          upiId: typeof parsed.upiId === 'string' ? parsed.upiId.trim() : '',
          phone: typeof parsed.phone === 'string' ? parsed.phone.trim() : '',
          avatarColor: parsed.avatarColor || AVATAR_PALETTE[0],
        };
      }
    }
  } catch (err) {
    console.error('Failed to load user profile from localStorage:', err);
  }
  return null;
}

export function saveUserProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(profile));
  } catch (err) {
    console.error('Failed to save user profile to localStorage:', err);
  }
}

/**
 * Merges stored user profile with the currently linked flatmate member if available
 */
export function getEffectiveUserProfile(
  profile: UserProfile | null,
  linkedMember?: Member | null
): UserProfile {
  if (profile) return profile;

  if (linkedMember) {
    return {
      name: linkedMember.name,
      upiId: linkedMember.upiId,
      phone: linkedMember.phone || '',
      avatarColor: linkedMember.avatarColor || AVATAR_PALETTE[0],
    };
  }

  return {
    name: '',
    upiId: '',
    phone: '',
    avatarColor: AVATAR_PALETTE[0],
  };
}
