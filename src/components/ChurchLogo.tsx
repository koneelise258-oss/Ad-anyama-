import React from 'react';

interface ChurchLogoProps {
  logoUrl?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
}

export const ChurchLogo: React.FC<ChurchLogoProps> = ({
  logoUrl,
  size = 'md',
  className = '',
  showText = false
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20'
  };

  const dimension = {
    sm: 32,
    md: 40,
    lg: 56,
    xl: 80
  }[size];

  if (logoUrl) {
    return (
      <div className={`relative inline-flex items-center gap-3 shrink-0 ${className}`}>
        <img
          src={logoUrl}
          alt="Logo Officiel de l’Église Évangélique des Assemblées de Dieu de Côte d’Ivoire"
          className={`${sizeClasses[size]} object-contain shrink-0`}
        />
        {showText && (
          <div className="flex flex-col text-left">
            <span className="font-heading font-bold text-sm sm:text-base text-[#173567] tracking-tight leading-tight">
              Église Évangélique des Assemblées de Dieu
            </span>
            <span className="text-[11px] text-[#2854A6] font-semibold leading-none">
              Anyama, Ran-Extension Résidentiel
            </span>
          </div>
        )}
      </div>
    );
  }

  // Official EEADCI Color Palette Vector Emblem (Provisional before user uploads original file)
  return (
    <div className={`relative inline-flex items-center gap-3 shrink-0 ${className}`}>
      <svg
        width={dimension}
        height={dimension}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 select-none"
        aria-label="Emblème Officiel Assemblées de Dieu Côte d’Ivoire"
      >
        {/* Outer Circle in Deep Navy #173567 */}
        <circle cx="50" cy="50" r="48" fill="#173567" stroke="#2854A6" strokeWidth="2.5" />
        {/* Inner Ring in Primary Blue #2854A6 */}
        <circle cx="50" cy="50" r="41" fill="#FFFFFF" stroke="#2854A6" strokeWidth="1.5" />
        
        {/* Top Arc text hint or subtle ring */}
        <path
          d="M 22 50 A 28 28 0 0 1 78 50"
          stroke="#2854A6"
          strokeWidth="1"
          strokeDasharray="2 2"
          fill="none"
        />

        {/* Central Cross in #173567 */}
        <rect x="47" y="24" width="6" height="42" rx="1.5" fill="#173567" />
        <rect x="36" y="34" width="28" height="6" rx="1.5" fill="#173567" />

        {/* Open Bible Symbol at Base in #2854A6 & White */}
        <path
          d="M 30 65 Q 40 60 50 63 Q 60 60 70 65 L 68 76 Q 59 72 50 74 Q 41 72 32 76 Z"
          fill="#2854A6"
          stroke="#173567"
          strokeWidth="1"
        />
        <line x1="50" y1="63" x2="50" y2="74" stroke="#FFFFFF" strokeWidth="1.5" />

        {/* Text EEADCI in Navy #173567 */}
        <text
          x="50"
          y="87"
          textAnchor="middle"
          fill="#173567"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="800"
          fontSize="9"
          letterSpacing="1.2"
        >
          EEADCI
        </text>
      </svg>

      {showText && (
        <div className="flex flex-col text-left">
          <span className="font-heading font-bold text-sm sm:text-base text-[#173567] tracking-tight leading-tight">
            Église Évangélique des Assemblées de Dieu
          </span>
          <span className="text-[11px] text-[#2854A6] font-semibold leading-none">
            Anyama, Ran-Extension Résidentiel
          </span>
        </div>
      )}
    </div>
  );
};
