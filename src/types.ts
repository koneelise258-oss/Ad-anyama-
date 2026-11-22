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
  | 'drive'
  | 'medias'
  | 'parametres'
  | 'securite';

export interface ChurchSchedule {
  id?: string;
  day: string;
  name: string;
  time: string;
}

export interface ThemeConfig {
  primaryColor: string;
  navyColor: string;
  lightBgColor: string;
  radiusStyle: 'classique' | 'doux' | 'tres-doux';
}

export interface HomeSectionsConfig {
  showQuickAccess: boolean;
  showSchedules: boolean;
  showLatestCulte: boolean;
  showEventsAndNews: boolean;
  showGallery: boolean;
  showDepartments: boolean;
}

export interface AnnouncementBanner {
  enabled: boolean;
  text: string;
  linkPage?: PageView;
}

export interface ChurchSettings {
  logoUrl: string | null;
  parishName: string;
  annexLabel?: string;
  motherChurch?: string;
  principalPastor?: string;
  foundationSummary?: string;
  denomination: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  footerNote?: string;
  announcementBanner?: AnnouncementBanner;
  schedules: ChurchSchedule[];
  theme?: ThemeConfig;
  homeSections?: HomeSectionsConfig;
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
  id?: string;
  title: string;
  fileSize: string;
  type: 'pdf' | 'notes' | 'diapo';
  downloadUrl: string;
  mimeType?: string;
  driveFileId?: string;
  driveAccountEmail?: string;
}

export type CulteServiceType = 'dimanche' | 'evenement' | 'mardi';

export interface Culte {
  id: string;
  title: string;
  subtitle?: string;
  serviceType?: CulteServiceType;
  eventLabel?: string;
  date: string; // ISO date YYYY-MM-DD
  publishedAt?: string; // Horodatage ISO automatique à la publication
  scheduledDate?: string; // ISO date YYYY-MM-DD pour publication automatique
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
  mediaItems?: MediaItem[];
  documents: CulteDocument[];
  reactions: CulteReaction;
  comments: CulteComment[];
  viewsCount?: number;
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
  publishedAt?: string;
  time: string;
  location: string;
  description: string;
  speaker?: string;
  coverImage: string;
  videoUrl?: string;
  audioUrl?: string;
  mediaItems?: MediaItem[];
  documents?: CulteDocument[];
  attendeesCount: number;
  viewsCount?: number;
  isRegistered?: boolean;
  likes: number;
  comments: ItemComment[];
  poll?: EventPoll;
  isDemo?: boolean;
}

export interface NewsItem {
  id: string;
  title: string;
  category: 'Communiqué officiel' | 'Vie de l’église' | 'Avis de décès';
  date: string;
  publishedAt?: string;
  author: string;
  authorRole: string;
  summary: string;
  fullContent: string;
  coverImage?: string;
  videoUrl?: string;
  audioUrl?: string;
  mediaItems?: MediaItem[];
  documents?: CulteDocument[];
  isUrgent?: boolean;
  readsCount: number;
  likes: number;
  comments: ItemComment[];
  isDemo?: boolean;
}

export interface MediaItem {
  id: string;
  type: 'photo' | 'video' | 'audio';
  url: string;
  fallbackUrl?: string;
  caption?: string;
  duration?: string;
  mimeType?: string;
  fileSize?: string;
  driveFileId?: string;
  driveAccountEmail?: string;
}

export interface AlbumItem {
  id: string;
  title: string;
  category: 'Cultes' | 'Jeunesse' | 'Événements' | 'Chorale & Louange' | 'Femmes MIFA' | 'Départements';
  type: 'photo' | 'video' | 'mixte';
  date: string;
  publishedAt?: string;
  coverImage: string;
  mediaCount: number;
  viewsCount?: number;
  items: MediaItem[];
  description: string;
  driveFolderId?: string;
  driveAccountEmail?: string;
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
  logoUrl?: string;
  coverImage: string;
  galleryImages: string[];
  documents?: CulteDocument[];
  contactEmail?: string;
  contactPhone?: string;
  isDemo?: boolean;
}

export interface AdminUserPublic {
  id: string;
  name: string;
  identifier: string;
  role: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface AdminInvitation {
  email: string;
  name: string;
  role: string;
  status: 'pending' | 'active';
  invitedBy?: string;
  invitedAt: string;
  registeredAt?: string;
}

export interface SecurityLogEntry {
  id: string;
  timestamp: string;
  event: string;
  actor: string;
  detail: string;
  severity: 'info' | 'warning' | 'alert';
}

export interface SecuritySettings {
  secretGateSlug: string;
  enableKeyboardShortcut: boolean;
  enableFooterTap: boolean;
  sessionTimeoutMinutes: number;
}

export interface AuthStatus {
  needsSetup: boolean;
  hasPendingInvites?: boolean;
  authenticated: boolean;
  currentAdmin: AdminUserPublic | null;
}

export interface UploadedFileResult {
  url: string;
  name: string;
  size: number;
  formattedSize: string;
  mimeType: string;
  docType: 'pdf' | 'notes' | 'diapo' | 'image' | 'audio' | 'video';
}

export interface PushNotificationRecord {
  id: string;
  title: string;
  body: string;
  url: string;
  sentAt: string;
  recipientCount: number;
}

export interface LinkedDriveFolder {
  folderId: string;
  folderName: string;
  accountEmail: string;
  albumId: string;
  albumTitle: string;
  lastSyncedAt: string;
  photoCount: number;
}

export interface LinkedDriveAccount {
  email: string;
  displayName: string;
  photoLink?: string;
  addedAt: string;
  lastSyncedAt?: string;
}

export interface NotificationPreferences {
  cultes: boolean;
  evenements: boolean;
  communiques: boolean;
  channel: 'whatsapp' | 'web' | 'email';
  contactValue: string;
}
