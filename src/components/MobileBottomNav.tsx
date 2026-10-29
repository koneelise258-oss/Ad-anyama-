import React, { useEffect, useState } from 'react';
import { PageView } from '../types';
import { Home, BookOpen, CalendarDays, Image as ImageIcon, Menu, X, Newspaper, Users, Bell } from 'lucide-react';

interface MobileBottomNavProps {
  activePage: PageView;
  onNavigate: (page: PageView) => void;
  onOpenNotifications?: () => void;
}

const MAIN: { page: PageView; label: string; icon: React.ElementType; match: PageView[] }[] = [
  { page: 'accueil', label: 'Accueil', icon: Home, match: ['accueil'] },
  { page: 'cultes', label: 'Cultes', icon: BookOpen, match: ['cultes', 'culte-detail'] },
  { page: 'evenements', label: 'Agenda', icon: CalendarDays, match: ['evenements', 'evenement-detail'] },
  { page: 'galerie', label: 'Galerie', icon: ImageIcon, match: ['galerie', 'album-detail'] }
];

const MORE_PAGES: PageView[] = ['actualites', 'actualite-detail', 'departements', 'departement-detail'];

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ activePage, onNavigate, onOpenNotifications }) => {
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => setMoreOpen(false), [activePage]);

  const go = (p: PageView) => {
    setMoreOpen(false);
    onNavigate(p);
  };

  const moreActive = MORE_PAGES.includes(activePage);

  return (
    <>
      {moreOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-label="Plus de rubriques">
          <button
            className="absolute inset-0 bg-church-navy/40"
            aria-label="Fermer le menu"
            onClick={() => setMoreOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-xl bg-white px-4 pb-24 pt-3">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-church-line" />
            <ul className="divide-y divide-church-line">
              <li>
                <button onClick={() => go('actualites')} className="flex w-full items-center gap-3 py-4 text-left font-medium text-church-navy">
                  <Newspaper className="h-5 w-5 text-church-blue" /> Actualités et communiqués
                </button>
              </li>
              <li>
                <button onClick={() => go('departements')} className="flex w-full items-center gap-3 py-4 text-left font-medium text-church-navy">
                  <Users className="h-5 w-5 text-church-blue" /> Départements et groupes
                </button>
              </li>
              {onOpenNotifications && (
                <li>
                  <button
                    onClick={() => {
                      setMoreOpen(false);
                      onOpenNotifications();
                    }}
                    className="flex w-full items-center gap-3 py-4 text-left font-medium text-church-navy"
                  >
                    <Bell className="h-5 w-5 text-church-blue" /> Rappels des cultes
                  </button>
                </li>
              )}
            </ul>
          </div>
        </div>
      )}

      <nav
        aria-label="Navigation principale mobile"
        className="pb-safe fixed inset-x-0 bottom-0 z-50 border-t border-church-line bg-white lg:hidden"
      >
        <div className="mx-auto grid h-16 max-w-md grid-cols-5">
          {MAIN.map(({ page, label, icon: Icon, match }) => {
            const active = match.includes(activePage) && !moreOpen;
            return (
              <button
                key={page}
                onClick={() => go(page)}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-col items-center justify-center gap-1 text-[11px] font-medium ${
                  active ? 'text-church-blue' : 'text-church-muted'
                }`}
              >
                <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.25 : 1.75} aria-hidden="true" />
                {label}
              </button>
            );
          })}
          <button
            onClick={() => setMoreOpen((v) => !v)}
            aria-expanded={moreOpen}
            className={`flex flex-col items-center justify-center gap-1 text-[11px] font-medium ${
              moreOpen || moreActive ? 'text-church-blue' : 'text-church-muted'
            }`}
          >
            {moreOpen ? <X className="h-[22px] w-[22px]" /> : <Menu className="h-[22px] w-[22px]" strokeWidth={1.75} />}
            Plus
          </button>
        </div>
      </nav>
    </>
  );
};
