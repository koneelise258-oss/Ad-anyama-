import React, { useRef } from 'react';
import { ChurchSettings, PageView } from '../types';
import { DEFAULT_CHURCH_SETTINGS } from '../mockData';
import { ChurchLogo } from './ChurchLogo';
import { ChurchName, NAV_ITEMS } from './Header';
import { MapPin, Phone, Mail } from 'lucide-react';

interface SiteFooterProps {
  onNavigate: (page: PageView) => void;
  logoUrl?: string | null;
  churchSettings?: ChurchSettings;
  onSecretTrigger?: () => void;
}

export const SiteFooter: React.FC<SiteFooterProps> = ({
  onNavigate,
  logoUrl,
  churchSettings = DEFAULT_CHURCH_SETTINGS,
  onSecretTrigger
}) => {
  const tapRef = useRef<{ count: number; lastAt: number }>({ count: 0, lastAt: 0 });

  const handleDiscreetTap = () => {
    if (!onSecretTrigger) return;
    const now = Date.now();
    if (now - tapRef.current.lastAt > 2000) {
      tapRef.current = { count: 1, lastAt: now };
    } else {
      tapRef.current.count += 1;
      tapRef.current.lastAt = now;
    }
    if (tapRef.current.count >= 5) {
      tapRef.current = { count: 0, lastAt: 0 };
      onSecretTrigger();
    }
  };

  return (
    <footer className="mt-16 bg-church-navy pb-20 text-white/85 lg:pb-0">
      <div className="page grid gap-10 py-12 md:grid-cols-[1.3fr_1fr_1fr]">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-white p-1.5">
              <ChurchLogo logoUrl={logoUrl} size="md" />
            </span>
            <ChurchName onDark parishName={churchSettings.parishName} />
          </div>
          <p className="max-w-sm text-[15px] text-white/75">
            {churchSettings.denomination} — {churchSettings.footerNote || `annexe locale de ${churchSettings.parishName}.`}
          </p>
          {(churchSettings.motherChurch || churchSettings.principalPastor) && (
            <div className="space-y-1 text-[14px] text-white/80">
              {churchSettings.motherChurch && (
                <p>
                  <span className="font-semibold text-white">Rattachement :</span> {churchSettings.motherChurch}
                </p>
              )}
              {churchSettings.principalPastor && (
                <p>
                  <span className="font-semibold text-white">Pasteur principal :</span> {churchSettings.principalPastor}
                </p>
              )}
            </div>
          )}
          {churchSettings.address && (
            <div className="flex items-start gap-2 text-[15px]">
              <MapPin className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{churchSettings.address}</span>
            </div>
          )}
          {churchSettings.phone && (
            <div className="flex items-center gap-2 text-[15px]">
              <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
              <a href={`tel:${churchSettings.phone.replace(/\s/g, '')}`} className="hover:underline">
                {churchSettings.phone}
              </a>
            </div>
          )}
          {churchSettings.email && (
            <div className="flex items-center gap-2 text-[15px]">
              <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
              <a href={`mailto:${churchSettings.email}`} className="hover:underline">
                {churchSettings.email}
              </a>
            </div>
          )}
        </div>

        <div>
          <h2 className="mb-3 font-sans text-sm font-semibold text-white">Horaires des cultes</h2>
          <dl className="space-y-3 text-[15px]">
            {(churchSettings.schedules || []).map((s, idx) => (
              <div key={s.id || idx}>
                <dt className="font-semibold text-white">
                  {s.day}
                  {s.time ? `, ${s.time}` : ''}
                </dt>
                <dd className="text-white/75">{s.name}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div>
          <h2 className="mb-3 font-sans text-sm font-semibold text-white">Rubriques</h2>
          <ul className="space-y-2.5 text-[15px]">
            {NAV_ITEMS.map((n) => (
              <li key={n.page}>
                <button
                  onClick={() => onNavigate(n.page)}
                  className="hover:text-white hover:underline underline-offset-4 transition-colors"
                >
                  {n.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/15">
        <div className="page flex flex-col gap-2 py-5 text-[13px] text-white/65 sm:flex-row sm:items-center sm:justify-between">
          <span onClick={handleDiscreetTap} className="select-none">
            © {new Date().getFullYear()} {churchSettings.denomination} — {churchSettings.parishName}
          </span>
          <span>{churchSettings.city}</span>
        </div>
      </div>
    </footer>
  );
};
