import React, { useState } from 'react';
import { Culte } from '../types';
import { Play, Download, ThumbsUp, Heart, Flag, Headphones, FileText } from 'lucide-react';
import { BackBar, BlockTitle, Lightbox, Meta, formatDate, useToast } from './ui';

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

/** Réactions déjà données sur cet appareil (évite les doubles clics après rechargement). */
const readReacted = (): Record<string, ReactionType[]> => {
  try {
    return JSON.parse(localStorage.getItem(REACTED_KEY) || '{}');
  } catch {
    return {};
  }
};

const isRealLink = (url?: string) => !!url && url !== '#';

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
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [check, setCheck] = useState('');
  const [hp, setHp] = useState(''); // champ invisible anti-robot
  const [error, setError] = useState<string | null>(null);
  const [reportedIds, setReportedIds] = useState<string[]>([]);

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
    if (hp) return; // robot
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
  const docs = culte.documents || [];
  const photos = culte.photos || [];

  const sections = [
    { id: 'message', label: 'Message', show: !!(culte.scriptureRef || culte.sermonSummary || keyPoints.length) },
    { id: 'deroulement', label: 'Déroulement', show: (culte.liturgy || []).length > 0 },
    { id: 'photos', label: `Photos (${photos.length})`, show: photos.length > 0 },
    { id: 'documents', label: 'Documents', show: docs.length > 0 },
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
        {/* En-tête */}
        <Meta
          items={[
            formatDate(culte.date),
            culte.time,
            culte.isDemo && <span className="demo-tag">Démonstration</span>
          ]}
        />
        <h1 className="mt-2 text-[2rem] leading-tight sm:text-[2.6rem]">{culte.title}</h1>
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

        {/* Vidéo */}
        <div className="-mx-4 mt-6 overflow-hidden bg-church-navy sm:mx-0 sm:rounded-lg">
          {culte.hasVideo && culte.videoUrl && playing ? (
            <iframe
              title={`Vidéo — ${culte.title}`}
              src={`${culte.videoUrl}${culte.videoUrl.includes('?') ? '&' : '?'}autoplay=1`}
              className="aspect-video w-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="relative">
              <img src={culte.coverImage} alt="" className="aspect-video w-full object-cover" />
              {culte.hasVideo && culte.videoUrl && (
                <button
                  onClick={() => setPlaying(true)}
                  className="absolute inset-0 flex items-center justify-center bg-church-navy/30"
                  aria-label="Regarder la vidéo"
                >
                  <span className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 font-semibold text-church-navy">
                    <Play className="h-5 w-5 fill-church-navy" aria-hidden="true" />
                    Regarder{culte.videoDuration ? ` (${culte.videoDuration})` : ''}
                  </span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Audio : vrai lecteur, se charge seulement quand on appuie sur lecture */}
        {culte.audioUrl && (
          <div className="surface mt-4 p-4">
            <p className="mb-2 flex items-center gap-2 font-semibold text-church-navy">
              <Headphones className="h-5 w-5 text-church-blue" aria-hidden="true" />
              Écouter la prédication
              {culte.audioDuration && <span className="font-normal text-church-muted">{culte.audioDuration}</span>}
            </p>
            <audio controls preload="none" src={culte.audioUrl} className="w-full">
              Votre navigateur ne lit pas l’audio.
            </audio>
            <p className="mt-2 text-sm text-church-muted">L’audio consomme moins de données que la vidéo.</p>
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
                {r.icon} {r.label} <span className={done ? 'text-white/80' : 'text-church-muted'}>{culte.reactions[r.type]}</span>
              </button>
            );
          })}
        </div>

        {/* Sommaire : aller directement à une partie */}
        {sections.length > 2 && (
          <nav aria-label="Sommaire" className="no-scrollbar sticky top-16 z-30 -mx-4 mt-8 flex gap-2 overflow-x-auto border-b border-church-line bg-church-light px-4 py-3 sm:mx-0 sm:px-0">
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
              <figure className="rounded-lg border-l-[3px] border-church-blue bg-white p-5">
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
                <h3 className="mt-6 font-sans text-base font-semibold">À retenir</h3>
                <ol className="mt-2 space-y-3">
                  {keyPoints.map((p, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-church-tint text-sm font-semibold text-church-blue">
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
            <ol className="surface divide-y divide-church-line">
              {culte.liturgy.map((step, i) => (
                <li key={i} className="flex gap-4 p-4">
                  <span className="w-14 shrink-0 font-semibold text-church-navy">{step.time || `${i + 1}.`}</span>
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
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {photos.map((img, i) => (
                <button key={i} onClick={() => setLightbox(i)} className="overflow-hidden rounded-md bg-church-navy" aria-label={`Agrandir la photo ${i + 1}`}>
                  <img src={img} alt="" className="aspect-[4/3] w-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Documents */}
        {docs.length > 0 && (
          <section className="mt-10">
            <BlockTitle id="documents">Documents</BlockTitle>
            <ul className="surface divide-y divide-church-line">
              {docs.map((doc, i) => (
                <li key={i} className="flex items-center gap-3 p-4">
                  <FileText className="h-6 w-6 shrink-0 text-church-blue" aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-church-navy">{doc.title}</span>
                    <span className="text-sm text-church-muted">
                      {doc.type.toUpperCase()}
                      {doc.fileSize ? `, ${doc.fileSize}` : ''}
                    </span>
                  </span>
                  {isRealLink(doc.downloadUrl) ? (
                    <a href={doc.downloadUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary px-3" download>
                      <Download className="h-4 w-4" aria-hidden="true" />
                      <span className="hidden sm:inline">Télécharger</span>
                    </a>
                  ) : (
                    <span className="text-sm text-church-muted">Bientôt disponible</span>
                  )}
                </li>
              ))}
            </ul>
          </section>
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

          <form onSubmit={submit} className="surface mt-5 space-y-3 p-4 sm:p-5" noValidate>
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
              <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} maxLength={800} className="field py-2.5" />
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
