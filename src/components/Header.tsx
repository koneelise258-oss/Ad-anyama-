import React from 'react';
import { PageView } from '../types';
import { ChurchLogo } from './ChurchLogo';
import { Bell, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  activePage: PageView;
  onNavigate: (page: PageView) => void;
  onOpenNotifications: () => void;
  logoUrl?: string | null;
}

export interface NavItem {
  page: PageView;
  label: string;
  match: PageView[];
}

export const NAV_ITEMS: NavItem[] = [
  { page: 'accueil', label: 'Accueil', match: ['accueil'] },
  { page: 'cultes', label: 'Cultes', match: ['cultes', 'culte-detail'] },
  { page: 'evenements', label: 'Événements', match: ['evenements', 'evenement-detail'] },
  { page: 'actualites', label: 'Actualités', match: ['actualites', 'actualite-detail'] },
  { page: 'galerie', label: 'Galerie', match: ['galerie', 'album-detail'] },
  { page: 'departements', label: 'Départements', match: ['departements', 'departement-detail'] }
];

/** Nom de l’église, utilisé partout de la même façon. */
export const ChurchName: React.FC<{ onDark?: boolean; compact?: boolean }> = ({ onDark, compact }) => (
  <span className="flex min-w-0 flex-col leading-tight">
    <span
      className={`font-serif font-semibold ${compact ? 'text-[16px] sm:text-[17px]' : 'text-lg'} ${
        onDark ? 'text-white' : 'text-church-navy'
      }`}
    >
      Assemblées de Dieu d’Anyama
    </span>
    <span className={`truncate text-[12px] sm:text-[13px] ${onDark ? 'text-white/75' : 'text-church-muted'}`}>
      Ran Extension Résidentiel
    </span>
  </span>
);

export const Header: React.FC<HeaderProps> = ({ activePage, onNavigate, onOpenNotifications, logoUrl }) => {
  return (
    <header className="sticky top-0 z-40 border-b border-church-line bg-white/95 backdrop-blur-md">
      <div className="page flex h-16 items-center justify-between gap-4">
        {/* Brand Zone */}
        <button
          onClick={() => onNavigate('accueil')}
          className="flex min-w-0 items-center gap-3 rounded-md text-left transition-opacity hover:opacity-95"
          aria-label="Retour à l’accueil"
        >
          <ChurchLogo logoUrl={logoUrl} size="md" />
          <ChurchName compact />
        </button>

        {/* Desktop Navigation Links */}
        <nav aria-label="Navigation principale" className="hidden lg:flex items-center gap-1 xl:gap-2">
          {NAV_ITEMS.map((item) => {
            const active = item.match.includes(activePage);
            return (
              <button
                key={item.page}
                onClick={() => onNavigate(item.page)}
                aria-current={active ? 'page' : undefined}
                className={`relative h-16 px-3 text-[14px] xl:text-[15px] font-medium transition-colors whitespace-nowrap shrink-0 ${
                  active ? 'text-church-navy font-semibold' : 'text-church-muted hover:text-church-navy'
                }`}
              >
                {item.label}
                {active && <span className="absolute inset-x-2.5 bottom-0 h-[3px] rounded-t bg-church-blue" />}
              </button>
            );
          })}
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenNotifications}
            className="btn-secondary shrink-0 px-3 sm:px-4 text-xs sm:text-sm"
            aria-label="Rappels des cultes"
          >
            <Bell className="h-4 w-4 text-church-blue" aria-hidden="true" />
            <span className="hidden sm:inline">Rappels des cultes</span>
          </button>

          {activePage === 'admin' && (
            <button
              onClick={() => onNavigate('admin')}
              className="btn-ghost shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border border-church-blue bg-church-tint text-church-navy font-bold transition-colors"
              title="Espace administration et communication"
              aria-label="Espace communication"
            >
              <ShieldCheck className="h-4 w-4 text-church-blue" />
              <span className="hidden md:inline">Espace Com</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
