import React, { useState } from 'react';
import { AlbumItem } from '../types';
import { HERO_IMAGE } from '../mockData';
import { sanitizeUrl } from '../utils/security';
import { Images, Play } from 'lucide-react';
import { PageIntro, EmptyState, formatDate } from './ui';

interface GalerieViewProps {
  albums: AlbumItem[];
  onSelectAlbum: (album: AlbumItem) => void;
  onOpenShare: (title: string, summary: string) => void;
}

export const GalerieView: React.FC<GalerieViewProps> = ({ albums, onSelectAlbum }) => {
  const [selectedType, setSelectedType] = useState<'all' | 'photo' | 'video'>('all');

  const filtered = albums.filter((alb) => selectedType === 'all' || alb.type === selectedType || alb.type === 'mixte');

  const types: { v: 'all' | 'photo' | 'video'; label: string }[] = [
    { v: 'all', label: 'Tout' },
    { v: 'photo', label: 'Photos' },
    { v: 'video', label: 'Vidéos' }
  ];

  return (
    <div>
      <PageIntro title="Galerie" lead="Albums photos et vidéos des cultes, événements et temps forts de la communauté.">
        {albums.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {types.map((t) => (
              <button
                key={t.v}
                onClick={() => setSelectedType(t.v)}
                className={selectedType === t.v ? 'chip-active' : 'chip'}
                aria-pressed={selectedType === t.v}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}
      </PageIntro>

      <div className="page py-8">
        {albums.length === 0 ? (
          <EmptyState message="Aucun album photo ou vidéo publié pour le moment." />
        ) : filtered.length === 0 ? (
          <EmptyState
            message="Aucun album ne correspond à ce filtre."
            actionLabel="Tout afficher"
            onAction={() => setSelectedType('all')}
          />
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((alb) => {
              const count = alb.items?.length || alb.mediaCount || 0;
              return (
                <li key={alb.id}>
                  <button
                    onClick={() => onSelectAlbum(alb)}
                    className="surface surface-interactive group block w-full overflow-hidden text-left"
                  >
                    <span className="relative block overflow-hidden bg-church-navy">
                      <img
                        src={sanitizeUrl(alb.coverImage) || HERO_IMAGE}
                        alt={alb.title}
                        className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                      <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-church-navy shadow-xs">
                        {alb.type === 'video' ? (
                          <Play className="h-3.5 w-3.5 text-church-blue" aria-hidden="true" />
                        ) : (
                          <Images className="h-3.5 w-3.5 text-church-blue" aria-hidden="true" />
                        )}
                        {count} {count > 1 ? 'médias' : 'média'}
                      </span>
                    </span>
                    <span className="block p-4">
                      <span className="block font-serif text-lg font-semibold leading-snug text-church-navy group-hover:text-church-blue">
                        {alb.title}
                      </span>
                      <span className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-church-muted">
                        <span>{formatDate(alb.date)}</span>
                        <span aria-hidden="true">·</span>
                        <span>{alb.category}</span>
                      </span>
                    </span>
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
