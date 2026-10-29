import React, { useState, useMemo } from 'react';
import { Culte } from '../types';
import { Search, Play, Share2, MessageCircle } from 'lucide-react';
import { PageIntro, Meta, EmptyState, formatDate } from './ui';

interface CultesViewProps {
  cultes: Culte[];
  onSelectCulte: (culte: Culte) => void;
  onOpenShare: (title: string, summary: string, query?: string) => void;
}

export const CultesView: React.FC<CultesViewProps> = ({ cultes, onSelectCulte, onOpenShare }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPreacher, setSelectedPreacher] = useState<string>('all');

  const preachers = useMemo(() => Array.from(new Set(cultes.map((c) => c.preacher).filter(Boolean))), [cultes]);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return cultes.filter((c) => {
      const matchSearch =
        !q ||
        [c.title, c.sermonSummary, c.scriptureRef, c.preacher].some((v) => (v || '').toLowerCase().includes(q));
      const matchPreacher = selectedPreacher === 'all' || c.preacher === selectedPreacher;
      return matchSearch && matchPreacher;
    });
  }, [cultes, searchTerm, selectedPreacher]);

  const reset = () => {
    setSearchTerm('');
    setSelectedPreacher('all');
  };

  return (
    <div>
      <PageIntro
        title="Cultes et prédications"
        lead="Les prédications et enseignements de l’église, avec les textes bibliques, les résumés et les supports à télécharger."
      >
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <label className="relative flex-1">
            <span className="sr-only">Rechercher une prédication</span>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-church-muted" aria-hidden="true" />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Thème, passage biblique, prédicateur…"
              className="field pl-10"
            />
          </label>
          {preachers.length > 1 && (
            <select
              value={selectedPreacher}
              onChange={(e) => setSelectedPreacher(e.target.value)}
              className="field sm:w-64"
              aria-label="Filtrer par prédicateur"
            >
              <option value="all">Tous les prédicateurs</option>
              {preachers.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          )}
        </div>
      </PageIntro>

      <div className="page py-8">
        {filtered.length === 0 ? (
          <EmptyState
            message="Aucune prédication ne correspond à cette recherche."
            actionLabel="Afficher toutes les prédications"
            onAction={reset}
          />
        ) : (
          <ul className="space-y-4">
            {filtered.map((culte) => (
              <li key={culte.id}>
                <article className="surface grid overflow-hidden sm:grid-cols-[240px_1fr] lg:grid-cols-[300px_1fr]">
                  <button onClick={() => onSelectCulte(culte)} className="relative block bg-church-navy" aria-label={culte.title}>
                    <img src={culte.coverImage} alt="" className="aspect-video h-full w-full object-cover sm:aspect-auto" />
                    {culte.hasVideo && (
                      <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded bg-church-navy px-2 py-0.5 text-[13px] text-white">
                        <Play className="h-3 w-3 fill-white" aria-hidden="true" /> {culte.videoDuration || 'Vidéo'}
                      </span>
                    )}
                  </button>
                  <div className="flex min-w-0 flex-col p-5">
                    <Meta
                      items={[
                        formatDate(culte.date),
                        culte.preacher,
                        culte.isDemo && <span className="demo-tag">Démonstration</span>
                      ]}
                    />
                    <h2 className="mt-2 text-xl sm:text-2xl">
                      <button onClick={() => onSelectCulte(culte)} className="text-left hover:text-church-blue">
                        {culte.title}
                      </button>
                    </h2>
                    {culte.scriptureRef && (
                      <p className="mt-2 font-serif italic text-church-navy">{culte.scriptureRef}</p>
                    )}
                    {culte.sermonSummary && <p className="mt-2 line-clamp-2 text-[15px]">{culte.sermonSummary}</p>}

                    <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                      <span className="flex items-center gap-4 text-sm text-church-muted">
                        <span title="J’aime, cœur et je prie">
                          {culte.reactions.likes + culte.reactions.hearts + culte.reactions.prayers} réactions
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MessageCircle className="h-4 w-4" aria-hidden="true" /> {culte.comments.length}
                        </span>
                      </span>
                      <span className="flex items-center gap-1">
                        <button
                          onClick={() => onOpenShare(culte.title, culte.sermonSummary, `page=culte&id=${culte.id}`)}
                          className="btn-ghost"
                          aria-label="Partager"
                        >
                          <Share2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button onClick={() => onSelectCulte(culte)} className="btn-secondary">
                          Lire
                        </button>
                      </span>
                    </div>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
