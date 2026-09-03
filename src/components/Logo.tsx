import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  onClick?: () => void;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
  onClick,
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const textSizes = {
    sm: 'text-base font-bold',
    md: 'text-xl font-extrabold',
    lg: 'text-2xl font-black tracking-tight',
    xl: 'text-3xl font-black tracking-tight',
  };

  return (
    <div
      id="mind-maze-brand-logo"
      onClick={onClick}
      className={`inline-flex items-center gap-3 select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {/* Glowing Maze + Lightbulb Container */}
      <div className={`relative flex items-center justify-center rounded-xl bg-gradient-to-br from-[#1A1448] via-[#0F172A] to-[#0A0D18] p-1.5 border border-[#6B4EFF]/40 shadow-lg shadow-[#6B4EFF]/20 ${iconSizes[size]}`}>
        {/* Glow halo behind bulb */}
        <div className="absolute inset-0 rounded-xl bg-[#6B4EFF]/25 blur-md animate-pulse" />

        <svg
          viewBox="0 0 100 100"
          className="relative w-full h-full text-[#06B6D4]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Maze Pattern Tracks */}
          <path
            d="M 12 12 H 88 V 88 H 12 Z"
            stroke="rgba(107, 78, 255, 0.4)"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M 22 22 H 78 V 78 H 22 Z"
            stroke="rgba(6, 182, 212, 0.6)"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M 32 32 H 68 V 68 H 32 Z"
            stroke="rgba(107, 78, 255, 0.7)"
            strokeWidth="3"
            strokeDasharray="6 4"
          />

          {/* Maze Entry & Exit notches */}
          <path
            d="M 12 50 H 32 M 68 50 H 88 M 50 12 V 32 M 50 68 V 88"
            stroke="#00F5FF"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Glowing Center Core */}
          <circle cx="50" cy="50" r="18" fill="url(#bulbGlowGradient)" className="animate-pulse" />

          {/* Glowing Lightbulb in center */}
          <g transform="translate(36, 33) scale(0.28)">
            {/* Bulb glass */}
            <path
              d="M50 10 C30 10, 15 25, 15 45 C15 58, 25 68, 30 78 L30 85 C30 88, 32 90, 35 90 L65 90 C68 90, 70 88, 70 85 L70 78 C75 68, 85 58, 85 45 C85 25, 70 10, 50 10 Z"
              fill="#FBBF24"
              stroke="#FFF"
              strokeWidth="4"
              filter="url(#bulbGlowFilter)"
            />
            {/* Filament */}
            <path
              d="M40 45 L46 32 L54 32 L60 45"
              stroke="#FFF"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Base screw */}
            <path d="M33 93 H67 M36 97 H64 M40 101 H60" stroke="#E2E8F0" strokeWidth="4" strokeLinecap="round" />
          </g>

          <defs>
            <radialGradient id="bulbGlowGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.8" />
              <stop offset="60%" stopColor="#6B4EFF" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#06B6D4" stopOpacity="0" />
            </radialGradient>
            <filter id="bulbGlowFilter" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className={`leading-none flex items-center gap-1.5 ${textSizes[size]}`}>
            <span className="text-white">Mind</span>
            <span className="bg-gradient-to-r from-[#6B4EFF] via-[#8B5CF6] to-[#00F5FF] bg-clip-text text-transparent">
              Maze
            </span>
          </div>
          <span className="text-[10px] tracking-wider uppercase font-medium text-slate-400 mt-0.5">
            GCE A/L AI Practice
          </span>
        </div>
      )}
    </div>
  );
};
