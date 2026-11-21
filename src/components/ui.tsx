import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronRight, ArrowLeft, Share2, Check, Download } from 'lucide-react';
import { buildDownloadUrl, isDirectVideoUrl, sanitizeUrl } from '../utils/security';

const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const MONTHS_LONG = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const DAYS_LONG = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

const parseIso = (value: string): Date | null => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
};

/** « 2026-10-25 » → « dimanche 25 octobre 2026 ». */
export const formatDate = (value: string): string => {
  const d = parseIso(value);
  if (!d) return value;
  return `${DAYS_LONG[d.getDay()]} ${d.getDate()} ${MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`;
};

/** Horodatage complet automatique : « dimanche 20 nov. 2026 à 14h22 ». */
export const formatPublishedDateTime = (dateValue: string, publishedAt?: string): string => {
  if (publishedAt) {
    const dt = new Date(publishedAt);
    if (!Number.isNaN(dt.getTime())) {
      const hh = String(dt.getHours()).padStart(2, '0');
      const mm = String(dt.getMinutes()).padStart(2, '0');
      const dayLabel = `${DAYS_LONG[dt.getDay()]} ${dt.getDate()} ${MONTHS_LONG[dt.getMonth()]} ${dt.getFullYear()}`;
      return `${dayLabel} à ${hh}h${mm}`;
    }
  }
  return formatDate(dateValue);
};

/** Bloc date compact (jour + mois). */
export const dateParts = (value: string): { day: string; month: string } | null => {
  const d = parseIso(value);
  if (d) return { day: String(d.getDate()), month: MONTHS[d.getMonth()] };
  const m = /(\d{1,2})(?:\s*-\s*\d{1,2})?\s+([A-Za-zéûÉÛ]+)/.exec(value);
  if (!m) return null;
  const idx = MONTHS_LONG.findIndex((x) => x === m[2].toLowerCase());
  return { day: m[1], month: idx >= 0 ? MONTHS[idx] : m[2].slice(0, 4).toLowerCase() };
};

/** En-tête de page : titre + chapeau optimisé mobile & PC. */
export const PageIntro: React.FC<{ title: string; lead?: string; children?: React.ReactNode }> = ({
  title,
  lead,
  children
}) => (
  <header className="border-b border-church-line bg-white">
    <div className="page py-5 sm:py-9">
      <h1 className="text-2xl sm:text-[2.35rem]">{title}</h1>
      {lead && <p className="mt-2 max-w-2xl text-[15px] sm:text-[17px] text-church-muted">{lead}</p>}
      {children}
    </div>
  </header>
);

/** En-tête de section avec lien « voir tout ». */
export const SectionHead: React.FC<{ title: string; linkLabel?: string; onLink?: () => void }> = ({
  title,
  linkLabel,
  onLink
}) => (
  <div className="mb-5 flex items-end justify-between gap-4 border-b border-church-line pb-3">
    <h2 className="text-2xl sm:text-[1.75rem]">{title}</h2>
    {linkLabel && onLink && (
      <button onClick={onLink} className="link flex shrink-0 items-center gap-0.5 text-sm">
        {linkLabel}
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </button>
    )}
  </div>
);

/** Ligne d’informations secondaires séparées typographiquement. */
export const Meta: React.FC<{ items: (React.ReactNode | false | null | undefined)[]; className?: string }> = ({
  items,
  className = ''
}) => {
  const clean = items.filter(Boolean);
  return (
    <div className={`flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-church-muted ${className}`}>
      {clean.map((it, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span aria-hidden="true" className="text-church-line">·</span>}
          <span className="inline-flex items-center gap-1.5">{it}</span>
        </React.Fragment>
      ))}
    </div>
  );
};

/** Bloc date arrondi (jour en grand, mois en dessous). */
export const DateBlock: React.FC<{ date: string; className?: string }> = ({ date, className = '' }) => {
  const p = dateParts(date);
  if (!p) return null;
  return (
    <div
      className={`flex h-16 w-14 shrink-0 flex-col items-center justify-center rounded-2xl border border-church-line bg-church-light/60 text-church-navy ${className}`}
    >
      <span className="font-serif text-2xl font-semibold leading-none tabular-nums">{p.day}</span>
      <span className="mt-1 text-xs font-medium text-church-muted">{p.month}</span>
    </div>
  );
};

/** État vide doux et clair. */
export const EmptyState: React.FC<{ message: string; actionLabel?: string; onAction?: () => void }> = ({
  message,
  actionLabel,
  onAction
}) => (
  <div className="surface px-6 py-12 text-center animate-soft-in">
    <p className="text-church-muted">{message}</p>
    {actionLabel && onAction && (
      <button onClick={onAction} className="btn-secondary mt-4">
        {actionLabel}
      </button>
    )}
  </div>
);

/** Barre du haut des pages de détail : retour clair + partage. */
export const BackBar: React.FC<{ backLabel: string; onBack: () => void; onShare?: () => void }> = ({
  backLabel,
  onBack,
  onShare
}) => (
  <div className="border-b border-church-line bg-white">
    <div className="page flex h-14 items-center justify-between gap-3">
      <button
        onClick={onBack}
        className="-ml-2 inline-flex min-h-[44px] items-center gap-2 rounded-xl px-2.5 font-medium text-church-navy transition-colors hover:bg-church-tint/50 hover:text-church-blue"
      >
        <ArrowLeft className="h-5 w-5 text-church-blue" aria-hidden="true" />
        {backLabel}
      </button>
      {onShare && (
        <button onClick={onShare} className="btn-ghost">
          <Share2 className="h-4 w-4" aria-hidden="true" /> Partager
        </button>
      )}
    </div>
  </div>
);

/** Message de confirmation discret. */
export const useToast = () => {
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const show = useCallback((m: string) => {
    setMsg(m);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMsg(null), 3200);
  }, []);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const node = msg ? (
    <div
      role="status"
      className="fixed inset-x-4 bottom-20 z-[60] mx-auto flex max-w-md items-center gap-2 rounded-2xl bg-church-navy px-4 py-3 text-[15px] text-white shadow-lg lg:bottom-6 animate-soft-in"
    >
      <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{msg}</span>
    </div>
  ) : null;
  return { show, node };
};

/** Titre de bloc à l’intérieur d’une page de détail. */
export const BlockTitle: React.FC<{ children: React.ReactNode; id?: string }> = ({ children, id }) => (
  <h2 id={id} className="mb-3 scroll-mt-24 text-xl sm:text-2xl">
    {children}
  </h2>
);

/** Visionneuse plein écran pour photos, vidéos et audios (flèches + glisser au doigt + téléchargement). */
export const Lightbox: React.FC<{
  items: { type: 'photo' | 'video' | 'audio'; url: string; caption?: string }[];
  index: number;
  onClose: () => void;
  onChange: (i: number) => void;
}> = ({ items, index, onClose, onChange }) => {
  const startX = useRef<number | null>(null);
  const item = items[index];
  const go = (d: number) => onChange((index + d + items.length) % items.length);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  });

  if (!item) return null;
  const safeUrl = sanitizeUrl(item.url, true);
  const isDirectVideo = isDirectVideoUrl(safeUrl);
  const downloadHref = buildDownloadUrl(safeUrl, item.caption);

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-black/95 text-white" role="dialog" aria-modal="true" aria-label="Visionneuse">
      <div className="flex items-center justify-between gap-3 p-4">
        <span className="text-sm text-white/80 tabular-nums">
          {index + 1} / {items.length}
        </span>
        <div className="flex items-center gap-2">
          {(item.type === 'photo' || item.type === 'audio' || (item.type === 'video' && isDirectVideo)) && downloadHref && (
            <a
              href={downloadHref}
              download
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 px-3.5 py-2 text-sm font-medium text-white hover:bg-white/25"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Télécharger
            </a>
          )}
          <button onClick={onClose} className="rounded-xl bg-white/10 px-4 py-2 text-[15px] font-medium hover:bg-white/20" aria-label="Fermer la visionneuse">
            Fermer
          </button>
        </div>
      </div>
      <div
        className="relative flex flex-1 items-center justify-center overflow-hidden px-4"
        onTouchStart={(e) => (startX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (startX.current === null) return;
          const dx = e.changedTouches[0].clientX - startX.current;
          if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
          startX.current = null;
        }}
      >
        {item.type === 'video' ? (
          isDirectVideo ? (
            <video controls autoPlay src={safeUrl} className="max-h-full w-full max-w-4xl rounded-2xl bg-black" />
          ) : (
            <iframe
              title={item.caption || 'Vidéo'}
              src={safeUrl}
              className="aspect-video w-full max-w-4xl rounded-2xl border-0"
              allow="encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
            />
          )
        ) : item.type === 'audio' ? (
          <div className="w-full max-w-lg rounded-2xl bg-white/10 p-6 text-center space-y-4">
            <p className="text-base font-medium text-white">{item.caption || 'Enregistrement audio'}</p>
            <audio controls autoPlay src={safeUrl} className="w-full">
              Votre navigateur ne lit pas l’audio.
            </audio>
          </div>
        ) : (
          <img src={safeUrl} alt={item.caption || ''} className="max-h-full max-w-full select-none rounded-xl object-contain" />
        )}
        {items.length > 1 && (
          <>
            <button onClick={() => go(-1)} className="absolute left-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-xl hover:bg-white/25 sm:flex" aria-label="Précédent">
              ‹
            </button>
            <button onClick={() => go(1)} className="absolute right-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-xl hover:bg-white/25 sm:flex" aria-label="Suivant">
              ›
            </button>
          </>
        )}
      </div>
      <p className="min-h-[52px] p-3 text-center text-[15px] text-white/80">
        {item.caption || (items.length > 1 ? 'Glissez pour voir la suivante' : '')}
      </p>
    </div>
  );
};
