import React from 'react';
import { Culte, EventItem, NewsItem, AlbumItem, DepartmentItem, PageView, SiteImages, HeroContent } from '../types';
import { HERO_IMAGE, CHURCH_INFO } from '../mockData';
import { Play, Share2, ChevronRight, Images, Bell, MapPin } from 'lucide-react';
import { SectionHead, Meta, DateBlock, formatDate } from './ui';

interface HomeViewProps {
  cultes: Culte[];
  events: EventItem[];
  news: NewsItem[];
  albums: AlbumItem[];
  departments: DepartmentItem[];
  siteImages?: SiteImages;
  heroContent?: HeroContent;
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
  onSelectCulte,
  onSelectEvent,
  onSelectDepartment,
  onSelectAlbum,
  onSelectNews,
  onNavigate,
  onOpenNotifications,
  onOpenShare
}) => {
  // Dernier culte publié
  const latestCulte = cultes.find((c) => c.status === 'publie') || cultes[0];

  // Prochains événements
  const upcomingEvents = events.slice(0, 3);

  // Actualités récentes
  const latestNews = news.slice(0, 4);

  // Galerie en avant
  const featuredAlbums = albums.slice(0, 3);

  return (
    <div>
      {/* 1. Bloc d’accueil (Hero) */}
      <section className="relative overflow-hidden bg-church-navy text-white">
        <div className="absolute inset-0">
          <img
            src={siteImages?.heroImage || HERO_IMAGE}
            alt=""
            className="h-full w-full object-cover opacity-25"
          />
        </div>
        <div className="page relative py-16 sm:py-24">
          <p className="text-sm font-medium tracking-wide text-white/80">
            {heroContent?.nationalBadge || 'Église Évangélique des Assemblées de Dieu de Côte d’Ivoire'}
          </p>
          <p className="mt-1 text-xs text-white/65">
            {heroContent?.locationBadge || 'Anyama, Ran Extension Résidentiel'}
          </p>
          <h1 className="mt-4 max-w-2xl font-serif text-3xl font-semibold leading-tight text-white sm:text-5xl">
            {heroContent?.mainTitle || 'Une église unie pour adorer Dieu, grandir dans la foi et impacter Anyama.'}
          </h1>
          <p className="mt-5 max-w-xl text-base text-white/85 sm:text-lg">
            {heroContent?.welcomeMessage || 'Bienvenue sur la plateforme officielle de l’Église Évangélique des Assemblées de Dieu d’Anyama, Ran Extension Résidentiel. Retrouvez nos cultes, nos prédications, nos événements et la vie de notre communauté.'}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {latestCulte && (
              <button onClick={() => onSelectCulte(latestCulte)} className="btn-primary">
                {heroContent?.actionButtonCulte || 'Dernière prédication'}
              </button>
            )}
            <button
              onClick={() => onNavigate('evenements')}
              className="btn-on-dark"
            >
              {heroContent?.actionButtonEvents || 'Agenda des rassemblements'}
            </button>
          </div>
        </div>
      </section>

      {/* 2. Horaires des rassemblements */}
      <section id="horaires" className="page pt-10 sm:pt-14">
        <div className="surface overflow-hidden">
          <div className="border-b border-church-line bg-church-light/60 px-4 py-4 sm:px-6">
            <h2 className="font-sans text-sm font-semibold uppercase tracking-wider text-church-navy">
              Horaires hebdomadaires des cultes
            </h2>
          </div>
          <ul className="divide-y divide-church-line">
            {CHURCH_INFO.schedules.map((s) => (
              <li key={s.day} className="flex flex-col gap-1 px-4 py-3.5 sm:flex-row sm:items-baseline sm:gap-6 sm:px-6">
                <span className="w-56 shrink-0 font-semibold text-church-navy">
                  {s.day}, {s.time}
                </span>
                <span>{s.name}</span>
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-3 border-t border-church-line bg-church-light px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <span className="flex items-center gap-2 text-sm text-church-muted">
              <MapPin className="h-4 w-4 shrink-0 text-church-blue" aria-hidden="true" />
              {CHURCH_INFO.address}
            </span>
            <button onClick={onOpenNotifications} className="btn-secondary self-start sm:self-auto">
              <Bell className="h-4 w-4 text-church-blue" aria-hidden="true" />
              Recevoir un rappel avant le culte
            </button>
          </div>
        </div>
      </section>

      {/* 3. Dernière prédication */}
      {latestCulte && (
        <section className="page pt-12 sm:pt-16">
          <SectionHead title="Dernière prédication" linkLabel="Tous les cultes" onLink={() => onNavigate('cultes')} />
          <article className="surface grid overflow-hidden md:grid-cols-[1fr_1.25fr]">
            <button onClick={() => onSelectCulte(latestCulte)} className="relative block bg-church-navy" aria-label={latestCulte.title}>
              <img src={latestCulte.coverImage} alt="" className="aspect-video h-full w-full object-cover md:aspect-auto" />
              {latestCulte.hasVideo && (
                <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded bg-church-navy px-2.5 py-1 text-[13px] font-medium text-white">
                  <Play className="h-3.5 w-3.5 fill-white" aria-hidden="true" /> Vidéo
                  {latestCulte.videoDuration && <span className="text-white/75">{latestCulte.videoDuration}</span>}
                </span>
              )}
            </button>
            <div className="flex flex-col p-5 sm:p-7">
              <Meta
                items={[
                  formatDate(latestCulte.date),
                  latestCulte.preacher && <span className="text-church-dark">{latestCulte.preacher}</span>,
                  latestCulte.isDemo && <span className="demo-tag">Démonstration</span>
                ]}
              />
              <h3 className="mt-3 text-2xl sm:text-[1.7rem]">
                <button onClick={() => onSelectCulte(latestCulte)} className="text-left hover:text-church-blue">
                  {latestCulte.title}
                </button>
              </h3>
              {latestCulte.scriptureRef && (
                <p className="mt-4 border-l-2 border-church-blue pl-4 font-serif text-lg italic text-church-navy">
                  {latestCulte.scriptureRef}
                </p>
              )}
              {latestCulte.sermonSummary && (
                <p className="mt-4 line-clamp-3 text-church-dark">{latestCulte.sermonSummary}</p>
              )}
              <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-6">
                <button onClick={() => onSelectCulte(latestCulte)} className="btn-primary">
                  Lire la prédication
                </button>
                <button
                  onClick={() => onOpenShare(latestCulte.title, latestCulte.sermonSummary, `page=culte&id=${latestCulte.id}`)}
                  className="btn-ghost"
                >
                  <Share2 className="h-4 w-4" aria-hidden="true" /> Partager
                </button>
              </div>
            </div>
          </article>
        </section>
      )}

      {/* 4. Événements et actualités côte à côte sur grand écran */}
      <div className="page grid grid-cols-1 gap-12 pt-12 sm:pt-16 lg:grid-cols-2 lg:gap-10">
        <section className="min-w-0">
          <SectionHead title="Prochains événements" linkLabel="L’agenda" onLink={() => onNavigate('evenements')} />
          {upcomingEvents.length === 0 ? (
            <p className="text-church-muted">Aucun événement annoncé pour le moment.</p>
          ) : (
            <ul className="surface divide-y divide-church-line">
              {upcomingEvents.map((ev) => (
                <li key={ev.id}>
                  <button
                    onClick={() => onSelectEvent(ev)}
                    className="flex w-full items-center gap-4 p-4 text-left hover:bg-church-light"
                  >
                    <DateBlock date={ev.date} />
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold leading-snug text-church-navy">{ev.title}</span>
                      <span className="mt-1 block truncate text-sm text-church-muted">
                        {[ev.time, ev.location].filter(Boolean).join(', ')}
                      </span>
                    </span>
                    <ChevronRight className="h-5 w-5 shrink-0 text-church-muted" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="min-w-0">
          <SectionHead title="Actualités" linkLabel="Toutes les actualités" onLink={() => onNavigate('actualites')} />
          {latestNews.length === 0 ? (
            <p className="text-church-muted">Aucune actualité publiée pour le moment.</p>
          ) : (
            <ul className="surface divide-y divide-church-line">
              {latestNews.map((n) => (
                <li key={n.id}>
                  <button onClick={() => onSelectNews(n)} className="block w-full p-4 text-left hover:bg-church-light">
                    <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                      <span className={n.category === 'Communiqué officiel' ? 'font-semibold text-church-blue' : 'text-church-muted'}>
                        {n.category}
                      </span>
                      <span className="text-church-muted">{formatDate(n.date)}</span>
                      {n.isUrgent && <span className="font-semibold text-[#B42318]">Important</span>}
                    </span>
                    <span className="mt-1 block font-semibold leading-snug text-church-navy">{n.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* 5. Galerie */}
      {featuredAlbums.length > 0 && (
        <section className="page pt-12 sm:pt-16">
          <SectionHead title="En images" linkLabel="Toute la galerie" onLink={() => onNavigate('galerie')} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featuredAlbums.map((alb) => (
              <button key={alb.id} onClick={() => onSelectAlbum(alb)} className="group text-left">
                <span className="relative block overflow-hidden rounded-lg bg-church-navy">
                  <img src={alb.coverImage} alt="" className="aspect-[4/3] w-full object-cover transition-opacity group-hover:opacity-90" />
                  <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded bg-white px-2 py-0.5 text-[13px] font-medium text-church-navy">
                    <Images className="h-3.5 w-3.5" aria-hidden="true" /> {alb.mediaCount}
                  </span>
                </span>
                <span className="mt-2 block font-semibold leading-snug text-church-navy group-hover:text-church-blue">
                  {alb.title}
                </span>
                <span className="block text-sm text-church-muted">{formatDate(alb.date)}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* 6. Départements */}
      <section className="page pt-12 sm:pt-16">
        <SectionHead title="Départements et groupes" linkLabel="Tous les départements" onLink={() => onNavigate('departements')} />
        <ul className="flex flex-wrap gap-2">
          {departments.map((d) => (
            <li key={d.id}>
              <button onClick={() => onSelectDepartment(d)} className="chip">
                {d.name}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};
