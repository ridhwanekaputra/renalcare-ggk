/**
 * RenalCare AI - Secure Admin Authentication & Session Management Service
 * Designed for hardened security on local and production (Vercel) environments.
 */

const CREDENTIALS_STORAGE_KEY = 'renalcare_admin_credentials_v2';
const SESSION_TOKEN_KEY = 'renal_admin_session_token';
const SESSION_EXPIRES_KEY = 'renal_admin_session_expires';
const RATE_LIMIT_KEY = 'renal_admin_rate_limit';

// Salt string for SHA-256 password hashing
const SALT = '_renalcare_admin_secure_salt_2026';

// Default initial hash for 'admin123'
const DEFAULT_USERNAME = 'admin';
const DEFAULT_HASH = '409a0d4723e9903cc10150e7f6f819384654c293bb2616564145028a77801bdb'; // SHA-256 of 'admin123' + salt
const DEFAULT_CREATED_AT = '2026-01-01T00:00:00.000Z';

// Session duration: 15 minutes of inactivity
export const SESSION_DURATION_MS = 15 * 60 * 1000;

// Maximum failed attempts before 60-second cooldown
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 60 * 1000;

export interface AdminCredentialData {
  username: string;
  passwordHash: string;
  updatedAt: string;
}

/**
 * Robust SHA-256 hash using native Web Crypto API with fallback
 */
export async function hashPassword(plainText: string): Promise<string> {
  const salted = plainText + SALT;
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    try {
      const msgBuffer = new TextEncoder().encode(salted);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch {
      // Fallback if subtle crypto fails
    }
  }

  // Pure JS lightweight fallback
  let hash = 0;
  for (let i = 0; i < salted.length; i++) {
    const char = salted.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(64, '0');
}

/**
 * Retrieve current stored admin credentials
 */
export function getStoredCredentials(): AdminCredentialData {
  if (typeof window === 'undefined') {
    return { username: DEFAULT_USERNAME, passwordHash: DEFAULT_HASH, updatedAt: DEFAULT_CREATED_AT };
  }
  try {
    const raw = localStorage.getItem(CREDENTIALS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.username && parsed.passwordHash) {
        return parsed;
      }
    }
  } catch {
    // ignore json parse error
  }
  return { username: DEFAULT_USERNAME, passwordHash: DEFAULT_HASH, updatedAt: DEFAULT_CREATED_AT };
}

/**
 * Save new credentials to persistent storage
 */
export function saveCredentials(credentials: AdminCredentialData): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CREDENTIALS_STORAGE_KEY, JSON.stringify(credentials));
}

/**
 * Rate Limiting to prevent brute-force attacks
 */
export function getRateLimitStatus(): { isLocked: boolean; remainingSeconds: number; attempts: number } {
  if (typeof window === 'undefined') return { isLocked: false, remainingSeconds: 0, attempts: 0 };
  try {
    const raw = sessionStorage.getItem(RATE_LIMIT_KEY);
    if (!raw) return { isLocked: false, remainingSeconds: 0, attempts: 0 };
    const data = JSON.parse(raw);
    const now = Date.now();
    if (data.lockedUntil && data.lockedUntil > now) {
      const remaining = Math.ceil((data.lockedUntil - now) / 1000);
      return { isLocked: true, remainingSeconds: remaining, attempts: data.attempts || 0 };
    }
    return { isLocked: false, remainingSeconds: 0, attempts: data.attempts || 0 };
  } catch {
    return { isLocked: false, remainingSeconds: 0, attempts: 0 };
  }
}

function registerFailedAttempt(): { isLocked: boolean; remainingSeconds: number } {
  const current = getRateLimitStatus();
  const newAttempts = current.attempts + 1;
  const now = Date.now();
  let lockedUntil: number | null = null;
  let remainingSeconds = 0;

  if (newAttempts >= MAX_FAILED_ATTEMPTS) {
    lockedUntil = now + LOCKOUT_DURATION_MS;
    remainingSeconds = Math.ceil(LOCKOUT_DURATION_MS / 1000);
  }

  sessionStorage.setItem(RATE_LIMIT_KEY, JSON.stringify({
    attempts: newAttempts >= MAX_FAILED_ATTEMPTS ? 0 : newAttempts,
    lockedUntil
  }));

  return { isLocked: !!lockedUntil, remainingSeconds };
}

export function resetRateLimit(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(RATE_LIMIT_KEY);
}

/**
 * Verify login credentials
 */
export async function verifyAdminLogin(
  inputUsername: string,
  inputPassword: string
): Promise<{ success: boolean; message?: string }> {
  const rateLimit = getRateLimitStatus();
  if (rateLimit.isLocked) {
    return {
      success: false,
      message: `Terlalu banyak percobaan gagal. Akses ditangguhkan selama ${rateLimit.remainingSeconds} detik demi alasan keamanan.`
    };
  }

  const stored = getStoredCredentials();
  const inputHash = await hashPassword(inputPassword);

  const usernameMatches = inputUsername.trim().toLowerCase() === stored.username.trim().toLowerCase();
  const passwordMatches = inputHash === stored.passwordHash;

  if (usernameMatches && passwordMatches) {
    resetRateLimit();
    createAdminSession();
    return { success: true };
  } else {
    const limitInfo = registerFailedAttempt();
    if (limitInfo.isLocked) {
      return {
        success: false,
        message: `Kredensial salah 5 kali berturut-turut. Akses dikunci sementara selama ${limitInfo.remainingSeconds} detik.`
      };
    }
    return {
      success: false,
      message: 'Kombinasi nama pengguna atau kata sandi tidak valid. Silakan coba lagi.'
    };
  }
}

/**
 * Change admin password (and optional username)
 */
export async function changeAdminPassword(
  currentPassword: string,
  newPassword: string,
  newUsername?: string
): Promise<{ success: boolean; message: string }> {
  const stored = getStoredCredentials();
  const currentHash = await hashPassword(currentPassword);

  if (currentHash !== stored.passwordHash) {
    return {
      success: false,
      message: 'Kata sandi saat ini (lama) yang Anda masukkan tidak sesuai.'
    };
  }

  if (newPassword.length < 6) {
    return {
      success: false,
      message: 'Kata sandi baru harus memiliki minimal 6 karakter demi keamanan akun.'
    };
  }

  if (currentPassword === newPassword) {
    return {
      success: false,
      message: 'Kata sandi baru tidak boleh sama dengan kata sandi lama saat ini.'
    };
  }

  const newHash = await hashPassword(newPassword);
  const updatedUsername = newUsername && newUsername.trim().length >= 3 ? newUsername.trim() : stored.username;

  const newCreds: AdminCredentialData = {
    username: updatedUsername,
    passwordHash: newHash,
    updatedAt: new Date().toISOString()
  };

  saveCredentials(newCreds);
  refreshAdminSession();

  return {
    success: true,
    message: `Kata sandi administrator untuk akun "${updatedUsername}" berhasil diperbarui!`
  };
}

/**
 * Reset credentials back to default factory settings (admin / admin123)
 */
export function resetAdminToDefault(): { success: boolean; message: string } {
  saveCredentials({
    username: DEFAULT_USERNAME,
    passwordHash: DEFAULT_HASH,
    updatedAt: new Date().toISOString()
  });
  return {
    success: true,
    message: 'Kredensial berhasil dikembalikan ke standar awal: admin / admin123'
  };
}

/**
 * Create a new hardened session in sessionStorage
 */
export function createAdminSession(): void {
  if (typeof window === 'undefined') return;
  const token = 'sec_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  sessionStorage.setItem(SESSION_TOKEN_KEY, token);
  sessionStorage.setItem(SESSION_EXPIRES_KEY, expiresAt.toString());
  sessionStorage.setItem('adminAuth', 'true');
}

/**
 * Check if the active admin session is still valid
 */
export function isAdminSessionValid(): boolean {
  if (typeof window === 'undefined') return false;
  const token = sessionStorage.getItem(SESSION_TOKEN_KEY);
  const expiresAt = sessionStorage.getItem(SESSION_EXPIRES_KEY);
  if (!token || !expiresAt) return false;

  const expNum = parseInt(expiresAt, 10);
  if (isNaN(expNum) || Date.now() > expNum) {
    terminateAdminSession();
    return false;
  }
  return true;
}

/**
 * Refresh session expiration on user activity
 */
export function refreshAdminSession(): void {
  if (typeof window === 'undefined') return;
  if (!isAdminSessionValid()) return;
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  sessionStorage.setItem(SESSION_EXPIRES_KEY, expiresAt.toString());
}

/**
 * Terminate session completely (lockout on exit/logout)
 */
export function terminateAdminSession(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(SESSION_TOKEN_KEY);
  sessionStorage.removeItem(SESSION_EXPIRES_KEY);
  sessionStorage.removeItem('adminAuth');
}
