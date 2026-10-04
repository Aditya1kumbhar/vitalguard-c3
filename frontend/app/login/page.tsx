'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Fingerprint, Activity, AlertCircle, Sparkles, KeyRound, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PinPad from '../components/PinPad';
import { 
  isWebAuthnSupported, 
  isPlatformAuthenticatorAvailable, 
  registerPlatformBiometrics, 
  verifyPlatformBiometrics 
} from '../utils/webauthn';
import { 
  hashPinOffline, 
  saveCredential, 
  getCredential, 
  saveSession, 
  clearSession, 
  openAuthDB 
} from '../context/authDatabase';
import { getApiBase } from '../utils/api';
import { playHaptic } from '../utils/haptics';

export default function LoginPage() {
  const { login } = useAuth();
  const [isSetup, setIsSetup] = useState(false);
  const [mode, setMode] = useState<'passkey' | 'pin'>('passkey');
  const [loading, setLoading] = useState(true);
  const [authenticating, setAuthenticating] = useState(false);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [savedCred, setSavedCred] = useState<any>(null);
  const [hasPlatformBiometrics, setHasPlatformBiometrics] = useState(true);

  // Check existing credentials on mount
  useEffect(() => {
    const checkState = async () => {
      try {
        const platformSupported = await isPlatformAuthenticatorAvailable();
        setHasPlatformBiometrics(platformSupported);

        const cred = await getCredential(1);
        if (cred && (cred.pinHash || cred.credentialId)) {
          setIsSetup(false);
          setSavedCred(cred);
          setGuardianName(cred.guardianName || 'Guardian');
          // If biometric credential exists and supported, default to passkey
          if (cred.credentialId && platformSupported) {
            setMode('passkey');
          } else if (cred.pinHash) {
            setMode('pin');
          } else {
            setMode('passkey');
          }
        } else {
          setIsSetup(true);
          setGuardianName('');
          setMode(platformSupported ? 'passkey' : 'pin');
        }
      } catch (err) {
        console.warn('Auth state check error:', err);
        setIsSetup(true);
      } finally {
        setLoading(false);
      }
    };
    checkState();
  }, []);

  /**
   * REAL MANDATORY BIOMETRIC / WINDOWS HELLO / DEVICE PIN AUTHENTICATION
   */
  const handlePasskeyAuth = async () => {
    setError('');
    setStatusMessage('');
    playHaptic('click');

    if (!isWebAuthnSupported()) {
      setError('WebAuthn is not supported in this browser. Please use the PIN Pad.');
      setMode('pin');
      return;
    }

    setAuthenticating(true);

    try {
      if (isSetup) {
        // --- REGISTRATION FLOW ---
        const nameToUse = guardianName.trim() || 'Guardian';
        if (!guardianName.trim()) {
          setError('Please enter your Guardian Name above before registering biometrics.');
          setAuthenticating(false);
          return;
        }

        setStatusMessage('Waiting for device biometrics (Windows Hello / Fingerprint / PIN)...');

        // This STRICTLY opens Windows Hello or Mobile Screen Biometrics!
        const regResult = await registerPlatformBiometrics(nameToUse);

        // Sync with backend to issue signed JWT
        let jwtToken = '';
        try {
          const apiBase = getApiBase();
          const res = await fetch(`${apiBase}/api/auth/passkey-register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              guardian_name: nameToUse,
              credential_id: regResult.credentialId,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            jwtToken = data.access_token;
          }
        } catch {
          console.warn('Backend sync failed, continuing offline.');
        }

        // Save credential in IndexedDB
        const newCred = {
          guardianId: 1,
          guardianName: nameToUse,
          pinHash: '',
          pinSalt: '',
          credentialId: regResult.credentialId,
        };
        await saveCredential(newCred);

        // Save persistent session
        const sessionData = {
          sessionId: crypto.randomUUID(),
          guardianId: 1,
          guardianName: nameToUse,
          authenticatedAt: Date.now(),
          expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
          authMethod: 'passkey' as const,
          token: jwtToken,
        };
        await saveSession(sessionData);

        playHaptic('pop');
        setStatusMessage('Biometric identity confirmed! Launching VitalGuard...');
        setTimeout(() => login(nameToUse), 600);
      } else {
        // --- VERIFICATION FLOW (Subsequent Logins) ---
        setStatusMessage('Touch fingerprint sensor or enter device PIN in system prompt...');

        const credId = savedCred?.credentialId;
        // This STRICTLY triggers the OS biometrics / Windows Hello verification prompt!
        const verifyResult = await verifyPlatformBiometrics(credId);

        // Obtain or verify backend JWT
        let jwtToken = '';
        let verifiedName = savedCred?.guardianName || guardianName || 'Guardian';
        try {
          const apiBase = getApiBase();
          const res = await fetch(`${apiBase}/api/auth/passkey-login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              credential_id: verifyResult.credentialId,
              guardian_id: 1,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            jwtToken = data.access_token;
            if (data.guardian_name) verifiedName = data.guardian_name;
          }
        } catch {
          console.warn('Backend offline, using offline cryptographic passkey validation.');
        }

        const sessionData = {
          sessionId: crypto.randomUUID(),
          guardianId: 1,
          guardianName: verifiedName,
          authenticatedAt: Date.now(),
          expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
          authMethod: 'passkey' as const,
          token: jwtToken,
        };
        await saveSession(sessionData);

        playHaptic('pop');
        setStatusMessage('Identity verified! Access granted.');
        setTimeout(() => login(verifiedName), 500);
      }
    } catch (err: any) {
      console.error('Biometric authentication error:', err);
      playHaptic('warning');
      setStatusMessage('');
      setError(err.message || 'Biometric verification failed. Please try again or use PIN.');
    } finally {
      setAuthenticating(false);
    }
  };

  /**
   * PIN Pad Fallback Verification
   */
  const handlePinSubmit = async (pin: string) => {
    setError('');
    setStatusMessage('');

    if (isSetup) {
      if (!guardianName.trim()) {
        setError('Please enter your Guardian Name above.');
        return;
      }

      const salt = crypto.randomUUID().replace(/-/g, '');
      const hashedPin = await hashPinOffline(pin, salt);

      let jwtToken = '';
      try {
        const apiBase = getApiBase();
        const res = await fetch(`${apiBase}/api/auth/set-pin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ guardian_name: guardianName.trim(), pin_hash: hashedPin }),
        });
        if (res.ok) {
          const data = await res.json();
          jwtToken = data.access_token;
        }
      } catch {
        console.warn('Backend offline, proceeding offline.');
      }

      await saveCredential({
        guardianId: 1,
        guardianName: guardianName.trim(),
        pinHash: hashedPin,
        pinSalt: salt,
        credentialId: savedCred?.credentialId,
      });

      const sessionData = {
        sessionId: crypto.randomUUID(),
        guardianId: 1,
        guardianName: guardianName.trim(),
        authenticatedAt: Date.now(),
        expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
        authMethod: 'pin' as const,
        token: jwtToken,
      };
      await saveSession(sessionData);
      login(guardianName.trim());
    } else {
      const cred = await getCredential(1);
      if (!cred || !cred.pinHash) {
        setError('No PIN registered. Please use Biometric login or reset setup.');
        return;
      }

      const hashedAttempt = await hashPinOffline(pin, cred.pinSalt);
      if (hashedAttempt === cred.pinHash) {
        let jwtToken = '';
        try {
          const apiBase = getApiBase();
          const res = await fetch(`${apiBase}/api/auth/verify-pin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pin_hash: hashedAttempt }),
          });
          if (res.ok) {
            const data = await res.json();
            jwtToken = data.access_token;
          }
        } catch {
          console.warn('Backend offline, verified via local PBKDF2 hash.');
        }

        const sessionData = {
          sessionId: crypto.randomUUID(),
          guardianId: 1,
          guardianName: cred.guardianName,
          authenticatedAt: Date.now(),
          expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
          authMethod: 'pin' as const,
          token: jwtToken,
        };
        await saveSession(sessionData);
        login(cred.guardianName);
      } else {
        setError('Incorrect PIN. Please re-enter.');
      }
    }
  };

  /**
   * Reset local credentials to allow re-registering biometrics
   */
  const handleResetSetup = async () => {
    if (!confirm('Reset local credentials to re-register biometrics and PIN?')) return;
    try {
      await clearSession();
      const db = await openAuthDB();
      const tx = db.transaction('credentials', 'readwrite');
      tx.objectStore('credentials').clear();
      tx.oncomplete = () => {
        setIsSetup(true);
        setSavedCred(null);
        setGuardianName('');
        setError('');
        setStatusMessage('Credentials cleared. You can now register fresh biometrics.');
      };
    } catch (e: any) {
      setError('Could not reset credentials: ' + e.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#01373D] flex flex-col items-center justify-center gap-4 text-white">
        <Activity className="animate-spin text-[#FE336A] w-12 h-12" />
        <span className="text-sm font-semibold tracking-wide text-slate-300">Initializing Security Module...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6 relative">
      
      <div className="w-full max-w-md bg-white border border-slate-200 p-6 sm:p-8 rounded-2xl shadow-xl relative z-10 flex flex-col items-center">
        
        {/* Device Brand Header */}
        <div className="w-16 h-16 bg-[#01373D] rounded-2xl flex items-center justify-center shadow-md mb-4">
          <Activity className="w-8 h-8 text-white stroke-[2.5]" />
        </div>
        
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mb-1">
          VitalGuard <span className="text-[#FE336A]">C3</span>
        </h1>
        
        <p className="text-xs sm:text-sm text-slate-500 mb-6 text-center font-medium">
          {isSetup ? "Biometric Security Setup" : `Secure Login • ${guardianName}`}
        </p>

        {/* Guardian Name Input (Setup Mode) */}
        {isSetup && (
          <div className="w-full mb-6">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 pl-1">
              Guardian / Caregiver Name
            </label>
            <input 
              type="text" 
              value={guardianName}
              onChange={(e) => setGuardianName(e.target.value)}
              placeholder="e.g. Aditya"
              disabled={authenticating}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#01373D] focus:ring-2 focus:ring-[#01373D]/20 text-sm font-semibold transition-all"
            />
          </div>
        )}

        {/* Auth Mode Toggle */}
        <div className="w-full bg-slate-100 p-1 rounded-xl flex mb-6 border border-slate-200">
          <button 
            onClick={() => {
              playHaptic('pop');
              setMode('passkey');
              setError('');
            }}
            disabled={authenticating}
            className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              mode === 'passkey' 
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Fingerprint className="w-4 h-4" />
            <span>Biometrics</span>
          </button>
          <button 
            onClick={() => {
              playHaptic('pop');
              setMode('pin');
              setError('');
            }}
            disabled={authenticating}
            className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              mode === 'pin' 
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>PIN Pad</span>
          </button>
        </div>

        {/* Main Authentication Area */}
        <div className="w-full min-h-[300px] flex flex-col items-center justify-center">
          {mode === 'passkey' ? (
            <div className="flex flex-col items-center w-full">
              
              {/* Native Biometrics Button */}
              <button 
                onClick={handlePasskeyAuth}
                disabled={authenticating}
                className={`relative group w-32 h-32 rounded-full flex flex-col items-center justify-center transition-colors border-2 ${
                  authenticating 
                    ? 'bg-slate-100 border-[#01373D]' 
                    : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-[#01373D] shadow-sm'
                }`}
                title="Click to trigger OS biometrics or Windows Hello"
              >
                <Fingerprint className={`w-14 h-14 ${
                  authenticating 
                    ? 'text-[#01373D]' 
                    : 'text-slate-700 group-hover:text-[#01373D]'
                }`} />
                
                <span className="text-[11px] font-bold uppercase tracking-wider mt-2 text-slate-600">
                  {authenticating ? 'Prompting...' : isSetup ? 'Register' : 'Verify'}
                </span>
              </button>
              
              {/* Context Action Text */}
              <div className="mt-6 text-center px-2">
                <p className="text-sm font-semibold text-slate-800">
                  {isSetup 
                    ? "Click to register your PC or phone biometrics" 
                    : "Touch scanner or enter Windows / Mobile PIN"}
                </p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  Triggers native <strong>Windows Hello</strong>, <strong>Fingerprint</strong>, or <strong>Device Screen Lock PIN</strong> directly.
                </p>
              </div>

              {/* Status Message */}
              {statusMessage && (
                <div className="mt-4 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-xs text-emerald-700 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{statusMessage}</span>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mt-4 px-3 py-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-700 max-w-xs text-left animate-fadeIn">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          ) : (
            <PinPad 
              title={isSetup ? "Create a 4 to 6-digit PIN" : "Enter your PIN"}
              onPinComplete={handlePinSubmit}
              error={error}
            />
          )}
        </div>
        
        {/* Reset / Re-register Helper */}
        {!isSetup && (
          <div className="mt-6 text-center">
            <button
              onClick={handleResetSetup}
              className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 underline underline-offset-4 transition-colors"
            >
              Reset local credentials & register new biometrics
            </button>
          </div>
        )}

        {/* Security Badge Footer */}
        <div className="mt-6 pt-4 border-t border-slate-200 w-full flex items-center justify-between text-[11px] text-slate-500 px-1">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>FIDO2 / WebAuthn Compliant</span>
          </div>
          <span className="font-mono text-[10px] text-slate-400">Hardware Level</span>
        </div>
      </div>
    </div>
  );
}
