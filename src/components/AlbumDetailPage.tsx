import React, { useState } from 'react';
import { AlbumItem } from '../types';
import { buildDownloadUrl, extractYoutubeThumbnail, isDirectVideoUrl, sanitizeUrl } from '../utils/security';
import { Play, Headphones, Download, Eye } from 'lucide-react';
import { BackBar, Lightbox, formatDate } from './ui';

interface AlbumDetailPageProps {
  album: AlbumItem;
  onBack: () => void;
  onOpenShare: (title: string, summary: string) => void;
}

export const AlbumDetailPage: React.FC<AlbumDetailPageProps> = ({ album, onBack, onOpenShare }) => {
  const [open, setOpen] = useState<number | null>(null);
  const items = (album.items || []).filter((it) => !!sanitizeUrl(it.url));

  return (
    <div>
      <BackBar backLabel="Galerie" onBack={onBack} onShare={() => onOpenShare(album.title, album.description)} />

      <div className="page py-6 sm:py-10">
        <div className="max-w-3xl">
          <p className="flex flex-wrap items-center gap-x-2.5 text-sm text-church-muted">
            <span>{formatDate(album.date)}</span>
            <span aria-hidden="true">·</span>
            <span>{album.category}</span>
          </p>
          <h1 className="mt-2 text-[2rem] leading-tight sm:text-[2.5rem]">{album.title}</h1>
          {album.description && <p className="mt-3 text-[17px] text-church-muted">{album.description}</p>}
          <p className="mt-3 text-sm text-church-muted">
            {items.length} {items.length > 1 ? 'éléments' : 'élément'} dans cet album. Affichez en plein écran ou téléchargez directement.
          </p>
        </div>

        {items.length === 0 ? (
          <p className="surface mt-8 p-8 text-center text-church-muted">Les médias de cet album seront bientôt disponibles.</p>
        ) : (
          <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {items.map((item, i) => {
              const safeUrl = sanitizeUrl(item.url);
              const downloadable = item.type === 'photo' || item.type === 'audio' || (item.type === 'video' && isDirectVideoUrl(safeUrl));
              const dlHref = buildDownloadUrl(safeUrl, item.caption || `${album.title}-${i + 1}`);
              const isDirectVid = item.type === 'video' && isDirectVideoUrl(safeUrl);
              const ytThumb = item.type === 'video' ? extractYoutubeThumbnail(safeUrl) : null;

              return (
                <li key={item.id} className="surface overflow-hidden flex flex-col">
                  <button
                    onClick={() => setOpen(i)}
                    className="group relative block w-full overflow-hidden bg-church-navy"
                    aria-label={item.caption || `Afficher l'élément ${i + 1}`}
                  >
                    {item.type === 'video' ? (
                      <span className="relative block aspect-square w-full overflow-hidden bg-black">
                        {isDirectVid ? (
                          <video
                            preload="metadata"
                            muted
                            playsInline
                            src={`${safeUrl}#t=0.5`}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : ytThumb ? (
                          <img
                            src={ytThumb}
                            alt={item.caption || album.title}
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <span className="block h-full w-full bg-gradient-to-br from-church-navy to-church-blue/90" />
                        )}
                        <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-church-navy/30 text-white transition-colors group-hover:bg-church-navy/40">
                          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-church-navy shadow-md transition-transform group-hover:scale-105">
                            <Play className="h-5 w-5 fill-church-navy" aria-hidden="true" />
                          </span>
                          <span className="rounded-full bg-black/55 px-2.5 py-0.5 text-xs font-medium">
                            Vidéo{item.duration ? ` · ${item.duration}` : ''}
                          </span>
                        </span>
                      </span>
                    ) : item.type === 'audio' ? (
                      <span className="flex aspect-square w-full flex-col items-center justify-center gap-2 bg-church-light text-church-navy px-3 text-center">
                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-church-blue text-white transition-transform group-hover:scale-105">
                          <Headphones className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <span className="text-sm font-medium">Audio{item.duration ? `, ${item.duration}` : ''}</span>
                      </span>
                    ) : (
                      <img
                        src={safeUrl}
                        alt={item.caption || album.title}
                        loading="lazy"
                        className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    )}
                  </button>

                  <div className="flex flex-col gap-2 p-3 flex-1">
                    {item.caption && (
                      <p className="truncate text-xs font-medium text-church-navy" title={item.caption}>
                        {item.caption}
                      </p>
                    )}
                    <div className="mt-auto flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setOpen(i)}
                        className="btn-secondary min-h-[36px] flex-1 px-2.5 text-xs"
                      >
                        <Eye className="h-3.5 w-3.5 text-church-blue" aria-hidden="true" />
                        Afficher
                      </button>
                      {downloadable && dlHref && (
                        <a
                          href={dlHref}
                          download
                          className="btn-primary min-h-[36px] flex-1 px-2.5 text-xs"
                        >
                          <Download className="h-3.5 w-3.5" aria-hidden="true" />
                          Télécharger
                        </a>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {open !== null && (
        <Lightbox
          items={items.map((it) => ({
            ...it,
            url: sanitizeUrl(it.url),
            fallbackUrl: it.fallbackUrl ? sanitizeUrl(it.fallbackUrl, false) : undefined
          }))}
          index={open}
          onChange={setOpen}
          onClose={() => setOpen(null)}
        />
      )}
    </div>
  );
};
