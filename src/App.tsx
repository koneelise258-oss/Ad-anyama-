import React, { useState, useEffect, useCallback } from 'react';
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
  ItemComment
} from './types';
import {
  INITIAL_CULTES,
  INITIAL_EVENTS,
  INITIAL_NEWS,
  INITIAL_ALBUMS,
  INITIAL_DEPARTMENTS,
  DEFAULT_SITE_IMAGES,
  DEFAULT_HERO_CONTENT
} from './mockData';
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
import { ShareModal } from './components/ShareModal';
import { NotificationModal } from './components/NotificationModal';
import { SiteFooter } from './components/SiteFooter';

export default function App() {
  // Navigation & Sub-routing State
  const [activePage, setActivePage] = useState<PageView>('accueil');
  const [adminSubPage, setAdminSubPage] = useState<AdminSubPage>('dashboard');

  // Persistence for Official Logo
  const [officialLogoUrl, setOfficialLogoUrl] = useState<string | null>(() => {
    try {
      return localStorage.getItem('eeadci_official_logo') || null;
    } catch {
      return null;
    }
  });

  // Persistence for Site Images (Hero background, pastor, choir, youth)
  const [siteImages, setSiteImages] = useState<SiteImages>(() => {
    try {
      const saved = localStorage.getItem('eeadci_site_images');
      return saved ? { ...DEFAULT_SITE_IMAGES, ...JSON.parse(saved) } : DEFAULT_SITE_IMAGES;
    } catch {
      return DEFAULT_SITE_IMAGES;
    }
  });

  // Persistence for Hero page copywriting
  const [heroContent, setHeroContent] = useState<HeroContent>(() => {
    try {
      const saved = localStorage.getItem('eeadci_hero_content');
      return saved ? { ...DEFAULT_HERO_CONTENT, ...JSON.parse(saved) } : DEFAULT_HERO_CONTENT;
    } catch {
      return DEFAULT_HERO_CONTENT;
    }
  });

  // State with LocalStorage fallbacks for full website continuity
  const [cultes, setCultes] = useState<Culte[]>(() => {
    try {
      const saved = localStorage.getItem('eeadci_cultes');
      return saved ? JSON.parse(saved) : INITIAL_CULTES;
    } catch {
      return INITIAL_CULTES;
    }
  });

  const [events, setEvents] = useState<EventItem[]>(() => {
    try {
      const saved = localStorage.getItem('eeadci_events');
      return saved ? JSON.parse(saved) : INITIAL_EVENTS;
    } catch {
      return INITIAL_EVENTS;
    }
  });

  const [news, setNews] = useState<NewsItem[]>(() => {
    try {
      const saved = localStorage.getItem('eeadci_news');
      return saved ? JSON.parse(saved) : INITIAL_NEWS;
    } catch {
      return INITIAL_NEWS;
    }
  });

  const [albums, setAlbums] = useState<AlbumItem[]>(() => {
    try {
      const saved = localStorage.getItem('eeadci_albums');
      return saved ? JSON.parse(saved) : INITIAL_ALBUMS;
    } catch {
      return INITIAL_ALBUMS;
    }
  });

  const [departments, setDepartments] = useState<DepartmentItem[]>(() => {
    try {
      const saved = localStorage.getItem('eeadci_departments');
      return saved ? JSON.parse(saved) : INITIAL_DEPARTMENTS;
    } catch {
      return INITIAL_DEPARTMENTS;
    }
  });

  // Le public ne voit que les cultes publiés (pas les brouillons ni les programmés)
  const publicCultes = cultes.filter((c) => c.status === 'publie');

  // Selected entities for dedicated full-page views
  const [selectedCulte, setSelectedCulte] = useState<Culte | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [selectedAlbum, setSelectedAlbum] = useState<AlbumItem | null>(null);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentItem | null>(null);

  // Quick Action Modals (only for quick non-page interactions)
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


  // Helper to build URL query string for pages
  const buildQueryUrl = (
    page: PageView,
    params?: { id?: string; subpage?: AdminSubPage }
  ) => {
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    const sp = new URLSearchParams();

    if (page === 'accueil') {
      sp.set('page', 'accueil');
    } else if (page === 'cultes') {
      sp.set('page', 'cultes');
    } else if (page === 'culte-detail' && params?.id) {
      sp.set('page', 'culte');
      sp.set('id', params.id);
    } else if (page === 'evenements') {
      sp.set('page', 'evenements');
    } else if (page === 'evenement-detail' && params?.id) {
      sp.set('page', 'evenement');
      sp.set('id', params.id);
    } else if (page === 'galerie') {
      sp.set('page', 'galerie');
    } else if (page === 'album-detail' && params?.id) {
      sp.set('page', 'album');
      sp.set('id', params.id);
    } else if (page === 'actualites') {
      sp.set('page', 'actualites');
    } else if (page === 'actualite-detail' && params?.id) {
      sp.set('page', 'actualite');
      sp.set('id', params.id);
    } else if (page === 'departements') {
      sp.set('page', 'departements');
    } else if (page === 'departement-detail' && params?.id) {
      sp.set('page', 'departement');
      sp.set('id', params.id);
    } else if (page === 'admin') {
      sp.set('page', 'admin');
      if (params?.subpage) {
        sp.set('subpage', params.subpage);
      }
    }

    return `${origin}${pathname}?${sp.toString()}`;
  };

  // Navigates and syncs with Browser History
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
      setActivePage(page);

      if (opts?.culte) setSelectedCulte(opts.culte);
      if (opts?.event) setSelectedEvent(opts.event);
      if (opts?.album) setSelectedAlbum(opts.album);
      if (opts?.newsItem) setSelectedNews(opts.newsItem);
      if (opts?.department) setSelectedDepartment(opts.department);
      if (opts?.adminSubPage) setAdminSubPage(opts.adminSubPage);

      const targetId =
        opts?.culte?.id ||
        opts?.event?.id ||
        opts?.album?.id ||
        opts?.newsItem?.id ||
        opts?.department?.id;

      const url = buildQueryUrl(page, {
        id: targetId,
        subpage: opts?.adminSubPage || (page === 'admin' ? adminSubPage : undefined)
      });

      window.history.pushState(
        {
          page,
          targetId,
          subpage: opts?.adminSubPage || adminSubPage
        },
        '',
        url
      );

      // Scroll smoothly to top on page transition
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [adminSubPage]
  );

  // Restore state from URL & listen to browser/phone Back & Forward buttons
  useEffect(() => {
    const parseUrlAndApply = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const pageParam = params.get('page');
        const idParam = params.get('id');
        const subpageParam = params.get('subpage') as AdminSubPage | null;

        // Legacy format fallback: ?culte=... or ?dept=...
        const legacyCulte = params.get('culte');
        const legacyDept = params.get('dept');

        if (pageParam === 'culte' || legacyCulte) {
          const cid = idParam || legacyCulte;
          const found = publicCultes.find(c => c.id === cid);
          if (found) {
            setSelectedCulte(found);
            setActivePage('culte-detail');
          } else {
            setActivePage('cultes'); // lien périmé : on montre la liste plutôt qu’un autre culte
          }
        } else if (pageParam === 'evenement' && idParam) {
          const found = events.find(e => e.id === idParam);
          if (found) {
            setSelectedEvent(found);
            setActivePage('evenement-detail');
          } else setActivePage('evenements');
        } else if (pageParam === 'album' && idParam) {
          const found = albums.find(a => a.id === idParam);
          if (found) {
            setSelectedAlbum(found);
            setActivePage('album-detail');
          } else setActivePage('galerie');
        } else if (pageParam === 'actualite' && idParam) {
          const found = news.find(n => n.id === idParam);
          if (found) {
            setSelectedNews(found);
            setActivePage('actualite-detail');
          } else setActivePage('actualites');
        } else if (pageParam === 'departement' || legacyDept) {
          const did = idParam || legacyDept;
          const found = departments.find(d => d.id === did);
          if (found) {
            setSelectedDepartment(found);
            setActivePage('departement-detail');
          } else setActivePage('departements');
        } else if (pageParam === 'admin') {
          setActivePage('admin');
          if (subpageParam) {
            setAdminSubPage(subpageParam);
          }
        } else if (pageParam === 'cultes') {
          setActivePage('cultes');
        } else if (pageParam === 'evenements') {
          setActivePage('evenements');
        } else if (pageParam === 'galerie') {
          setActivePage('galerie');
        } else if (pageParam === 'actualites') {
          setActivePage('actualites');
        } else if (pageParam === 'departements') {
          setActivePage('departements');
        } else {
          setActivePage('accueil');
        }
      } catch {
        setActivePage('accueil');
      }
    };

    parseUrlAndApply();

    const handlePopState = () => {
      parseUrlAndApply();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [cultes, events, albums, news, departments]);

  // Persist official logo in localStorage
  const handleUpdateLogoUrl = (url: string | null) => {
    setOfficialLogoUrl(url);
    try {
      if (url) {
        localStorage.setItem('eeadci_official_logo', url);
      } else {
        localStorage.removeItem('eeadci_official_logo');
      }
    } catch {
      // Storage unavailable fallback
    }
  };

  // Persist site-wide images
  const handleUpdateSiteImages = (newImages: SiteImages) => {
    setSiteImages(newImages);
    try {
      localStorage.setItem('eeadci_site_images', JSON.stringify(newImages));
    } catch {}
  };

  // Persist hero copy
  const handleUpdateHeroContent = (newContent: HeroContent) => {
    setHeroContent(newContent);
    try {
      localStorage.setItem('eeadci_hero_content', JSON.stringify(newContent));
    } catch {}
  };

  // Reactions handler for cultes
  const handleAddReaction = (culteId: string, type: 'likes' | 'hearts' | 'prayers') => {
    setCultes(prev => {
      const updated = prev.map(c => {
        if (c.id === culteId) {
          return {
            ...c,
            reactions: {
              ...c.reactions,
              [type]: c.reactions[type] + 1
            }
          };
        }
        return c;
      });
      try {
        localStorage.setItem('eeadci_cultes', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    if (selectedCulte && selectedCulte.id === culteId) {
      setSelectedCulte(prev =>
        prev
          ? {
              ...prev,
              reactions: {
                ...prev.reactions,
                [type]: prev.reactions[type] + 1
              }
            }
          : null
      );
    }
  };

  // Comments handler for cultes (Auto-published immediately)
  const handleAddComment = (culteId: string, authorName: string, text: string) => {
    const culteItem = cultes.find(c => c.id === culteId);
    const newComment: ItemComment = {
      id: `comm-${Date.now()}`,
      targetId: culteId,
      targetType: 'culte',
      targetTitle: culteItem?.title || 'Culte',
      authorName,
      text,
      date: 'À l’instant',
      status: 'auto-publie'
    };

    setCultes(prev => {
      const updated = prev.map(c => {
        if (c.id === culteId) {
          return {
            ...c,
            comments: [newComment, ...c.comments]
          };
        }
        return c;
      });
      try {
        localStorage.setItem('eeadci_cultes', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    if (selectedCulte && selectedCulte.id === culteId) {
      setSelectedCulte(prev =>
        prev
          ? {
              ...prev,
              comments: [newComment, ...prev.comments]
            }
          : null
      );
    }
  };

  // Report comment
  const handleReportComment = (commentId: string) => {
    setCultes(prev => {
      const updated = prev.map(c => ({
        ...c,
        comments: c.comments.map(comm =>
          comm.id === commentId ? { ...comm, reported: true } : comm
        )
      }));
      try {
        localStorage.setItem('eeadci_cultes', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Event registration toggle
  const handleToggleRegisterEvent = (eventId: string) => {
    setEvents(prev => {
      const updated = prev.map(ev => {
        if (ev.id === eventId) {
          const nextStatus = !ev.isRegistered;
          return {
            ...ev,
            isRegistered: nextStatus,
            attendeesCount: nextStatus ? ev.attendeesCount + 1 : ev.attendeesCount - 1
          };
        }
        return ev;
      });
      try {
        localStorage.setItem('eeadci_events', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    if (selectedEvent && selectedEvent.id === eventId) {
      setSelectedEvent(prev =>
        prev
          ? {
              ...prev,
              isRegistered: !prev.isRegistered,
              attendeesCount: !prev.isRegistered
                ? prev.attendeesCount + 1
                : prev.attendeesCount - 1
            }
          : null
      );
    }
  };

  // Event like handler
  const handleAddEventLike = (eventId: string) => {
    setEvents(prev => {
      const updated = prev.map(ev =>
        ev.id === eventId ? { ...ev, likes: (ev.likes || 0) + 1 } : ev
      );
      try {
        localStorage.setItem('eeadci_events', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    if (selectedEvent && selectedEvent.id === eventId) {
      setSelectedEvent(prev =>
        prev ? { ...prev, likes: (prev.likes || 0) + 1 } : null
      );
    }
  };

  // Event comment handler (Auto-published immediately)
  const handleAddEventComment = (eventId: string, authorName: string, text: string) => {
    const evItem = events.find(e => e.id === eventId);
    const newComment: ItemComment = {
      id: `evcomm-${Date.now()}`,
      targetId: eventId,
      targetType: 'evenement',
      targetTitle: evItem?.title || 'Événement',
      authorName,
      text,
      date: 'À l’instant',
      status: 'auto-publie'
    };

    setEvents(prev => {
      const updated = prev.map(ev =>
        ev.id === eventId
          ? { ...ev, comments: [newComment, ...(ev.comments || [])] }
          : ev
      );
      try {
        localStorage.setItem('eeadci_events', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    if (selectedEvent && selectedEvent.id === eventId) {
      setSelectedEvent(prev =>
        prev ? { ...prev, comments: [newComment, ...(prev.comments || [])] } : null
      );
    }
  };

  // Event poll voting handler
  const handleVoteEventPoll = (eventId: string, optionId: string) => {
    setEvents(prev => {
      const updated = prev.map(ev => {
        if (ev.id !== eventId || !ev.poll) return ev;
        const newOptions = ev.poll.options.map(opt =>
          opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
        );
        return {
          ...ev,
          poll: {
            ...ev.poll,
            options: newOptions,
            totalVotes: (ev.poll.totalVotes || 0) + 1
          }
        };
      });
      try {
        localStorage.setItem('eeadci_events', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    if (selectedEvent && selectedEvent.id === eventId && selectedEvent.poll) {
      setSelectedEvent(prev => {
        if (!prev || !prev.poll) return prev;
        const newOptions = prev.poll.options.map(opt =>
          opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
        );
        return {
          ...prev,
          poll: {
            ...prev.poll,
            options: newOptions,
            totalVotes: (prev.poll.totalVotes || 0) + 1
          }
        };
      });
    }
  };

  // News like handler
  const handleAddNewsLike = (newsId: string) => {
    setNews(prev => {
      const updated = prev.map(n =>
        n.id === newsId ? { ...n, likes: (n.likes || 0) + 1 } : n
      );
      try {
        localStorage.setItem('eeadci_news', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    if (selectedNews && selectedNews.id === newsId) {
      setSelectedNews(prev =>
        prev ? { ...prev, likes: (prev.likes || 0) + 1 } : null
      );
    }
  };

  // News comment handler (Auto-published immediately)
  const handleAddNewsComment = (newsId: string, authorName: string, text: string) => {
    const nItem = news.find(n => n.id === newsId);
    const newComment: ItemComment = {
      id: `ncomm-${Date.now()}`,
      targetId: newsId,
      targetType: 'actualite',
      targetTitle: nItem?.title || 'Actualité',
      authorName,
      text,
      date: 'À l’instant',
      status: 'auto-publie'
    };

    setNews(prev => {
      const updated = prev.map(n =>
        n.id === newsId
          ? { ...n, comments: [newComment, ...(n.comments || [])] }
          : n
      );
      try {
        localStorage.setItem('eeadci_news', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    if (selectedNews && selectedNews.id === newsId) {
      setSelectedNews(prev =>
        prev ? { ...prev, comments: [newComment, ...(prev.comments || [])] } : null
      );
    }
  };

  // Unified moderation actions: Garder (approuver) ou Retirer (supprimer)
  const handleKeepComment = (
    commentId: string,
    targetType: 'culte' | 'evenement' | 'actualite',
    targetId: string
  ) => {
    if (targetType === 'culte') {
      setCultes(prev => {
        const next = prev.map(c =>
          c.id === targetId
            ? {
                ...c,
                comments: c.comments.map(cm =>
                  cm.id === commentId ? { ...cm, status: 'approuve' as const } : cm
                )
              }
            : c
        );
        try {
          localStorage.setItem('eeadci_cultes', JSON.stringify(next));
        } catch {}
        return next;
      });
      if (selectedCulte?.id === targetId) {
        setSelectedCulte(prev =>
          prev
            ? {
                ...prev,
                comments: prev.comments.map(cm =>
                  cm.id === commentId ? { ...cm, status: 'approuve' as const } : cm
                )
              }
            : null
        );
      }
    } else if (targetType === 'evenement') {
      setEvents(prev => {
        const next = prev.map(ev =>
          ev.id === targetId
            ? {
                ...ev,
                comments: (ev.comments || []).map(cm =>
                  cm.id === commentId ? { ...cm, status: 'approuve' as const } : cm
                )
              }
            : ev
        );
        try {
          localStorage.setItem('eeadci_events', JSON.stringify(next));
        } catch {}
        return next;
      });
      if (selectedEvent?.id === targetId) {
        setSelectedEvent(prev =>
          prev
            ? {
                ...prev,
                comments: (prev.comments || []).map(cm =>
                  cm.id === commentId ? { ...cm, status: 'approuve' as const } : cm
                )
              }
            : null
        );
      }
    } else if (targetType === 'actualite') {
      setNews(prev => {
        const next = prev.map(n =>
          n.id === targetId
            ? {
                ...n,
                comments: (n.comments || []).map(cm =>
                  cm.id === commentId ? { ...cm, status: 'approuve' as const } : cm
                )
              }
            : n
        );
        try {
          localStorage.setItem('eeadci_news', JSON.stringify(next));
        } catch {}
        return next;
      });
      if (selectedNews?.id === targetId) {
        setSelectedNews(prev =>
          prev
            ? {
                ...prev,
                comments: (prev.comments || []).map(cm =>
                  cm.id === commentId ? { ...cm, status: 'approuve' as const } : cm
                )
              }
            : null
        );
      }
    }
  };

  const handleRemoveComment = (
    commentId: string,
    targetType: 'culte' | 'evenement' | 'actualite',
    targetId: string
  ) => {
    if (targetType === 'culte') {
      setCultes(prev => {
        const next = prev.map(c =>
          c.id === targetId
            ? { ...c, comments: c.comments.filter(cm => cm.id !== commentId) }
            : c
        );
        try {
          localStorage.setItem('eeadci_cultes', JSON.stringify(next));
        } catch {}
        return next;
      });
      if (selectedCulte?.id === targetId) {
        setSelectedCulte(prev =>
          prev ? { ...prev, comments: prev.comments.filter(cm => cm.id !== commentId) } : null
        );
      }
    } else if (targetType === 'evenement') {
      setEvents(prev => {
        const next = prev.map(ev =>
          ev.id === targetId
            ? { ...ev, comments: (ev.comments || []).filter(cm => cm.id !== commentId) }
            : ev
        );
        try {
          localStorage.setItem('eeadci_events', JSON.stringify(next));
        } catch {}
        return next;
      });
      if (selectedEvent?.id === targetId) {
        setSelectedEvent(prev =>
          prev ? { ...prev, comments: (prev.comments || []).filter(cm => cm.id !== commentId) } : null
        );
      }
    } else if (targetType === 'actualite') {
      setNews(prev => {
        const next = prev.map(n =>
          n.id === targetId
            ? { ...n, comments: (n.comments || []).filter(cm => cm.id !== commentId) }
            : n
        );
        try {
          localStorage.setItem('eeadci_news', JSON.stringify(next));
        } catch {}
        return next;
      });
      if (selectedNews?.id === targetId) {
        setSelectedNews(prev =>
          prev ? { ...prev, comments: (prev.comments || []).filter(cm => cm.id !== commentId) } : null
        );
      }
    }
  };

  // Add new culte
  const handleAddNewCulte = (newCulte: Culte) => {
    setCultes(prev => {
      const updated = [newCulte, ...prev];
      try {
        localStorage.setItem('eeadci_cultes', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Update existing culte (full edit/rectification)
  const handleUpdateCulte = (updatedCulte: Culte) => {
    setCultes(prev => {
      const next = prev.map(c => (c.id === updatedCulte.id ? updatedCulte : c));
      try {
        localStorage.setItem('eeadci_cultes', JSON.stringify(next));
      } catch {}
      return next;
    });
    if (selectedCulte?.id === updatedCulte.id) {
      setSelectedCulte(updatedCulte);
    }
  };

  // Add new event
  const handleAddNewEvent = (newEvent: EventItem) => {
    setEvents(prev => {
      const updated = [newEvent, ...prev];
      try {
        localStorage.setItem('eeadci_events', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Update existing event (full edit/rectification including poster)
  const handleUpdateEvent = (updatedEvent: EventItem) => {
    setEvents(prev => {
      const next = prev.map(e => (e.id === updatedEvent.id ? updatedEvent : e));
      try {
        localStorage.setItem('eeadci_events', JSON.stringify(next));
      } catch {}
      return next;
    });
    if (selectedEvent?.id === updatedEvent.id) {
      setSelectedEvent(updatedEvent);
    }
  };

  // Add new news item
  const handleAddNewNews = (item: NewsItem) => {
    setNews(prev => {
      const updated = [item, ...prev];
      try {
        localStorage.setItem('eeadci_news', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Update existing news item (full edit/rectification including photo)
  const handleUpdateNews = (updatedNews: NewsItem) => {
    setNews(prev => {
      const next = prev.map(n => (n.id === updatedNews.id ? updatedNews : n));
      try {
        localStorage.setItem('eeadci_news', JSON.stringify(next));
      } catch {}
      return next;
    });
    if (selectedNews?.id === updatedNews.id) {
      setSelectedNews(updatedNews);
    }
  };

  // Add new album
  const handleAddNewAlbum = (album: AlbumItem) => {
    setAlbums(prev => {
      const updated = [album, ...prev];
      try {
        localStorage.setItem('eeadci_albums', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Update existing album (full edit/rectification)
  const handleUpdateAlbum = (updatedAlbum: AlbumItem) => {
    setAlbums(prev => {
      const next = prev.map(a => (a.id === updatedAlbum.id ? updatedAlbum : a));
      try {
        localStorage.setItem('eeadci_albums', JSON.stringify(next));
      } catch {}
      return next;
    });
    if (selectedAlbum?.id === updatedAlbum.id) {
      setSelectedAlbum(updatedAlbum);
    }
  };

  // Update department
  const handleUpdateDepartment = (dept: DepartmentItem) => {
    setDepartments(prev => {
      const updated = prev.map(d => (d.id === dept.id ? dept : d));
      try {
        localStorage.setItem('eeadci_departments', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    if (selectedDepartment?.id === dept.id) {
      setSelectedDepartment(dept);
    }
  };

  // Delete handlers
  const handleDeleteCulte = (id: string) => {
    setCultes(prev => {
      const updated = prev.filter(c => c.id !== id);
      try {
        localStorage.setItem('eeadci_cultes', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleDeleteEvent = (id: string) => {
    setEvents(prev => {
      const updated = prev.filter(e => e.id !== id);
      try {
        localStorage.setItem('eeadci_events', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleDeleteNews = (id: string) => {
    setNews(prev => {
      const updated = prev.filter(n => n.id !== id);
      try {
        localStorage.setItem('eeadci_news', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleDeleteAlbum = (id: string) => {
    setAlbums(prev => {
      const updated = prev.filter(a => a.id !== id);
      try {
        localStorage.setItem('eeadci_albums', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Share trigger
  const handleOpenShare = (title: string, summary: string, customParam?: string) => {
    let url = buildQueryUrl(activePage);
    if (customParam) {
      url = `${window.location.origin}${window.location.pathname}?${customParam}`;
    } else if (activePage === 'culte-detail' && selectedCulte) {
      url = buildQueryUrl('culte-detail', { id: selectedCulte.id });
    } else if (activePage === 'evenement-detail' && selectedEvent) {
      url = buildQueryUrl('evenement-detail', { id: selectedEvent.id });
    } else if (activePage === 'album-detail' && selectedAlbum) {
      url = buildQueryUrl('album-detail', { id: selectedAlbum.id });
    } else if (activePage === 'actualite-detail' && selectedNews) {
      url = buildQueryUrl('actualite-detail', { id: selectedNews.id });
    } else if (activePage === 'departement-detail' && selectedDepartment) {
      url = buildQueryUrl('departement-detail', { id: selectedDepartment.id });
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

    setShareData({
      isOpen: true,
      title,
      summary,
      url
    });
  };

  // Main Page Content Renderer
  const renderPageContent = () => {
    if (activePage === 'admin') {
      return (
        <AdminPortal
          onExitAdmin={() => navigateTo('accueil')}
          activeSubPage={adminSubPage}
          onNavigateSubPage={(subPage) => {
            setAdminSubPage(subPage);
            const url = buildQueryUrl('admin', { subpage: subPage });
            window.history.pushState({ page: 'admin', subpage: subPage }, '', url);
          }}
          cultes={cultes}
          events={events}
          news={news}
          albums={albums}
          departments={departments}
          officialLogoUrl={officialLogoUrl}
          onUpdateLogoUrl={handleUpdateLogoUrl}
          siteImages={siteImages}
          onUpdateSiteImages={handleUpdateSiteImages}
          heroContent={heroContent}
          onUpdateHeroContent={handleUpdateHeroContent}
          onAddNewCulte={handleAddNewCulte}
          onUpdateCulte={handleUpdateCulte}
          onAddNewNews={handleAddNewNews}
          onUpdateNews={handleUpdateNews}
          onAddNewEvent={handleAddNewEvent}
          onUpdateEvent={handleUpdateEvent}
          onAddNewAlbum={handleAddNewAlbum}
          onUpdateAlbum={handleUpdateAlbum}
          onUpdateDepartment={handleUpdateDepartment}
          onDeleteCulte={handleDeleteCulte}
          onDeleteEvent={handleDeleteEvent}
          onDeleteNews={handleDeleteNews}
          onDeleteAlbum={handleDeleteAlbum}
          onKeepComment={handleKeepComment}
          onRemoveComment={handleRemoveComment}
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
            onSelectCulte={(culte) => navigateTo('culte-detail', { culte })}
            onSelectEvent={(event) => navigateTo('evenement-detail', { event })}
            onSelectDepartment={(dept) =>
              navigateTo('departement-detail', { department: dept })
            }
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
            onSelectDepartment={(dept) =>
              navigateTo('departement-detail', { department: dept })
            }
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
            onSelectDepartment={(dept) =>
              navigateTo('departement-detail', { department: dept })
            }
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
      />

      <main className="flex-1">
        {renderPageContent()}
      </main>

      {activePage !== 'admin' && (
        <SiteFooter onNavigate={(p) => navigateTo(p)} logoUrl={officialLogoUrl} />
      )}

      {/* Barre de navigation mobile */}
      {activePage !== 'admin' && (
        <MobileBottomNav
          activePage={activePage}
          onNavigate={(p) => navigateTo(p)}
          onOpenNotifications={() => setIsNotificationOpen(true)}
        />
      )}

      {/* Modales légères (partage & rappels de culte) */}
      <NotificationModal
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
      />

      <ShareModal
        isOpen={shareData.isOpen}
        onClose={() => setShareData(prev => ({ ...prev, isOpen: false }))}
        title={shareData.title}
        url={shareData.url}
        summary={shareData.summary}
      />
    </div>
  );
}
