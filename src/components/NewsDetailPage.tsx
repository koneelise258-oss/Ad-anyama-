import React, { useState } from 'react';
import { NewsItem } from '../types';
import { Share2, ThumbsUp, MessageCircle, Image as ImageIcon } from 'lucide-react';
import { BackBar, formatDate, Lightbox, useToast } from './ui';

interface NewsDetailPageProps {
  newsItem: NewsItem;
  onBack: () => void;
  onOpenShare: (title: string, summary: string) => void;
  onAddLike?: (newsId: string) => void;
  onAddComment?: (newsId: string, authorName: string, text: string) => void;
}

export const NewsDetailPage: React.FC<NewsDetailPageProps> = ({
  newsItem,
  onBack,
  onOpenShare,
  onAddLike,
  onAddComment
}) => {
  const toast = useToast();
  const official = newsItem.category === 'Communiqué officiel';
  const share = () => onOpenShare(newsItem.title, newsItem.summary);

  const [hasLiked, setHasLiked] = useState(() => {
    try {
      return localStorage.getItem(`eeadci_news_liked_${newsItem.id}`) === 'true';
    } catch {
      return false;
    }
  });

  const [isPhotoZoomed, setIsPhotoZoomed] = useState(false);
  const [authorName, setAuthorName] = useState('');
  const [commentText, setCommentText] = useState('');
  const [mathCheck, setMathCheck] = useState('');
  const [commentError, setCommentError] = useState<string | null>(null);

  const handleLike = () => {
    if (hasLiked) {
      toast.show('Vous aimez déjà cette actualité');
      return;
    }
    setHasLiked(true);
    try {
      localStorage.setItem(`eeadci_news_liked_${newsItem.id}`, 'true');
    } catch {}
    if (onAddLike) {
      onAddLike(newsItem.id);
      toast.show('Merci pour votre réaction !');
    }
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCommentError(null);
    if (!authorName.trim() || !commentText.trim()) {
      setCommentError('Veuillez indiquer votre nom et votre commentaire.');
      return;
    }
    if (mathCheck.trim() !== '4' && mathCheck.trim().toLowerCase() !== 'quatre') {
      setCommentError('Réponse de vérification : il y a 4 évangiles.');
      return;
    }

    if (onAddComment) {
      onAddComment(newsItem.id, authorName.trim(), commentText.trim());
      setCommentText('');
      setMathCheck('');
      toast.show('Votre commentaire a été publié automatiquement !');
    }
  };

  const commentsList = newsItem.comments || [];

  return (
    <div>
      <BackBar backLabel="Actualités" onBack={onBack} onShare={share} />

      <article className="page max-w-3xl py-6 sm:py-10 space-y-6">
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <span className={official ? 'font-semibold text-church-blue' : 'text-church-muted'}>
            {newsItem.category}
          </span>
          <span className="text-church-muted">{formatDate(newsItem.date)}</span>
          {newsItem.isUrgent && <span className="font-semibold text-[#B42318]">Important</span>}
          {newsItem.isDemo && <span className="demo-tag">Démonstration</span>}
        </p>

        <h1 className="mt-2 text-[2rem] leading-tight sm:text-[2.6rem] font-serif text-church-navy">
          {newsItem.title}
        </h1>

        {(newsItem.author || newsItem.authorRole) && (
          <p className="border-b border-church-line pb-4 text-[15px] text-church-muted">
            Publié par <span className="font-semibold text-church-navy">{newsItem.author}</span>
            {newsItem.authorRole && <>, {newsItem.authorRole}</>}
          </p>
        )}

        {newsItem.coverImage && (
          <div className="relative group overflow-hidden rounded-lg bg-church-navy">
            <img
              src={newsItem.coverImage}
              alt=""
              className="w-full aspect-video object-cover transition-opacity group-hover:opacity-95 cursor-pointer"
              onClick={() => setIsPhotoZoomed(true)}
            />
            <button
              onClick={() => setIsPhotoZoomed(true)}
              className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded bg-white px-2.5 py-1 text-xs font-semibold text-church-navy shadow-xs"
            >
              <ImageIcon className="h-3.5 w-3.5 text-church-blue" />
              Agrandir la photo
            </button>
          </div>
        )}

        {newsItem.summary && (
          <p className="font-serif text-xl leading-relaxed text-church-navy">
            {newsItem.summary}
          </p>
        )}

        {newsItem.fullContent && (
          <div className="whitespace-pre-line text-[17px] leading-relaxed text-church-dark">
            {newsItem.fullContent}
          </div>
        )}

        {/* Actions : Like et Partage */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-church-line pt-6">
          <button
            onClick={handleLike}
            className={hasLiked ? 'btn-secondary border-church-blue text-church-blue' : 'btn-secondary'}
          >
            <ThumbsUp className={`h-4 w-4 text-church-blue ${hasLiked ? 'fill-church-blue' : ''}`} />
            <span>J’aime ce communiqué {newsItem.likes > 0 ? `(${newsItem.likes})` : ''}</span>
          </button>

          <button onClick={share} className="btn-secondary">
            <Share2 className="h-4 w-4 text-church-blue" aria-hidden="true" />
            <span>Partager cette information</span>
          </button>
        </div>

        {/* Section Commentaires */}
        <section className="surface p-6 sm:p-7 space-y-6 mt-8">
          <div className="flex items-center justify-between pb-3 border-b border-church-line">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-church-blue" />
              <h2 className="text-lg font-serif font-semibold text-church-navy">
                Commentaires ({commentsList.length})
              </h2>
            </div>
            <span className="text-xs text-church-muted">Publication automatique</span>
          </div>

          {/* Formulaire de commentaire */}
          <form onSubmit={handleCommentSubmit} className="space-y-3 bg-church-light p-4 rounded-md border border-church-line">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-church-navy">
              Ajouter un commentaire ou une question
            </h3>

            {commentError && (
              <p className="rounded border border-red-200 bg-red-50 p-2 text-xs text-red-700">
                {commentError}
              </p>
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
                  placeholder="Ex : Sœur Marie K."
                  className="field text-sm"
                  maxLength={50}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-church-muted mb-1">
                  Vérification : Combien y a-t-il d'évangiles ?
                </label>
                <input
                  type="text"
                  value={mathCheck}
                  onChange={(e) => setMathCheck(e.target.value)}
                  placeholder="Ex : 4"
                  className="field text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-church-muted mb-1">
                Votre message :
              </label>
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Ex : Merci pour ce communiqué bien reçu..."
                rows={3}
                className="field min-h-[80px] py-2 text-sm"
                maxLength={400}
              />
            </div>

            <div className="flex justify-end">
              <button type="submit" className="btn-primary text-xs">
                Publier mon commentaire
              </button>
            </div>
          </form>

          {/* Liste des commentaires */}
          {commentsList.length > 0 ? (
            <div className="space-y-3">
              {commentsList.map((comm) => (
                <div key={comm.id} className="surface p-4 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-church-navy">{comm.authorName}</span>
                    <span className="text-church-muted">{comm.date}</span>
                  </div>
                  <p className="text-sm text-church-dark leading-relaxed">
                    {comm.text}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-4 text-sm text-church-muted italic">
              Aucun commentaire pour l'instant. Laissez vos réflexions ou encouragements !
            </p>
          )}
        </section>
      </article>

      {/* Lightbox pour la photo agrandie */}
      {isPhotoZoomed && newsItem.coverImage && (
        <Lightbox
          items={[{ type: 'photo', url: newsItem.coverImage, caption: newsItem.title }]}
          index={0}
          onClose={() => setIsPhotoZoomed(false)}
          onChange={() => {}}
        />
      )}

      {toast.node}
    </div>
  );
};
