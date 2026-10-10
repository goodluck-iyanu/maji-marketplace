import React from 'react'

export type MajiLogoVariant =
  | 'symbol'
  | 'symbol-small'
  | 'symbol-reversed'
  | 'horizontal'
  | 'stacked'
  | 'wordmark'

export type MajiColorway =
  | 'ember-orange'
  | 'ember-duotone-light'
  | 'ember-duotone-dark'
  | 'ember-split'
  | 'obsidian'
  | 'pure-black'
  | 'white'

export type MajiAnimation =
  | 'none'
  | 'bounce'
  | 'rocker'
  | 'pulse'
  | 'spinner'
  | 'splash'
  | 'trace'

export interface MajiLogoProps {
  variant?: MajiLogoVariant
  colorway?: MajiColorway
  size?: number
  animation?: MajiAnimation
  className?: string
  title?: string
}

export const MAJI_PALETTES: Record<
  MajiColorway,
  { awning: string; smile: string; text: string; arc: string }
> = {
  'ember-orange': { awning: '#F05A28', smile: '#F05A28', text: '#F05A28', arc: '#F05A28' },
  'ember-duotone-light': { awning: '#F05A28', smile: '#111111', text: '#111111', arc: '#F05A28' },
  'ember-duotone-dark': { awning: '#F05A28', smile: '#FFFFFF', text: '#FFFFFF', arc: '#F05A28' },
  'ember-split': { awning: '#111111', smile: '#F05A28', text: '#111111', arc: '#F05A28' },
  obsidian: { awning: '#111111', smile: '#111111', text: '#111111', arc: '#111111' },
  'pure-black': { awning: '#000000', smile: '#000000', text: '#000000', arc: '#000000' },
  white: { awning: '#FFFFFF', smile: '#FFFFFF', text: '#FFFFFF', arc: '#FFFFFF' },
}

const AWNING_PATH_MASTER =
  'M28 84 L80 32 H100 L128 60 L156 32 H176 L228 84 V92 A34 34 0 0 1 160 92 V104 A32 32 0 0 1 96 104 V92 A34 34 0 0 1 28 92 Z'
const SMILE_PATH_MASTER =
  'M48 140 H84 V144 A44 44 0 0 0 172 144 V140 H208 V144 A80 80 0 0 1 48 144 Z'

const AWNING_PATH_SMALL =
  'M28 80 L76 32 H100 L128 60 L156 32 H180 L228 80 V88 A34 34 0 0 1 160 88 V98 A32 32 0 0 1 96 98 V88 A34 34 0 0 1 28 88 Z'
const SMILE_PATH_SMALL =
  'M48 144 H88 V144 A40 40 0 0 0 168 144 V144 H208 V144 A80 80 0 0 1 48 144 Z'

const AWNING_PATH_REVERSED =
  'M28 84 L80 32 H100 L128 60 L156 32 H176 L228 84 V90 A34 34 0 0 1 160 90 V102 A32 32 0 0 1 96 102 V90 A34 34 0 0 1 28 90 Z'
const SMILE_PATH_REVERSED =
  'M50 142 H84 V146 A44 44 0 0 0 172 146 V142 H206 V146 A78 78 0 0 1 50 146 Z'

/**
 * Official Maji Logo & Loading Animation Component
 * Built from `brand-design/maji/final-kit` (Concept F · S6 Storefront Basket Smile)
 * Brand Primary: Maji Ember Orange (#F05A28)
 */
export const MajiLogo: React.FC<MajiLogoProps> = ({
  variant = 'horizontal',
  colorway = 'ember-duotone-light',
  size = 40,
  animation = 'none',
  className = '',
  title = 'Maji',
}) => {
  const colors = MAJI_PALETTES[colorway]

  if (animation === 'spinner') {
    return (
      <MajiSpinner
        size={size}
        color={colorway === 'white' ? 'white' : colorway === 'obsidian' ? 'obsidian' : 'ember'}
        className={className}
        title={title}
      />
    )
  }

  if (
    variant === 'symbol' ||
    variant === 'symbol-small' ||
    variant === 'symbol-reversed' ||
    animation === 'trace'
  ) {
    const useSmall = variant === 'symbol-small' || (variant === 'symbol' && size <= 28)
    const awningD =
      variant === 'symbol-reversed'
        ? AWNING_PATH_REVERSED
        : useSmall
        ? AWNING_PATH_SMALL
        : AWNING_PATH_MASTER
    const smileD =
      variant === 'symbol-reversed'
        ? SMILE_PATH_REVERSED
        : useSmall
        ? SMILE_PATH_SMALL
        : SMILE_PATH_MASTER

    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 256 256"
        width={size}
        height={size}
        role="img"
        aria-label={title}
        className={className}
      >
        <title>{title}</title>
        {animation !== 'none' && (
          <style>{`
            .maji-awning-bounce {
              transform-box: fill-box;
              transform-origin: 50% 0%;
              animation: majiAwningBounce 1.8s cubic-bezier(0.34, 1.56, 0.64, 1) infinite;
            }
            .maji-smile-pop {
              transform-box: fill-box;
              transform-origin: 50% 0%;
              animation: majiSmilePop 1.8s cubic-bezier(0.34, 1.56, 0.64, 1) infinite;
            }
            .maji-awning-float {
              transform-box: fill-box;
              transform-origin: 50% 50%;
              animation: majiAwningFloat 1.6s ease-in-out infinite;
            }
            .maji-smile-rock {
              transform-box: fill-box;
              transform-origin: 50% 0%;
              animation: majiSmileRock 1.6s ease-in-out infinite;
            }
            .maji-pulse-awning {
              transform-box: fill-box;
              transform-origin: 50% 50%;
              animation: majiEmberPulse 1.5s ease-in-out infinite;
            }
            .maji-pulse-smile {
              transform-box: fill-box;
              transform-origin: 50% 50%;
              animation: majiEmberPulse 1.5s ease-in-out 0.25s infinite;
            }
            .maji-trace-awning {
              fill: ${colors.awning};
              stroke: ${colors.awning};
              stroke-width: 8;
              stroke-linejoin: round;
              stroke-linecap: round;
              stroke-dasharray: 680;
              stroke-dashoffset: 680;
              animation: majiTraceAndFill 2.2s ease-in-out infinite;
            }
            .maji-trace-smile {
              fill: ${colors.smile};
              stroke: ${colors.smile};
              stroke-width: 8;
              stroke-linejoin: round;
              stroke-linecap: round;
              stroke-dasharray: 680;
              stroke-dashoffset: 680;
              animation: majiTraceAndFill 2.2s ease-in-out 0.2s infinite;
            }
            @keyframes majiAwningBounce {
              0%, 100% { transform: translateY(0) scaleY(1); }
              18% { transform: translateY(-14px) scaleY(0.92); }
              38% { transform: translateY(6px) scaleY(1.06); }
              55% { transform: translateY(-2px) scaleY(0.99); }
              70% { transform: translateY(0) scaleY(1); }
            }
            @keyframes majiSmilePop {
              0%, 12% { transform: scale(0.75) translateY(-8px); opacity: 0.35; }
              42% { transform: scale(1.06) translateY(4px); opacity: 1; }
              65%, 100% { transform: scale(1) translateY(0); opacity: 1; }
            }
            @keyframes majiAwningFloat {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-7px); }
            }
            @keyframes majiSmileRock {
              0%, 100% { transform: rotate(-9deg) translateY(2px); }
              50% { transform: rotate(9deg) translateY(2px); }
            }
            @keyframes majiEmberPulse {
              0%, 100% { fill: #F05A28; transform: scale(1); opacity: 1; }
              50% { fill: #FF8559; transform: scale(0.94); opacity: 0.72; }
            }
            @keyframes majiTraceAndFill {
              0% { stroke-dashoffset: 680; fill-opacity: 0; }
              45% { stroke-dashoffset: 0; fill-opacity: 0.15; }
              65%, 82% { stroke-dashoffset: 0; fill-opacity: 1; }
              100% { stroke-dashoffset: -680; fill-opacity: 0; }
            }
          `}</style>
        )}
        <g>
          <path
            className={
              animation === 'bounce'
                ? 'maji-awning-bounce'
                : animation === 'rocker'
                ? 'maji-awning-float'
                : animation === 'pulse'
                ? 'maji-pulse-awning'
                : animation === 'trace'
                ? 'maji-trace-awning'
                : undefined
            }
            fill={colors.awning}
            d={awningD}
          />
          <path
            className={
              animation === 'bounce'
                ? 'maji-smile-pop'
                : animation === 'rocker'
                ? 'maji-smile-rock'
                : animation === 'pulse'
                ? 'maji-pulse-smile'
                : animation === 'trace'
                ? 'maji-trace-smile'
                : undefined
            }
            fill={colors.smile}
            d={smileD}
          />
        </g>
      </svg>
    )
  }

  if (variant === 'stacked') {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 512 512"
        width={size}
        height={size}
        role="img"
        aria-label={title}
        className={className}
      >
        <title>{title}</title>
        <g>
          <path
            fill={colors.awning}
            d="M156 96 L208 44 H228 L256 72 L284 44 H304 L356 96 V104 A34 34 0 0 1 288 104 V116 A32 32 0 0 1 224 116 V104 A34 34 0 0 1 156 104 Z"
          />
          <path
            fill={colors.smile}
            d="M176 152 H212 V156 A44 44 0 0 0 300 156 V152 H336 V156 A80 80 0 0 1 176 156 Z"
          />
        </g>
        <g>
          <path
            fill={colors.text}
            d="M32 436 V360 A32 32 0 0 1 64 328 H156 A32 32 0 0 1 188 360 V436 H160 V364 A18 18 0 0 0 124 364 V436 H96 V364 A18 18 0 0 0 60 364 V436 Z"
          />
          <path
            fill={colors.text}
            fillRule="evenodd"
            d="M305 328 H335 V436 H305 V426 A55 55 0 1 1 305 338 Z M274 357 A25 25 0 1 0 274 407 A25 25 0 1 0 274 357 Z"
          />
          <path
            fill={colors.text}
            d="M382 328 H412 V428 A40 40 0 0 1 372 468 H354 V438 H372 A10 10 0 0 0 382 428 Z"
          />
          <path fill={colors.text} d="M450 328 H480 V436 H450 Z" />
          <path
            fill={colors.arc}
            d="M382 316 A49 49 0 0 1 480 316 H450 A19 19 0 0 0 412 316 Z"
          />
        </g>
      </svg>
    )
  }

  if (variant === 'wordmark') {
    const width = Math.round(size * 2)
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 512 256"
        width={width}
        height={size}
        role="img"
        aria-label={title}
        className={className}
      >
        <title>{title}</title>
        <path
          fill={colors.text}
          d="M32 192 V116 A32 32 0 0 1 64 84 H156 A32 32 0 0 1 188 116 V192 H160 V120 A18 18 0 0 0 124 120 V192 H96 V120 A18 18 0 0 0 60 120 V192 Z"
        />
        <path
          fill={colors.text}
          fillRule="evenodd"
          d="M305 84 H335 V192 H305 V182 A55 55 0 1 1 305 94 Z M274 113 A25 25 0 1 0 274 163 A25 25 0 1 0 274 113 Z"
        />
        <path
          fill={colors.text}
          d="M382 84 H412 V184 A40 40 0 0 1 372 224 H354 V194 H372 A10 10 0 0 0 382 184 Z"
        />
        <path fill={colors.text} d="M450 84 H480 V192 H450 Z" />
        <path
          fill={colors.arc}
          d="M382 72 A49 49 0 0 1 480 72 H450 A19 19 0 0 0 412 72 Z"
        />
      </svg>
    )
  }

  // Default: Horizontal Lockup (760 x 256) — supports 'splash', 'bounce', 'rocker', 'pulse', or 'none'
  const width = Math.round((size * 760) / 256)
  const isSplash = animation === 'splash'
  const isBounce = animation === 'bounce'
  const isRocker = animation === 'rocker'

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 760 256"
      width={width}
      height={size}
      role="img"
      aria-label={title}
      className={className}
    >
      <title>{title}</title>
      {animation !== 'none' && (
        <style>{`
          .maji-lockup-splash-awning {
            transform-box: fill-box;
            transform-origin: 50% 0%;
            animation: majiSplashDrop 2.4s cubic-bezier(0.34, 1.56, 0.64, 1) infinite;
          }
          .maji-lockup-splash-smile {
            transform-box: fill-box;
            transform-origin: 50% 0%;
            animation: majiSplashSmile 2.4s cubic-bezier(0.34, 1.56, 0.64, 1) infinite;
          }
          .maji-letter-m {
            transform-box: fill-box;
            transform-origin: 50% 100%;
            animation: majiLetterRise 2.4s cubic-bezier(0.22, 1, 0.36, 1) 0.08s infinite;
          }
          .maji-letter-a {
            transform-box: fill-box;
            transform-origin: 50% 100%;
            animation: majiLetterRise 2.4s cubic-bezier(0.22, 1, 0.36, 1) 0.16s infinite;
          }
          .maji-letter-j {
            transform-box: fill-box;
            transform-origin: 50% 100%;
            animation: majiLetterRise 2.4s cubic-bezier(0.22, 1, 0.36, 1) 0.24s infinite;
          }
          .maji-letter-i {
            transform-box: fill-box;
            transform-origin: 50% 100%;
            animation: majiLetterRise 2.4s cubic-bezier(0.22, 1, 0.36, 1) 0.32s infinite;
          }
          .maji-ji-arc {
            transform-box: fill-box;
            transform-origin: 0% 100%;
            animation: majiArcBridge 2.4s cubic-bezier(0.34, 1.56, 0.64, 1) infinite;
          }
          @keyframes majiSplashDrop {
            0%, 100% { transform: translateY(0) scale(1); }
            12% { transform: translateY(-16px) scale(0.92); }
            28% { transform: translateY(4px) scale(1.04); }
            45% { transform: translateY(0) scale(1); }
          }
          @keyframes majiSplashSmile {
            0%, 10% { transform: scale(0.7); opacity: 0.2; }
            32% { transform: scale(1.06); opacity: 1; }
            50%, 100% { transform: scale(1); opacity: 1; }
          }
          @keyframes majiLetterRise {
            0%, 12% { transform: translateY(14px); opacity: 0.15; }
            38%, 100% { transform: translateY(0); opacity: 1; }
          }
          @keyframes majiArcBridge {
            0%, 25% { transform: scaleX(0.2) translateY(8px); opacity: 0; }
            52% { transform: scaleX(1.05) translateY(-2px); opacity: 1; }
            68%, 100% { transform: scaleX(1) translateY(0); opacity: 1; }
          }
        `}</style>
      )}
      <g>
        <path
          className={isSplash || isBounce ? 'maji-lockup-splash-awning' : undefined}
          fill={colors.awning}
          d={AWNING_PATH_MASTER}
        />
        <path
          className={isSplash || isBounce || isRocker ? 'maji-lockup-splash-smile' : undefined}
          fill={colors.smile}
          d={SMILE_PATH_MASTER}
        />
      </g>
      <g>
        <path
          className={isSplash ? 'maji-letter-m' : undefined}
          fill={colors.text}
          d="M288 192 V116 A32 32 0 0 1 320 84 H412 A32 32 0 0 1 444 116 V192 H416 V120 A18 18 0 0 0 380 120 V192 H352 V120 A18 18 0 0 0 316 120 V192 Z"
        />
        <path
          className={isSplash ? 'maji-letter-a' : undefined}
          fill={colors.text}
          fillRule="evenodd"
          d="M561 84 H591 V192 H561 V182 A55 55 0 1 1 561 94 Z M530 113 A25 25 0 1 0 530 163 A25 25 0 1 0 530 113 Z"
        />
        <path
          className={isSplash ? 'maji-letter-j' : undefined}
          fill={colors.text}
          d="M638 84 H668 V184 A40 40 0 0 1 628 224 H610 V194 H628 A10 10 0 0 0 638 184 Z"
        />
        <path
          className={isSplash ? 'maji-letter-i' : undefined}
          fill={colors.text}
          d="M706 84 H736 V192 H706 Z"
        />
        <path
          className={isSplash ? 'maji-ji-arc' : undefined}
          fill={colors.arc}
          d="M638 72 A49 49 0 0 1 736 72 H706 A19 19 0 0 0 668 72 Z"
        />
      </g>
    </svg>
  )
}

/**
 * 04 · Checkout & Button Orbit Spinner (`maji-loader-04-spinner-ring.svg`)
 * Compact circular orbit spinner with breathing Storefront Basket Smile core.
 */
export const MajiSpinner: React.FC<{
  size?: number
  color?: 'ember' | 'white' | 'obsidian' | 'current'
  className?: string
  title?: string
}> = ({ size = 24, color = 'ember', className = '', title = 'Loading...' }) => {
  const strokeColor =
    color === 'white'
      ? '#FFFFFF'
      : color === 'obsidian'
      ? '#111111'
      : color === 'current'
      ? 'currentColor'
      : '#F05A28'

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      width={size}
      height={size}
      role="status"
      aria-label={title}
      className={`inline-block shrink-0 ${className}`}
    >
      <title>{title}</title>
      <style>{`
        .maji-orbit-ring {
          transform-origin: 128px 128px;
          animation: majiSpinOrbit 1.1s linear infinite;
        }
        .maji-core-mark {
          transform-origin: 128px 128px;
          animation: majiGentleBreath 1.1s ease-in-out infinite;
        }
        @keyframes majiSpinOrbit {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes majiGentleBreath {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(0.94); }
        }
      `}</style>
      <circle
        cx="128"
        cy="128"
        r="112"
        fill="none"
        stroke={strokeColor}
        strokeOpacity="0.18"
        strokeWidth="18"
      />
      <circle
        className="maji-orbit-ring"
        cx="128"
        cy="128"
        r="112"
        fill="none"
        stroke={strokeColor}
        strokeWidth="18"
        strokeLinecap="round"
        strokeDasharray="220 500"
      />
      <g className="maji-core-mark">
        <svg x="54" y="54" width="148" height="148" viewBox="0 0 256 256">
          <path fill={strokeColor} d={AWNING_PATH_MASTER} />
          <path fill={strokeColor} d={SMILE_PATH_MASTER} />
        </svg>
      </g>
    </svg>
  )
}

/**
 * Official Maji Verified Merchant Storefront Pill Badge (`maji-storefront-badge.svg`)
 */
export const MajiStorefrontBadge: React.FC<{
  height?: number
  className?: string
}> = ({ height = 36, className = '' }) => {
  const width = Math.round((height * 840) / 256)
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 840 256"
      width={width}
      height={height}
      role="img"
      aria-label="Powered by Maji — Verified Merchant Storefront"
      className={className}
    >
      <title>Maji — Verified Merchant Storefront Badge</title>
      <rect x="16" y="16" width="808" height="224" rx="112" fill="#111111" />
      <g transform="translate(52, 24) scale(0.8125)">
        <path fill="#F05A28" d={AWNING_PATH_MASTER} />
        <path fill="#FFFFFF" d={SMILE_PATH_MASTER} />
      </g>
      <g transform="translate(272, 16) scale(0.88)">
        <path
          fill="#FFFFFF"
          d="M32 192 V116 A32 32 0 0 1 64 84 H156 A32 32 0 0 1 188 116 V192 H160 V120 A18 18 0 0 0 124 120 V192 H96 V120 A18 18 0 0 0 60 120 V192 Z"
        />
        <path
          fill="#FFFFFF"
          fillRule="evenodd"
          d="M305 84 H335 V192 H305 V182 A55 55 0 1 1 305 94 Z M274 113 A25 25 0 1 0 274 163 A25 25 0 1 0 274 113 Z"
        />
        <path
          fill="#FFFFFF"
          d="M382 84 H412 V184 A40 40 0 0 1 372 224 H354 V194 H372 A10 10 0 0 0 382 184 Z"
        />
        <path fill="#FFFFFF" d="M450 84 H480 V192 H450 Z" />
        <path
          fill="#F05A28"
          d="M382 72 A49 49 0 0 1 480 72 H450 A19 19 0 0 0 412 72 Z"
        />
      </g>
    </svg>
  )
}

/**
 * Full-page or section loading indicator using the prepared Maji animations:
 * - 'bounce' (01 · Awning Bounce & Smile Reveal)
 * - 'rocker' (02 · Basket Smile Rocker)
 * - 'pulse' (03 · Ember Scallop Pulse)
 * - 'splash' (05 · Full Lockup Splash Reveal)
 * - 'trace' (06 · Storefront Outline Trace & Fill)
 */
export const MajiPageLoader: React.FC<{
  animation?: 'bounce' | 'rocker' | 'pulse' | 'splash' | 'trace'
  theme?: 'light' | 'dark'
  label?: string
  sublabel?: string
  fullScreen?: boolean
}> = ({
  animation = 'bounce',
  theme = 'light',
  label = 'Loading Maji...',
  sublabel,
  fullScreen = true,
}) => {
  const isDark = theme === 'dark'
  const isSplash = animation === 'splash'

  return (
    <div
      className={`${
        fullScreen ? 'min-h-screen' : 'min-h-[60vh]'
      } w-full flex flex-col items-center justify-center px-6 relative overflow-hidden ${
        isDark ? 'bg-[#111111] text-white' : 'bg-[#FAF8F5] text-[#111111]'
      }`}
    >
      {/* Ambient Ember Glow (Magic UI inspired) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-72 w-72 rounded-full blur-3xl opacity-20"
        style={{
          background: 'radial-gradient(circle, #F05A28 0%, #FF8559 55%, transparent 100%)',
        }}
      />

      <div className="relative z-10 flex flex-col items-center text-center">
        <div
          className={`flex items-center justify-center rounded-3xl p-6 mb-5 border shadow-sm ${
            isDark
              ? 'bg-white/[0.04] border-white/10 shadow-black/40'
              : 'bg-white border-[#111111]/[0.07] shadow-[#111111]/[0.04]'
          }`}
        >
          {isSplash ? (
            <MajiLogo
              variant="horizontal"
              colorway={isDark ? 'ember-duotone-dark' : 'ember-duotone-light'}
              size={64}
              animation="splash"
            />
          ) : (
            <MajiLogo
              variant="symbol"
              colorway={
                animation === 'rocker'
                  ? isDark
                    ? 'ember-duotone-dark'
                    : 'ember-duotone-light'
                  : 'ember-orange'
              }
              size={76}
              animation={animation}
            />
          )}
        </div>

        {label && (
          <p
            className={`text-sm font-semibold tracking-tight ${
              isDark ? 'text-white/90' : 'text-[#111111]'
            }`}
          >
            {label}
          </p>
        )}
        {sublabel && (
          <p
            className={`text-xs mt-1 max-w-xs ${
              isDark ? 'text-white/55' : 'text-neutral-500'
            }`}
          >
            {sublabel}
          </p>
        )}

        {/* Animated progress shimmer bar */}
        <div
          className={`mt-4 h-1 w-32 rounded-full overflow-hidden ${
            isDark ? 'bg-white/10' : 'bg-[#111111]/10'
          }`}
        >
          <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-[#F05A28] to-[#FF8559] maji-shimmer-bar" />
        </div>
      </div>
    </div>
  )
}

/**
 * Dedicated Login / Authentication Transition Animation Overlay
 * Combines `05 · Full Lockup Splash Reveal`, `01 · Awning Bounce & Smile Reveal`,
 * and `04 · Orbit Progress Ring` when the user signs in, signs up, or verifies OTP.
 */
export const MajiLoginSplashOverlay: React.FC<{
  visible: boolean
  title?: string
  subtitle?: string
}> = ({
  visible,
  title = 'Entering your Maji workspace...',
  subtitle = 'Preparing your storefront, orders & live payouts',
}) => {
  if (!visible) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#111111]/85 backdrop-blur-md p-4 animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-[#FAF8F5] border border-[#111111]/10 p-8 text-center shadow-2xl">
        {/* Top Ember Accent Beam */}
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#F05A28] via-[#FF8559] to-[#F05A28]" />

        {/* Ambient radial glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 h-48 w-48 rounded-full blur-3xl opacity-25"
          style={{
            background: 'radial-gradient(circle, #F05A28 0%, #FF8559 60%, transparent 100%)',
          }}
        />

        {/* Animated Full Lockup Splash Reveal (Loader 05) */}
        <div className="relative z-10 mx-auto mb-6 flex flex-col items-center justify-center rounded-2xl bg-white p-6 border border-[#111111]/[0.06] shadow-sm">
          <MajiLogo
            variant="horizontal"
            colorway="ember-duotone-light"
            size={68}
            animation="splash"
          />
          <div className="mt-4 flex items-center gap-3 text-xs font-semibold text-[#F05A28] bg-[#F05A28]/10 px-3.5 py-1.5 rounded-full">
            <MajiSpinner size={16} color="ember" />
            <span>Authenticating securely</span>
          </div>
        </div>

        <h3 className="text-lg font-bold tracking-tight text-[#111111]">{title}</h3>
        <p className="mt-1.5 text-xs text-neutral-500 leading-relaxed">{subtitle}</p>

        {/* Secondary Miniature Animation Showcase Bar (Loaders 01, 02, 06) */}
        <div className="mt-6 pt-5 border-t border-[#111111]/[0.07] flex items-center justify-center gap-5">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-600">
            <MajiLogo variant="symbol" colorway="ember-orange" size={22} animation="bounce" />
            <span>Storefront</span>
          </div>
          <span className="h-3 w-px bg-neutral-200" />
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-600">
            <MajiLogo
              variant="symbol"
              colorway="ember-duotone-light"
              size={22}
              animation="rocker"
            />
            <span>Checkout</span>
          </div>
          <span className="h-3 w-px bg-neutral-200" />
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-600">
            <MajiLogo variant="symbol" colorway="ember-orange" size={22} animation="trace" />
            <span>Payouts</span>
          </div>
        </div>
      </div>
    </div>
  )
}

