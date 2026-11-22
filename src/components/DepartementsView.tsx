import React, { useState, useMemo } from 'react';
import { DepartmentItem } from '../types';
import { sanitizeUrl } from '../utils/security';
import { ChevronRight, Search } from 'lucide-react';
import { PageIntro, EmptyState } from './ui';

interface DepartementsViewProps {
  departments: DepartmentItem[];
  onSelectDepartment: (dept: DepartmentItem) => void;
  onOpenShare: (title: string, summary: string) => void;
}

export const DepartementsView: React.FC<DepartementsViewProps> = ({ departments, onSelectDepartment }) => {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return departments;
    return departments.filter((d) =>
      [d.name, d.code, d.description, d.tagline].some((v) => (v || '').toLowerCase().includes(q))
    );
  }, [departments, query]);

  return (
    <div>
      <PageIntro
        title="Départements et groupes"
        lead="Retrouvez les groupes et ministères de l’assemblée d’Anyama, leurs activités et leurs horaires."
      >
        {departments.length > 4 && (
          <div className="mt-5 max-w-md">
            <label className="relative block">
              <span className="sr-only">Rechercher un département</span>
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-church-muted" aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher un groupe (ex : JADCI, Chorale…)"
                className="field pl-10"
              />
            </label>
          </div>
        )}
      </PageIntro>

      <div className="page py-8">
        {filtered.length === 0 ? (
          <EmptyState
            message="Aucun département ne correspond à cette recherche."
            actionLabel="Afficher tous les départements"
            onAction={() => setQuery('')}
          />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((dept) => {
              const logo = sanitizeUrl(dept.logoUrl);
              const cover = sanitizeUrl(dept.coverImage);
              return (
                <li key={dept.id}>
                  <button
                    onClick={() => onSelectDepartment(dept)}
                    className="surface surface-interactive group flex h-full w-full items-center gap-4 overflow-hidden p-3 text-left"
                  >
                    {logo || cover ? (
                      <img
                        src={logo || cover}
                        alt={logo ? `Logo ${dept.name}` : dept.name}
                        className={`h-20 w-20 shrink-0 rounded-xl sm:h-24 sm:w-24 ${
                          logo ? 'border border-church-line bg-white object-contain p-1.5' : 'object-cover bg-church-navy'
                        }`}
                      />
                    ) : (
                      <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-church-line bg-church-tint font-serif text-base font-bold uppercase text-church-navy sm:h-24 sm:w-24">
                        {(dept.code || dept.name).slice(0, 6)}
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block text-[11px] font-semibold uppercase tracking-wide text-church-blue">
                        {dept.code}
                      </span>
                      <span className="block font-serif text-lg font-semibold leading-snug text-church-navy group-hover:text-church-blue">
                        {dept.name}
                      </span>
                      {dept.tagline ? (
                        <span className="mt-0.5 block truncate text-xs text-church-muted">{dept.tagline}</span>
                      ) : dept.meetingSchedule ? (
                        <span className="mt-1 block truncate text-xs text-church-muted">{dept.meetingSchedule}</span>
                      ) : dept.description ? (
                        <span className="mt-1 line-clamp-2 block text-xs text-church-muted">{dept.description}</span>
                      ) : null}
                    </span>
                    <ChevronRight className="mr-1 h-5 w-5 shrink-0 text-church-muted transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};
