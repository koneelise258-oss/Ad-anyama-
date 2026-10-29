import React from 'react';
import { PageView } from '../types';
import { CHURCH_INFO } from '../mockData';
import { ChurchLogo } from './ChurchLogo';
import { ChurchName, NAV_ITEMS } from './Header';
import { MapPin, Phone, Mail } from 'lucide-react';

interface SiteFooterProps {
  onNavigate: (page: PageView) => void;
  logoUrl?: string | null;
}

export const SiteFooter: React.FC<SiteFooterProps> = ({ onNavigate, logoUrl }) => (
  <footer className="mt-16 bg-church-navy pb-24 text-white/85 lg:pb-0">
    <div className="page grid gap-10 py-12 md:grid-cols-[1.3fr_1fr_1fr]">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-white p-1">
            <ChurchLogo logoUrl={logoUrl} size="md" />
          </span>
          <ChurchName onDark />
        </div>
        <p className="max-w-sm text-[15px] text-white/75">
          Église Évangélique des Assemblées de Dieu de Côte d’Ivoire, communauté locale d’Anyama.
        </p>
        <div className="flex items-start gap-2 text-[15px]">
          <MapPin className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{CHURCH_INFO.address}</span>
        </div>
        {CHURCH_INFO.phone && (
          <div className="flex items-center gap-2 text-[15px]">
            <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
            <a href={`tel:${CHURCH_INFO.phone.replace(/\s/g, '')}`}>{CHURCH_INFO.phone}</a>
          </div>
        )}
        {CHURCH_INFO.email && (
          <div className="flex items-center gap-2 text-[15px]">
            <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
            <a href={`mailto:${CHURCH_INFO.email}`}>{CHURCH_INFO.email}</a>
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 font-sans text-sm font-semibold text-white">Horaires des cultes</h2>
        <dl className="space-y-3 text-[15px]">
          {CHURCH_INFO.schedules.map((s) => (
            <div key={s.day}>
              <dt className="font-semibold text-white">
                {s.day}, {s.time}
              </dt>
              <dd className="text-white/70">{s.name}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div>
        <h2 className="mb-3 font-sans text-sm font-semibold text-white">Rubriques</h2>
        <ul className="space-y-2 text-[15px]">
          {NAV_ITEMS.map((n) => (
            <li key={n.page}>
              <button onClick={() => onNavigate(n.page)} className="hover:text-white hover:underline underline-offset-4">
                {n.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>

    <div className="border-t border-white/15">
      <div className="page flex flex-col gap-2 py-5 text-[13px] text-white/60 sm:flex-row sm:items-center sm:justify-between">
        <span>© {new Date().getFullYear()} Assemblées de Dieu d’Anyama, Ran Extension Résidentiel</span>
        <button onClick={() => onNavigate('admin')} className="self-start underline underline-offset-4 hover:text-white sm:self-auto">
          Espace administration
        </button>
      </div>
    </div>
  </footer>
);
