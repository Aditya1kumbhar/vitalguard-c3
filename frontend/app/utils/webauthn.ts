/**
 * VitalGuard C3 - Native WebAuthn & Platform Biometrics
 * Fully integrates with Windows Hello, Android Biometrics, Touch ID, and OS Device PIN.
 */

export function isWebAuthnSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    !!window.PublicKeyCredential &&
    !!navigator.credentials &&
    !!navigator.credentials.create &&
    !!navigator.credentials.get
  );
}

export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  if (!isWebAuthnSupported()) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

// Convert ArrayBuffer to Base64URL
export function bufferToBase64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let str = "";
  for (let i = 0; i < bytes.length; i++) {
    str += String.fromCharCode(bytes[i]);
  }
  const base64String = btoa(str);
  return base64String.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

// Convert Base64URL to ArrayBuffer
export function base64urlToBuffer(base64url: string): ArrayBuffer {
  let base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const padLen = (4 - (base64.length % 4)) % 4;
  base64 += "=".repeat(padLen);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Register Windows Hello / Mobile Platform Biometrics / Device PIN.
 * This MANDATORILY triggers the OS-level prompt (Windows Hello dialog or Mobile Fingerprint).
 */
export async function registerPlatformBiometrics(guardianName: string): Promise<{ credentialId: string; rawId: string }> {
  if (!isWebAuthnSupported()) {
    throw new Error("Biometric authentication (WebAuthn) is not supported on this browser.");
  }

  // 32-byte cryptographic challenge
  const challenge = new Uint8Array(32);
  window.crypto.getRandomValues(challenge);

  // Unique 16-byte user handle
  const userId = new Uint8Array(16);
  window.crypto.getRandomValues(userId);

  const cleanName = (guardianName && guardianName.trim()) || "VitalGuard Guardian";

  const creationOptions: PublicKeyCredentialCreationOptions = {
    challenge: challenge.buffer,
    rp: {
      name: "VitalGuard C3",
    },
    user: {
      id: userId.buffer,
      name: cleanName.toLowerCase().replace(/\s+/g, "_") + "@vitalguard.local",
      displayName: cleanName,
    },
    pubKeyCredParams: [
      { alg: -7, type: "public-key" },   // ES256 (P-256 with SHA-256)
      { alg: -257, type: "public-key" }, // RS256
    ],
    authenticatorSelection: {
      authenticatorAttachment: "platform", // Strictly PC/Mobile built-in sensor (Windows Hello / Fingerprint)
      userVerification: "required",        // Strictly MANDATORY OS Biometric / PIN check
      residentKey: "preferred",
    },
    timeout: 60000,
    attestation: "none",
  };

  try {
    const credential = (await navigator.credentials.create({
      publicKey: creationOptions,
    })) as PublicKeyCredential;

    if (!credential) {
      throw new Error("No credential was created by the device.");
    }

    const credIdBase64 = bufferToBase64url(credential.rawId);
    return {
      credentialId: credIdBase64,
      rawId: credential.id,
    };
  } catch (err: any) {
    if (err.name === "NotAllowedError") {
      throw new Error("Biometric / PIN verification was cancelled or timed out. Please try again.");
    }
    if (err.name === "InvalidStateError") {
      throw new Error("This device authenticator is already registered for this user.");
    }
    throw new Error(err.message || "Failed to register platform biometric credential.");
  }
}

/**
 * Verify identity using Windows Hello / Mobile Fingerprint / Device PIN.
 * This MANDATORILY forces the OS biometric or device security prompt to appear.
 */
export async function verifyPlatformBiometrics(credentialId?: string): Promise<{ credentialId: string }> {
  if (!isWebAuthnSupported()) {
    throw new Error("Biometric authentication is not supported on this browser.");
  }

  // 32-byte cryptographic challenge
  const challenge = new Uint8Array(32);
  window.crypto.getRandomValues(challenge);

  const requestOptions: PublicKeyCredentialRequestOptions = {
    challenge: challenge.buffer,
    userVerification: "required", // Strictly MANDATORY OS Biometrics / Windows Hello / Screen PIN!
    timeout: 60000,
  };

  if (credentialId) {
    try {
      requestOptions.allowCredentials = [
        {
          id: base64urlToBuffer(credentialId),
          type: "public-key",
          transports: ["internal"],
        },
      ];
    } catch (e) {
      // If conversion fails, let the platform authenticator locate the resident key
    }
  }

  try {
    const assertion = (await navigator.credentials.get({
      publicKey: requestOptions,
    })) as PublicKeyCredential;

    if (!assertion) {
      throw new Error("Authentication failed or was denied.");
    }

    const returnedId = bufferToBase64url(assertion.rawId);
    return { credentialId: returnedId };
  } catch (err: any) {
    if (err.name === "NotAllowedError") {
      throw new Error("Device biometrics / PIN verification was cancelled or denied.");
    }
    throw new Error(err.message || "Biometric authentication failed.");
  }
}
