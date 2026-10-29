import React, { useState } from 'react';
import { DepartmentItem } from '../types';
import { Phone, Mail, Clock, MapPin, User } from 'lucide-react';
import { BackBar, BlockTitle, Lightbox } from './ui';

interface DepartmentDetailPageProps {
  department: DepartmentItem;
  onBack: () => void;
  onOpenShare: (title: string, summary: string) => void;
}

export const DepartmentDetailPage: React.FC<DepartmentDetailPageProps> = ({ department, onBack, onOpenShare }) => {
  const [open, setOpen] = useState<number | null>(null);
  const photos = department.galleryImages || [];
  const activities = department.activities || [];

  const infos = [
    department.leader && { icon: User, label: 'Responsable', value: department.leader, sub: department.leaderRole },
    department.meetingSchedule && { icon: Clock, label: 'Rencontres', value: department.meetingSchedule },
    department.meetingLocation && { icon: MapPin, label: 'Lieu', value: department.meetingLocation }
  ].filter(Boolean) as { icon: React.ElementType; label: string; value: string; sub?: string }[];

  return (
    <div>
      <BackBar backLabel="Départements" onBack={onBack} onShare={() => onOpenShare(department.name, department.description)} />

      <div className="page max-w-3xl py-6 sm:py-10">
        {department.isDemo && (
          <p className="mb-2">
            <span className="demo-tag">Présentation de démonstration, à valider par le département</span>
          </p>
        )}
        <h1 className="text-[2rem] leading-tight sm:text-[2.6rem]">{department.name}</h1>
        {department.tagline && <p className="mt-2 font-serif text-xl italic text-church-muted">{department.tagline}</p>}

        <img src={department.coverImage} alt="" className="-mx-4 mt-6 aspect-[16/9] w-[calc(100%+2rem)] max-w-none object-cover sm:mx-0 sm:w-full sm:rounded-lg" />

        {infos.length > 0 && (
          <dl className="surface mt-6 divide-y divide-church-line">
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
            <ul className="surface divide-y divide-church-line">
              {activities.map((a, i) => (
                <li key={i} className="p-4">
                  {a}
                </li>
              ))}
            </ul>
          </section>
        )}

        {photos.length > 0 && (
          <section className="mt-10">
            <BlockTitle>Photos</BlockTitle>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {photos.map((img, i) => (
                <button key={i} onClick={() => setOpen(i)} className="overflow-hidden rounded-md bg-church-navy" aria-label={`Agrandir la photo ${i + 1}`}>
                  <img src={img} alt="" loading="lazy" className="aspect-[4/3] w-full object-cover" />
                </button>
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
