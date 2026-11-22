import React, { useState, useMemo } from 'react';
import { Culte, CulteServiceType } from '../types';
import { buildDownloadUrl, isDirectVideoUrl, sanitizeUrl } from '../utils/security';
import {
  CULTE_TYPE_LABELS,
  groupCultesByCategory,
  inferCulteServiceType,
  sortCultesByDateDesc
} from '../utils/cultes';
import { Search, Play, Share2, MessageCircle, Headphones, FileText, Download, BookOpen } from 'lucide-react';
import { PageIntro, Meta, EmptyState, formatDate } from './ui';

interface CultesViewProps {
  cultes: Culte[];
  onSelectCulte: (culte: Culte) => void;
  onOpenShare: (title: string, summary: string, query?: string) => void;
}

export const CultesView: React.FC<CultesViewProps> = ({ cultes, onSelectCulte, onOpenShare }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | CulteServiceType>('all');
  const [mediaFilter, setMediaFilter] = useState<'all' | 'audio' | 'video'>('all');
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

  const hasAnyAudio = useMemo(() => cultes.some((c) => !!sanitizeUrl(c.audioUrl, false)), [cultes]);
  const hasAnyVideo = useMemo(() => cultes.some((c) => c.hasVideo && !!sanitizeUrl(c.videoUrl, false)), [cultes]);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return sortCultesByDateDesc(
      cultes.filter((c) => {
        const sType = inferCulteServiceType(c);
        const matchType = typeFilter === 'all' || sType === typeFilter;
        const matchSearch =
          !q ||
          [c.title, c.sermonSummary, c.scriptureRef, c.preacher, c.eventLabel].some((v) =>
            (v || '').toLowerCase().includes(q)
          );
        const matchMedia =
          mediaFilter === 'all' ||
          (mediaFilter === 'audio' && !!sanitizeUrl(c.audioUrl, false)) ||
          (mediaFilter === 'video' && c.hasVideo && !!sanitizeUrl(c.videoUrl, false));
        return matchType && matchSearch && matchMedia;
      })
    );
  }, [cultes, searchTerm, typeFilter, mediaFilter]);

  const groupedSections = useMemo(() => {
    return groupCultesByCategory(filtered).filter((g) => g.items.length > 0);
  }, [filtered]);

  const reset = () => {
    setSearchTerm('');
    setTypeFilter('all');
    setMediaFilter('all');
  };

  const renderCulteCard = (culte: Culte) => {
    const safeVideo = culte.videoUrl ? sanitizeUrl(culte.videoUrl, false) : '';
    const safeAudio = culte.audioUrl ? sanitizeUrl(culte.audioUrl, false) : '';
    const isPlayingHere = playingVideoId === culte.id && !!safeVideo;
    const isDirectVideo = isDirectVideoUrl(safeVideo);
    const sType = inferCulteServiceType(culte);
    const typeLabel =
      sType === 'evenement' && culte.eventLabel
        ? `Événement : ${culte.eventLabel}`
        : CULTE_TYPE_LABELS[sType];

    return (
      <li key={culte.id}>
        <article className="surface surface-interactive grid overflow-hidden sm:grid-cols-[260px_1fr] lg:grid-cols-[320px_1fr]">
          {/* Médias vidéo directement lisible */}
          <div className="relative bg-church-navy">
            {isPlayingHere ? (
              isDirectVideo ? (
                <video controls autoPlay src={safeVideo} className="aspect-video h-full w-full bg-black object-contain" />
              ) : (
                <iframe
                  title={`Vidéo — ${culte.title}`}
                  src={`${safeVideo}${safeVideo.includes('?') ? '&' : '?'}autoplay=1`}
                  className="aspect-video h-full w-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              )
            ) : (
              <button
                onClick={() => {
                  if (culte.hasVideo && safeVideo) setPlayingVideoId(culte.id);
                  else onSelectCulte(culte);
                }}
                className="group relative block h-full w-full"
                aria-label={culte.hasVideo && safeVideo ? `Lire la vidéo : ${culte.title}` : culte.title}
              >
                {sanitizeUrl(culte.coverImage) ? (
                  <img
                    src={sanitizeUrl(culte.coverImage)}
                    alt={culte.title}
                    className="aspect-video h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02] sm:aspect-auto"
                  />
                ) : (
                  <span className="flex aspect-video h-full min-h-[170px] w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-church-navy to-church-blue/90 p-5 text-center text-white sm:aspect-auto">
                    <BookOpen className="h-8 w-8 text-white/75" aria-hidden="true" />
                    {culte.scriptureRef && (
                      <span className="font-serif text-sm text-white/90 line-clamp-2">{culte.scriptureRef}</span>
                    )}
                  </span>
                )}
                {culte.hasVideo && safeVideo && (
                  <span className="absolute inset-0 flex items-center justify-center bg-church-navy/25 transition-colors group-hover:bg-church-navy/35">
                    <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-church-navy shadow-md">
                      <Play className="h-3.5 w-3.5 fill-church-navy" aria-hidden="true" />
                      Lire {culte.videoDuration ? `(${culte.videoDuration})` : 'la vidéo'}
                    </span>
                  </span>
                )}
              </button>
            )}
          </div>

          <div className="flex min-w-0 flex-col p-4 sm:p-6">
            <Meta
              items={[
                <span className="font-semibold text-church-blue">{typeLabel}</span>,
                formatDate(culte.date),
                culte.preacher
              ]}
            />
            <h3 className="mt-2 font-serif text-lg sm:text-2xl text-church-navy">
              <button onClick={() => onSelectCulte(culte)} className="text-left hover:text-church-blue">
                {culte.title}
              </button>
            </h3>
            {culte.scriptureRef && (
              <p className="mt-1 font-serif text-sm sm:text-base italic text-church-blue">{culte.scriptureRef}</p>
            )}
            {culte.sermonSummary && (
              <p className="mt-2 line-clamp-2 text-sm sm:text-[15px] text-church-dark">{culte.sermonSummary}</p>
            )}

            {/* Lecteur Audio direct dans la liste */}
            {safeAudio && (
              <div className="mt-3.5 rounded-xl border border-church-line bg-church-light/60 p-3 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-church-navy">
                  <span className="inline-flex items-center gap-1.5">
                    <Headphones className="h-3.5 w-3.5 text-church-blue" aria-hidden="true" />
                    Audio du message
                    {culte.audioDuration && (
                      <span className="font-normal text-church-muted tabular-nums">· {culte.audioDuration}</span>
                    )}
                  </span>
                  <a
                    href={buildDownloadUrl(safeAudio, `${culte.title}-audio`)}
                    download
                    className="inline-flex items-center gap-1 text-church-blue hover:underline"
                  >
                    <Download className="h-3.5 w-3.5" aria-hidden="true" />
                    Télécharger l’audio
                  </a>
                </div>
                <audio controls preload="none" src={safeAudio} className="h-9 w-full">
                  Votre navigateur ne lit pas l’audio.
                </audio>
              </div>
            )}

            <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-3.5">
              <span className="flex items-center gap-3.5 text-xs sm:text-sm text-church-muted">
                <span className="inline-flex items-center gap-1">
                  <MessageCircle className="h-4 w-4" aria-hidden="true" /> {culte.comments.length}
                </span>
                {culte.documents.length > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <FileText className="h-4 w-4" aria-hidden="true" /> {culte.documents.length} doc.
                  </span>
                )}
              </span>
              <span className="flex flex-wrap items-center gap-1.5">
                {culte.hasVideo && safeVideo && isDirectVideo && (
                  <a
                    href={buildDownloadUrl(safeVideo, `${culte.title}-video`)}
                    download
                    className="btn-secondary min-h-[40px] px-3 text-xs"
                  >
                    <Download className="h-3.5 w-3.5 text-church-blue" aria-hidden="true" />
                    Vidéo
                  </a>
                )}
                <button
                  onClick={() => onOpenShare(culte.title, culte.sermonSummary, `page=culte&id=${culte.id}`)}
                  className="btn-ghost"
                  aria-label="Partager"
                >
                  <Share2 className="h-4 w-4" aria-hidden="true" />
                </button>
                <button onClick={() => onSelectCulte(culte)} className="btn-secondary min-h-[40px] px-3.5 text-xs sm:text-sm">
                  Détails
                </button>
              </span>
            </div>
          </div>
        </article>
      </li>
    );
  };

  return (
    <div>
      <PageIntro
        title="Cultes et prédications"
        lead="Classés par date et par rendez-vous (Dimanche, Événement, Mardi). Écoutez ou regardez directement."
      >
        <div className="mt-4 space-y-3">
          <label className="relative block">
            <span className="sr-only">Rechercher une prédication</span>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-church-muted" aria-hidden="true" />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Titre, passage biblique, prédicateur…"
              className="field pl-10"
            />
          </label>

          {/* Classement explicite : Tous / Dimanche / Événement / Mardi + filtre Audio/Vidéo */}
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                { id: 'all', label: 'Tous' },
                { id: 'dimanche', label: 'Dimanche' },
                { id: 'evenement', label: 'Événement' },
                { id: 'mardi', label: 'Mardi' }
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                onClick={() => setTypeFilter(t.id)}
                className={typeFilter === t.id ? 'chip-active' : 'chip'}
                aria-pressed={typeFilter === t.id}
              >
                {t.label}
              </button>
            ))}

            {(hasAnyAudio || hasAnyVideo) && <span className="mx-1 h-5 w-px bg-church-line shrink-0" aria-hidden="true" />}

            {hasAnyAudio && (
              <button
                onClick={() => setMediaFilter((v) => (v === 'audio' ? 'all' : 'audio'))}
                className={mediaFilter === 'audio' ? 'chip-active' : 'chip'}
                aria-pressed={mediaFilter === 'audio'}
              >
                <Headphones className="h-3.5 w-3.5" aria-hidden="true" /> Audio
              </button>
            )}
            {hasAnyVideo && (
              <button
                onClick={() => setMediaFilter((v) => (v === 'video' ? 'all' : 'video'))}
                className={mediaFilter === 'video' ? 'chip-active' : 'chip'}
                aria-pressed={mediaFilter === 'video'}
              >
                <Play className="h-3.5 w-3.5" aria-hidden="true" /> Vidéo
              </button>
            )}
          </div>
        </div>
      </PageIntro>

      <div className="page py-6 sm:py-8">
        {cultes.length === 0 ? (
          <EmptyState message="Aucune prédication n’a encore été publiée." />
        ) : filtered.length === 0 ? (
          <EmptyState
            message="Aucune prédication ne correspond à cette sélection."
            actionLabel="Tout afficher"
            onAction={reset}
          />
        ) : typeFilter === 'all' ? (
          <div className="space-y-8">
            {groupedSections.map((group) => (
              <section key={group.type} className="space-y-4">
                <div className="flex items-baseline justify-between border-b border-church-line pb-2.5">
                  <h2 className="font-serif text-xl sm:text-2xl text-church-navy">{group.label}</h2>
                  <span className="text-xs font-medium text-church-muted tabular-nums">
                    {group.items.length} culte{group.items.length > 1 ? 's' : ''}
                  </span>
                </div>
                <ul className="space-y-4">{group.items.map(renderCulteCard)}</ul>
              </section>
            ))}
          </div>
        ) : (
          <ul className="space-y-4">{filtered.map(renderCulteCard)}</ul>
        )}
      </div>
    </div>
  );
};
