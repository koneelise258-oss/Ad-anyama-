import React, { useState } from 'react';
import { AlbumItem } from '../types';
import { Play } from 'lucide-react';
import { BackBar, Lightbox, formatDate } from './ui';

interface AlbumDetailPageProps {
  album: AlbumItem;
  onBack: () => void;
  onOpenShare: (title: string, summary: string) => void;
}

export const AlbumDetailPage: React.FC<AlbumDetailPageProps> = ({ album, onBack, onOpenShare }) => {
  const [open, setOpen] = useState<number | null>(null);
  const items = album.items || [];

  return (
    <div>
      <BackBar backLabel="Galerie" onBack={onBack} onShare={() => onOpenShare(album.title, album.description)} />

      <div className="page py-6 sm:py-10">
        <div className="max-w-3xl">
          <p className="flex flex-wrap items-center gap-x-3 text-sm text-church-muted">
            <span>{formatDate(album.date)}</span>
            <span>{album.category}</span>
            {album.isDemo && <span className="demo-tag">Démonstration</span>}
          </p>
          <h1 className="mt-2 text-[2rem] leading-tight sm:text-[2.6rem]">{album.title}</h1>
          {album.description && <p className="mt-3 text-[17px] text-church-muted">{album.description}</p>}
          <p className="mt-3 text-sm text-church-muted">
            {items.length} {items.length > 1 ? 'éléments' : 'élément'} dans cet album. Touchez une photo pour l’agrandir.
          </p>
        </div>

        {items.length === 0 ? (
          <p className="surface mt-8 p-8 text-center text-church-muted">Les photos de cet album seront bientôt ajoutées.</p>
        ) : (
          <ul className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((item, i) => (
              <li key={item.id}>
                <button onClick={() => setOpen(i)} className="group relative block w-full overflow-hidden rounded-md bg-church-navy" aria-label={item.caption || `Élément ${i + 1}`}>
                  {item.type === 'video' ? (
                    <span className="flex aspect-square w-full flex-col items-center justify-center gap-2 text-white">
                      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-church-navy">
                        <Play className="h-5 w-5 fill-church-navy" aria-hidden="true" />
                      </span>
                      <span className="text-sm">Vidéo{item.duration ? `, ${item.duration}` : ''}</span>
                    </span>
                  ) : (
                    <img src={item.url} alt="" loading="lazy" className="aspect-square w-full object-cover transition-opacity group-hover:opacity-90" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {open !== null && <Lightbox items={items} index={open} onChange={setOpen} onClose={() => setOpen(null)} />}
    </div>
  );
};
