import React, { useState } from 'react';
import { Culte } from '../types';
import { HERO_IMAGE } from '../mockData';
import { buildDownloadUrl, isDirectVideoUrl, sanitizeUrl, toSafeYoutubeEmbed } from '../utils/security';
import { Play, Download, ThumbsUp, Heart, Flag, Headphones, Eye, ExternalLink } from 'lucide-react';
import { BackBar, BlockTitle, Lightbox, Meta, formatDate, useToast } from './ui';
import { MediaViewerSection } from './MediaViewerSection';
import { CULTE_TYPE_LABELS, inferCulteServiceType } from '../utils/cultes';

interface CulteDetailPageProps {
  culte: Culte;
  onBack: () => void;
  onOpenShare: (title: string, summary: string) => void;
  onAddReaction: (culteId: string, type: 'likes' | 'hearts' | 'prayers') => void;
  onAddComment: (culteId: string, authorName: string, text: string) => void;
  onReportComment: (commentId: string) => void;
}

type ReactionType = 'likes' | 'hearts' | 'prayers';
const REACTED_KEY = 'eeadci_reacted';

const readReacted = (): Record<string, ReactionType[]> => {
  try {
    return JSON.parse(localStorage.getItem(REACTED_KEY) || '{}');
  } catch {
    return {};
  }
};

export const CulteDetailPage: React.FC<CulteDetailPageProps> = ({
  culte,
  onBack,
  onOpenShare,
  onAddReaction,
  onAddComment,
  onReportComment
}) => {
  const toast = useToast();
  const [reacted, setReacted] = useState<ReactionType[]>(() => readReacted()[culte.id] || []);
  const [playing, setPlaying] = useState(false);
  const [showAudio, setShowAudio] = useState(true);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [check, setCheck] = useState('');
  const [hp, setHp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [reportedIds, setReportedIds] = useState<string[]>([]);

  const safeVideo = culte.videoUrl ? sanitizeUrl(toSafeYoutubeEmbed(culte.videoUrl), false) : '';
  const safeAudio = culte.audioUrl ? sanitizeUrl(culte.audioUrl, false) : '';
  const isDirectVideo = isDirectVideoUrl(safeVideo);

  const react = (type: ReactionType) => {
    if (reacted.includes(type)) return;
    const next = [...reacted, type];
    setReacted(next);
    try {
      const all = readReacted();
      all[culte.id] = next;
      localStorage.setItem(REACTED_KEY, JSON.stringify(all));
    } catch {}
    onAddReaction(culte.id, type);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (hp) return;
    if (!name.trim() || !text.trim()) {
      setError('Indiquez un pseudonyme et votre message.');
      return;
    }
    if (check.trim() !== '4' && check.trim().toLowerCase() !== 'quatre') {
      setError('Réponse de vérification incorrecte : il y a 4 évangiles.');
      return;
    }
    onAddComment(culte.id, name.trim(), text.trim());
    setText('');
    setCheck('');
    toast.show('Commentaire publié');
  };

  const keyPoints = (culte.keyPoints || []).map((p) => p.replace(/^\s*\d+[.)]\s*/, '')).filter(Boolean);
  const docs = (culte.documents || []).filter((d) => !!sanitizeUrl(d.downloadUrl));
  const photos = (culte.photos || []).map((p) => sanitizeUrl(p)).filter(Boolean);
  const extraMediaItems = (culte.mediaItems || []).filter(
    (m) =>
      sanitizeUrl(m.url) &&
      m.url !== safeVideo &&
      m.url !== safeAudio &&
      !(m.type === 'photo' && photos.includes(sanitizeUrl(m.url)))
  );

  const sections = [
    { id: 'message', label: 'Message', show: !!(culte.scriptureRef || culte.sermonSummary || keyPoints.length) },
    { id: 'deroulement', label: 'Déroulement', show: (culte.liturgy || []).length > 0 },
    { id: 'photos', label: `Photos (${photos.length})`, show: photos.length > 0 },
    { id: 'medias-supp', label: `Vidéos & Audios (${extraMediaItems.length})`, show: extraMediaItems.length > 0 },
    { id: 'documents', label: `Documents (${docs.length})`, show: docs.length > 0 },
    { id: 'commentaires', label: `Commentaires (${culte.comments.length})`, show: true }
  ].filter((s) => s.show);

  const reactions: { type: ReactionType; label: string; icon: React.ReactNode }[] = [
    { type: 'likes', label: 'J’aime', icon: <ThumbsUp className="h-4 w-4" aria-hidden="true" /> },
    { type: 'hearts', label: 'Cœur', icon: <Heart className="h-4 w-4" aria-hidden="true" /> },
    { type: 'prayers', label: 'Je prie', icon: <span aria-hidden="true">🙏</span> }
  ];

  return (
    <div>
      <BackBar backLabel="Cultes" onBack={onBack} onShare={() => onOpenShare(culte.title, culte.sermonSummary)} />

      <div className="page max-w-3xl py-6 sm:py-10">
        <Meta
          items={[
            <span className="font-semibold text-church-blue">
              {CULTE_TYPE_LABELS[inferCulteServiceType(culte)]}
              {culte.eventLabel ? ` · ${culte.eventLabel}` : ''}
            </span>,
            formatDate(culte.date),
            culte.time
          ]}
        />
        <h1 className="mt-2 text-[2rem] leading-tight sm:text-[2.5rem]">{culte.title}</h1>
        {culte.subtitle && <p className="mt-2 text-[17px] text-church-muted">{culte.subtitle}</p>}

        {(culte.preacher || culte.moderator) && (
          <dl className="mt-5 grid grid-cols-1 gap-3 border-y border-church-line py-4 text-[15px] sm:grid-cols-2">
            {culte.preacher && (
              <div>
                <dt className="text-sm text-church-muted">Prédicateur</dt>
                <dd className="font-semibold text-church-navy">{culte.preacher}</dd>
              </div>
            )}
            {culte.moderator && (
              <div>
                <dt className="text-sm text-church-muted">Modérateur</dt>
                <dd className="font-semibold text-church-navy">{culte.moderator}</dd>
              </div>
            )}
          </dl>
        )}

        {/* Vidéo : Afficher ou Télécharger */}
        <div className="mt-6 overflow-hidden rounded-2xl bg-church-navy shadow-xs">
          {culte.hasVideo && safeVideo && playing ? (
            isDirectVideo ? (
              <video controls autoPlay src={safeVideo} className="aspect-video w-full bg-black object-contain" />
            ) : (
              <iframe
                title={`Vidéo — ${culte.title}`}
                src={`${safeVideo}${safeVideo.includes('?') ? '&' : '?'}autoplay=1`}
                className="aspect-video w-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )
          ) : (
            <div className="relative">
              <img src={sanitizeUrl(culte.coverImage) || HERO_IMAGE} alt={culte.title} className="aspect-video w-full object-cover" />
              {culte.hasVideo && safeVideo && (
                <button
                  onClick={() => setPlaying(true)}
                  className="absolute inset-0 flex items-center justify-center bg-church-navy/30 transition-colors hover:bg-church-navy/40"
                  aria-label="Afficher et lire la vidéo"
                >
                  <span className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 font-semibold text-church-navy shadow-md">
                    <Play className="h-5 w-5 fill-church-navy" aria-hidden="true" />
                    Afficher la vidéo{culte.videoDuration ? ` (${culte.videoDuration})` : ''}
                  </span>
                </button>
              )}
            </div>
          )}

          {culte.hasVideo && safeVideo && (
            <div className="flex flex-wrap items-center justify-between gap-2 bg-white px-4 py-3 border-t border-church-line">
              <span className="text-xs font-medium text-church-muted">
                Vidéo du culte{culte.videoDuration ? ` · ${culte.videoDuration}` : ''}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPlaying((p) => !p)}
                  className="btn-secondary min-h-[38px] px-3 text-xs"
                >
                  <Eye className="h-3.5 w-3.5 text-church-blue" aria-hidden="true" />
                  {playing ? 'Masquer la vidéo' : 'Afficher la vidéo'}
                </button>
                {isDirectVideo ? (
                  <a
                    href={buildDownloadUrl(safeVideo, `${culte.title}-video`)}
                    download
                    className="btn-primary min-h-[38px] px-3 text-xs"
                  >
                    <Download className="h-3.5 w-3.5" aria-hidden="true" />
                    Télécharger
                  </a>
                ) : (
                  <a
                    href={safeVideo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary min-h-[38px] px-3 text-xs"
                  >
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    Ouvrir le lien
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Audio : Afficher / Écouter ou Télécharger */}
        {safeAudio && (
          <div className="surface mt-4 p-4 sm:p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="flex items-center gap-2 font-semibold text-church-navy">
                <Headphones className="h-5 w-5 text-church-blue" aria-hidden="true" />
                Audio de la prédication
                {culte.audioDuration && <span className="font-normal text-church-muted tabular-nums">· {culte.audioDuration}</span>}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAudio((s) => !s)}
                  className="btn-secondary min-h-[38px] px-3 text-xs"
                >
                  <Eye className="h-3.5 w-3.5 text-church-blue" aria-hidden="true" />
                  {showAudio ? 'Masquer le lecteur' : 'Afficher / Écouter'}
                </button>
                <a
                  href={buildDownloadUrl(safeAudio, `${culte.title}-audio`)}
                  download
                  className="btn-primary min-h-[38px] px-3 text-xs"
                >
                  <Download className="h-3.5 w-3.5" aria-hidden="true" />
                  Télécharger l’audio
                </a>
              </div>
            </div>
            {showAudio && (
              <audio controls preload="none" src={safeAudio} className="w-full">
                Votre navigateur ne lit pas l’audio.
              </audio>
            )}
          </div>
        )}

        {/* Réactions */}
        <div className="mt-6 flex flex-wrap gap-2" aria-label="Réactions">
          {reactions.map((r) => {
            const done = reacted.includes(r.type);
            return (
              <button
                key={r.type}
                onClick={() => react(r.type)}
                aria-pressed={done}
                className={done ? 'chip-active' : 'chip'}
              >
                {r.icon} {r.label} <span className={done ? 'text-white/80 tabular-nums' : 'text-church-muted tabular-nums'}>{culte.reactions[r.type]}</span>
              </button>
            );
          })}
        </div>

        {/* Sommaire */}
        {sections.length > 2 && (
          <nav aria-label="Sommaire" className="sticky top-14 sm:top-16 z-30 mt-8 flex flex-wrap gap-2 border-b border-church-line bg-church-light/95 py-3 backdrop-blur-sm">
            {sections.map((s) => (
              <a key={s.id} href={`#${s.id}`} className="chip">
                {s.label}
              </a>
            ))}
          </nav>
        )}

        {/* Message */}
        {sections.some((s) => s.id === 'message') && (
          <section className="mt-8">
            <BlockTitle id="message">Le message</BlockTitle>
            {culte.scriptureRef && (
              <figure className="surface p-5 sm:p-6">
                <figcaption className="text-sm font-semibold text-church-blue">{culte.scriptureRef}</figcaption>
                {culte.scripturePassage && (
                  <blockquote className="mt-2 font-serif text-lg italic leading-relaxed text-church-navy">
                    {culte.scripturePassage}
                  </blockquote>
                )}
              </figure>
            )}
            {culte.sermonSummary && <p className="mt-5 text-[17px] leading-relaxed">{culte.sermonSummary}</p>}
            {keyPoints.length > 0 && (
              <>
                <h3 className="mt-6 font-sans text-base font-semibold">Points essentiels à retenir</h3>
                <ol className="mt-3 space-y-3">
                  {keyPoints.map((p, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-church-tint text-sm font-semibold text-church-blue tabular-nums">
                        {i + 1}
                      </span>
                      <span className="pt-0.5">{p}</span>
                    </li>
                  ))}
                </ol>
              </>
            )}
          </section>
        )}

        {/* Déroulement */}
        {(culte.liturgy || []).length > 0 && (
          <section className="mt-10">
            <BlockTitle id="deroulement">Déroulement du culte</BlockTitle>
            <ol className="surface divide-y divide-church-line overflow-hidden">
              {culte.liturgy.map((step, i) => (
                <li key={i} className="flex gap-4 p-4">
                  <span className="w-16 shrink-0 font-semibold text-church-navy tabular-nums">{step.time || `${i + 1}.`}</span>
                  <span>
                    <span className="block font-semibold text-church-navy">{step.title}</span>
                    {step.leader && <span className="block text-sm text-church-muted">{step.leader}</span>}
                    {step.description && <span className="mt-1 block text-[15px]">{step.description}</span>}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Photos */}
        {photos.length > 0 && (
          <section className="mt-10">
            <BlockTitle id="photos">Photos</BlockTitle>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {photos.map((img, i) => (
                <div key={i} className="group relative overflow-hidden rounded-xl border border-church-line bg-church-navy">
                  <button
                    type="button"
                    onClick={() => setLightbox(i)}
                    className="block w-full"
                    aria-label={`Afficher la photo ${i + 1}`}
                  >
                    <img src={img} alt="" className="aspect-[4/3] w-full object-cover transition-transform duration-200 group-hover:scale-105" loading="lazy" />
                  </button>
                  <a
                    href={buildDownloadUrl(img, `${culte.title}-photo-${i + 1}`)}
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

        {/* Médias complémentaires & Documents : Afficher ou Télécharger */}
        {(extraMediaItems.length > 0 || docs.length > 0) && (
          <div id={extraMediaItems.length > 0 ? 'medias-supp' : 'documents'} className="mt-10">
            <div id="documents">
              <MediaViewerSection
                title="Vidéos & Audios associés"
                mediaItems={extraMediaItems}
                documents={docs}
                contextTitle={culte.title}
              />
            </div>
          </div>
        )}

        {/* Commentaires */}
        <section className="mt-10">
          <BlockTitle id="commentaires">Commentaires</BlockTitle>
          {culte.comments.length === 0 ? (
            <p className="text-church-muted">Aucun commentaire pour l’instant. Soyez le premier à laisser un mot.</p>
          ) : (
            <ul className="space-y-3">
              {culte.comments.map((c) => {
                const reported = c.reported || reportedIds.includes(c.id);
                return (
                  <li key={c.id} className="surface p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-church-navy">{c.authorName}</span>
                      <span className="text-sm text-church-muted">{c.date}</span>
                    </div>
                    <p className="mt-1">{c.text}</p>
                    <button
                      onClick={() => {
                        if (reported) return;
                        onReportComment(c.id);
                        setReportedIds((x) => [...x, c.id]);
                        toast.show('Commentaire signalé aux administrateurs');
                      }}
                      disabled={reported}
                      className="mt-2 inline-flex items-center gap-1 text-sm text-church-muted hover:text-[#B42318] disabled:hover:text-church-muted"
                    >
                      <Flag className="h-3.5 w-3.5" aria-hidden="true" /> {reported ? 'Signalé' : 'Signaler'}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <form onSubmit={submit} className="surface mt-5 space-y-3 p-5" noValidate>
            <h3 className="font-sans text-base font-semibold">Laisser un commentaire</h3>
            <p className="text-sm text-church-muted">Pas besoin de compte. Votre pseudonyme sera affiché.</p>
            <input
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={hp}
              onChange={(e) => setHp(e.target.value)}
              className="hidden"
              aria-hidden="true"
            />
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Pseudonyme</span>
              <input value={name} onChange={(e) => setName(e.target.value)} className="field" maxLength={40} autoComplete="nickname" />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Message</span>
              <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} maxLength={800} className="field min-h-[88px] py-2.5" />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Vérification : combien y a-t-il d’évangiles ?</span>
              <input value={check} onChange={(e) => setCheck(e.target.value)} inputMode="numeric" className="field w-28" />
            </label>
            {error && <p className="text-sm font-medium text-[#B42318]">{error}</p>}
            <button type="submit" className="btn-primary w-full sm:w-auto">
              Publier le commentaire
            </button>
          </form>
        </section>
      </div>

      {lightbox !== null && (
        <Lightbox
          items={photos.map((url) => ({ type: 'photo' as const, url }))}
          index={lightbox}
          onChange={setLightbox}
          onClose={() => setLightbox(null)}
        />
      )}

      {toast.node}
    </div>
  );
};
