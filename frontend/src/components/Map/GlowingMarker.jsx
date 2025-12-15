import React from 'react';

/**
 * GlowingMarker
 * Reusable glossy, glowing circular SVG marker for dashboard maps.
 *
 * Props:
 * - type: 'user' | 'alert' | 'chat' | 'heart'
 * - severity: 'low' | 'medium' | 'high' (used when type === 'alert')
 * - count?: number | string (optional badge)
 * - size?: number (px, default 56)
 * - onClick?: (e) => void
 */
export default function GlowingMarker({ type = 'user', severity = 'low', count, size = 56, onClick }) {
  const palette = getPalette(type, severity);

  const handleClick = (e) => {
    if (onClick) onClick(e);
    // Always log to console per requirements
    // Delay log after user onClick to not interfere with their handler
    setTimeout(() => {
      // eslint-disable-next-line no-console
      console.log(`[GlowingMarker] type=${type}, severity=${severity}, count=${count ?? 0}`);
    }, 0);
  };

  return (
    <div
      className="glow-marker-wrapper"
      onClick={handleClick}
      style={{ width: size, height: size, cursor: 'pointer' }}
      role="button"
      aria-label={`${type} marker ${typeof count !== 'undefined' ? `count ${count}` : ''}`}
      title={`${capitalize(type)}${type === 'alert' ? ` (${capitalize(severity)})` : ''}${typeof count !== 'undefined' ? ` • ${count}` : ''}`}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Gradient fill for the base circle */}
          <linearGradient id="gm-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={palette.base1} />
            <stop offset="100%" stopColor={palette.base2} />
          </linearGradient>

          {/* Outer glow filter */}
          <filter id="gm-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur1" />
            <feMerge>
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Soft neon ring shadow */}
          <filter id="gm-neon" x="-60%" y="-60%" width="220%" height="220%">
            <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor={palette.glow} floodOpacity="1" />
          </filter>
        </defs>

        {/* Outer glow ring */}
        <g filter="url(#gm-neon)">
          <circle cx="50" cy="50" r="34" fill="url(#gm-grad)" stroke="rgba(255,255,255,0.18)" strokeWidth="2" />
        </g>

        {/* Base glossy circle */}
        <g filter="url(#gm-glow)">
          <circle cx="50" cy="50" r="34" fill="url(#gm-grad)" />
        </g>

        {/* Glossy highlight */}
        <path
          d="M18,32 C18,24 28,16 50,16 C72,16 82,24 82,32 C82,38 76,40 68,40 C56,40 44,38 32,38 C26,38 22,36 18,32 Z"
          fill="white"
          opacity="0.28"
        />

        {/* Inner symbol */}
        <g fill={palette.icon} stroke="none">
          {renderIcon(type)}
        </g>

        {/* Count badge (top-right) */}
        {typeof count !== 'undefined' && count !== null && (
          <g>
            <circle cx="80" cy="20" r="12" fill="#ffffff" />
            <text
              x="80"
              y="20"
              dominantBaseline="central"
              textAnchor="middle"
              fontSize="12"
              fontWeight="800"
              fill="#111111"
            >
              {String(count)}
            </text>
          </g>
        )}

        {/* Subtle inner stroke */}
        <circle cx="50" cy="50" r="34" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1" />
      </svg>
    </div>
  );
}

function getPalette(type, severity) {
  const palettes = {
    user: { base1: '#3ddc84', base2: '#128d52', glow: 'rgba(61,220,132,0.65)', icon: '#ffffff' },
    alertHigh: { base1: '#ff5a5a', base2: '#b30000', glow: 'rgba(255,62,62,0.70)', icon: '#ffffff' },
    alertMedium: { base1: '#ffd54a', base2: '#e6a700', glow: 'rgba(255,213,74,0.70)', icon: '#111111' },
    chat: { base1: '#4aa3ff', base2: '#0066cc', glow: 'rgba(0,163,255,0.70)', icon: '#ffffff' },
    heart: { base1: '#4aa3ff', base2: '#0066cc', glow: 'rgba(0,163,255,0.70)', icon: '#ffffff' },
  };

  if (type === 'alert') {
    return severity === 'high' ? palettes.alertHigh : palettes.alertMedium;
  }
  if (type === 'chat') return palettes.chat;
  if (type === 'heart') return palettes.heart;
  // default to user green for 'user' and unknown
  return palettes.user;
}

function renderIcon(type) {
  switch (type) {
    case 'alert':
      return (
        <g>
          {/* Triangle */}
          <polygon points="50,22 82,78 18,78" fill="currentColor" transform="translate(0,-6)" />
          {/* Exclamation */}
          <rect x="48" y="38" width="4" height="22" fill="#ffffff" rx="2" />
          <circle cx="50" cy="66" r="3" fill="#ffffff" />
        </g>
      );
    case 'chat':
      return (
        <g>
          <path
            d="M25 36 h50 a8 8 0 0 1 8 8 v12 a8 8 0 0 1 -8 8 h-26 l-10 8 v-8 h-14 a8 8 0 0 1 -8 -8 v-12 a8 8 0 0 1 8 -8 z"
            fill="currentColor"
          />
        </g>
      );
    case 'heart':
      return (
        <path
          d="M50 68 C46 64,34 56,30 48 C26 40,30 32,38 32 C43 32,46 35,50 39 C54 35,57 32,62 32 C70 32,74 40,70 48 C66 56,54 64,50 68 Z"
          fill="currentColor"
        />
      );
    case 'user':
    default:
      return (
        <g>
          <circle cx="50" cy="40" r="12" fill="currentColor" />
          <path d="M30 74 C30 62 70 62 70 74 L70 78 L30 78 Z" fill="currentColor" />
        </g>
      );
  }
}

function capitalize(s) {
  return (s || '').charAt(0).toUpperCase() + (s || '').slice(1);
}
