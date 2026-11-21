import React from 'react';
import { sanitizeUrl } from '../utils/security';
import officialEeadciLogo from '../assets/images/eeadci-official-logo.png';

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
  const safeLogo = sanitizeUrl(logoUrl);
  const logoSrc = safeLogo || officialEeadciLogo;

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20'
  };

  return (
    <div className={`relative inline-flex items-center gap-3 shrink-0 ${className}`}>
      <img
        src={logoSrc}
        alt="Logo officiel de l’Église Évangélique des Assemblées de Dieu de Côte d’Ivoire"
        className={`${sizeClasses[size]} rounded-lg bg-white object-contain p-0.5 shrink-0`}
      />
      {showText && (
        <div className="flex flex-col text-left">
          <span className="font-heading font-bold text-sm sm:text-base text-[#173567] tracking-tight leading-tight">
            Église Évangélique des Assemblées de Dieu
          </span>
          <span className="text-[11px] text-[#2854A6] font-semibold leading-none">
            Annexe Ran-Extension Résidentiel · Anyama
          </span>
        </div>
      )}
    </div>
  );
};
