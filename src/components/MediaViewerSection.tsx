import React, { useState } from 'react';
import type { CulteDocument, MediaItem } from '../types';
import { buildDownloadUrl, isDirectVideoUrl, sanitizeUrl, toSafeYoutubeEmbed } from '../utils/security';
import { Play, Download, Eye, Headphones, FileText, Film, ExternalLink, X } from 'lucide-react';
import { BlockTitle, Lightbox } from './ui';

interface MediaViewerSectionProps {
  title?: string;
  videoUrl?: string;
  audioUrl?: string;
  mediaItems?: MediaItem[];
  documents?: CulteDocument[];
  contextTitle?: string;
}

export const MediaViewerSection: React.FC<MediaViewerSectionProps> = ({
  title = 'Médias & Documents',
  videoUrl,
  audioUrl,
  mediaItems = [],
  documents = [],
  contextTitle = 'media'
}) => {
  const [activeVideoIds, setActiveVideoIds] = useState<Record<string, boolean>>({});
  const [fallbackVideoIds, setFallbackVideoIds] = useState<Record<string, boolean>>({});
  const [activeAudioIds, setActiveAudioIds] = useState<Record<string, boolean>>({});
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [previewDoc, setPreviewDoc] = useState<CulteDocument | null>(null);

  const safePrimaryVideo = videoUrl ? sanitizeUrl(toSafeYoutubeEmbed(videoUrl), false) : '';
  const safePrimaryAudio = audioUrl ? sanitizeUrl(audioUrl, false) : '';

  const validMedia = mediaItems
    .map((m) => ({
      ...m,
      url: sanitizeUrl(m.type === 'video' ? toSafeYoutubeEmbed(m.url) : m.url),
      fallbackUrl: m.fallbackUrl ? sanitizeUrl(m.fallbackUrl, false) : undefined
    }))
    .filter((m) => Boolean(m.url));

  const photos = validMedia.filter((m) => m.type === 'photo');
  const videos: MediaItem[] = [
    ...(safePrimaryVideo
      ? [{ id: 'primary-video', type: 'video' as const, url: safePrimaryVideo, caption: contextTitle }]
      : []),
    ...validMedia.filter((m) => m.type === 'video' && m.url !== safePrimaryVideo)
  ];
  const audios: MediaItem[] = [
    ...(safePrimaryAudio
      ? [{ id: 'primary-audio', type: 'audio' as const, url: safePrimaryAudio, caption: contextTitle }]
      : []),
    ...validMedia.filter((m) => m.type === 'audio' && m.url !== safePrimaryAudio)
  ];
  const validDocs = documents.filter((d) => Boolean(sanitizeUrl(d.downloadUrl)));

  if (photos.length === 0 && videos.length === 0 && audios.length === 0 && validDocs.length === 0) {
    return null;
  }

  return (
    <div className="space-y-8">
      {(videos.length > 0 || audios.length > 0 || photos.length > 0) && (
        <section className="space-y-5">
          <BlockTitle>{title}</BlockTitle>

          {/* Vidéos : Afficher ou Télécharger */}
          {videos.length > 0 && (
            <div className="space-y-4">
              {videos.map((vid, idx) => {
                const isShowing = Boolean(activeVideoIds[vid.id] ?? true);
                const useFallbackEmbed = Boolean(fallbackVideoIds[vid.id] && vid.fallbackUrl);
                const activeUrl = useFallbackEmbed && vid.fallbackUrl ? vid.fallbackUrl : vid.url;
                const direct = !useFallbackEmbed && isDirectVideoUrl(activeUrl);
                const dlUrl = buildDownloadUrl(vid.url, vid.caption || `${contextTitle}-video-${idx + 1}`);
                return (
                  <div key={vid.id} className="surface overflow-hidden">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-church-line bg-church-light/60 px-4 py-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <Film className="h-4 w-4 shrink-0 text-church-blue" aria-hidden="true" />
                        <span className="truncate font-semibold text-sm text-church-navy">
                          {vid.caption || `Vidéo ${idx + 1}`}
                        </span>
                        {vid.fileSize && <span className="text-xs text-church-muted tabular-nums">· {vid.fileSize}</span>}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveVideoIds((prev) => ({ ...prev, [vid.id]: !isShowing }))}
                          className="btn-secondary min-h-[38px] px-3 text-xs"
                        >
                          <Eye className="h-3.5 w-3.5 text-church-blue" aria-hidden="true" />
                          {isShowing ? 'Masquer la vidéo' : 'Afficher la vidéo'}
                        </button>
                        {direct ? (
                          <a href={dlUrl} download className="btn-primary min-h-[38px] px-3 text-xs">
                            <Download className="h-3.5 w-3.5" aria-hidden="true" />
                            Télécharger
                          </a>
                        ) : (
                          <a
                            href={activeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-secondary min-h-[38px] px-3 text-xs"
                          >
                            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                            Ouvrir
                          </a>
                        )}
                      </div>
                    </div>
                    {isShowing && (
                      <div className="bg-black">
                        {direct ? (
                          <video
                            controls
                            playsInline
                            preload="metadata"
                            src={activeUrl}
                            onError={() => {
                              if (vid.fallbackUrl) {
                                setFallbackVideoIds((prev) => ({ ...prev, [vid.id]: true }));
                              }
                            }}
                            className="aspect-video w-full object-contain"
                          />
                        ) : (
                          <iframe
                            title={vid.caption || 'Vidéo'}
                            src={activeUrl}
                            className="aspect-video w-full border-0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Audios : Afficher / Écouter ou Télécharger */}
          {audios.length > 0 && (
            <div className="space-y-3">
              {audios.map((aud, idx) => {
                const isShowing = Boolean(activeAudioIds[aud.id] ?? true);
                const dlUrl = buildDownloadUrl(aud.url, aud.caption || `${contextTitle}-audio-${idx + 1}`);
                return (
                  <div key={aud.id} className="surface p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <Headphones className="h-5 w-5 shrink-0 text-church-blue" aria-hidden="true" />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-sm text-church-navy">
                            {aud.caption || `Enregistrement audio ${idx + 1}`}
                          </p>
                          {(aud.duration || aud.fileSize) && (
                            <p className="text-xs text-church-muted tabular-nums">
                              {[aud.duration, aud.fileSize].filter(Boolean).join(' · ')}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveAudioIds((prev) => ({ ...prev, [aud.id]: !isShowing }))}
                          className="btn-secondary min-h-[38px] px-3 text-xs"
                        >
                          <Play className="h-3.5 w-3.5 text-church-blue" aria-hidden="true" />
                          {isShowing ? 'Masquer le lecteur' : 'Afficher / Écouter'}
                        </button>
                        <a href={dlUrl} download className="btn-primary min-h-[38px] px-3 text-xs">
                          <Download className="h-3.5 w-3.5" aria-hidden="true" />
                          Télécharger
                        </a>
                      </div>
                    </div>
                    {isShowing && (
                      <audio controls preload="none" src={aud.url} className="w-full">
                        Votre navigateur ne lit pas l’audio.
                      </audio>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Photos : Afficher en plein écran ou Télécharger */}
          {photos.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {photos.map((img, i) => (
                <div key={img.id || i} className="group relative overflow-hidden rounded-xl border border-church-line bg-church-navy">
                  <button
                    type="button"
                    onClick={() => setLightboxIdx(i)}
                    className="block w-full"
                    aria-label={img.caption || `Afficher la photo ${i + 1}`}
                  >
                    <img
                      src={img.url}
                      alt={img.caption || contextTitle}
                      loading="lazy"
                      className="aspect-[4/3] w-full object-cover transition-transform duration-200 group-hover:scale-105"
                    />
                  </button>
                  <a
                    href={buildDownloadUrl(img.url, img.caption || `photo-${i + 1}`)}
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
          )}
        </section>
      )}

      {/* Documents joints : Afficher ou Télécharger */}
      {validDocs.length > 0 && (
        <section>
          <BlockTitle>Documents associés</BlockTitle>
          <ul className="surface divide-y divide-church-line overflow-hidden">
            {validDocs.map((doc, i) => {
              const safeHref = sanitizeUrl(doc.downloadUrl);
              const dlHref = buildDownloadUrl(safeHref, doc.title);
              const isPdf = doc.type === 'pdf' || doc.mimeType === 'application/pdf' || /\.pdf(\?|$)/i.test(safeHref);
              return (
                <li key={doc.id || i} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <FileText className="h-6 w-6 shrink-0 text-church-blue" aria-hidden="true" />
                    <div className="min-w-0">
                      <span className="block truncate font-medium text-church-navy">{doc.title}</span>
                      <span className="text-sm text-church-muted">
                        {doc.type.toUpperCase()}
                        {doc.fileSize ? `, ${doc.fileSize}` : ''}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {isPdf ? (
                      <button
                        type="button"
                        onClick={() => setPreviewDoc(doc)}
                        className="btn-secondary min-h-[38px] px-3 text-xs"
                      >
                        <Eye className="h-3.5 w-3.5 text-church-blue" aria-hidden="true" />
                        Afficher
                      </button>
                    ) : (
                      <a
                        href={safeHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-secondary min-h-[38px] px-3 text-xs"
                      >
                        <Eye className="h-3.5 w-3.5 text-church-blue" aria-hidden="true" />
                        Afficher
                      </a>
                    )}
                    <a href={dlHref} download className="btn-primary min-h-[38px] px-3 text-xs">
                      <Download className="h-3.5 w-3.5" aria-hidden="true" />
                      Télécharger
                    </a>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {lightboxIdx !== null && (
        <Lightbox
          items={photos.map((p) => ({ type: 'photo' as const, url: p.url, caption: p.caption }))}
          index={lightboxIdx}
          onChange={setLightboxIdx}
          onClose={() => setLightboxIdx(null)}
        />
      )}

      {previewDoc && (
        <div
          className="fixed inset-0 z-[75] flex flex-col bg-black/85 p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={`Aperçu : ${previewDoc.title}`}
        >
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 rounded-t-2xl bg-white px-4 py-3 border-b border-church-line">
            <div className="min-w-0">
              <p className="truncate font-semibold text-church-navy text-sm sm:text-base">{previewDoc.title}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <a
                href={buildDownloadUrl(previewDoc.downloadUrl, previewDoc.title)}
                download
                className="btn-primary min-h-[38px] px-3 text-xs"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                Télécharger
              </a>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="btn-secondary min-h-[38px] px-3 text-xs"
                aria-label="Fermer l’aperçu"
              >
                <X className="h-4 w-4" /> Fermer
              </button>
            </div>
          </div>
          <iframe
            title={previewDoc.title}
            src={sanitizeUrl(previewDoc.downloadUrl)}
            className="mx-auto h-full w-full max-w-5xl flex-1 rounded-b-2xl bg-white"
          />
        </div>
      )}
    </div>
  );
};
