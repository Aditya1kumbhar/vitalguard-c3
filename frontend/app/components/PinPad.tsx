import React, { useState, useEffect } from 'react';
import { playHaptic } from '../utils/haptics';

interface PinPadProps {
  onPinComplete: (pin: string) => void;
  title?: string;
  error?: string;
  disabled?: boolean;
}

export default function PinPad({ onPinComplete, title = "Enter your PIN", error, disabled }: PinPadProps) {
  const [pin, setPin] = useState<string>('');

  const handleKeyPress = (digit: string) => {
    if (disabled) return;
    playHaptic('soft');
    if (digit === '⌫') {
      setPin(prev => prev.slice(0, -1));
    } else if (digit === '✓') {
      if (pin.length === 6) {
        onPinComplete(pin);
      }
    } else {
      if (pin.length < 6) {
        const newPin = pin + digit;
        setPin(newPin);
        if (newPin.length === 6) {
          // Auto submit when 6 digits are entered
          setTimeout(() => onPinComplete(newPin), 150);
        }
      }
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto flex flex-col items-center">
      <h2 className="text-xl font-medium text-white mb-6 text-center">{title}</h2>
      
      {/* PIN Dots */}
      <div className="flex gap-4 mb-8">
        {[...Array(6)].map((_, i) => (
          <div 
            key={i} 
            className={`w-4 h-4 rounded-full transition-all duration-300 ${
              i < pin.length ? 'bg-[#FE336A] scale-110 shadow-[0_0_10px_#FE336A]' : 'bg-slate-600'
            }`}
          />
        ))}
      </div>

      {error && (
        <div className="text-red-400 text-sm mb-4 animate-pulse">
          {error}
        </div>
      )}

      {/* Numpad Grid */}
      <div className="grid grid-cols-3 gap-4 w-full">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '✓'].map((key) => (
          <button
            key={key}
            onClick={() => handleKeyPress(key)}
            disabled={disabled}
            className={`h-20 rounded-2xl text-2xl font-medium flex items-center justify-center transition-all duration-150 active:scale-95 select-none
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-700/50 active:bg-slate-600'}
              ${key === '⌫' ? 'text-slate-400' : key === '✓' ? 'text-[#FE336A] font-bold' : 'text-white'}
              bg-slate-800/50 backdrop-blur-md border border-slate-700/50 shadow-lg`}
          >
            {key}
          </button>
        ))}
      </div>
    </div>
  );
}
