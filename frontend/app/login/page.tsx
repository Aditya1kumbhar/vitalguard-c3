'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Fingerprint, Activity, AlertCircle, KeyRound, CheckCircle2, User, Phone, Mail, Hash, Bluetooth } from 'lucide-react';
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
  getSession,
  clearSession, 
} from '../context/authDatabase';
import { getApiBase } from '../utils/api';
import { playHaptic } from '../utils/haptics';

export default function LoginPage() {
  const { login } = useAuth();
  
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  
  // Form State
  const [authType, setAuthType] = useState<'phone' | 'email'>('phone');
  const [identifier, setIdentifier] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [bandId, setBandId] = useState('');
  
  // Auth Modes
  const [mode, setMode] = useState<'passkey' | 'pin'>('passkey');
  const [authenticating, setAuthenticating] = useState(false);
  const [hasPlatformBiometrics, setHasPlatformBiometrics] = useState(true);
  
  // Status & Feedback
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [detectingBand, setDetectingBand] = useState(false);
  const [bandDetectedMsg, setBandDetectedMsg] = useState('');

  useEffect(() => {
    isPlatformAuthenticatorAvailable().then(supported => setHasPlatformBiometrics(supported));
    
    async function checkPreviousUser() {
      try {
        const lastSession = await getSession();
        if (lastSession?.identifier) {
          setIdentifier(lastSession.identifier);
          setTab('login');
        }
      } catch {
        // ignore
      }
    }
    checkPreviousUser();
  }, []);

  const validateSignup = () => {
    if (!identifier.trim()) return 'Please enter your Mobile No. or Email.';
    if (!guardianName.trim()) return 'Please enter your Full Name.';
    if (!bandId.trim()) return 'Please enter the Wristband ID.';
    return null;
  };

  const validateLogin = () => {
    if (!identifier.trim()) return 'Please enter your Mobile No. or Email.';
    return null;
  };

  const handleDetectWristband = async () => {
    setError('');
    setBandDetectedMsg('');
    playHaptic('click');
    const nav = navigator as any;
    if (!nav.bluetooth) {
      setError('Web Bluetooth is not supported on this browser. Use Chrome (Desktop/Android) or type your Band ID manually.');
      return;
    }

    setDetectingBand(true);
    setStatusMessage('Scanning for nearby VitalGuard wristband...');

    try {
      const SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
      const DEVICE_ID_CHAR_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a9';

      const device = await nav.bluetooth.requestDevice({
        filters: [{ namePrefix: 'VitalGuard' }],
        optionalServices: [SERVICE_UUID],
      });

      setStatusMessage(`Found ${device.name || 'Wristband'}! Reading factory identity...`);

      let detectedId = '';

      try {
        const server = await device.gatt.connect();
        const service = await server.getPrimaryService(SERVICE_UUID);
        const char = await service.getCharacteristic(DEVICE_ID_CHAR_UUID);
        const val = await char.readValue();
        detectedId = new TextDecoder().decode(val);
        device.gatt.disconnect();
      } catch (gattErr) {
        if (device.name && device.name.includes('-')) {
          const suffix = device.name.split('-')[1];
          detectedId = `VG-C3-${suffix.toUpperCase()}`;
        } else {
          detectedId = device.name || 'VG-C3-0001';
        }
      }

      setBandId(detectedId);
      setBandDetectedMsg(`Device discovered & bound: ${detectedId}`);
      setStatusMessage('');
      playHaptic('pop');
    } catch (err: any) {
      if (err.name !== 'NotFoundError') {
        setError(err.message || 'Failed to detect wristband.');
      }
      setStatusMessage('');
    } finally {
      setDetectingBand(false);
    }
  };

  const handleSignupAuth = async () => {
    setError('');
    setStatusMessage('');
    playHaptic('click');

    const validationError = validateSignup();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (mode === 'passkey' && !hasPlatformBiometrics) {
      setError('Biometrics not supported on this device. Use PIN.');
      setMode('pin');
      return;
    }

    setAuthenticating(true);
    setStatusMessage('Setting up your device security...');

    try {
      const nameToUse = guardianName.trim();
      const identToUse = identifier.trim().toLowerCase();
      const bandToUse = bandId.trim();
      
      let credentialId = '';
      let pinHashStr = '';
      let pinSalt = '';

      if (mode === 'passkey') {
        const regResult = await registerPlatformBiometrics(nameToUse);
        credentialId = regResult.credentialId;
      } else {
        // We will fallback to asking for a PIN if they clicked "Setup PIN Pad"
        // But wait, PinPad handles its own submit. So handleSignupAuth is only for Passkey!
      }

      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auth_type: authType,
          identifier: identToUse,
          guardian_name: nameToUse,
          band_id: bandToUse,
          credential_id: credentialId || null,
          pin_hash: null
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Registration failed.');
      }
      
      const data = await res.json();
      const jwtToken = data.access_token;

      // Save credential in IndexedDB
      await saveCredential({
        identifier: identToUse,
        guardianName: nameToUse,
        bandId: bandToUse,
        pinHash: '',
        pinSalt: '',
        credentialId: credentialId,
      });

      // Save persistent session (30 days offline support)
      await saveSession({
        sessionId: crypto.randomUUID(),
        identifier: identToUse,
        guardianName: nameToUse,
        bandId: bandToUse,
        authenticatedAt: Date.now(),
        expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
        authMethod: 'passkey',
        token: jwtToken,
      });

      playHaptic('pop');
      setStatusMessage('Biometric identity confirmed! Launching VitalGuard...');
      setTimeout(() => login(nameToUse, identToUse, bandToUse), 600);

    } catch (err: any) {
      console.error(err);
      playHaptic('warning');
      setError(err.message || 'Setup failed.');
      setStatusMessage('');
    } finally {
      setAuthenticating(false);
    }
  };

  const handleLoginAuth = async () => {
    setError('');
    setStatusMessage('');
    playHaptic('click');

    const validationError = validateLogin();
    if (validationError) {
      setError(validationError);
      return;
    }

    setAuthenticating(true);

    try {
      const identToUse = identifier.trim().toLowerCase();
      let cred = await getCredential(identToUse);
      let credentialId = cred?.credentialId;

      if (!credentialId) {
        const apiBase = getApiBase();
        try {
          const checkRes = await fetch(`${apiBase}/api/auth/check-identifier?identifier=${encodeURIComponent(identToUse)}`);
          if (checkRes.ok) {
            const checkData = await checkRes.json();
            if (checkData.exists && checkData.credential_id) {
              credentialId = checkData.credential_id;
            }
          }
        } catch {
          // offline
        }
      }

      if (!cred && !credentialId) {
        throw new Error('Identity not recognized on this device. Please Sign Up first.');
      }
      
      if (mode === 'passkey' && !credentialId) {
        throw new Error('Biometrics not setup for this user. Please use PIN.');
      }

      setStatusMessage('Touch fingerprint sensor or enter PIN in system prompt...');

      const verifyResult = await verifyPlatformBiometrics(credentialId);

      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: identToUse,
          credential_id: verifyResult.credentialId,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Invalid biometrics or backend rejected.');
      }

      const data = await res.json();
      const jwtToken = data.access_token;
      
      const bandToUse = data.band_id || cred?.bandId || 'VG-C3-0001';
      const nameToUse = data.guardian_name || cred?.guardianName || 'Guardian';

      await saveCredential({
        identifier: identToUse,
        guardianName: nameToUse,
        bandId: bandToUse,
        pinHash: cred?.pinHash || '',
        pinSalt: cred?.pinSalt || '',
        credentialId: verifyResult.credentialId,
      });

      await saveSession({
        sessionId: crypto.randomUUID(),
        identifier: identToUse,
        guardianName: nameToUse,
        bandId: bandToUse,
        authenticatedAt: Date.now(),
        expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
        authMethod: 'passkey',
        token: jwtToken,
      });

      playHaptic('pop');
      setStatusMessage('Identity verified! Access granted.');
      setTimeout(() => login(nameToUse, identToUse, bandToUse), 500);

    } catch (err: any) {
      console.error(err);
      playHaptic('warning');
      setError(err.message || 'Verification failed.');
      setStatusMessage('');
    } finally {
      setAuthenticating(false);
    }
  };

  // When PIN pad finishes on either Login or Signup
  const handlePinSubmit = async (pin: string) => {
    setError('');
    setStatusMessage('');

    try {
      const identToUse = identifier.trim().toLowerCase();
      
      if (tab === 'signup') {
        const validationError = validateSignup();
        if (validationError) { setError(validationError); return; }
        
        const salt = crypto.randomUUID().replace(/-/g, '');
        const hashedPin = await hashPinOffline(pin, salt);
        const nameToUse = guardianName.trim();
        const bandToUse = bandId.trim();

        const apiBase = getApiBase();
        const res = await fetch(`${apiBase}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            auth_type: authType,
            identifier: identToUse,
            guardian_name: nameToUse,
            band_id: bandToUse,
            credential_id: null,
            pin_hash: hashedPin
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.detail || 'Registration failed.');
        }
        
        const data = await res.json();

        await saveCredential({
          identifier: identToUse,
          guardianName: nameToUse,
          bandId: bandToUse,
          pinHash: hashedPin,
          pinSalt: salt,
        });

        await saveSession({
          sessionId: crypto.randomUUID(),
          identifier: identToUse,
          guardianName: nameToUse,
          bandId: bandToUse,
          authenticatedAt: Date.now(),
          expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
          authMethod: 'pin',
          token: data.access_token,
        });

        login(nameToUse, identToUse, bandToUse);

      } else {
        // LOGIN MODE
        const validationError = validateLogin();
        if (validationError) { setError(validationError); return; }

        const cred = await getCredential(identToUse);
        if (!cred || !cred.pinHash) {
          throw new Error('No PIN registered for this user on this device.');
        }

        const hashedAttempt = await hashPinOffline(pin, cred.pinSalt);
        if (hashedAttempt !== cred.pinHash) {
          throw new Error('Incorrect PIN.');
        }

        const apiBase = getApiBase();
        const res = await fetch(`${apiBase}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identifier: identToUse,
            pin_hash: hashedAttempt,
          }),
        });

        let jwtToken = '';
        let finalBandId = cred.bandId;
        let finalName = cred.guardianName;

        if (res.ok) {
          const data = await res.json();
          jwtToken = data.access_token;
          finalBandId = data.band_id;
          finalName = data.guardian_name;
        }

        await saveSession({
          sessionId: crypto.randomUUID(),
          identifier: identToUse,
          guardianName: finalName,
          bandId: finalBandId,
          authenticatedAt: Date.now(),
          expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
          authMethod: 'pin',
          token: jwtToken,
        });

        login(finalName, identToUse, finalBandId);
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed.');
      playHaptic('warning');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6 relative">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl relative z-10 flex flex-col items-center overflow-hidden">
        
        {/* Header Tabs */}
        <div className="w-full flex border-b border-slate-100 bg-slate-50">
          <button 
            onClick={() => { setTab('login'); setError(''); setStatusMessage(''); }}
            className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-colors ${tab === 'login' ? 'text-[#01373D] border-b-2 border-[#FE336A] bg-white' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Login
          </button>
          <button 
            onClick={() => { setTab('signup'); setError(''); setStatusMessage(''); }}
            className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-colors ${tab === 'signup' ? 'text-[#01373D] border-b-2 border-[#FE336A] bg-white' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Sign Up
          </button>
        </div>

        <div className="p-6 sm:p-8 w-full flex flex-col items-center">
          <div className="w-14 h-14 bg-[#01373D] rounded-2xl flex items-center justify-center shadow-md mb-4">
            <Activity className="w-7 h-7 text-white stroke-[2.5]" />
          </div>
          
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 mb-6">
            VitalGuard <span className="text-[#FE336A]">C3</span>
          </h1>

          <div className="w-full space-y-4 mb-6">
            
            {tab === 'signup' && (
              <div className="w-full flex bg-slate-100 p-1 rounded-xl mb-2 border border-slate-200">
                <button 
                  onClick={() => setAuthType('phone')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 ${authType === 'phone' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500'}`}
                >
                  <Phone className="w-3.5 h-3.5" /> Mobile No.
                </button>
                <button 
                  onClick={() => setAuthType('email')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 ${authType === 'email' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500'}`}
                >
                  <Mail className="w-3.5 h-3.5" /> Email
                </button>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 pl-1">
                {tab === 'signup' 
                  ? (authType === 'phone' ? 'Mobile Number' : 'Email Address')
                  : 'Mobile No. or Email'
                }
              </label>
              <input 
                type={tab === 'signup' ? (authType === 'phone' ? 'tel' : 'email') : 'text'}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={tab === 'signup' ? (authType === 'phone' ? 'e.g. +1 555-0123' : 'e.g. aditya@vitalguard.com') : 'Enter your registered identity'}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#01373D] focus:ring-2 focus:ring-[#01373D]/20 text-sm font-semibold transition-all"
              />
            </div>

            {tab === 'signup' && (
              <>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 pl-1">
                    Your Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      value={guardianName}
                      onChange={(e) => setGuardianName(e.target.value)}
                      placeholder="e.g. Aditya K."
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#01373D] focus:ring-2 focus:ring-[#01373D]/20 text-sm font-semibold transition-all"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5 pl-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      Wristband / Device ID
                    </label>
                    <button
                      type="button"
                      onClick={handleDetectWristband}
                      disabled={detectingBand}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 px-2 py-0.5 rounded-lg transition-all shadow-xs"
                      title="Auto-scan hardware MAC via Bluetooth"
                    >
                      <Bluetooth className={`w-3 h-3 ${detectingBand ? 'animate-pulse text-sky-500' : 'text-sky-600'}`} />
                      <span>{detectingBand ? 'Detecting...' : 'Detect My Wristband'}</span>
                    </button>
                  </div>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      value={bandId}
                      onChange={(e) => {
                        setBandId(e.target.value);
                        setBandDetectedMsg('');
                      }}
                      placeholder="e.g. VG-C3-AD01"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#01373D] focus:ring-2 focus:ring-[#01373D]/20 text-sm font-bold uppercase transition-all"
                    />
                  </div>
                  {bandDetectedMsg && (
                    <p className="text-[11px] font-semibold text-emerald-600 mt-1 pl-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{bandDetectedMsg}</span>
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="w-full bg-slate-100 p-1 rounded-xl flex mb-6 border border-slate-200">
            <button 
              onClick={() => { setMode('passkey'); setError(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${mode === 'passkey' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <Fingerprint className="w-4 h-4" /> Device Biometrics
            </button>
            <button 
              onClick={() => { setMode('pin'); setError(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${mode === 'pin' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <KeyRound className="w-4 h-4" /> Custom PIN
            </button>
          </div>

          <div className="w-full flex flex-col items-center justify-center">
            {mode === 'passkey' ? (
              <div className="flex flex-col items-center w-full">
                <button 
                  onClick={tab === 'signup' ? handleSignupAuth : handleLoginAuth}
                  disabled={authenticating}
                  className={`relative group w-32 h-32 rounded-full flex flex-col items-center justify-center transition-colors border-2 ${
                    authenticating 
                      ? 'bg-slate-100 border-[#01373D]' 
                      : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-[#01373D] shadow-sm'
                  }`}
                >
                  <Fingerprint className={`w-14 h-14 ${authenticating ? 'text-[#01373D]' : 'text-slate-700 group-hover:text-[#01373D]'}`} />
                  <span className="text-[11px] font-bold uppercase tracking-wider mt-2 text-slate-600">
                    {authenticating ? 'Waiting...' : (tab === 'signup' ? 'Setup' : 'Verify')}
                  </span>
                </button>
                <p className="text-xs text-slate-500 mt-4 max-w-xs text-center leading-relaxed">
                  Triggers native <strong>Windows Hello</strong>, <strong>Fingerprint</strong>, or <strong>Device Screen Lock PIN</strong> directly to verify identity locally.
                </p>
              </div>
            ) : (
              <PinPad 
                title={tab === 'signup' ? "Create a 4 to 6-digit PIN" : "Enter your PIN"}
                onPinComplete={handlePinSubmit}
                error={error}
              />
            )}
            
            {statusMessage && (
              <div className="mt-5 w-full px-3 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-700 font-semibold animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{statusMessage}</span>
              </div>
            )}
            
            {error && mode === 'passkey' && (
              <div className="mt-5 w-full px-3 py-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-700 font-semibold animate-fadeIn text-left">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </div>
          
        </div>

        <div className="border-t border-slate-100 bg-slate-50 w-full py-4 flex flex-col items-center justify-center">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>FIDO2 / WebAuthn Compliant Identity Isolation</span>
          </div>
        </div>

      </div>
    </div>
  );
}
