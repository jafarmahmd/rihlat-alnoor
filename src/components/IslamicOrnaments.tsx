import React from 'react';

interface IconProps {
  className?: string;
}

/* =========================================================
 * 1. Bespoke Single-Stroke Islamic Architectural Icon Set
 *    (Consistent strokeWidth=1.55, geometric clarity, zero SaaS boxiness)
 * ========================================================= */

export const QuranBookIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M12 6.5C9.8 4.9 6.5 4.5 3.5 5v12.5c3-.5 6.3 0 8.5 1.5 2.2-1.5 5.5-2 8.5-1.5V5c-3-.5-6.3-.1-8.5 1.5Z" />
    <path d="M12 6.5V19" />
    <path d="M6.5 9.2h2.8M6.5 12.2h2.8M14.7 9.2h2.8M14.7 12.2h2.8" />
    <path d="M8.5 20.8l3.5-1.8 3.5 1.8" />
  </svg>
);

export const DuaScrollIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M7 4.5h10a2.5 2.5 0 0 1 2.5 2.5v10.5a2 2 0 0 1-2 2H6.5a2 2 0 0 1-2-2V7A2.5 2.5 0 0 1 7 4.5Z" />
    <path d="M7 4.5A2.5 2.5 0 0 0 4.5 7M17 4.5A2.5 2.5 0 0 1 19.5 7" />
    <path d="M8.5 9.5h7M8.5 12.8h7M9.5 16h5" />
    <circle cx="12" cy="2.8" r="0.8" fill="currentColor" stroke="none" />
  </svg>
);

export const ShrineDomeIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M12 2.5v2" />
    <path d="M12 4.5c-4 1.8-5.5 4.7-5.5 7.5h11c0-2.8-1.5-5.7-5.5-7.5Z" />
    <path d="M4.5 12h15v8.5h-15V12Z" />
    <path d="M9.5 20.5v-4.2a2.5 2.5 0 0 1 5 0v4.2" />
    <path d="M3 20.5h18" />
  </svg>
);

export const MunajatMoonIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M15.8 4.2a7.5 7.5 0 1 0 4.8 11.7 6.2 6.2 0 0 1-4.8-11.7Z" />
    <path d="M17.5 5.5v3M16 7h3" />
    <circle cx="13.5" cy="11.2" r="0.7" fill="currentColor" stroke="none" />
  </svg>
);

export const TasbihBeadsIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <circle cx="12" cy="11.2" r="6.8" strokeDasharray="0.1 3.55" strokeWidth="2.4" />
    <path d="M12 18v3.2" />
    <path d="M10.2 21.2h3.6" />
    <circle cx="12" cy="4.4" r="1.4" />
  </svg>
);

export const CalendarArchIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <rect x="3.5" y="5" width="17" height="15.5" rx="1.5" />
    <path d="M8 3v3.5M16 3v3.5M3.5 9.5h17" />
    <path d="M13.5 13.5a2.4 2.4 0 1 0 1.8 3.8 2 2 0 0 1-1.8-3.8Z" />
  </svg>
);

export const JourneyCompassIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <circle cx="12" cy="12" r="8.5" />
    <path d="M15.2 8.8l-2 4.8-4.8 2 2-4.8 4.8-2Z" />
    <path d="M12 2v1.5M12 20.5V22M2 12h1.5M20.5 12H22" />
  </svg>
);

export const StoriesLanternIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M12 2.5v2M9 5.5h6l1.5 3v7.5l-2 2.5h-5l-2-2.5V8.5L9 5.5Z" />
    <path d="M8.5 21h7" />
    <path d="M12 10v4.5M10.5 12.2h3" />
  </svg>
);

export const StoreTreasuryIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M4 9.5h16v9.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19V9.5Z" />
    <path d="M4 9.5c0-2.8 3.6-4.5 8-4.5s8 1.7 8 4.5" />
    <path d="M10.5 13h3v3h-3z" />
  </svg>
);

export const HomeArchIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-9Z" />
    <path d="M9.5 21v-5.5a2.5 2.5 0 0 1 5 0V21" />
  </svg>
);

export const AstrolabeIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <circle cx="12" cy="13" r="7.5" />
    <circle cx="12" cy="13" r="3" />
    <path d="M12 2.5v3M9.5 3.5h5M12 9.5v-1.5M12 18v-1.5M8.5 13H7M17 13h-1.5" />
  </svg>
);

export const MinaretAdhanIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M12 2.5v2" />
    <path d="M9.5 7.5C9.5 5.6 10.6 4.5 12 4.5s2.5 1.1 2.5 3v1.5h-5V7.5Z" />
    <path d="M8.5 9h7l-.7 3.5h-5.6L8.5 9Z" />
    <path d="M9.2 12.5h5.6l.8 8.5H8.4l.8-8.5Z" />
    <path d="M6.5 21h11" />
    <path d="M5.2 6.8a3.2 3.2 0 0 0 0 4.4M18.8 6.8a3.2 3.2 0 0 1 0 4.4" />
  </svg>
);

export const CrescentBellIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M12 3.2v1.3" />
    <path d="M6.5 11.2a5.5 5.5 0 0 1 11 0c0 3.2 1.2 5 2 6H4.5c.8-1 2-2.8 2-6Z" />
    <path d="M9.8 17.2a2.2 2.2 0 0 0 4.4 0" />
    <path d="M13.2 9.4a2.3 2.3 0 1 0 1.4 3.4 1.8 1.8 0 0 1-1.4-3.4Z" />
  </svg>
);

export const NightPrayerLampIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M14.5 3.5a5.5 5.5 0 1 0 4 9.2 4.5 4.5 0 0 1-4-9.2Z" />
    <path d="M8 13.5h6l1.3 2.5v3.5l-1.8 1.5h-5l-1.8-1.5V16L8 13.5Z" />
    <path d="M11 10.5v3" />
    <path d="M11 16.2v2.2" />
  </svg>
);

/* =========================================================
 * 2. Calendar Geometric Markers (Birth Star / Martyrdom Crescent / Eid Rosette)
 * ========================================================= */

export const BirthStarMark: React.FC<IconProps> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M12 1.5l2.6 6.2 6.2 2.6-6.2 2.6-2.6 6.2-2.6-6.2-6.2-2.6 6.2-2.6L12 1.5Z" />
    <circle cx="12" cy="10.3" r="1.4" fill="white" fillOpacity="0.5" />
  </svg>
);

export const MartyrdomCrescentMark: React.FC<IconProps> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M15.5 3.5a8.5 8.5 0 1 0 5 15.2A7 7 0 0 1 15.5 3.5Z" />
  </svg>
);

export const EidRosetteMark: React.FC<IconProps> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={className} aria-hidden="true">
    <path d="M12 2l2.4 4.1 4.7-.7-.7 4.7L22 12l-3.6 1.9.7 4.7-4.7-.7L12 22l-2.4-4.1-4.7.7.7-4.7L2 12l3.6-1.9-.7-4.7 4.7.7L12 2Z" fill="currentColor" fillOpacity="0.16" />
    <circle cx="12" cy="12" r="2.3" fill="currentColor" />
  </svg>
);

/* =========================================================
 * 3. Manuscript Dividers, Rosette Ayah Markers, Corner Brackets & Surah Cartouche
 * ========================================================= */

export const ManuscriptDivider: React.FC<{
  variant?: 'rosette' | 'crescent' | 'flourish';
  dark?: boolean;
  className?: string;
}> = ({ variant = 'rosette', dark = false, className = '' }) => {
  const strokeColor = dark ? '#D9B96A' : '#B8924A';
  const accentColor = dark ? '#347A61' : '#0F3D2E';

  return (
    <div className={`flex items-center justify-center gap-3 my-4 ${className}`} aria-hidden="true">
      <div
        className="h-[1px] flex-1 max-w-[140px]"
        style={{
          background: `linear-gradient(to left, ${strokeColor}99, transparent)`,
        }}
      />
      {variant === 'rosette' && (
        <svg viewBox="0 0 40 24" className="w-10 h-6 shrink-0" fill="none">
          <path
            d="M20 3l2.6 4.8 5.2-.8-.8 5.2L31 12l-4 2.8.8 5.2-5.2-.8L20 21l-2.6-1.8-5.2.8.8-5.2L9 12l4-2.8-.8-5.2 5.2.8L20 3Z"
            stroke={strokeColor}
            strokeWidth="1.2"
            fill={strokeColor}
            fillOpacity="0.14"
          />
          <circle cx="20" cy="12" r="2.2" fill={accentColor} />
          <circle cx="4" cy="12" r="1.2" fill={strokeColor} />
          <circle cx="36" cy="12" r="1.2" fill={strokeColor} />
        </svg>
      )}
      {variant === 'crescent' && (
        <svg viewBox="0 0 44 24" className="w-11 h-6 shrink-0" fill="none">
          <path d="M12 12h6M26 12h6" stroke={strokeColor} strokeWidth="1.1" />
          <path
            d="M23.8 6.4a5.8 5.8 0 1 0 3.2 10.6 4.8 4.8 0 0 1-3.2-10.6Z"
            fill={strokeColor}
          />
          <circle cx="6" cy="12" r="1.4" fill={strokeColor} />
          <circle cx="38" cy="12" r="1.4" fill={strokeColor} />
        </svg>
      )}
      {variant === 'flourish' && (
        <svg viewBox="0 0 56 20" className="w-14 h-5 shrink-0" fill="none">
          <path
            d="M4 10c6-5 12-5 18 0s12 5 18 0c4-3 8-3 12 0"
            stroke={strokeColor}
            strokeWidth="1.25"
            strokeLinecap="round"
          />
          <path
            d="M28 4l3 6-3 6-3-6 3-6Z"
            fill={strokeColor}
            fillOpacity="0.22"
            stroke={strokeColor}
            strokeWidth="1"
          />
        </svg>
      )}
      <div
        className="h-[1px] flex-1 max-w-[140px]"
        style={{
          background: `linear-gradient(to right, ${strokeColor}99, transparent)`,
        }}
      />
    </div>
  );
};

export type CornerPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
export type CornerOrnamentsVariant = 'all' | 'top' | 'diagonal';
export type CornerOrnamentsTone = 'auto' | 'light' | 'dark';

const ALL_CORNERS: CornerPosition[] = [
  'top-left',
  'top-right',
  'bottom-left',
  'bottom-right',
];

const TOP_CORNERS: CornerPosition[] = ['top-left', 'top-right'];
const DIAGONAL_CORNERS: CornerPosition[] = ['top-right', 'bottom-left'];

/**
 * Single canonical top-left corner SVG ornament, mirrored via CSS scaleX/scaleY
 * on physical coordinates (top/left/right/bottom) so all 4 corners are 100% symmetrical
 * regardless of RTL direction and follow rounded-[6px] container curvature cleanly.
 */
export const ManuscriptCornerBracket: React.FC<{
  position: CornerPosition;
  color?: string;
  tone?: CornerOrnamentsTone;
  className?: string;
}> = ({ position, color, tone = 'auto', className = '' }) => {
  const toneAttr = tone === 'auto' ? undefined : tone;
  const strokeColor = color ?? 'currentColor';

  return (
    <svg
      viewBox="0 0 36 36"
      fill="none"
      data-corner-tone={toneAttr}
      className={`corner-ornament corner-ornament--${position} ${className}`.trim()}
      style={color ? { color } : undefined}
      aria-hidden="true"
    >
      {/* Outer gilded bracket arm curving outward to match rounded-[6px] frame */}
      <path
        d="M33.5 2.5H7.2A4.7 4.7 0 0 0 2.5 7.2V33.5"
        stroke={strokeColor}
        strokeOpacity="0.82"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        style={{ strokeWidth: 'var(--corner-stroke)' }}
      />
      {/* Parallel inner hairline accent */}
      <path
        d="M25.5 6.5H9.5A3 3 0 0 0 6.5 9.5V25.5"
        stroke={strokeColor}
        strokeOpacity="0.48"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        style={{ strokeWidth: 'calc(var(--corner-stroke) * 0.65)' }}
      />
      {/* Corner illuminated diamond jewel */}
      <path
        d="M12 9.2L14.8 12L12 14.8L9.2 12Z"
        fill={strokeColor}
        fillOpacity="0.26"
        stroke={strokeColor}
        strokeOpacity="0.85"
        vectorEffect="non-scaling-stroke"
        style={{ strokeWidth: 'calc(var(--corner-stroke) * 0.7)' }}
      />
      <circle cx="12" cy="12" r="1.1" fill={strokeColor} fillOpacity="0.92" />
      {/* Subtle tip finials */}
      <circle cx="33.5" cy="2.5" r="1" fill={strokeColor} fillOpacity="0.72" />
      <circle cx="2.5" cy="33.5" r="1" fill={strokeColor} fillOpacity="0.72" />
    </svg>
  );
};

export const CornerOrnaments: React.FC<{
  variant?: CornerOrnamentsVariant;
  tone?: CornerOrnamentsTone;
  color?: string;
  className?: string;
}> = ({ variant = 'all', tone = 'auto', color, className = '' }) => {
  const positions =
    variant === 'top'
      ? TOP_CORNERS
      : variant === 'diagonal'
      ? DIAGONAL_CORNERS
      : ALL_CORNERS;

  return (
    <>
      {positions.map((pos) => (
        <ManuscriptCornerBracket
          key={pos}
          position={pos}
          tone={tone}
          color={color}
          className={className}
        />
      ))}
    </>
  );
};

export const AyahRosetteMarker: React.FC<{
  numberArabic: string;
  dark?: boolean;
  highlighted?: boolean;
}> = ({ numberArabic, dark = false, highlighted = false }) => {
  const stroke = highlighted ? '#0F3D2E' : dark ? '#D9B96A' : '#B8924A';
  const fillBg = highlighted
    ? 'rgba(217, 185, 106, 0.35)'
    : dark
    ? 'rgba(217, 185, 106, 0.14)'
    : 'rgba(184, 146, 74, 0.12)';
  const textCol = highlighted ? '#0F3D2E' : dark ? '#F5E7C1' : '#0F3D2E';

  return (
    <span
      className="inline-flex items-center justify-center relative align-middle mx-1.5 select-none"
      style={{ width: '1.9em', height: '1.9em' }}
      aria-label={`آية ${numberArabic}`}
    >
      <svg viewBox="0 0 40 40" className="w-full h-full" fill="none" aria-hidden="true">
        <path
          d="M20 2.5L24.7 7.2H31.3L32.8 13.8L37.5 20L32.8 26.2L31.3 32.8H24.7L20 37.5L15.3 32.8H8.7L7.2 26.2L2.5 20L7.2 13.8L8.7 7.2H15.3L20 2.5Z"
          fill={fillBg}
          stroke={stroke}
          strokeWidth="1.4"
        />
        <circle cx="20" cy="20" r="11.5" stroke={stroke} strokeWidth="0.8" strokeOpacity="0.65" />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center font-arabic font-bold tabular-nums"
        style={{
          fontSize: numberArabic.length > 2 ? '0.46em' : '0.54em',
          color: textCol,
          lineHeight: 1,
        }}
      >
        {numberArabic}
      </span>
    </span>
  );
};

export const SurahCartoucheHeader: React.FC<{
  surahName: string;
  revelationType: 'مكية' | 'مدنية' | string;
  ayahCountArabic: string;
  dark?: boolean;
}> = ({ surahName, revelationType, ayahCountArabic, dark = false }) => {
  const gold = dark ? '#D9B96A' : '#B8924A';
  const bg = dark ? '#0D2A20' : '#F6EFDC';
  const innerBg = dark ? '#081D16' : '#FAF6EC';
  const titleColor = dark ? '#F5E7C1' : '#0F3D2E';
  const subColor = dark ? '#C8B88A' : '#536A60';

  return (
    <div
      className="relative my-2 mx-auto max-w-2xl p-2 sm:p-2.5"
      style={{
        backgroundColor: bg,
        border: `1.5px solid ${gold}`,
        boxShadow: dark
          ? '0 4px 16px rgba(0,0,0,0.45), inset 0 0 0 3px #0B221A, inset 0 0 0 4px rgba(217,185,106,0.35)'
          : '0 4px 14px rgba(15,61,46,0.08), inset 0 0 0 3px #FAF6EC, inset 0 0 0 4px rgba(184,146,74,0.45)',
      }}
    >
      <div
        className="relative flex flex-col sm:flex-row items-center justify-between gap-2 px-4 sm:px-7 py-3"
        style={{ backgroundColor: innerBg, border: `1px solid ${gold}70` }}
      >
        {/* Right Floral Medallion */}
        <svg viewBox="0 0 36 36" className="w-7 h-7 hidden sm:block shrink-0" fill="none" aria-hidden="true">
          <path
            d="M18 3l3.6 6.4 6.4 3.6-6.4 3.6L18 23l-3.6-6.4L8 13l6.4-3.6L18 3Z"
            stroke={gold}
            strokeWidth="1.2"
            fill={gold}
            fillOpacity="0.18"
          />
          <circle cx="18" cy="13" r="2.2" fill={gold} />
        </svg>

        <div className="text-center flex-1">
          <h2
            className="font-calligraphy font-bold text-2xl sm:text-3xl leading-snug"
            style={{ color: titleColor }}
          >
            سورة {surahName}
          </h2>
          <p className="text-xs font-medium tracking-wide mt-0.5" style={{ color: subColor }}>
            {revelationType} &nbsp;·&nbsp; آياتها {ayahCountArabic}
          </p>
        </div>

        {/* Left Floral Medallion */}
        <svg viewBox="0 0 36 36" className="w-7 h-7 hidden sm:block shrink-0" fill="none" aria-hidden="true">
          <path
            d="M18 3l3.6 6.4 6.4 3.6-6.4 3.6L18 23l-3.6-6.4L8 13l6.4-3.6L18 3Z"
            stroke={gold}
            strokeWidth="1.2"
            fill={gold}
            fillOpacity="0.18"
          />
          <circle cx="18" cy="13" r="2.2" fill={gold} />
        </svg>
      </div>
    </div>
  );
};

export const ManuscriptSpinner: React.FC<{ label?: string; dark?: boolean }> = ({
  label = 'جارٍ الإعداد...',
  dark = false,
}) => (
  <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
    <svg
      viewBox="0 0 48 48"
      className="w-11 h-11 animate-astrolabe"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="24" cy="24" r="20" stroke={dark ? '#D9B96A' : '#B8924A'} strokeWidth="1.2" strokeOpacity="0.45" />
      <path
        d="M24 4l4 13 13 4-13 4-4 13-4-13-13-4 13-4 4-13Z"
        stroke={dark ? '#D9B96A' : '#0F3D2E'}
        strokeWidth="1.35"
        fill={dark ? 'rgba(217,185,106,0.16)' : 'rgba(184,146,74,0.14)'}
      />
      <circle cx="24" cy="24" r="3" fill={dark ? '#D9B96A' : '#B8924A'} />
    </svg>
    <span className={`text-xs font-medium ${dark ? 'text-[#E7D8B0]' : 'text-[#425B51]'}`}>
      {label}
    </span>
  </div>
);

/* =========================================================
 * 4. Home Screen Bespoke Single-Stroke Icon Set & SVG Artworks
 * ========================================================= */

export const InfoCircleArchIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <circle cx="12" cy="12" r="8.8" />
    <path d="M12 11.2v4.8" />
    <circle cx="12" cy="8.1" r="0.9" fill="currentColor" stroke="none" />
  </svg>
);

export const BookmarkStarIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M6.5 4.2h11a1.5 1.5 0 0 1 1.5 1.5v14.8l-7-4.1-7 4.1V5.7a1.5 1.5 0 0 1 1.5-1.5Z" />
    <path d="M12 7.8l.85 1.75 1.95.28-1.4 1.36.33 1.93L12 12.2l-1.73.92.33-1.93-1.4-1.36 1.95-.28L12 7.8Z" />
  </svg>
);

export const SearchCrescentIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <circle cx="10.8" cy="10.8" r="6.6" />
    <path d="M15.6 15.6l4.4 4.4" />
    <path d="M10.8 7.5v1M8.2 10.8h1" />
  </svg>
);

export const PinArchIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M12 20.8s6-5.2 6-10.3a6 6 0 1 0-12 0c0 5.1 6 10.3 6 10.3Z" />
    <circle cx="12" cy="10.4" r="2.1" />
  </svg>
);

export const FajrHorizonIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M4 17.5h16" />
    <path d="M7.5 17.5a4.5 4.5 0 0 1 9 0" />
    <path d="M12 6.5v2.2M6.2 9.5l1.5 1.5M17.8 9.5l-1.5 1.5" />
  </svg>
);

export const SunriseOrbIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M3.5 18h17" />
    <path d="M7 18a5 5 0 0 1 10 0" />
    <path d="M12 5.2V8M9.8 7.4L12 5.2l2.2 2.2M5.5 11.2l1.6 1.1M18.5 11.2l-1.6 1.1" />
  </svg>
);

export const NoonSunIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6 6l1.6 1.6M16.4 16.4L18 18M18 6l-1.6 1.6M7.6 16.4L6 18" />
  </svg>
);

export const AsrSunIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <circle cx="11" cy="11" r="3.6" />
    <path d="M11 4v1.8M11 16.2V18M4 11h1.8M16.2 11H18M6.1 6.1l1.3 1.3M14.6 14.6l1.3 1.3" />
    <path d="M4 19.5h16" />
  </svg>
);

export const SunsetHorizonIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M3.5 17h17" />
    <path d="M7.5 17a4.5 4.5 0 0 1 9 0" />
    <path d="M12 9.5V6M9.8 7.3L12 9.5l2.2-2.2" />
  </svg>
);

export const MaghribCrescentIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M15.2 5.4a6.4 6.4 0 1 0 3.6 11.2A5.3 5.3 0 0 1 15.2 5.4Z" />
    <path d="M4 19.2h16" />
  </svg>
);

export const IshaStarsIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M14.5 5a6.5 6.5 0 1 0 4.5 11.1A5.4 5.4 0 0 1 14.5 5Z" />
    <path d="M17.5 5.5v2.6M16.2 6.8h2.6M19.5 10.2v1.6M18.7 11h1.6" />
  </svg>
);

export const MidnightStarMoonIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M12 4.2l1.2 3.1 3.1 1.2-3.1 1.2L12 12.8l-1.2-3.1-3.1-1.2 3.1-1.2L12 4.2Z" />
    <path d="M5.5 15.5c2 2.2 4.2 3.3 6.5 3.3s4.5-1.1 6.5-3.3" />
    <circle cx="6.2" cy="7.5" r="0.8" fill="currentColor" stroke="none" />
    <circle cx="18.2" cy="14" r="0.8" fill="currentColor" stroke="none" />
  </svg>
);

export const MafatihKeyIcon: React.FC<IconProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <circle cx="8.5" cy="9.5" r="4.2" />
    <circle cx="8.5" cy="9.5" r="1.4" />
    <path d="M11.6 12.6L19.5 20.5M16.2 17.2l2.1-2.1M14.2 19.2l1.6-1.6" />
  </svg>
);

export const WeeklySunScrollIcon: React.FC<IconProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <rect x="4" y="5.5" width="16" height="14.5" rx="2.5" />
    <path d="M8 3.5v3.5M16 3.5v3.5M4 10h16" />
    <path d="M8.5 14h2.5M13 14h2.5M8.5 17h5" />
  </svg>
);

export const SeasonalCrescentCalendarIcon: React.FC<IconProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M12 3.2c-4.2 1.8-6.5 4.8-6.5 8.8 0 4.2 3 7.5 6.5 8.8 3.5-1.3 6.5-4.6 6.5-8.8 0-4-2.3-7-6.5-8.8Z" />
    <path d="M13.6 8.8a3.2 3.2 0 1 0 1.8 5.8 2.6 2.6 0 0 1-1.8-5.8Z" />
  </svg>
);

export const DhikrHandsIcon: React.FC<IconProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M12 4.2l1.3 2.7 3 .4-2.2 2.1.5 3-2.6-1.4-2.6 1.4.5-3-2.2-2.1 3-.4L12 4.2Z" />
    <path d="M5.5 13.5v3.2c0 1.9 2.2 3.3 6.5 3.3s6.5-1.4 6.5-3.3v-3.2" />
    <path d="M8.5 16.4h7" />
  </svg>
);

export const SahifaManuscriptIcon: React.FC<IconProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M6 4.5h10.5A2.5 2.5 0 0 1 19 7v12.5H7.5A2.5 2.5 0 0 1 5 17V5.5a1 1 0 0 1 1-1Z" />
    <path d="M5 17a2.5 2.5 0 0 1 2.5-2.5H19" />
    <path d="M9 8.5h6.5M9 11.5h5" />
  </svg>
);

export const QiblaKaabaCompassIcon: React.FC<IconProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <circle cx="12" cy="12" r="8.8" />
    <rect x="8.8" y="8.8" width="6.4" height="6.4" rx="0.8" />
    <path d="M8.8 11.2h6.4M12 3.2v1.6M12 19.2v1.6M3.2 12h1.6M19.2 12h1.6" />
  </svg>
);

export const KidsQuizLanternIcon: React.FC<IconProps> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M5 6.5h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H9.8L6 20.5v-3H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z" />
    <path d="M10.4 10.3a1.8 1.8 0 0 1 3.3.9c0 1.1-1.6 1.4-1.6 2.3" />
    <circle cx="12" cy="15.3" r="0.7" fill="currentColor" stroke="none" />
  </svg>
);

/**
 * Fine gold SVG dome & crescent corner ornament for the Home top dark emerald canvas
 */
export const HomeDomeCornerSvg: React.FC<{ className?: string }> = ({
  className = '',
}) => (
  <svg
    viewBox="0 0 220 200"
    fill="none"
    className={className}
    aria-hidden="true"
  >
    {/* Outer arched dome filigree */}
    <path
      d="M18 196V128C18 82 62 46 110 22C158 46 202 82 202 128V196"
      stroke="#D9B96A"
      strokeWidth="0.9"
      strokeOpacity="0.32"
    />
    <path
      d="M38 196V132C38 94 74 64 110 42C146 64 182 94 182 132V196"
      stroke="#D9B96A"
      strokeWidth="0.75"
      strokeOpacity="0.22"
    />
    {/* Finial & crescent */}
    <path
      d="M110 6v16"
      stroke="#D9B96A"
      strokeWidth="0.9"
      strokeOpacity="0.45"
    />
    <path
      d="M114.5 9.2a6.2 6.2 0 1 0 3.2 10.2 5 5 0 0 1-3.2-10.2Z"
      stroke="#D9B96A"
      strokeWidth="0.95"
      strokeOpacity="0.55"
    />
    {/* Hanging geometric star */}
    <path
      d="M110 74l5.5 11 11 5.5-11 5.5-5.5 11-5.5-11-11-5.5 11-5.5 5.5-11Z"
      stroke="#D9B96A"
      strokeWidth="0.85"
      strokeOpacity="0.26"
    />
    <circle cx="110" cy="90.5" r="2.2" fill="#D9B96A" fillOpacity="0.32" />
  </svg>
);

/**
 * Fully SVG-illustrated wide banner inside the Home Bottom Sheet (zero photos)
 */
export const HomeIllustratedBannerSvg: React.FC<{ dark?: boolean }> = ({
  dark = false,
}) => {
  const gold = dark ? '#D9B96A' : '#E2C374';
  return (
    <div
      className="relative overflow-hidden px-5 py-4 sm:py-5 flex items-center justify-between gap-4 border"
      style={{
        borderRadius: 'var(--radius-tile)',
        background: dark
          ? 'linear-gradient(135deg, #09241B 0%, #103A2C 52%, #0A271E 100%)'
          : 'linear-gradient(135deg, #0F3D2E 0%, #1A5B44 52%, #114332 100%)',
        borderColor: dark ? 'rgba(217, 185, 106, 0.35)' : 'rgba(217, 185, 106, 0.55)',
        boxShadow: '0 8px 24px -10px rgba(15, 61, 46, 0.38)',
      }}
    >
      {/* Subtle SVG star-lattice overlay */}
      <svg
        viewBox="0 0 400 120"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full pointer-events-none opacity-20"
        aria-hidden="true"
      >
        <defs>
          <pattern id="homeBannerStars" width="48" height="48" patternUnits="userSpaceOnUse">
            <path
              d="M24 4L29 19L44 24L29 29L24 44L19 29L4 24L19 19Z"
              fill="none"
              stroke={gold}
              strokeWidth="0.7"
            />
            <circle cx="24" cy="24" r="3.5" fill="none" stroke={gold} strokeWidth="0.6" />
          </pattern>
        </defs>
        <rect width="400" height="120" fill="url(#homeBannerStars)" />
      </svg>

      {/* Inner ornate gold hairline border */}
      <div
        className="pointer-events-none absolute inset-1.5 border"
        style={{
          borderRadius: '14px',
          borderColor: dark ? 'rgba(217, 185, 106, 0.25)' : 'rgba(217, 185, 106, 0.38)',
        }}
        aria-hidden="true"
      />

      {/* Calligraphic Text & Subtitle */}
      <div className="relative z-10 text-right flex-1 min-w-0">
        <span className="inline-block text-[10px] font-bold tracking-wide text-[#D9B96A]/90 mb-0.5">
          القرآن · الأدعية · الزيارات · السيرة
        </span>
        <h2 className="font-calligraphy font-bold text-2xl sm:text-3xl text-[#FAF6EC] leading-tight">
          رحلة النور
        </h2>
        <p className="text-[11px] sm:text-xs text-[#E7D8B0]/85 mt-0.5 truncate">
          زادك الروحي اليومي بتصميمٍ هادئٍ وموثوق
        </p>
      </div>

      {/* Ornate Octagram Star Emblem */}
      <div className="relative z-10 shrink-0 w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
        <svg viewBox="0 0 80 80" fill="none" className="w-full h-full" aria-hidden="true">
          <rect
            x="16"
            y="16"
            width="48"
            height="48"
            rx="4"
            stroke={gold}
            strokeWidth="1.2"
            strokeOpacity="0.75"
          />
          <rect
            x="16"
            y="16"
            width="48"
            height="48"
            rx="4"
            transform="rotate(45 40 40)"
            stroke={gold}
            strokeWidth="1.2"
            fill={gold}
            fillOpacity="0.1"
          />
          <circle cx="40" cy="40" r="14" stroke={gold} strokeWidth="1" strokeOpacity="0.75" />
          <path
            d="M44.2 31.2a8.2 8.2 0 1 0 4.4 13.8 6.8 6.8 0 0 1-4.4-13.8Z"
            fill={gold}
          />
        </svg>
      </div>
    </div>
  );
};
