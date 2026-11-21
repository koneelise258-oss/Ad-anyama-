import {
  Culte,
  EventItem,
  NewsItem,
  AlbumItem,
  DepartmentItem,
  SiteImages,
  HeroContent,
  ChurchSettings
} from './types';
import heroImg from './assets/images/church_hero_worship_1793042690258.jpg';
import pastorImg from './assets/images/pastor_sermon_pulpit_1793042690731.jpg';
import choirImg from './assets/images/church_choir_praise_1793042691389.jpg';
import youthImg from './assets/images/youth_fellowship_jadci_1793042690601.jpg';

export const HERO_IMAGE = heroImg;
export const PASTOR_IMAGE = pastorImg;
export const CHOIR_IMAGE = choirImg;
export const YOUTH_IMAGE = youthImg;

export const DEFAULT_SITE_IMAGES: SiteImages = {
  heroImage: HERO_IMAGE,
  pastorImage: PASTOR_IMAGE,
  choirImage: CHOIR_IMAGE,
  youthImage: YOUTH_IMAGE
};

export const DEFAULT_HERO_CONTENT: HeroContent = {
  nationalBadge: 'Église Évangélique des Assemblées de Dieu de Côte d’Ivoire (EEADCI)',
  locationBadge: 'Annexe de Ran-Extension Résidentiel · Anyama',
  mainTitle: 'Une église unie pour adorer Dieu, grandir dans la foi et impacter Anyama.',
  welcomeMessage:
    'Bienvenue sur la plateforme officielle de l’annexe de Ran-Extension Résidentiel, rattachée à l’Église Évangélique des Assemblées de Dieu — Anyama Ran-Extension.',
  actionButtonCulte: 'Voir les cultes',
  actionButtonEvents: 'Agenda & Événements'
};

export const DEFAULT_CHURCH_SETTINGS: ChurchSettings = {
  logoUrl: null,
  denomination: 'Église Évangélique des Assemblées de Dieu de Côte d’Ivoire',
  parishName: 'Anyama — Annexe Ran-Extension Résidentiel',
  annexLabel: 'Annexe de l’église d’Anyama Ran-Extension',
  motherChurch: 'Église Évangélique des Assemblées de Dieu — Anyama Ran-Extension',
  principalPastor: 'Pasteur Djah Douogoi Nicaise',
  foundationSummary:
    'Rattachée à l’Église Évangélique des Assemblées de Dieu de Côte d’Ivoire (EEADCI), issue du réveil pentecôtiste, implantée en Côte d’Ivoire dès 1957-1958 avec le missionnaire André Brisset, reconnue officiellement le 1er mars 1960 et unifiée sur le plan national en 1979.',
  city: 'Anyama, District Autonome d’Abidjan, Côte d’Ivoire',
  address: 'Quartier Ran-Extension Résidentiel, Anyama',
  phone: '',
  email: '',
  footerNote: 'Annexe rattachée à l’Église Évangélique des Assemblées de Dieu — Anyama Ran-Extension.',
  announcementBanner: {
    enabled: false,
    text: '',
    linkPage: 'evenements'
  },
  schedules: [
    { id: 'sch-mardi', day: 'Mardi', name: 'Évangélisation et prière pour les malades', time: '18h30 - 20h00' },
    { id: 'sch-jeudi', day: 'Jeudi', name: 'Édification', time: '18h30 - 20h00' },
    { id: 'sch-dimanche', day: 'Dimanche', name: 'Culte de louange et d’adoration à l’Éternel', time: '07h30 - 11h00' }
  ],
  theme: {
    primaryColor: '#2854A6',
    navyColor: '#173567',
    lightBgColor: '#F4F6F9',
    radiusStyle: 'doux'
  },
  homeSections: {
    showQuickAccess: true,
    showSchedules: true,
    showLatestCulte: true,
    showEventsAndNews: true,
    showGallery: true,
    showDepartments: true
  }
};

/** Compatibilité lecture seule des informations par défaut (les données actives proviennent de ChurchSettings) */
export const CHURCH_INFO = DEFAULT_CHURCH_SETTINGS;

/** Aucune donnée fictive codée en dur : les publications réelles sont créées et gérées depuis l'espace administrateur. */
export const INITIAL_CULTES: Culte[] = [];
export const INITIAL_EVENTS: EventItem[] = [];
export const INITIAL_NEWS: NewsItem[] = [];
export const INITIAL_ALBUMS: AlbumItem[] = [];

/** Liste des départements et groupes de l'assemblée locale sans aucune donnée personnelle inventée. */
export const INITIAL_DEPARTMENTS: DepartmentItem[] = [
  {
    id: 'ecodim',
    code: 'ECODIM',
    name: 'ECODIM',
    isNameConfirmed: true,
    tagline: 'École du Dimanche (DEEADCI)',
    description: 'École du Dimanche pour l’enseignement biblique et l’encadrement spirituel des enfants.',
    leader: '',
    leaderRole: '',
    meetingSchedule: '',
    meetingLocation: '',
    activities: [],
    logoUrl: '/logos/ecodim.png',
    coverImage: YOUTH_IMAGE,
    galleryImages: []
  },
  {
    id: 'aoc',
    code: 'AOC',
    name: 'AOC',
    isNameConfirmed: true,
    tagline: 'Action des Ouvrières du Christ',
    description: 'Action des Ouvrières du Christ (AOC) — Département des femmes de l’assemblée locale.',
    leader: '',
    leaderRole: '',
    meetingSchedule: '',
    meetingLocation: '',
    activities: [],
    logoUrl: '/logos/aoc.png',
    coverImage: CHOIR_IMAGE,
    galleryImages: []
  },
  {
    id: 'hac',
    code: 'HAC',
    name: 'HAC',
    isNameConfirmed: true,
    tagline: 'Hommes Actifs pour Christ',
    description: 'Hommes Actifs pour Christ (HAC) — Département des hommes de l’assemblée locale.',
    leader: '',
    leaderRole: '',
    meetingSchedule: '',
    meetingLocation: '',
    activities: [],
    coverImage: PASTOR_IMAGE,
    galleryImages: []
  },
  {
    id: 'jadci',
    code: 'JADCI',
    name: 'La Jeunesse (JADCI)',
    isNameConfirmed: true,
    tagline: 'Jeunesse des Assemblées de Dieu de Côte d’Ivoire',
    description: 'Département de la jeunesse de l’assemblée locale d’Anyama, Ran-Extension Résidentiel.',
    leader: '',
    leaderRole: '',
    meetingSchedule: '',
    meetingLocation: '',
    activities: [],
    logoUrl: '/logos/jadci.jpg',
    coverImage: YOUTH_IMAGE,
    galleryImages: []
  },
  {
    id: 'mifa',
    code: 'MIFA',
    name: 'MIFA',
    isNameConfirmed: true,
    tagline: 'Mission Famille',
    description: 'Ministère Mission Famille de l’assemblée locale (couples, foyers et vie familiale).',
    leader: '',
    leaderRole: '',
    meetingSchedule: '',
    meetingLocation: '',
    activities: [],
    coverImage: CHOIR_IMAGE,
    galleryImages: []
  },
  {
    id: 'groupe-musical',
    code: 'GM',
    name: 'Groupe Musical',
    isNameConfirmed: true,
    tagline: '',
    description: 'Équipe de louange et d’adoration musicale lors des cultes et rencontres.',
    leader: '',
    leaderRole: '',
    meetingSchedule: '',
    meetingLocation: '',
    activities: [],
    coverImage: CHOIR_IMAGE,
    galleryImages: []
  },
  {
    id: 'chorale',
    code: 'CHORALE',
    name: 'Chorale de l’Église',
    isNameConfirmed: true,
    tagline: '',
    description: 'Chorale de l’église pour les cantiques d’adoration et célébrations.',
    leader: '',
    leaderRole: '',
    meetingSchedule: '',
    meetingLocation: '',
    activities: [],
    coverImage: CHOIR_IMAGE,
    galleryImages: []
  },
  {
    id: 'evangelisation',
    code: 'EVANG',
    name: 'Comité d’Évangélisation',
    isNameConfirmed: true,
    tagline: '',
    description: 'Actions d’évangélisation de proximité à Anyama et ses environs.',
    leader: '',
    leaderRole: '',
    meetingSchedule: '',
    meetingLocation: '',
    activities: [],
    coverImage: HERO_IMAGE,
    galleryImages: []
  },
  {
    id: 'service-adoration',
    code: 'SA',
    name: 'Service d’Adoration',
    isNameConfirmed: true,
    tagline: '',
    description: 'Préparation spirituelle et accompagnement liturgique des cultes.',
    leader: '',
    leaderRole: '',
    meetingSchedule: '',
    meetingLocation: '',
    activities: [],
    coverImage: HERO_IMAGE,
    galleryImages: []
  },
  {
    id: 'adoration-gestuelle',
    code: 'AG',
    name: 'Adoration Gestuelle',
    isNameConfirmed: true,
    tagline: '',
    description: 'Expression chorégraphique de louange et d’adoration.',
    leader: '',
    leaderRole: '',
    meetingSchedule: '',
    meetingLocation: '',
    activities: [],
    coverImage: CHOIR_IMAGE,
    galleryImages: []
  },
  {
    id: 'pnpr',
    code: 'PNPR',
    name: 'PNPR',
    isNameConfirmed: true,
    tagline: '',
    description: 'Département d’intercession et de prière de l’église.',
    leader: '',
    leaderRole: '',
    meetingSchedule: '',
    meetingLocation: '',
    activities: [],
    coverImage: HERO_IMAGE,
    galleryImages: []
  }
];
