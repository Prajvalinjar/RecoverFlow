import React from 'react';

interface LogoProps {
  variant?: 'full' | 'icon' | 'horizontal' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ variant = 'full', size = 'md', className = '' }) => {
  const iconSizes = {
    sm: 28,
    md: 36,
    lg: 48,
  };
  const currentSize = iconSizes[size];

  const IconSymbol = (
    <svg
      width={currentSize}
      height={currentSize}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      {/* Background container glow */}
      <defs>
        <linearGradient id="rf-blue-cyan" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0EA5E9" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
        <linearGradient id="rf-navy-blue" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0B1F33" />
          <stop offset="100%" stopColor="#0EA5E9" />
        </linearGradient>
      </defs>

      {/* Outer Swoosh Arc */}
      <path
        d="M 25 80 C 10 60 15 30 40 15 C 65 0 90 20 85 45 C 82 60 70 75 55 82"
        stroke="url(#rf-blue-cyan)"
        strokeWidth="9"
        strokeLinecap="round"
      />

      {/* Stylized R Main Body */}
      <path
        d="M 30 75 L 30 25 C 30 25 45 20 60 25 C 75 30 75 50 60 55 C 45 60 30 55 30 55 L 65 80"
        stroke="#0B1F33"
        strokeWidth="11"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M 32 73 L 32 27 C 32 27 46 22 59 27 C 72 32 72 48 59 53 L 63 76"
        stroke="url(#rf-blue-cyan)"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Forward Arrow Badge */}
      <path
        d="M 45 35 L 55 35 L 50 28"
        stroke="#FFFFFF"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Verified Green Checkmark Badge at Bottom Right */}
      <circle cx="75" cy="72" r="14" fill="#10B981" />
      <path
        d="M 68 72 L 73 77 L 82 66"
        stroke="#FFFFFF"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  if (variant === 'icon') {
    return <div className={`inline-flex items-center ${className}`}>{IconSymbol}</div>;
  }

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {IconSymbol}
      <div className="flex flex-col justify-center leading-none">
        <div className="flex items-center brand-font">
          <span className={`font-extrabold tracking-tight ${variant === 'dark' ? 'text-white' : 'text-slate-900'} ${size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-lg' : 'text-xl'}`}>
            Recover
          </span>
          <span className={`font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-emerald-500 ${size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-lg' : 'text-xl'}`}>
            Flow
          </span>
        </div>
        <span className={`font-semibold tracking-widest text-[9px] uppercase mt-0.5 ${variant === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
          Intelligent Payment Recovery
        </span>
      </div>
    </div>
  );
};
