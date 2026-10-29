import React, { useState } from 'react';
import { EventItem, ItemComment } from '../types';
import { Clock, MapPin, User, CalendarPlus, Check, ThumbsUp, MessageCircle, BarChart3, CheckCircle2, Sparkles, Image as ImageIcon } from 'lucide-react';
import { BackBar, BlockTitle, DateBlock, Lightbox, useToast } from './ui';
import { canAddEventToCalendar, downloadEvent } from '../calendar';

interface EventDetailPageProps {
  event: EventItem;
  onBack: () => void;
  onToggleRegister: (eventId: string) => void;
  onOpenShare: (title: string, summary: string) => void;
  onAddLike?: (eventId: string) => void;
  onAddComment?: (eventId: string, authorName: string, text: string) => void;
  onVotePoll?: (eventId: string, optionId: string) => void;
}

const POLL_KEY_PREFIX = 'eeadci_event_poll_voted_';

export const EventDetailPage: React.FC<EventDetailPageProps> = ({
  event,
  onBack,
  onToggleRegister,
  onOpenShare,
  onAddLike,
  onAddComment,
  onVotePoll
}) => {
  const toast = useToast();
  const canCalendar = canAddEventToCalendar(event.date, event.time);

  // Likes & Poll state stored in localStorage per device
  const [hasLiked, setHasLiked] = useState<boolean>(() => {
    try {
      return localStorage.getItem(`eeadci_event_liked_${event.id}`) === 'true';
    } catch {
      return false;
    }
  });

  const [votedOptionId, setVotedOptionId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(`${POLL_KEY_PREFIX}${event.id}`) || null;
    } catch {
      return null;
    }
  });

  const [isPosterZoomed, setIsPosterZoomed] = useState(false);

  // Comment Form state
  const [authorName, setAuthorName] = useState('');
  const [commentText, setCommentText] = useState('');
  const [mathCheck, setMathCheck] = useState('');
  const [commentError, setCommentError] = useState<string | null>(null);

  const toggle = () => {
    onToggleRegister(event.id);
    toast.show(event.isRegistered ? 'Participation retirée' : 'Participation enregistrée avec succès !');
  };

  const handleLike = () => {
    if (hasLiked) {
      toast.show('Vous aimez déjà cet événement');
      return;
    }
    setHasLiked(true);
    try {
      localStorage.setItem(`eeadci_event_liked_${event.id}`, 'true');
    } catch {}
    if (onAddLike) {
      onAddLike(event.id);
      toast.show('Merci pour vos encouragements !');
    }
  };

  const handleVote = (optionId: string) => {
    if (votedOptionId) {
      toast.show('Vous avez déjà voté pour ce sondage');
      return;
    }
    setVotedOptionId(optionId);
    try {
      localStorage.setItem(`${POLL_KEY_PREFIX}${event.id}`, optionId);
    } catch {}
    if (onVotePoll) {
      onVotePoll(event.id, optionId);
      toast.show('Votre réponse au sondage a été enregistrée !');
    }
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCommentError(null);
    if (!authorName.trim() || !commentText.trim()) {
      setCommentError('Veuillez indiquer votre nom et votre message.');
      return;
    }
    if (mathCheck.trim() !== '4' && mathCheck.trim().toLowerCase() !== 'quatre') {
      setCommentError('Réponse de vérification : il y a 4 évangiles.');
      return;
    }

    if (onAddComment) {
      onAddComment(event.id, authorName.trim(), commentText.trim());
      setCommentText('');
      setMathCheck('');
      toast.show('Votre commentaire est publié automatiquement !');
    }
  };

  const poll = event.poll || {
    question: 'Serez-vous présent(e) à ce rassemblement ?',
    options: [
      { id: 'yes', label: 'Oui, je serai présent(e) au temple', votes: 12 },
      { id: 'online', label: 'Je suivrai en prière / en ligne', votes: 5 },
      { id: 'no', label: 'Malheureusement indisponible', votes: 2 }
    ],
    totalVotes: 19
  };

  const totalVotes = Math.max(poll.totalVotes || 0, poll.options.reduce((acc, curr) => acc + curr.votes, 0));
  const commentsList = event.comments || [];

  return (
    <div>
      <BackBar
        backLabel="Événements"
        onBack={onBack}
        onShare={() => onOpenShare(event.title, event.description)}
      />

      <div className="page max-w-3xl py-6 sm:py-10 space-y-8">
        {/* En-tête titre & catégorie */}
        <div className="flex items-start gap-4">
          <DateBlock date={event.date} className="mt-1" />
          <div className="min-w-0">
            <p className="text-sm">
              <span className="font-semibold text-church-blue uppercase tracking-wider text-xs">
                {event.category}
              </span>
              {event.isDemo && <span className="demo-tag ml-2">Démonstration</span>}
            </p>
            <h1 className="mt-1 text-[2rem] leading-tight sm:text-[2.5rem] font-serif text-church-navy">
              {event.title}
            </h1>
          </div>
        </div>

        {/* Affiche Officielle de l’événement */}
        <div className="relative group overflow-hidden rounded-2xl border border-church-line bg-church-navy">
          <img
            src={event.coverImage}
            alt={`Affiche de l'événement ${event.title}`}
            className="w-full aspect-[16/9] object-cover transition-transform duration-300 group-hover:scale-102 cursor-pointer"
            onClick={() => setIsPosterZoomed(true)}
          />
          <div className="absolute top-3 left-3 bg-church-navy/85 backdrop-blur-xs text-white text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1.5 shadow-sm">
            <ImageIcon className="w-3.5 h-3.5 text-blue-300" />
            <span>Affiche officielle</span>
          </div>
          <button
            onClick={() => setIsPosterZoomed(true)}
            className="absolute bottom-3 right-3 bg-white/90 hover:bg-white text-church-navy text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm transition-all"
          >
            Agrandir l’affiche
          </button>
        </div>

        {/* Informations pratiques */}
        <dl className="surface divide-y divide-church-line rounded-xl border border-church-line">
          <div className="flex gap-3 p-4">
            <Clock className="mt-0.5 h-5 w-5 shrink-0 text-church-blue" aria-hidden="true" />
            <div>
              <dt className="text-sm text-church-muted">Quand</dt>
              <dd className="font-semibold text-church-navy">{event.date}</dd>
              {event.time && <dd className="text-church-dark">{event.time}</dd>}
            </div>
          </div>
          {event.location && (
            <div className="flex gap-3 p-4">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-church-blue" aria-hidden="true" />
              <div>
                <dt className="text-sm text-church-muted">Où</dt>
                <dd className="font-semibold text-church-navy">{event.location}</dd>
              </div>
            </div>
          )}
          {event.speaker && (
            <div className="flex gap-3 p-4">
              <User className="mt-0.5 h-5 w-5 shrink-0 text-church-blue" aria-hidden="true" />
              <div>
                <dt className="text-sm text-church-muted">Intervenants / Responsables</dt>
                <dd className="font-semibold text-church-navy">{event.speaker}</dd>
              </div>
            </div>
          )}
        </dl>

        {/* Actions principales & Like */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={toggle}
            aria-pressed={!!event.isRegistered}
            className={
              event.isRegistered
                ? 'btn-secondary flex-1 border-emerald-600 text-emerald-700 bg-emerald-50/50'
                : 'btn-primary flex-1'
            }
          >
            {event.isRegistered ? (
              <>
                <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" /> Je participe (inscrit)
              </>
            ) : (
              'Je participe à ce rassemblement'
            )}
          </button>

          <button
            onClick={handleLike}
            className={`btn-secondary flex-1 flex items-center justify-center gap-2 ${
              hasLiked ? 'text-church-blue font-bold border-church-blue bg-blue-50/40' : ''
            }`}
          >
            <ThumbsUp className={`h-4 w-4 ${hasLiked ? 'text-church-blue fill-church-blue' : ''}`} />
            <span>J’aime {event.likes > 0 ? `(${event.likes})` : ''}</span>
          </button>

          {canCalendar && (
            <button
              onClick={() => {
                if (downloadEvent(event)) toast.show('Ouvrez le fichier pour l’ajouter à votre agenda');
              }}
              className="btn-secondary flex-1"
            >
              <CalendarPlus className="h-4 w-4 text-church-blue" aria-hidden="true" /> Ajouter à l’agenda
            </button>
          )}
        </div>

        {event.attendeesCount > 0 && (
          <p className="text-sm text-church-muted">
            {event.attendeesCount} personnes ont indiqué leur participation.
          </p>
        )}

        {/* Programme & Description */}
        {event.description && (
          <section className="surface p-6 rounded-2xl border border-church-line space-y-3">
            <BlockTitle>Programme & Présentation</BlockTitle>
            <p className="whitespace-pre-line text-[16px] leading-relaxed text-church-dark">
              {event.description}
            </p>
          </section>
        )}

        {/* Sondage interactif de présence */}
        <section className="surface p-6 rounded-2xl border border-church-line space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-church-blue" />
              <h2 className="text-lg font-bold text-church-navy">Sondage de présence</h2>
            </div>
            <span className="text-xs text-church-muted font-medium font-mono">
              {totalVotes} vote{totalVotes > 1 ? 's' : ''}
            </span>
          </div>

          <p className="text-sm text-church-dark font-medium">
            {poll.question}
          </p>

          <div className="space-y-2.5 pt-1">
            {poll.options.map((opt) => {
              const isSelected = votedOptionId === opt.id;
              const percentage = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
              return (
                <button
                  key={opt.id}
                  onClick={() => handleVote(opt.id)}
                  disabled={!!votedOptionId}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all relative overflow-hidden flex flex-col justify-between gap-1.5 ${
                    isSelected
                      ? 'border-church-blue bg-blue-50/70 shadow-xs'
                      : 'border-church-line bg-white hover:border-church-blue/60'
                  }`}
                >
                  <div
                    className="absolute inset-y-0 left-0 bg-church-blue/10 pointer-events-none transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                  <div className="relative z-10 flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-semibold text-church-navy flex items-center gap-2">
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-church-blue" />}
                      {opt.label}
                    </span>
                    <span className="text-xs font-mono font-bold text-church-blue">
                      {percentage}% ({opt.votes})
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {votedOptionId ? (
            <p className="text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Votre vote a bien été pris en compte. Merci de votre contribution fraternelle !</span>
            </p>
          ) : (
            <p className="text-xs text-church-muted italic">
              Cliquez sur votre réponse pour voter et voir la tendance en direct.
            </p>
          )}
        </section>

        {/* Section Commentaires & Témoignages */}
        <section className="surface p-6 rounded-2xl border border-church-line space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-church-line">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-church-blue" />
              <h2 className="text-lg font-bold text-church-navy">
                Commentaires & Présence ({commentsList.length})
              </h2>
            </div>
            <span className="text-xs text-church-muted">Publication automatique</span>
          </div>

          {/* Formulaire d'ajout de commentaire */}
          <form onSubmit={handleCommentSubmit} className="space-y-3 bg-[#F4F6F9] p-4 rounded-xl border border-church-line">
            <h3 className="text-xs font-bold text-church-navy uppercase tracking-wider">
              Laisser un mot ou annoncer votre présence
            </h3>

            {commentError && (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {commentError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-church-muted mb-1">
                  Votre nom / Frère ou Sœur :
                </label>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="Ex : Frère Jean B."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-church-line bg-white focus:outline-none focus:border-church-blue"
                  maxLength={50}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-church-muted mb-1">
                  Contrôle anti-spam : Combien y a-t-il d'évangiles ?
                </label>
                <input
                  type="text"
                  value={mathCheck}
                  onChange={(e) => setMathCheck(e.target.value)}
                  placeholder="Ex : 4"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-church-line bg-white focus:outline-none focus:border-church-blue"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-church-muted mb-1">
                Votre message / commentaire :
              </label>
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Ex : Je serai présent par la grâce de Dieu avec toute ma famille..."
                rows={3}
                className="w-full px-3 py-2 text-xs rounded-lg border border-church-line bg-white focus:outline-none focus:border-church-blue"
                maxLength={400}
              />
            </div>

            <div className="flex justify-end">
              <button type="submit" className="btn-primary text-xs py-2 px-4">
                Publier mon commentaire
              </button>
            </div>
          </form>

          {/* Liste des commentaires */}
          {commentsList.length > 0 ? (
            <div className="space-y-3">
              {commentsList.map((comm) => (
                <div key={comm.id} className="p-3.5 rounded-xl bg-white border border-church-line space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-church-navy">{comm.authorName}</span>
                    <span className="text-church-muted">{comm.date}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-church-dark leading-relaxed">
                    {comm.text}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-church-muted italic text-center py-4">
              Aucun commentaire pour l'instant. Soyez le premier à laisser un message pour ce programme !
            </p>
          )}
        </section>
      </div>

      {/* Lightbox pour l'affiche agrandie */}
      {isPosterZoomed && (
        <Lightbox
          items={[{ type: 'photo', url: event.coverImage, caption: event.title }]}
          index={0}
          onClose={() => setIsPosterZoomed(false)}
          onChange={() => {}}
        />
      )}

      {toast.node}
    </div>
  );
};

