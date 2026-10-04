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

  const isValid10DigitPhone = (val: string) => {
    const digits = val.replace(/\D/g, '');
    if (digits.length === 12 && digits.startsWith('91')) {
      return digits.slice(2).length === 10;
    }
    return digits.length === 10;
  };

  const isValidEmail = (val: string) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(val.trim().toLowerCase());
  };

  const validateSignup = () => {
    const trimmed = identifier.trim();
    if (!trimmed) {
      return authType === 'phone' 
        ? 'Please enter your 10-digit Mobile Number.' 
        : 'Please enter your Email Address.';
    }
    if (authType === 'phone') {
      const digits = trimmed.replace(/\D/g, '');
      if (digits.length !== 10) {
        return `Mobile Number must be compulsory 10 digits (currently ${digits.length}/10).`;
      }
    } else {
      if (!isValidEmail(trimmed)) {
        return 'Please enter a valid Email Address (e.g. name@gmail.com).';
      }
    }
    if (!guardianName.trim() || guardianName.trim().length < 2) {
      return 'Please enter your Full Name (at least 2 characters).';
    }
    if (!bandId.trim()) {
      return 'Please detect or enter your Wristband ID (e.g. VG-C3-XXXX).';
    }
    return null;
  };

  const validateLogin = () => {
    const trimmed = identifier.trim();
    if (!trimmed) return 'Please enter your registered 10-digit Mobile No. or Email.';
    const isPhone = isValid10DigitPhone(trimmed);
    const isEmail = isValidEmail(trimmed);
    if (!isPhone && !isEmail) {
      const digitsOnly = trimmed.replace(/\D/g, '');
      if (digitsOnly.length > 0 && digitsOnly.length !== 10 && !trimmed.includes('@')) {
        return `Mobile Number must be compulsory 10 digits (currently ${digitsOnly.length}/10).`;
      }
      return 'Please enter a valid 10-digit Mobile Number or Email Address (e.g. name@gmail.com).';
    }
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
      let identToUse = identifier.trim().toLowerCase();
      if (authType === 'phone') {
        let digits = identToUse.replace(/\D/g, '');
        if (digits.length === 12 && digits.startsWith('91')) {
          digits = digits.slice(2);
        }
        identToUse = digits;
      }
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
      let identToUse = identifier.trim().toLowerCase();
      if (isValid10DigitPhone(identToUse)) {
        let digits = identToUse.replace(/\D/g, '');
        if (digits.length === 12 && digits.startsWith('91')) {
          digits = digits.slice(2);
        }
        identToUse = digits;
      }
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
      let identToUse = identifier.trim().toLowerCase();
      if ((tab === 'signup' && authType === 'phone') || isValid10DigitPhone(identToUse)) {
        let digits = identToUse.replace(/\D/g, '');
        if (digits.length === 12 && digits.startsWith('91')) {
          digits = digits.slice(2);
        }
        identToUse = digits;
      }
      
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
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 relative">
      <div className="w-full max-w-md sm:max-w-lg md:max-w-xl bg-white border border-slate-200 rounded-2xl shadow-xl relative z-10 flex flex-col items-center overflow-hidden">
        
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

        <div className="p-6 sm:p-8 md:p-10 w-full flex flex-col items-center">
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
                    onClick={() => {
                      setAuthType('phone');
                      setError('');
                      if (!/^\d*$/.test(identifier)) setIdentifier('');
                    }}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${authType === 'phone' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <Phone className="w-3.5 h-3.5" /> Mobile No. (10 Digits)
                  </button>
                  <button 
                    onClick={() => {
                      setAuthType('email');
                      setError('');
                      if (/^\d+$/.test(identifier)) setIdentifier('');
                    }}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${authType === 'email' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <Mail className="w-3.5 h-3.5" /> Email Address
                  </button>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1.5 pl-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                    {tab === 'signup' 
                      ? (authType === 'phone' ? 'Mobile Number (Compulsory 10 Digits)' : 'Email Address (e.g. @gmail.com)')
                      : 'Registered Mobile No. or Email'
                    }
                  </label>
                  {tab === 'signup' ? (
                    authType === 'phone' ? (
                      identifier.length === 10 ? (
                        <span className="text-emerald-600 font-bold text-xs flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> 10/10 Digits
                        </span>
                      ) : (
                        <span className="text-slate-400 font-semibold text-xs">
                          {identifier.length}/10 Digits
                        </span>
                      )
                    ) : (
                      isValidEmail(identifier) ? (
                        <span className="text-emerald-600 font-bold text-xs flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Valid Email
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium text-xs">
                          Must be valid email
                        </span>
                      )
                    )
                  ) : (
                    isValid10DigitPhone(identifier) ? (
                      <span className="text-emerald-600 font-bold text-xs flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> 10-Digit Mobile
                      </span>
                    ) : isValidEmail(identifier) ? (
                      <span className="text-emerald-600 font-bold text-xs flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Valid Email
                      </span>
                    ) : null
                  )}
                </div>
                <div className="relative">
                  {tab === 'signup' ? (
                    authType === 'phone' ? (
                      <Phone className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${identifier.length === 10 ? 'text-emerald-600' : 'text-slate-400'}`} />
                    ) : (
                      <Mail className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${isValidEmail(identifier) ? 'text-emerald-600' : 'text-slate-400'}`} />
                    )
                  ) : (
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  )}
                  <input 
                    type={tab === 'signup' ? (authType === 'phone' ? 'tel' : 'email') : 'text'}
                    inputMode={tab === 'signup' ? (authType === 'phone' ? 'numeric' : 'email') : undefined}
                    maxLength={tab === 'signup' && authType === 'phone' ? 10 : undefined}
                    value={identifier}
                    onChange={(e) => {
                      if (tab === 'signup' && authType === 'phone') {
                        const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setIdentifier(digits);
                      } else if (tab === 'signup' && authType === 'email') {
                        setIdentifier(e.target.value.trim().toLowerCase());
                      } else {
                        setIdentifier(e.target.value.trim());
                      }
                    }}
                    placeholder={
                      tab === 'signup' 
                        ? (authType === 'phone' ? 'Enter exactly 10 digits (e.g. 9876543210)' : 'e.g. yourname@gmail.com') 
                        : 'Enter registered 10-digit number or email'
                    }
                    className={`w-full bg-slate-50 border rounded-xl pl-10 pr-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none text-sm font-semibold transition-all ${
                      (tab === 'signup' && authType === 'phone' && identifier.length === 10) ||
                      (tab === 'signup' && authType === 'email' && isValidEmail(identifier)) ||
                      (tab === 'login' && (isValid10DigitPhone(identifier) || isValidEmail(identifier)))
                        ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20'
                        : 'border-slate-300 focus:border-[#01373D] focus:ring-2 focus:ring-[#01373D]/20'
                    }`}
                  />
                </div>
                {tab === 'signup' && authType === 'phone' && (
                  <p className="text-[11px] text-slate-400 mt-1 pl-1 font-medium">
                    {identifier.length === 10 
                      ? '✓ 10-digit mobile number ready for passkey pairing' 
                      : `Enter a 10-digit mobile number (${10 - identifier.length} digits remaining)`
                    }
                  </p>
                )}
                {tab === 'signup' && authType === 'email' && (
                  <p className="text-[11px] text-slate-400 mt-1 pl-1 font-medium">
                    {isValidEmail(identifier)
                      ? '✓ Valid email address ready for passkey registration'
                      : 'Valid email (e.g. name@gmail.com or official domain) is compulsory for security'
                    }
                  </p>
                )}
              </div>

              {tab === 'signup' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 pl-1">
                      Your Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
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
                        <span>{detectingBand ? 'Detecting...' : 'Detect'}</span>
                      </button>
                    </div>
                    <div className="relative">
                      <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
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
                </div>
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
