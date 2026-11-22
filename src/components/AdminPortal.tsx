import React, { useEffect, useState } from 'react';
import {
  AdminSubPage,
  AdminUserPublic,
  AdminInvitation,
  AlbumItem,
  ChurchSchedule,
  ChurchSettings,
  Culte,
  CulteDocument,
  CulteServiceType,
  DepartmentItem,
  EventItem,
  HeroContent,
  ItemComment,
  LinkedDriveAccount,
  LinkedDriveFolder,
  MediaItem,
  NewsItem,
  PageView,
  PushNotificationRecord,
  SecurityLogEntry,
  SecuritySettings,
  SiteImages
} from '../types';
import { DEFAULT_CHURCH_SETTINGS, DEFAULT_HERO_CONTENT, DEFAULT_SITE_IMAGES } from '../mockData';
import { api } from '../services/api';
import { extractYoutubeThumbnail, sanitizeUrl, toSafeYoutubeEmbed } from '../utils/security';
import { CULTE_TYPE_LABELS, inferCulteServiceType, sortCultesByDateDesc } from '../utils/cultes';
import { formatPublishedDateTime } from './ui';
import { MediaBatchUploader } from './MediaBatchUploader';
import { GoogleDriveBrowser } from './GoogleDriveBrowser';
import {
  LayoutDashboard,
  BookOpen,
  CalendarDays,
  Newspaper,
  Images,
  Users,
  MessageSquare,
  Palette,
  Settings,
  Shield,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  LogOut,
  ExternalLink,
  Download,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Eye,
  Clock,
  BellRing,
  Heart,
  MessageCircle,
  Send,
  HardDrive,
  Mail,
  UserPlus,
  Film,
  Headphones
} from 'lucide-react';

interface AdminPortalProps {
  currentAdmin: AdminUserPublic;
  activeSubPage: AdminSubPage;
  onNavigateSubPage: (sub: AdminSubPage) => void;
  onExitAdmin: () => void;
  onLogout: () => void;
  cultes: Culte[];
  events: EventItem[];
  news: NewsItem[];
  albums: AlbumItem[];
  departments: DepartmentItem[];
  churchSettings: ChurchSettings;
  heroContent: HeroContent;
  siteImages: SiteImages;
  officialLogoUrl: string | null;
  admins: AdminUserPublic[];
  invitedAdmins: AdminInvitation[];
  security: SecuritySettings;
  securityLogs: SecurityLogEntry[];
  pushSubscribersCount: number;
  pushHistory: PushNotificationRecord[];
  driveAccounts: LinkedDriveAccount[];
  driveFolders: LinkedDriveFolder[];
  onSyncPublicState: (patch: {
    cultes?: Culte[];
    events?: EventItem[];
    news?: NewsItem[];
    albums?: AlbumItem[];
    departments?: DepartmentItem[];
    churchSettings?: ChurchSettings;
    heroContent?: HeroContent;
    siteImages?: SiteImages;
    officialLogoUrl?: string | null;
  }) => void;
  onSyncSecurityState: (patch: {
    admins?: AdminUserPublic[];
    invitedAdmins?: AdminInvitation[];
    security?: SecuritySettings;
    securityLogs?: SecurityLogEntry[];
  }) => void;
  onSyncPushState: (patch: {
    pushSubscribersCount?: number;
    pushHistory?: PushNotificationRecord[];
  }) => void;
  onSyncDriveState: (patch: {
    driveAccounts?: LinkedDriveAccount[];
    driveFolders?: LinkedDriveFolder[];
    albums?: AlbumItem[];
  }) => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  currentAdmin,
  activeSubPage,
  onNavigateSubPage,
  onExitAdmin,
  onLogout,
  cultes,
  events,
  news,
  albums,
  departments,
  churchSettings,
  heroContent,
  siteImages,
  officialLogoUrl,
  admins,
  invitedAdmins,
  security,
  securityLogs,
  pushSubscribersCount,
  pushHistory,
  driveAccounts,
  driveFolders,
  onSyncPublicState,
  onSyncSecurityState,
  onSyncPushState,
  onSyncDriveState
}) => {
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);
  const [confirmDeleteKey, setConfirmDeleteKey] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [pushTitle, setPushTitle] = useState('Assemblées de Dieu d’Anyama');
  const [pushBody, setPushBody] = useState('');
  const [pushTarget, setPushTarget] = useState('/');
  const [sendingPush, setSendingPush] = useState(false);
  const [culteCategoryFilter, setCulteCategoryFilter] = useState<'tous' | CulteServiceType>('tous');
  const [showCulteDrivePicker, setShowCulteDrivePicker] = useState(false);
  const [showEventDrivePicker, setShowEventDrivePicker] = useState(false);
  const [showNewsDrivePicker, setShowNewsDrivePicker] = useState(false);
  const [showAlbumDrivePicker, setShowAlbumDrivePicker] = useState(false);
  const [showHeroDrivePicker, setShowHeroDrivePicker] = useState(false);

  const notify = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ type, msg });
    window.setTimeout(() => {
      setToast((prev) => (prev?.msg === msg ? null : prev));
    }, 4500);
  };

  // ==================== ETATS FORMULAIRES ====================

  // --- Cultes ---
  const emptyCulteForm = (): Culte => {
    const today = new Date().toISOString().slice(0, 10);
    return {
      id: `culte-${Date.now()}`,
      title: '',
      subtitle: '',
      date: today,
      publishedAt: '',
      scheduledDate: '',
      time: '07h30 - 11h00',
      serviceType: inferCulteServiceType({ date: today, title: '' }),
      eventLabel: '',
      preacher: '',
      preacherRole: '',
      moderator: '',
      scriptureRef: '',
      scripturePassage: '',
      sermonSummary: '',
      keyPoints: [],
      liturgy: [],
      coverImage: '',
      photos: [],
      videoUrl: '',
      videoDuration: '',
      hasVideo: false,
      audioUrl: '',
      audioDuration: '',
      mediaItems: [],
      documents: [],
      reactions: { likes: 0, hearts: 0, prayers: 0 },
      comments: [],
      status: 'publie'
    };
  };
  const [editingCulte, setEditingCulte] = useState<Culte | null>(null);
  const [culteKeyPointsText, setCulteKeyPointsText] = useState('');

  const openCulteForm = (existing?: Culte) => {
    const base = existing
      ? {
          ...existing,
          serviceType: existing.serviceType || inferCulteServiceType(existing),
          mediaItems: [...(existing.mediaItems || [])],
          documents: [...(existing.documents || [])]
        }
      : emptyCulteForm();
    setEditingCulte(base);
    setCulteKeyPointsText((base.keyPoints || []).join('\n'));
    setShowCulteDrivePicker(false);
    onNavigateSubPage('cultes-creer');
  };

  const handleSaveCulte = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCulte || !editingCulte.title.trim()) {
      notify('Le titre du culte est requis.', 'err');
      return;
    }
    setSaving(true);
    try {
      const cleanedVideo = editingCulte.videoUrl?.trim() ? toSafeYoutubeEmbed(editingCulte.videoUrl) : '';
      const autoThumb =
        !editingCulte.coverImage && editingCulte.videoUrl
          ? extractYoutubeThumbnail(editingCulte.videoUrl) || ''
          : editingCulte.coverImage;
      const serviceType = editingCulte.serviceType || inferCulteServiceType(editingCulte);
      const payload: Culte = {
        ...editingCulte,
        serviceType,
        eventLabel: serviceType === 'evenement' ? (editingCulte.eventLabel || '').trim() : '',
        publishedAt: editingCulte.publishedAt || new Date().toISOString(),
        coverImage: autoThumb,
        videoUrl: cleanedVideo,
        hasVideo: Boolean(cleanedVideo),
        keyPoints: culteKeyPointsText
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean)
      };
      const exists = cultes.some((c) => c.id === payload.id);
      const res = exists ? await api.updateCulte(payload) : await api.createCulte(payload);
      onSyncPublicState({ cultes: res.cultes });
      setEditingCulte(null);
      onNavigateSubPage('cultes');
      notify(exists ? 'Culte mis à jour.' : 'Culte enregistré.');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erreur d’enregistrement.', 'err');
    } finally {
      setSaving(false);
    }
  };

  // --- Événements ---
  const emptyEventForm = (): EventItem => ({
    id: `evt-${Date.now()}`,
    title: '',
    category: 'Culte spécial',
    date: new Date().toISOString().slice(0, 10),
    time: '',
    location: churchSettings.address || 'Ran-Extension Résidentiel, Anyama',
    description: '',
    speaker: '',
    coverImage: '',
    videoUrl: '',
    audioUrl: '',
    mediaItems: [],
    documents: [],
    attendeesCount: 0,
    likes: 0,
    comments: []
  });
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [eventPollEnabled, setEventPollEnabled] = useState(false);
  const [eventPollQuestion, setEventPollQuestion] = useState('Serez-vous présent(e) à ce rendez-vous ?');
  const [eventPollOptionsText, setEventPollOptionsText] = useState('Oui, je serai présent(e)\nPeut-être\nEn prière avec vous');

  const openEventForm = (existing?: EventItem) => {
    const base = existing
      ? {
          ...existing,
          videoUrl: existing.videoUrl || '',
          audioUrl: existing.audioUrl || '',
          mediaItems: [...(existing.mediaItems || [])],
          documents: [...(existing.documents || [])]
        }
      : emptyEventForm();
    setEditingEvent(base);
    setShowEventDrivePicker(false);
    if (base.poll) {
      setEventPollEnabled(true);
      setEventPollQuestion(base.poll.question);
      setEventPollOptionsText(base.poll.options.map((o) => o.label).join('\n'));
    } else {
      setEventPollEnabled(false);
      setEventPollQuestion('Serez-vous présent(e) à ce rendez-vous ?');
      setEventPollOptionsText('Oui, je serai présent(e)\nPeut-être\nEn prière avec vous');
    }
    onNavigateSubPage('evenements-creer');
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent || !editingEvent.title.trim()) {
      notify('Le titre de l’événement est requis.', 'err');
      return;
    }
    setSaving(true);
    try {
      let poll = editingEvent.poll;
      if (eventPollEnabled) {
        const labels = eventPollOptionsText
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean);
        const existingOpts = editingEvent.poll?.options || [];
        const options = labels.map((label, idx) => ({
          id: existingOpts[idx]?.id || `opt-${idx + 1}`,
          label,
          votes: existingOpts[idx]?.label === label ? existingOpts[idx].votes : 0
        }));
        poll = {
          question: eventPollQuestion.trim() || 'Serez-vous présent(e) ?',
          options,
          totalVotes: options.reduce((acc, o) => acc + o.votes, 0)
        };
      } else {
        poll = undefined;
      }

      const cleanedVideo = editingEvent.videoUrl?.trim() ? toSafeYoutubeEmbed(editingEvent.videoUrl) : '';
      const cleanedAudio = editingEvent.audioUrl?.trim() ? sanitizeUrl(editingEvent.audioUrl, false) : '';
      const payload: EventItem = {
        ...editingEvent,
        videoUrl: cleanedVideo,
        audioUrl: cleanedAudio,
        poll
      };
      const exists = events.some((ev) => ev.id === payload.id);
      const res = exists ? await api.updateEvent(payload) : await api.createEvent(payload);
      onSyncPublicState({ events: res.events });
      setEditingEvent(null);
      onNavigateSubPage('evenements');
      notify(exists ? 'Événement modifié.' : 'Événement publié.');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erreur d’enregistrement.', 'err');
    } finally {
      setSaving(false);
    }
  };

  // --- Actualités ---
  const emptyNewsForm = (): NewsItem => ({
    id: `news-${Date.now()}`,
    title: '',
    category: 'Communiqué officiel',
    date: new Date().toISOString().slice(0, 10),
    publishedAt: '',
    author: currentAdmin.name,
    authorRole: currentAdmin.role,
    summary: '',
    fullContent: '',
    coverImage: '',
    videoUrl: '',
    audioUrl: '',
    mediaItems: [],
    documents: [],
    isUrgent: false,
    readsCount: 0,
    likes: 0,
    comments: []
  });
  const [editingNews, setEditingNews] = useState<NewsItem | null>(null);

  const openNewsForm = (existing?: NewsItem) => {
    setEditingNews(
      existing
        ? {
            ...existing,
            videoUrl: existing.videoUrl || '',
            audioUrl: existing.audioUrl || '',
            mediaItems: [...(existing.mediaItems || [])],
            documents: [...(existing.documents || [])]
          }
        : emptyNewsForm()
    );
    setShowNewsDrivePicker(false);
    onNavigateSubPage('actualites-creer');
  };

  const handleSaveNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNews || !editingNews.title.trim()) {
      notify('Le titre de l’actualité est requis.', 'err');
      return;
    }
    setSaving(true);
    try {
      const exists = news.some((n) => n.id === editingNews.id);
      const nowIso = new Date().toISOString();
      const cleanedVideo = editingNews.videoUrl?.trim() ? toSafeYoutubeEmbed(editingNews.videoUrl) : '';
      const cleanedAudio = editingNews.audioUrl?.trim() ? sanitizeUrl(editingNews.audioUrl, false) : '';
      const payload: NewsItem = exists
        ? {
            ...editingNews,
            videoUrl: cleanedVideo,
            audioUrl: cleanedAudio,
            publishedAt: editingNews.publishedAt || nowIso
          }
        : {
            ...editingNews,
            videoUrl: cleanedVideo,
            audioUrl: cleanedAudio,
            date: nowIso.slice(0, 10),
            publishedAt: nowIso
          };
      const res = exists ? await api.updateNews(payload) : await api.createNews(payload);
      onSyncPublicState({ news: res.news });
      setEditingNews(null);
      onNavigateSubPage('actualites');
      notify(exists ? 'Actualité mise à jour.' : 'Actualité publiée avec date et heure automatiques.');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erreur d’enregistrement.', 'err');
    } finally {
      setSaving(false);
    }
  };

  // --- Galerie ---
  const emptyAlbumForm = (): AlbumItem => ({
    id: `alb-${Date.now()}`,
    title: '',
    category: 'Cultes',
    type: 'photo',
    date: new Date().toISOString().slice(0, 10),
    coverImage: '',
    mediaCount: 0,
    items: [],
    description: ''
  });
  const [editingAlbum, setEditingAlbum] = useState<AlbumItem | null>(null);
  const [videoItemUrl, setVideoItemUrl] = useState('');
  const [videoItemCaption, setVideoItemCaption] = useState('');

  const openAlbumForm = (existing?: AlbumItem) => {
    setEditingAlbum(existing ? { ...existing, items: [...(existing.items || [])] } : emptyAlbumForm());
    setVideoItemUrl('');
    setVideoItemCaption('');
    setShowAlbumDrivePicker(false);
    onNavigateSubPage('galerie-creer');
  };

  const handleSaveAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAlbum || !editingAlbum.title.trim()) {
      notify('Le titre de l’album est requis.', 'err');
      return;
    }
    setSaving(true);
    try {
      const payload: AlbumItem = {
        ...editingAlbum,
        coverImage: editingAlbum.coverImage || editingAlbum.items[0]?.url || '',
        mediaCount: editingAlbum.items.length
      };
      const exists = albums.some((a) => a.id === payload.id);
      const res = exists ? await api.updateAlbum(payload) : await api.createAlbum(payload);
      onSyncPublicState({ albums: res.albums });
      setEditingAlbum(null);
      onNavigateSubPage('galerie');
      notify(exists ? 'Album mis à jour.' : 'Album publié.');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erreur d’enregistrement.', 'err');
    } finally {
      setSaving(false);
    }
  };

  // --- Départements ---
  const emptyDepartmentForm = (): DepartmentItem => ({
    id: `dept-${Date.now()}`,
    code: '',
    name: '',
    isNameConfirmed: true,
    tagline: '',
    description: '',
    leader: '',
    leaderRole: '',
    meetingSchedule: '',
    meetingLocation: '',
    activities: [],
    coverImage: '',
    galleryImages: [],
    documents: [],
    contactPhone: '',
    contactEmail: ''
  });
  const [editingDept, setEditingDept] = useState<DepartmentItem | null>(null);
  const [deptActivitiesText, setDeptActivitiesText] = useState('');

  const handleSelectDeptEdit = (d: DepartmentItem) => {
    setEditingDept({ ...d, galleryImages: [...(d.galleryImages || [])], documents: [...(d.documents || [])] });
    setDeptActivitiesText((d.activities || []).join('\n'));
  };

  const handleSaveDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDept || !editingDept.name.trim()) {
      notify('Le nom du département est requis.', 'err');
      return;
    }
    setSaving(true);
    try {
      const payload: DepartmentItem = {
        ...editingDept,
        code: editingDept.code.trim() || editingDept.name.slice(0, 6).toUpperCase(),
        activities: deptActivitiesText
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean)
      };
      const exists = departments.some((d) => d.id === payload.id);
      const res = exists ? await api.updateDepartment(payload) : await api.createDepartment(payload);
      onSyncPublicState({ departments: res.departments });
      setEditingDept(null);
      notify(exists ? 'Département mis à jour.' : 'Nouveau département ajouté.');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erreur d’enregistrement.', 'err');
    } finally {
      setSaving(false);
    }
  };

  // --- Commentaires unifiés ---
  const [commentFilter, setCommentFilter] = useState<'tous' | 'signales' | 'auto-publie' | 'approuve'>('tous');

  const allComments: ItemComment[] = [
    ...cultes.flatMap((c) => (c.comments || []).map((cm) => ({ ...cm, targetType: 'culte' as const, targetId: c.id, targetTitle: c.title }))),
    ...events.flatMap((e) => (e.comments || []).map((cm) => ({ ...cm, targetType: 'evenement' as const, targetId: e.id, targetTitle: e.title }))),
    ...news.flatMap((n) => (n.comments || []).map((cm) => ({ ...cm, targetType: 'actualite' as const, targetId: n.id, targetTitle: n.title })))
  ];

  const filteredComments = allComments.filter((cm) => {
    if (commentFilter === 'signales') return Boolean(cm.reported);
    if (commentFilter === 'auto-publie') return cm.status === 'auto-publie';
    if (commentFilter === 'approuve') return cm.status === 'approuve';
    return true;
  });

  // --- Médias / Hero / Bannière ---
  const [heroDraft, setHeroDraft] = useState<HeroContent>(heroContent);
  const [imagesDraft, setImagesDraft] = useState<SiteImages>(siteImages);
  const [logoDraft, setLogoDraft] = useState<string | null>(officialLogoUrl);
  const [bannerDraft, setBannerDraft] = useState(
    churchSettings.announcementBanner || { enabled: false, text: '', linkPage: 'evenements' as PageView }
  );

  useEffect(() => {
    setHeroDraft(heroContent);
  }, [heroContent]);

  useEffect(() => {
    setImagesDraft(siteImages);
  }, [siteImages]);

  useEffect(() => {
    setLogoDraft(officialLogoUrl);
  }, [officialLogoUrl]);

  useEffect(() => {
    setBannerDraft(
      churchSettings.announcementBanner || { enabled: false, text: '', linkPage: 'evenements' as PageView }
    );
  }, [churchSettings.announcementBanner]);

  const handleSaveMediaAndHero = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.updateSettings({
        heroContent: heroDraft,
        siteImages: imagesDraft,
        officialLogoUrl: logoDraft,
        churchSettings: {
          ...churchSettings,
          announcementBanner: bannerDraft
        }
      });
      onSyncPublicState({
        heroContent: res.heroContent,
        siteImages: res.siteImages,
        officialLogoUrl: res.officialLogoUrl,
        churchSettings: res.churchSettings
      });
      notify('Textes d’accueil, bannière et médias enregistrés.');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erreur de sauvegarde.', 'err');
    } finally {
      setSaving(false);
    }
  };

  // --- Personnalisation & Paramètres ---
  const [settingsDraft, setSettingsDraft] = useState<ChurchSettings>({
    ...DEFAULT_CHURCH_SETTINGS,
    ...churchSettings,
    theme: churchSettings.theme || DEFAULT_CHURCH_SETTINGS.theme,
    homeSections: churchSettings.homeSections || DEFAULT_CHURCH_SETTINGS.homeSections,
    schedules: churchSettings.schedules || DEFAULT_CHURCH_SETTINGS.schedules
  });

  useEffect(() => {
    setSettingsDraft({
      ...DEFAULT_CHURCH_SETTINGS,
      ...churchSettings,
      theme: churchSettings.theme || DEFAULT_CHURCH_SETTINGS.theme,
      homeSections: churchSettings.homeSections || DEFAULT_CHURCH_SETTINGS.homeSections,
      schedules: churchSettings.schedules || DEFAULT_CHURCH_SETTINGS.schedules
    });
  }, [churchSettings]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.updateSettings({ churchSettings: settingsDraft });
      onSyncPublicState({ churchSettings: res.churchSettings });
      notify('Apparence, horaires et coordonnées enregistrés.');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erreur de sauvegarde.', 'err');
    } finally {
      setSaving(false);
    }
  };

  const addScheduleRow = () => {
    setSettingsDraft((prev) => ({
      ...prev,
      schedules: [...(prev.schedules || []), { id: `sch-${Date.now()}`, day: 'Mercredi', name: '', time: '' }]
    }));
  };

  const updateScheduleRow = (idx: number, field: keyof ChurchSchedule, value: string) => {
    setSettingsDraft((prev) => ({
      ...prev,
      schedules: prev.schedules.map((s, i) => (i === idx ? { ...s, [field]: value } : s))
    }));
  };

  const removeScheduleRow = (idx: number) => {
    setSettingsDraft((prev) => ({
      ...prev,
      schedules: prev.schedules.filter((_, i) => i !== idx)
    }));
  };

  // --- Cybersécurité & Liste blanche Google ---
  const [secDraft, setSecDraft] = useState<SecuritySettings>(security);

  useEffect(() => {
    setSecDraft(security);
  }, [security]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState('Administrateur');
  const [lastDispatchInfo, setLastDispatchInfo] = useState<{
    email: string;
    mailtoUrl: string;
    emailSent: boolean;
  } | null>(null);

  const handleSaveSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[a-z0-9_-]{4,60}$/i.test(secDraft.secretGateSlug.trim())) {
      notify('Le chemin caché doit contenir 4 à 60 caractères alphanumériques (- ou _).', 'err');
      return;
    }
    setSaving(true);
    try {
      const res = await api.updateSecurity(secDraft);
      onSyncSecurityState({ security: res.security, securityLogs: res.securityLogs });
      notify('Paramètres de cybersécurité mis à jour.');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erreur sécurité.', 'err');
    } finally {
      setSaving(false);
    }
  };

  const handleInviteAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) {
      notify('Veuillez saisir une adresse Google valide.', 'err');
      return;
    }
    setSaving(true);
    try {
      const res = await api.inviteAdmin({
        email: inviteEmail.trim(),
        name: inviteName.trim() || inviteEmail.trim().split('@')[0],
        role: inviteRole.trim() || 'Administrateur'
      });
      onSyncSecurityState({
        admins: res.admins,
        invitedAdmins: res.invitedAdmins,
        securityLogs: res.securityLogs
      });
      if (res.mailtoUrl) {
        setLastDispatchInfo({
          email: inviteEmail.trim(),
          mailtoUrl: res.mailtoUrl,
          emailSent: res.emailSent
        });
      }
      setInviteEmail('');
      setInviteName('');
      notify(
        res.emailSent
          ? 'E-mail autorisé et notification envoyée. La personne peut se connecter via « Continuer avec Google ».'
          : 'Adresse Google autorisée ! Elle peut maintenant cliquer sur « Continuer avec Google » pour entrer.'
      );
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erreur lors de l’ajout.', 'err');
    } finally {
      setSaving(false);
    }
  };

  const handleSendResetEmailToInvite = async (email: string) => {
    setSaving(true);
    try {
      const res = await api.sendAdminResetEmail(email);
      onSyncSecurityState({
        invitedAdmins: res.invitedAdmins,
        securityLogs: res.securityLogs
      });
      setLastDispatchInfo({
        email,
        mailtoUrl: res.mailtoUrl,
        emailSent: res.emailSent
      });
      notify(
        res.emailSent
          ? `E-mail d’accès envoyé à ${email}.`
          : `Lien d’accès prêt pour ${email}.`
      );
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Impossible d’envoyer la notification.', 'err');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadBackup = async () => {
    try {
      const res = await fetch(api.downloadBackupUrl(), { credentials: 'include' });
      if (!res.ok) throw new Error('Téléchargement refusé.');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sauvegarde-ad-anyama-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      notify('Sauvegarde téléchargée.');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Échec du téléchargement.', 'err');
    }
  };

  // ==================== MENU LATÉRAL ====================
  const menuItems: Array<{ id: AdminSubPage; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number }> = [
    { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { id: 'cultes', label: 'Cultes & Prédications', icon: BookOpen, badge: cultes.length },
    { id: 'evenements', label: 'Événements & Affiches', icon: CalendarDays, badge: events.length },
    { id: 'actualites', label: 'Actualités', icon: Newspaper, badge: news.length },
    { id: 'galerie', label: 'Galerie & Lots photos', icon: Images, badge: albums.length },
    { id: 'drive', label: 'Google Drive (Photos)', icon: HardDrive, badge: driveAccounts.length || undefined },
    { id: 'departements', label: 'Départements', icon: Users, badge: departments.length },
    {
      id: 'commentaires',
      label: 'Commentaires',
      icon: MessageSquare,
      badge: allComments.filter((c) => c.reported).length || undefined
    },
    { id: 'medias', label: 'Accueil, Logo & Bannière', icon: Palette },
    { id: 'parametres', label: 'Apparence & Horaires', icon: Settings },
    { id: 'securite', label: 'Cybersécurité & Accès', icon: Shield }
  ];

  const isMenuActive = (id: AdminSubPage) =>
    activeSubPage === id ||
    (id === 'cultes' && activeSubPage === 'cultes-creer') ||
    (id === 'evenements' && activeSubPage === 'evenements-creer') ||
    (id === 'actualites' && activeSubPage === 'actualites-creer') ||
    (id === 'galerie' && activeSubPage === 'galerie-creer');

  return (
    <div className="page py-6 sm:py-8 animate-soft-in">
      {/* Barre supérieure Admin */}
      <div className="surface mb-6 flex flex-wrap items-center justify-between gap-4 p-4 sm:px-6">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-church-tint px-2.5 py-0.5 text-xs font-semibold text-church-blue">
            <Shield className="h-3.5 w-3.5" /> Espace de gestion sécurisé
          </span>
          <h1 className="mt-1 text-xl sm:text-2xl">
            Administration — {currentAdmin.name}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={onExitAdmin} className="btn-secondary min-h-[40px] text-xs sm:text-sm">
            <ExternalLink className="h-4 w-4 text-church-blue" /> Voir le site public
          </button>
          <button
            onClick={onLogout}
            className="btn-secondary min-h-[40px] border-red-200 text-xs sm:text-sm text-red-700 hover:border-red-300 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" /> Déconnexion
          </button>
        </div>
      </div>

      {/* Notification toast */}
      {toast && (
        <div
          role="status"
          className={`mb-6 flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm font-medium animate-soft-in ${
            toast.type === 'ok'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border-red-200 bg-red-50 text-red-900'
          }`}
        >
          <span className="flex items-center gap-2">
            {toast.type === 'ok' ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
            {toast.msg}
          </span>
          <button onClick={() => setToast(null)} aria-label="Fermer">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Navigation mobile/tablette */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2 lg:hidden no-scrollbar">
        {menuItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onNavigateSubPage(id)}
            className={isMenuActive(id) ? 'chip-active' : 'chip'}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr] lg:items-start">
        {/* Sidebar Desktop */}
        <aside className="hidden lg:block surface p-3 sticky top-20">
          <nav className="space-y-1">
            {menuItems.map(({ id, label, icon: Icon, badge }) => {
              const active = isMenuActive(id);
              return (
                <button
                  key={id}
                  onClick={() => onNavigateSubPage(id)}
                  className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-sm font-medium transition-colors ${
                    active ? 'bg-church-navy text-white' : 'text-church-dark hover:bg-church-light'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className={`h-4 w-4 ${active ? 'text-white' : 'text-church-blue'}`} />
                    {label}
                  </span>
                  {badge !== undefined && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        active ? 'bg-white/20 text-white' : 'bg-church-tint text-church-navy'
                      }`}
                    >
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Contenu principal */}
        <section className="min-w-0 space-y-6">
          {/* ==================== DASHBOARD ==================== */}
          {activeSubPage === 'dashboard' && (() => {
            const totalViews =
              cultes.reduce((sum, c) => sum + (c.viewsCount || 0), 0) +
              events.reduce((sum, e) => sum + (e.viewsCount || 0), 0) +
              news.reduce((sum, n) => sum + (n.readsCount || 0), 0) +
              albums.reduce((sum, a) => sum + (a.viewsCount || 0), 0);

            const totalReactions =
              cultes.reduce(
                (sum, c) => sum + (c.reactions?.likes || 0) + (c.reactions?.hearts || 0) + (c.reactions?.prayers || 0),
                0
              ) +
              events.reduce((sum, e) => sum + (e.likes || 0), 0) +
              news.reduce((sum, n) => sum + (n.likes || 0), 0);

            return (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="surface p-4 sm:p-5">
                    <p className="flex items-center gap-1.5 text-xs font-medium text-church-muted">
                      <Eye className="h-3.5 w-3.5 text-church-blue" /> Vues totales
                    </p>
                    <p className="mt-1 font-serif text-3xl font-semibold text-church-navy">{totalViews}</p>
                    <p className="mt-0.5 text-xs text-church-muted">Cultes, événements, actus & albums</p>
                  </div>
                  <div className="surface p-4 sm:p-5">
                    <p className="flex items-center gap-1.5 text-xs font-medium text-church-muted">
                      <Heart className="h-3.5 w-3.5 text-church-blue" /> Réactions & Likes
                    </p>
                    <p className="mt-1 font-serif text-3xl font-semibold text-church-navy">{totalReactions}</p>
                    <p className="mt-0.5 text-xs text-church-muted">Sans création de compte</p>
                  </div>
                  <div className="surface p-4 sm:p-5">
                    <p className="flex items-center gap-1.5 text-xs font-medium text-church-muted">
                      <MessageCircle className="h-3.5 w-3.5 text-church-blue" /> Commentaires
                    </p>
                    <p className="mt-1 font-serif text-3xl font-semibold text-church-navy">{allComments.length}</p>
                    <p className="mt-0.5 text-xs text-church-muted">{allComments.filter((c) => c.reported).length} signalé(s)</p>
                  </div>
                  <div className="surface p-4 sm:p-5">
                    <p className="flex items-center gap-1.5 text-xs font-medium text-church-muted">
                      <BellRing className="h-3.5 w-3.5 text-church-blue" /> Abonnés Push PWA
                    </p>
                    <p className="mt-1 font-serif text-3xl font-semibold text-church-navy">{pushSubscribersCount}</p>
                    <p className="mt-0.5 text-xs text-church-muted">{cultes.filter((c) => c.status === 'publie').length} culte(s) en ligne</p>
                  </div>
                </div>

                <div className="surface p-6">
                  <h2 className="text-xl mb-4">Actions rapides</h2>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    <button onClick={() => openCulteForm()} className="btn-primary justify-start">
                      <Plus className="h-4 w-4" /> Publier un culte
                    </button>
                    <button onClick={() => openEventForm()} className="btn-secondary justify-start">
                      <Plus className="h-4 w-4 text-church-blue" /> Nouvel événement
                    </button>
                    <button onClick={() => openNewsForm()} className="btn-secondary justify-start">
                      <Plus className="h-4 w-4 text-church-blue" /> Nouvelle actualité
                    </button>
                    <button onClick={() => openAlbumForm()} className="btn-secondary justify-start">
                      <Plus className="h-4 w-4 text-church-blue" /> Importer un lot photo
                    </button>
                    <button onClick={() => onNavigateSubPage('drive')} className="btn-secondary justify-start">
                      <HardDrive className="h-4 w-4 text-church-blue" /> Synchroniser Drive
                    </button>
                    <button onClick={() => onNavigateSubPage('medias')} className="btn-secondary justify-start">
                      <Palette className="h-4 w-4 text-church-blue" /> Image de fond Héros
                    </button>
                  </div>
                </div>

                {/* Envoi réel de notifications Push PWA */}
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!pushBody.trim()) {
                      notify('Veuillez saisir le message de la notification.', 'err');
                      return;
                    }
                    setSendingPush(true);
                    try {
                      const res = await api.sendAdminPush({
                        title: pushTitle.trim(),
                        body: pushBody.trim(),
                        url: pushTarget
                      });
                      onSyncPushState({
                        pushSubscribersCount: res.subscribersCount,
                        pushHistory: res.pushHistory
                      });
                      setPushBody('');
                      notify(`Notification envoyée à ${res.sentCount} appareil(s) abonné(s).`);
                    } catch (err) {
                      notify(err instanceof Error ? err.message : 'Erreur d’envoi Push.', 'err');
                    } finally {
                      setSendingPush(false);
                    }
                  }}
                  className="surface p-6 space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h2 className="text-xl flex items-center gap-2">
                        <BellRing className="h-5 w-5 text-church-blue" /> Envoyer une notification Push PWA
                      </h2>
                      <p className="text-xs text-church-muted mt-0.5">
                        Avertissez instantanément les {pushSubscribersCount} appareil(s) abonné(s) sur mobile et ordinateur.
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-[1fr_200px]">
                    <input
                      value={pushTitle}
                      onChange={(e) => setPushTitle(e.target.value)}
                      placeholder="Titre de l’alerte"
                      className="field text-sm"
                    />
                    <select
                      value={pushTarget}
                      onChange={(e) => setPushTarget(e.target.value)}
                      className="field text-sm"
                    >
                      <option value="/">Ouvrir : Accueil</option>
                      <option value="/?page=cultes">Ouvrir : Cultes</option>
                      <option value="/?page=evenements">Ouvrir : Événements</option>
                      <option value="/?page=actualites">Ouvrir : Actualités</option>
                      <option value="/?page=galerie">Ouvrir : Galerie</option>
                    </select>
                  </div>
                  <textarea
                    rows={2}
                    value={pushBody}
                    onChange={(e) => setPushBody(e.target.value)}
                    placeholder="Ex. Nouveau culte de ce dimanche disponible en écoute audio et vidéo."
                    className="field py-2.5 min-h-[70px] text-sm"
                  />
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs text-church-muted">
                      {pushHistory.length > 0
                        ? `Dernier envoi : ${new Date(pushHistory[0].sentAt).toLocaleString('fr-FR')} (${pushHistory[0].recipientCount} reçu(s))`
                        : 'Aucun envoi effectué pour le moment.'}
                    </span>
                    <button type="submit" disabled={sendingPush} className="btn-primary min-h-[40px]">
                      <Send className="h-4 w-4" />
                      {sendingPush ? 'Envoi en cours...' : 'Envoyer la notification'}
                    </button>
                  </div>
                </form>

                <div className="surface p-6">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <h2 className="text-xl">Accès caché configuré</h2>
                    <button onClick={() => onNavigateSubPage('securite')} className="link text-sm">
                      Configurer la sécurité
                    </button>
                  </div>
                  <p className="text-sm text-church-muted">
                    L’espace administrateur est entièrement masqué du site public. Vous pouvez y accéder via le lien secret{' '}
                    <code className="rounded-lg bg-church-light px-2 py-0.5 font-mono text-xs text-church-navy">
                      #/{security.secretGateSlug}
                    </code>
                    {security.enableKeyboardShortcut && ', le raccourci Ctrl+Maj+A'}
                    {security.enableFooterTap && ' ou 5 clics rapides sur l’année © en pied de page'}.
                  </p>
                </div>
              </div>
            );
          })()}

          {/* ==================== LISTE CULTES ==================== */}
          {activeSubPage === 'cultes' && (() => {
            const sortedCultes = sortCultesByDateDesc(cultes).filter((c) =>
              culteCategoryFilter === 'tous' ? true : inferCulteServiceType(c) === culteCategoryFilter
            );
            return (
              <div className="surface p-5 sm:p-6 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-2xl">Cultes & Prédications</h2>
                    <p className="text-sm text-church-muted">
                      Classés automatiquement par date et par catégorie : Dimanche, Événement et Mardi.
                    </p>
                  </div>
                  <button onClick={() => openCulteForm()} className="btn-primary">
                    <Plus className="h-4 w-4" /> Nouveau culte
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      { id: 'tous', label: `Tous (${cultes.length})` },
                      { id: 'dimanche', label: `Dimanche (${cultes.filter((c) => inferCulteServiceType(c) === 'dimanche').length})` },
                      { id: 'evenement', label: `Événement (${cultes.filter((c) => inferCulteServiceType(c) === 'evenement').length})` },
                      { id: 'mardi', label: `Mardi (${cultes.filter((c) => inferCulteServiceType(c) === 'mardi').length})` }
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setCulteCategoryFilter(tab.id)}
                      className={culteCategoryFilter === tab.id ? 'chip-active text-xs' : 'chip text-xs'}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {sortedCultes.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-church-line p-8 text-center text-sm text-church-muted">
                    Aucun culte enregistré dans cette catégorie.
                  </div>
                ) : (
                  <div className="divide-y divide-church-line">
                    {sortedCultes.map((c) => {
                      const sType = inferCulteServiceType(c);
                      return (
                        <div key={c.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              <span className="rounded-full bg-church-tint px-2.5 py-0.5 font-semibold text-church-blue">
                                {CULTE_TYPE_LABELS[sType]}
                                {sType === 'evenement' && c.eventLabel ? ` · ${c.eventLabel}` : ''}
                              </span>
                              <span
                                className={`rounded-full px-2.5 py-0.5 font-semibold ${
                                  c.status === 'publie'
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : c.status === 'programme'
                                    ? 'bg-amber-50 text-amber-800'
                                    : 'bg-church-light text-church-muted'
                                }`}
                              >
                                {c.status === 'publie' ? 'Publié' : c.status === 'programme' ? `Programmé (${c.scheduledDate || c.date})` : 'Brouillon'}
                              </span>
                              <span className="text-church-muted">{c.date}</span>
                              {c.audioUrl && <span className="text-church-blue font-medium">Audio</span>}
                              {c.hasVideo && <span className="text-church-blue font-medium">Vidéo</span>}
                            </div>
                            <h3 className="mt-1 font-serif text-lg text-church-navy truncate">{c.title}</h3>
                            <p className="mt-0.5 text-xs text-church-muted">
                              {c.preacher ? `${c.preacher} · ` : ''}
                              {c.viewsCount || 0} vue(s) · {(c.reactions?.likes || 0) + (c.reactions?.hearts || 0) + (c.reactions?.prayers || 0)} réaction(s) · {(c.comments || []).length} commentaire(s)
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button onClick={() => openCulteForm(c)} className="btn-secondary min-h-[38px] px-3 text-xs">
                              <Pencil className="h-3.5 w-3.5" /> Modifier
                            </button>
                            {confirmDeleteKey === `culte:${c.id}` ? (
                              <button
                                onClick={async () => {
                                  const res = await api.deleteCulte(c.id);
                                  onSyncPublicState({ cultes: res.cultes });
                                  setConfirmDeleteKey(null);
                                  notify('Culte supprimé.');
                                }}
                                className="btn-primary min-h-[38px] bg-red-600 hover:bg-red-700 px-3 text-xs"
                              >
                                Confirmer
                              </button>
                            ) : (
                              <button
                                onClick={() => setConfirmDeleteKey(`culte:${c.id}`)}
                                className="btn-secondary min-h-[38px] px-3 text-xs text-red-700 hover:bg-red-50"
                                aria-label="Supprimer ce culte"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          {/* ==================== CREER / MODIFIER CULTE ==================== */}
          {activeSubPage === 'cultes-creer' && editingCulte && (
            <form onSubmit={handleSaveCulte} className="surface p-5 sm:p-7 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-church-line pb-4">
                <h2 className="text-2xl">{cultes.some((c) => c.id === editingCulte.id) ? 'Modifier le culte' : 'Publier un culte'}</h2>
                <button type="button" onClick={() => onNavigateSubPage('cultes')} className="btn-ghost text-sm">
                  Annuler
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-church-navy">Titre de la prédication *</label>
                  <input
                    required
                    value={editingCulte.title}
                    onChange={(e) => setEditingCulte({ ...editingCulte, title: e.target.value })}
                    placeholder="Ex. Marcher par la foi en toute circonstance"
                    className="field"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-church-navy">Classement (Dimanche / Événement / Mardi) *</label>
                  <select
                    value={editingCulte.serviceType || inferCulteServiceType(editingCulte)}
                    onChange={(e) =>
                      setEditingCulte({ ...editingCulte, serviceType: e.target.value as CulteServiceType })
                    }
                    className="field"
                  >
                    <option value="dimanche">Culte du Dimanche</option>
                    <option value="evenement">Culte d’Événement spécial</option>
                    <option value="mardi">Culte du Mardi (Enseignement / Prière)</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-church-navy">Date du culte *</label>
                  <input
                    type="date"
                    required
                    value={editingCulte.date}
                    onChange={(e) => {
                      const nextDate = e.target.value;
                      setEditingCulte({
                        ...editingCulte,
                        date: nextDate,
                        serviceType: inferCulteServiceType({ date: nextDate, title: editingCulte.title })
                      });
                    }}
                    className="field"
                  />
                </div>
                {(editingCulte.serviceType || inferCulteServiceType(editingCulte)) === 'evenement' && (
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-church-navy">Nom de l’événement (optionnel)</label>
                    <input
                      value={editingCulte.eventLabel || ''}
                      onChange={(e) => setEditingCulte({ ...editingCulte, eventLabel: e.target.value })}
                      placeholder="Ex. Veillée de prière, Convention annuelle, Culte de Pâques..."
                      className="field"
                    />
                  </div>
                )}
                <div>
                  <label className="mb-1 block text-sm font-medium text-church-navy">Horaire</label>
                  <input
                    value={editingCulte.time}
                    onChange={(e) => setEditingCulte({ ...editingCulte, time: e.target.value })}
                    placeholder="Ex. 07h30 - 11h00"
                    className="field"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-church-navy">Orateur / Prédicateur</label>
                  <input
                    value={editingCulte.preacher}
                    onChange={(e) => setEditingCulte({ ...editingCulte, preacher: e.target.value })}
                    className="field"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-church-navy">Passage biblique (Référence)</label>
                  <input
                    value={editingCulte.scriptureRef}
                    onChange={(e) => setEditingCulte({ ...editingCulte, scriptureRef: e.target.value })}
                    placeholder="Ex. Romains 8 : 28-31"
                    className="field"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-church-navy">Statut de publication</label>
                  <select
                    value={editingCulte.status}
                    onChange={(e) =>
                      setEditingCulte({ ...editingCulte, status: e.target.value as Culte['status'] })
                    }
                    className="field"
                  >
                    <option value="publie">Publié immédiatement</option>
                    <option value="programme">Publication automatique programmée</option>
                    <option value="brouillon">Brouillon (caché au public)</option>
                  </select>
                </div>
                {editingCulte.status === 'programme' && (
                  <div>
                    <label className="mb-1 flex items-center gap-1 text-sm font-medium text-church-navy">
                      <Clock className="h-4 w-4 text-church-blue" /> Date de publication auto
                    </label>
                    <input
                      type="date"
                      value={editingCulte.scheduledDate || editingCulte.date}
                      onChange={(e) => setEditingCulte({ ...editingCulte, scheduledDate: e.target.value })}
                      className="field"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-church-navy">Résumé court du message</label>
                <textarea
                  rows={3}
                  value={editingCulte.sermonSummary}
                  onChange={(e) => setEditingCulte({ ...editingCulte, sermonSummary: e.target.value })}
                  placeholder="Résumé concis affiché dès l'accueil et dans la liste des cultes..."
                  className="field py-2.5 min-h-[90px]"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-church-navy">Points clés à retenir (un par ligne)</label>
                <textarea
                  rows={3}
                  value={culteKeyPointsText}
                  onChange={(e) => setCulteKeyPointsText(e.target.value)}
                  placeholder="Point 1&#10;Point 2"
                  className="field py-2.5 min-h-[84px]"
                />
              </div>

              {/* Audio direct */}
              <div className="rounded-2xl border border-church-line p-4 space-y-3">
                <h3 className="text-lg">Audio de la prédication</h3>
                <MediaBatchUploader
                  mode="audio"
                  allowFolder={false}
                  onUploadedFiles={(res) => {
                    if (res[0]) setEditingCulte((prev) => (prev ? { ...prev, audioUrl: res[0].url } : prev));
                  }}
                />
                <div className="grid gap-3 sm:grid-cols-[1fr_160px]">
                  <input
                    value={editingCulte.audioUrl || ''}
                    onChange={(e) => setEditingCulte({ ...editingCulte, audioUrl: e.target.value })}
                    placeholder="Lien audio (/uploads/... ou URL https://)"
                    className="field text-sm"
                  />
                  <input
                    value={editingCulte.audioDuration || ''}
                    onChange={(e) => setEditingCulte({ ...editingCulte, audioDuration: e.target.value })}
                    placeholder="Durée (ex. 42 min)"
                    className="field text-sm"
                  />
                </div>
              </div>

              {/* Vidéo directe */}
              <div className="rounded-2xl border border-church-line p-4 space-y-3">
                <h3 className="text-lg">Vidéo du culte (YouTube ou fichier MP4)</h3>
                <div className="grid gap-3 sm:grid-cols-[1fr_160px]">
                  <input
                    value={editingCulte.videoUrl || ''}
                    onChange={(e) =>
                      setEditingCulte({
                        ...editingCulte,
                        videoUrl: e.target.value,
                        hasVideo: Boolean(e.target.value.trim())
                      })
                    }
                    placeholder="Lien YouTube ou /uploads/video.mp4"
                    className="field text-sm"
                  />
                  <input
                    value={editingCulte.videoDuration || ''}
                    onChange={(e) => setEditingCulte({ ...editingCulte, videoDuration: e.target.value })}
                    placeholder="Durée (ex. 55 min)"
                    className="field text-sm"
                  />
                </div>
                <MediaBatchUploader
                  mode="video"
                  allowFolder={false}
                  onUploadedFiles={(res) => {
                    if (res[0]) {
                      setEditingCulte((prev) =>
                        prev ? { ...prev, videoUrl: res[0].url, hasVideo: true } : prev
                      );
                    }
                  }}
                />
              </div>

              {/* Image de couverture & Lot de photos */}
              <div className="rounded-2xl border border-church-line p-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-lg">Couverture & Photos du culte (import par lot ou Drive)</h3>
                  <button
                    type="button"
                    onClick={() => setShowCulteDrivePicker((v) => !v)}
                    className="btn-secondary min-h-[38px] text-xs"
                  >
                    <HardDrive className="h-3.5 w-3.5 text-church-blue" />
                    {showCulteDrivePicker ? 'Masquer Google Drive' : 'Importer depuis Google Drive'}
                  </button>
                </div>

                {showCulteDrivePicker && (
                  <GoogleDriveBrowser
                    compact
                    allowDocuments
                    linkedAccounts={driveAccounts}
                    linkedFolders={driveFolders}
                    defaultCategory="Cultes"
                    onSyncDriveState={(patch) => {
                      onSyncDriveState(patch);
                      if (patch.albums) onSyncPublicState({ albums: patch.albums });
                    }}
                    onImportedToForm={(items, docs) => {
                      const importedPhotos = items.filter((it) => it.type === 'photo').map((it) => it.url);
                      const importedVideos = items.filter((it) => it.type === 'video');
                      const importedAudios = items.filter((it) => it.type === 'audio');
                      const importedDocs = docs || [];
                      setEditingCulte((prev) => {
                        if (!prev) return prev;
                        let nextVideoUrl = prev.videoUrl || '';
                        let nextHasVideo = prev.hasVideo;
                        const extraVideos: MediaItem[] = [];
                        importedVideos.forEach((v) => {
                          if (!nextVideoUrl) {
                            nextVideoUrl = v.url;
                            nextHasVideo = true;
                          } else {
                            extraVideos.push(v);
                          }
                        });
                        let nextAudioUrl = prev.audioUrl || '';
                        const extraAudios: MediaItem[] = [];
                        importedAudios.forEach((a) => {
                          if (!nextAudioUrl) {
                            nextAudioUrl = a.url;
                          } else {
                            extraAudios.push(a);
                          }
                        });
                        return {
                          ...prev,
                          photos: [...prev.photos, ...importedPhotos],
                          coverImage: prev.coverImage || importedPhotos[0] || '',
                          videoUrl: nextVideoUrl,
                          hasVideo: nextHasVideo,
                          audioUrl: nextAudioUrl,
                          mediaItems: [...(prev.mediaItems || []), ...extraVideos, ...extraAudios],
                          documents: [...prev.documents, ...importedDocs]
                        };
                      });
                    }}
                    onNotify={notify}
                  />
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="mb-2 text-xs font-semibold text-church-muted">Image de couverture</p>
                    <MediaBatchUploader
                      mode="single-image"
                      allowFolder={false}
                      onUploadedFiles={(res) => {
                        if (res[0]) setEditingCulte((prev) => (prev ? { ...prev, coverImage: res[0].url } : prev));
                      }}
                    />
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-semibold text-church-muted">Photos du culte (lot ou dossier)</p>
                    <MediaBatchUploader
                      mode="photos"
                      onUploadedFiles={(res) => {
                        setEditingCulte((prev) =>
                          prev ? { ...prev, photos: [...prev.photos, ...res.map((r) => r.url)] } : prev
                        );
                      }}
                    />
                  </div>
                </div>
                {editingCulte.photos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                    {editingCulte.photos.map((p, i) => (
                      <div key={i} className="relative overflow-hidden rounded-xl border border-church-line">
                        <img src={sanitizeUrl(p)} alt="" className="aspect-square w-full object-cover" />
                        <button
                          type="button"
                          onClick={() =>
                            setEditingCulte({
                              ...editingCulte,
                              photos: editingCulte.photos.filter((_, idx) => idx !== i)
                            })
                          }
                          className="absolute right-1 top-1 rounded-full bg-white/90 p-1 text-red-700"
                          aria-label="Retirer cette photo"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {(editingCulte.mediaItems || []).length > 0 && (
                  <div className="space-y-2 border-t border-church-line pt-3">
                    <p className="text-xs font-semibold text-church-navy">
                      Vidéos & Audios complémentaires ({editingCulte.mediaItems!.length})
                    </p>
                    <ul className="divide-y divide-church-line rounded-xl border border-church-line">
                      {editingCulte.mediaItems!.map((m, idx) => (
                        <li key={m.id || idx} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                          <span className="flex min-w-0 items-center gap-2 truncate">
                            {m.type === 'video' ? (
                              <Film className="h-4 w-4 shrink-0 text-church-blue" />
                            ) : (
                              <Headphones className="h-4 w-4 shrink-0 text-church-blue" />
                            )}
                            <span className="truncate">{m.caption || (m.type === 'video' ? 'Vidéo' : 'Audio')}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setEditingCulte({
                                ...editingCulte,
                                mediaItems: (editingCulte.mediaItems || []).filter((_, i) => i !== idx)
                              })
                            }
                            className="shrink-0 text-xs text-red-700 hover:underline"
                          >
                            Retirer
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Documents joints */}
              <div className="rounded-2xl border border-church-line p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-lg">Documents associés (PDF, Word, PowerPoint ou Google Drive)</h3>
                  <button
                    type="button"
                    onClick={() => setShowCulteDrivePicker(true)}
                    className="btn-secondary min-h-[36px] text-xs"
                  >
                    <HardDrive className="h-3.5 w-3.5 text-church-blue" />
                    Document entier depuis Drive
                  </button>
                </div>
                <MediaBatchUploader
                  mode="documents"
                  onUploadedFiles={() => {}}
                  onUploadedDocuments={(docs) =>
                    setEditingCulte((prev) => (prev ? { ...prev, documents: [...prev.documents, ...docs] } : prev))
                  }
                />
                {editingCulte.documents.length > 0 && (
                  <ul className="divide-y divide-church-line rounded-xl border border-church-line">
                    {editingCulte.documents.map((d, i) => (
                      <li key={i} className="flex items-center justify-between px-3 py-2 text-sm">
                        <span className="flex items-center gap-2 truncate">
                          <FileText className="h-4 w-4 text-church-blue shrink-0" />
                          {d.title} {d.fileSize && <span className="text-xs text-church-muted">({d.fileSize})</span>}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setEditingCulte({
                              ...editingCulte,
                              documents: editingCulte.documents.filter((_, idx) => idx !== i)
                            })
                          }
                          className="text-xs text-red-700 hover:underline"
                        >
                          Retirer
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => onNavigateSubPage('cultes')} className="btn-secondary">
                  Annuler
                </button>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? 'Enregistrement...' : 'Enregistrer le culte'}
                </button>
              </div>
            </form>
          )}

          {/* ==================== LISTE ÉVÉNEMENTS ==================== */}
          {activeSubPage === 'evenements' && (
            <div className="surface p-5 sm:p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl">Événements & Affiches</h2>
                  <p className="text-sm text-church-muted">Importez des affiches, activez des sondages et gérez vos rendez-vous.</p>
                </div>
                <button onClick={() => openEventForm()} className="btn-primary">
                  <Plus className="h-4 w-4" /> Nouvel événement
                </button>
              </div>

              {events.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-church-line p-8 text-center text-sm text-church-muted">
                  Aucun événement créé pour le moment.
                </div>
              ) : (
                <div className="divide-y divide-church-line">
                  {events.map((ev) => (
                    <div key={ev.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        {sanitizeUrl(ev.coverImage) ? (
                          <img
                            src={sanitizeUrl(ev.coverImage)}
                            alt=""
                            className="h-14 w-14 shrink-0 rounded-xl object-cover bg-church-navy"
                          />
                        ) : (
                          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-church-tint text-church-blue">
                            <CalendarDays className="h-6 w-6" aria-hidden="true" />
                          </span>
                        )}
                        <div className="min-w-0">
                          <span className="text-xs font-semibold text-church-blue">{ev.category} · {ev.date}</span>
                          <h3 className="font-serif text-lg text-church-navy truncate">{ev.title}</h3>
                          <p className="text-xs text-church-muted">
                            {ev.viewsCount || 0} vue(s) · {ev.likes || 0} j’aime · {(ev.comments || []).length} commentaire(s) · {ev.attendeesCount} inscrit(s)
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => openEventForm(ev)} className="btn-secondary min-h-[38px] px-3 text-xs">
                          <Pencil className="h-3.5 w-3.5" /> Modifier
                        </button>
                        {confirmDeleteKey === `event:${ev.id}` ? (
                          <button
                            onClick={async () => {
                              const res = await api.deleteEvent(ev.id);
                              onSyncPublicState({ events: res.events });
                              setConfirmDeleteKey(null);
                              notify('Événement supprimé.');
                            }}
                            className="btn-primary min-h-[38px] bg-red-600 hover:bg-red-700 px-3 text-xs"
                          >
                            Confirmer
                          </button>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteKey(`event:${ev.id}`)}
                            className="btn-secondary min-h-[38px] px-3 text-xs text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ==================== CREER / MODIFIER ÉVÉNEMENT ==================== */}
          {activeSubPage === 'evenements-creer' && editingEvent && (
            <form onSubmit={handleSaveEvent} className="surface p-5 sm:p-7 space-y-5">
              <div className="flex items-center justify-between border-b border-church-line pb-4">
                <h2 className="text-2xl">{events.some((e) => e.id === editingEvent.id) ? 'Modifier l’événement' : 'Nouvel événement'}</h2>
                <button type="button" onClick={() => onNavigateSubPage('evenements')} className="btn-ghost text-sm">
                  Annuler
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-church-navy">Titre de l’événement *</label>
                  <input
                    required
                    value={editingEvent.title}
                    onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                    className="field"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-church-navy">Catégorie</label>
                  <select
                    value={editingEvent.category}
                    onChange={(e) => setEditingEvent({ ...editingEvent, category: e.target.value as EventItem['category'] })}
                    className="field"
                  >
                    <option value="Culte spécial">Culte spécial</option>
                    <option value="Conférence">Conférence</option>
                    <option value="Jeunesse">Jeunesse</option>
                    <option value="Prière">Prière</option>
                    <option value="Femmes">Femmes</option>
                    <option value="Évangélisation">Évangélisation</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-church-navy">Date *</label>
                  <input
                    type="date"
                    required
                    value={editingEvent.date}
                    onChange={(e) => setEditingEvent({ ...editingEvent, date: e.target.value })}
                    className="field"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-church-navy">Horaire</label>
                  <input
                    value={editingEvent.time}
                    onChange={(e) => setEditingEvent({ ...editingEvent, time: e.target.value })}
                    placeholder="Ex. 18h00 - 20h30"
                    className="field"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-church-navy">Lieu</label>
                  <input
                    value={editingEvent.location}
                    onChange={(e) => setEditingEvent({ ...editingEvent, location: e.target.value })}
                    className="field"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-church-navy">Orateur / Intervenant (optionnel)</label>
                  <input
                    value={editingEvent.speaker || ''}
                    onChange={(e) => setEditingEvent({ ...editingEvent, speaker: e.target.value })}
                    className="field"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-church-navy">Description & Programme</label>
                <textarea
                  rows={4}
                  value={editingEvent.description}
                  onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })}
                  className="field py-2.5 min-h-[100px]"
                />
              </div>

              <div className="rounded-2xl border border-church-line p-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-lg">Médias de l’événement (Affiche, Photos, Vidéos, Audios & Google Drive)</h3>
                    <p className="text-xs text-church-muted">
                      Importez depuis votre appareil ou via Google Drive (document entier ou regroupement entier / au choix).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowEventDrivePicker((v) => !v)}
                    className="btn-secondary min-h-[38px] text-xs"
                  >
                    <HardDrive className="h-3.5 w-3.5 text-church-blue" />
                    {showEventDrivePicker ? 'Masquer Google Drive' : 'Importer depuis Google Drive'}
                  </button>
                </div>

                {showEventDrivePicker && (
                  <GoogleDriveBrowser
                    compact
                    allowDocuments
                    linkedAccounts={driveAccounts}
                    linkedFolders={driveFolders}
                    defaultCategory="Événements"
                    onSyncDriveState={(patch) => {
                      onSyncDriveState(patch);
                      if (patch.albums) onSyncPublicState({ albums: patch.albums });
                    }}
                    onImportedToForm={(items, docs) => {
                      const importedPhotos = items.filter((it) => it.type === 'photo');
                      const importedVideos = items.filter((it) => it.type === 'video');
                      const importedAudios = items.filter((it) => it.type === 'audio');
                      const importedDocs = docs || [];
                      setEditingEvent((prev) => {
                        if (!prev) return prev;
                        let nextVideoUrl = prev.videoUrl || '';
                        const extraVideos: MediaItem[] = [];
                        importedVideos.forEach((v) => {
                          if (!nextVideoUrl) nextVideoUrl = v.url;
                          else extraVideos.push(v);
                        });
                        let nextAudioUrl = prev.audioUrl || '';
                        const extraAudios: MediaItem[] = [];
                        importedAudios.forEach((a) => {
                          if (!nextAudioUrl) nextAudioUrl = a.url;
                          else extraAudios.push(a);
                        });
                        return {
                          ...prev,
                          coverImage: prev.coverImage || importedPhotos[0]?.url || '',
                          videoUrl: nextVideoUrl,
                          audioUrl: nextAudioUrl,
                          mediaItems: [...(prev.mediaItems || []), ...importedPhotos, ...extraVideos, ...extraAudios],
                          documents: [...(prev.documents || []), ...importedDocs]
                        };
                      });
                    }}
                    onNotify={notify}
                  />
                )}

                {editingEvent.coverImage && (
                  <div className="relative inline-block">
                    <img src={sanitizeUrl(editingEvent.coverImage)} alt="" className="h-36 rounded-xl border border-church-line object-cover" />
                    <button
                      type="button"
                      onClick={() => setEditingEvent({ ...editingEvent, coverImage: '' })}
                      className="absolute right-1.5 top-1.5 rounded-full bg-white/95 p-1 text-red-700 shadow-xs"
                      aria-label="Retirer l'affiche"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="mb-1.5 text-xs font-semibold text-church-muted">Affiche principale</p>
                    <MediaBatchUploader
                      mode="single-image"
                      label="Importer l’affiche de l’événement"
                      allowFolder={false}
                      onUploadedFiles={(res) => {
                        if (res[0]) setEditingEvent((prev) => (prev ? { ...prev, coverImage: res[0].url } : prev));
                      }}
                    />
                  </div>
                  <div>
                    <p className="mb-1.5 text-xs font-semibold text-church-muted">Photos complémentaires (lot ou dossier)</p>
                    <MediaBatchUploader
                      mode="photos"
                      label="Ajouter plusieurs photos"
                      onUploadedFiles={(res) => {
                        const added: MediaItem[] = res.map((r, i) => ({
                          id: `evt-img-${Date.now()}-${i}`,
                          type: 'photo',
                          url: r.url,
                          caption: r.name
                        }));
                        setEditingEvent((prev) =>
                          prev ? { ...prev, mediaItems: [...(prev.mediaItems || []), ...added] } : prev
                        );
                      }}
                    />
                  </div>
                </div>

                <div className="grid gap-4 border-t border-church-line pt-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-church-muted">Vidéo (YouTube ou fichier MP4)</label>
                    <input
                      value={editingEvent.videoUrl || ''}
                      onChange={(e) => setEditingEvent({ ...editingEvent, videoUrl: e.target.value })}
                      placeholder="Lien YouTube ou /uploads/video.mp4"
                      className="field text-sm"
                    />
                    <MediaBatchUploader
                      mode="video"
                      allowFolder={false}
                      onUploadedFiles={(res) => {
                        if (res[0]) setEditingEvent((prev) => (prev ? { ...prev, videoUrl: res[0].url } : prev));
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-church-muted">Audio (MP3, WAV, M4A)</label>
                    <input
                      value={editingEvent.audioUrl || ''}
                      onChange={(e) => setEditingEvent({ ...editingEvent, audioUrl: e.target.value })}
                      placeholder="Lien audio (/uploads/... ou https://)"
                      className="field text-sm"
                    />
                    <MediaBatchUploader
                      mode="audio"
                      allowFolder={false}
                      onUploadedFiles={(res) => {
                        if (res[0]) setEditingEvent((prev) => (prev ? { ...prev, audioUrl: res[0].url } : prev));
                      }}
                    />
                  </div>
                </div>

                {(editingEvent.mediaItems || []).length > 0 && (
                  <div className="space-y-2 border-t border-church-line pt-3">
                    <p className="text-xs font-semibold text-church-navy">
                      Galerie médias de l’événement ({editingEvent.mediaItems!.length})
                    </p>
                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                      {editingEvent.mediaItems!.map((m, idx) => (
                        <div key={m.id || idx} className="relative rounded-xl border border-church-line p-1.5">
                          {m.type === 'photo' ? (
                            <img src={sanitizeUrl(m.url)} alt="" className="aspect-[4/3] w-full rounded-lg object-cover" />
                          ) : (
                            <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-1 rounded-lg bg-church-navy px-2 text-center text-xs text-white">
                              {m.type === 'video' ? <Film className="h-5 w-5" /> : <Headphones className="h-5 w-5" />}
                              <span className="line-clamp-2">{m.caption || (m.type === 'video' ? 'Vidéo' : 'Audio')}</span>
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              setEditingEvent({
                                ...editingEvent,
                                mediaItems: (editingEvent.mediaItems || []).filter((_, i) => i !== idx)
                              })
                            }
                            className="absolute right-2 top-2 rounded-full bg-white/95 p-1 text-red-700 shadow-xs"
                            aria-label="Retirer ce média"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-church-line p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-lg">Documents associés (programme PDF, dépliant, dossier...)</h3>
                  <button
                    type="button"
                    onClick={() => setShowEventDrivePicker(true)}
                    className="btn-secondary min-h-[36px] text-xs"
                  >
                    <HardDrive className="h-3.5 w-3.5 text-church-blue" />
                    Document entier depuis Drive
                  </button>
                </div>
                <MediaBatchUploader
                  mode="documents"
                  onUploadedFiles={() => {}}
                  onUploadedDocuments={(docs) =>
                    setEditingEvent((prev) =>
                      prev ? { ...prev, documents: [...(prev.documents || []), ...docs] } : prev
                    )
                  }
                />
                {(editingEvent.documents || []).length > 0 && (
                  <ul className="divide-y divide-church-line rounded-xl border border-church-line">
                    {editingEvent.documents!.map((d, i) => (
                      <li key={i} className="flex items-center justify-between px-3 py-2 text-sm">
                        <span className="flex items-center gap-2 truncate">
                          <FileText className="h-4 w-4 text-church-blue shrink-0" />
                          {d.title} {d.fileSize && <span className="text-xs text-church-muted">({d.fileSize})</span>}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setEditingEvent({
                              ...editingEvent,
                              documents: (editingEvent.documents || []).filter((_, idx) => idx !== i)
                            })
                          }
                          className="text-xs text-red-700 hover:underline"
                        >
                          Retirer
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rounded-2xl border border-church-line p-4 space-y-3">
                <label className="flex items-center gap-2.5 text-sm font-semibold text-church-navy cursor-pointer">
                  <input
                    type="checkbox"
                    checked={eventPollEnabled}
                    onChange={(e) => setEventPollEnabled(e.target.checked)}
                    className="h-4 w-4 rounded accent-church-blue"
                  />
                  Ajouter un sondage de participation (« Qui sera présent ? »)
                </label>
                {eventPollEnabled && (
                  <div className="space-y-3 pt-2">
                    <input
                      value={eventPollQuestion}
                      onChange={(e) => setEventPollQuestion(e.target.value)}
                      placeholder="Question du sondage"
                      className="field text-sm"
                    />
                    <textarea
                      rows={3}
                      value={eventPollOptionsText}
                      onChange={(e) => setEventPollOptionsText(e.target.value)}
                      placeholder="Une option par ligne"
                      className="field py-2 text-sm min-h-[84px]"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => onNavigateSubPage('evenements')} className="btn-secondary">
                  Annuler
                </button>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? 'Enregistrement...' : 'Enregistrer l’événement'}
                </button>
              </div>
            </form>
          )}

          {/* ==================== LISTE ACTUALITÉS ==================== */}
          {activeSubPage === 'actualites' && (
            <div className="surface p-5 sm:p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl">Actualités & Communiqués</h2>
                  <p className="text-sm text-church-muted">Publiez les communiqués officiels, nouvelles paroissiales et avis.</p>
                </div>
                <button onClick={() => openNewsForm()} className="btn-primary">
                  <Plus className="h-4 w-4" /> Nouvelle actualité
                </button>
              </div>

              {news.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-church-line p-8 text-center text-sm text-church-muted">
                  Aucune actualité publiée pour le moment.
                </div>
              ) : (
                <div className="divide-y divide-church-line">
                  {news.map((n) => (
                    <div key={n.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-church-blue">
                          {n.category} · {formatPublishedDateTime(n.date, n.publishedAt)}
                        </span>
                        <h3 className="font-serif text-lg text-church-navy truncate">{n.title}</h3>
                        <p className="text-xs text-church-muted">
                          {n.readsCount || 0} vue(s) · {n.likes || 0} j’aime · {(n.comments || []).length} commentaire(s)
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => openNewsForm(n)} className="btn-secondary min-h-[38px] px-3 text-xs">
                          <Pencil className="h-3.5 w-3.5" /> Modifier
                        </button>
                        {confirmDeleteKey === `news:${n.id}` ? (
                          <button
                            onClick={async () => {
                              const res = await api.deleteNews(n.id);
                              onSyncPublicState({ news: res.news });
                              setConfirmDeleteKey(null);
                              notify('Actualité supprimée.');
                            }}
                            className="btn-primary min-h-[38px] bg-red-600 hover:bg-red-700 px-3 text-xs"
                          >
                            Confirmer
                          </button>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteKey(`news:${n.id}`)}
                            className="btn-secondary min-h-[38px] px-3 text-xs text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ==================== CREER / MODIFIER ACTUALITÉ ==================== */}
          {activeSubPage === 'actualites-creer' && editingNews && (
            <form onSubmit={handleSaveNews} className="surface p-5 sm:p-7 space-y-5">
              <div className="flex items-center justify-between border-b border-church-line pb-4">
                <h2 className="text-2xl">{news.some((n) => n.id === editingNews.id) ? 'Modifier l’actualité' : 'Publier une actualité'}</h2>
                <button type="button" onClick={() => onNavigateSubPage('actualites')} className="btn-ghost text-sm">
                  Annuler
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-church-navy">Titre *</label>
                  <input
                    required
                    value={editingNews.title}
                    onChange={(e) => setEditingNews({ ...editingNews, title: e.target.value })}
                    className="field"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-church-navy">Catégorie</label>
                  <select
                    value={editingNews.category}
                    onChange={(e) => setEditingNews({ ...editingNews, category: e.target.value as NewsItem['category'] })}
                    className="field"
                  >
                    <option value="Communiqué officiel">Communiqué officiel</option>
                    <option value="Vie de l’église">Vie de l’église</option>
                    <option value="Avis de décès">Avis de décès</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-church-navy">Horodatage de publication</label>
                  <div className="flex min-h-[44px] items-center gap-2 rounded-[var(--radius-control)] border border-church-line bg-church-light/70 px-3.5 text-sm text-church-navy">
                    <Clock className="h-4 w-4 shrink-0 text-church-blue" />
                    <span>
                      {editingNews.publishedAt
                        ? formatPublishedDateTime(editingNews.date, editingNews.publishedAt)
                        : 'Date et heure définies automatiquement à l’envoi'}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-church-navy">Auteur / Signataire</label>
                  <input
                    value={editingNews.author}
                    onChange={(e) => setEditingNews({ ...editingNews, author: e.target.value })}
                    className="field"
                  />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-church-navy cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(editingNews.isUrgent)}
                      onChange={(e) => setEditingNews({ ...editingNews, isUrgent: e.target.checked })}
                      className="h-4 w-4 accent-church-blue"
                    />
                    Marquer comme communiqué important
                  </label>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-church-navy">Résumé</label>
                <textarea
                  rows={2}
                  value={editingNews.summary}
                  onChange={(e) => setEditingNews({ ...editingNews, summary: e.target.value })}
                  className="field py-2.5 min-h-[70px]"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-church-navy">Contenu complet *</label>
                <textarea
                  required
                  rows={5}
                  value={editingNews.fullContent}
                  onChange={(e) => setEditingNews({ ...editingNews, fullContent: e.target.value })}
                  className="field py-2.5 min-h-[130px]"
                />
              </div>

              <div className="rounded-2xl border border-church-line p-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-lg">Médias & Documents joints (Photos, Vidéos, Audios, PDF & Google Drive)</h3>
                    <p className="text-xs text-church-muted">
                      Importez depuis votre appareil ou via Google Drive (document entier ou regroupement entier / au choix).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowNewsDrivePicker((v) => !v)}
                    className="btn-secondary min-h-[38px] text-xs"
                  >
                    <HardDrive className="h-3.5 w-3.5 text-church-blue" />
                    {showNewsDrivePicker ? 'Masquer Google Drive' : 'Importer depuis Google Drive'}
                  </button>
                </div>

                {showNewsDrivePicker && (
                  <GoogleDriveBrowser
                    compact
                    allowDocuments
                    linkedAccounts={driveAccounts}
                    linkedFolders={driveFolders}
                    defaultCategory="Événements"
                    onSyncDriveState={(patch) => {
                      onSyncDriveState(patch);
                      if (patch.albums) onSyncPublicState({ albums: patch.albums });
                    }}
                    onImportedToForm={(items, docs) => {
                      const importedPhotos = items.filter((it) => it.type === 'photo');
                      const importedVideos = items.filter((it) => it.type === 'video');
                      const importedAudios = items.filter((it) => it.type === 'audio');
                      const importedDocs = docs || [];
                      setEditingNews((prev) => {
                        if (!prev) return prev;
                        let nextVideoUrl = prev.videoUrl || '';
                        const extraVideos: MediaItem[] = [];
                        importedVideos.forEach((v) => {
                          if (!nextVideoUrl) nextVideoUrl = v.url;
                          else extraVideos.push(v);
                        });
                        let nextAudioUrl = prev.audioUrl || '';
                        const extraAudios: MediaItem[] = [];
                        importedAudios.forEach((a) => {
                          if (!nextAudioUrl) nextAudioUrl = a.url;
                          else extraAudios.push(a);
                        });
                        return {
                          ...prev,
                          coverImage: prev.coverImage || importedPhotos[0]?.url || '',
                          videoUrl: nextVideoUrl,
                          audioUrl: nextAudioUrl,
                          mediaItems: [...(prev.mediaItems || []), ...importedPhotos, ...extraVideos, ...extraAudios],
                          documents: [...(prev.documents || []), ...importedDocs]
                        };
                      });
                    }}
                    onNotify={notify}
                  />
                )}

                {editingNews.coverImage && (
                  <div className="relative inline-block">
                    <img src={sanitizeUrl(editingNews.coverImage)} alt="" className="h-36 rounded-xl border border-church-line object-cover" />
                    <button
                      type="button"
                      onClick={() => setEditingNews({ ...editingNews, coverImage: '' })}
                      className="absolute right-1.5 top-1.5 rounded-full bg-white/95 p-1 text-red-700 shadow-xs"
                      aria-label="Retirer l'illustration"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="mb-1.5 text-xs font-semibold text-church-muted">Photo principale</p>
                    <MediaBatchUploader
                      mode="single-image"
                      label="Ajouter une photo d’illustration"
                      allowFolder={false}
                      onUploadedFiles={(res) => {
                        if (res[0]) setEditingNews((prev) => (prev ? { ...prev, coverImage: res[0].url } : prev));
                      }}
                    />
                  </div>
                  <div>
                    <p className="mb-1.5 text-xs font-semibold text-church-muted">Photos complémentaires (lot ou dossier)</p>
                    <MediaBatchUploader
                      mode="photos"
                      label="Ajouter plusieurs photos"
                      onUploadedFiles={(res) => {
                        const added: MediaItem[] = res.map((r, i) => ({
                          id: `news-img-${Date.now()}-${i}`,
                          type: 'photo',
                          url: r.url,
                          caption: r.name
                        }));
                        setEditingNews((prev) =>
                          prev ? { ...prev, mediaItems: [...(prev.mediaItems || []), ...added] } : prev
                        );
                      }}
                    />
                  </div>
                </div>

                <div className="grid gap-4 border-t border-church-line pt-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-church-muted">Vidéo (YouTube ou fichier MP4)</label>
                    <input
                      value={editingNews.videoUrl || ''}
                      onChange={(e) => setEditingNews({ ...editingNews, videoUrl: e.target.value })}
                      placeholder="Lien YouTube ou /uploads/video.mp4"
                      className="field text-sm"
                    />
                    <MediaBatchUploader
                      mode="video"
                      allowFolder={false}
                      onUploadedFiles={(res) => {
                        if (res[0]) setEditingNews((prev) => (prev ? { ...prev, videoUrl: res[0].url } : prev));
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-church-muted">Audio (MP3, WAV, M4A)</label>
                    <input
                      value={editingNews.audioUrl || ''}
                      onChange={(e) => setEditingNews({ ...editingNews, audioUrl: e.target.value })}
                      placeholder="Lien audio (/uploads/... ou https://)"
                      className="field text-sm"
                    />
                    <MediaBatchUploader
                      mode="audio"
                      allowFolder={false}
                      onUploadedFiles={(res) => {
                        if (res[0]) setEditingNews((prev) => (prev ? { ...prev, audioUrl: res[0].url } : prev));
                      }}
                    />
                  </div>
                </div>

                {(editingNews.mediaItems || []).length > 0 && (
                  <div className="space-y-2 border-t border-church-line pt-3">
                    <p className="text-xs font-semibold text-church-navy">
                      Médias joints à l’actualité ({editingNews.mediaItems!.length})
                    </p>
                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                      {editingNews.mediaItems!.map((m, idx) => (
                        <div key={m.id || idx} className="relative rounded-xl border border-church-line p-1.5">
                          {m.type === 'photo' ? (
                            <img src={sanitizeUrl(m.url)} alt="" className="aspect-[4/3] w-full rounded-lg object-cover" />
                          ) : (
                            <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-1 rounded-lg bg-church-navy px-2 text-center text-xs text-white">
                              {m.type === 'video' ? <Film className="h-5 w-5" /> : <Headphones className="h-5 w-5" />}
                              <span className="line-clamp-2">{m.caption || (m.type === 'video' ? 'Vidéo' : 'Audio')}</span>
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              setEditingNews({
                                ...editingNews,
                                mediaItems: (editingNews.mediaItems || []).filter((_, i) => i !== idx)
                              })
                            }
                            className="absolute right-2 top-2 rounded-full bg-white/95 p-1 text-red-700 shadow-xs"
                            aria-label="Retirer ce média"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-3 border-t border-church-line pt-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-church-navy">Documents entiers associés (PDF, Word, Slides...)</p>
                    <button
                      type="button"
                      onClick={() => setShowNewsDrivePicker(true)}
                      className="btn-secondary min-h-[34px] text-xs"
                    >
                      <HardDrive className="h-3.5 w-3.5 text-church-blue" />
                      Document entier depuis Drive
                    </button>
                  </div>
                  <MediaBatchUploader
                    mode="documents"
                    onUploadedFiles={() => {}}
                    onUploadedDocuments={(docs) =>
                      setEditingNews((prev) =>
                        prev ? { ...prev, documents: [...(prev.documents || []), ...docs] } : prev
                      )
                    }
                  />
                  {(editingNews.documents || []).length > 0 && (
                    <ul className="divide-y divide-church-line rounded-xl border border-church-line">
                      {editingNews.documents!.map((d, i) => (
                        <li key={i} className="flex items-center justify-between px-3 py-2 text-sm">
                          <span className="flex items-center gap-2 truncate">
                            <FileText className="h-4 w-4 text-church-blue shrink-0" />
                            {d.title} {d.fileSize && <span className="text-xs text-church-muted">({d.fileSize})</span>}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setEditingNews({
                                ...editingNews,
                                documents: (editingNews.documents || []).filter((_, idx) => idx !== i)
                              })
                            }
                            className="text-xs text-red-700 hover:underline"
                          >
                            Retirer
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => onNavigateSubPage('actualites')} className="btn-secondary">
                  Annuler
                </button>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? 'Enregistrement...' : 'Publier l’actualité'}
                </button>
              </div>
            </form>
          )}

          {/* ==================== LISTE GALERIE ==================== */}
          {activeSubPage === 'galerie' && (
            <div className="surface p-5 sm:p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl">Galerie Photo & Vidéo</h2>
                  <p className="text-sm text-church-muted">Importez des lots de photos ou des dossiers complets en un clic.</p>
                </div>
                <button onClick={() => openAlbumForm()} className="btn-primary">
                  <Plus className="h-4 w-4" /> Nouvel album
                </button>
              </div>

              {albums.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-church-line p-8 text-center text-sm text-church-muted">
                  Aucun album dans la galerie pour le moment.
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {albums.map((alb) => (
                    <div key={alb.id} className="surface overflow-hidden">
                      {sanitizeUrl(alb.coverImage) ? (
                        <img
                          src={sanitizeUrl(alb.coverImage)}
                          alt={alb.title}
                          className="aspect-[4/3] w-full object-cover bg-church-navy"
                        />
                      ) : (
                        <div className="flex aspect-[4/3] w-full items-center justify-center bg-church-navy">
                          <Images className="h-9 w-9 text-white/75" aria-hidden="true" />
                        </div>
                      )}
                      <div className="p-4 space-y-2">
                        <div className="text-xs font-semibold text-church-blue">
                          {alb.category} · {alb.mediaCount || alb.items.length} média(s) · {alb.viewsCount || 0} vue(s)
                        </div>
                        <h3 className="font-serif text-lg text-church-navy">{alb.title}</h3>
                        <div className="flex items-center gap-2 pt-2">
                          <button onClick={() => openAlbumForm(alb)} className="btn-secondary min-h-[36px] flex-1 text-xs">
                            <Pencil className="h-3.5 w-3.5" /> Modifier
                          </button>
                          {confirmDeleteKey === `alb:${alb.id}` ? (
                            <button
                              onClick={async () => {
                                const res = await api.deleteAlbum(alb.id);
                                onSyncPublicState({ albums: res.albums });
                                setConfirmDeleteKey(null);
                                notify('Album supprimé.');
                              }}
                              className="btn-primary min-h-[36px] bg-red-600 hover:bg-red-700 px-3 text-xs"
                            >
                              OK
                            </button>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteKey(`alb:${alb.id}`)}
                              className="btn-secondary min-h-[36px] px-3 text-xs text-red-700"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ==================== CREER / MODIFIER ALBUM ==================== */}
          {activeSubPage === 'galerie-creer' && editingAlbum && (
            <form onSubmit={handleSaveAlbum} className="surface p-5 sm:p-7 space-y-5">
              <div className="flex items-center justify-between border-b border-church-line pb-4">
                <h2 className="text-2xl">{albums.some((a) => a.id === editingAlbum.id) ? 'Modifier l’album' : 'Créer un album galerie'}</h2>
                <button type="button" onClick={() => onNavigateSubPage('galerie')} className="btn-ghost text-sm">
                  Annuler
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-church-navy">Titre de l’album *</label>
                  <input
                    required
                    value={editingAlbum.title}
                    onChange={(e) => setEditingAlbum({ ...editingAlbum, title: e.target.value })}
                    className="field"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-church-navy">Catégorie</label>
                  <select
                    value={editingAlbum.category}
                    onChange={(e) => setEditingAlbum({ ...editingAlbum, category: e.target.value as AlbumItem['category'] })}
                    className="field"
                  >
                    <option value="Cultes">Cultes</option>
                    <option value="Événements">Événements</option>
                    <option value="Jeunesse">Jeunesse</option>
                    <option value="Chorale & Louange">Chorale & Louange</option>
                    <option value="Femmes MIFA">Femmes MIFA</option>
                    <option value="Départements">Départements</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-church-navy">Date</label>
                  <input
                    type="date"
                    value={editingAlbum.date}
                    onChange={(e) => setEditingAlbum({ ...editingAlbum, date: e.target.value })}
                    className="field"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-church-navy">Description courte</label>
                  <textarea
                    rows={2}
                    value={editingAlbum.description}
                    onChange={(e) => setEditingAlbum({ ...editingAlbum, description: e.target.value })}
                    className="field py-2 min-h-[70px]"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-church-line p-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-lg">Importer des lots de photos ou depuis Google Drive</h3>
                  <button
                    type="button"
                    onClick={() => setShowAlbumDrivePicker((v) => !v)}
                    className="btn-secondary min-h-[38px] text-xs"
                  >
                    <HardDrive className="h-3.5 w-3.5 text-church-blue" />
                    {showAlbumDrivePicker ? 'Masquer Google Drive' : 'Parcourir Google Drive'}
                  </button>
                </div>

                {showAlbumDrivePicker && (
                  <GoogleDriveBrowser
                    compact
                    allowDocuments={false}
                    linkedAccounts={driveAccounts}
                    linkedFolders={driveFolders}
                    targetAlbumId={albums.some((a) => a.id === editingAlbum.id) ? editingAlbum.id : undefined}
                    defaultCategory={editingAlbum.category}
                    onSyncDriveState={(patch) => {
                      onSyncDriveState(patch);
                      if (patch.albums) onSyncPublicState({ albums: patch.albums });
                    }}
                    onImportedToForm={(items) => {
                      setEditingAlbum((prev) => {
                        if (!prev) return prev;
                        const nextItems = [...prev.items, ...items];
                        const hasPhoto = nextItems.some((it) => it.type === 'photo');
                        const hasNonPhoto = nextItems.some((it) => it.type !== 'photo');
                        const nextType: AlbumItem['type'] =
                          hasPhoto && hasNonPhoto ? 'mixte' : !hasPhoto && nextItems.some((it) => it.type === 'video') ? 'video' : 'photo';
                        return {
                          ...prev,
                          type: nextType,
                          items: nextItems,
                          coverImage: prev.coverImage || nextItems.find((it) => it.type === 'photo')?.url || nextItems[0]?.url || '',
                          mediaCount: nextItems.length
                        };
                      });
                    }}
                    onNotify={notify}
                  />
                )}

                <MediaBatchUploader
                  mode="photos"
                  helperText="Sélectionnez plusieurs photos d'un coup, glissez-déposez ou importez un dossier complet depuis votre appareil."
                  onUploadedFiles={(res) => {
                    const added: MediaItem[] = res.map((r, i) => ({
                      id: `media-${Date.now()}-${i}`,
                      type: 'photo',
                      url: r.url,
                      caption: r.name
                    }));
                    setEditingAlbum((prev) => {
                      if (!prev) return prev;
                      const nextItems = [...prev.items, ...added];
                      return {
                        ...prev,
                        items: nextItems,
                        coverImage: prev.coverImage || nextItems[0]?.url || '',
                        mediaCount: nextItems.length
                      };
                    });
                  }}
                />

                {/* Ajouter aussi une vidéo */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-church-line">
                  <input
                    value={videoItemUrl}
                    onChange={(e) => setVideoItemUrl(e.target.value)}
                    placeholder="Lien vidéo YouTube ou MP4 à ajouter à l'album"
                    className="field flex-1 text-sm min-w-[220px]"
                  />
                  <input
                    value={videoItemCaption}
                    onChange={(e) => setVideoItemCaption(e.target.value)}
                    placeholder="Légende vidéo"
                    className="field w-48 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!videoItemUrl.trim()) return;
                      const newVid: MediaItem = {
                        id: `vid-${Date.now()}`,
                        type: 'video',
                        url: toSafeYoutubeEmbed(videoItemUrl.trim()),
                        caption: videoItemCaption.trim() || 'Vidéo'
                      };
                      setEditingAlbum({
                        ...editingAlbum,
                        type: editingAlbum.items.some((i) => i.type === 'photo') ? 'mixte' : 'video',
                        items: [...editingAlbum.items, newVid],
                        mediaCount: editingAlbum.items.length + 1
                      });
                      setVideoItemUrl('');
                      setVideoItemCaption('');
                    }}
                    className="btn-secondary text-xs"
                  >
                    + Ajouter vidéo
                  </button>
                </div>

                {editingAlbum.items.length > 0 && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {editingAlbum.items.map((item, idx) => (
                      <div key={item.id} className="rounded-xl border border-church-line p-2 space-y-1.5">
                        {item.type === 'photo' ? (
                          <img src={sanitizeUrl(item.url)} alt="" className="aspect-[4/3] w-full rounded-lg object-cover" />
                        ) : (
                          <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-1 rounded-lg bg-church-navy text-xs text-white">
                            {item.type === 'audio' ? <Headphones className="h-5 w-5" /> : <Film className="h-5 w-5" />}
                            <span>{item.type === 'audio' ? 'Audio' : 'Vidéo'}</span>
                          </div>
                        )}
                        <input
                          value={item.caption || ''}
                          onChange={(e) =>
                            setEditingAlbum({
                              ...editingAlbum,
                              items: editingAlbum.items.map((it, i) => (i === idx ? { ...it, caption: e.target.value } : it))
                            })
                          }
                          placeholder="Légende..."
                          className="w-full rounded-lg border border-church-line px-2 py-1 text-xs"
                        />
                        <div className="flex items-center justify-between text-[11px]">
                          {item.type === 'photo' ? (
                            <button
                              type="button"
                              onClick={() => setEditingAlbum({ ...editingAlbum, coverImage: item.url })}
                              className={`font-semibold ${
                                editingAlbum.coverImage === item.url ? 'text-emerald-700' : 'text-church-blue hover:underline'
                              }`}
                            >
                              {editingAlbum.coverImage === item.url ? 'Couverture ✓' : 'Couverture'}
                            </button>
                          ) : (
                            <span className="text-church-muted">{item.type === 'audio' ? 'Audio' : 'Vidéo'}</span>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              const next = editingAlbum.items.filter((_, i) => i !== idx);
                              setEditingAlbum({
                                ...editingAlbum,
                                items: next,
                                mediaCount: next.length
                              });
                            }}
                            className="text-red-700 hover:underline"
                          >
                            Retirer
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => onNavigateSubPage('galerie')} className="btn-secondary">
                  Annuler
                </button>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? 'Enregistrement...' : 'Enregistrer l’album'}
                </button>
              </div>
            </form>
          )}

          {/* ==================== GOOGLE DRIVE MULTI-COMPTES (ADMIN) ==================== */}
          {activeSubPage === 'drive' && (
            <GoogleDriveBrowser
              linkedAccounts={driveAccounts}
              linkedFolders={driveFolders}
              onSyncDriveState={(patch) => {
                onSyncDriveState(patch);
                if (patch.albums) onSyncPublicState({ albums: patch.albums });
              }}
              onNotify={notify}
            />
          )}

          {/* ==================== DÉPARTEMENTS ==================== */}
          {activeSubPage === 'departements' && (
            <div className="space-y-6">
              {editingDept ? (
                <form onSubmit={handleSaveDepartment} className="surface p-5 sm:p-7 space-y-5">
                  <div className="flex items-center justify-between border-b border-church-line pb-4">
                    <h2 className="text-2xl">
                      {departments.some((d) => d.id === editingDept.id) ? `Modifier : ${editingDept.name}` : 'Nouveau département'}
                    </h2>
                    <button type="button" onClick={() => setEditingDept(null)} className="btn-ghost text-sm">
                      Annuler
                    </button>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-church-navy">Nom du département *</label>
                      <input
                        required
                        value={editingDept.name}
                        onChange={(e) => setEditingDept({ ...editingDept, name: e.target.value })}
                        className="field"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-church-navy">Sigle / Code</label>
                      <input
                        value={editingDept.code}
                        onChange={(e) => setEditingDept({ ...editingDept, code: e.target.value })}
                        className="field"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-sm font-medium text-church-navy">Devise / Slogan (optionnel)</label>
                      <input
                        value={editingDept.tagline}
                        onChange={(e) => setEditingDept({ ...editingDept, tagline: e.target.value })}
                        className="field"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-sm font-medium text-church-navy">Description</label>
                      <textarea
                        rows={3}
                        value={editingDept.description}
                        onChange={(e) => setEditingDept({ ...editingDept, description: e.target.value })}
                        className="field py-2.5 min-h-[84px]"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-church-navy">Responsable</label>
                      <input
                        value={editingDept.leader}
                        onChange={(e) => setEditingDept({ ...editingDept, leader: e.target.value })}
                        className="field"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-church-navy">Fonction du responsable</label>
                      <input
                        value={editingDept.leaderRole}
                        onChange={(e) => setEditingDept({ ...editingDept, leaderRole: e.target.value })}
                        className="field"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-church-navy">Jour & Horaire des réunions</label>
                      <input
                        value={editingDept.meetingSchedule}
                        onChange={(e) => setEditingDept({ ...editingDept, meetingSchedule: e.target.value })}
                        className="field"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-church-navy">Lieu de rencontre</label>
                      <input
                        value={editingDept.meetingLocation}
                        onChange={(e) => setEditingDept({ ...editingDept, meetingLocation: e.target.value })}
                        className="field"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-church-navy">Téléphone</label>
                      <input
                        value={editingDept.contactPhone || ''}
                        onChange={(e) => setEditingDept({ ...editingDept, contactPhone: e.target.value })}
                        className="field"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-church-navy">E-mail</label>
                      <input
                        value={editingDept.contactEmail || ''}
                        onChange={(e) => setEditingDept({ ...editingDept, contactEmail: e.target.value })}
                        className="field"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-church-navy">Activités principales (une par ligne)</label>
                    <textarea
                      rows={3}
                      value={deptActivitiesText}
                      onChange={(e) => setDeptActivitiesText(e.target.value)}
                      className="field py-2.5 min-h-[84px]"
                    />
                  </div>

                  <div className="rounded-2xl border border-church-line p-4 space-y-4">
                    <h3 className="text-lg">Logo officiel, image de couverture, galerie photos & documents</h3>
                    <div className="space-y-2 rounded-xl border border-church-line/80 bg-church-light/40 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-church-navy">Logo du département (optionnel)</span>
                        {editingDept.logoUrl && (
                          <button
                            type="button"
                            onClick={() => setEditingDept({ ...editingDept, logoUrl: '' })}
                            className="text-xs text-red-700 hover:underline"
                          >
                            Retirer le logo
                          </button>
                        )}
                      </div>
                      {editingDept.logoUrl && sanitizeUrl(editingDept.logoUrl) && (
                        <img
                          src={sanitizeUrl(editingDept.logoUrl)}
                          alt={`Logo ${editingDept.name}`}
                          className="h-16 w-16 rounded-xl border border-church-line bg-white object-contain p-1"
                        />
                      )}
                      <MediaBatchUploader
                        mode="single-image"
                        label="Importer / remplacer le logo officiel"
                        allowFolder={false}
                        onUploadedFiles={(res) => {
                          if (res[0]) setEditingDept((prev) => (prev ? { ...prev, logoUrl: res[0].url } : prev));
                        }}
                      />
                    </div>
                    <MediaBatchUploader
                      mode="single-image"
                      label="Photo de couverture du département"
                      allowFolder={false}
                      onUploadedFiles={(res) => {
                        if (res[0]) setEditingDept((prev) => (prev ? { ...prev, coverImage: res[0].url } : prev));
                      }}
                    />
                    <MediaBatchUploader
                      mode="photos"
                      label="Photos du département (lot ou dossier)"
                      onUploadedFiles={(res) => {
                        setEditingDept((prev) =>
                          prev ? { ...prev, galleryImages: [...prev.galleryImages, ...res.map((r) => r.url)] } : prev
                        );
                      }}
                    />
                    <MediaBatchUploader
                      mode="documents"
                      label="Documents du département (PDF, Word...)"
                      onUploadedFiles={() => {}}
                      onUploadedDocuments={(docs) =>
                        setEditingDept((prev) =>
                          prev ? { ...prev, documents: [...(prev.documents || []), ...docs] } : prev
                        )
                      }
                    />
                  </div>

                  <div className="flex justify-end gap-3">
                    <button type="button" onClick={() => setEditingDept(null)} className="btn-secondary">
                      Annuler
                    </button>
                    <button type="submit" disabled={saving} className="btn-primary">
                      {saving ? 'Enregistrement...' : 'Enregistrer le département'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="surface p-5 sm:p-6 space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-2xl">Départements & Groupes</h2>
                      <p className="text-sm text-church-muted">Ajoutez ou mettez à jour les responsables, horaires, photos et documents.</p>
                    </div>
                    <button
                      onClick={() => {
                        setEditingDept(emptyDepartmentForm());
                        setDeptActivitiesText('');
                      }}
                      className="btn-primary"
                    >
                      <Plus className="h-4 w-4" /> Nouveau département
                    </button>
                  </div>

                  <div className="divide-y divide-church-line">
                    {departments.map((d) => (
                      <div key={d.id} className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <span className="text-xs font-semibold text-church-blue">{d.code}</span>
                          <h3 className="font-serif text-lg text-church-navy">{d.name}</h3>
                          {d.leader && <p className="text-xs text-church-muted">Responsable : {d.leader}</p>}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button onClick={() => handleSelectDeptEdit(d)} className="btn-secondary min-h-[38px] px-3 text-xs">
                            <Pencil className="h-3.5 w-3.5" /> Modifier
                          </button>
                          {confirmDeleteKey === `dept:${d.id}` ? (
                            <button
                              onClick={async () => {
                                const res = await api.deleteDepartment(d.id);
                                onSyncPublicState({ departments: res.departments });
                                setConfirmDeleteKey(null);
                                notify('Département supprimé.');
                              }}
                              className="btn-primary min-h-[38px] bg-red-600 hover:bg-red-700 px-3 text-xs"
                            >
                              Confirmer
                            </button>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteKey(`dept:${d.id}`)}
                              className="btn-secondary min-h-[38px] px-3 text-xs text-red-700"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==================== COMMENTAIRES ==================== */}
          {activeSubPage === 'commentaires' && (
            <div className="surface p-5 sm:p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl">Modération des commentaires</h2>
                  <p className="text-sm text-church-muted">
                    Les messages sont publiés automatiquement ; vous pouvez les approuver ou les retirer à tout moment.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'tous' as const, label: 'Tous' },
                    { id: 'signales' as const, label: 'Signalés' },
                    { id: 'auto-publie' as const, label: 'Auto-publiés' },
                    { id: 'approuve' as const, label: 'Approuvés' }
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setCommentFilter(f.id)}
                      className={commentFilter === f.id ? 'chip-active' : 'chip'}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {filteredComments.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-church-line p-8 text-center text-sm text-church-muted">
                  Aucun commentaire dans cette vue.
                </div>
              ) : (
                <div className="divide-y divide-church-line">
                  {filteredComments.map((cm) => (
                    <div key={cm.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="font-semibold text-church-navy">{cm.authorName}</span>
                          <span className="text-church-muted">· {cm.date}</span>
                          <span className="rounded-full bg-church-tint px-2 py-0.5 text-[11px] font-medium text-church-blue">
                            {cm.targetTitle}
                          </span>
                          {cm.reported && (
                            <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700">
                              Signalé
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-church-dark">{cm.text}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={async () => {
                            const res = await api.keepComment(cm.targetType, cm.targetId, cm.id);
                            onSyncPublicState({ cultes: res.cultes, events: res.events, news: res.news });
                            notify('Commentaire approuvé.');
                          }}
                          className="btn-secondary min-h-[36px] px-3 text-xs"
                        >
                          <Check className="h-3.5 w-3.5 text-emerald-700" /> Garder
                        </button>
                        <button
                          onClick={async () => {
                            const res = await api.removeComment(cm.targetType, cm.targetId, cm.id);
                            onSyncPublicState({ cultes: res.cultes, events: res.events, news: res.news });
                            notify('Commentaire retiré.');
                          }}
                          className="btn-secondary min-h-[36px] px-3 text-xs text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Retirer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ==================== MÉDIAS, LOGO, HERO & BANNIÈRE ==================== */}
          {activeSubPage === 'medias' && (
            <form onSubmit={handleSaveMediaAndHero} className="space-y-6">
              <div className="surface p-5 sm:p-6 space-y-5">
                <h2 className="text-2xl">Logo officiel de l’église</h2>
                <div className="flex flex-wrap items-center gap-4">
                  {logoDraft && (
                    <img src={sanitizeUrl(logoDraft)} alt="Logo actuel" className="h-16 w-16 rounded-xl border border-church-line object-contain p-1" />
                  )}
                  {logoDraft && (
                    <button type="button" onClick={() => setLogoDraft(null)} className="btn-secondary text-xs">
                      Revenir à l’emblème EEADCI
                    </button>
                  )}
                </div>
                <MediaBatchUploader
                  mode="single-image"
                  label="Importer le logo officiel (PNG, SVG, JPG)"
                  allowFolder={false}
                  onUploadedFiles={(res) => {
                    if (res[0]) setLogoDraft(res[0].url);
                  }}
                />
              </div>

              <div className="surface p-5 sm:p-6 space-y-4">
                <h2 className="text-2xl">Textes de la page d’accueil (Hero)</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-church-navy">Mention dénomination</label>
                    <input
                      value={heroDraft.nationalBadge}
                      onChange={(e) => setHeroDraft({ ...heroDraft, nationalBadge: e.target.value })}
                      className="field"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-church-navy">Localisation</label>
                    <input
                      value={heroDraft.locationBadge}
                      onChange={(e) => setHeroDraft({ ...heroDraft, locationBadge: e.target.value })}
                      className="field"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-church-navy">Grand titre d’accueil</label>
                    <input
                      value={heroDraft.mainTitle}
                      onChange={(e) => setHeroDraft({ ...heroDraft, mainTitle: e.target.value })}
                      className="field"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-church-navy">Message de bienvenue</label>
                    <textarea
                      rows={3}
                      value={heroDraft.welcomeMessage}
                      onChange={(e) => setHeroDraft({ ...heroDraft, welcomeMessage: e.target.value })}
                      className="field py-2.5 min-h-[84px]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-church-navy">Bouton principal</label>
                    <input
                      value={heroDraft.actionButtonCulte}
                      onChange={(e) => setHeroDraft({ ...heroDraft, actionButtonCulte: e.target.value })}
                      className="field"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-church-navy">Bouton secondaire</label>
                    <input
                      value={heroDraft.actionButtonEvents}
                      onChange={(e) => setHeroDraft({ ...heroDraft, actionButtonEvents: e.target.value })}
                      className="field"
                    />
                  </div>
                </div>
              </div>

              <div className="surface p-5 sm:p-6 space-y-4">
                <h2 className="text-2xl">Bannière d’annonce en haut de l’accueil</h2>
                <label className="flex items-center gap-2.5 text-sm font-semibold text-church-navy cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bannerDraft.enabled}
                    onChange={(e) => setBannerDraft({ ...bannerDraft, enabled: e.target.checked })}
                    className="h-4 w-4 accent-church-blue"
                  />
                  Afficher une bannière d’annonce en haut du site
                </label>
                {bannerDraft.enabled && (
                  <div className="grid gap-3 sm:grid-cols-[1fr_200px]">
                    <input
                      value={bannerDraft.text}
                      onChange={(e) => setBannerDraft({ ...bannerDraft, text: e.target.value })}
                      placeholder="Ex. Grande semaine de prière du 12 au 18 mai à 18h30"
                      className="field"
                    />
                    <select
                      value={bannerDraft.linkPage || 'evenements'}
                      onChange={(e) => setBannerDraft({ ...bannerDraft, linkPage: e.target.value as PageView })}
                      className="field"
                    >
                      <option value="evenements">Lien vers Événements</option>
                      <option value="cultes">Lien vers Cultes</option>
                      <option value="actualites">Lien vers Actualités</option>
                      <option value="departements">Lien vers Départements</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="surface p-5 sm:p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-2xl">Image de fond de la section Héros (Accueil)</h2>
                    <p className="text-xs text-church-muted">
                      Photo affichée en plein écran en haut de la page d’accueil. Modifiable par fichier local, lien direct ou Google Drive.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowHeroDrivePicker((v) => !v)}
                      className="btn-secondary min-h-[36px] text-xs"
                    >
                      <HardDrive className="h-3.5 w-3.5 text-church-blue" />
                      {showHeroDrivePicker ? 'Masquer Drive' : 'Choisir depuis Google Drive'}
                    </button>
                    {sanitizeUrl(imagesDraft.heroImage) && (
                      <button
                        type="button"
                        onClick={() =>
                          setImagesDraft({
                            heroImage: '',
                            pastorImage: '',
                            choirImage: '',
                            youthImage: ''
                          })
                        }
                        className="btn-ghost text-xs text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Supprimer la photo (fond bleu sobre)
                      </button>
                    )}
                  </div>
                </div>

                {showHeroDrivePicker && (
                  <GoogleDriveBrowser
                    compact
                    allowDocuments={false}
                    linkedAccounts={driveAccounts}
                    linkedFolders={driveFolders}
                    defaultCategory="Cultes"
                    onSyncDriveState={(patch) => {
                      onSyncDriveState(patch);
                      if (patch.albums) onSyncPublicState({ albums: patch.albums });
                    }}
                    onImportedToForm={(items) => {
                      const firstPhoto = items.find((it) => it.type === 'photo');
                      if (firstPhoto) {
                        setImagesDraft((prev) => ({ ...prev, heroImage: firstPhoto.url }));
                        setShowHeroDrivePicker(false);
                        notify('Image sélectionnée. Cliquez sur « Enregistrer » ci-dessous pour appliquer.');
                      } else {
                        notify('Veuillez sélectionner une photo pour le fond de la section Héros.', 'err');
                      }
                    }}
                    onNotify={notify}
                  />
                )}

                <div className="grid gap-5 md:grid-cols-[1.2fr_1fr] items-start">
                  <div className="overflow-hidden rounded-2xl border border-church-line bg-church-navy">
                    {sanitizeUrl(imagesDraft.heroImage) ? (
                      <img
                        src={sanitizeUrl(imagesDraft.heroImage)}
                        alt="Aperçu du fond de la section Héros"
                        className="aspect-[16/9] w-full object-cover"
                      />
                    ) : (
                      <div className="flex aspect-[16/9] w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#0F244A] via-church-navy to-[#244E99] p-6 text-center text-white">
                        <p className="font-serif text-lg">Fond bleu sobre (aucune photo sélectionnée)</p>
                        <p className="text-xs text-white/75">
                          Importez une photo de votre choix ci-contre ou laissez ce fond sobre.
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-church-navy">
                        Lien direct ou chemin de l’image
                      </label>
                      <input
                        value={imagesDraft.heroImage || ''}
                        onChange={(e) => setImagesDraft((prev) => ({ ...prev, heroImage: e.target.value }))}
                        placeholder="https://... ou importer une photo ci-dessous"
                        className="field text-sm"
                      />
                    </div>
                    <MediaBatchUploader
                      mode="single-image"
                      label="Importer une nouvelle photo de fond (JPG, PNG, WebP)"
                      allowFolder={false}
                      onUploadedFiles={(res) => {
                        if (res[0]) setImagesDraft((prev) => ({ ...prev, heroImage: res[0].url }));
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? 'Enregistrement...' : 'Enregistrer les textes et médias'}
                </button>
              </div>
            </form>
          )}

          {/* ==================== APPARENCE, SECTIONS & HORAIRES ==================== */}
          {activeSubPage === 'parametres' && (
            <form onSubmit={handleSaveSettings} className="space-y-6">
              <div className="surface p-5 sm:p-6 space-y-5">
                <h2 className="text-2xl">Apparence & Personnalisation du site</h2>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-church-navy">Couleur principale</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={settingsDraft.theme?.primaryColor || '#2854A6'}
                        onChange={(e) =>
                          setSettingsDraft({
                            ...settingsDraft,
                            theme: { ...settingsDraft.theme!, primaryColor: e.target.value }
                          })
                        }
                        className="h-11 w-14 cursor-pointer rounded-xl border border-church-line"
                      />
                      <input
                        value={settingsDraft.theme?.primaryColor || '#2854A6'}
                        onChange={(e) =>
                          setSettingsDraft({
                            ...settingsDraft,
                            theme: { ...settingsDraft.theme!, primaryColor: e.target.value }
                          })
                        }
                        className="field text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-church-navy">Couleur titres & pied</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={settingsDraft.theme?.navyColor || '#173567'}
                        onChange={(e) =>
                          setSettingsDraft({
                            ...settingsDraft,
                            theme: { ...settingsDraft.theme!, navyColor: e.target.value }
                          })
                        }
                        className="h-11 w-14 cursor-pointer rounded-xl border border-church-line"
                      />
                      <input
                        value={settingsDraft.theme?.navyColor || '#173567'}
                        onChange={(e) =>
                          setSettingsDraft({
                            ...settingsDraft,
                            theme: { ...settingsDraft.theme!, navyColor: e.target.value }
                          })
                        }
                        className="field text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-church-navy">Style des angles</label>
                    <select
                      value={settingsDraft.theme?.radiusStyle || 'doux'}
                      onChange={(e) =>
                        setSettingsDraft({
                          ...settingsDraft,
                          theme: {
                            ...settingsDraft.theme!,
                            radiusStyle: e.target.value as 'classique' | 'doux' | 'tres-doux'
                          }
                        })
                      }
                      className="field"
                    >
                      <option value="classique">Classique (légers)</option>
                      <option value="doux">Doux (recommandé)</option>
                      <option value="tres-doux">Très arrondis</option>
                    </select>
                  </div>
                </div>

                <div className="pt-3 border-t border-church-line">
                  <p className="mb-3 text-sm font-semibold text-church-navy">Sections visibles sur la page d’accueil</p>
                  <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                    {(
                      [
                        { key: 'showQuickAccess', label: 'Cartes d’accès rapide' },
                        { key: 'showLatestCulte', label: 'Dernière prédication' },
                        { key: 'showSchedules', label: 'Horaires hebdomadaires' },
                        { key: 'showEventsAndNews', label: 'Événements & Actualités' },
                        { key: 'showGallery', label: 'En images (Galerie)' },
                        { key: 'showDepartments', label: 'Départements & groupes' }
                      ] as const
                    ).map(({ key, label }) => (
                      <label key={key} className="flex items-center gap-2 text-sm text-church-dark cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(settingsDraft.homeSections?.[key])}
                          onChange={(e) =>
                            setSettingsDraft({
                              ...settingsDraft,
                              homeSections: { ...settingsDraft.homeSections!, [key]: e.target.checked }
                            })
                          }
                          className="h-4 w-4 accent-church-blue"
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="surface p-5 sm:p-6 space-y-4">
                <h2 className="text-2xl">Coordonnées & rattachement de l’assemblée</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-church-navy">Nom de l’assemblée (Annexe)</label>
                    <input
                      value={settingsDraft.parishName}
                      onChange={(e) => setSettingsDraft({ ...settingsDraft, parishName: e.target.value })}
                      className="field"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-church-navy">Statut d’annexe</label>
                    <input
                      value={settingsDraft.annexLabel || ''}
                      onChange={(e) => setSettingsDraft({ ...settingsDraft, annexLabel: e.target.value })}
                      placeholder="Ex. Annexe de l’église d’Anyama Ran-Extension"
                      className="field"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-church-navy">Église mère de rattachement</label>
                    <input
                      value={settingsDraft.motherChurch || ''}
                      onChange={(e) => setSettingsDraft({ ...settingsDraft, motherChurch: e.target.value })}
                      placeholder="Ex. Église Évangélique des Assemblées de Dieu — Anyama Ran-Extension"
                      className="field"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-church-navy">Pasteur principal</label>
                    <input
                      value={settingsDraft.principalPastor || ''}
                      onChange={(e) => setSettingsDraft({ ...settingsDraft, principalPastor: e.target.value })}
                      placeholder="Ex. Pasteur Djah Douogoi Nicaise"
                      className="field"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-church-navy">Ville / District</label>
                    <input
                      value={settingsDraft.city}
                      onChange={(e) => setSettingsDraft({ ...settingsDraft, city: e.target.value })}
                      className="field"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-church-navy">Adresse</label>
                    <input
                      value={settingsDraft.address}
                      onChange={(e) => setSettingsDraft({ ...settingsDraft, address: e.target.value })}
                      className="field"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-church-navy">Téléphone public (optionnel)</label>
                    <input
                      value={settingsDraft.phone}
                      onChange={(e) => setSettingsDraft({ ...settingsDraft, phone: e.target.value })}
                      className="field"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-church-navy">E-mail public (optionnel)</label>
                    <input
                      type="email"
                      value={settingsDraft.email}
                      onChange={(e) => setSettingsDraft({ ...settingsDraft, email: e.target.value })}
                      className="field"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-church-navy">
                      Résumé historique & fondation (EEADCI)
                    </label>
                    <textarea
                      rows={3}
                      value={settingsDraft.foundationSummary || ''}
                      onChange={(e) => setSettingsDraft({ ...settingsDraft, foundationSummary: e.target.value })}
                      className="field py-2.5 min-h-[84px]"
                    />
                  </div>
                </div>
              </div>

              <div className="surface p-5 sm:p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-2xl">Horaires hebdomadaires</h2>
                  <button type="button" onClick={addScheduleRow} className="btn-secondary min-h-[38px] text-xs">
                    <Plus className="h-3.5 w-3.5" /> Ajouter un culte
                  </button>
                </div>
                <div className="space-y-3">
                  {(settingsDraft.schedules || []).map((s, idx) => (
                    <div key={s.id || idx} className="grid gap-2 sm:grid-cols-[140px_160px_1fr_auto] items-center">
                      <input
                        value={s.day}
                        onChange={(e) => updateScheduleRow(idx, 'day', e.target.value)}
                        placeholder="Jour"
                        className="field text-sm"
                      />
                      <input
                        value={s.time}
                        onChange={(e) => updateScheduleRow(idx, 'time', e.target.value)}
                        placeholder="Horaire"
                        className="field text-sm"
                      />
                      <input
                        value={s.name}
                        onChange={(e) => updateScheduleRow(idx, 'name', e.target.value)}
                        placeholder="Intitulé de la réunion"
                        className="field text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => removeScheduleRow(idx)}
                        className="btn-secondary min-h-[42px] px-3 text-red-700"
                        aria-label="Retirer cet horaire"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? 'Enregistrement...' : 'Enregistrer la configuration'}
                </button>
              </div>
            </form>
          )}

          {/* ==================== CYBERSÉCURITÉ & ACCÈS ==================== */}
          {activeSubPage === 'securite' && (
            <div className="space-y-6">
              <form onSubmit={handleSaveSecurity} className="surface p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl">Portail caché & Sécurité des URL</h2>
                  <button type="button" onClick={handleDownloadBackup} className="btn-secondary min-h-[38px] text-xs">
                    <Download className="h-3.5 w-3.5 text-church-blue" /> Sauvegarde JSON
                  </button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-church-navy">Chemin secret (#/...)</label>
                    <input
                      value={secDraft.secretGateSlug}
                      onChange={(e) => setSecDraft({ ...secDraft, secretGateSlug: e.target.value })}
                      className="field font-mono text-sm"
                    />
                    <p className="mt-1 text-xs text-church-muted">
                      Lien d’accès discret : <code>#/{secDraft.secretGateSlug}</code> (effacé de la barre d’adresse dès ouverture).
                    </p>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-church-navy">Durée de session (minutes)</label>
                    <input
                      type="number"
                      min={15}
                      max={1440}
                      value={secDraft.sessionTimeoutMinutes}
                      onChange={(e) =>
                        setSecDraft({ ...secDraft, sessionTimeoutMinutes: Number(e.target.value) || 120 })
                      }
                      className="field"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-5 pt-1">
                  <label className="flex items-center gap-2 text-sm text-church-dark cursor-pointer">
                    <input
                      type="checkbox"
                      checked={secDraft.enableKeyboardShortcut}
                      onChange={(e) => setSecDraft({ ...secDraft, enableKeyboardShortcut: e.target.checked })}
                      className="h-4 w-4 accent-church-blue"
                    />
                    Raccourci clavier discret (Ctrl + Maj + A)
                  </label>
                  <label className="flex items-center gap-2 text-sm text-church-dark cursor-pointer">
                    <input
                      type="checkbox"
                      checked={secDraft.enableFooterTap}
                      onChange={(e) => setSecDraft({ ...secDraft, enableFooterTap: e.target.checked })}
                      className="h-4 w-4 accent-church-blue"
                    />
                    5 clics sur l’année © en pied de page
                  </label>
                </div>

                <div className="flex justify-end">
                  <button type="submit" disabled={saving} className="btn-primary">
                    Enregistrer la sécurité
                  </button>
                </div>
              </form>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="surface p-5 sm:p-6 space-y-3">
                  <h3 className="text-xl flex items-center gap-2">
                    <Shield className="h-5 w-5 text-church-blue" /> Connexion par compte Google
                  </h3>
                  <p className="text-sm text-church-dark leading-relaxed">
                    L’accès à l’espace administrateur fonctionne uniquement avec <strong>Continuer avec Google</strong> et la liste blanche d’adresses e-mail ci-contre.
                  </p>
                  <div className="rounded-xl border border-church-line bg-church-light/60 p-3.5 text-xs space-y-1">
                    <p className="font-semibold text-church-navy">Session en cours</p>
                    <p className="text-church-muted">{currentAdmin.name} ({currentAdmin.identifier})</p>
                    <p className="text-emerald-700 font-medium">Vérifié par Google Sign-In</p>
                  </div>
                </div>

                <form onSubmit={handleInviteAdmin} className="surface p-5 sm:p-6 space-y-3">
                  <h3 className="text-xl flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-church-blue" /> Autoriser un e-mail Google
                  </h3>
                  <p className="text-xs text-church-muted leading-relaxed">
                    Ajoutez ici l’adresse Gmail d’un administrateur. Une fois ajoutée, il lui suffit d’appuyer sur <strong>Continuer avec Google</strong> pour accéder au portail.
                  </p>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="Adresse Google (ex. collaborateur@gmail.com)"
                    className="field text-sm"
                  />
                  <input
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="Nom complet (optionnel)"
                    className="field text-sm"
                  />
                  <input
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    placeholder="Rôle (ex. Administrateur, Secrétariat, Multimédia)"
                    className="field text-sm"
                  />
                  <button type="submit" disabled={saving} className="btn-primary w-full">
                    <UserPlus className="h-4 w-4" /> Autoriser cet e-mail Google
                  </button>
                </form>
              </div>

              {lastDispatchInfo && (
                <div className="surface border-church-blue/35 bg-church-tint/40 p-5 space-y-3 animate-soft-in">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-church-navy">
                        Accès Google autorisé pour {lastDispatchInfo.email}
                      </p>
                      <p className="text-xs text-church-muted">
                        {lastDispatchInfo.emailSent
                          ? 'E-mail de confirmation envoyé automatiquement.'
                          : 'La personne peut déjà entrer via « Continuer avec Google ». Vous pouvez lui envoyer le lien par mail :'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setLastDispatchInfo(null)}
                      className="text-xs text-church-muted hover:text-church-navy"
                    >
                      Fermer
                    </button>
                  </div>

                  {lastDispatchInfo.mailtoUrl && (
                    <a href={lastDispatchInfo.mailtoUrl} className="btn-secondary min-h-[40px] text-xs inline-flex">
                      <Mail className="h-3.5 w-3.5 text-church-blue" /> Envoyer le lien d’accès par e-mail
                    </a>
                  )}
                </div>
              )}

              <div className="surface p-5 sm:p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xl">E-mails Google autorisés ({invitedAdmins.length})</h3>
                    <p className="text-xs text-church-muted">
                      À part les adresses listées ici, personne ne peut accéder à l’espace administrateur.
                    </p>
                  </div>
                </div>
                <div className="divide-y divide-church-line">
                  {invitedAdmins.map((inv) => {
                    const activeAdm = admins.find((a) => a.identifier.toLowerCase() === inv.email.toLowerCase());
                    const isMe = activeAdm?.id === currentAdmin.id || inv.email.toLowerCase() === currentAdmin.identifier.toLowerCase();
                    return (
                      <div key={inv.email} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                            <span className="font-semibold text-church-navy">{inv.name}</span>
                            <span className="text-church-muted">({inv.email})</span>
                            {isMe && <span className="text-xs font-semibold text-church-blue">· Session actuelle</span>}
                          </div>
                          <p className="mt-0.5 text-xs text-church-muted">
                            {inv.role} ·{' '}
                            <span className={inv.status === 'active' ? 'font-semibold text-emerald-700' : 'font-semibold text-amber-700'}>
                              {inv.status === 'active' ? 'Actif via Google' : 'Autorisé (en attente de connexion Google)'}
                            </span>
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {!isMe && (
                            <button
                              type="button"
                              disabled={saving}
                              onClick={() => handleSendResetEmailToInvite(inv.email)}
                              className="btn-secondary min-h-[36px] px-3 text-xs"
                            >
                              <Mail className="h-3.5 w-3.5 text-church-blue" />
                              Envoyer le lien par e-mail
                            </button>
                          )}
                          {!isMe && (
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  const res = await api.removeAdminInvitation(inv.email);
                                  onSyncSecurityState({
                                    admins: res.admins,
                                    invitedAdmins: res.invitedAdmins,
                                    securityLogs: res.securityLogs
                                  });
                                  notify('Autorisation retirée.');
                                } catch (err) {
                                  notify(err instanceof Error ? err.message : 'Suppression impossible.', 'err');
                                }
                              }}
                              className="text-xs font-medium text-red-700 hover:underline px-2 py-1"
                            >
                              Retirer
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="surface p-5 sm:p-6 space-y-3">
                <h3 className="text-xl flex items-center gap-2">
                  <Eye className="h-5 w-5 text-church-blue" /> Journal d’audit sécurité
                </h3>
                <div className="max-h-72 overflow-y-auto divide-y divide-church-line text-xs">
                  {securityLogs.length === 0 ? (
                    <p className="py-4 text-church-muted">Aucun événement enregistré.</p>
                  ) : (
                    securityLogs.map((log) => (
                      <div key={log.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                        <div>
                          <span
                            className={`font-semibold ${
                              log.severity === 'alert'
                                ? 'text-red-700'
                                : log.severity === 'warning'
                                ? 'text-amber-800'
                                : 'text-church-navy'
                            }`}
                          >
                            {log.event}
                          </span>{' '}
                          <span className="text-church-muted">par {log.actor} — {log.detail}</span>
                        </div>
                        <span className="text-church-muted tabular-nums">
                          {new Date(log.timestamp).toLocaleString('fr-FR')}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
