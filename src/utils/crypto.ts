/**
 * Cryptographic security utilities for KharchaSplit
 * Uses native Web Crypto API (SubtleCrypto) for salted password hashing and timing-safe verification.
 * Complies with OWASP and zero-server security best practices.
 */

const MASTER_SALT_KEY = 'kharchasplit_master_salt';
const MASTER_HASH_KEY = 'kharchasplit_master_hash';
const MASTER_LEGACY_ID_KEY = 'kharchasplit_master_id';
const MASTER_LEGACY_PASS_KEY = 'kharchasplit_master_pass';
const ADMIN_SESSION_TOKEN_KEY = 'kharchasplit_admin_token';
const ADMIN_SESSION_EXPIRY_KEY = 'kharchasplit_admin_expiry';
const ADMIN_ATTEMPTS_KEY = 'kharchasplit_admin_attempts';
const ADMIN_LOCKOUT_KEY = 'kharchasplit_admin_lockout';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes lockout
const SESSION_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hour session timeout

/**
 * Converts ArrayBuffer to Hex string
 */
function bufferToHex(buffer: ArrayBuffer): string {
  const byteArray = new Uint8Array(buffer);
  return Array.from(byteArray)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Converts Hex string to Uint8Array
 */
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Constant-time byte comparison to prevent side-channel timing attacks
 */
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Generates a cryptographically secure random salt (32 bytes hex)
 */
export function generateSalt(): string {
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);
  return bufferToHex(randomBytes.buffer);
}

/**
 * Hashes a password with salt using PBKDF2-SHA256 (100,000 iterations)
 */
export async function hashPasswordWithSalt(password: string, saltHex: string): Promise<string> {
  const enc = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  const saltBytes = hexToBytes(saltHex);
  const derivedKey = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBytes as unknown as BufferSource,
      iterations: 100000,
      hash: 'SHA-256',
    },
    passwordKey,
    256
  );

  return bufferToHex(derivedKey);
}

/**
 * Checks if a master password has already been initialized
 */
export function isMasterPasswordSet(): boolean {
  try {
    const hasHash = !!localStorage.getItem(MASTER_HASH_KEY);
    if (hasHash) return true;

    // Check if legacy plaintext password exists to migrate
    const legacyPass = localStorage.getItem(MASTER_LEGACY_PASS_KEY);
    return !!legacyPass;
  } catch {
    return false;
  }
}

/**
 * Initializes or updates the master password securely with a salted hash
 */
export async function setMasterPassword(password: string): Promise<boolean> {
  if (!password || password.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }

  const salt = generateSalt();
  const hash = await hashPasswordWithSalt(password, salt);

  try {
    localStorage.setItem(MASTER_SALT_KEY, salt);
    localStorage.setItem(MASTER_HASH_KEY, hash);
    // Remove legacy plaintext password if it was there
    localStorage.removeItem(MASTER_LEGACY_PASS_KEY);
    localStorage.removeItem(MASTER_LEGACY_ID_KEY);
    return true;
  } catch (err) {
    console.error('Failed to save master credentials securely:', err);
    return false;
  }
}

/**
 * Rate Limiting State & Lockout Verification
 */
export interface RateLimitStatus {
  isLocked: boolean;
  remainingSeconds: number;
  attemptsLeft: number;
}

export function getRateLimitStatus(): RateLimitStatus {
  try {
    const lockoutUntil = parseInt(localStorage.getItem(ADMIN_LOCKOUT_KEY) || '0', 10);
    const now = Date.now();

    if (lockoutUntil > now) {
      return {
        isLocked: true,
        remainingSeconds: Math.ceil((lockoutUntil - now) / 1000),
        attemptsLeft: 0,
      };
    }

    // Lockout expired, reset attempts if needed
    if (lockoutUntil > 0) {
      localStorage.removeItem(ADMIN_LOCKOUT_KEY);
      localStorage.removeItem(ADMIN_ATTEMPTS_KEY);
    }

    const failedAttempts = parseInt(localStorage.getItem(ADMIN_ATTEMPTS_KEY) || '0', 10);
    return {
      isLocked: false,
      remainingSeconds: 0,
      attemptsLeft: Math.max(0, MAX_LOGIN_ATTEMPTS - failedAttempts),
    };
  } catch {
    return { isLocked: false, remainingSeconds: 0, attemptsLeft: MAX_LOGIN_ATTEMPTS };
  }
}

function recordFailedAttempt(): RateLimitStatus {
  try {
    const current = parseInt(localStorage.getItem(ADMIN_ATTEMPTS_KEY) || '0', 10) + 1;
    localStorage.setItem(ADMIN_ATTEMPTS_KEY, String(current));

    if (current >= MAX_LOGIN_ATTEMPTS) {
      const lockUntil = Date.now() + LOCKOUT_DURATION_MS;
      localStorage.setItem(ADMIN_LOCKOUT_KEY, String(lockUntil));
      return {
        isLocked: true,
        remainingSeconds: Math.ceil(LOCKOUT_DURATION_MS / 1000),
        attemptsLeft: 0,
      };
    }

    return {
      isLocked: false,
      remainingSeconds: 0,
      attemptsLeft: MAX_LOGIN_ATTEMPTS - current,
    };
  } catch {
    return { isLocked: false, remainingSeconds: 0, attemptsLeft: 0 };
  }
}

function resetFailedAttempts(): void {
  try {
    localStorage.removeItem(ADMIN_ATTEMPTS_KEY);
    localStorage.removeItem(ADMIN_LOCKOUT_KEY);
  } catch {
    // ignore
  }
}

/**
 * Verifies master password against salted hash with rate-limiting and timing-safe check
 */
export async function verifyMasterPassword(password: string): Promise<{ success: boolean; rateLimit: RateLimitStatus }> {
  const rateLimit = getRateLimitStatus();
  if (rateLimit.isLocked) {
    return { success: false, rateLimit };
  }

  try {
    const storedSalt = localStorage.getItem(MASTER_SALT_KEY);
    const storedHash = localStorage.getItem(MASTER_HASH_KEY);

    // If hashed credentials exist, verify securely
    if (storedSalt && storedHash) {
      const computedHash = await hashPasswordWithSalt(password, storedSalt);
      const isMatch = constantTimeCompare(computedHash, storedHash);

      if (isMatch) {
        resetFailedAttempts();
        issueAdminSession();
        return { success: true, rateLimit: getRateLimitStatus() };
      }
    } else {
      // Legacy plaintext migration check: if legacy exists, verify and auto-upgrade to salt+hash
      const legacyPass = localStorage.getItem(MASTER_LEGACY_PASS_KEY);
      if (legacyPass && password === legacyPass) {
        // Auto-upgrade to salted PBKDF2 hash
        await setMasterPassword(password);
        resetFailedAttempts();
        issueAdminSession();
        return { success: true, rateLimit: getRateLimitStatus() };
      }
    }

    // Failed attempt
    const newRateLimit = recordFailedAttempt();
    return { success: false, rateLimit: newRateLimit };
  } catch (err) {
    console.error('Password verification error:', err);
    return { success: false, rateLimit: recordFailedAttempt() };
  }
}

/**
 * Cryptographic Admin Session Token
 */
function issueAdminSession(): string {
  const tokenBytes = new Uint8Array(32);
  crypto.getRandomValues(tokenBytes);
  const token = bufferToHex(tokenBytes.buffer);
  const expiry = Date.now() + SESSION_DURATION_MS;

  try {
    sessionStorage.setItem(ADMIN_SESSION_TOKEN_KEY, token);
    sessionStorage.setItem(ADMIN_SESSION_EXPIRY_KEY, String(expiry));
  } catch {
    // ignore
  }
  return token;
}

export function isAdminAuthenticated(): boolean {
  try {
    const token = sessionStorage.getItem(ADMIN_SESSION_TOKEN_KEY);
    const expiry = parseInt(sessionStorage.getItem(ADMIN_SESSION_EXPIRY_KEY) || '0', 10);
    if (token && expiry > Date.now()) {
      return true;
    }
    // Expired or missing
    clearAdminSession();
    return false;
  } catch {
    return false;
  }
}

export function clearAdminSession(): void {
  try {
    sessionStorage.removeItem(ADMIN_SESSION_TOKEN_KEY);
    sessionStorage.removeItem(ADMIN_SESSION_EXPIRY_KEY);
    sessionStorage.removeItem('kharchasplit_master_auth');
  } catch {
    // ignore
  }
}
