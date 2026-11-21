import React, { useState } from 'react';
import { PageView } from '../types';
import { ChurchLogo } from './ChurchLogo';
import { PWAInstallButton } from './PWAInstallBanner';
import { Bell, Menu, X, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  activePage: PageView;
  onNavigate: (page: PageView) => void;
  onOpenNotifications: () => void;
  logoUrl?: string | null;
  parishName?: string;
  isAdminAuthenticated?: boolean;
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
  { page: 'galerie', label: 'Galerie', match: ['galerie', 'album-detail'] },
  { page: 'departements', label: 'Départements', match: ['departements', 'departement-detail'] },
  { page: 'actualites', label: 'Actualités', match: ['actualites', 'actualite-detail'] }
];

export const ChurchName: React.FC<{ onDark?: boolean; compact?: boolean; parishName?: string }> = ({
  onDark,
  compact,
  parishName
}) => (
  <span className="flex min-w-0 flex-col leading-tight">
    <span
      className={`font-serif font-semibold truncate ${compact ? 'text-[15px] sm:text-[17px]' : 'text-lg'} ${
        onDark ? 'text-white' : 'text-church-navy'
      }`}
    >
      Assemblées de Dieu d’Anyama
    </span>
    <span className={`truncate text-[12px] sm:text-[13px] ${onDark ? 'text-white/75' : 'text-church-muted'}`}>
      {parishName || 'Annexe Ran-Extension Résidentiel'}
    </span>
  </span>
);

export const Header: React.FC<HeaderProps> = ({
  activePage,
  onNavigate,
  onOpenNotifications,
  logoUrl,
  parishName,
  isAdminAuthenticated
}) => {
  const [tabletMenuOpen, setTabletMenuOpen] = useState(false);

  const handleNav = (page: PageView) => {
    setTabletMenuOpen(false);
    onNavigate(page);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-church-line bg-white/95 backdrop-blur-md">
      <div className="page flex h-14 sm:h-16 items-center justify-between gap-2 sm:gap-5">
        {/* Zone 1 : Marque */}
        <button
          onClick={() => handleNav('accueil')}
          className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3 rounded-xl py-1 text-left transition-opacity hover:opacity-90 lg:flex-initial"
          aria-label="Retour à l’accueil"
        >
          <ChurchLogo logoUrl={logoUrl} size="sm" />
          <ChurchName compact parishName={parishName} />
        </button>

        {/* Zone 2 : Navigation principale (Desktop & Tablette large) */}
        <nav aria-label="Navigation principale" className="hidden lg:flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const active = item.match.includes(activePage);
            return (
              <button
                key={item.page}
                onClick={() => handleNav(item.page)}
                aria-current={active ? 'page' : undefined}
                className={`relative rounded-xl px-3.5 py-2 text-[14px] xl:text-[15px] font-medium transition-all duration-150 whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-church-tint text-church-navy font-semibold'
                    : 'text-church-muted hover:bg-church-light hover:text-church-navy'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3 : Action principale & Menu tablette/mobile */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {isAdminAuthenticated && activePage !== 'admin' && (
            <button
              onClick={() => handleNav('admin')}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-church-blue/30 bg-church-tint px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-church-navy transition-colors hover:bg-church-blue hover:text-white whitespace-nowrap shrink-0"
              aria-label="Retour à l'espace de gestion"
            >
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Gestion</span>
            </button>
          )}

          <PWAInstallButton compact />

          <button
            onClick={onOpenNotifications}
            className="btn-secondary min-h-[40px] px-2.5 sm:px-4 text-xs sm:text-sm"
            aria-label="Horaires et rappels des cultes"
          >
            <Bell className="h-4 w-4 text-church-blue" aria-hidden="true" />
            <span className="hidden sm:inline">Horaires & Rappels</span>
          </button>

          {/* Menu rapide sur tablette/mobile pour accéder directement à toutes les rubriques */}
          <button
            onClick={() => setTabletMenuOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-church-line bg-white text-church-navy hover:border-church-blue lg:hidden"
            aria-expanded={tabletMenuOpen}
            aria-label="Menu des rubriques"
          >
            {tabletMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Menu déroulant tablette / mobile pour une navigation directe et intuitive */}
      {tabletMenuOpen && (
        <div className="border-t border-church-line bg-white lg:hidden animate-soft-in">
          <nav aria-label="Toutes les rubriques" className="page grid grid-cols-2 gap-2 py-3 sm:grid-cols-3">
            {NAV_ITEMS.map((item) => {
              const active = item.match.includes(activePage);
              return (
                <button
                  key={item.page}
                  onClick={() => handleNav(item.page)}
                  className={`min-h-[44px] rounded-xl px-3.5 py-2.5 text-left text-sm font-medium transition-colors ${
                    active
                      ? 'bg-church-navy text-white'
                      : 'bg-church-light text-church-navy hover:bg-church-tint'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
};
