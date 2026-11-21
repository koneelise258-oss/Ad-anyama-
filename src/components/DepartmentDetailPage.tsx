import React, { useState } from 'react';
import { DepartmentItem } from '../types';
import { HERO_IMAGE } from '../mockData';
import { buildDownloadUrl, sanitizeUrl } from '../utils/security';
import { Phone, Mail, Clock, MapPin, User, Download } from 'lucide-react';
import { BackBar, BlockTitle, Lightbox } from './ui';
import { MediaViewerSection } from './MediaViewerSection';

interface DepartmentDetailPageProps {
  department: DepartmentItem;
  onBack: () => void;
  onOpenShare: (title: string, summary: string) => void;
}

export const DepartmentDetailPage: React.FC<DepartmentDetailPageProps> = ({ department, onBack, onOpenShare }) => {
  const [open, setOpen] = useState<number | null>(null);
  const photos = (department.galleryImages || []).map((p) => sanitizeUrl(p)).filter(Boolean);
  const activities = (department.activities || []).filter(Boolean);
  const docs = (department.documents || []).filter((d) => !!sanitizeUrl(d.downloadUrl));

  const infos = [
    department.leader && { icon: User, label: 'Responsable', value: department.leader, sub: department.leaderRole },
    department.meetingSchedule && { icon: Clock, label: 'Rencontres', value: department.meetingSchedule },
    department.meetingLocation && { icon: MapPin, label: 'Lieu', value: department.meetingLocation }
  ].filter(Boolean) as { icon: React.ElementType; label: string; value: string; sub?: string }[];

  return (
    <div>
      <BackBar backLabel="Départements" onBack={onBack} onShare={() => onOpenShare(department.name, department.description)} />

      <div className="page max-w-3xl py-6 sm:py-10">
        <div className="flex flex-wrap items-center gap-4">
          {sanitizeUrl(department.logoUrl) && (
            <img
              src={sanitizeUrl(department.logoUrl)}
              alt={`Logo ${department.name}`}
              className="h-20 w-20 shrink-0 rounded-2xl border border-church-line bg-white object-contain p-1.5 shadow-xs sm:h-24 sm:w-24"
            />
          )}
          <div className="min-w-0 flex-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-church-blue">{department.code}</span>
            <h1 className="text-[2rem] leading-tight sm:text-[2.5rem]">{department.name}</h1>
            {department.tagline && <p className="mt-1.5 font-serif text-lg sm:text-xl italic text-church-muted">{department.tagline}</p>}
          </div>
        </div>

        <img
          src={sanitizeUrl(department.coverImage) || HERO_IMAGE}
          alt={department.name}
          className="mt-6 aspect-[16/9] w-full rounded-2xl object-cover bg-church-navy"
        />

        {infos.length > 0 && (
          <dl className="surface mt-6 divide-y divide-church-line overflow-hidden">
            {infos.map(({ icon: Icon, label, value, sub }) => (
              <div key={label} className="flex gap-3 p-4">
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-church-blue" aria-hidden="true" />
                <div>
                  <dt className="text-sm text-church-muted">{label}</dt>
                  <dd className="font-semibold text-church-navy">{value}</dd>
                  {sub && <dd className="text-sm text-church-muted">{sub}</dd>}
                </div>
              </div>
            ))}
          </dl>
        )}

        {(department.contactPhone || department.contactEmail) && (
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            {department.contactPhone && (
              <a href={`tel:${department.contactPhone.replace(/\s/g, '')}`} className="btn-primary flex-1">
                <Phone className="h-4 w-4" aria-hidden="true" /> Appeler
              </a>
            )}
            {department.contactEmail && (
              <a href={`mailto:${department.contactEmail}`} className="btn-secondary flex-1">
                <Mail className="h-4 w-4 text-church-blue" aria-hidden="true" /> Écrire
              </a>
            )}
          </div>
        )}

        {department.description && (
          <section className="mt-10">
            <BlockTitle>Présentation</BlockTitle>
            <p className="text-[17px] leading-relaxed">{department.description}</p>
          </section>
        )}

        {activities.length > 0 && (
          <section className="mt-10">
            <BlockTitle>Activités</BlockTitle>
            <ul className="surface divide-y divide-church-line overflow-hidden">
              {activities.map((a, i) => (
                <li key={i} className="p-4">
                  {a}
                </li>
              ))}
            </ul>
          </section>
        )}

        {docs.length > 0 && (
          <div className="mt-10">
            <MediaViewerSection documents={docs} contextTitle={department.name} />
          </div>
        )}

        {photos.length > 0 && (
          <section className="mt-10">
            <BlockTitle>Photos</BlockTitle>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {photos.map((img, i) => (
                <div key={i} className="group relative overflow-hidden rounded-xl border border-church-line bg-church-navy">
                  <button
                    type="button"
                    onClick={() => setOpen(i)}
                    className="block w-full"
                    aria-label={`Afficher la photo ${i + 1}`}
                  >
                    <img src={img} alt="" loading="lazy" className="aspect-[4/3] w-full object-cover transition-transform duration-200 group-hover:scale-105" />
                  </button>
                  <a
                    href={buildDownloadUrl(img, `${department.name}-photo-${i + 1}`)}
                    download
                    className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-lg bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-church-navy shadow-xs hover:bg-white"
                    aria-label="Télécharger cette photo"
                  >
                    <Download className="h-3 w-3 text-church-blue" aria-hidden="true" />
                    Télécharger
                  </a>
                </div>
              ))}
            </div>
          </section>
        )}

        <p className="mt-10 border-t border-church-line pt-6 text-church-muted">
          Vous souhaitez rejoindre ce groupe ? Présentez-vous à la fin d’un culte, un responsable vous accueillera.
        </p>
      </div>

      {open !== null && (
        <Lightbox items={photos.map((url) => ({ type: 'photo' as const, url }))} index={open} onChange={setOpen} onClose={() => setOpen(null)} />
      )}
    </div>
  );
};
