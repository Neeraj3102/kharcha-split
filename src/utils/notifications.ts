import type { AppNotification } from '../types';

const STORAGE_KEY = 'kharchasplit_notifications';

export function getNotifications(): AppNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveNotifications(notifications: AppNotification[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications.slice(0, 50)));
  } catch {
    // ignore
  }
}

export function createNotification(
  title: string,
  message: string,
  type: AppNotification['type'] = 'INFO'
): AppNotification {
  return {
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title,
    message,
    timestamp: new Date().toISOString(),
    read: false,
    type,
  };
}
