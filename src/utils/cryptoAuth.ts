/**
 * Cryptographic Authentication & Rate Limiting Utility
 * Implements PBKDF2-SHA256 password/PIN hashing with unique salts (100,000 rounds)
 * and sliding-window / lockout rate limiting for anti-brute-force defense.
 */

const PBKDF2_ITERATIONS = 100_000;
const HASH_ALGO = 'SHA-256';

/**
 * Generates a cryptographically secure random salt (16 bytes, hex encoded)
 */
export function generateSalt(bytes = 16): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Converts a hex string back to a Uint8Array
 */
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

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
 * Derives a PBKDF2-SHA256 hash from password + salt
 */
async function deriveHash(password: string, saltBytes: Uint8Array): Promise<string> {
  const enc = new TextEncoder();
  const passBytes = enc.encode(password);

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passBytes as unknown as BufferSource,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBytes as unknown as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: HASH_ALGO,
    },
    keyMaterial,
    256
  );

  return bufferToHex(derivedBits);
}

/**
 * Hashes a password or PIN using PBKDF2-SHA256 with a unique random salt.
 * Format: "pbkdf2:100000:<salt_hex>:<hash_hex>"
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = generateSalt(16);
  const saltBytes = hexToBytes(salt);
  const hash = await deriveHash(password, saltBytes);
  return `pbkdf2:${PBKDF2_ITERATIONS}:${salt}:${hash}`;
}

/**
 * Verifies a password against a stored hash or legacy plaintext string.
 * Timing-safe comparison to prevent side-channel timing attacks.
 */
export async function verifyPassword(
  password: string,
  storedHashOrPlain: string
): Promise<{ isValid: boolean; needsRehash?: boolean }> {
  if (!password || !storedHashOrPlain) return { isValid: false, needsRehash: false };

  // If stored in modern PBKDF2 format
  if (storedHashOrPlain.startsWith('pbkdf2:')) {
    const parts = storedHashOrPlain.split(':');
    if (parts.length !== 4) return { isValid: false, needsRehash: false };
    const [, , saltHex, expectedHashHex] = parts;
    const saltBytes = hexToBytes(saltHex);
    const candidateHash = await deriveHash(password, saltBytes);

    // Constant-time comparison
    if (candidateHash.length !== expectedHashHex.length) return { isValid: false, needsRehash: false };
    let diff = 0;
    for (let i = 0; i < candidateHash.length; i++) {
      diff |= candidateHash.charCodeAt(i) ^ expectedHashHex.charCodeAt(i);
    }
    return { isValid: diff === 0, needsRehash: false };
  }

  // Legacy plaintext fallback: verify and flag for re-hashing
  const isValid = password === storedHashOrPlain;
  return { isValid, needsRehash: isValid };
}

/**
 * Client-side Rate Limiter with 15-minute exponential/sliding lockout
 * Defends against brute-forcing room PINs or admin passwords.
 */
export interface RateLimitCheck {
  isLocked: boolean;
  attemptsLeft: number;
  remainingSeconds: number;
  error: string;
}

class SlidingRateLimiter {
  private maxAttempts: number;
  private lockoutDurationMs: number;
  private storagePrefix: string;

  constructor(storagePrefix = 'ks_rl_', maxAttempts = 5, lockoutDurationMs = 15 * 60 * 1000) {
    this.storagePrefix = storagePrefix;
    this.maxAttempts = maxAttempts;
    this.lockoutDurationMs = lockoutDurationMs;
  }

  private getKey(id: string) {
    return `${this.storagePrefix}${id}`;
  }

  check(id: string): RateLimitCheck {
    try {
      const raw = localStorage.getItem(this.getKey(id));
      if (!raw) {
        return { isLocked: false, attemptsLeft: this.maxAttempts, remainingSeconds: 0, error: '' };
      }
      const data = JSON.parse(raw);
      const now = Date.now();

      if (data.lockoutUntil && now < data.lockoutUntil) {
        const remainingSeconds = Math.ceil((data.lockoutUntil - now) / 1000);
        return {
          isLocked: true,
          attemptsLeft: 0,
          remainingSeconds,
          error: `Rate limit exceeded. Try again in ${Math.ceil(remainingSeconds / 60)} minute(s).`,
        };
      }

      // If lockout passed, clear
      if (data.lockoutUntil && now >= data.lockoutUntil) {
        localStorage.removeItem(this.getKey(id));
        return { isLocked: false, attemptsLeft: this.maxAttempts, remainingSeconds: 0, error: '' };
      }

      const attempts = data.attempts || 0;
      return {
        isLocked: false,
        attemptsLeft: Math.max(0, this.maxAttempts - attempts),
        remainingSeconds: 0,
        error: '',
      };
    } catch {
      return { isLocked: false, attemptsLeft: this.maxAttempts, remainingSeconds: 0, error: '' };
    }
  }

  recordFailure(id: string): RateLimitCheck {
    try {
      const now = Date.now();
      const current = this.check(id);
      const attempts = this.maxAttempts - current.attemptsLeft + 1;

      if (attempts >= this.maxAttempts) {
        const lockoutUntil = now + this.lockoutDurationMs;
        localStorage.setItem(
          this.getKey(id),
          JSON.stringify({ attempts, lockoutUntil })
        );
        return {
          isLocked: true,
          attemptsLeft: 0,
          remainingSeconds: Math.ceil(this.lockoutDurationMs / 1000),
          error: `Too many failed attempts. Access locked for 15 minutes.`,
        };
      }

      localStorage.setItem(this.getKey(id), JSON.stringify({ attempts, lastAttempt: now }));
      const attemptsLeft = this.maxAttempts - attempts;
      return {
        isLocked: false,
        attemptsLeft,
        remainingSeconds: 0,
        error: `Incorrect PIN. ${attemptsLeft} attempt(s) remaining before lockout.`,
      };
    } catch {
      return { isLocked: false, attemptsLeft: 1, remainingSeconds: 0, error: 'Incorrect PIN.' };
    }
  }

  reset(id: string): void {
    try {
      localStorage.removeItem(this.getKey(id));
    } catch {
      // Ignored
    }
  }
}

export const roomPinLimiter = new SlidingRateLimiter('ks_rl_pin_', 5, 15 * 60 * 1000);
