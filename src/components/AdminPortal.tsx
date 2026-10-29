import React, { useState } from 'react';
import { ChurchLogo } from './ChurchLogo';
import { HERO_IMAGE, PASTOR_IMAGE } from '../mockData';

/** Transforme un lien YouTube ordinaire (youtu.be, watch?v=, shorts) en lien lisible dans le site. */
const toYoutubeEmbed = (url: string): string => {
  const m = /(?:youtu\.be\/|v=|shorts\/|embed\/)([\w-]{11})/.exec(url);
  return m ? `https://www.youtube-nocookie.com/embed/${m[1]}` : url;
};
import {
  Culte,
  EventItem,
  NewsItem,
  AlbumItem,
  DepartmentItem,
  AdminSubPage,
  SiteImages,
  HeroContent
} from '../types';
import {
  ShieldCheck,
  LayoutDashboard,
  PlusCircle,
  FileText,
  Calendar,
  Image as ImageIcon,
  MessageCircle,
  Users,
  Settings,
  Eye,
  Check,
  AlertTriangle,
  Upload,
  ArrowRight,
  ArrowLeft,
  Trash2,
  Lock,
  LogOut,
  FolderOpen,
  Clock,
  Sparkles,
  ChevronRight,
  RefreshCw,
  Edit,
  Tag
} from 'lucide-react';

interface AdminPortalProps {
  onExitAdmin: () => void;
  activeSubPage: AdminSubPage;
  onNavigateSubPage: (subPage: AdminSubPage) => void;
  cultes: Culte[];
  events: EventItem[];
  news: NewsItem[];
  albums: AlbumItem[];
  departments: DepartmentItem[];
  officialLogoUrl: string | null;
  onUpdateLogoUrl: (url: string | null) => void;
  siteImages: SiteImages;
  onUpdateSiteImages: (images: SiteImages) => void;
  heroContent: HeroContent;
  onUpdateHeroContent: (content: HeroContent) => void;
  onAddNewCulte: (culte: Culte) => void;
  onUpdateCulte?: (culte: Culte) => void;
  onAddNewNews: (item: NewsItem) => void;
  onUpdateNews?: (news: NewsItem) => void;
  onAddNewEvent: (event: EventItem) => void;
  onUpdateEvent?: (event: EventItem) => void;
  onAddNewAlbum: (album: AlbumItem) => void;
  onUpdateAlbum?: (album: AlbumItem) => void;
  onUpdateDepartment: (dept: DepartmentItem) => void;
  onDeleteCulte?: (id: string) => void;
  onDeleteEvent?: (id: string) => void;
  onDeleteNews?: (id: string) => void;
  onDeleteAlbum?: (id: string) => void;
  onKeepComment?: (commentId: string, targetType: 'culte' | 'evenement' | 'actualite', targetId: string) => void;
  onRemoveComment?: (commentId: string, targetType: 'culte' | 'evenement' | 'actualite', targetId: string) => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  onExitAdmin,
  activeSubPage,
  onNavigateSubPage,
  cultes,
  events,
  news,
  albums,
  departments,
  officialLogoUrl,
  onUpdateLogoUrl,
  siteImages,
  onUpdateSiteImages,
  heroContent,
  onUpdateHeroContent,
  onAddNewCulte,
  onUpdateCulte,
  onAddNewNews,
  onUpdateNews,
  onAddNewEvent,
  onUpdateEvent,
  onAddNewAlbum,
  onUpdateAlbum,
  onUpdateDepartment,
  onDeleteCulte,
  onDeleteEvent,
  onDeleteNews,
  onDeleteAlbum,
  onKeepComment,
  onRemoveComment
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [adminUser] = useState<string>('Responsable Communication (Anyama)');
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  // Editing state for already published entities (full rectification)
  const [editingCulte, setEditingCulte] = useState<Culte | null>(null);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [editingNews, setEditingNews] = useState<NewsItem | null>(null);
  const [editingAlbum, setEditingAlbum] = useState<AlbumItem | null>(null);

  // Editable copies for Site Images & Hero Copy
  const [heroForm, setHeroForm] = useState<HeroContent>(heroContent);
  const [imagesForm, setImagesForm] = useState<SiteImages>(siteImages);

  // 5-Step Guided Service Creation State
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [isFullFormView, setIsFullFormView] = useState<boolean>(false);

  // Form State for new service (preserved between steps and full-view toggle)
  const EMPTY_SERVICE_FORM = {
    title: '',
    subtitle: '',
    date: new Date().toISOString().slice(0, 10),
    time: '',
    preacher: '',
    preacherRole: '',
    moderator: '',
    scriptureRef: '',
    scripturePassage: '',
    sermonSummary: '',
    keyPoints: [] as string[],
    liturgySteps: [] as { time: string; title: string; leader: string }[],
    coverImage: PASTOR_IMAGE,
    videoUrl: '',
    hasVideo: false,
    status: 'publie' as 'publie' | 'programme' | 'brouillon',
    scheduledDate: ''
  };
  const [serviceForm, setServiceForm] = useState(EMPTY_SERVICE_FORM);

  // Event creation form state (with poster image import)
  const [eventForm, setEventForm] = useState({
    title: '',
    category: 'Prière' as EventItem['category'],
    date: '',
    time: '',
    location: 'Grand Temple des Assemblées de Dieu, Anyama',
    speaker: '',
    description: '',
    coverImage: HERO_IMAGE
  });

  // News creation form state (with illustration photo import)
  const [newsForm, setNewsForm] = useState({
    title: '',
    category: 'Communiqué officiel' as NewsItem['category'],
    date: new Date().toISOString().slice(0, 10),
    author: 'Secrétariat Général de l’Église',
    authorRole: 'Bureau du Conseil Pastoral',
    summary: '',
    fullContent: '',
    coverImage: HERO_IMAGE,
    isUrgent: false
  });

  // Album creation form state
  const [albumForm, setAlbumForm] = useState({
    title: '',
    category: 'Cultes' as AlbumItem['category'],
    type: 'photo' as AlbumItem['type'],
    date: new Date().toISOString().slice(0, 10),
    coverImage: HERO_IMAGE,
    description: ''
  });

  // Department quick edit state
  const [editingDept, setEditingDept] = useState<DepartmentItem | null>(null);

  // Logo upload preview state
  const [logoPreview, setLogoPreview] = useState<string | null>(officialLogoUrl);

  const [simulatedFiles, setSimulatedFiles] = useState<string[]>([
    'IMG_Culte_Sanctuaire_01.jpg',
    'IMG_Culte_Chorale_Praise_02.jpg',
    'IMG_Culte_Orateur_Pulpit_03.jpg'
  ]);

  const [commentsModerationList, setCommentsModerationList] = useState([
    {
      id: 'm-1',
      culteTitle: 'Demeurer inébranlable dans la foi',
      author: 'Frère Marc A.',
      text: 'Ce message sur Philippiens 4 m’a profondément relevé cette semaine. Gloire à Jésus pour notre église à Anyama !',
      date: 'Il y a 1 jour',
      status: 'approuve',
      isReported: false
    },
    {
      id: 'm-2',
      culteTitle: 'La puissance de la prière d’intercession',
      author: 'Visiteur_94',
      text: 'Message contenant un lien commercial non vérifié vers un service externe.',
      date: 'Il y a 3 heures',
      status: 'en_attente',
      isReported: true
    }
  ]);

  const showNotification = (msg: string) => {
    setFeedbackNotice(msg);
    setTimeout(() => setFeedbackNotice(null), 3500);
  };

  // Login screen if unauthenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white rounded-2xl p-6 sm:p-8 shadow-xl border border-slate-200 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-[#173567] text-white flex items-center justify-center mx-auto shadow-xs">
              <Lock className="w-6 h-6" />
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#2854A6] block">
              Église Évangélique des Assemblées de Dieu de Côte d’Ivoire
            </span>
            <h2 className="font-heading font-bold text-lg sm:text-xl text-[#173567]">
              Administration — Anyama, Ran-Extension Résidentiel
            </h2>
            <p className="text-xs text-[#343B46]/70">
              Plateforme officielle de communication de l’assemblée locale
            </p>
          </div>

          {/* Bannière explicative d'accès temporaire pour les tests */}
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-950">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Accès administrateur temporaire (Mode Test & Validation)</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-800">
              Cet accès est configuré pour tester l'ensemble des pages et fonctionnalités (création, modification et suppression). Les données sont enregistrées localement dans votre navigateur.
            </p>
            <div className="pt-2 border-t border-amber-200/80 flex flex-col gap-1 text-[11px] bg-white/70 p-2.5 rounded-lg border">
              <div>Identifiant test : <strong className="text-church-navy">admin.test@ad-anyama.ci</strong></div>
              <div>Mot de passe test : <strong className="text-church-navy">anyama-test-2026</strong></div>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setIsAuthenticated(true);
              showNotification('Connexion réussie à l’espace administrateur temporaire.');
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-semibold text-[#343B46] mb-1">
                Identifiant Administrateur
              </label>
              <input
                type="text"
                defaultValue="admin.test@ad-anyama.ci"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2854A6]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#343B46] mb-1">
                Mot de passe
              </label>
              <input
                type="password"
                defaultValue="anyama-test-2026"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2854A6]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#2854A6] hover:bg-[#1f4489] text-white font-semibold text-xs transition-colors shadow-xs"
            >
              Se connecter au tableau de bord
            </button>

            <button
              type="button"
              onClick={() => {
                setIsAuthenticated(true);
                showNotification('Connexion avec identifiants de test.');
              }}
              className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#173567] font-semibold text-xs transition-colors border border-slate-200 flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#2854A6]" />
              <span>1-Clic : Utiliser les identifiants de test</span>
            </button>

            <button
              type="button"
              onClick={onExitAdmin}
              className="w-full py-2 text-xs text-[#343B46]/70 hover:text-[#173567]"
            >
              Retour au site public
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Handle service publishing
  const handlePublishCulte = () => {
    if (!serviceForm.title.trim() || !serviceForm.date) {
      showNotification('Indiquez au moins le titre et la date du culte (étape 1).');
      setWizardStep(1);
      return;
    }
    const keyPoints = (serviceForm.keyPoints || []).filter((k) => k.trim());
    const newCulte: Culte = {
      id: `culte-${Date.now()}`,
      title: serviceForm.title.trim(),
      subtitle: serviceForm.subtitle,
      date: serviceForm.date,
      time: serviceForm.time,
      preacher: serviceForm.preacher,
      preacherRole: serviceForm.preacherRole,
      moderator: serviceForm.moderator,
      scriptureRef: serviceForm.scriptureRef,
      scripturePassage: serviceForm.scripturePassage,
      sermonSummary: serviceForm.sermonSummary,
      keyPoints,
      liturgy: serviceForm.liturgySteps.filter((l) => l.title.trim()),
      coverImage: serviceForm.coverImage,
      photos: serviceForm.coverImage ? [serviceForm.coverImage] : [],
      videoUrl: serviceForm.videoUrl || undefined,
      hasVideo: !!serviceForm.videoUrl,
      documents: [],
      reactions: { likes: 0, hearts: 0, prayers: 0 },
      comments: [],
      status: serviceForm.status
    };

    onAddNewCulte(newCulte);
    showNotification(`Le culte « ${newCulte.title} » a été ${serviceForm.status === 'publie' ? 'publié sur le site' : serviceForm.status === 'programme' ? 'programmé' : 'enregistré en brouillon'}.`);
    setServiceForm(EMPTY_SERVICE_FORM);
    setWizardStep(1);
    onNavigateSubPage('cultes');
  };

  // Generic image upload helper for posters, photos, and site assets
  const handleImageFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    onSuccess: (base64Url: string) => void
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          onSuccess(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle event publishing
  const handlePublishEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventForm.title.trim()) return;

    const newEv: EventItem = {
      id: `ev-${Date.now()}`,
      title: eventForm.title,
      category: eventForm.category,
      date: eventForm.date,
      time: eventForm.time,
      location: eventForm.location,
      speaker: eventForm.speaker,
      description: eventForm.description,
      coverImage: eventForm.coverImage,
      attendeesCount: 0,
      isRegistered: false,
      likes: 0,
      comments: [],
      poll: {
        question: 'Serez-vous présent(e) à ce rassemblement ?',
        options: [
          { id: 'yes', label: 'Oui, je serai présent(e) au temple', votes: 1 },
          { id: 'online', label: 'Je suivrai en prière / en ligne', votes: 0 },
          { id: 'no', label: 'Malheureusement indisponible', votes: 0 }
        ],
        totalVotes: 1
      }
    };

    onAddNewEvent(newEv);
    showNotification(`L'événement « ${eventForm.title} » a été ajouté à l'agenda.`);
    onNavigateSubPage('evenements');
  };

  // Handle news publishing
  const handlePublishNews = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsForm.title.trim()) return;

    const newN: NewsItem = {
      id: `news-${Date.now()}`,
      title: newsForm.title,
      category: newsForm.category,
      date: newsForm.date,
      author: newsForm.author,
      authorRole: newsForm.authorRole,
      summary: newsForm.summary,
      fullContent: newsForm.fullContent,
      coverImage: newsForm.coverImage,
      isUrgent: newsForm.isUrgent,
      readsCount: 0,
      likes: 0,
      comments: []
    };

    onAddNewNews(newN);
    showNotification(`Le communiqué « ${newsForm.title} » a été publié.`);
    onNavigateSubPage('actualites');
  };

  // Handle logo file import from phone / PC
  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setLogoPreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveOfficialLogo = () => {
    onUpdateLogoUrl(logoPreview);
    showNotification('Le logo officiel a été enregistré et appliqué sur l’ensemble du site.');
  };

  const handleResetToProvisionalLogo = () => {
    setLogoPreview(null);
    onUpdateLogoUrl(null);
    showNotification('Rétablissement du logo provisoire par défaut.');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 pb-24">
      {/* Top Admin Header in Deep Navy #173567 */}
      <div className="bg-[#173567] text-white p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm border border-[#2854A6]/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#2854A6] text-white flex items-center justify-center font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-white/70 block">
                Église Évangélique des Assemblées de Dieu de Côte d’Ivoire
              </span>
            </div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading font-bold text-base sm:text-lg text-white">
                Espace Com — Anyama, Ran-Extension Résidentiel
              </h1>
              <span className="px-2 py-0.5 rounded bg-white/20 text-white text-[10px] uppercase font-bold">
                Admin
              </span>
            </div>
            <p className="text-xs text-white/80">
              Session active : <strong className="text-white">{adminUser}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateSubPage('cultes-creer')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2854A6] hover:bg-[#1f4489] text-white font-semibold text-xs transition-colors shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Nouveau Culte</span>
          </button>
          <button
            onClick={() => {
              setIsAuthenticated(false);
              showNotification('Vous avez été déconnecté de l’espace administrateur temporaire.');
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors"
            title="Se déconnecter"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Déconnexion</span>
          </button>
          <button
            onClick={onExitAdmin}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors"
          >
            <span>Voir le site</span>
          </button>
        </div>
      </div>

      {/* Avertissement en langage simple */}
      <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-900">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <span>
          <strong>Version d’essai :</strong> ce que vous publiez ici est enregistré uniquement sur cet appareil. Les autres
          administrateurs et les visiteurs ne le verront pas tant que la base de données n’est pas connectée.
        </span>
      </div>

      {/* Admin Subpages Navigation Bar */}
      <nav
        aria-label="Navigation de l’administration"
        className="surface p-2 flex flex-wrap items-center gap-1.5 sm:gap-2"
      >
        <button
          onClick={() => onNavigateSubPage('dashboard')}
          className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors ${
            activeSubPage === 'dashboard'
              ? 'bg-church-navy text-white'
              : 'text-church-muted hover:text-church-navy hover:bg-church-light'
          }`}
        >
          <LayoutDashboard className="h-4 w-4" />
          <span>Tableau de bord</span>
        </button>

        <button
          onClick={() => onNavigateSubPage('cultes')}
          className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors ${
            activeSubPage === 'cultes' || activeSubPage === 'cultes-creer'
              ? 'bg-church-navy text-white'
              : 'text-church-muted hover:text-church-navy hover:bg-church-light'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Cultes</span>
        </button>

        <button
          onClick={() => onNavigateSubPage('evenements')}
          className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors ${
            activeSubPage === 'evenements' || activeSubPage === 'evenements-creer'
              ? 'bg-church-navy text-white'
              : 'text-church-muted hover:text-church-navy hover:bg-church-light'
          }`}
        >
          <Calendar className="h-4 w-4" />
          <span>Événements</span>
        </button>

        <button
          onClick={() => onNavigateSubPage('actualites')}
          className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors ${
            activeSubPage === 'actualites' || activeSubPage === 'actualites-creer'
              ? 'bg-church-navy text-white'
              : 'text-church-muted hover:text-church-navy hover:bg-church-light'
          }`}
        >
          <Tag className="h-4 w-4" />
          <span>Actualités</span>
        </button>

        <button
          onClick={() => onNavigateSubPage('galerie')}
          className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors ${
            activeSubPage === 'galerie' || activeSubPage === 'galerie-creer'
              ? 'bg-church-navy text-white'
              : 'text-church-muted hover:text-church-navy hover:bg-church-light'
          }`}
        >
          <ImageIcon className="h-4 w-4" />
          <span>Galerie</span>
        </button>

        <button
          onClick={() => onNavigateSubPage('departements')}
          className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors ${
            activeSubPage === 'departements'
              ? 'bg-church-navy text-white'
              : 'text-church-muted hover:text-church-navy hover:bg-church-light'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Départements ({departments.length})</span>
        </button>

        <button
          onClick={() => onNavigateSubPage('commentaires')}
          className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors ${
            activeSubPage === 'commentaires'
              ? 'bg-church-navy text-white'
              : 'text-church-muted hover:text-church-navy hover:bg-church-light'
          }`}
        >
          <MessageCircle className="h-4 w-4" />
          <span>Modération</span>
        </button>

        <button
          onClick={() => onNavigateSubPage('medias')}
          className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors ${
            activeSubPage === 'medias'
              ? 'bg-church-navy text-white'
              : 'text-church-muted hover:text-church-navy hover:bg-church-light'
          }`}
        >
          <Sparkles className="h-4 w-4 text-church-blue" />
          <span>Images & Textes</span>
        </button>

        <button
          onClick={() => onNavigateSubPage('parametres')}
          className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors ${
            activeSubPage === 'parametres'
              ? 'bg-church-navy text-white'
              : 'text-church-muted hover:text-church-navy hover:bg-church-light'
          }`}
        >
          <Settings className="h-4 w-4" />
          <span>Logo & Infos</span>
        </button>
      </nav>

      {feedbackNotice && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-900 flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedbackNotice}</span>
        </div>
      )}

      {/* 1. SUBPAGE: TABLEAU DE BORD */}
      {activeSubPage === 'dashboard' && (
        <div className="space-y-6">
          {/* Chiffres calculés à partir des données réelles (aucun chiffre inventé) */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { label: 'Cultes publiés', value: cultes.filter((c) => c.status === 'publie').length, sub: `${cultes.filter((c) => c.status !== 'publie').length} brouillon(s) ou programmé(s)` },
              { label: 'Événements', value: events.length, sub: 'dans l’agenda' },
              { label: 'Réactions', value: cultes.reduce((n, c) => n + c.reactions.likes + c.reactions.hearts + c.reactions.prayers, 0), sub: 'J’aime, cœur, je prie' },
              { label: 'Commentaires signalés', value: cultes.reduce((n, c) => n + c.comments.filter((m) => m.reported).length, 0), sub: 'à vérifier', action: () => onNavigateSubPage('commentaires') }
            ].map((k) => (
              <button
                key={k.label}
                onClick={k.action}
                disabled={!k.action}
                className="surface p-4 text-left enabled:hover:border-church-blue"
              >
                <span className="block text-sm text-church-muted">{k.label}</span>
                <span className="mt-1 block font-serif text-3xl font-semibold text-church-navy">{k.value}</span>
                <span className="block text-sm text-church-muted">{k.sub}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-heading font-bold text-base text-church-navy">
                  Dernières publications en ligne
                </h3>
                <span className="text-xs text-slate-400">
                  {cultes.length} cultes archivés
                </span>
              </div>

              <div className="space-y-3">
                {cultes.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100/70 transition-colors text-xs"
                  >
                    <div className="space-y-0.5 truncate max-w-md">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          En ligne
                        </span>
                        <span className="font-semibold text-church-navy truncate">
                          {c.title}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {c.date} · {c.preacher}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 shrink-0">
                      <span>👍 {c.reactions.likes}</span>
                      <span>💬 {c.comments.length}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
              <h3 className="font-heading font-bold text-base text-church-navy pb-3 border-b border-slate-100">
                Raccourcis de Création
              </h3>

              <div className="space-y-2">
                <button
                  onClick={() => onNavigateSubPage('cultes-creer')}
                  className="w-full text-left p-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-800 flex items-center justify-between transition-colors"
                >
                  <span>Créer un résumé de culte</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
                <button
                  onClick={() => onNavigateSubPage('evenements-creer')}
                  className="w-full text-left p-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-800 flex items-center justify-between transition-colors"
                >
                  <span>Publier un nouvel événement</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
                <button
                  onClick={() => onNavigateSubPage('actualites-creer')}
                  className="w-full text-left p-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-800 flex items-center justify-between transition-colors"
                >
                  <span>Rédiger un communiqué officiel</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
                <button
                  onClick={() => onNavigateSubPage('parametres')}
                  className="w-full text-left p-3 rounded-xl border border-[#2854A6]/30 bg-[#F4F6F9] hover:bg-blue-50 text-xs font-semibold text-[#173567] flex items-center justify-between transition-colors"
                >
                  <span>Gérer ou importer le logo officiel</span>
                  <ChevronRight className="w-4 h-4 text-[#2854A6]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. SUBPAGE: CULTES & PRÉDICATIONS LIST */}
      {activeSubPage === 'cultes' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-7 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-heading font-bold text-base text-[#173567]">
                Gestion des Cultes et Prédications
              </h3>
              <p className="text-xs text-slate-500">
                {cultes.length} cultes enregistrés
              </p>
            </div>
            <button
              onClick={() => onNavigateSubPage('cultes-creer')}
              className="px-4 py-2 rounded-xl bg-[#2854A6] text-white text-xs font-semibold hover:bg-[#1f4489] transition-colors flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Nouveau Culte</span>
            </button>
          </div>

          <div className="space-y-3">
            {cultes.map((c) => (
              <div
                key={c.id}
                className="p-4 rounded-xl border border-slate-200/80 bg-church-light flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-church-navy text-sm">
                      {c.title}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold text-[10px]">
                      {c.status}
                    </span>
                  </div>
                  <div className="text-slate-500">
                    {c.date} · {c.time} · Prédicateur : <strong className="text-slate-700">{c.preacher}</strong>
                  </div>
                  <div className="text-amber-800 font-medium">
                    Texte : {c.scriptureRef}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono text-slate-500 text-[11px] mr-2">
                    👍 {c.reactions.likes} · 💬 {c.comments.length}
                  </span>

                  <button
                    onClick={() => setEditingCulte(c)}
                    className="px-2.5 py-1.5 rounded-lg border border-[#2854A6]/30 text-[#2854A6] bg-blue-50/50 hover:bg-blue-100/50 text-xs font-semibold flex items-center gap-1 transition-colors"
                    title="Modifier et rectifier ce culte"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Modifier</span>
                  </button>

                  {onDeleteCulte && (
                    <button
                      onClick={() => {
                        if (window.confirm(`Supprimer définitivement le culte « ${c.title} » ?`)) {
                          onDeleteCulte(c.id);
                          showNotification(`Le culte « ${c.title} » a été supprimé.`);
                        }
                      }}
                      className="p-1.5 rounded-lg text-rose-600 hover:text-rose-800 hover:bg-rose-50 transition-colors"
                      title="Supprimer ce culte"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Modal / Formulaire de modification d'un culte existant */}
          {editingCulte && (
            <div className="p-6 bg-[#F4F6F9] rounded-2xl border-2 border-[#2854A6] space-y-4 shadow-sm animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <Edit className="w-4 h-4 text-[#2854A6]" />
                  <h4 className="font-heading font-bold text-base text-[#173567]">
                    Modifier & Rectifier le Culte : « {editingCulte.title} »
                  </h4>
                </div>
                <button
                  onClick={() => setEditingCulte(null)}
                  className="px-3 py-1 rounded-lg text-xs font-medium text-slate-600 hover:bg-white"
                >
                  ✕ Fermer
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Titre du culte</label>
                  <input
                    type="text"
                    value={editingCulte.title}
                    onChange={(e) => setEditingCulte({ ...editingCulte, title: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Sous-titre / Thème</label>
                  <input
                    type="text"
                    value={editingCulte.subtitle || ''}
                    onChange={(e) => setEditingCulte({ ...editingCulte, subtitle: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={editingCulte.date}
                    onChange={(e) => setEditingCulte({ ...editingCulte, date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Horaire</label>
                  <input
                    type="text"
                    value={editingCulte.time}
                    onChange={(e) => setEditingCulte({ ...editingCulte, time: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Prédicateur</label>
                  <input
                    type="text"
                    value={editingCulte.preacher}
                    onChange={(e) => setEditingCulte({ ...editingCulte, preacher: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Modérateur</label>
                  <input
                    type="text"
                    value={editingCulte.moderator || ''}
                    onChange={(e) => setEditingCulte({ ...editingCulte, moderator: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Passage biblique de référence</label>
                  <input
                    type="text"
                    value={editingCulte.scriptureRef}
                    onChange={(e) => setEditingCulte({ ...editingCulte, scriptureRef: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Résumé pastoral du message</label>
                  <textarea
                    rows={3}
                    value={editingCulte.sermonSummary}
                    onChange={(e) => setEditingCulte({ ...editingCulte, sermonSummary: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Lien vidéo YouTube (optionnel)</label>
                  <input
                    type="text"
                    value={editingCulte.videoUrl || ''}
                    onChange={(e) =>
                      setEditingCulte({
                        ...editingCulte,
                        videoUrl: toYoutubeEmbed(e.target.value),
                        hasVideo: !!e.target.value.trim()
                      })
                    }
                    placeholder="https://youtu.be/..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Statut de diffusion</label>
                  <select
                    value={editingCulte.status}
                    onChange={(e) => setEditingCulte({ ...editingCulte, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="publie">Publié sur le site</option>
                    <option value="programme">Programmé</option>
                    <option value="brouillon">Brouillon privé</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Image de couverture du culte</label>
                  <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200">
                    <img
                      src={editingCulte.coverImage}
                      alt="Aperçu couverture"
                      className="w-20 h-14 object-cover rounded-lg border border-slate-200 shrink-0"
                    />
                    <div className="space-y-1.5 flex-1">
                      <label className="px-3 py-1.5 rounded-lg bg-[#2854A6] text-white font-semibold text-xs cursor-pointer hover:bg-[#1f4489] transition-colors inline-flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Changer l'image depuis mon appareil</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            handleImageFileUpload(e, (url) => setEditingCulte({ ...editingCulte, coverImage: url }))
                          }
                          className="hidden"
                        />
                      </label>
                      <input
                        type="text"
                        value={editingCulte.coverImage}
                        onChange={(e) => setEditingCulte({ ...editingCulte, coverImage: e.target.value })}
                        placeholder="ou lien direct..."
                        className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingCulte(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-white"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onUpdateCulte) {
                      onUpdateCulte(editingCulte);
                    }
                    setEditingCulte(null);
                    showNotification(`Le culte « ${editingCulte.title} » a été mis à jour.`);
                  }}
                  className="px-5 py-2 rounded-xl bg-[#2854A6] text-white text-xs font-semibold hover:bg-[#1f4489]"
                >
                  Enregistrer les modifications
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. SUBPAGE: PAGE DÉDIÉE DE CRÉATION DE CULTE */}
      {activeSubPage === 'cultes-creer' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-7 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                <button
                  onClick={() => onNavigateSubPage('cultes')}
                  className="hover:text-church-navy text-slate-600 font-medium"
                >
                  Cultes
                </button>
                <span>/</span>
                <span>Nouveau Culte</span>
              </div>
              <h2 className="font-heading font-bold text-xl text-church-navy">
                {isFullFormView
                  ? 'Formulaire Complet de Création de Culte'
                  : `Création Guidée de Culte — Étape ${wizardStep} sur 5`}
              </h2>
            </div>

            <button
              onClick={() => setIsFullFormView(!isFullFormView)}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>
                {isFullFormView
                  ? 'Revenir au mode guidé 5 étapes'
                  : 'Passer à la vue complète (formulaire unique)'}
              </span>
            </button>
          </div>

          {!isFullFormView && (
            <div className="grid grid-cols-5 gap-2 text-center text-xs">
              {[
                { n: 1, label: '1. Informations' },
                { n: 2, label: '2. Prédication' },
                { n: 3, label: '3. Liturgie' },
                { n: 4, label: '4. Médias' },
                { n: 5, label: '5. Diffusion' }
              ].map((step) => (
                <button
                  key={step.n}
                  onClick={() => setWizardStep(step.n)}
                  className={`py-2 px-1 rounded-xl font-semibold transition-all text-[11px] truncate ${
                    wizardStep === step.n
                      ? 'bg-[#2854A6] text-white shadow-xs'
                      : wizardStep > step.n
                      ? 'bg-blue-100 text-[#173567]'
                      : 'bg-[#F4F6F9] text-[#343B46]/70'
                  }`}
                >
                  {step.label}
                </button>
              ))}
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-6">
            {(isFullFormView || wizardStep === 1) && (
              <div className="space-y-4 p-4 rounded-xl bg-church-light border border-slate-200/80">
                <h3 className="font-heading font-bold text-sm text-church-navy flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-church-navy text-white text-xs flex items-center justify-center">1</span>
                  <span>Informations Générales</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Titre du Culte / Thème Dominical
                    </label>
                    <input
                      type="text"
                      value={serviceForm.title}
                      onChange={(e) => setServiceForm({ ...serviceForm, title: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Sous-titre ou Type
                    </label>
                    <input
                      type="text"
                      value={serviceForm.subtitle}
                      onChange={(e) => setServiceForm({ ...serviceForm, subtitle: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      value={serviceForm.date}
                      onChange={(e) => setServiceForm({ ...serviceForm, date: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Horaire
                    </label>
                    <input
                      type="text"
                      value={serviceForm.time}
                      onChange={(e) => setServiceForm({ ...serviceForm, time: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Prédicateur
                    </label>
                    <input
                      type="text"
                      value={serviceForm.preacher}
                      onChange={(e) => setServiceForm({ ...serviceForm, preacher: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Modérateur
                    </label>
                    <input
                      type="text"
                      value={serviceForm.moderator}
                      onChange={(e) => setServiceForm({ ...serviceForm, moderator: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {(isFullFormView || wizardStep === 2) && (
              <div className="space-y-4 p-4 rounded-xl bg-church-light border border-slate-200/80">
                <h3 className="font-heading font-bold text-sm text-church-navy flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-church-navy text-white text-xs flex items-center justify-center">2</span>
                  <span>Prédication & Texte Biblique</span>
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Références Bibliques
                    </label>
                    <input
                      type="text"
                      value={serviceForm.scriptureRef}
                      onChange={(e) => setServiceForm({ ...serviceForm, scriptureRef: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Extrait du passage biblique
                    </label>
                    <textarea
                      rows={2}
                      value={serviceForm.scripturePassage}
                      onChange={(e) => setServiceForm({ ...serviceForm, scripturePassage: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Résumé pastoral du message
                    </label>
                    <textarea
                      rows={3}
                      value={serviceForm.sermonSummary}
                      onChange={(e) => setServiceForm({ ...serviceForm, sermonSummary: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Points à retenir (un par ligne, facultatif)
                    </label>
                    <textarea
                      rows={3}
                      value={serviceForm.keyPoints.join('\n')}
                      onChange={(e) => setServiceForm({ ...serviceForm, keyPoints: e.target.value.split('\n') })}
                      placeholder={'La joie est un choix\nLa prière chasse l’inquiétude'}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {(isFullFormView || wizardStep === 3) && (
              <div className="space-y-4 p-4 rounded-xl bg-church-light border border-slate-200/80">
                <h3 className="font-heading font-bold text-sm text-church-navy flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-church-navy text-white text-xs flex items-center justify-center">3</span>
                  <span>Déroulement Liturgique</span>
                </h3>

                <div className="space-y-2">
                  {serviceForm.liturgySteps.map((step, idx) => (
                    <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-2 bg-white rounded-lg border border-slate-200 text-xs">
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          value={step.time}
                          placeholder="Horaire"
                          onChange={(e) => {
                            const newLit = [...serviceForm.liturgySteps];
                            newLit[idx].time = e.target.value;
                            setServiceForm({ ...serviceForm, liturgySteps: newLit });
                          }}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded"
                        />
                      </div>
                      <div className="sm:col-span-6">
                        <input
                          type="text"
                          value={step.title}
                          placeholder="Étape"
                          onChange={(e) => {
                            const newLit = [...serviceForm.liturgySteps];
                            newLit[idx].title = e.target.value;
                            setServiceForm({ ...serviceForm, liturgySteps: newLit });
                          }}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded font-medium"
                        />
                      </div>
                      <div className="sm:col-span-4">
                        <input
                          type="text"
                          value={step.leader}
                          placeholder="Responsable"
                          onChange={(e) => {
                            const newLit = [...serviceForm.liturgySteps];
                            newLit[idx].leader = e.target.value;
                            setServiceForm({ ...serviceForm, liturgySteps: newLit });
                          }}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setServiceForm({ ...serviceForm, liturgySteps: serviceForm.liturgySteps.filter((_, i) => i !== idx) })
                        }
                        className="sm:col-span-12 justify-self-start text-xs text-church-muted hover:text-[#B42318]"
                      >
                        Retirer cette étape
                      </button>
                    </div>
                  ))}
                  {serviceForm.liturgySteps.length === 0 && (
                    <p className="text-xs text-church-muted">Facultatif. Ajoutez les étapes du culte si vous souhaitez les afficher.</p>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      setServiceForm({
                        ...serviceForm,
                        liturgySteps: [...serviceForm.liturgySteps, { time: '', title: '', leader: '' }]
                      })
                    }
                    className="btn-secondary text-xs"
                  >
                    + Ajouter une étape
                  </button>
                </div>
              </div>
            )}

            {(isFullFormView || wizardStep === 4) && (
              <div className="space-y-4 p-4 rounded-xl bg-church-light border border-slate-200/80">
                <h3 className="font-heading font-bold text-sm text-church-navy flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-church-navy text-white text-xs flex items-center justify-center">4</span>
                  <span>Médias & Galerie</span>
                </h3>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Lien de la vidéo YouTube (facultatif)
                  </label>
                  <input
                    type="url"
                    inputMode="url"
                    value={serviceForm.videoUrl}
                    placeholder="https://youtu.be/…"
                    onChange={(e) => setServiceForm({ ...serviceForm, videoUrl: toYoutubeEmbed(e.target.value) })}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none"
                  />
                  <p className="mt-1 text-[11px] text-church-muted">Collez le lien copié depuis l’application YouTube.</p>
                </div>

                <div className="border-2 border-dashed border-slate-300 rounded-xl p-5 text-center bg-white space-y-2">
                  <Upload className="w-6 h-6 text-church-blue mx-auto" />
                  <h4 className="text-xs font-semibold text-church-navy">
                    Import de photographies depuis le téléphone
                  </h4>
                  <label className="inline-block mt-2 px-4 py-2 bg-church-navy hover:bg-church-blue text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors">
                    <span>Parcourir les photos</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files) {
                          const names = Array.from(e.target.files).map(f => f.name);
                          setSimulatedFiles(prev => [...prev, ...names]);
                        }
                      }}
                    />
                  </label>
                </div>

                <div className="flex flex-wrap gap-2">
                  {simulatedFiles.map((fn, idx) => (
                    <div key={idx} className="px-2.5 py-1 rounded bg-slate-200 text-slate-800 text-xs">
                      {fn}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(isFullFormView || wizardStep === 5) && (
              <div className="space-y-4 p-4 rounded-xl bg-church-light border border-slate-200/80">
                <h3 className="font-heading font-bold text-sm text-church-navy flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-church-navy text-white text-xs flex items-center justify-center">5</span>
                  <span>Mode de Diffusion</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className={`p-3.5 rounded-xl border cursor-pointer text-left transition-all ${
                    serviceForm.status === 'publie' ? 'bg-emerald-50 border-emerald-500' : 'bg-white border-slate-200'
                  }`}>
                    <input
                      type="radio"
                      name="status"
                      checked={serviceForm.status === 'publie'}
                      onChange={() => setServiceForm({ ...serviceForm, status: 'publie' })}
                      className="hidden"
                    />
                    <span className="font-bold text-xs block mb-1">🚀 Publication Immédiate</span>
                    <span className="text-[11px] text-slate-500">Visible directement sur le site.</span>
                  </label>

                  <label className={`p-3.5 rounded-xl border cursor-pointer text-left transition-all ${
                    serviceForm.status === 'programme' ? 'bg-amber-50 border-amber-500' : 'bg-white border-slate-200'
                  }`}>
                    <input
                      type="radio"
                      name="status"
                      checked={serviceForm.status === 'programme'}
                      onChange={() => setServiceForm({ ...serviceForm, status: 'programme' })}
                      className="hidden"
                    />
                    <span className="font-bold text-xs block mb-1">⏰ Programmer</span>
                    <span className="text-[11px] text-slate-500">Mise en ligne automatique.</span>
                  </label>

                  <label className={`p-3.5 rounded-xl border cursor-pointer text-left transition-all ${
                    serviceForm.status === 'brouillon' ? 'bg-slate-200 border-slate-400' : 'bg-white border-slate-200'
                  }`}>
                    <input
                      type="radio"
                      name="status"
                      checked={serviceForm.status === 'brouillon'}
                      onChange={() => setServiceForm({ ...serviceForm, status: 'brouillon' })}
                      className="hidden"
                    />
                    <span className="font-bold text-xs block mb-1">📝 Brouillon</span>
                    <span className="text-[11px] text-slate-500">Sauvegardé sans publication.</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            {!isFullFormView && wizardStep > 1 ? (
              <button
                type="button"
                onClick={() => setWizardStep(wizardStep - 1)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Précédent</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              {!isFullFormView && wizardStep < 5 ? (
                <button
                  type="button"
                  onClick={() => setWizardStep(wizardStep + 1)}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-church-navy text-white text-xs font-semibold hover:bg-church-blue"
                >
                  <span>Suivant</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePublishCulte}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#2854A6] hover:bg-[#1f4489] text-white text-xs font-bold transition-all shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  <span>Enregistrer et appliquer</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. SUBPAGE: ÉVÉNEMENTS & AGENDA */}
      {activeSubPage === 'evenements' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-7 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-heading font-bold text-base text-[#173567]">
                Gestion des Événements & Veillées
              </h3>
              <p className="text-xs text-slate-500">
                {events.length} programmes au calendrier
              </p>
            </div>
            <button
              onClick={() => onNavigateSubPage('evenements-creer')}
              className="px-4 py-2 rounded-xl bg-[#2854A6] text-white text-xs font-semibold hover:bg-[#1f4489] transition-colors flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Nouvel Événement</span>
            </button>
          </div>

          <div className="space-y-3">
            {events.map((ev) => (
              <div
                key={ev.id}
                className="p-4 rounded-xl border border-slate-200/80 bg-church-light flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-church-navy text-sm">
                      {ev.title}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-semibold text-[10px]">
                      {ev.category}
                    </span>
                  </div>
                  <div className="text-slate-500">
                    {ev.date} · {ev.time} · {ev.location}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-600 font-medium mr-1">
                    {ev.attendeesCount} inscrits · 👍 {ev.likes || 0}
                  </span>

                  <button
                    onClick={() => setEditingEvent(ev)}
                    className="px-2.5 py-1.5 rounded-lg border border-[#2854A6]/30 text-[#2854A6] bg-blue-50/50 hover:bg-blue-100/50 text-xs font-semibold flex items-center gap-1 transition-colors"
                    title="Modifier et rectifier cet événement"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Modifier</span>
                  </button>

                  {onDeleteEvent && (
                    <button
                      onClick={() => {
                        if (window.confirm(`Supprimer l'événement « ${ev.title} » ?`)) {
                          onDeleteEvent(ev.id);
                          showNotification(`L'événement « ${ev.title} » a été supprimé.`);
                        }
                      }}
                      className="p-1.5 rounded-lg text-rose-600 hover:text-rose-800 hover:bg-rose-50 transition-colors"
                      title="Supprimer cet événement"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Modal / Formulaire de modification d'un événement existant */}
          {editingEvent && (
            <div className="p-6 bg-[#F4F6F9] rounded-2xl border-2 border-[#2854A6] space-y-4 shadow-sm animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <Edit className="w-4 h-4 text-[#2854A6]" />
                  <h4 className="font-heading font-bold text-base text-[#173567]">
                    Modifier & Rectifier l'Événement : « {editingEvent.title} »
                  </h4>
                </div>
                <button
                  onClick={() => setEditingEvent(null)}
                  className="px-3 py-1 rounded-lg text-xs font-medium text-slate-600 hover:bg-white"
                >
                  ✕ Fermer
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Titre de l'événement</label>
                  <input
                    type="text"
                    value={editingEvent.title}
                    onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Catégorie</label>
                  <select
                    value={editingEvent.category}
                    onChange={(e) => setEditingEvent({ ...editingEvent, category: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Prière">Prière</option>
                    <option value="Jeunesse">Jeunesse</option>
                    <option value="Femmes">Femmes</option>
                    <option value="Évangélisation">Évangélisation</option>
                    <option value="Culte spécial">Culte spécial</option>
                    <option value="Conférence">Conférence</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date</label>
                  <input
                    type="text"
                    value={editingEvent.date}
                    onChange={(e) => setEditingEvent({ ...editingEvent, date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Horaire</label>
                  <input
                    type="text"
                    value={editingEvent.time}
                    onChange={(e) => setEditingEvent({ ...editingEvent, time: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Lieu</label>
                  <input
                    type="text"
                    value={editingEvent.location}
                    onChange={(e) => setEditingEvent({ ...editingEvent, location: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Orateur / Responsable</label>
                  <input
                    type="text"
                    value={editingEvent.speaker || ''}
                    onChange={(e) => setEditingEvent({ ...editingEvent, speaker: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Description du programme</label>
                  <textarea
                    rows={3}
                    value={editingEvent.description}
                    onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Affiche officielle / Poster de l'événement
                  </label>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-white rounded-xl border border-slate-200">
                    <img
                      src={editingEvent.coverImage}
                      alt="Aperçu affiche"
                      className="w-24 h-16 object-cover rounded-lg border border-slate-200 shrink-0"
                    />
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="px-3 py-1.5 rounded-lg bg-[#2854A6] text-white font-semibold text-xs cursor-pointer hover:bg-[#1f4489] transition-colors inline-flex items-center gap-1.5 shadow-xs">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Importer une nouvelle affiche</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                              handleImageFileUpload(e, (url) => setEditingEvent({ ...editingEvent, coverImage: url }))
                            }
                            className="hidden"
                          />
                        </label>
                        <span className="text-[11px] text-slate-500">ou modifier le lien :</span>
                      </div>
                      <input
                        type="text"
                        value={editingEvent.coverImage}
                        onChange={(e) => setEditingEvent({ ...editingEvent, coverImage: e.target.value })}
                        placeholder="ou lien direct..."
                        className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingEvent(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-white"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onUpdateEvent) {
                      onUpdateEvent(editingEvent);
                    }
                    setEditingEvent(null);
                    showNotification(`L'événement « ${editingEvent.title} » a été mis à jour avec son affiche.`);
                  }}
                  className="px-5 py-2 rounded-xl bg-[#2854A6] text-white text-xs font-semibold hover:bg-[#1f4489]"
                >
                  Enregistrer les modifications
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. SUBPAGE: CRÉATION D'ÉVÉNEMENT */}
      {activeSubPage === 'evenements-creer' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-7 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                <button
                  onClick={() => onNavigateSubPage('evenements')}
                  className="hover:text-church-navy text-slate-600 font-medium"
                >
                  Événements
                </button>
                <span>/</span>
                <span>Nouveau</span>
              </div>
              <h2 className="font-heading font-bold text-xl text-church-navy">
                Créer un Événement ou une Veillée
              </h2>
            </div>
          </div>

          <form onSubmit={handlePublishEvent} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Titre de l'événement
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: Grande Nuit de Prière et Traversée"
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catégorie
                </label>
                <select
                  value={eventForm.category}
                  onChange={(e) => setEventForm({ ...eventForm, category: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none"
                >
                  <option value="Prière">Prière</option>
                  <option value="Jeunesse">Jeunesse</option>
                  <option value="Femmes">Femmes</option>
                  <option value="Évangélisation">Évangélisation</option>
                  <option value="Culte spécial">Culte spécial</option>
                  <option value="Conférence">Conférence</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Date
                </label>
                <input
                  type="text"
                  required
                  value={eventForm.date}
                  onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Horaire
                </label>
                <input
                  type="text"
                  required
                  value={eventForm.time}
                  onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lieu à Anyama
                </label>
                <input
                  type="text"
                  required
                  value={eventForm.location}
                  onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Orateur invité
                </label>
                <input
                  type="text"
                  value={eventForm.speaker}
                  onChange={(e) => setEventForm({ ...eventForm, speaker: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Description détaillée
              </label>
              <textarea
                rows={3}
                required
                value={eventForm.description}
                onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Affiche officielle / Poster de l'événement
              </label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <img
                  src={eventForm.coverImage}
                  alt="Aperçu affiche"
                  className="w-24 h-16 object-cover rounded-lg border border-slate-200 shrink-0"
                />
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="px-3 py-1.5 rounded-lg bg-[#2854A6] text-white font-semibold text-xs cursor-pointer hover:bg-[#1f4489] transition-colors inline-flex items-center gap-1.5 shadow-xs">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Importer l’affiche depuis mon appareil</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          handleImageFileUpload(e, (url) => setEventForm({ ...eventForm, coverImage: url }))
                        }
                        className="hidden"
                      />
                    </label>
                    <span className="text-[11px] text-slate-500">ou lien direct :</span>
                  </div>
                  <input
                    type="text"
                    value={eventForm.coverImage}
                    onChange={(e) => setEventForm({ ...eventForm, coverImage: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => onNavigateSubPage('evenements')}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#2854A6] text-white text-xs font-semibold hover:bg-[#1f4489] transition-colors"
              >
                Publier l'événement
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 6. SUBPAGE: ACTUALITÉS & COMMUNOIQUÉS */}
      {activeSubPage === 'actualites' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-7 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-heading font-bold text-base text-[#173567]">
                Actualités & Avis Pastoraux
              </h3>
              <p className="text-xs text-slate-500">
                {news.length} publications actives
              </p>
            </div>
            <button
              onClick={() => onNavigateSubPage('actualites-creer')}
              className="px-4 py-2 rounded-xl bg-[#2854A6] text-white text-xs font-semibold hover:bg-[#1f4489] transition-colors flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Nouveau Communiqué</span>
            </button>
          </div>

          <div className="space-y-3">
            {news.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-slate-200/80 bg-church-light flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-church-navy text-sm">
                      {item.title}
                    </span>
                    {item.isUrgent && (
                      <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-semibold text-[10px]">
                        Urgent
                      </span>
                    )}
                  </div>
                  <div className="text-slate-500">
                    {item.date} · {item.author} ({item.authorRole})
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-[11px] mr-1">
                    {item.readsCount} vues · 👍 {item.likes || 0}
                  </span>

                  <button
                    onClick={() => setEditingNews(item)}
                    className="px-2.5 py-1.5 rounded-lg border border-[#2854A6]/30 text-[#2854A6] bg-blue-50/50 hover:bg-blue-100/50 text-xs font-semibold flex items-center gap-1 transition-colors"
                    title="Modifier et rectifier cette actualité"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Modifier</span>
                  </button>

                  {onDeleteNews && (
                    <button
                      onClick={() => {
                        if (window.confirm(`Supprimer le communiqué « ${item.title} » ?`)) {
                          onDeleteNews(item.id);
                          showNotification(`Le communiqué « ${item.title} » a été supprimé.`);
                        }
                      }}
                      className="p-1.5 rounded-lg text-rose-600 hover:text-rose-800 hover:bg-rose-50 transition-colors"
                      title="Supprimer ce communiqué"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Modal / Formulaire de modification d'une actualité existante */}
          {editingNews && (
            <div className="p-6 bg-[#F4F6F9] rounded-2xl border-2 border-[#2854A6] space-y-4 shadow-sm animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <Edit className="w-4 h-4 text-[#2854A6]" />
                  <h4 className="font-heading font-bold text-base text-[#173567]">
                    Modifier & Rectifier l'Actualité : « {editingNews.title} »
                  </h4>
                </div>
                <button
                  onClick={() => setEditingNews(null)}
                  className="px-3 py-1 rounded-lg text-xs font-medium text-slate-600 hover:bg-white"
                >
                  ✕ Fermer
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Titre de l'actualité</label>
                  <input
                    type="text"
                    value={editingNews.title}
                    onChange={(e) => setEditingNews({ ...editingNews, title: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Catégorie</label>
                  <select
                    value={editingNews.category}
                    onChange={(e) => setEditingNews({ ...editingNews, category: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Communiqué officiel">Communiqué officiel</option>
                    <option value="Vie de l’église">Vie de l’église</option>
                    <option value="Avis de décès">Avis de décès</option>
                    <option value="Événement">Événement</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date</label>
                  <input
                    type="text"
                    value={editingNews.date}
                    onChange={(e) => setEditingNews({ ...editingNews, date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Auteur / Émetteur</label>
                  <input
                    type="text"
                    value={editingNews.author}
                    onChange={(e) => setEditingNews({ ...editingNews, author: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Rôle de l'auteur</label>
                  <input
                    type="text"
                    value={editingNews.authorRole}
                    onChange={(e) => setEditingNews({ ...editingNews, authorRole: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Résumé d'introduction</label>
                  <textarea
                    rows={2}
                    value={editingNews.summary}
                    onChange={(e) => setEditingNews({ ...editingNews, summary: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Texte intégral officiel</label>
                  <textarea
                    rows={5}
                    value={editingNews.fullContent}
                    onChange={(e) => setEditingNews({ ...editingNews, fullContent: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Photo d'illustration / Affiche du communiqué
                  </label>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-white rounded-xl border border-slate-200">
                    <img
                      src={editingNews.coverImage || HERO_IMAGE}
                      alt="Aperçu photo"
                      className="w-24 h-16 object-cover rounded-lg border border-slate-200 shrink-0"
                    />
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="px-3 py-1.5 rounded-lg bg-[#2854A6] text-white font-semibold text-xs cursor-pointer hover:bg-[#1f4489] transition-colors inline-flex items-center gap-1.5 shadow-xs">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Importer une nouvelle photo</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                              handleImageFileUpload(e, (url) => setEditingNews({ ...editingNews, coverImage: url }))
                            }
                            className="hidden"
                          />
                        </label>
                        <span className="text-[11px] text-slate-500">ou modifier le lien :</span>
                      </div>
                      <input
                        type="text"
                        value={editingNews.coverImage || ''}
                        onChange={(e) => setEditingNews({ ...editingNews, coverImage: e.target.value })}
                        placeholder="ou lien direct..."
                        className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingNews.isUrgent}
                      onChange={(e) => setEditingNews({ ...editingNews, isUrgent: e.target.checked })}
                      className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                    />
                    <span>Marquer ce communiqué comme URGENT (badge rouge)</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingNews(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-white"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onUpdateNews) {
                      onUpdateNews(editingNews);
                    }
                    setEditingNews(null);
                    showNotification(`Le communiqué « ${editingNews.title} » a été mis à jour avec sa photo.`);
                  }}
                  className="px-5 py-2 rounded-xl bg-[#2854A6] text-white text-xs font-semibold hover:bg-[#1f4489]"
                >
                  Enregistrer les modifications
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 7. SUBPAGE: CRÉATION DE COMMUNOIQUÉ */}
      {activeSubPage === 'actualites-creer' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-7 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                <button
                  onClick={() => onNavigateSubPage('actualites')}
                  className="hover:text-church-navy text-slate-600 font-medium"
                >
                  Actualités
                </button>
                <span>/</span>
                <span>Nouveau</span>
              </div>
              <h2 className="font-heading font-bold text-xl text-church-navy">
                Rédiger un Communiqué Pastoral
              </h2>
            </div>
          </div>

          <form onSubmit={handlePublishNews} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Titre du communiqué
              </label>
              <input
                type="text"
                required
                value={newsForm.title}
                onChange={(e) => setNewsForm({ ...newsForm, title: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catégorie
                </label>
                <select
                  value={newsForm.category}
                  onChange={(e) => setNewsForm({ ...newsForm, category: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                >
                  <option value="Communiqué officiel">Communiqué officiel</option>
                  <option value="Vie de l’église">Vie de l’église</option>
                  <option value="Événement">Événement</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Auteur / Émetteur
                </label>
                <input
                  type="text"
                  value={newsForm.author}
                  onChange={(e) => setNewsForm({ ...newsForm, author: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Résumé d'introduction (1-2 phrases)
              </label>
              <textarea
                rows={2}
                required
                value={newsForm.summary}
                onChange={(e) => setNewsForm({ ...newsForm, summary: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Texte intégral officiel
              </label>
              <textarea
                rows={5}
                required
                value={newsForm.fullContent}
                onChange={(e) => setNewsForm({ ...newsForm, fullContent: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Photo d'illustration / Affiche du communiqué
              </label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <img
                  src={newsForm.coverImage}
                  alt="Aperçu photo"
                  className="w-24 h-16 object-cover rounded-lg border border-slate-200 shrink-0"
                />
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="px-3 py-1.5 rounded-lg bg-[#2854A6] text-white font-semibold text-xs cursor-pointer hover:bg-[#1f4489] transition-colors inline-flex items-center gap-1.5 shadow-xs">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Importer une photo depuis mon appareil</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          handleImageFileUpload(e, (url) => setNewsForm({ ...newsForm, coverImage: url }))
                        }
                        className="hidden"
                      />
                    </label>
                    <span className="text-[11px] text-slate-500">ou lien direct :</span>
                  </div>
                  <input
                    type="text"
                    value={newsForm.coverImage}
                    onChange={(e) => setNewsForm({ ...newsForm, coverImage: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded bg-white"
                  />
                </div>
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={newsForm.isUrgent}
                onChange={(e) => setNewsForm({ ...newsForm, isUrgent: e.target.checked })}
                className="rounded text-rose-600 focus:ring-rose-500"
              />
              <span className="font-semibold text-rose-800">Marquer comme communiqué urgent</span>
            </label>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => onNavigateSubPage('actualites')}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-church-navy text-white text-xs font-semibold hover:bg-church-blue"
              >
                Publier le communiqué
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 8. SUBPAGE: GALERIE & ALBUMS */}
      {activeSubPage === 'galerie' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-7 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-heading font-bold text-base text-[#173567]">
                Gestion des Albums Photos & Vidéos
              </h3>
              <p className="text-xs text-slate-500">
                {albums.length} albums hébergés
              </p>
            </div>
            <button
              onClick={() => onNavigateSubPage('galerie-creer')}
              className="px-4 py-2 rounded-xl bg-[#2854A6] text-white text-xs font-semibold hover:bg-[#1f4489] transition-colors flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Nouvel Album</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {albums.map((alb) => (
              <div key={alb.id} className="p-3.5 rounded-xl border border-slate-200/80 bg-church-light space-y-2 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-church-navy">
                    <img
                      src={alb.coverImage}
                      alt={alb.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/60 text-white text-[10px]">
                      {alb.category}
                    </div>
                  </div>
                  <h4 className="font-semibold text-xs text-church-navy line-clamp-1">
                    {alb.title}
                  </h4>
                  <div className="text-[11px] text-slate-500">
                    {alb.date} · {alb.mediaCount} fichiers
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-end gap-2">
                  <button
                    onClick={() => setEditingAlbum(alb)}
                    className="p-1.5 rounded-lg border border-[#2854A6]/30 text-[#2854A6] bg-blue-50/50 hover:bg-blue-100/50 transition-colors text-xs flex items-center gap-1"
                    title="Modifier cet album"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Modifier</span>
                  </button>

                  {onDeleteAlbum && (
                    <button
                      onClick={() => {
                        if (window.confirm(`Supprimer l'album « ${alb.title} » ?`)) {
                          onDeleteAlbum(alb.id);
                          showNotification(`L'album « ${alb.title} » a été supprimé.`);
                        }
                      }}
                      className="p-1.5 rounded-lg text-rose-600 hover:text-rose-800 hover:bg-rose-50 transition-colors text-xs flex items-center gap-1"
                      title="Supprimer cet album"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Supprimer</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Modal / Formulaire de modification d'album */}
          {editingAlbum && (
            <div className="p-6 bg-[#F4F6F9] rounded-2xl border-2 border-[#2854A6] space-y-4 shadow-sm animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <Edit className="w-4 h-4 text-[#2854A6]" />
                  <h4 className="font-heading font-bold text-base text-[#173567]">
                    Modifier & Rectifier l'Album : « {editingAlbum.title} »
                  </h4>
                </div>
                <button
                  onClick={() => setEditingAlbum(null)}
                  className="px-3 py-1 rounded-lg text-xs font-medium text-slate-600 hover:bg-white"
                >
                  ✕ Fermer
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Titre de l'album</label>
                  <input
                    type="text"
                    value={editingAlbum.title}
                    onChange={(e) => setEditingAlbum({ ...editingAlbum, title: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Catégorie</label>
                  <select
                    value={editingAlbum.category}
                    onChange={(e) => setEditingAlbum({ ...editingAlbum, category: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Cultes">Cultes</option>
                    <option value="Jeunesse">Jeunesse</option>
                    <option value="Événements">Événements</option>
                    <option value="Chorale & Louange">Chorale & Louange</option>
                    <option value="Femmes MIFA">Femmes MIFA</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Type de médias</label>
                  <select
                    value={editingAlbum.type}
                    onChange={(e) => setEditingAlbum({ ...editingAlbum, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="photo">Photos uniquement</option>
                    <option value="video">Vidéos uniquement</option>
                    <option value="mixte">Mixte (Photos & Vidéos)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Description de l'album</label>
                  <textarea
                    rows={3}
                    value={editingAlbum.description}
                    onChange={(e) => setEditingAlbum({ ...editingAlbum, description: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Image de couverture de l'album</label>
                  <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200">
                    <img
                      src={editingAlbum.coverImage}
                      alt="Aperçu album"
                      className="w-24 h-16 object-cover rounded-lg border border-slate-200 shrink-0"
                    />
                    <div className="space-y-1.5 flex-1">
                      <label className="px-3 py-1.5 rounded-lg bg-[#2854A6] text-white font-semibold text-xs cursor-pointer hover:bg-[#1f4489] transition-colors inline-flex items-center gap-1.5 shadow-xs">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Importer une nouvelle couverture</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            handleImageFileUpload(e, (url) => setEditingAlbum({ ...editingAlbum, coverImage: url }))
                          }
                          className="hidden"
                        />
                      </label>
                      <input
                        type="text"
                        value={editingAlbum.coverImage}
                        onChange={(e) => setEditingAlbum({ ...editingAlbum, coverImage: e.target.value })}
                        placeholder="ou lien direct..."
                        className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingAlbum(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-white"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onUpdateAlbum) {
                      onUpdateAlbum(editingAlbum);
                    }
                    setEditingAlbum(null);
                    showNotification(`L'album « ${editingAlbum.title} » a été mis à jour.`);
                  }}
                  className="px-5 py-2 rounded-xl bg-[#2854A6] text-white text-xs font-semibold hover:bg-[#1f4489]"
                >
                  Enregistrer les modifications
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUBPAGE: CRÉATION D'ALBUM GALERIE */}
      {activeSubPage === 'galerie-creer' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-7 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                <button
                  onClick={() => onNavigateSubPage('galerie')}
                  className="hover:text-church-navy text-slate-600 font-medium"
                >
                  Galerie
                </button>
                <span>/</span>
                <span>Nouvel Album</span>
              </div>
              <h2 className="font-heading font-bold text-xl text-church-navy">
                Créer un Nouvel Album Photos & Vidéos
              </h2>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!albumForm.title.trim()) return;
              const newAlb: AlbumItem = {
                id: `alb-${Date.now()}`,
                title: albumForm.title,
                category: albumForm.category,
                type: albumForm.type,
                date: albumForm.date,
                coverImage: albumForm.coverImage,
                mediaCount: simulatedFiles.length || 6,
                description: albumForm.description,
                items: [
                  { id: `m-${Date.now()}-1`, type: 'photo', url: albumForm.coverImage, caption: albumForm.title }
                ],
                isDemo: false
              };
              onAddNewAlbum(newAlb);
              showNotification(`L'album « ${albumForm.title} » a été créé avec succès.`);
              onNavigateSubPage('galerie');
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Titre de l'album
              </label>
              <input
                type="text"
                required
                value={albumForm.title}
                onChange={(e) => setAlbumForm({ ...albumForm, title: e.target.value })}
                placeholder="Ex : Culte d’action de grâces..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2854A6]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catégorie
                </label>
                <select
                  value={albumForm.category}
                  onChange={(e) => setAlbumForm({ ...albumForm, category: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                >
                  <option value="Cultes">Cultes</option>
                  <option value="Jeunesse">Jeunesse</option>
                  <option value="Événements">Événements</option>
                  <option value="Chorale & Louange">Chorale & Louange</option>
                  <option value="Femmes MIFA">Femmes MIFA</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Type de médias
                </label>
                <select
                  value={albumForm.type}
                  onChange={(e) => setAlbumForm({ ...albumForm, type: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                >
                  <option value="photo">Photos uniquement</option>
                  <option value="video">Vidéos uniquement</option>
                  <option value="mixte">Mixte (Photos & Vidéos)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Date de l'événement
                </label>
                <input
                  type="text"
                  value={albumForm.date}
                  onChange={(e) => setAlbumForm({ ...albumForm, date: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Description de l'album
              </label>
              <textarea
                rows={3}
                value={albumForm.description}
                onChange={(e) => setAlbumForm({ ...albumForm, description: e.target.value })}
                placeholder="Quelques phrases pour situer les photos ou vidéos prises..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => onNavigateSubPage('galerie')}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#2854A6] text-white text-xs font-semibold hover:bg-[#1f4489]"
              >
                Créer et publier l'album
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 9. SUBPAGE: DÉPARTEMENTS ET STRUCTURES LOCALES */}
      {activeSubPage === 'departements' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-7 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-heading font-bold text-base text-church-navy">
                Gestion des Départements et Groupes Locaux
              </h3>
              <p className="text-xs text-slate-500">
                Modification des intitulés officiels, des responsables et confirmation des noms provisoires.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {departments.map((dept) => (
              <div
                key={dept.id}
                className="p-4 rounded-xl border border-slate-200/80 bg-church-light flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-slate-200 text-church-navy font-bold text-[10px]">
                      {dept.code}
                    </span>
                    <span className="font-bold text-church-navy text-sm">
                      {dept.name}
                    </span>
                    {!dept.isNameConfirmed && (
                      <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-900 text-[10px] font-semibold">
                        À confirmer
                      </span>
                    )}
                  </div>
                  <div className="text-slate-500 mt-1">
                    Leader : <strong>{dept.leader}</strong> ({dept.leaderRole}) · {dept.meetingSchedule}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setEditingDept(editingDept?.id === dept.id ? null : dept)}
                    className="px-3 py-1.5 rounded-lg border border-[#2854A6]/30 text-[#2854A6] bg-blue-50/50 hover:bg-blue-100/50 text-xs font-semibold flex items-center gap-1"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>{editingDept?.id === dept.id ? 'Fermer' : 'Modifier'}</span>
                  </button>
                  <button
                    onClick={() => {
                      const updated = {
                        ...dept,
                        isNameConfirmed: !dept.isNameConfirmed
                      };
                      onUpdateDepartment(updated);
                      showNotification(`Statut de « ${dept.name} » mis à jour.`);
                    }}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-white text-slate-700 text-xs font-semibold"
                  >
                    {dept.isNameConfirmed ? 'Marquer à valider' : 'Valider dénomination'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {editingDept && (
            <div className="p-5 bg-[#F4F6F9] rounded-2xl border-2 border-[#2854A6]/40 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <h4 className="font-heading font-bold text-sm text-[#173567]">
                  Modifier la structure : {editingDept.name} ({editingDept.code})
                </h4>
                <button
                  onClick={() => setEditingDept(null)}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  ✕ Fermer
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Nom officiel</label>
                  <input
                    type="text"
                    value={editingDept.name}
                    onChange={(e) => setEditingDept({ ...editingDept, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Responsable désigné</label>
                  <input
                    type="text"
                    value={editingDept.leader}
                    onChange={(e) => setEditingDept({ ...editingDept, leader: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Rôle ou titre du leader</label>
                  <input
                    type="text"
                    value={editingDept.leaderRole}
                    onChange={(e) => setEditingDept({ ...editingDept, leaderRole: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Créneau de rencontre</label>
                  <input
                    type="text"
                    value={editingDept.meetingSchedule}
                    onChange={(e) => setEditingDept({ ...editingDept, meetingSchedule: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingDept(null)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-white"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onUpdateDepartment(editingDept);
                    setEditingDept(null);
                    showNotification(`Modifications enregistrées pour « ${editingDept.name} ».`);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#2854A6] text-white text-xs font-semibold hover:bg-[#1f4489]"
                >
                  Enregistrer les modifications
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 10. SUBPAGE: MODÉRATION DES COMMENTAIRES (Auto-publiés avec contrôle Garder / Retirer) */}
      {activeSubPage === 'commentaires' && (() => {
        // Collect real comments from all published entities
        const allCommentsList: Array<{
          id: string;
          targetId: string;
          targetType: 'culte' | 'evenement' | 'actualite';
          targetTitle: string;
          author: string;
          text: string;
          date: string;
          status: 'auto-publie' | 'approuve';
          isReported?: boolean;
        }> = [
          ...cultes.flatMap((c) =>
            (c.comments || []).map((comm) => ({
              id: comm.id,
              targetId: c.id,
              targetType: 'culte' as const,
              targetTitle: c.title,
              author: comm.authorName,
              text: comm.text,
              date: comm.date,
              status: comm.status || 'auto-publie',
              isReported: comm.reported
            }))
          ),
          ...events.flatMap((e) =>
            (e.comments || []).map((comm) => ({
              id: comm.id,
              targetId: e.id,
              targetType: 'evenement' as const,
              targetTitle: e.title,
              author: comm.authorName,
              text: comm.text,
              date: comm.date,
              status: comm.status || 'auto-publie',
              isReported: comm.reported
            }))
          ),
          ...news.flatMap((n) =>
            (n.comments || []).map((comm) => ({
              id: comm.id,
              targetId: n.id,
              targetType: 'actualite' as const,
              targetTitle: n.title,
              author: comm.authorName,
              text: comm.text,
              date: comm.date,
              status: comm.status || 'auto-publie',
              isReported: comm.reported
            }))
          )
        ];

        return (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-7 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-heading font-bold text-base text-[#173567]">
                  Contrôle & Modération des Commentaires
                </h3>
                <p className="text-xs text-[#343B46]/70 mt-0.5">
                  Les commentaires déposés par les fidèles sur les cultes, événements et actualités sont publiés automatiquement. Vous avez le plein pouvoir de les <strong>Garder</strong> (valider définitivement) ou de les <strong>Retirer</strong> du site.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-blue-50 text-[#2854A6] text-xs font-bold border border-blue-200/60">
                  {allCommentsList.length} commentaire{allCommentsList.length > 1 ? 's' : ''} au total
                </span>
              </div>
            </div>

            {allCommentsList.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
                <MessageCircle className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold text-slate-600">Aucun commentaire pour le moment</p>
                <p className="text-xs text-slate-400">
                  Dès qu’un visiteur laisse un commentaire sur un culte, un événement ou un communiqué, il apparaîtra ici avec options de maintien ou de retrait.
                </p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {allCommentsList.map((item) => (
                  <div
                    key={`${item.targetType}-${item.id}`}
                    className="p-4 rounded-xl border text-xs space-y-2.5 transition-all bg-white border-slate-200 hover:border-slate-300 shadow-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            item.targetType === 'culte'
                              ? 'bg-blue-100 text-[#173567]'
                              : item.targetType === 'evenement'
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-emerald-100 text-emerald-900'
                          }`}
                        >
                          {item.targetType === 'culte'
                            ? 'Culte'
                            : item.targetType === 'evenement'
                            ? 'Événement'
                            : 'Actualité'}
                        </span>

                        <span className="font-bold text-[#173567] text-[13px]">{item.author}</span>
                        <span className="text-slate-400">sur</span>
                        <span className="font-semibold text-slate-800 italic">« {item.targetTitle} »</span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{item.date}</span>
                        {item.status === 'approuve' ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                            ✓ Conservé
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold text-[10px] border border-blue-200">
                            Auto-publié
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-[#F4F6F9] text-slate-700 text-xs leading-relaxed border border-slate-200/60 font-sans">
                      {item.text}
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          onKeepComment?.(item.id, item.targetType, item.targetId);
                          showNotification(`Commentaire de ${item.author} conservé et validé.`);
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Garder le commentaire</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onRemoveComment?.(item.id, item.targetType, item.targetId);
                          showNotification(`Commentaire de ${item.author} retiré du site.`);
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Retirer du site</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* 11. SUBPAGE: MÉDIAS & MODIFICATION COMPLÈTE DES IMAGES DU SITE ET DE LA PAGE HÉROS */}
      {activeSubPage === 'medias' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-7 shadow-xs">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-heading font-bold text-lg text-[#173567] flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <span>Gestion des Médias, Visuels & Textes de la Page Héros</span>
                </h3>
                <p className="text-xs text-[#343B46]/70 mt-1 leading-relaxed">
                  Modifiez directement toutes les photos et affiches du site, ainsi que les textes d'introduction affichés sur la page d'accueil. Importez vos photos depuis votre téléphone ou ordinateur pour les appliquer immédiatement.
                </p>
              </div>
            </div>
          </div>

          {/* Section 1: Textes de la Page Héros */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-7 shadow-xs space-y-5">
            <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="font-heading font-bold text-base text-[#173567]">
                  1. Modifier l'écrit qui se trouve sur la page Héros
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Personnalisez les titres, badges officiels et messages d'accueil de la première section du site.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onUpdateHeroContent(heroForm);
                  showNotification('Les textes de la page Héros ont été enregistrés et mis à jour sur l’accueil !');
                }}
                className="px-4 py-2 rounded-xl bg-[#2854A6] hover:bg-[#1f4489] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Enregistrer les textes</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Dénomination nationale (Badge supérieur)
                </label>
                <input
                  type="text"
                  value={heroForm.nationalBadge}
                  onChange={(e) => setHeroForm({ ...heroForm, nationalBadge: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2854A6]/20 bg-white"
                  placeholder="Église Évangélique des Assemblées de Dieu de Côte d'Ivoire"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Paroisse locale officielle (Badge géographique)
                </label>
                <input
                  type="text"
                  value={heroForm.locationBadge}
                  onChange={(e) => setHeroForm({ ...heroForm, locationBadge: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2854A6]/20 bg-white"
                  placeholder="Anyama, Ran-Extension Résidentiel"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Grand Titre de la page d'accueil (Héros)
                </label>
                <input
                  type="text"
                  value={heroForm.mainTitle}
                  onChange={(e) => setHeroForm({ ...heroForm, mainTitle: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2854A6]/20 bg-white font-medium"
                  placeholder="Bienvenue à la Maison de Prière & d'Adoration"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Message d'accueil & verset biblique
                </label>
                <textarea
                  rows={3}
                  value={heroForm.welcomeMessage}
                  onChange={(e) => setHeroForm({ ...heroForm, welcomeMessage: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2854A6]/20 bg-white leading-relaxed"
                  placeholder="Une communauté vivante unie par la foi, la prière et la fraternité..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Texte du 1er bouton d'action
                </label>
                <input
                  type="text"
                  value={heroForm.actionButtonCulte}
                  onChange={(e) => setHeroForm({ ...heroForm, actionButtonCulte: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Texte du 2e bouton d'action
                </label>
                <input
                  type="text"
                  value={heroForm.actionButtonEvents}
                  onChange={(e) => setHeroForm({ ...heroForm, actionButtonEvents: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  onUpdateHeroContent(heroForm);
                  showNotification('Les textes de la page Héros ont été enregistrés avec succès !');
                }}
                className="px-5 py-2.5 rounded-xl bg-[#2854A6] hover:bg-[#1f4489] text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
              >
                <Check className="w-4 h-4 text-emerald-300" />
                <span>Enregistrer les textes de la page Héros</span>
              </button>
            </div>
          </div>

          {/* Section 2: Modification de toutes les images du site */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-7 shadow-xs space-y-6">
            <div className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-heading font-bold text-base text-[#173567]">
                  2. Modifier toutes les images du site
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Remplacer les visuels clés du temple (bannière principale, chaire pastorale, chorale, jeunesse) par vos propres photos officielles.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  onUpdateSiteImages(imagesForm);
                  showNotification('Toutes les images du site ont été enregistrées et appliquées !');
                }}
                className="px-4 py-2 rounded-xl bg-[#173567] hover:bg-[#0f2244] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Check className="w-3.5 h-3.5 text-emerald-300" />
                <span>Appliquer toutes les images</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Image 1: Bannière Héros */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-heading font-bold text-xs text-[#173567]">
                    Bannière Principale de la Page d'Accueil (Héros)
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400">16:9 / Plein écran</span>
                </div>

                <div className="relative aspect-video rounded-lg overflow-hidden border border-slate-200 bg-slate-200">
                  <img
                    src={imagesForm.heroImage}
                    alt="Aperçu bannière héros"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="space-y-2">
                  <label className="w-full py-2 px-3 rounded-lg bg-[#2854A6] hover:bg-[#1f4489] text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Importer depuis mon appareil (Galerie / Fichiers)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        handleImageFileUpload(e, (b64) =>
                          setImagesForm((prev) => ({ ...prev, heroImage: b64 }))
                        )
                      }
                      className="hidden"
                    />
                  </label>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={imagesForm.heroImage}
                      onChange={(e) =>
                        setImagesForm((prev) => ({ ...prev, heroImage: e.target.value }))
                      }
                      placeholder="Ou coller une URL d'image directe..."
                      className="flex-1 px-2.5 py-1.5 text-[11px] border border-slate-300 rounded-lg bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setImagesForm((prev) => ({ ...prev, heroImage: HERO_IMAGE }))}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 text-[11px] font-medium whitespace-nowrap"
                    >
                      Défaut
                    </button>
                  </div>
                </div>
              </div>

              {/* Image 2: Prédicateur / Chaire Pastorale */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-heading font-bold text-xs text-[#173567]">
                    Photo Prédicateur & Chaire Pastorale
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400">16:9 / Portrait</span>
                </div>

                <div className="relative aspect-video rounded-lg overflow-hidden border border-slate-200 bg-slate-200">
                  <img
                    src={imagesForm.pastorImage}
                    alt="Aperçu prédicateur"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="space-y-2">
                  <label className="w-full py-2 px-3 rounded-lg bg-[#2854A6] hover:bg-[#1f4489] text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Importer depuis mon appareil</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        handleImageFileUpload(e, (b64) =>
                          setImagesForm((prev) => ({ ...prev, pastorImage: b64 }))
                        )
                      }
                      className="hidden"
                    />
                  </label>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={imagesForm.pastorImage}
                      onChange={(e) =>
                        setImagesForm((prev) => ({ ...prev, pastorImage: e.target.value }))
                      }
                      placeholder="Ou coller une URL d'image..."
                      className="flex-1 px-2.5 py-1.5 text-[11px] border border-slate-300 rounded-lg bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setImagesForm((prev) => ({ ...prev, pastorImage: PASTOR_IMAGE }))}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 text-[11px] font-medium whitespace-nowrap"
                    >
                      Défaut
                    </button>
                  </div>
                </div>
              </div>

              {/* Image 3: Chorale & Louange */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-heading font-bold text-xs text-[#173567]">
                    Photo de la Chorale & Ministère de Louange
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400">16:9 / Groupe</span>
                </div>

                <div className="relative aspect-video rounded-lg overflow-hidden border border-slate-200 bg-slate-200">
                  <img
                    src={imagesForm.choirImage}
                    alt="Aperçu chorale"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="space-y-2">
                  <label className="w-full py-2 px-3 rounded-lg bg-[#2854A6] hover:bg-[#1f4489] text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Importer depuis mon appareil</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        handleImageFileUpload(e, (b64) =>
                          setImagesForm((prev) => ({ ...prev, choirImage: b64 }))
                        )
                      }
                      className="hidden"
                    />
                  </label>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={imagesForm.choirImage}
                      onChange={(e) =>
                        setImagesForm((prev) => ({ ...prev, choirImage: e.target.value }))
                      }
                      placeholder="Ou coller une URL d'image..."
                      className="flex-1 px-2.5 py-1.5 text-[11px] border border-slate-300 rounded-lg bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setImagesForm((prev) => ({ ...prev, choirImage: HERO_IMAGE }))}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 text-[11px] font-medium whitespace-nowrap"
                    >
                      Défaut
                    </button>
                  </div>
                </div>
              </div>

              {/* Image 4: Jeunesse & Avenir */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-heading font-bold text-xs text-[#173567]">
                    Photo de la Jeunesse (JAD) & Rassemblements
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400">16:9 / Dynamique</span>
                </div>

                <div className="relative aspect-video rounded-lg overflow-hidden border border-slate-200 bg-slate-200">
                  <img
                    src={imagesForm.youthImage}
                    alt="Aperçu jeunesse"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="space-y-2">
                  <label className="w-full py-2 px-3 rounded-lg bg-[#2854A6] hover:bg-[#1f4489] text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Importer depuis mon appareil</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        handleImageFileUpload(e, (b64) =>
                          setImagesForm((prev) => ({ ...prev, youthImage: b64 }))
                        )
                      }
                      className="hidden"
                    />
                  </label>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={imagesForm.youthImage}
                      onChange={(e) =>
                        setImagesForm((prev) => ({ ...prev, youthImage: e.target.value }))
                      }
                      placeholder="Ou coller une URL d'image..."
                      className="flex-1 px-2.5 py-1.5 text-[11px] border border-slate-300 rounded-lg bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setImagesForm((prev) => ({ ...prev, youthImage: HERO_IMAGE }))}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 text-[11px] font-medium whitespace-nowrap"
                    >
                      Défaut
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-slate-500">
                Toutes les modifications sont enregistrées instantanément et visibles sur l'ensemble du site public.
              </span>
              <button
                type="button"
                onClick={() => {
                  onUpdateSiteImages(imagesForm);
                  showNotification('Toutes les images du site ont été enregistrées avec succès !');
                }}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#173567] hover:bg-[#0f2244] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <Check className="w-4 h-4 text-emerald-300" />
                <span>Enregistrer & Appliquer les images du site</span>
              </button>
            </div>
          </div>

          {/* Section 3: Rappel Logo Officiel Navbar */}
          <div className="p-5 rounded-2xl bg-[#F4F6F9] border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-white border border-slate-200 p-1.5 flex items-center justify-center shrink-0">
                <ChurchLogo logoUrl={officialLogoUrl} size="md" />
              </div>
              <div>
                <h5 className="font-heading font-bold text-xs text-[#173567]">
                  Logo officiel de l'église (Navbar & En-tête)
                </h5>
                <p className="text-[11px] text-[#343B46]/70 mt-0.5">
                  {officialLogoUrl ? 'Logo personnalisé actuellement en place.' : 'Emblème vectoriel par défaut.'} Vous pouvez importer un nouveau fichier logo à tout moment.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigateSubPage('parametres')}
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-[#173567] text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs shrink-0"
            >
              <Settings className="w-3.5 h-3.5 text-[#2854A6]" />
              <span>Gérer le logo dans les Paramètres</span>
            </button>
          </div>
        </div>
      )}

      {/* 11. SUBPAGE: PARAMÈTRES & IMPORT DU LOGO OFFICIEL */}
      {activeSubPage === 'parametres' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-7 space-y-6">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="font-heading font-bold text-base text-[#173567]">
              Paramètres du Site & Import du Logo Officiel
            </h3>
            <p className="text-xs text-[#343B46]/70">
              Importez le fichier original du logo officiel de l’Église Évangélique des Assemblées de Dieu de Côte d'Ivoire (EEADCI) pour l'appliquer immédiatement sur l'ensemble du site.
            </p>
          </div>

          {/* Section Logo Officiel */}
          <div className="p-5 rounded-2xl bg-[#F4F6F9] border-l-4 border-[#2854A6] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-heading font-bold text-sm text-[#173567]">
                  Logo Officiel de l’Église (EEADCI)
                </h4>
                <p className="text-xs text-[#343B46] mt-0.5">
                  Importez le visuel officiel directement depuis la galerie ou les fichiers de votre smartphone ou ordinateur.
                </p>
              </div>

              {officialLogoUrl ? (
                <span className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  Logo Officiel Actif
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded bg-blue-100 text-[#173567] text-[10px] font-bold">
                  Emblème Vectoriel Actif
                </span>
              )}
            </div>

            {/* Current / Preview Logo Box */}
            <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-white rounded-xl border border-slate-200">
              <div className="w-24 h-24 rounded-2xl border border-slate-200 flex items-center justify-center p-2 bg-[#F4F6F9] overflow-hidden shrink-0">
                <ChurchLogo logoUrl={logoPreview} size="xl" />
              </div>

              <div className="space-y-2 flex-1 text-center sm:text-left">
                <span className="text-xs font-semibold text-[#173567] block">
                  {logoPreview
                    ? officialLogoUrl === logoPreview
                      ? 'Logo officiel de l’église actuellement déployé sur tout le site'
                      : 'Nouveau fichier sélectionné — Prêt à être déployé'
                    : 'Emblème vectoriel officiel par défaut (aucune photo importée)'}
                </span>
                <p className="text-[11px] text-[#343B46]/80 leading-relaxed">
                  Formats recommandés : PNG transparent haute résolution, JPEG ou SVG. Une fois enregistré, il s'affiche dans l'en-tête, le pied de page, les partages et l'espace administratif.
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-1 justify-center sm:justify-start">
                  <label className="px-3.5 py-2 rounded-xl bg-[#2854A6] hover:bg-[#1f4489] text-white text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5 shadow-xs">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Importer le logo depuis mon appareil</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoFileChange}
                      className="hidden"
                    />
                  </label>

                  {logoPreview && logoPreview !== officialLogoUrl && (
                    <button
                      onClick={handleSaveOfficialLogo}
                      className="px-4 py-2 rounded-xl bg-[#173567] hover:bg-[#0f2244] text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Appliquer à tout le site</span>
                    </button>
                  )}

                  {officialLogoUrl && (
                    <button
                      onClick={handleResetToProvisionalLogo}
                      className="px-3 py-2 rounded-xl border border-slate-200 text-[#343B46] hover:bg-slate-50 text-xs font-medium transition-colors"
                    >
                      Rétablir l'emblème par défaut
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section Équipe Com */}
          <div className="space-y-3 pt-2">
            <h4 className="font-heading font-bold text-sm text-church-navy">
              Comptes de l'Équipe de Communication (Paroisse d’Anyama)
            </h4>
            <div className="space-y-2">
              {[
                { name: 'Diacre Jean-Paul Yao', email: 'jp.yao@ad-anyama.ci', role: 'Coordination Com & Médias' },
                { name: 'Sœur Grâce Koné', email: 'g.kone@ad-anyama.ci', role: 'Rédactrice Prédications' },
                { name: 'Frère Stéphane Koffi', email: 's.koffi@ad-anyama.ci', role: 'Photographie & Vidéo' }
              ].map((m, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs">
                  <div>
                    <span className="font-bold text-church-navy block">{m.name}</span>
                    <span className="text-slate-500">{m.email} · {m.role}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                    Actif
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
