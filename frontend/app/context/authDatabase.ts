/**
 * VitalGuard C3 - Auth Database (IndexedDB + localStorage fallback)
 * 
 * PERSISTENCE GUARANTEE: Once a user registers/logs in, they stay
 * authenticated FOREVER until they explicitly log out.
 * 
 * Strategy:
 *   1. Primary store: IndexedDB (survives page reloads, app restarts)
 *   2. Backup store: localStorage (survives IndexedDB eviction under storage pressure)
 *   3. Sessions use a FIXED key ("current") so they overwrite instead of piling up
 *   4. No expiration — session is permanent until explicit logout
 */

const DB_NAME = "VitalGuardAuthDB";
const STORE_CREDS = "credentials";
const STORE_SESSIONS = "sessions";
const DB_VERSION = 2;

// localStorage backup keys
const LS_SESSION_KEY = "vg_c3_session";
const LS_CRED_KEY = "vg_c3_credential";

// Fixed session ID — we always overwrite instead of accumulating sessions
const FIXED_SESSION_ID = "current";

export interface SessionData {
  sessionId: string;
  identifier: string;
  guardianName: string;
  bandId: string;
  authenticatedAt: number;
  expiresAt: number; // kept for backward compat but NOT used to invalidate
  authMethod: "passkey" | "pin";
  token?: string;
}

export interface CredentialData {
  identifier: string;
  guardianName: string;
  bandId: string;
  pinHash: string;
  pinSalt: string;
  credentialId?: string;
}

// ─── LocalStorage Backup ─────────────────────────────────────────────

function backupSessionToLS(session: SessionData): void {
  try {
    localStorage.setItem(LS_SESSION_KEY, JSON.stringify(session));
  } catch {
    // localStorage full or unavailable — ignore
  }
}

function getSessionFromLS(): SessionData | null {
  try {
    const raw = localStorage.getItem(LS_SESSION_KEY);
    if (raw) return JSON.parse(raw) as SessionData;
  } catch {
    // corrupt data — ignore
  }
  return null;
}

function clearSessionFromLS(): void {
  try {
    localStorage.removeItem(LS_SESSION_KEY);
  } catch {
    // ignore
  }
}

function backupCredToLS(cred: CredentialData): void {
  try {
    localStorage.setItem(LS_CRED_KEY, JSON.stringify(cred));
  } catch {
    // ignore
  }
}

function getCredFromLS(identifier: string): CredentialData | null {
  try {
    const raw = localStorage.getItem(LS_CRED_KEY);
    if (raw) {
      const cred = JSON.parse(raw) as CredentialData;
      if (cred.identifier === identifier) return cred;
    }
  } catch {
    // ignore
  }
  return null;
}

function clearCredFromLS(): void {
  try {
    localStorage.removeItem(LS_CRED_KEY);
  } catch {
    // ignore
  }
}

// ─── IndexedDB Core ──────────────────────────────────────────────────

export async function openAuthDB(): Promise<IDBDatabase> {
  return new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      return reject(new Error("IndexedDB is not supported"));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = request.result;
      const oldVersion = event.oldVersion;

      if (oldVersion < 2) {
        if (db.objectStoreNames.contains(STORE_CREDS)) {
            db.deleteObjectStore(STORE_CREDS);
        }
        if (db.objectStoreNames.contains(STORE_SESSIONS)) {
            db.deleteObjectStore(STORE_SESSIONS);
        }
      }

      if (!db.objectStoreNames.contains(STORE_CREDS)) {
        db.createObjectStore(STORE_CREDS, { keyPath: "identifier" });
      }
      if (!db.objectStoreNames.contains(STORE_SESSIONS)) {
        db.createObjectStore(STORE_SESSIONS, { keyPath: "sessionId" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ─── Session Management ──────────────────────────────────────────────

export async function saveSession(session: SessionData): Promise<void> {
  // Force fixed session ID so we always overwrite the single active session
  session.sessionId = FIXED_SESSION_ID;

  // Backup to localStorage FIRST (most reliable)
  backupSessionToLS(session);

  try {
    const db = await openAuthDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_SESSIONS, "readwrite");
      const store = tx.objectStore(STORE_SESSIONS);
      // Clear ALL old sessions first, then write the new one
      store.clear();
      store.put(session);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    // IndexedDB failed but localStorage backup exists
    console.warn("saveSession: IndexedDB write failed, localStorage backup active", err);
  }
}

export async function getSession(): Promise<SessionData | null> {
  // Try IndexedDB first
  try {
    const db = await openAuthDB();
    const session = await new Promise<SessionData | null>((resolve, reject) => {
      const tx = db.transaction(STORE_SESSIONS, "readonly");
      const req = tx.objectStore(STORE_SESSIONS).get(FIXED_SESSION_ID);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });

    if (session) return session;
  } catch {
    // IndexedDB failed — fall through to localStorage
  }

  // Fallback: try reading ALL sessions from IndexedDB (backward compat with old multi-session data)
  try {
    const db = await openAuthDB();
    const session = await new Promise<SessionData | null>((resolve, reject) => {
      const tx = db.transaction(STORE_SESSIONS, "readonly");
      const req = tx.objectStore(STORE_SESSIONS).getAll();
      req.onsuccess = () => {
        const sessions: SessionData[] = req.result;
        if (sessions.length > 0) {
          sessions.sort((a, b) => b.authenticatedAt - a.authenticatedAt);
          resolve(sessions[0]);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => reject(req.error);
    });

    if (session) {
      // Migrate: re-save with fixed ID and clean up old sessions
      await saveSession(session);
      return session;
    }
  } catch {
    // IndexedDB completely unavailable
  }

  // Last resort: localStorage backup
  return getSessionFromLS();
}

export async function clearSession(): Promise<void> {
  // Clear localStorage backup
  clearSessionFromLS();
  clearCredFromLS();

  try {
    const db = await openAuthDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction([STORE_SESSIONS, STORE_CREDS], "readwrite");
      tx.objectStore(STORE_SESSIONS).clear();
      // Also clear credentials on logout so re-login works fresh
      tx.objectStore(STORE_CREDS).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn("clearSession: IndexedDB clear failed", err);
  }
}

// ─── Credential Management ───────────────────────────────────────────

export async function saveCredential(cred: CredentialData): Promise<void> {
  // Backup to localStorage
  backupCredToLS(cred);

  try {
    const db = await openAuthDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_CREDS, "readwrite");
      tx.objectStore(STORE_CREDS).put(cred);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn("saveCredential: IndexedDB write failed, localStorage backup active", err);
  }
}

export async function getCredential(identifier: string): Promise<CredentialData | null> {
  // Try IndexedDB first
  try {
    const db = await openAuthDB();
    const cred = await new Promise<CredentialData | null>((resolve, reject) => {
      const tx = db.transaction(STORE_CREDS, "readonly");
      const req = tx.objectStore(STORE_CREDS).get(identifier);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
    if (cred) return cred;
  } catch {
    // IndexedDB unavailable
  }

  // Fallback: localStorage
  return getCredFromLS(identifier);
}

// ─── PIN Hashing (unchanged) ─────────────────────────────────────────

export async function hashPinOffline(pin: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(pin),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );
  
  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode(salt),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
  
  const exported = await crypto.subtle.exportKey("raw", key);
  const hashArray = Array.from(new Uint8Array(exported));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
