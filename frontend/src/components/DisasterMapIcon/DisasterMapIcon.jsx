import React from 'react';

/**
 * DisasterMapIcon
 * Renders a glossy, glowing circular SVG icon for maps.
 *
 * @param {object} props
 * @param {'emergencyAlert' | 'warning' | 'reliefTruck' | 'volunteer' | 'safeZone' | 'damagedArea'} props.type - The type of icon to render.
 * @param {number | string} [props.count] - Optional notification count to display in a badge.
 * @param {number} [props.size=128] - The size of the icon in pixels.
 * @returns {React.ReactElement}
 */
const DisasterMapIcon = ({ type, count, size = 128 }) => {
  const palette = getPalette(type);
  const iconPath = getIconPath(type);

  // To make the glow proportional to the size
  const stdDeviation = Math.max(4, size / 16);
  const badgeRadius = Math.max(12, size / 9);
  const badgeFontSize = Math.max(12, size / 10);

  return (
    <div style={{ width: size, height: size }}>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 128 128"
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: 'visible' }}
      >
        <defs>
          <linearGradient id={`grad-${type}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={palette.base1} />
            <stop offset="100%" stopColor={palette.base2} />
          </linearGradient>

          <filter id={`glow-${type}`} x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow
              dx="0"
              dy="0"
              stdDeviation={stdDeviation}
              floodColor={palette.glow}
              floodOpacity="0.75"
            />
          </filter>
        </defs>

        {/* Main glowing circle */}
        <g filter={`url(#glow-${type})`}>
          <circle cx="64" cy="64" r="50" fill={`url(#grad-${type})`} />
        </g>

        {/* Glossy highlight */}
        <path
          d="M24,50 C24,40 38,32 64,32 C90,32 104,40 104,50 C104,58 94,60 84,60 C68,60 52,58 40,58 C32,58 28,56 24,50 Z"
          fill="white"
          opacity="0.25"
        />

        {/* Icon Symbol */}
        <g
          fill={palette.iconColor}
          stroke="none"
          transform="translate(32, 32) scale(0.64, 0.64)"
        >
          {iconPath}
        </g>

        {/* Notification Badge */}
        {typeof count !== 'undefined' && count !== null && (
          <g>
            <circle
              cx="104"
              cy="24"
              r={badgeRadius}
              fill="#D93025" // A strong red for the badge
              stroke="#FFF"
              strokeWidth="2"
            />
            <text
              x="104"
              y="24"
              dominantBaseline="central"
              textAnchor="middle"
              fontSize={badgeFontSize}
              fontWeight="bold"
              fill="#FFFFFF"
            >
              {count}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};

function getPalette(type) {
  const palettes = {
    emergencyAlert: { base1: '#FF6B6B', base2: '#FF4C4C', glow: '#FF4C4C', iconColor: '#FFFFFF' },
    warning:        { base1: '#FFD74B', base2: '#FFC93C', glow: '#FFC93C', iconColor: '#000000' },
    reliefTruck:    { base1: '#6BC5FF', base2: '#4CB5FF', glow: '#4CB5FF', iconColor: '#FFFFFF' },
    volunteer:      { base1: '#6BFF9A', base2: '#4CFF88', glow: '#4CFF88', iconColor: '#FFFFFF' },
    safeZone:       { base1: '#6BFF9A', base2: '#4CFF88', glow: '#4CFF88', iconColor: '#FFFFFF' }, // Using green as per spec
    damagedArea:    { base1: '#FFA26B', base2: '#FF8C42', glow: '#FF8C42', iconColor: '#FFFFFF' },
  };
  return palettes[type] || palettes.volunteer;
}

function getIconPath(type) {
  switch (type) {
    case 'emergencyAlert':
      return (
        <g>
          <path d="M50 5 L95 85 L5 85 Z" />
          <path fill="#FF4C4C" d="M46 35 H54 V60 H46z M46 68 H54 V76 H46z" />
        </g>
      );
    case 'warning':
      return (
        <g>
          <path d="M50 5 L95 85 L5 85 Z" />
          <path fill="#FFC93C" d="M46 35 H54 V60 H46z M46 68 H54 V76 H46z" />
        </g>
      );
    case 'reliefTruck':
      return (
        <g>
          <path d="M95 70 V 55 L 75 45 H 60 V 30 H 20 C 10 30, 5 40, 5 50 V 70 H 15 V 80 H 30 V 70 H 80 V 80 H 95 V 70 Z M 22.5 75 A 7.5 7.5 0 1 0 37.5 75 A 7.5 7.5 0 1 0 22.5 75 Z M 72.5 75 A 7.5 7.5 0 1 0 87.5 75 A 7.5 7.5 0 1 0 72.5 75 Z" />
        </g>
      );
    case 'volunteer':
      return (
        <g>
          <circle cx="50" cy="25" r="15" />
          <path d="M50 45 C 30 45, 20 55, 20 70 V 95 H 80 V 70 C 80 55, 70 45, 50 45 Z" />
        </g>
      );
    case 'safeZone':
      return (
        <g strokeWidth="8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M50 5 L95 30 V 60 C 95 80, 50 95, 50 95 C 50 95, 5 80, 5 60 V 30 Z" />
          <path d="M30 50 L45 65 L75 35" stroke="#4CFF88" fill="none" />
        </g>
      );
    case 'damagedArea':
       return (
        <g>
          <path d="M50 5 L5 45 H20 V95 H80 V45 H95 Z" />
          {/* Cracks */}
          <path d="M40 55 L50 45 L60 55" stroke="#FF8C42" fill="none" strokeWidth="4" strokeLinecap="round" />
          <path d="M65 65 L75 75" stroke="#FF8C42" fill="none" strokeWidth="4" strokeLinecap="round" />
          <path d="M25 70 L35 80" stroke="#FF8C42" fill="none" strokeWidth="4" strokeLinecap="round" />
        </g>
      );
    default:
      return null;
  }
}

export default DisasterMapIcon;

