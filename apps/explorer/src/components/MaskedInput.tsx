'use client';

import { useState, useRef, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface MaskedInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

/**
 * A text input that masks its value visually without using type="password"
 * This avoids triggering password manager autofill popups
 */
export default function MaskedInput({ value, onChange, placeholder, className }: MaskedInputProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Mask the display value (show dots except last 4 chars)
  const getMaskedValue = (val: string): string => {
    if (!val) return '';
    if (val.length <= 4) return '••••••••';
    return '•'.repeat(Math.min(val.length - 4, 20)) + val.slice(-4);
  };

  // When editing (focused), always show real value for usability
  // When not focused and not revealed, show masked
  const displayValue = (isFocused || isRevealed) ? value : getMaskedValue(value);

  // Handle focus - switch to real value for editing
  const handleFocus = () => {
    setIsFocused(true);
  };

  // Handle blur - switch back to masked
  const handleBlur = () => {
    setIsFocused(false);
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={displayValue}
        onChange={(e) => {
          // Only update if we're showing real value (focused or revealed)
          if (isFocused || isRevealed) {
            onChange(e.target.value);
          }
        }}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        data-1p-ignore="true"
        data-lpignore="true"
        data-form-type="other"
      />
      {value && (
        <button
          type="button"
          onClick={() => setIsRevealed(!isRevealed)}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-700/50 transition-colors"
          tabIndex={-1}
        >
          {isRevealed ? (
            <EyeOff className="w-4 h-4 text-gray-500" />
          ) : (
            <Eye className="w-4 h-4 text-gray-500" />
          )}
        </button>
      )}
    </div>
  );
}
