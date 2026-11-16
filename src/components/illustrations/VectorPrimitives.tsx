import React from 'react';

export type BackdropKind =
  | 'day_garden'
  | 'night_medina'
  | 'courtyard_arch'
  | 'desert_oasis'
  | 'study_library'
  | 'market_square'
  | 'mosque_arch'
  | 'home_terrace';

export const SceneBackdrop: React.FC<{ kind: BackdropKind; uid: string }> = ({
  kind,
  uid,
}) => {
  switch (kind) {
    case 'night_medina':
      return (
        <g>
          <defs>
            <linearGradient id={`sky-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1E3A5F" />
              <stop offset="60%" stopColor="#2B5876" />
              <stop offset="100%" stopColor="#4A7C7E" />
            </linearGradient>
          </defs>
          <rect width="800" height="360" fill={`url(#sky-${uid})`} />
          {/* Crescent Moon & Stars */}
          <path
            d="M 118 52 A 26 26 0 1 0 144 86 A 20 20 0 1 1 118 52 Z"
            fill="#FDE68A"
          />
          <g fill="#FEF3C7">
            <circle cx="230" cy="46" r="2.5" />
            <circle cx="340" cy="70" r="2" />
            <circle cx="480" cy="38" r="3" />
            <circle cx="620" cy="64" r="2.2" />
            <circle cx="710" cy="48" r="2.8" />
          </g>
          {/* Distant Mud-Brick Homes & Palms */}
          <path d="M0 245 Q220 215 440 245 T800 235 L800 360 L0 360 Z" fill="#1F4E46" opacity="0.55" />
          <rect x="65" y="185" width="95" height="80" rx="4" fill="#D6C7A9" opacity="0.85" />
          <rect x="630" y="175" width="110" height="90" rx="4" fill="#C9B796" opacity="0.85" />
          <rect x="0" y="255" width="800" height="105" fill="#E6D8B8" opacity="0.28" />
          <path d="M0 265 Q400 250 800 268 L800 360 L0 360 Z" fill="#D9C7A3" />
        </g>
      );

    case 'courtyard_arch':
      return (
        <g>
          <defs>
            <linearGradient id={`sky-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#BAE6FD" />
              <stop offset="100%" stopColor="#ECFDF5" />
            </linearGradient>
          </defs>
          <rect width="800" height="360" fill={`url(#sky-${uid})`} />
          <circle cx="670" cy="68" r="38" fill="#FEF3C7" opacity="0.9" />
          {/* Courtyard Wall & Islamic Arch */}
          <rect x="0" y="235" width="800" height="125" fill="#E7DFCC" />
          <path d="M210 250 L210 115 Q400 25 590 115 L590 250 Z" fill="#A7F3D0" opacity="0.4" stroke="#059669" strokeWidth="5" />
          <path d="M245 250 L245 130 Q400 55 555 130 L555 250 Z" fill="#F0FDF4" opacity="0.65" />
          {/* Hanging Golden Lanterns */}
          <line x1="400" y1="68" x2="400" y2="108" stroke="#D97706" strokeWidth="2.5" />
          <rect x="389" y="108" width="22" height="30" rx="6" fill="#FDE68A" stroke="#D97706" strokeWidth="2" />
          <circle cx="400" cy="123" r="6" fill="#FFFFFF" opacity="0.9" />
          <path d="M0 265 L800 265 L800 360 L0 360 Z" fill="#D6CCB4" />
        </g>
      );

    case 'desert_oasis':
      return (
        <g>
          <defs>
            <linearGradient id={`sky-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7DD3FC" />
              <stop offset="65%" stopColor="#E0F2FE" />
              <stop offset="100%" stopColor="#FEF3C7" />
            </linearGradient>
          </defs>
          <rect width="800" height="360" fill={`url(#sky-${uid})`} />
          <circle cx="145" cy="75" r="42" fill="#FDE68A" opacity="0.85" />
          {/* Soft Rolling Dunes */}
          <path d="M0 230 Q200 185 430 225 T800 210 L800 360 L0 360 Z" fill="#FDE68A" opacity="0.65" />
          <path d="M0 255 Q280 225 540 255 T800 245 L800 360 L0 360 Z" fill="#F3D999" />
          {/* Oasis Palm Tree on Right */}
          <path d="M700 260 Q710 175 692 125" stroke="#92400E" strokeWidth="14" strokeLinecap="round" fill="none" />
          <g fill="#10B981">
            <path d="M692 125 Q640 105 615 135 Q655 130 692 125 Z" />
            <path d="M692 125 Q655 75 685 60 Q695 95 692 125 Z" />
            <path d="M692 125 Q735 80 760 110 Q725 115 692 125 Z" />
            <path d="M692 125 Q745 125 765 155 Q725 140 692 125 Z" />
          </g>
        </g>
      );

    case 'study_library':
      return (
        <g>
          <defs>
            <linearGradient id={`wall-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FEFCE8" />
              <stop offset="100%" stopColor="#ECFDF5" />
            </linearGradient>
          </defs>
          <rect width="800" height="360" fill={`url(#wall-${uid})`} />
          {/* Arched Window showing Sky */}
          <path d="M510 240 L510 105 Q600 40 690 105 L690 240 Z" fill="#BAE6FD" stroke="#B45309" strokeWidth="6" />
          <path d="M515 215 Q600 185 685 215 L685 240 L515 240 Z" fill="#6EE7B7" />
          {/* Bookshelf on Left */}
          <rect x="48" y="65" width="135" height="190" rx="6" fill="#B45309" opacity="0.22" stroke="#92400E" strokeWidth="3" />
          <line x1="48" y1="128" x2="183" y2="128" stroke="#92400E" strokeWidth="3" />
          <line x1="48" y1="190" x2="183" y2="190" stroke="#92400E" strokeWidth="3" />
          <rect x="62" y="84" width="16" height="42" rx="2" fill="#059669" />
          <rect x="82" y="90" width="14" height="36" rx="2" fill="#0284C7" />
          <rect x="100" y="80" width="18" height="46" rx="2" fill="#D97706" />
          <rect x="122" y="88" width="15" height="38" rx="2" fill="#0D9488" />
          {/* Wooden Floor */}
          <rect x="0" y="255" width="800" height="105" fill="#E7D7B9" />
        </g>
      );

    case 'market_square':
      return (
        <g>
          <defs>
            <linearGradient id={`sky-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#BAE6FD" />
              <stop offset="100%" stopColor="#FEF9C3" />
            </linearGradient>
          </defs>
          <rect width="800" height="360" fill={`url(#sky-${uid})`} />
          {/* Market Canopy & Stone Buildings */}
          <rect x="45" y="135" width="160" height="130" rx="6" fill="#E9DEC4" />
          <path d="M35 135 L125 95 L215 135 Z" fill="#10B981" />
          <rect x="595" y="135" width="160" height="130" rx="6" fill="#E9DEC4" />
          <path d="M585 135 L675 95 L765 135 Z" fill="#0EA5E9" />
          <rect x="0" y="258" width="800" height="102" fill="#DDD0B4" />
        </g>
      );

    case 'mosque_arch':
      return (
        <g>
          <defs>
            <linearGradient id={`sky-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#D1FAE5" />
              <stop offset="100%" stopColor="#FEFCE8" />
            </linearGradient>
          </defs>
          <rect width="800" height="360" fill={`url(#sky-${uid})`} />
          {/* Grand Emerald & Gold Pillars */}
          <path d="M120 265 L120 110 Q400 10 680 110 L680 265 Z" fill="#FFFFFF" opacity="0.7" stroke="#059669" strokeWidth="6" />
          <path d="M170 265 L170 130 Q400 45 630 130 L630 265 Z" fill="#E0F2FE" opacity="0.45" stroke="#F59E0B" strokeWidth="3" />
          {/* Woven Prayer Carpet */}
          <rect x="0" y="260" width="800" height="100" fill="#A7F3D0" opacity="0.55" />
          <rect x="140" y="272" width="520" height="70" rx="12" fill="#059669" opacity="0.22" stroke="#059669" strokeWidth="2" />
        </g>
      );

    case 'home_terrace':
      return (
        <g>
          <defs>
            <linearGradient id={`sky-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E0F2FE" />
              <stop offset="100%" stopColor="#ECFDF5" />
            </linearGradient>
          </defs>
          <rect width="800" height="360" fill={`url(#sky-${uid})`} />
          <rect x="85" y="105" width="230" height="165" rx="8" fill="#F5EFE0" stroke="#CBB994" strokeWidth="3" />
          <path d="M145 270 L145 170 Q180 140 215 170 L215 270 Z" fill="#92400E" opacity="0.82" />
          <rect x="490" y="120" width="215" height="150" rx="8" fill="#F5EFE0" stroke="#CBB994" strokeWidth="3" />
          <path d="M545 270 L545 178 Q575 152 605 178 L605 270 Z" fill="#047857" opacity="0.75" />
          <rect x="0" y="265" width="800" height="95" fill="#E5D9BE" />
        </g>
      );

    case 'day_garden':
    default:
      return (
        <g>
          <defs>
            <linearGradient id={`sky-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#BAE6FD" />
              <stop offset="65%" stopColor="#E0F2FE" />
              <stop offset="100%" stopColor="#ECFDF5" />
            </linearGradient>
          </defs>
          <rect width="800" height="360" fill={`url(#sky-${uid})`} />
          <circle cx="680" cy="65" r="38" fill="#FEF3C7" />
          <g fill="#FFFFFF" opacity="0.82">
            <ellipse cx="170" cy="68" rx="52" ry="18" />
            <ellipse cx="205" cy="58" rx="34" ry="16" />
            <ellipse cx="470" cy="54" rx="45" ry="15" />
          </g>
          <path d="M0 235 Q240 190 500 235 T800 220 L800 360 L0 360 Z" fill="#A7F3D0" opacity="0.75" />
          <path d="M0 265 Q300 245 580 268 T800 258 L800 360 L0 360 Z" fill="#6EE7B7" opacity="0.5" />
          <rect x="0" y="275" width="800" height="85" fill="#86EFAC" opacity="0.45" />
        </g>
      );
  }
};

/**
 * LuminousFigure (شخصية المعصوم عليه السلام)
 * STRICTLY respects Islamic artistic tradition:
 * NEVER draws facial details (no eyes, nose, mouth, or eyebrows).
 * Depicts the noble presence with flowing traditional robes and a serene,
 * radiant golden-white halo / veil of light (نور ساطع وهادئ) or back-turned peaceful silhouette.
 */
export const LuminousFigure: React.FC<{
  x: number;
  y: number;
  scale?: number;
  pose?: 'standing' | 'giving' | 'kneeling' | 'praying' | 'walking_back' | 'working';
  robeColor?: string;
  cloakColor?: string;
  turban?: boolean;
  veil?: boolean;
  flipX?: boolean;
  uid: string;
}> = ({
  x,
  y,
  scale = 1,
  pose = 'standing',
  robeColor = '#ECFDF5',
  cloakColor = '#047857',
  turban = true,
  veil = false,
  flipX = false,
  uid,
}) => {
  const transform = `translate(${x}, ${y}) scale(${flipX ? -scale : scale}, ${scale})`;

  return (
    <g transform={transform}>
      <defs>
        <radialGradient id={`halo-${uid}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
          <stop offset="38%" stopColor="#FEF3C7" stopOpacity="0.96" />
          <stop offset="72%" stopColor="#FDE68A" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
        </radialGradient>
      </defs>

      {pose === 'praying' ? (
        <g>
          {/* Serene kneeling / prostrating figure with luminous aura */}
          <ellipse cx="0" cy="48" rx="48" ry="10" fill="#065F46" opacity="0.14" />
          <path d="M-38 44 Q-15 5 18 12 Q38 18 35 44 Z" fill={cloakColor} />
          <path d="M-24 44 Q-5 15 16 20 Q28 24 25 44 Z" fill={robeColor} />
          <circle cx="30" cy="18" r="34" fill={`url(#halo-${uid})`} />
          <circle cx="30" cy="18" r="14" fill="#FFFBEB" />
          {turban && (
            <path d="M16 14 Q30 -2 44 14 Q30 18 16 14 Z" fill="#FFFFFF" stroke="#D1FAE5" strokeWidth="1.5" />
          )}
        </g>
      ) : pose === 'kneeling' ? (
        <g>
          <ellipse cx="0" cy="56" rx="40" ry="9" fill="#065F46" opacity="0.14" />
          {/* Flowing cloak */}
          <path d="M-28 52 Q-26 0 -10 -20 L14 -20 Q30 4 28 52 Z" fill={cloakColor} />
          <path d="M-12 52 L-10 -14 L12 -14 L14 52 Z" fill={robeColor} />
          {/* Gentle extending arm */}
          <path d="M12 -4 L42 12 L36 20 L10 8 Z" fill={cloakColor} />
          <circle cx="42" cy="15" r="6" fill="#FEF3C7" />
          {/* Radiant Head Aura (no facial details) */}
          <circle cx="2" cy="-38" r="42" fill={`url(#halo-${uid})`} />
          <circle cx="2" cy="-38" r="15" fill="#FFFFFF" opacity="0.95" />
          {turban && (
            <ellipse cx="2" cy="-50" rx="17" ry="9" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1" />
          )}
          {veil && (
            <path d="M-16 -38 Q2 -62 20 -38 L24 10 L-20 10 Z" fill={cloakColor} opacity="0.9" />
          )}
        </g>
      ) : pose === 'walking_back' ? (
        <g>
          {/* Viewed gracefully from behind (من الخلف) with luminous aura */}
          <ellipse cx="0" cy="72" rx="34" ry="8" fill="#065F46" opacity="0.15" />
          <path d="M-28 70 Q-26 -15 -14 -32 L14 -32 Q26 -15 28 70 Z" fill={cloakColor} />
          <circle cx="0" cy="-52" r="46" fill={`url(#halo-${uid})`} />
          <circle cx="0" cy="-52" r="16" fill={turban ? '#FFFFFF' : '#FEF3C7'} />
          {turban && (
            <ellipse cx="0" cy="-55" rx="18" ry="11" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.2" />
          )}
        </g>
      ) : (
        <g>
          {/* Standing / Giving / Working luminous figure */}
          <ellipse cx="0" cy="74" rx="34" ry="8" fill="#065F46" opacity="0.15" />
          {/* Inner Tunic */}
          <path d="M-20 70 L-16 -24 L16 -24 L20 70 Z" fill={robeColor} />
          {/* Outer Noble Cloak */}
          <path d="M-28 68 Q-26 -10 -15 -28 L0 -26 L-8 68 Z" fill={cloakColor} />
          <path d="M28 68 Q26 -10 15 -28 L0 -26 L8 68 Z" fill={cloakColor} />

          {/* Pose Arm */}
          {pose === 'giving' && (
            <g>
              <path d="M14 -14 L50 -2 L46 9 L12 -2 Z" fill={cloakColor} />
              <circle cx="50" cy="4" r="6" fill="#FEF3C7" />
            </g>
          )}
          {pose === 'working' && (
            <g>
              <path d="M14 -14 L44 6 L38 15 L10 -2 Z" fill={cloakColor} />
              <circle cx="43" cy="11" r="5.5" fill="#FEF3C7" />
            </g>
          )}

          {/* Soft Veil if Lady Ma'sooma */}
          {veil && (
            <path
              d="M-19 -44 Q0 -70 19 -44 L26 24 L-26 24 Z"
              fill={cloakColor}
              opacity="0.92"
            />
          )}

          {/* Radiant Golden-White Halo covering Face Area (Zero Facial Features) */}
          <circle cx="0" cy="-46" r="46" fill={`url(#halo-${uid})`} />
          <circle cx="0" cy="-46" r="15.5" fill="#FFFFFF" opacity="0.96" />
          {turban && !veil && (
            <ellipse
              cx="0"
              cy="-60"
              rx="18"
              ry="9.5"
              fill="#FFFFFF"
              stroke="#E2E8F0"
              strokeWidth="1.2"
            />
          )}
        </g>
      )}
    </g>
  );
};

/* =========================================================
   Storybook Supporting Characters & Props (Colorful Vector)
   ========================================================= */

export const KidCharacter: React.FC<{
  x: number;
  y: number;
  scale?: number;
  shirtColor?: string;
  happy?: boolean;
}> = ({ x, y, scale = 1, shirtColor = '#38BDF8', happy = true }) => (
  <g transform={`translate(${x}, ${y}) scale(${scale})`}>
    <ellipse cx="0" cy="46" rx="20" ry="6" fill="#0F172A" opacity="0.12" />
    <path d="M-14 44 L-12 4 L12 4 L14 44 Z" fill={shirtColor} />
    <circle cx="0" cy="-12" r="14" fill="#FDE68A" stroke="#F59E0B" strokeWidth="1.2" />
    {/* Cute simple hair cap */}
    <path d="M-14 -14 Q0 -30 14 -14 Q0 -20 -14 -14 Z" fill="#475569" />
    {/* Simple kid expression */}
    <circle cx="-5" cy="-12" r="1.8" fill="#1E293B" />
    <circle cx="5" cy="-12" r="1.8" fill="#1E293B" />
    {happy ? (
      <path d="M-5 -6 Q0 -1 5 -6" stroke="#B45309" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    ) : (
      <path d="M-4 -4 Q0 -7 4 -4" stroke="#B45309" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    )}
  </g>
);

export const ElderTraveler: React.FC<{
  x: number;
  y: number;
  scale?: number;
  robeColor?: string;
}> = ({ x, y, scale = 1, robeColor = '#94A3B8' }) => (
  <g transform={`translate(${x}, ${y}) scale(${scale})`}>
    <ellipse cx="0" cy="64" rx="26" ry="7" fill="#0F172A" opacity="0.12" />
    <path d="M-20 62 L-16 -14 L16 -14 L20 62 Z" fill={robeColor} />
    <circle cx="0" cy="-30" r="14" fill="#FDE68A" />
    <path d="M-15 -34 Q0 -50 15 -34 Z" fill="#E2E8F0" />
    <path d="M-9 -22 Q0 -12 9 -22 L5 -15 L-5 -15 Z" fill="#F8FAFC" />
    <circle cx="-5" cy="-31" r="1.8" fill="#334155" />
    <circle cx="5" cy="-31" r="1.8" fill="#334155" />
    {/* Wooden staff */}
    <line x1="-24" y1="-15" x2="-24" y2="62" stroke="#92400E" strokeWidth="4" strokeLinecap="round" />
  </g>
);

export const BreadBasketProp: React.FC<{ x: number; y: number; scale?: number }> = ({
  x,
  y,
  scale = 1,
}) => (
  <g transform={`translate(${x}, ${y}) scale(${scale})`}>
    {/* Warm golden loaves */}
    <ellipse cx="-12" cy="-6" rx="14" ry="9" fill="#F59E0B" />
    <ellipse cx="10" cy="-8" rx="15" ry="10" fill="#D97706" />
    <ellipse cx="0" cy="-2" rx="16" ry="9" fill="#FBBF24" />
    {/* Woven Basket */}
    <path d="M-28 0 L28 0 L20 24 L-20 24 Z" fill="#B45309" stroke="#78350F" strokeWidth="2" />
    <line x1="-24" y1="8" x2="24" y2="8" stroke="#FDE68A" strokeWidth="1.5" opacity="0.6" />
    <line x1="-21" y1="16" x2="21" y2="16" stroke="#FDE68A" strokeWidth="1.5" opacity="0.6" />
  </g>
);

export const GoldenLanternProp: React.FC<{ x: number; y: number; scale?: number }> = ({
  x,
  y,
  scale = 1,
}) => (
  <g transform={`translate(${x}, ${y}) scale(${scale})`}>
    <circle cx="0" cy="0" r="34" fill="#FDE68A" opacity="0.45" />
    <path d="M-12 -18 L12 -18 L16 14 L-16 14 Z" fill="#FEF3C7" stroke="#D97706" strokeWidth="2.5" />
    <path d="M-14 -18 Q0 -34 14 -18 Z" fill="#D97706" />
    <rect x="-18" y="14" width="36" height="6" rx="2" fill="#B45309" />
    <ellipse cx="0" cy="-2" rx="6" ry="9" fill="#FFFFFF" />
  </g>
);

export const OpenBookProp: React.FC<{ x: number; y: number; scale?: number }> = ({
  x,
  y,
  scale = 1,
}) => (
  <g transform={`translate(${x}, ${y}) scale(${scale})`}>
    <path d="M-40 12 Q-20 2 0 12 Q20 2 40 12 L36 -18 Q18 -26 0 -16 Q-18 -26 -36 -18 Z" fill="#FFFFFF" stroke="#059669" strokeWidth="2.5" />
    <line x1="0" y1="-16" x2="0" y2="12" stroke="#10B981" strokeWidth="2" />
    <line x1="-28" y1="-8" x2="-8" y2="-6" stroke="#94A3B8" strokeWidth="2" />
    <line x1="-28" y1="0" x2="-8" y2="2" stroke="#94A3B8" strokeWidth="2" />
    <line x1="8" y1="-6" x2="28" y2="-8" stroke="#94A3B8" strokeWidth="2" />
    <line x1="8" y1="2" x2="28" y2="0" stroke="#94A3B8" strokeWidth="2" />
  </g>
);

export const BalanceScaleProp: React.FC<{ x: number; y: number; scale?: number }> = ({
  x,
  y,
  scale = 1,
}) => (
  <g transform={`translate(${x}, ${y}) scale(${scale})`}>
    <rect x="-26" y="28" width="52" height="8" rx="3" fill="#B45309" />
    <line x1="0" y1="-28" x2="0" y2="28" stroke="#D97706" strokeWidth="4" />
    <line x1="-38" y1="-20" x2="38" y2="-20" stroke="#F59E0B" strokeWidth="4" strokeLinecap="round" />
    <line x1="-38" y1="-20" x2="-46" y2="6" stroke="#D97706" strokeWidth="1.5" />
    <line x1="-38" y1="-20" x2="-30" y2="6" stroke="#D97706" strokeWidth="1.5" />
    <path d="M-50 6 Q-38 18 -26 6 Z" fill="#FBBF24" />
    <line x1="38" y1="-20" x2="30" y2="6" stroke="#D97706" strokeWidth="1.5" />
    <line x1="38" y1="-20" x2="46" y2="6" stroke="#D97706" strokeWidth="1.5" />
    <path d="M26 6 Q38 18 50 6 Z" fill="#FBBF24" />
  </g>
);

export const FriendlyDogProp: React.FC<{ x: number; y: number; scale?: number }> = ({
  x,
  y,
  scale = 1,
}) => (
  <g transform={`translate(${x}, ${y}) scale(${scale})`}>
    <ellipse cx="0" cy="24" rx="28" ry="6" fill="#065F46" opacity="0.14" />
    <ellipse cx="4" cy="4" rx="22" ry="13" fill="#D97706" />
    <circle cx="-18" cy="-8" r="12" fill="#F59E0B" />
    <ellipse cx="-24" cy="-6" rx="4" ry="8" fill="#92400E" />
    <circle cx="-22" cy="-10" r="2" fill="#1E293B" />
    <circle cx="-29" cy="-6" r="2.5" fill="#1E293B" />
    <path d="M24 0 Q34 -10 30 -16" stroke="#D97706" strokeWidth="4" fill="none" strokeLinecap="round" />
    <rect x="-12" y="12" width="6" height="12" rx="2" fill="#B45309" />
    <rect x="12" y="12" width="6" height="12" rx="2" fill="#B45309" />
  </g>
);

export const GazelleProp: React.FC<{ x: number; y: number; scale?: number }> = ({
  x,
  y,
  scale = 1,
}) => (
  <g transform={`translate(${x}, ${y}) scale(${scale})`}>
    <ellipse cx="0" cy="4" rx="24" ry="11" fill="#D97706" />
    <path d="M-16 0 L-22 -24 L-12 -24 L-8 0 Z" fill="#F59E0B" />
    <circle cx="-18" cy="-26" r="8" fill="#F59E0B" />
    <path d="M-20 -33 Q-24 -46 -14 -44" stroke="#78350F" strokeWidth="2" fill="none" />
    <path d="M-15 -33 Q-12 -46 -6 -42" stroke="#78350F" strokeWidth="2" fill="none" />
    <circle cx="-21" cy="-27" r="1.5" fill="#1E293B" />
    <line x1="-14" y1="12" x2="-16" y2="30" stroke="#B45309" strokeWidth="3.5" strokeLinecap="round" />
    <line x1="14" y1="12" x2="18" y2="30" stroke="#B45309" strokeWidth="3.5" strokeLinecap="round" />
  </g>
);

export const BirdAndNestProp: React.FC<{ x: number; y: number; scale?: number }> = ({
  x,
  y,
  scale = 1,
}) => (
  <g transform={`translate(${x}, ${y}) scale(${scale})`}>
    {/* Olive Branch */}
    <path d="M-60 12 Q0 0 70 16" stroke="#78350F" strokeWidth="6" fill="none" strokeLinecap="round" />
    {/* Woven Nest */}
    <path d="M-28 8 Q0 30 28 8 Z" fill="#B45309" />
    {/* Two Tiny Chicks */}
    <circle cx="-8" cy="2" r="7" fill="#FDE047" />
    <circle cx="9" cy="2" r="7" fill="#FDE047" />
    <circle cx="-10" cy="0" r="1.2" fill="#1E293B" />
    <circle cx="7" cy="0" r="1.2" fill="#1E293B" />
    {/* Mother Bird Flying Joyfully */}
    <g transform="translate(-14, -34)">
      <ellipse cx="0" cy="0" rx="14" ry="9" fill="#0EA5E9" />
      <path d="M-2 -6 Q-14 -22 -24 -12 Q-10 -2 -2 -6 Z" fill="#38BDF8" />
      <circle cx="12" cy="-3" r="6" fill="#0284C7" />
      <polygon points="17,-3 23,-1 17,2" fill="#F59E0B" />
      <circle cx="14" cy="-4" r="1.3" fill="#FFFFFF" />
    </g>
  </g>
);

export const CamelProp: React.FC<{ x: number; y: number; scale?: number }> = ({
  x,
  y,
  scale = 1,
}) => (
  <g transform={`translate(${x}, ${y}) scale(${scale})`}>
    <ellipse cx="0" cy="40" rx="44" ry="8" fill="#92400E" opacity="0.14" />
    <ellipse cx="4" cy="4" rx="34" ry="20" fill="#D97706" />
    <path d="M-12 -10 Q4 -36 20 -10 Z" fill="#B45309" />
    <path d="M-26 6 Q-42 -8 -38 -28 L-28 -28 Q-28 -12 -18 0 Z" fill="#D97706" />
    <ellipse cx="-35" cy="-30" rx="11" ry="8" fill="#F59E0B" />
    <circle cx="-39" cy="-31" r="1.8" fill="#1E293B" />
    <line x1="-18" y1="18" x2="-20" y2="40" stroke="#B45309" strokeWidth="6" strokeLinecap="round" />
    <line x1="18" y1="18" x2="20" y2="40" stroke="#B45309" strokeWidth="6" strokeLinecap="round" />
  </g>
);

export const CatAndBowlProp: React.FC<{ x: number; y: number; scale?: number }> = ({
  x,
  y,
  scale = 1,
}) => (
  <g transform={`translate(${x}, ${y}) scale(${scale})`}>
    {/* Water Bowl */}
    <path d="M-46 14 L-16 14 L-20 26 L-42 26 Z" fill="#0284C7" />
    <ellipse cx="-31" cy="14" rx="15" ry="4" fill="#7DD3FC" />
    {/* Cute Cat */}
    <ellipse cx="14" cy="14" rx="16" ry="12" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.5" />
    <circle cx="-2" cy="2" r="10" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.5" />
    <polygon points="-9,-5 -6,-15 -1,-7" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.2" />
    <polygon points="1,-7 6,-15 8,-5" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.2" />
    <circle cx="-5" cy="1" r="1.5" fill="#1E293B" />
    <circle cx="1" cy="1" r="1.5" fill="#1E293B" />
    <path d="M28 14 Q42 0 38 -10" stroke="#CBD5E1" strokeWidth="4" fill="none" strokeLinecap="round" />
  </g>
);

export const SaplingTreeProp: React.FC<{ x: number; y: number; scale?: number }> = ({
  x,
  y,
  scale = 1,
}) => (
  <g transform={`translate(${x}, ${y}) scale(${scale})`}>
    <ellipse cx="0" cy="26" rx="28" ry="8" fill="#78350F" opacity="0.35" />
    <line x1="0" y1="24" x2="0" y2="-18" stroke="#92400E" strokeWidth="5" strokeLinecap="round" />
    <ellipse cx="-14" cy="-14" rx="14" ry="8" transform="rotate(-25 -14 -14)" fill="#10B981" />
    <ellipse cx="14" cy="-18" rx="14" ry="8" transform="rotate(25 14 -18)" fill="#059669" />
    <circle cx="0" cy="-30" r="12" fill="#34D399" />
  </g>
);

export const WaterPitcherProp: React.FC<{ x: number; y: number; scale?: number }> = ({
  x,
  y,
  scale = 1,
}) => (
  <g transform={`translate(${x}, ${y}) scale(${scale})`}>
    <ellipse cx="0" cy="6" rx="16" ry="20" fill="#C2410C" opacity="0.85" />
    <rect x="-8" y="-20" width="16" height="12" fill="#EA580C" />
    <path d="M12 -12 Q26 -10 24 6 Q22 14 14 12" stroke="#9A3412" strokeWidth="4" fill="none" />
    <path d="M-8 -16 Q-24 -6 -22 10" stroke="#38BDF8" strokeWidth="3.5" fill="none" strokeDasharray="4 3" strokeLinecap="round" />
  </g>
);

export const DoveProp: React.FC<{ x: number; y: number; scale?: number }> = ({
  x,
  y,
  scale = 1,
}) => (
  <g transform={`translate(${x}, ${y}) scale(${scale})`}>
    <ellipse cx="0" cy="0" rx="15" ry="9" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1" />
    <path d="M-2 -6 Q-14 -24 -22 -12 Q-10 -2 -2 -6 Z" fill="#F8FAFC" />
    <circle cx="13" cy="-4" r="6" fill="#FFFFFF" />
    <polygon points="18,-4 24,-2 18,0" fill="#F59E0B" />
    <circle cx="14" cy="-5" r="1.2" fill="#334155" />
  </g>
);
