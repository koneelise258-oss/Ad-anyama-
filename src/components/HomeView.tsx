import React, { useState } from 'react';
import {
  Culte,
  EventItem,
  NewsItem,
  AlbumItem,
  DepartmentItem,
  PageView,
  SiteImages,
  HeroContent,
  ChurchSettings
} from '../types';
import { DEFAULT_CHURCH_SETTINGS } from '../mockData';
import { sanitizeUrl } from '../utils/security';
import { CULTE_TYPE_LABELS, inferCulteServiceType, sortCultesByDateDesc } from '../utils/cultes';
import {
  Play,
  Share2,
  ChevronRight,
  Images,
  Bell,
  MapPin,
  Headphones,
  Megaphone,
  Landmark,
  Clock,
  BookOpen
} from 'lucide-react';
import { SectionHead, Meta, DateBlock, formatDate, formatPublishedDateTime } from './ui';

interface HomeViewProps {
  cultes: Culte[];
  events: EventItem[];
  news: NewsItem[];
  albums: AlbumItem[];
  departments: DepartmentItem[];
  siteImages?: SiteImages;
  heroContent?: HeroContent;
  churchSettings?: ChurchSettings;
  onSelectCulte: (culte: Culte) => void;
  onSelectEvent: (event: EventItem) => void;
  onSelectDepartment: (dept: DepartmentItem) => void;
  onSelectAlbum: (album: AlbumItem) => void;
  onSelectNews: (newsItem: NewsItem) => void;
  onNavigate: (page: PageView) => void;
  onOpenNotifications: () => void;
  onOpenShare: (title: string, summary: string, customParam?: string) => void;
  logoUrl?: string | null;
}

export const HomeView: React.FC<HomeViewProps> = ({
  cultes,
  events,
  news,
  albums,
  departments,
  siteImages,
  heroContent,
  churchSettings = DEFAULT_CHURCH_SETTINGS,
  onSelectCulte,
  onSelectEvent,
  onSelectDepartment,
  onSelectAlbum,
  onSelectNews,
  onNavigate,
  onOpenNotifications,
  onOpenShare
}) => {
  const [inlineVideoPlaying, setInlineVideoPlaying] = useState(false);

  const orderedCultes = sortCultesByDateDesc(cultes.filter((c) => c.status === 'publie'));
  const latestCulte = orderedCultes[0] || cultes[0];
  const moreCultes = orderedCultes.filter((c) => c.id !== latestCulte?.id).slice(0, 3);
  const upcomingEvents = events.slice(0, 3);
  const latestNews = news.slice(0, 4);
  const featuredAlbums = albums.slice(0, 4);
  const sections = churchSettings.homeSections || DEFAULT_CHURCH_SETTINGS.homeSections!;

  const safeVideoUrl = latestCulte?.videoUrl ? sanitizeUrl(latestCulte.videoUrl, false) : '';
  const safeAudioUrl = latestCulte?.audioUrl ? sanitizeUrl(latestCulte.audioUrl, false) : '';
  const isDirectVideoFile = /\.(mp4|webm)(\?|$)/i.test(safeVideoUrl) || safeVideoUrl.startsWith('/uploads/');

  return (
    <div className="w-full space-y-8 sm:space-y-11">
      {/* Bannière d'annonce facultative */}
      {churchSettings.announcementBanner?.enabled && churchSettings.announcementBanner.text && (
        <div className="border-b border-church-line bg-church-tint">
          <div className="page flex flex-wrap items-center justify-between gap-2 py-2 text-xs sm:text-sm text-church-navy">
            <div className="flex min-w-0 items-center gap-2 font-medium">
              <Megaphone className="h-4 w-4 shrink-0 text-church-blue" aria-hidden="true" />
              <span className="break-words">{churchSettings.announcementBanner.text}</span>
            </div>
            {churchSettings.announcementBanner.linkPage && (
              <button
                onClick={() => onNavigate(churchSettings.announcementBanner!.linkPage!)}
                className="link shrink-0 text-xs sm:text-sm"
              >
                Voir
              </button>
            )}
          </div>
        </div>
      )}

      {/* 1. Section Hero plein écran (sans bulle, bord à bord) */}
      <section className="relative flex min-h-[calc(100svh-3.5rem)] sm:min-h-[calc(100svh-4rem)] w-full flex-col justify-between overflow-hidden bg-church-navy text-white">
        <div className="absolute inset-0">
          {sanitizeUrl(siteImages?.heroImage) ? (
            <>
              <img
                src={sanitizeUrl(siteImages?.heroImage)}
                alt="Église Évangélique des Assemblées de Dieu d’Anyama"
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover object-center"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-church-navy via-church-navy/75 to-church-navy/40"
              />
            </>
          ) : (
            <div
              aria-hidden="true"
              className="h-full w-full bg-gradient-to-br from-[#0F244A] via-church-navy to-[#244E99]"
            />
          )}
        </div>

        <div className="relative flex-1 flex items-center">
          <div className="page py-12 sm:py-16">
            <div className="max-w-4xl space-y-4">
              <p className="text-xs sm:text-sm font-medium uppercase tracking-[0.2em] text-white/80">
                Côte d’Ivoire
              </p>
              <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-semibold leading-[1.12] tracking-tight text-white">
                Église Évangélique des Assemblées de Dieu
              </h1>
              <div className="h-px w-16 bg-white/35" aria-hidden="true" />
              <p className="font-serif text-lg sm:text-2xl font-normal text-white/90">
                Assemblées de Dieu d’Anyama — Ran-Extension Résidentiel
              </p>
            </div>
          </div>
        </div>

        <div className="relative border-t border-white/15 bg-church-navy/45 backdrop-blur-[2px]">
          <div className="page flex flex-wrap items-center justify-between gap-3 py-4 sm:py-5">
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => (latestCulte ? onSelectCulte(latestCulte) : onNavigate('cultes'))}
                className="btn-primary min-h-[42px] px-4 text-xs sm:text-sm"
              >
                {heroContent?.actionButtonCulte || 'Voir les cultes'}
              </button>
              <button
                onClick={() => onNavigate('evenements')}
                className="btn-on-dark min-h-[42px] px-4 text-xs sm:text-sm"
              >
                {heroContent?.actionButtonEvents || 'Agenda'}
              </button>
            </div>
            <a
              href="#horaires"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-white/85 hover:text-white transition-colors"
            >
              Mardis, Jeudis, Dimanches <ChevronRight className="h-4 w-4 rotate-90" aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>

      {/* 2. Directement après le haut : Nos Cultes — Mardis, Jeudis, Dimanches */}
      {sections.showSchedules && (churchSettings.schedules || []).length > 0 && (
        <section id="horaires" className="page space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-church-line pb-2.5">
            <div>
              <h2 className="font-serif text-lg sm:text-2xl text-church-navy">Nos cultes — Mardis, Jeudis, Dimanches</h2>
              {churchSettings.address && (
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-church-muted">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-church-blue" aria-hidden="true" />
                  <span>{churchSettings.address}</span>
                </p>
              )}
            </div>
            <button onClick={onOpenNotifications} className="link flex shrink-0 items-center gap-1.5 text-xs sm:text-sm">
              <Bell className="h-3.5 w-3.5" aria-hidden="true" /> Rappels
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {churchSettings.schedules.map((s, idx) => (
              <div key={s.id || idx} className="surface flex flex-col justify-between gap-1.5 p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-serif text-base sm:text-lg font-semibold text-church-navy">{s.day}</span>
                  {s.time && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-church-blue tabular-nums">
                      <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                      {s.time}
                    </span>
                  )}
                </div>
                <p className="text-sm text-church-dark leading-snug">{s.name}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 3. Fenêtre Cultes & Prédications (lecture audio/vidéo directe + derniers cultes) */}
      {sections.showLatestCulte && (
        <section className="page space-y-5">
          <SectionHead title="Cultes & Prédications" linkLabel="Tous les cultes" onLink={() => onNavigate('cultes')} />
          {latestCulte ? (
            <>
              <article className="surface grid overflow-hidden md:grid-cols-[1.05fr_1.2fr]">
                <div className="relative bg-church-navy">
                  {latestCulte.hasVideo && safeVideoUrl && inlineVideoPlaying ? (
                    isDirectVideoFile ? (
                      <video controls autoPlay src={safeVideoUrl} className="aspect-video h-full w-full bg-black object-contain" />
                    ) : (
                      <iframe
                        title={`Vidéo — ${latestCulte.title}`}
                        src={`${safeVideoUrl}${safeVideoUrl.includes('?') ? '&' : '?'}autoplay=1`}
                        className="aspect-video h-full w-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    )
                  ) : (
                    <button
                      onClick={() => {
                        if (latestCulte.hasVideo && safeVideoUrl) setInlineVideoPlaying(true);
                        else onSelectCulte(latestCulte);
                      }}
                      className="group relative block h-full w-full"
                      aria-label={latestCulte.hasVideo ? `Lire la vidéo : ${latestCulte.title}` : latestCulte.title}
                    >
                      {sanitizeUrl(latestCulte.coverImage) ? (
                        <img
                          src={sanitizeUrl(latestCulte.coverImage)}
                          alt={latestCulte.title}
                          className="aspect-video h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02] md:aspect-auto"
                        />
                      ) : (
                        <div className="flex aspect-video h-full min-h-[200px] w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-church-navy to-church-blue/90 p-6 text-center text-white md:aspect-auto">
                          <BookOpen className="h-9 w-9 text-white/75" aria-hidden="true" />
                          {latestCulte.scriptureRef && (
                            <span className="font-serif text-sm sm:text-base text-white/90">{latestCulte.scriptureRef}</span>
                          )}
                        </div>
                      )}
                      {latestCulte.hasVideo && safeVideoUrl && (
                        <span className="absolute inset-0 flex items-center justify-center bg-church-navy/25 transition-colors group-hover:bg-church-navy/35">
                          <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-church-navy shadow-md">
                            <Play className="h-4 w-4 fill-church-navy" aria-hidden="true" />
                            Lire la vidéo{latestCulte.videoDuration ? ` (${latestCulte.videoDuration})` : ''}
                          </span>
                        </span>
                      )}
                    </button>
                  )}
                </div>

                <div className="flex min-w-0 flex-col p-4 sm:p-6">
                  <Meta
                    items={[
                      <span className="font-semibold text-church-blue">
                        {CULTE_TYPE_LABELS[inferCulteServiceType(latestCulte)]}
                      </span>,
                      formatDate(latestCulte.date),
                      latestCulte.preacher && <span className="text-church-dark font-medium">{latestCulte.preacher}</span>
                    ]}
                  />
                  <h3 className="mt-2 text-xl sm:text-[1.6rem]">
                    <button onClick={() => onSelectCulte(latestCulte)} className="text-left hover:text-church-blue">
                      {latestCulte.title}
                    </button>
                  </h3>
                  {latestCulte.scriptureRef && (
                    <p className="mt-1.5 font-serif text-sm sm:text-base italic text-church-blue">{latestCulte.scriptureRef}</p>
                  )}
                  {latestCulte.sermonSummary && (
                    <p className="mt-2 line-clamp-2 text-sm sm:text-[15px] text-church-dark">{latestCulte.sermonSummary}</p>
                  )}

                  {safeAudioUrl && (
                    <div className="mt-3.5 rounded-xl border border-church-line bg-church-light/70 p-3">
                      <div className="mb-1 flex items-center justify-between text-xs font-semibold text-church-navy">
                        <span className="inline-flex items-center gap-1.5">
                          <Headphones className="h-4 w-4 text-church-blue" aria-hidden="true" />
                          Écouter l’audio
                        </span>
                        {latestCulte.audioDuration && (
                          <span className="text-church-muted tabular-nums">{latestCulte.audioDuration}</span>
                        )}
                      </div>
                      <audio controls preload="none" src={safeAudioUrl} className="h-9 w-full">
                        Votre navigateur ne prend pas en charge la lecture audio.
                      </audio>
                    </div>
                  )}

                  <div className="mt-auto flex flex-wrap items-center justify-between gap-2.5 pt-4">
                    <button onClick={() => onSelectCulte(latestCulte)} className="btn-primary text-xs sm:text-sm">
                      Fiche & supports
                    </button>
                    <button
                      onClick={() => onOpenShare(latestCulte.title, latestCulte.sermonSummary, `page=culte&id=${latestCulte.id}`)}
                      className="btn-ghost text-xs sm:text-sm"
                    >
                      <Share2 className="h-4 w-4" aria-hidden="true" /> Partager
                    </button>
                  </div>
                </div>
              </article>

              {moreCultes.length > 0 && (
                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
                  {moreCultes.map((c) => {
                    const sType = inferCulteServiceType(c);
                    return (
                      <button
                        key={c.id}
                        onClick={() => onSelectCulte(c)}
                        className="surface surface-interactive group flex w-full items-center justify-between gap-3 p-4 text-left"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-x-2 text-xs">
                            <span className="font-semibold text-church-blue">{CULTE_TYPE_LABELS[sType]}</span>
                            <span className="text-church-line">·</span>
                            <span className="text-church-muted">{formatDate(c.date)}</span>
                          </div>
                          <h4 className="mt-1 font-serif text-base font-semibold text-church-navy line-clamp-2 group-hover:text-church-blue">
                            {c.title}
                          </h4>
                          {c.preacher && <p className="mt-1 truncate text-xs text-church-muted">{c.preacher}</p>}
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-church-blue" aria-hidden="true" />
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <div className="surface p-5 text-center">
              <p className="font-serif text-lg text-church-navy">Aucune prédication publiée pour le moment</p>
              <p className="mt-1 text-sm text-church-muted">
                Les prédications du Dimanche, des Événements et du Mardi seront disponibles ici.
              </p>
            </div>
          )}
        </section>
      )}

      {/* 4. Fenêtre Départements principaux (ECODIM, AOC, HAC uniquement sur l'accueil) */}
      {sections.showDepartments && departments.length > 0 && (
        <section className="page space-y-4">
          <SectionHead title="Départements" linkLabel="Tous les départements" onLink={() => onNavigate('departements')} />
          {(() => {
            const mainIds = ['ecodim', 'aoc', 'hac'];
            const mainThree = mainIds
              .map((id) => departments.find((d) => d.id === id))
              .filter((d): d is DepartmentItem => Boolean(d));
            const displayed = mainThree.length > 0 ? mainThree : departments.slice(0, 3);
            return (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {displayed.map((dept) => {
                  const logo = sanitizeUrl(dept.logoUrl);
                  return (
                    <button
                      key={dept.id}
                      onClick={() => onSelectDepartment(dept)}
                      className="surface surface-interactive group flex w-full flex-col justify-between gap-3 p-4 text-left"
                    >
                      <div className="flex items-center gap-3.5">
                        {logo ? (
                          <img
                            src={logo}
                            alt={`Logo ${dept.name}`}
                            className="h-16 w-16 shrink-0 rounded-xl border border-church-line bg-white object-contain p-1"
                          />
                        ) : (
                          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-church-line bg-church-tint font-serif text-sm font-bold uppercase tracking-wide text-church-navy">
                            {(dept.code || dept.name).slice(0, 6)}
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <span className="text-[11px] font-semibold uppercase tracking-wide text-church-blue">
                            {dept.code}
                          </span>
                          <h3 className="font-serif text-base sm:text-lg font-semibold leading-snug text-church-navy group-hover:text-church-blue">
                            {dept.name}
                          </h3>
                        </div>
                      </div>
                      <div className="flex items-end justify-between gap-2">
                        <p className="line-clamp-2 text-xs text-church-muted leading-relaxed">
                          {dept.tagline || dept.meetingSchedule || dept.description}
                        </p>
                        <ChevronRight className="h-4 w-4 shrink-0 text-church-blue transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })()}
        </section>
      )}

      {/* 5. Fenêtre Événements & Actualités */}
      {sections.showEventsAndNews && (
        <section className="page">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
            {/* Événements */}
            <div className="min-w-0">
              <SectionHead title="Événements à venir" linkLabel="Tout l’agenda" onLink={() => onNavigate('evenements')} />
              {upcomingEvents.length === 0 ? (
                <div className="surface p-6 text-center text-sm text-church-muted">
                  Aucun événement programmé pour le moment.
                </div>
              ) : (
                <div className="space-y-3.5">
                  {upcomingEvents.map((ev) => (
                    <article key={ev.id} className="surface surface-interactive overflow-hidden">
                      <button
                        onClick={() => onSelectEvent(ev)}
                        className="group flex w-full items-center gap-3.5 p-3.5 text-left sm:gap-4 sm:p-4"
                      >
                        {ev.coverImage && sanitizeUrl(ev.coverImage) ? (
                          <img
                            src={sanitizeUrl(ev.coverImage)}
                            alt={`Affiche ${ev.title}`}
                            className="h-16 w-16 shrink-0 rounded-xl object-cover bg-church-navy sm:h-20 sm:w-24"
                          />
                        ) : (
                          <DateBlock date={ev.date} />
                        )}
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-semibold text-church-blue">{ev.category}</span>
                          <h3 className="mt-0.5 font-serif text-base sm:text-lg font-semibold leading-snug text-church-navy line-clamp-2 group-hover:text-church-blue">
                            {ev.title}
                          </h3>
                          <p className="mt-1 truncate text-xs text-church-muted">
                            {ev.date}
                            {ev.time ? ` · ${ev.time}` : ''}
                            {ev.location ? ` · ${ev.location}` : ''}
                          </p>
                        </div>
                        <ChevronRight className="h-5 w-5 shrink-0 text-church-muted" aria-hidden="true" />
                      </button>
                    </article>
                  ))}
                </div>
              )}
            </div>

            {/* Actualités */}
            <div className="min-w-0">
              <SectionHead title="Actualités & Communiqués" linkLabel="Tout lire" onLink={() => onNavigate('actualites')} />
              {latestNews.length === 0 ? (
                <div className="surface p-6 text-center text-sm text-church-muted">
                  Aucune actualité publiée pour le moment.
                </div>
              ) : (
                <ul className="surface divide-y divide-church-line overflow-hidden">
                  {latestNews.map((n) => (
                    <li key={n.id}>
                      <button
                        onClick={() => onSelectNews(n)}
                        className="flex w-full items-center gap-3.5 p-3.5 sm:p-4 text-left transition-colors hover:bg-church-light"
                      >
                        {n.coverImage && sanitizeUrl(n.coverImage) && (
                          <img
                            src={sanitizeUrl(n.coverImage)}
                            alt=""
                            className="h-14 w-14 sm:h-16 sm:w-16 shrink-0 rounded-xl object-cover bg-church-navy"
                          />
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-x-2 text-xs">
                            <span className={n.category === 'Communiqué officiel' ? 'font-semibold text-church-blue' : 'text-church-muted'}>
                              {n.category}
                            </span>
                            <span aria-hidden="true" className="text-church-line">·</span>
                            <span className="text-church-muted">{formatPublishedDateTime(n.date, n.publishedAt)}</span>
                          </span>
                          <span className="mt-1 block font-serif text-base font-semibold leading-snug text-church-navy line-clamp-2">
                            {n.title}
                          </span>
                        </span>
                        <ChevronRight className="h-5 w-5 shrink-0 text-church-muted" aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 6. Fenêtre Galerie */}
      {sections.showGallery && featuredAlbums.length > 0 && (
        <section className="page">
          <SectionHead title="En images" linkLabel="Toute la galerie" onLink={() => onNavigate('galerie')} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featuredAlbums.map((alb) => (
              <button
                key={alb.id}
                onClick={() => onSelectAlbum(alb)}
                className="surface surface-interactive group block w-full overflow-hidden text-left"
              >
                <span className="relative block overflow-hidden bg-church-navy">
                  {sanitizeUrl(alb.coverImage) ? (
                    <img
                      src={sanitizeUrl(alb.coverImage)}
                      alt={alb.title}
                      className="aspect-[16/10] w-full object-cover transition-transform duration-300 group-hover:scale-[1.03] sm:aspect-[4/3]"
                    />
                  ) : (
                    <span className="flex aspect-[16/10] w-full items-center justify-center bg-gradient-to-br from-church-navy to-church-blue/90 sm:aspect-[4/3]">
                      <Images className="h-9 w-9 text-white/75" aria-hidden="true" />
                    </span>
                  )}
                  <span className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-0.5 text-xs font-semibold text-church-navy shadow-xs">
                    <Images className="h-3.5 w-3.5 text-church-blue" aria-hidden="true" />
                    {alb.items?.length || alb.mediaCount || 0}
                  </span>
                </span>
                <span className="block p-3.5">
                  <span className="block font-serif text-base font-semibold leading-snug text-church-navy line-clamp-1 group-hover:text-church-blue">
                    {alb.title}
                  </span>
                  <span className="mt-0.5 block text-xs text-church-muted">{formatDate(alb.date)}</span>
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* 7. Rattachement Église Évangélique des Assemblées de Dieu */}
      <section className="page pb-4">
        <div className="surface p-5 sm:p-6 space-y-2.5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-church-tint text-church-blue">
              <Landmark className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 className="font-serif text-lg sm:text-xl text-church-navy">
                {churchSettings.annexLabel || 'Notre assemblée'}
              </h2>
              {churchSettings.motherChurch && (
                <p className="text-xs sm:text-sm font-medium text-church-blue">{churchSettings.motherChurch}</p>
              )}
            </div>
          </div>
          {churchSettings.principalPastor && (
            <p className="text-sm text-church-navy">
              <span className="text-church-muted">Pasteur principal :</span>{' '}
              <strong>{churchSettings.principalPastor}</strong>
            </p>
          )}
          {churchSettings.foundationSummary && (
            <p className="text-sm leading-relaxed text-church-muted">{churchSettings.foundationSummary}</p>
          )}
        </div>
      </section>
    </div>
  );
};
