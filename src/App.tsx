import React, { useState, useEffect, useCallback, useRef } from 'react';
import { registerSW } from 'virtual:pwa-register';
import {
  PageView,
  AdminSubPage,
  Culte,
  EventItem,
  NewsItem,
  AlbumItem,
  DepartmentItem,
  SiteImages,
  HeroContent,
  ChurchSettings,
  AdminUserPublic,
  AdminInvitation,
  SecuritySettings,
  SecurityLogEntry,
  AuthStatus,
  PushNotificationRecord,
  LinkedDriveAccount,
  LinkedDriveFolder
} from './types';
import {
  INITIAL_CULTES,
  INITIAL_EVENTS,
  INITIAL_NEWS,
  INITIAL_ALBUMS,
  INITIAL_DEPARTMENTS,
  DEFAULT_SITE_IMAGES,
  DEFAULT_HERO_CONTENT,
  DEFAULT_CHURCH_SETTINGS
} from './mockData';
import { api, setSessionToken } from './services/api';
import { clearDriveSession } from './services/googleDrive';
import { Header } from './components/Header';
import { MobileBottomNav } from './components/MobileBottomNav';
import { HomeView } from './components/HomeView';
import { CultesView } from './components/CultesView';
import { CulteDetailPage } from './components/CulteDetailPage';
import { EventsView } from './components/EventsView';
import { EventDetailPage } from './components/EventDetailPage';
import { GalerieView } from './components/GalerieView';
import { AlbumDetailPage } from './components/AlbumDetailPage';
import { NewsView } from './components/NewsView';
import { NewsDetailPage } from './components/NewsDetailPage';
import { DepartementsView } from './components/DepartementsView';
import { DepartmentDetailPage } from './components/DepartmentDetailPage';
import { AdminPortal } from './components/AdminPortal';
import { AdminAuthGate } from './components/AdminAuthGate';
import { ShareModal } from './components/ShareModal';
import { NotificationModal } from './components/NotificationModal';
import { SiteFooter } from './components/SiteFooter';
import { OfflineIndicator } from './components/PWAInstallBanner';

// Enregistrement automatique du Service Worker PWA
if (typeof window !== 'undefined') {
  registerSW({ immediate: true });
}

export default function App() {
  const [activePage, setActivePage] = useState<PageView>('accueil');
  const [adminSubPage, setAdminSubPage] = useState<AdminSubPage>('dashboard');

  // Etat public synchronisé avec le serveur
  const [churchSettings, setChurchSettings] = useState<ChurchSettings>(DEFAULT_CHURCH_SETTINGS);
  const [officialLogoUrl, setOfficialLogoUrl] = useState<string | null>(null);
  const [siteImages, setSiteImages] = useState<SiteImages>(DEFAULT_SITE_IMAGES);
  const [heroContent, setHeroContent] = useState<HeroContent>(DEFAULT_HERO_CONTENT);
  const [cultes, setCultes] = useState<Culte[]>(INITIAL_CULTES);
  const [events, setEvents] = useState<EventItem[]>(INITIAL_EVENTS);
  const [news, setNews] = useState<NewsItem[]>(INITIAL_NEWS);
  const [albums, setAlbums] = useState<AlbumItem[]>(INITIAL_ALBUMS);
  const [departments, setDepartments] = useState<DepartmentItem[]>(INITIAL_DEPARTMENTS);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Sélections pour pages de détail
  const [selectedCulte, setSelectedCulte] = useState<Culte | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [selectedAlbum, setSelectedAlbum] = useState<AlbumItem | null>(null);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentItem | null>(null);

  // Etat d'authentification & administration (jamais exposé au public)
  const [authStatus, setAuthStatus] = useState<AuthStatus>({
    needsSetup: false,
    authenticated: false,
    currentAdmin: null
  });
  const [admins, setAdmins] = useState<AdminUserPublic[]>([]);
  const [invitedAdmins, setInvitedAdmins] = useState<AdminInvitation[]>([]);
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    secretGateSlug: 'portail-eeadci',
    enableKeyboardShortcut: true,
    enableFooterTap: true,
    sessionTimeoutMinutes: 120
  });
  const [securityLogs, setSecurityLogs] = useState<SecurityLogEntry[]>([]);
  const [pushSubscribersCount, setPushSubscribersCount] = useState(0);
  const [pushHistory, setPushHistory] = useState<PushNotificationRecord[]>([]);
  const [driveAccounts, setDriveAccounts] = useState<LinkedDriveAccount[]>([]);
  const [driveFolders, setDriveFolders] = useState<LinkedDriveFolder[]>([]);

  // Modales légères
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [shareData, setShareData] = useState<{
    isOpen: boolean;
    title: string;
    summary: string;
    url: string;
  }>({
    isOpen: false,
    title: '',
    summary: '',
    url: ''
  });

  // Suivi de vues uniques par session navigateur
  const viewedRef = useRef<Set<string>>(new Set());

  const trackView = useCallback((type: 'cultes' | 'events' | 'news' | 'albums', id: string) => {
    const key = `${type}:${id}`;
    if (viewedRef.current.has(key)) return;
    viewedRef.current.add(key);

    api
      .recordView(type, id)
      .then((res) => {
        if (type === 'cultes' && res.viewsCount !== undefined) {
          setCultes((prev) => prev.map((c) => (c.id === id ? { ...c, viewsCount: res.viewsCount } : c)));
        } else if (type === 'events' && res.viewsCount !== undefined) {
          setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, viewsCount: res.viewsCount } : e)));
        } else if (type === 'news' && res.readsCount !== undefined) {
          setNews((prev) => prev.map((n) => (n.id === id ? { ...n, readsCount: res.readsCount! } : n)));
        } else if (type === 'albums' && res.viewsCount !== undefined) {
          setAlbums((prev) => prev.map((a) => (a.id === id ? { ...a, viewsCount: res.viewsCount } : a)));
        }
      })
      .catch(() => {});
  }, []);

  // Application dynamique du thème et des angles personnalisés
  useEffect(() => {
    const theme = churchSettings.theme || DEFAULT_CHURCH_SETTINGS.theme!;
    const root = document.documentElement;
    if (theme.primaryColor) root.style.setProperty('--church-blue', theme.primaryColor);
    if (theme.navyColor) root.style.setProperty('--church-navy', theme.navyColor);
    if (theme.lightBgColor) root.style.setProperty('--church-light', theme.lightBgColor);

    if (theme.radiusStyle === 'classique') {
      root.style.setProperty('--radius-card', '0.5rem');
      root.style.setProperty('--radius-inner', '0.375rem');
      root.style.setProperty('--radius-control', '0.375rem');
    } else if (theme.radiusStyle === 'tres-doux') {
      root.style.setProperty('--radius-card', '1.5rem');
      root.style.setProperty('--radius-inner', '1.125rem');
      root.style.setProperty('--radius-control', '0.95rem');
    } else {
      root.style.setProperty('--radius-card', '1.125rem');
      root.style.setProperty('--radius-inner', '0.875rem');
      root.style.setProperty('--radius-control', '0.75rem');
    }
  }, [churchSettings.theme]);

  // Chargement initial des données depuis l'API
  const loadPublicData = useCallback(async () => {
    try {
      const data = await api.fetchPublicData();
      setChurchSettings({ ...DEFAULT_CHURCH_SETTINGS, ...data.churchSettings });
      setHeroContent({ ...DEFAULT_HERO_CONTENT, ...data.heroContent });
      setSiteImages({
        heroImage: data.siteImages?.heroImage || DEFAULT_SITE_IMAGES.heroImage,
        pastorImage: data.siteImages?.pastorImage || DEFAULT_SITE_IMAGES.pastorImage,
        choirImage: data.siteImages?.choirImage || DEFAULT_SITE_IMAGES.choirImage,
        youthImage: data.siteImages?.youthImage || DEFAULT_SITE_IMAGES.youthImage
      });
      setOfficialLogoUrl(data.officialLogoUrl ?? null);
      setCultes(data.cultes || []);
      setEvents(data.events || []);
      setNews(data.news || []);
      setAlbums(data.albums || []);
      setDepartments(data.departments?.length ? data.departments : INITIAL_DEPARTMENTS);
    } catch {
      // Conserve les valeurs par défaut / cache hors connexion
    } finally {
      setDataLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadPublicData();
  }, [loadPublicData]);

  // Chargement des données complètes Admin (après authentification)
  const loadAdminBootstrap = useCallback(async () => {
    try {
      const boot = await api.fetchAdminBootstrap();
      setCultes(boot.cultes || []);
      setEvents(boot.events || []);
      setNews(boot.news || []);
      setAlbums(boot.albums || []);
      setDepartments(boot.departments || []);
      setChurchSettings({ ...DEFAULT_CHURCH_SETTINGS, ...boot.churchSettings });
      setHeroContent({ ...DEFAULT_HERO_CONTENT, ...boot.heroContent });
      setSiteImages({
        heroImage: boot.siteImages?.heroImage || DEFAULT_SITE_IMAGES.heroImage,
        pastorImage: boot.siteImages?.pastorImage || DEFAULT_SITE_IMAGES.pastorImage,
        choirImage: boot.siteImages?.choirImage || DEFAULT_SITE_IMAGES.choirImage,
        youthImage: boot.siteImages?.youthImage || DEFAULT_SITE_IMAGES.youthImage
      });
      setOfficialLogoUrl(boot.officialLogoUrl ?? null);
      setAdmins(boot.admins || []);
      setInvitedAdmins(boot.invitedAdmins || []);
      setSecuritySettings(boot.security);
      setSecurityLogs(boot.securityLogs || []);
      setPushSubscribersCount(boot.pushSubscribersCount || 0);
      setPushHistory(boot.pushHistory || []);
      setDriveAccounts(boot.driveAccounts || []);
      setDriveFolders(boot.driveFolders || []);
    } catch {
      // Token expiré ou session fermée
    }
  }, []);

  // Ouverture discrète du portail Admin (aucun changement d'URL publique)
  const openHiddenAdmin = useCallback(async () => {
    try {
      const st = await api.getAuthStatus();
      setAuthStatus(st);
      if (st.authenticated) {
        await loadAdminBootstrap();
      }
    } catch {
      // ignore
    }
    setActivePage('admin');
    const cleanUrl = `${window.location.pathname}?page=accueil`;
    window.history.replaceState({ page: 'accueil' }, '', cleanUrl);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [loadAdminBootstrap]);

  // Détection sécurisée du chemin caché #/<slug> + raccourci Ctrl+Maj+A / Alt+Maj+A
  useEffect(() => {
    const checkSecretHash = async () => {
      const hash = window.location.hash.replace(/^#\/?/, '').trim();
      if (!hash) return;
      try {
        const res = await api.verifyGate(hash);
        if (res.valid) {
          // Effacer immédiatement le hash secret de la barre d'adresse et de l'historique
          window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
          openHiddenAdmin();
        }
      } catch {
        // ignore
      }
    };

    checkSecretHash();
    window.addEventListener('hashchange', checkSecretHash);

    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.altKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        openHiddenAdmin();
      }
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('hashchange', checkSecretHash);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [openHiddenAdmin]);

  // Construction d'URL publique sécurisée (ne génère JAMAIS ?page=admin)
  const buildPublicUrl = (page: PageView, params?: { id?: string }) => {
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    const sp = new URLSearchParams();

    if (page === 'cultes') sp.set('page', 'cultes');
    else if (page === 'culte-detail' && params?.id) {
      sp.set('page', 'culte');
      sp.set('id', params.id);
    } else if (page === 'evenements') sp.set('page', 'evenements');
    else if (page === 'evenement-detail' && params?.id) {
      sp.set('page', 'evenement');
      sp.set('id', params.id);
    } else if (page === 'galerie') sp.set('page', 'galerie');
    else if (page === 'album-detail' && params?.id) {
      sp.set('page', 'album');
      sp.set('id', params.id);
    } else if (page === 'actualites') sp.set('page', 'actualites');
    else if (page === 'actualite-detail' && params?.id) {
      sp.set('page', 'actualite');
      sp.set('id', params.id);
    } else if (page === 'departements') sp.set('page', 'departements');
    else if (page === 'departement-detail' && params?.id) {
      sp.set('page', 'departement');
      sp.set('id', params.id);
    } else {
      sp.set('page', 'accueil');
    }

    return `${origin}${pathname}?${sp.toString()}`;
  };

  const publicCultes = cultes.filter((c) => c.status === 'publie');

  const navigateTo = useCallback(
    (
      page: PageView,
      opts?: {
        culte?: Culte;
        event?: EventItem;
        album?: AlbumItem;
        newsItem?: NewsItem;
        department?: DepartmentItem;
        adminSubPage?: AdminSubPage;
      }
    ) => {
      if (page === 'admin') {
        openHiddenAdmin();
        return;
      }

      setActivePage(page);

      if (opts?.culte) {
        setSelectedCulte(opts.culte);
        trackView('cultes', opts.culte.id);
      }
      if (opts?.event) {
        setSelectedEvent(opts.event);
        trackView('events', opts.event.id);
      }
      if (opts?.album) {
        setSelectedAlbum(opts.album);
        trackView('albums', opts.album.id);
      }
      if (opts?.newsItem) {
        setSelectedNews(opts.newsItem);
        trackView('news', opts.newsItem.id);
      }
      if (opts?.department) setSelectedDepartment(opts.department);
      if (opts?.adminSubPage) setAdminSubPage(opts.adminSubPage);

      const targetId =
        opts?.culte?.id || opts?.event?.id || opts?.album?.id || opts?.newsItem?.id || opts?.department?.id;
      const url = buildPublicUrl(page, { id: targetId });
      window.history.pushState({ page, targetId }, '', url);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [openHiddenAdmin, trackView]
  );

  // Lecture des paramètres URL publics (bloque ?page=admin)
  useEffect(() => {
    if (!dataLoaded) return;

    const parseUrlAndApply = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const pageParam = params.get('page');
        const idParam = params.get('id');

        // Sécurisation : bloquer toute balise URL ?page=admin
        if (pageParam === 'admin') {
          window.history.replaceState({ page: 'accueil' }, '', `${window.location.pathname}?page=accueil`);
          setActivePage('accueil');
          return;
        }

        if (pageParam === 'culte' && idParam) {
          const found = publicCultes.find((c) => c.id === idParam);
          if (found) {
            setSelectedCulte(found);
            setActivePage('culte-detail');
            trackView('cultes', found.id);
          } else setActivePage('cultes');
        } else if (pageParam === 'evenement' && idParam) {
          const found = events.find((e) => e.id === idParam);
          if (found) {
            setSelectedEvent(found);
            setActivePage('evenement-detail');
            trackView('events', found.id);
          } else setActivePage('evenements');
        } else if (pageParam === 'album' && idParam) {
          const found = albums.find((a) => a.id === idParam);
          if (found) {
            setSelectedAlbum(found);
            setActivePage('album-detail');
            trackView('albums', found.id);
          } else setActivePage('galerie');
        } else if (pageParam === 'actualite' && idParam) {
          const found = news.find((n) => n.id === idParam);
          if (found) {
            setSelectedNews(found);
            setActivePage('actualite-detail');
            trackView('news', found.id);
          } else setActivePage('actualites');
        } else if (pageParam === 'departement' && idParam) {
          const found = departments.find((d) => d.id === idParam);
          if (found) {
            setSelectedDepartment(found);
            setActivePage('departement-detail');
          } else setActivePage('departements');
        } else if (pageParam === 'cultes') setActivePage('cultes');
        else if (pageParam === 'evenements') setActivePage('evenements');
        else if (pageParam === 'galerie') setActivePage('galerie');
        else if (pageParam === 'actualites') setActivePage('actualites');
        else if (pageParam === 'departements') setActivePage('departements');
        else if (activePage !== 'admin') setActivePage('accueil');
      } catch {
        setActivePage('accueil');
      }
    };

    parseUrlAndApply();
    const handlePopState = () => parseUrlAndApply();
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [dataLoaded, cultes, events, albums, news, departments, trackView]);

  // ==================== INTERACTIONS VISITEURS (SANS COMPTE) ====================
  const handleAddReaction = async (culteId: string, type: 'likes' | 'hearts' | 'prayers') => {
    try {
      const res = await api.reactCulte(culteId, type);
      setCultes((prev) => prev.map((c) => (c.id === culteId ? { ...c, reactions: res.reactions } : c)));
      setSelectedCulte((prev) => (prev && prev.id === culteId ? { ...prev, reactions: res.reactions } : prev));
    } catch {
      // ignore
    }
  };

  const handleAddComment = async (culteId: string, authorName: string, text: string) => {
    try {
      const res = await api.commentCulte(culteId, authorName, text);
      setCultes((prev) => prev.map((c) => (c.id === culteId ? { ...c, comments: [res.comment, ...c.comments] } : c)));
      setSelectedCulte((prev) =>
        prev && prev.id === culteId ? { ...prev, comments: [res.comment, ...prev.comments] } : prev
      );
    } catch {
      // ignore
    }
  };

  const handleReportComment = async (commentId: string) => {
    try {
      await api.reportComment(commentId);
      setCultes((prev) =>
        prev.map((c) => ({
          ...c,
          comments: c.comments.map((cm) => (cm.id === commentId ? { ...cm, reported: true } : cm))
        }))
      );
    } catch {
      // ignore
    }
  };

  const handleToggleRegisterEvent = async (eventId: string) => {
    const current = events.find((e) => e.id === eventId);
    const nextStatus = !current?.isRegistered;
    try {
      const res = await api.toggleEventRegister(eventId, nextStatus);
      setEvents((prev) =>
        prev.map((ev) =>
          ev.id === eventId ? { ...ev, isRegistered: nextStatus, attendeesCount: res.attendeesCount } : ev
        )
      );
      setSelectedEvent((prev) =>
        prev && prev.id === eventId ? { ...prev, isRegistered: nextStatus, attendeesCount: res.attendeesCount } : prev
      );
    } catch {
      // ignore
    }
  };

  const handleAddEventLike = async (eventId: string) => {
    try {
      const res = await api.likeEvent(eventId);
      setEvents((prev) => prev.map((ev) => (ev.id === eventId ? { ...ev, likes: res.likes } : ev)));
      setSelectedEvent((prev) => (prev && prev.id === eventId ? { ...prev, likes: res.likes } : prev));
    } catch {
      // ignore
    }
  };

  const handleAddEventComment = async (eventId: string, authorName: string, text: string) => {
    try {
      const res = await api.commentEvent(eventId, authorName, text);
      setEvents((prev) =>
        prev.map((ev) => (ev.id === eventId ? { ...ev, comments: [res.comment, ...(ev.comments || [])] } : ev))
      );
      setSelectedEvent((prev) =>
        prev && prev.id === eventId ? { ...prev, comments: [res.comment, ...(prev.comments || [])] } : prev
      );
    } catch {
      // ignore
    }
  };

  const handleVoteEventPoll = async (eventId: string, optionId: string) => {
    try {
      const res = await api.voteEventPoll(eventId, optionId);
      setEvents((prev) => prev.map((ev) => (ev.id === eventId ? { ...ev, poll: res.poll } : ev)));
      setSelectedEvent((prev) => (prev && prev.id === eventId ? { ...prev, poll: res.poll } : prev));
    } catch {
      // ignore
    }
  };

  const handleAddNewsLike = async (newsId: string) => {
    try {
      const res = await api.likeNews(newsId);
      setNews((prev) => prev.map((n) => (n.id === newsId ? { ...n, likes: res.likes } : n)));
      setSelectedNews((prev) => (prev && prev.id === newsId ? { ...prev, likes: res.likes } : prev));
    } catch {
      // ignore
    }
  };

  const handleAddNewsComment = async (newsId: string, authorName: string, text: string) => {
    try {
      const res = await api.commentNews(newsId, authorName, text);
      setNews((prev) =>
        prev.map((n) => (n.id === newsId ? { ...n, comments: [res.comment, ...(n.comments || [])] } : n))
      );
      setSelectedNews((prev) =>
        prev && prev.id === newsId ? { ...prev, comments: [res.comment, ...(prev.comments || [])] } : prev
      );
    } catch {
      // ignore
    }
  };

  // Partage
  const handleOpenShare = (title: string, summary: string, customParam?: string) => {
    let url = buildPublicUrl(activePage);
    if (customParam) {
      url = `${window.location.origin}${window.location.pathname}?${customParam}`;
    } else if (activePage === 'culte-detail' && selectedCulte) {
      url = buildPublicUrl('culte-detail', { id: selectedCulte.id });
    } else if (activePage === 'evenement-detail' && selectedEvent) {
      url = buildPublicUrl('evenement-detail', { id: selectedEvent.id });
    } else if (activePage === 'album-detail' && selectedAlbum) {
      url = buildPublicUrl('album-detail', { id: selectedAlbum.id });
    } else if (activePage === 'actualite-detail' && selectedNews) {
      url = buildPublicUrl('actualite-detail', { id: selectedNews.id });
    } else if (activePage === 'departement-detail' && selectedDepartment) {
      url = buildPublicUrl('departement-detail', { id: selectedDepartment.id });
    }

    const isTouch = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;
    if (isTouch && typeof navigator !== 'undefined' && navigator.share) {
      navigator
        .share({ title, text: summary ? summary.slice(0, 160) : undefined, url })
        .catch((err: unknown) => {
          if ((err as { name?: string })?.name !== 'AbortError') {
            setShareData({ isOpen: true, title, summary, url });
          }
        });
      return;
    }

    setShareData({ isOpen: true, title, summary, url });
  };

  // ==================== RENDU PRINCIPAL ====================
  const renderPageContent = () => {
    if (activePage === 'admin') {
      if (!authStatus.authenticated || !authStatus.currentAdmin) {
        return (
          <AdminAuthGate
            authStatus={authStatus}
            onAuthenticated={async (admin) => {
              setAuthStatus({ needsSetup: false, authenticated: true, currentAdmin: admin });
              await loadAdminBootstrap();
            }}
            onCancel={() => navigateTo('accueil')}
          />
        );
      }

      return (
        <AdminPortal
          currentAdmin={authStatus.currentAdmin}
          activeSubPage={adminSubPage}
          onNavigateSubPage={setAdminSubPage}
          onExitAdmin={() => {
            loadPublicData();
            navigateTo('accueil');
          }}
          onLogout={async () => {
            await api.logoutAdmin().catch(() => {});
            await clearDriveSession().catch(() => {});
            setSessionToken(null);
            setDriveAccounts([]);
            setDriveFolders([]);
            setAuthStatus({ needsSetup: false, authenticated: false, currentAdmin: null });
            loadPublicData();
            navigateTo('accueil');
          }}
          cultes={cultes}
          events={events}
          news={news}
          albums={albums}
          departments={departments}
          churchSettings={churchSettings}
          heroContent={heroContent}
          siteImages={siteImages}
          officialLogoUrl={officialLogoUrl}
          admins={admins}
          invitedAdmins={invitedAdmins}
          security={securitySettings}
          securityLogs={securityLogs}
          pushSubscribersCount={pushSubscribersCount}
          pushHistory={pushHistory}
          driveAccounts={driveAccounts}
          driveFolders={driveFolders}
          onSyncPublicState={(patch) => {
            if (patch.cultes !== undefined) setCultes(patch.cultes);
            if (patch.events !== undefined) setEvents(patch.events);
            if (patch.news !== undefined) setNews(patch.news);
            if (patch.albums !== undefined) setAlbums(patch.albums);
            if (patch.departments !== undefined) setDepartments(patch.departments);
            if (patch.churchSettings !== undefined) setChurchSettings(patch.churchSettings);
            if (patch.heroContent !== undefined) setHeroContent(patch.heroContent);
            if (patch.siteImages !== undefined) setSiteImages(patch.siteImages);
            if (patch.officialLogoUrl !== undefined) setOfficialLogoUrl(patch.officialLogoUrl);
          }}
          onSyncSecurityState={(patch) => {
            if (patch.admins !== undefined) setAdmins(patch.admins);
            if (patch.invitedAdmins !== undefined) setInvitedAdmins(patch.invitedAdmins);
            if (patch.security !== undefined) setSecuritySettings(patch.security);
            if (patch.securityLogs !== undefined) setSecurityLogs(patch.securityLogs);
          }}
          onSyncPushState={(patch) => {
            if (patch.pushSubscribersCount !== undefined) setPushSubscribersCount(patch.pushSubscribersCount);
            if (patch.pushHistory !== undefined) setPushHistory(patch.pushHistory);
          }}
          onSyncDriveState={(patch) => {
            if (patch.driveAccounts !== undefined) setDriveAccounts(patch.driveAccounts);
            if (patch.driveFolders !== undefined) setDriveFolders(patch.driveFolders);
            if (patch.albums !== undefined) setAlbums(patch.albums);
          }}
        />
      );
    }

    switch (activePage) {
      case 'accueil':
        return (
          <HomeView
            cultes={publicCultes}
            events={events}
            news={news}
            albums={albums}
            departments={departments}
            siteImages={siteImages}
            heroContent={heroContent}
            churchSettings={churchSettings}
            onSelectCulte={(culte) => navigateTo('culte-detail', { culte })}
            onSelectEvent={(event) => navigateTo('evenement-detail', { event })}
            onSelectDepartment={(dept) => navigateTo('departement-detail', { department: dept })}
            onSelectNews={(item) => navigateTo('actualite-detail', { newsItem: item })}
            onSelectAlbum={(alb) => navigateTo('album-detail', { album: alb })}
            onNavigate={(page) => navigateTo(page)}
            onOpenNotifications={() => setIsNotificationOpen(true)}
            onOpenShare={handleOpenShare}
            logoUrl={officialLogoUrl}
          />
        );

      case 'cultes':
        return (
          <CultesView
            cultes={publicCultes}
            onSelectCulte={(culte) => navigateTo('culte-detail', { culte })}
            onOpenShare={handleOpenShare}
          />
        );

      case 'culte-detail':
        return selectedCulte ? (
          <CulteDetailPage
            culte={selectedCulte}
            onBack={() => navigateTo('cultes')}
            onOpenShare={handleOpenShare}
            onAddReaction={handleAddReaction}
            onAddComment={handleAddComment}
            onReportComment={handleReportComment}
          />
        ) : (
          <CultesView
            cultes={publicCultes}
            onSelectCulte={(culte) => navigateTo('culte-detail', { culte })}
            onOpenShare={handleOpenShare}
          />
        );

      case 'evenements':
        return (
          <EventsView
            events={events}
            onSelectEvent={(event) => navigateTo('evenement-detail', { event })}
            onToggleRegister={handleToggleRegisterEvent}
            onOpenShare={handleOpenShare}
          />
        );

      case 'evenement-detail':
        return selectedEvent ? (
          <EventDetailPage
            event={selectedEvent}
            onBack={() => navigateTo('evenements')}
            onToggleRegister={handleToggleRegisterEvent}
            onOpenShare={handleOpenShare}
            onAddLike={handleAddEventLike}
            onAddComment={handleAddEventComment}
            onVotePoll={handleVoteEventPoll}
          />
        ) : (
          <EventsView
            events={events}
            onSelectEvent={(event) => navigateTo('evenement-detail', { event })}
            onToggleRegister={handleToggleRegisterEvent}
            onOpenShare={handleOpenShare}
          />
        );

      case 'galerie':
        return (
          <GalerieView
            albums={albums}
            onSelectAlbum={(album) => navigateTo('album-detail', { album })}
            onOpenShare={handleOpenShare}
          />
        );

      case 'album-detail':
        return selectedAlbum ? (
          <AlbumDetailPage
            album={selectedAlbum}
            onBack={() => navigateTo('galerie')}
            onOpenShare={handleOpenShare}
          />
        ) : (
          <GalerieView
            albums={albums}
            onSelectAlbum={(album) => navigateTo('album-detail', { album })}
            onOpenShare={handleOpenShare}
          />
        );

      case 'actualites':
        return (
          <NewsView
            news={news}
            onSelectNews={(item) => navigateTo('actualite-detail', { newsItem: item })}
            onOpenShare={handleOpenShare}
          />
        );

      case 'actualite-detail':
        return selectedNews ? (
          <NewsDetailPage
            newsItem={selectedNews}
            onBack={() => navigateTo('actualites')}
            onOpenShare={handleOpenShare}
            onAddLike={handleAddNewsLike}
            onAddComment={handleAddNewsComment}
          />
        ) : (
          <NewsView
            news={news}
            onSelectNews={(item) => navigateTo('actualite-detail', { newsItem: item })}
            onOpenShare={handleOpenShare}
          />
        );

      case 'departements':
        return (
          <DepartementsView
            departments={departments}
            onSelectDepartment={(dept) => navigateTo('departement-detail', { department: dept })}
            onOpenShare={handleOpenShare}
          />
        );

      case 'departement-detail':
        return selectedDepartment ? (
          <DepartmentDetailPage
            department={selectedDepartment}
            onBack={() => navigateTo('departements')}
            onOpenShare={handleOpenShare}
          />
        ) : (
          <DepartementsView
            departments={departments}
            onSelectDepartment={(dept) => navigateTo('departement-detail', { department: dept })}
            onOpenShare={handleOpenShare}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-church-light text-church-dark selection:bg-church-blue/20">
      <Header
        activePage={activePage}
        onNavigate={(p) => navigateTo(p)}
        onOpenNotifications={() => setIsNotificationOpen(true)}
        logoUrl={officialLogoUrl}
        parishName={churchSettings.parishName}
        isAdminAuthenticated={authStatus.authenticated}
      />

      <main className="flex-1">{renderPageContent()}</main>

      {activePage !== 'admin' && (
        <SiteFooter
          onNavigate={(p) => navigateTo(p)}
          logoUrl={officialLogoUrl}
          churchSettings={churchSettings}
          onSecretTrigger={openHiddenAdmin}
        />
      )}

      {activePage !== 'admin' && (
        <MobileBottomNav
          activePage={activePage}
          onNavigate={(p) => navigateTo(p)}
          onOpenNotifications={() => setIsNotificationOpen(true)}
        />
      )}

      <NotificationModal
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        churchSettings={churchSettings}
      />

      <ShareModal
        isOpen={shareData.isOpen}
        onClose={() => setShareData((prev) => ({ ...prev, isOpen: false }))}
        title={shareData.title}
        url={shareData.url}
        summary={shareData.summary}
      />

      <OfflineIndicator />
    </div>
  );
}
