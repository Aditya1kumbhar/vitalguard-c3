/**
 * VitalGuard C3 - Auth Database (IndexedDB)
 * Stores credentials and session for offline authentication.
 */

const DB_NAME = "VitalGuardAuthDB";
const STORE_CREDS = "credentials";
const STORE_SESSIONS = "sessions";
const DB_VERSION = 2; // Upgraded schema for identifier
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export interface SessionData {
  sessionId: string;
  identifier: string;
  guardianName: string;
  bandId: string;
  authenticatedAt: number;
  expiresAt: number;
  authMethod: "passkey" | "pin";
  token?: string; // JWT token for online requests
}

export interface CredentialData {
  identifier: string; // phone or email
  guardianName: string;
  bandId: string;
  pinHash: string; // bcrypt hash or PBKDF2 derived key
  pinSalt: string; // salt for offline PBKDF2 verification
  credentialId?: string; // WebAuthn credential ID
}

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

export async function saveSession(session: SessionData): Promise<void> {
  const db = await openAuthDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_SESSIONS, "readwrite");
    tx.objectStore(STORE_SESSIONS).put(session);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getSession(): Promise<SessionData | null> {
  const db = await openAuthDB();
  return new Promise<SessionData | null>((resolve, reject) => {
    const tx = db.transaction(STORE_SESSIONS, "readonly");
    const req = tx.objectStore(STORE_SESSIONS).getAll();
    req.onsuccess = () => {
      const sessions: SessionData[] = req.result;
      if (sessions.length > 0) {
        // Return most recent session
        sessions.sort((a, b) => b.authenticatedAt - a.authenticatedAt);
        resolve(sessions[0]);
      } else {
        resolve(null);
      }
    };
    req.onerror = () => reject(req.error);
  });
}

export async function clearSession(): Promise<void> {
  const db = await openAuthDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_SESSIONS, "readwrite");
    tx.objectStore(STORE_SESSIONS).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function saveCredential(cred: CredentialData): Promise<void> {
  const db = await openAuthDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_CREDS, "readwrite");
    tx.objectStore(STORE_CREDS).put(cred);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getCredential(identifier: string): Promise<CredentialData | null> {
  const db = await openAuthDB();
  return new Promise<CredentialData | null>((resolve, reject) => {
    const tx = db.transaction(STORE_CREDS, "readonly");
    const req = tx.objectStore(STORE_CREDS).get(identifier);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

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
