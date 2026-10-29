import React, { useState } from 'react';
import { AlbumItem } from '../types';
import { Images, Play } from 'lucide-react';
import { PageIntro, EmptyState, formatDate } from './ui';

interface GalerieViewProps {
  albums: AlbumItem[];
  onSelectAlbum: (album: AlbumItem) => void;
  onOpenShare: (title: string, summary: string) => void;
}

export const GalerieView: React.FC<GalerieViewProps> = ({ albums, onSelectAlbum }) => {
  const [selectedType, setSelectedType] = useState<'all' | 'photo' | 'video'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const categories = ['all', ...Array.from(new Set(albums.map((a) => a.category)))];

  const filtered = albums.filter((alb) => {
    const matchType = selectedType === 'all' || alb.type === selectedType || alb.type === 'mixte';
    const matchCat = selectedCategory === 'all' || alb.category === selectedCategory;
    return matchType && matchCat;
  });

  const types: { v: 'all' | 'photo' | 'video'; label: string }[] = [
    { v: 'all', label: 'Tout' },
    { v: 'photo', label: 'Photos' },
    { v: 'video', label: 'Vidéos' }
  ];

  return (
    <div>
      <PageIntro title="Galerie" lead="Photos et vidéos des cultes, des événements et des activités des départements.">
        <div className="no-scrollbar -mx-4 mt-6 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
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
          {categories.length > 2 && <span className="mx-1 w-px shrink-0 self-stretch bg-church-line" aria-hidden="true" />}
          {categories.length > 2 &&
            categories
              .filter((c) => c !== 'all')
              .map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedCategory(selectedCategory === c ? 'all' : c)}
                  className={selectedCategory === c ? 'chip-active' : 'chip'}
                  aria-pressed={selectedCategory === c}
                >
                  {c}
                </button>
              ))}
        </div>
      </PageIntro>

      <div className="page py-8">
        {filtered.length === 0 ? (
          <EmptyState
            message="Aucun album ne correspond à ce filtre."
            actionLabel="Voir tous les albums"
            onAction={() => {
              setSelectedType('all');
              setSelectedCategory('all');
            }}
          />
        ) : (
          <ul className="grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((alb) => (
              <li key={alb.id}>
                <button onClick={() => onSelectAlbum(alb)} className="group block w-full text-left">
                  <span className="relative block overflow-hidden rounded-lg bg-church-navy">
                    <img src={alb.coverImage} alt="" className="aspect-[4/3] w-full object-cover transition-opacity group-hover:opacity-90" />
                    <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded bg-white px-2 py-0.5 text-[13px] font-medium text-church-navy">
                      {alb.type === 'video' ? <Play className="h-3.5 w-3.5" aria-hidden="true" /> : <Images className="h-3.5 w-3.5" aria-hidden="true" />}
                      {alb.mediaCount} {alb.mediaCount > 1 ? 'médias' : 'média'}
                    </span>
                  </span>
                  <span className="mt-3 block font-serif text-lg font-semibold leading-snug text-church-navy group-hover:text-church-blue">
                    {alb.title}
                  </span>
                  <span className="mt-0.5 flex flex-wrap items-center gap-x-3 text-sm text-church-muted">
                    <span>{formatDate(alb.date)}</span>
                    <span>{alb.category}</span>
                    {alb.isDemo && <span className="demo-tag">Démonstration</span>}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
