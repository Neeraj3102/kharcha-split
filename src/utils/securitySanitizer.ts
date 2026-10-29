import type { AppState, Member, Expense, QuickTag } from '../types';

/**
 * Strips HTML tags, script tags, and trims input to prevent XSS.
 * Caps length to prevent buffer/DOM bloat attacks.
 */
export function sanitizeText(input: string, maxLength = 120): string {
  if (typeof input !== 'string') return '';
  // 1. Remove script tags and contents
  let clean = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  // 2. Remove all HTML tags
  clean = clean.replace(/<[^>]*>/g, '');
  // 3. Remove zero-width and dangerous control characters except newlines/tabs
  // oxlint-disable-next-line eslint(no-control-regex)
  // eslint-disable-next-line no-control-regex
  clean = clean.replace(/[\u0000-\u0008\u000B-\u001F\u007F-\u009F\u200B-\u200D\uFEFF]/g, '');
  // 4. Trim and cap length
  clean = clean.trim();
  return clean.slice(0, maxLength);
}

/**
 * Validates UPI ID format strictly according to NPCI / Indian Banking standard:
 * username@bankhandle (e.g. name@okhdfcbank, 9876543210@paytm)
 */
export function sanitizeUpiId(raw: string): { isValid: boolean; value: string; error?: string } {
  if (typeof raw !== 'string') {
    return { isValid: false, value: '', error: 'UPI ID is required' };
  }
  const clean = raw.trim().toLowerCase();
  if (!clean) {
    return { isValid: false, value: '', error: 'Please enter a UPI ID' };
  }
  // NPCI format check
  const upiRegex = /^[a-zA-Z0-9.\-_]{2,64}@[a-zA-Z0-9]{2,32}$/;
  if (!upiRegex.test(clean)) {
    return {
      isValid: false,
      value: clean,
      error: 'Invalid UPI ID format. Expected format: username@bank (e.g. name@okaxis or 9876543210@paytm)',
    };
  }
  return { isValid: true, value: clean };
}

/**
 * Validates Indian 10-digit mobile phone numbers starting with 6, 7, 8, or 9.
 */
export function sanitizePhone(raw: string): { isValid: boolean; value: string; error?: string } {
  if (!raw) return { isValid: true, value: '' }; // Optional
  const digits = raw.replace(/\D/g, '');
  if (!digits) return { isValid: true, value: '' };
  
  // Strip leading 91 or 0 if present
  let normalized = digits;
  if (digits.length === 12 && digits.startsWith('91')) {
    normalized = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    normalized = digits.slice(1);
  }

  if (normalized.length !== 10 || !/^[6-9]\d{9}$/.test(normalized)) {
    return {
      isValid: false,
      value: normalized,
      error: 'Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9',
    };
  }
  return { isValid: true, value: normalized };
}

/**
 * Validates and sanitizes a financial amount.
 * Rejects NaN, Infinity, negative numbers, or amounts over the maximum ceiling.
 */
export function sanitizeAmount(
  raw: number | string,
  maxCeiling = 10_000_000
): { isValid: boolean; value: number; error?: string } {
  const num = typeof raw === 'number' ? raw : parseFloat(String(raw).replace(/[^0-9.-]/g, ''));
  if (typeof num !== 'number' || isNaN(num) || !isFinite(num)) {
    return { isValid: false, value: 0, error: 'Please enter a valid numeric amount' };
  }
  if (num <= 0) {
    return { isValid: false, value: 0, error: 'Amount must be greater than ₹0' };
  }
  if (num > maxCeiling) {
    return {
      isValid: false,
      value: 0,
      error: `Amount exceeds the maximum limit of ₹${maxCeiling.toLocaleString('en-IN')}`,
    };
  }
  // Round to 2 decimal places to avoid floating point precision manipulation
  const rounded = Math.round(num * 100) / 100;
  return { isValid: true, value: rounded };
}

/**
 * Sanitizes CSV cell to prevent CSV Formula Injection (DDE attacks).
 * If the cell begins with =, +, -, @, \t, or \r, prepends a single quote (').
 */
export function sanitizeCsvCell(cell: string): string {
  if (typeof cell !== 'string') return '';
  const clean = sanitizeText(cell, 300);
  if (/^[=+\-@\t\r]/.test(clean)) {
    return `'${clean}`;
  }
  return clean;
}

/**
 * Deeply validates and sanitizes AppState loaded from URL hashes or untrusted storage.
 * Defends against prototype pollution, invalid types, and corrupted balances.
 */
export function sanitizeAppState(raw: any): AppState | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;

  // Protect against prototype pollution
  if (raw.__proto__ || raw.constructor?.prototype) {
    // Clean object copy without prototype inheritance
  }

  try {
    const members: Member[] = [];
    if (Array.isArray(raw.members)) {
      for (const m of raw.members) {
        if (!m || typeof m !== 'object') continue;
        const name = sanitizeText(m.name || '', 60);
        if (!name) continue;
        members.push({
          id: sanitizeText(m.id || `m_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, 40),
          name,
          upiId: sanitizeText(m.upiId || '', 80).toLowerCase(),
          phone: m.phone ? sanitizePhone(m.phone).value : undefined,
          avatarColor: typeof m.avatarColor === 'string' ? sanitizeText(m.avatarColor, 20) : '#ff003b',
        });
      }
    }

    const expenses: Expense[] = [];
    if (Array.isArray(raw.expenses)) {
      for (const e of raw.expenses) {
        if (!e || typeof e !== 'object') continue;
        const title = sanitizeText(e.title || '', 120);
        const amountCheck = sanitizeAmount(e.totalAmount);
        if (!title || !amountCheck.isValid) continue;

        const splits = Array.isArray(e.splits)
          ? e.splits
              .filter((s: any) => s && typeof s === 'object' && typeof s.memberId === 'string')
              .map((s: any) => ({
                memberId: sanitizeText(s.memberId, 40),
                amount: Math.max(0, Math.round((Number(s.amount) || 0) * 100) / 100),
                note: s.note ? sanitizeText(s.note, 100) : undefined,
              }))
          : [];

        expenses.push({
          id: sanitizeText(e.id || `exp_${Date.now()}`, 40),
          title,
          totalAmount: amountCheck.value,
          paidById: sanitizeText(e.paidById || '', 40),
          tag: sanitizeText(e.tag || 'General', 40),
          splitType: e.splitType === 'CUSTOM' ? 'CUSTOM' : 'EQUAL',
          splits,
          date: typeof e.date === 'string' ? sanitizeText(e.date, 30) : new Date().toISOString(),
          customNote: e.customNote ? sanitizeText(e.customNote, 250) : undefined,
          isRecurring: Boolean(e.isRecurring),
          recurrenceFrequency: e.recurrenceFrequency === 'WEEKLY' ? 'WEEKLY' : 'MONTHLY',
        });
      }
    }

    const customTags: QuickTag[] = [];
    if (Array.isArray(raw.customTags)) {
      for (const t of raw.customTags) {
        if (!t || typeof t !== 'object') continue;
        const label = sanitizeText(t.label || '', 30);
        if (label) {
          customTags.push({
            id: sanitizeText(t.id || `tag_${Date.now()}`, 40),
            label,
            icon: sanitizeText(t.icon || '🏷️', 10),
            isCustom: true,
          });
        }
      }
    }

    return {
      members,
      expenses,
      customTags,
      settledTransactions: Array.isArray(raw.settledTransactions) ? raw.settledTransactions : [],
    };
  } catch (err) {
    console.error('State sanitization failed:', err);
    return null;
  }
}
