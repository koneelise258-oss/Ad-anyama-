export type PageView =
  | 'accueil'
  | 'cultes'
  | 'culte-detail'
  | 'evenements'
  | 'evenement-detail'
  | 'galerie'
  | 'album-detail'
  | 'actualites'
  | 'actualite-detail'
  | 'departements'
  | 'departement-detail'
  | 'admin';

export type AdminSubPage =
  | 'dashboard'
  | 'cultes'
  | 'cultes-creer'
  | 'evenements'
  | 'evenements-creer'
  | 'actualites'
  | 'actualites-creer'
  | 'galerie'
  | 'galerie-creer'
  | 'departements'
  | 'commentaires'
  | 'medias'
  | 'parametres';

export interface ChurchSettings {
  logoUrl: string | null;
  parishName: string;
  denomination: string;
  city: string;
  address: string;
  phone: string;
  email: string;
}

export interface SiteImages {
  heroImage: string;
  pastorImage: string;
  choirImage: string;
  youthImage: string;
}

export interface HeroContent {
  nationalBadge: string;
  locationBadge: string;
  mainTitle: string;
  welcomeMessage: string;
  actionButtonCulte: string;
  actionButtonEvents: string;
}

export interface ServiceLiturgicalStep {
  time?: string;
  title: string;
  leader: string;
  description?: string;
}

export interface CulteReaction {
  likes: number;
  hearts: number;
  prayers: number;
}

export interface ItemComment {
  id: string;
  targetId: string;
  targetType: 'culte' | 'evenement' | 'actualite';
  targetTitle?: string;
  authorName: string;
  text: string;
  date: string;
  status: 'auto-publie' | 'approuve';
  reported?: boolean;
}

export type CulteComment = ItemComment;

export interface CulteDocument {
  title: string;
  fileSize: string;
  type: 'pdf' | 'notes' | 'diapo';
  downloadUrl: string;
}

export interface Culte {
  id: string;
  title: string;
  subtitle?: string;
  date: string; // ISO date YYYY-MM-DD
  time: string;
  preacher: string;
  preacherRole: string;
  moderator: string;
  scriptureRef: string;
  scripturePassage: string;
  sermonSummary: string;
  keyPoints: string[];
  liturgy: ServiceLiturgicalStep[];
  coverImage: string;
  photos: string[];
  videoUrl?: string;
  videoDuration?: string;
  hasVideo: boolean;
  audioUrl?: string;
  audioDuration?: string;
  documents: CulteDocument[];
  reactions: CulteReaction;
  comments: CulteComment[];
  status: 'publie' | 'programme' | 'brouillon';
  isDemo?: boolean;
}

export interface EventPollOption {
  id: string;
  label: string;
  votes: number;
}

export interface EventPoll {
  question: string;
  options: EventPollOption[];
  totalVotes: number;
}

export interface EventItem {
  id: string;
  title: string;
  category: 'Culte spécial' | 'Conférence' | 'Jeunesse' | 'Prière' | 'Femmes' | 'Évangélisation';
  date: string;
  time: string;
  location: string;
  description: string;
  speaker?: string;
  coverImage: string; // Affiche officielle
  attendeesCount: number;
  isRegistered?: boolean;
  likes: number;
  comments: ItemComment[];
  poll?: EventPoll;
  isDemo?: boolean;
}

export interface NewsItem {
  id: string;
  title: string;
  category: 'Communiqué officiel' | 'Vie de l’église' | 'Avis de décès' | 'Événement';
  date: string;
  author: string;
  authorRole: string;
  summary: string;
  fullContent: string;
  coverImage?: string; // Photo / affiche officielle
  isUrgent?: boolean;
  readsCount: number;
  likes: number;
  comments: ItemComment[];
  isDemo?: boolean;
}

export interface MediaItem {
  id: string;
  type: 'photo' | 'video';
  url: string;
  caption?: string;
  duration?: string;
}

export interface AlbumItem {
  id: string;
  title: string;
  category: 'Cultes' | 'Jeunesse' | 'Événements' | 'Chorale & Louange' | 'Femmes MIFA';
  type: 'photo' | 'video' | 'mixte';
  date: string;
  coverImage: string;
  mediaCount: number;
  items: MediaItem[];
  description: string;
  isDemo?: boolean;
}

export interface DepartmentItem {
  id: string;
  code: string;
  name: string;
  isNameConfirmed: boolean;
  tagline: string;
  description: string;
  leader: string;
  leaderRole: string;
  meetingSchedule: string;
  meetingLocation: string;
  activities: string[];
  coverImage: string;
  galleryImages: string[];
  contactEmail?: string;
  contactPhone?: string;
  isDemo?: boolean;
}

export interface NotificationPreferences {
  cultes: boolean;
  evenements: boolean;
  communiques: boolean;
  channel: 'whatsapp' | 'web' | 'email';
  contactValue: string;
}

