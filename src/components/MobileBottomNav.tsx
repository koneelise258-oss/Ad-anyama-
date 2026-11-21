import React from 'react';
import { PageView } from '../types';
import { Home, BookOpen, CalendarDays, Image as ImageIcon, Newspaper } from 'lucide-react';

interface MobileBottomNavProps {
  activePage: PageView;
  onNavigate: (page: PageView) => void;
  onOpenNotifications?: () => void;
}

const MAIN_TABS: { page: PageView; label: string; icon: React.ElementType; match: PageView[] }[] = [
  { page: 'accueil', label: 'Accueil', icon: Home, match: ['accueil', 'departements', 'departement-detail'] },
  { page: 'cultes', label: 'Cultes', icon: BookOpen, match: ['cultes', 'culte-detail'] },
  { page: 'evenements', label: 'Agenda', icon: CalendarDays, match: ['evenements', 'evenement-detail'] },
  { page: 'galerie', label: 'Galerie', icon: ImageIcon, match: ['galerie', 'album-detail'] },
  { page: 'actualites', label: 'Actus', icon: Newspaper, match: ['actualites', 'actualite-detail'] }
];

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ activePage, onNavigate }) => {
  return (
    <nav
      aria-label="Navigation principale mobile"
      className="pb-safe fixed inset-x-0 bottom-0 z-50 border-t border-church-line bg-white/95 backdrop-blur-md lg:hidden"
    >
      <div className="mx-auto grid h-[60px] max-w-lg grid-cols-5 px-1">
        {MAIN_TABS.map(({ page, label, icon: Icon, match }) => {
          const active = match.includes(activePage);
          return (
            <button
              key={page}
              onClick={() => onNavigate(page)}
              aria-current={active ? 'page' : undefined}
              className="flex min-h-[44px] flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-medium transition-colors"
            >
              <span
                className={`flex h-7 w-10 items-center justify-center rounded-full transition-colors ${
                  active ? 'bg-church-tint text-church-blue' : 'text-church-muted'
                }`}
              >
                <Icon className="h-[19px] w-[19px]" strokeWidth={active ? 2.25 : 1.75} aria-hidden="true" />
              </span>
              <span className={active ? 'font-semibold text-church-navy' : 'text-church-muted'}>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
