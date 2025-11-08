// src/components/Spinner.jsx
import React from 'react';

/**
 * Spinner
 * A small rotating loader icon.
 *
 * Props:
 *  - size: number (px) → controls width/height
 *  - color: string → overrides default color (uses CSS var(--primary) by default)
 */
export default function Spinner({ size = 32, color = 'var(--primary)' }) {
  const spinnerStyle = {
    display: 'inline-block',
    width: size,
    height: size,
    animation: 'spin 1s linear infinite',
  };

  return (
    <div style={spinnerStyle} aria-hidden="true">
      <svg viewBox="0 0 50 50" style={{ width: '100%', height: '100%' }}>
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke="rgba(0,0,0,0.1)"
          strokeWidth="4"
        />
        <path
          d="M45 25a20 20 0 00-6-14"
          stroke={color}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
      </svg>

      {/* Inline animation for environments without global CSS */}
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}
