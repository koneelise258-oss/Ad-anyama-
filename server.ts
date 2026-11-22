import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import dotenv from 'dotenv';
import type webPushType from 'web-push';

const require = createRequire(import.meta.url);
const webpush = require('web-push') as typeof webPushType;
let bundledFirebaseConfig: { projectId?: string; apiKey?: string } = {};
try {
  bundledFirebaseConfig = require('./firebase-applet-config.json');
} catch {
  bundledFirebaseConfig = {};
}

dotenv.config();

const PORT = 3000;
const IS_VERCEL = Boolean(process.env.VERCEL || process.env.VERCEL_ENV);
const BUNDLED_DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_DIR = IS_VERCEL ? path.join(os.tmpdir(), 'eeadci-data') : BUNDLED_DATA_DIR;
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const STORE_FILE = path.join(DATA_DIR, 'store.json');
const SECRET_FILE = path.join(DATA_DIR, '.session_secret');

fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (IS_VERCEL) {
  const bundledStoreFile = path.join(BUNDLED_DATA_DIR, 'store.json');
  try {
    if (!fs.existsSync(STORE_FILE) && fs.existsSync(bundledStoreFile)) {
      fs.copyFileSync(bundledStoreFile, STORE_FILE);
    }
  } catch {
    // ignore seed copy failure on ephemeral fs
  }
}

// --- Types internes serveur ---
interface StoredAdmin {
  id: string;
  name: string;
  identifier: string;
  role: string;
  passwordHash: string;
  salt: string;
  recoveryCodeHash?: string;
  createdAt: string;
  lastLoginAt?: string;
}

interface StoredInvitation {
  email: string;
  name: string;
  role: string;
  status: 'pending' | 'active';
  inviteCodeHash?: string;
  resetCodeHash?: string;
  resetExpiresAt?: string;
  invitedBy?: string;
  invitedAt: string;
  registeredAt?: string;
}

interface SecurityLog {
  id: string;
  timestamp: string;
  event: string;
  actor: string;
  detail: string;
  severity: 'info' | 'warning' | 'alert';
}

interface StoreData {
  churchSettings: {
    logoUrl: string | null;
    parishName: string;
    annexLabel: string;
    motherChurch: string;
    principalPastor: string;
    foundationSummary: string;
    denomination: string;
    city: string;
    address: string;
    phone: string;
    email: string;
    footerNote: string;
    announcementBanner: {
      enabled: boolean;
      text: string;
      linkPage: string;
    };
    schedules: Array<{ id: string; day: string; name: string; time: string }>;
    theme: {
      primaryColor: string;
      navyColor: string;
      lightBgColor: string;
      radiusStyle: 'classique' | 'doux' | 'tres-doux';
    };
    homeSections: {
      showQuickAccess: boolean;
      showSchedules: boolean;
      showLatestCulte: boolean;
      showEventsAndNews: boolean;
      showGallery: boolean;
      showDepartments: boolean;
    };
  };
  heroContent: {
    nationalBadge: string;
    locationBadge: string;
    mainTitle: string;
    welcomeMessage: string;
    actionButtonCulte: string;
    actionButtonEvents: string;
  };
  siteImages: {
    heroImage: string;
    pastorImage: string;
    choirImage: string;
    youthImage: string;
  };
  cultes: any[];
  events: any[];
  news: any[];
  albums: any[];
  departments: any[];
  admins: StoredAdmin[];
  invitedAdmins: StoredInvitation[];
  security: {
    secretGateSlug: string;
    enableKeyboardShortcut: boolean;
    enableFooterTap: boolean;
    sessionTimeoutMinutes: number;
  };
  securityLogs: SecurityLog[];
  vapidKeys?: {
    publicKey: string;
    privateKey: string;
  };
  pushSubscriptions?: Array<{
    endpoint: string;
    expirationTime?: number | null;
    keys: {
      p256dh: string;
      auth: string;
    };
    createdAt: string;
  }>;
  pushHistory?: Array<{
    id: string;
    title: string;
    body: string;
    url: string;
    sentAt: string;
    recipientCount: number;
  }>;
  driveAccounts?: Array<{
    email: string;
    displayName: string;
    photoLink?: string;
    addedAt: string;
    lastSyncedAt?: string;
  }>;
  driveFolders?: Array<{
    folderId: string;
    folderName: string;
    accountEmail: string;
    albumId: string;
    albumTitle: string;
    lastSyncedAt: string;
    photoCount: number;
  }>;
}

const DEFAULT_AUTHORIZED_ADMIN_EMAILS: Array<{ email: string; name: string; role: string }> = [
  { email: 'koneelise258@gmail.com', name: 'Élisé Kone', role: 'Administrateur Principal' },
  { email: 'mikeyservice98@gmail.com', name: 'Mikey Service', role: 'Administrateur' }
];

const DEFAULT_DEPARTMENTS_SERVER = [
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
    coverImage: '',
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
    coverImage: '',
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
    coverImage: '',
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
    coverImage: '',
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
    coverImage: '',
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
    coverImage: '',
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
    coverImage: '',
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
    coverImage: '',
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
    coverImage: '',
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
    coverImage: '',
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
    coverImage: '',
    galleryImages: []
  }
];

const createDefaultStore = (): StoreData => ({
  churchSettings: {
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
  },
  heroContent: {
    nationalBadge: 'Église Évangélique des Assemblées de Dieu de Côte d’Ivoire (EEADCI)',
    locationBadge: 'Annexe de Ran-Extension Résidentiel · Anyama',
    mainTitle: 'Une église unie pour adorer Dieu, grandir dans la foi et impacter Anyama.',
    welcomeMessage:
      'Bienvenue sur la plateforme officielle de l’annexe de Ran-Extension Résidentiel, rattachée à l’Église Évangélique des Assemblées de Dieu — Anyama Ran-Extension.',
    actionButtonCulte: 'Voir les cultes',
    actionButtonEvents: 'Agenda & Événements'
  },
  siteImages: {
    heroImage: '',
    pastorImage: '',
    choirImage: '',
    youthImage: ''
  },
  cultes: [],
  events: [],
  news: [],
  albums: [],
  departments: DEFAULT_DEPARTMENTS_SERVER,
  admins: [],
  invitedAdmins: DEFAULT_AUTHORIZED_ADMIN_EMAILS.map((entry) => ({
    email: entry.email,
    name: entry.name,
    role: entry.role,
    status: 'pending' as const,
    invitedBy: 'Système',
    invitedAt: new Date().toISOString()
  })),
  security: {
    secretGateSlug: 'portail-eeadci',
    enableKeyboardShortcut: true,
    enableFooterTap: true,
    sessionTimeoutMinutes: 120
  },
  securityLogs: [],
  vapidKeys: createInitialVapidKeys(),
  pushSubscriptions: [],
  pushHistory: [],
  driveAccounts: [],
  driveFolders: []
});

const deriveVapidKeys = (): { publicKey: string; privateKey: string } => {
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    return {
      publicKey: process.env.VAPID_PUBLIC_KEY.trim(),
      privateKey: process.env.VAPID_PRIVATE_KEY.trim()
    };
  }
  if (IS_VERCEL) {
    const seed = crypto
      .createHash('sha256')
      .update(`${bundledFirebaseConfig?.projectId || 'eeadci'}:${bundledFirebaseConfig?.apiKey || 'anyama'}:vapid-v1`)
      .digest();
    seed[0] = (seed[0] & 0x7f) || 1;
    const ecdh = crypto.createECDH('prime256v1');
    ecdh.setPrivateKey(seed);
    return {
      publicKey: ecdh.getPublicKey(undefined, 'uncompressed').toString('base64url'),
      privateKey: ecdh.getPrivateKey().toString('base64url')
    };
  }
  return webpush.generateVAPIDKeys();
};

const createInitialVapidKeys = () => deriveVapidKeys();

// --- Secret HMAC Key ---
const getSessionSecret = (): string => {
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 32) {
    return process.env.SESSION_SECRET;
  }
  if (IS_VERCEL) {
    return crypto
      .createHmac(
        'sha256',
        `${bundledFirebaseConfig?.projectId || 'eeadci'}:${bundledFirebaseConfig?.apiKey || 'anyama'}:session-v1`
      )
      .update('eeadci-session-secret')
      .digest('hex');
  }
  try {
    if (fs.existsSync(SECRET_FILE)) {
      const existing = fs.readFileSync(SECRET_FILE, 'utf8').trim();
      if (existing.length >= 32) return existing;
    }
  } catch {
    // ignore read error
  }
  const generated = crypto.randomBytes(48).toString('hex');
  try {
    fs.writeFileSync(SECRET_FILE, generated, { mode: 0o600 });
  } catch {
    // ignore write error
  }
  return generated;
};

const SESSION_SECRET = getSessionSecret();

// --- Store Load & Atomic Save ---
const loadStore = (): StoreData => {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, 'utf8');
      const parsed = JSON.parse(raw) as Partial<StoreData>;
      const def = createDefaultStore();
      const mergedChurchSettings = {
        ...def.churchSettings,
        ...(parsed.churchSettings || {}),
        theme: { ...def.churchSettings.theme, ...(parsed.churchSettings?.theme || {}) },
        homeSections: { ...def.churchSettings.homeSections, ...(parsed.churchSettings?.homeSections || {}) },
        announcementBanner: {
          ...def.churchSettings.announcementBanner,
          ...(parsed.churchSettings?.announcementBanner || {})
        },
        schedules: parsed.churchSettings?.schedules || def.churchSettings.schedules
      };
      if (mergedChurchSettings.parishName === 'Anyama, Ran-Extension Résidentiel') {
        mergedChurchSettings.parishName = def.churchSettings.parishName;
      }
      if (
        mergedChurchSettings.footerNote === 'Communauté locale d’Anyama, Ran-Extension Résidentiel.' ||
        /Temple de la Restauration/i.test(mergedChurchSettings.footerNote || '')
      ) {
        mergedChurchSettings.footerNote = def.churchSettings.footerNote;
      }
      if (/Temple de la Restauration/i.test(mergedChurchSettings.motherChurch || '')) {
        mergedChurchSettings.motherChurch = def.churchSettings.motherChurch;
      }
      const mergedHero = { ...def.heroContent, ...(parsed.heroContent || {}) };
      if (mergedHero.locationBadge === 'Anyama, Ran-Extension Résidentiel') {
        mergedHero.locationBadge = def.heroContent.locationBadge;
      }
      if (mergedHero.nationalBadge === 'Église Évangélique des Assemblées de Dieu de Côte d’Ivoire') {
        mergedHero.nationalBadge = def.heroContent.nationalBadge;
      }
      if (
        mergedHero.welcomeMessage ===
          'Bienvenue sur la plateforme officielle de l’Église Évangélique des Assemblées de Dieu de Anyama, Ran-Extension Résidentiel. Retrouvez les cultes, les prédications, les événements, les actualités et la vie des départements.' ||
        /Temple de la Restauration/i.test(mergedHero.welcomeMessage || '')
      ) {
        mergedHero.welcomeMessage = def.heroContent.welcomeMessage;
      }
      const loadedAdmins = Array.isArray(parsed.admins) ? parsed.admins : [];
      let loadedInvites: StoredInvitation[] = Array.isArray(parsed.invitedAdmins) ? parsed.invitedAdmins : [];
      if (loadedInvites.length === 0 && loadedAdmins.length === 0) {
        loadedInvites = def.invitedAdmins;
      } else {
        for (const seed of DEFAULT_AUTHORIZED_ADMIN_EMAILS) {
          const existsInInvite = loadedInvites.some((i) => i.email.toLowerCase() === seed.email.toLowerCase());
          const matchingAdmin = loadedAdmins.find((a) => a.identifier.toLowerCase() === seed.email.toLowerCase());
          if (!existsInInvite) {
            loadedInvites.push({
              email: seed.email,
              name: matchingAdmin?.name || seed.name,
              role: matchingAdmin?.role || seed.role,
              status: matchingAdmin ? 'active' : 'pending',
              invitedBy: 'Système',
              invitedAt: matchingAdmin?.createdAt || new Date().toISOString(),
              registeredAt: matchingAdmin?.createdAt
            });
          }
        }
      }
      let loadedDepartments =
        Array.isArray(parsed.departments) && parsed.departments.length > 0 ? [...parsed.departments] : [...def.departments];
      // Migration idempotente : s'assurer que AOC et HAC existent, retirer l'entrée erronée ARC, attacher les logos EEADCI vérifiés et placer ECODIM, AOC, HAC en tête
      const defaultById = new Map(def.departments.map((d) => [d.id, d]));
      loadedDepartments = loadedDepartments.filter((d) => d.id !== 'arc');
      for (const requiredId of ['aoc', 'hac']) {
        const refDept = defaultById.get(requiredId);
        if (refDept && !loadedDepartments.some((d) => d.id === requiredId)) {
          loadedDepartments.push({ ...refDept });
        }
      }
      loadedDepartments = loadedDepartments.map((d) => {
        const ref = defaultById.get(d.id);
        const next = { ...d };
        if (next.coverImage && /church_hero_worship|pastor_sermon_pulpit|church_choir_praise|youth_fellowship_jadci/i.test(next.coverImage)) {
          next.coverImage = '';
        }
        if (!ref) return next;
        if (ref.logoUrl && !next.logoUrl) next.logoUrl = ref.logoUrl;
        if (!next.tagline && ref.tagline) next.tagline = ref.tagline;
        if (d.id === 'mifa' && d.description === 'Ministère des femmes de l’assemblée locale.') {
          next.description = ref.description;
        }
        if (d.id === 'hac' && d.description === 'Groupe des hommes de l’assemblée locale.') {
          next.description = ref.description;
        }
        if (d.id === 'jadci' && d.name === 'JADCI') {
          next.name = ref.name;
        }
        return next;
      });
      const priorityIds = ['ecodim', 'aoc', 'hac', 'jadci'];
      loadedDepartments = [
        ...priorityIds
          .map((id) => loadedDepartments.find((d) => d.id === id))
          .filter((d): d is any => Boolean(d)),
        ...loadedDepartments.filter((d) => !priorityIds.includes(d.id))
      ];
      const mergedSiteImages = {
        ...def.siteImages,
        ...(parsed.siteImages || {})
      };
      if (
        !mergedSiteImages.heroImage ||
        mergedSiteImages.heroImage === '/images/hero-church.jpg' ||
        /church_hero_worship|pastor_sermon_pulpit|church_choir_praise|youth_fellowship_jadci/i.test(mergedSiteImages.heroImage)
      ) {
        mergedSiteImages.heroImage = '';
      }
      return {
        ...def,
        ...parsed,
        churchSettings: mergedChurchSettings,
        heroContent: mergedHero,
        siteImages: mergedSiteImages,
        security: { ...def.security, ...(parsed.security || {}) },
        cultes: Array.isArray(parsed.cultes) ? parsed.cultes : def.cultes,
        events: Array.isArray(parsed.events) ? parsed.events : def.events,
        news: Array.isArray(parsed.news) ? parsed.news : def.news,
        albums: Array.isArray(parsed.albums) ? parsed.albums : def.albums,
        departments: loadedDepartments,
        admins: loadedAdmins,
        invitedAdmins: loadedInvites,
        securityLogs: Array.isArray(parsed.securityLogs) ? parsed.securityLogs : [],
        vapidKeys: parsed.vapidKeys?.publicKey && parsed.vapidKeys?.privateKey ? parsed.vapidKeys : def.vapidKeys,
        pushSubscriptions: Array.isArray(parsed.pushSubscriptions) ? parsed.pushSubscriptions : [],
        pushHistory: Array.isArray(parsed.pushHistory) ? parsed.pushHistory : [],
        driveAccounts: Array.isArray(parsed.driveAccounts) ? parsed.driveAccounts : [],
        driveFolders: Array.isArray(parsed.driveFolders) ? parsed.driveFolders : []
      };
    }
  } catch (err) {
    console.error('Erreur chargement store.json:', err);
  }
  const initial = createDefaultStore();
  saveStore(initial);
  return initial;
};

const saveStore = (data: StoreData): void => {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const tmpFile = `${STORE_FILE}.${process.pid}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tmpFile, STORE_FILE);
  } catch (err) {
    console.error('Erreur sauvegarde store.json:', err);
  }
};

let store: StoreData = loadStore();

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  store.vapidKeys = {
    publicKey: process.env.VAPID_PUBLIC_KEY.trim(),
    privateKey: process.env.VAPID_PRIVATE_KEY.trim()
  };
} else if (IS_VERCEL || !store.vapidKeys?.publicKey || !store.vapidKeys?.privateKey) {
  store.vapidKeys = deriveVapidKeys();
  saveStore(store);
}

webpush.setVapidDetails(
  'mailto:contact@eeadci-anyama.local',
  store.vapidKeys.publicKey,
  store.vapidKeys.privateKey
);

const appendSecurityLog = (event: string, actor: string, detail: string, severity: 'info' | 'warning' | 'alert' = 'info') => {
  const entry: SecurityLog = {
    id: `sec-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    timestamp: new Date().toISOString(),
    event,
    actor,
    detail,
    severity
  };
  store.securityLogs = [entry, ...store.securityLogs].slice(0, 100);
  saveStore(store);
};

// --- Automatisation : publication automatique des cultes programmés ---
const runAutomations = (): boolean => {
  const todayIso = new Date().toISOString().slice(0, 10);
  let changed = false;

  store.cultes = store.cultes.map((c) => {
    const targetDate = c.scheduledDate || c.date;
    if (c.status === 'programme' && targetDate && targetDate <= todayIso) {
      changed = true;
      return { ...c, status: 'publie' };
    }
    return c;
  });

  if (changed) {
    appendSecurityLog('Publication automatique', 'Automate', 'Un ou plusieurs cultes programmés ont été publiés automatiquement.', 'info');
  }
  return changed;
};

// --- Crypto Helpers ---
const hashPassword = (password: string, salt?: string): { hash: string; salt: string } => {
  const usedSalt = salt || crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, usedSalt, 64).toString('hex');
  return { hash: derived, salt: usedSalt };
};

const verifyPassword = (password: string, storedHash: string, salt: string): boolean => {
  try {
    const derived = crypto.scryptSync(password, salt, 64);
    const storedBuf = Buffer.from(storedHash, 'hex');
    if (derived.length !== storedBuf.length) return false;
    return crypto.timingSafeEqual(derived, storedBuf);
  } catch {
    return false;
  }
};

const signToken = (adminId: string, ttlMinutes: number): string => {
  const exp = Date.now() + ttlMinutes * 60 * 1000;
  const nonce = crypto.randomBytes(12).toString('hex');
  const payload = Buffer.from(JSON.stringify({ adminId, exp, nonce })).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
};

const verifyToken = (token: string): { adminId: string; exp: number } | null => {
  if (!token || !token.includes('.')) return null;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;
  const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { adminId: string; exp: number };
    if (!parsed.adminId || !parsed.exp || Date.now() > parsed.exp) return null;
    return parsed;
  } catch {
    return null;
  }
};

const parseCookies = (req: Request): Record<string, string> => {
  const raw = req.headers.cookie || '';
  const result: Record<string, string> = {};
  for (const part of raw.split(';')) {
    const idx = part.indexOf('=');
    if (idx > 0) {
      const k = part.slice(0, idx).trim();
      const v = part.slice(idx + 1).trim();
      result[k] = decodeURIComponent(v);
    }
  }
  return result;
};

const getClientIp = (req: Request): string => {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length > 0) return fwd.split(',')[0].trim();
  return req.socket.remoteAddress || 'unknown';
};

// --- Rate Limiter simple en mémoire ---
const rateLimits = new Map<string, { count: number; resetAt: number }>();

const checkRateLimit = (key: string, maxRequests: number, windowMs: number): { allowed: boolean; retryAfterSec: number } => {
  const now = Date.now();
  const rec = rateLimits.get(key);
  if (!rec || now > rec.resetAt) {
    rateLimits.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSec: 0 };
  }
  if (rec.count >= maxRequests) {
    return { allowed: false, retryAfterSec: Math.ceil((rec.resetAt - now) / 1000) };
  }
  rec.count += 1;
  return { allowed: true, retryAfterSec: 0 };
};

const sanitizeText = (value: unknown, maxLen = 4000): string => {
  if (typeof value !== 'string') return '';
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, maxLen);
};

const sanitizeSafeUrl = (value: unknown): string => {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed || trimmed === '#') return '';
  if (trimmed.startsWith('/uploads/') || trimmed.startsWith('/assets/')) return trimmed;
  if (/^data:image\/(png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=]+$/i.test(trimmed)) return trimmed;
  try {
    const u = new URL(trimmed);
    if (u.protocol === 'http:' || u.protocol === 'https:') return u.href;
  } catch {
    return '';
  }
  return '';
};

const hashCode = (code: string): string => {
  return crypto.createHash('sha256').update(code.trim().toUpperCase()).digest('hex');
};

const verifyCodeHash = (code: string, expectedHash?: string): boolean => {
  if (!code || !expectedHash) return false;
  const candidate = Buffer.from(hashCode(code));
  const target = Buffer.from(expectedHash);
  return candidate.length === target.length && crypto.timingSafeEqual(candidate, target);
};

const generateRecoveryCode = (): string => {
  return crypto.randomBytes(6).toString('hex').toUpperCase();
};

const generateInviteCode = (): string => {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
};

const generateResetCode = (): string => {
  return String(crypto.randomInt(100000, 999999));
};

const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email.trim());
};

const getFirebaseApiKey = (): string => {
  if (process.env.FIREBASE_API_KEY && process.env.FIREBASE_API_KEY.trim()) {
    return process.env.FIREBASE_API_KEY.trim();
  }
  if (bundledFirebaseConfig?.apiKey) {
    return bundledFirebaseConfig.apiKey;
  }
  try {
    const cfgPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(cfgPath)) {
      const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8')) as { apiKey?: string };
      return cfg.apiKey || '';
    }
  } catch {
    // ignore
  }
  return '';
};

const sendAdminEmail = async (to: string, subject: string, text: string): Promise<boolean> => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !apiKey.trim()) return false;
  try {
    const from = process.env.EMAIL_FROM?.trim() || 'EEADCI Anyama <onboarding@resend.dev>';
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ from, to: [to], subject, text })
    });
    return res.ok;
  } catch {
    return false;
  }
};

const buildMailtoUrl = (to: string, subject: string, body: string): string => {
  return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};

const getRequestBaseUrl = (req: Request): string => {
  const origin = req.headers.origin;
  if (typeof origin === 'string' && /^https?:\/\//i.test(origin)) return origin;
  const host = req.get('host');
  const proto = req.get('x-forwarded-proto') || req.protocol || 'https';
  return host ? `${proto}://${host}` : '';
};

const setSessionCookie = (res: Response, token: string, ttlMinutes: number) => {
  const maxAgeMs = ttlMinutes * 60 * 1000;
  res.cookie('eeadci_admin_session', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    partitioned: true,
    path: '/',
    maxAge: maxAgeMs
  } as any);
};

const clearSessionCookie = (res: Response) => {
  res.clearCookie('eeadci_admin_session', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    partitioned: true,
    path: '/'
  } as any);
};

const getAuthenticatedAdmin = (req: Request): StoredAdmin | null => {
  const cookies = parseCookies(req);
  const authHeader = req.headers.authorization;
  const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const token = bearer || cookies['eeadci_admin_session'] || '';
  const parsed = verifyToken(token);
  if (!parsed) return null;
  return store.admins.find((a) => a.id === parsed.adminId) || null;
};

interface AuthedRequest extends Request {
  adminUser?: StoredAdmin;
}

const requireAdmin = (req: AuthedRequest, res: Response, next: NextFunction) => {
  const admin = getAuthenticatedAdmin(req);
  if (!admin) {
    res.status(401).json({ error: 'Authentification administrateur requise.' });
    return;
  }
  req.adminUser = admin;
  next();
};

const toPublicAdmin = (a: StoredAdmin) => ({
  id: a.id,
  name: a.name,
  identifier: a.identifier,
  role: a.role,
  createdAt: a.createdAt,
  lastLoginAt: a.lastLoginAt
});

const toPublicInvitation = (inv: StoredInvitation) => ({
  email: inv.email,
  name: inv.name,
  role: inv.role,
  status: inv.status,
  invitedBy: inv.invitedBy,
  invitedAt: inv.invitedAt,
  registeredAt: inv.registeredAt
});

// --- Express App ---
const app = express();
app.disable('x-powered-by');

// Headers de cybersécurité sur toutes les requêtes
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
});

// Parser JSON (avec limite pour éviter les attaques DoS par charge utile)
app.use('/api', (req, res, next) => {
  if (req.path === '/admin/upload') return next();
  express.json({ limit: '15mb' })(req, res, next);
});

// Servir les fichiers téléversés de façon sécurisée (avec mode affichage inline ou ?download=1)
app.use(
  '/uploads',
  (req, res, next) => {
    if (req.query.download === '1') {
      const cleanReqPath = path.basename(req.path || '');
      const ext = path.extname(cleanReqPath).toLowerCase();
      const rawPreferred = typeof req.query.name === 'string' ? req.query.name : '';
      const cleanBase = sanitizeText(rawPreferred.replace(/[^\w\s.-]/g, '_'), 80) || path.basename(cleanReqPath, ext);
      const finalFilename = cleanBase.toLowerCase().endsWith(ext) ? cleanBase : `${cleanBase}${ext}`;
      res.setHeader('Content-Disposition', `attachment; filename="${finalFilename.replace(/"/g, '')}"`);
    }
    next();
  },
  express.static(UPLOADS_DIR, {
    dotfiles: 'deny',
    index: false,
    setHeaders: (res, filePath) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      const ext = path.extname(filePath).toLowerCase();
      if (
        !res.getHeader('Content-Disposition') &&
        !['.jpg', '.jpeg', '.png', '.webp', '.gif', '.mp3', '.wav', '.m4a', '.ogg', '.aac', '.mp4', '.webm', '.mov', '.m4v', '.pdf'].includes(ext)
      ) {
        res.setHeader('Content-Disposition', 'attachment');
      }
    }
  })
);

// =====================================================================
// ROUTES PUBLIQUES (Aucune donnée administrateur exposée)
// =====================================================================

app.get('/api/public/data', (_req, res) => {
  runAutomations();
  const typeRank = (c: any) => {
    const st = c.serviceType || 'dimanche';
    if (st === 'dimanche') return 0;
    if (st === 'evenement') return 1;
    return 2;
  };
  const publishedCultes = store.cultes
    .filter((c) => c.status === 'publie')
    .sort((a, b) => {
      const cmpDate = String(b.date || '').localeCompare(String(a.date || ''));
      if (cmpDate !== 0) return cmpDate;
      const cmpRank = typeRank(a) - typeRank(b);
      if (cmpRank !== 0) return cmpRank;
      return String(b.publishedAt || '').localeCompare(String(a.publishedAt || ''));
    });

  res.json({
    churchSettings: store.churchSettings,
    heroContent: store.heroContent,
    siteImages: store.siteImages,
    officialLogoUrl: store.churchSettings.logoUrl,
    cultes: publishedCultes,
    events: store.events,
    news: store.news,
    albums: store.albums,
    departments: store.departments
  });
});

app.post('/api/public/cultes/:id/react', (req, res) => {
  const ip = getClientIp(req);
  if (!checkRateLimit(`react:${ip}`, 40, 60_000).allowed) {
    res.status(429).json({ error: 'Trop de requêtes. Veuillez patienter.' });
    return;
  }
  const type = req.body?.type;
  if (!['likes', 'hearts', 'prayers'].includes(type)) {
    res.status(400).json({ error: 'Type de réaction invalide.' });
    return;
  }
  const idx = store.cultes.findIndex((c) => c.id === req.params.id && c.status === 'publie');
  if (idx === -1) {
    res.status(404).json({ error: 'Culte introuvable.' });
    return;
  }
  store.cultes[idx].reactions[type] = (store.cultes[idx].reactions[type] || 0) + 1;
  saveStore(store);
  res.json({ reactions: store.cultes[idx].reactions });
});

app.post('/api/public/cultes/:id/comment', (req, res) => {
  const ip = getClientIp(req);
  if (!checkRateLimit(`comment:${ip}`, 10, 60_000).allowed) {
    res.status(429).json({ error: 'Trop de messages envoyés. Patientez un instant.' });
    return;
  }
  const authorName = sanitizeText(req.body?.authorName, 50);
  const text = sanitizeText(req.body?.text, 800);
  if (!authorName || !text) {
    res.status(400).json({ error: 'Pseudonyme et message requis.' });
    return;
  }
  const idx = store.cultes.findIndex((c) => c.id === req.params.id && c.status === 'publie');
  if (idx === -1) {
    res.status(404).json({ error: 'Culte introuvable.' });
    return;
  }
  const comment = {
    id: `comm-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
    targetId: req.params.id,
    targetType: 'culte' as const,
    targetTitle: store.cultes[idx].title,
    authorName,
    text,
    date: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }),
    status: 'auto-publie' as const
  };
  store.cultes[idx].comments = [comment, ...(store.cultes[idx].comments || [])];
  saveStore(store);
  res.json({ comment });
});

app.post('/api/public/cultes/comments/:commentId/report', (req, res) => {
  let found = false;
  store.cultes = store.cultes.map((c) => ({
    ...c,
    comments: (c.comments || []).map((cm: any) => {
      if (cm.id === req.params.commentId) {
        found = true;
        return { ...cm, reported: true };
      }
      return cm;
    })
  }));
  if (found) saveStore(store);
  res.json({ ok: true });
});

app.post('/api/public/events/:id/register', (req, res) => {
  const delta = req.body?.registered ? 1 : -1;
  const idx = store.events.findIndex((e) => e.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Événement introuvable.' });
    return;
  }
  store.events[idx].attendeesCount = Math.max(0, (store.events[idx].attendeesCount || 0) + delta);
  saveStore(store);
  res.json({ attendeesCount: store.events[idx].attendeesCount });
});

app.post('/api/public/events/:id/like', (req, res) => {
  const idx = store.events.findIndex((e) => e.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Événement introuvable.' });
    return;
  }
  store.events[idx].likes = (store.events[idx].likes || 0) + 1;
  saveStore(store);
  res.json({ likes: store.events[idx].likes });
});

app.post('/api/public/events/:id/comment', (req, res) => {
  const ip = getClientIp(req);
  if (!checkRateLimit(`comment:${ip}`, 10, 60_000).allowed) {
    res.status(429).json({ error: 'Trop de commentaires.' });
    return;
  }
  const authorName = sanitizeText(req.body?.authorName, 50);
  const text = sanitizeText(req.body?.text, 500);
  if (!authorName || !text) {
    res.status(400).json({ error: 'Nom et message requis.' });
    return;
  }
  const idx = store.events.findIndex((e) => e.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Événement introuvable.' });
    return;
  }
  const comment = {
    id: `evc-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
    targetId: req.params.id,
    targetType: 'evenement' as const,
    targetTitle: store.events[idx].title,
    authorName,
    text,
    date: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }),
    status: 'auto-publie' as const
  };
  store.events[idx].comments = [comment, ...(store.events[idx].comments || [])];
  saveStore(store);
  res.json({ comment });
});

app.post('/api/public/events/:id/vote', (req, res) => {
  const optionId = sanitizeText(req.body?.optionId, 40);
  const idx = store.events.findIndex((e) => e.id === req.params.id);
  if (idx === -1 || !store.events[idx].poll) {
    res.status(404).json({ error: 'Sondage introuvable.' });
    return;
  }
  const poll = store.events[idx].poll;
  poll.options = poll.options.map((opt: any) => (opt.id === optionId ? { ...opt, votes: (opt.votes || 0) + 1 } : opt));
  poll.totalVotes = poll.options.reduce((sum: number, opt: any) => sum + (opt.votes || 0), 0);
  saveStore(store);
  res.json({ poll });
});

app.post('/api/public/news/:id/like', (req, res) => {
  const idx = store.news.findIndex((n) => n.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Actualité introuvable.' });
    return;
  }
  store.news[idx].likes = (store.news[idx].likes || 0) + 1;
  saveStore(store);
  res.json({ likes: store.news[idx].likes });
});

app.post('/api/public/news/:id/comment', (req, res) => {
  const ip = getClientIp(req);
  if (!checkRateLimit(`comment:${ip}`, 10, 60_000).allowed) {
    res.status(429).json({ error: 'Trop de commentaires.' });
    return;
  }
  const authorName = sanitizeText(req.body?.authorName, 50);
  const text = sanitizeText(req.body?.text, 500);
  if (!authorName || !text) {
    res.status(400).json({ error: 'Nom et message requis.' });
    return;
  }
  const idx = store.news.findIndex((n) => n.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Actualité introuvable.' });
    return;
  }
  const comment = {
    id: `nc-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
    targetId: req.params.id,
    targetType: 'actualite' as const,
    targetTitle: store.news[idx].title,
    authorName,
    text,
    date: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }),
    status: 'auto-publie' as const
  };
  store.news[idx].comments = [comment, ...(store.news[idx].comments || [])];
  saveStore(store);
  res.json({ comment });
});

// Comptage anonyme des vues visiteurs (sans création de compte)
app.post('/api/public/cultes/:id/view', (req, res) => {
  const idx = store.cultes.findIndex((c) => c.id === req.params.id && c.status === 'publie');
  if (idx === -1) {
    res.status(404).json({ error: 'Culte introuvable.' });
    return;
  }
  store.cultes[idx].viewsCount = (store.cultes[idx].viewsCount || 0) + 1;
  saveStore(store);
  res.json({ viewsCount: store.cultes[idx].viewsCount });
});

app.post('/api/public/events/:id/view', (req, res) => {
  const idx = store.events.findIndex((e) => e.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Événement introuvable.' });
    return;
  }
  store.events[idx].viewsCount = (store.events[idx].viewsCount || 0) + 1;
  saveStore(store);
  res.json({ viewsCount: store.events[idx].viewsCount });
});

app.post('/api/public/news/:id/view', (req, res) => {
  const idx = store.news.findIndex((n) => n.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Actualité introuvable.' });
    return;
  }
  store.news[idx].readsCount = (store.news[idx].readsCount || 0) + 1;
  saveStore(store);
  res.json({ readsCount: store.news[idx].readsCount });
});

app.post('/api/public/albums/:id/view', (req, res) => {
  const idx = store.albums.findIndex((a) => a.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Album introuvable.' });
    return;
  }
  store.albums[idx].viewsCount = (store.albums[idx].viewsCount || 0) + 1;
  saveStore(store);
  res.json({ viewsCount: store.albums[idx].viewsCount });
});

// Abonnements Web Push PWA (sans compte utilisateur)
app.get('/api/public/push/vapid-key', (_req, res) => {
  res.json({ publicKey: store.vapidKeys?.publicKey || '' });
});

app.post('/api/public/push/subscribe', (req, res) => {
  const sub = req.body?.subscription;
  if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
    res.status(400).json({ error: 'Abonnement Push invalide.' });
    return;
  }
  const existing = store.pushSubscriptions || [];
  const filtered = existing.filter((s) => s.endpoint !== sub.endpoint);
  store.pushSubscriptions = [
    ...filtered,
    {
      endpoint: String(sub.endpoint),
      expirationTime: sub.expirationTime ?? null,
      keys: {
        p256dh: String(sub.keys.p256dh),
        auth: String(sub.keys.auth)
      },
      createdAt: new Date().toISOString()
    }
  ];
  saveStore(store);
  res.json({ ok: true, count: store.pushSubscriptions.length });
});

app.post('/api/public/push/unsubscribe', (req, res) => {
  const endpoint = String(req.body?.endpoint || '');
  if (endpoint) {
    store.pushSubscriptions = (store.pushSubscriptions || []).filter((s) => s.endpoint !== endpoint);
    saveStore(store);
  }
  res.json({ ok: true });
});

// =====================================================================
// AUTHENTIFICATION & CONTRÔLE D'ACCÈS CACHÉ
// =====================================================================

app.post('/api/auth/verify-gate', (req, res) => {
  const ip = getClientIp(req);
  if (!checkRateLimit(`gate:${ip}`, 15, 60_000).allowed) {
    res.status(429).json({ valid: false });
    return;
  }
  const candidate = sanitizeText(req.body?.slug, 80).toLowerCase();
  const target = (store.security.secretGateSlug || 'portail-eeadci').toLowerCase();
  const a = Buffer.from(candidate);
  const b = Buffer.from(target);
  const valid = a.length === b.length && a.length > 0 && crypto.timingSafeEqual(a, b);
  res.json({ valid });
});

app.get('/api/auth/status', (req, res) => {
  const admin = getAuthenticatedAdmin(req);
  res.json({
    needsSetup: store.admins.length === 0,
    hasPendingInvites: (store.invitedAdmins || []).some((i) => i.status === 'pending'),
    authenticated: !!admin,
    currentAdmin: admin ? toPublicAdmin(admin) : null
  });
});

app.post('/api/auth/google', async (req, res) => {
  const ip = getClientIp(req);
  const rl = checkRateLimit(`google-auth:${ip}`, 12, 15 * 60_000);
  if (!rl.allowed) {
    res.status(429).json({ error: 'Trop de tentatives de connexion. Patientez quelques minutes.' });
    return;
  }

  const firebaseIdToken = typeof req.body?.firebaseIdToken === 'string' ? req.body.firebaseIdToken.trim() : '';
  const apiKey = getFirebaseApiKey();

  if (!firebaseIdToken || !apiKey) {
    res.status(400).json({ error: 'Jeton Google manquant ou configuration serveur incomplète.' });
    return;
  }

  try {
    const lookupRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: firebaseIdToken })
      }
    );
    const lookupData = (await lookupRes.json().catch(() => ({}))) as {
      users?: Array<{ email?: string; emailVerified?: boolean; displayName?: string }>;
    };
    const googleUser = lookupData?.users?.[0];
    const verifiedEmail = googleUser?.email?.toLowerCase() || '';

    if (!lookupRes.ok || !googleUser?.emailVerified || !verifiedEmail) {
      res.status(401).json({ error: 'Compte Google non vérifié ou session expirée.' });
      return;
    }

    const invite = (store.invitedAdmins || []).find((i) => i.email.toLowerCase() === verifiedEmail);
    if (!invite) {
      appendSecurityLog(
        'Accès Google refusé',
        verifiedEmail,
        'Tentative de connexion avec un e-mail non autorisé dans la liste blanche.',
        'alert'
      );
      res.status(403).json({
        error: `Accès refusé : l’adresse ${verifiedEmail} n’est pas autorisée comme administrateur.`
      });
      return;
    }

    const nowIso = new Date().toISOString();
    let admin = store.admins.find((a) => a.identifier.toLowerCase() === verifiedEmail);
    if (!admin) {
      admin = {
        id: `adm-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
        name: googleUser.displayName || invite.name || verifiedEmail.split('@')[0],
        identifier: verifiedEmail,
        role: invite.role || (store.admins.length === 0 ? 'Administrateur Principal' : 'Administrateur'),
        passwordHash: '',
        salt: '',
        createdAt: nowIso,
        lastLoginAt: nowIso
      };
      store.admins.push(admin);
    } else {
      if (googleUser.displayName && (!admin.name || admin.name === verifiedEmail.split('@')[0])) {
        admin.name = googleUser.displayName;
      }
      admin.lastLoginAt = nowIso;
    }

    invite.status = 'active';
    invite.name = admin.name;
    invite.inviteCodeHash = undefined;
    invite.resetCodeHash = undefined;
    invite.resetExpiresAt = undefined;
    invite.registeredAt = invite.registeredAt || nowIso;

    appendSecurityLog('Connexion Google réussie', admin.name, `Accès administrateur (${verifiedEmail}).`, 'info');
    saveStore(store);

    const token = signToken(admin.id, store.security.sessionTimeoutMinutes || 120);
    setSessionCookie(res, token, store.security.sessionTimeoutMinutes || 120);
    res.json({ token, admin: toPublicAdmin(admin) });
  } catch {
    res.status(500).json({ error: 'Erreur serveur lors de la vérification du compte Google.' });
  }
});

app.post('/api/auth/setup', (_req, res) => {
  res.status(403).json({
    error: 'L’inscription par formulaire a été désactivée. Connectez-vous avec « Continuer avec Google ».'
  });
});

app.post('/api/auth/register', (_req, res) => {
  res.status(403).json({
    error: 'L’inscription par formulaire a été désactivée. Connectez-vous avec « Continuer avec Google ».'
  });
});

app.post('/api/auth/login', (req, res) => {
  const ip = getClientIp(req);
  const rl = checkRateLimit(`login:${ip}`, 8, 15 * 60_000);
  if (!rl.allowed) {
    appendSecurityLog('Tentative bloquée (Rate Limit)', ip, `Trop d'échecs de connexion depuis ${ip}`, 'alert');
    res.status(429).json({
      error: `Trop de tentatives infructueuses. Réessayez dans ${Math.ceil(rl.retryAfterSec / 60)} minute(s).`
    });
    return;
  }

  const identifier = sanitizeText(req.body?.identifier, 120).toLowerCase();
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  const found = store.admins.find((a) => a.identifier.toLowerCase() === identifier);
  if (!found || !found.passwordHash || !found.salt || !verifyPassword(password, found.passwordHash, found.salt)) {
    appendSecurityLog('Échec de connexion', identifier || 'inconnu', `Connexion refusée depuis ${ip}`, 'warning');
    res.status(401).json({ error: 'Veuillez utiliser le bouton « Continuer avec Google » avec une adresse autorisée.' });
    return;
  }

  rateLimits.delete(`login:${ip}`);
  found.lastLoginAt = new Date().toISOString();
  appendSecurityLog('Connexion réussie', found.name, `Session ouverte (${found.identifier})`, 'info');

  const token = signToken(found.id, store.security.sessionTimeoutMinutes || 120);
  setSessionCookie(res, token, store.security.sessionTimeoutMinutes || 120);
  res.json({ token, admin: toPublicAdmin(found) });
});

app.post('/api/auth/forgot-password', async (req, res) => {
  const ip = getClientIp(req);
  const rl = checkRateLimit(`forgot:${ip}`, 5, 15 * 60_000);
  if (!rl.allowed) {
    res.status(429).json({
      error: `Trop de demandes de réinitialisation. Réessayez dans ${Math.ceil(rl.retryAfterSec / 60)} minute(s).`
    });
    return;
  }

  const email = sanitizeText(req.body?.email, 120).toLowerCase();
  if (!isValidEmail(email)) {
    res.status(400).json({ error: 'Veuillez saisir une adresse e-mail valide.' });
    return;
  }

  const invite = (store.invitedAdmins || []).find((i) => i.email.toLowerCase() === email);
  const admin = store.admins.find((a) => a.identifier.toLowerCase() === email);

  let emailSent = false;
  if (invite && admin) {
    const code = generateResetCode();
    invite.resetCodeHash = hashCode(code);
    invite.resetExpiresAt = new Date(Date.now() + 15 * 60_000).toISOString();
    saveStore(store);

    const subject = 'EEADCI Anyama — Password reset code / Réinitialisation administrateur';
    const body = `Bonjour ${admin.name},\n\nVoici votre code de réinitialisation de mot de passe administrateur (valable 15 minutes) : ${code}\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.`;
    emailSent = await sendAdminEmail(email, subject, body);
    appendSecurityLog('Demande Forgot password?', email, emailSent ? 'Code envoyé par e-mail.' : 'Code généré (service e-mail non configuré, utilisez Google ou le code de secours).', 'info');
  }

  res.json({
    ok: true,
    emailSent,
    message: emailSent
      ? 'Un code de réinitialisation à 6 chiffres vient d’être envoyé à votre adresse e-mail.'
      : 'Si cet e-mail correspond à un administrateur actif, utilisez « Verify with Google », votre Code de secours, ou demandez un code à un autre administrateur.'
  });
});

app.post('/api/auth/reset-password', (req, res) => {
  const ip = getClientIp(req);
  const rl = checkRateLimit(`reset:${ip}`, 8, 15 * 60_000);
  if (!rl.allowed) {
    res.status(429).json({ error: 'Trop de tentatives. Patientez quelques minutes.' });
    return;
  }

  const email = sanitizeText(req.body?.email, 120).toLowerCase();
  const code = sanitizeText(req.body?.code, 40);
  const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';

  if (!isValidEmail(email) || !code) {
    res.status(400).json({ error: 'E-mail et code de vérification requis.' });
    return;
  }
  if (newPassword.length < 10 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
    res.status(400).json({ error: 'Le nouveau mot de passe doit contenir au moins 10 caractères, majuscule, minuscule et chiffre.' });
    return;
  }

  const admin = store.admins.find((a) => a.identifier.toLowerCase() === email);
  const invite = (store.invitedAdmins || []).find((i) => i.email.toLowerCase() === email);

  const validResetCode =
    Boolean(invite?.resetCodeHash && invite.resetExpiresAt && Date.now() <= new Date(invite.resetExpiresAt).getTime()) &&
    verifyCodeHash(code, invite?.resetCodeHash);
  const validRecoveryCode = Boolean(admin?.recoveryCodeHash) && verifyCodeHash(code, admin?.recoveryCodeHash);

  if (!admin || (!validResetCode && !validRecoveryCode)) {
    appendSecurityLog('Échec réinitialisation', email, 'Code de réinitialisation ou de secours invalide/expiré.', 'warning');
    res.status(400).json({ error: 'Code de vérification ou code de secours invalide ou expiré.' });
    return;
  }

  const { hash, salt } = hashPassword(newPassword);
  const nextRecoveryCode = generateRecoveryCode();
  admin.passwordHash = hash;
  admin.salt = salt;
  admin.recoveryCodeHash = hashCode(nextRecoveryCode);
  admin.lastLoginAt = new Date().toISOString();
  if (invite) {
    invite.resetCodeHash = undefined;
    invite.resetExpiresAt = undefined;
    invite.status = 'active';
  }
  appendSecurityLog('Mot de passe réinitialisé', admin.name, `Réinitialisation validée (${email}).`, 'info');

  const token = signToken(admin.id, store.security.sessionTimeoutMinutes || 120);
  setSessionCookie(res, token, store.security.sessionTimeoutMinutes || 120);
  res.json({ token, admin: toPublicAdmin(admin), recoveryCode: nextRecoveryCode });
});

app.post('/api/auth/reset-password-google', async (req, res) => {
  const ip = getClientIp(req);
  const rl = checkRateLimit(`reset-google:${ip}`, 8, 15 * 60_000);
  if (!rl.allowed) {
    res.status(429).json({ error: 'Trop de tentatives. Patientez quelques minutes.' });
    return;
  }

  const firebaseIdToken = typeof req.body?.firebaseIdToken === 'string' ? req.body.firebaseIdToken.trim() : '';
  const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';
  const apiKey = getFirebaseApiKey();

  if (!firebaseIdToken || !apiKey) {
    res.status(400).json({ error: 'Vérification Google impossible côté serveur.' });
    return;
  }
  if (newPassword.length < 10 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
    res.status(400).json({ error: 'Le nouveau mot de passe doit contenir au moins 10 caractères, majuscule, minuscule et chiffre.' });
    return;
  }

  try {
    const lookupRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: firebaseIdToken })
    });
    const lookupData = (await lookupRes.json().catch(() => ({}))) as {
      users?: Array<{ email?: string; emailVerified?: boolean; displayName?: string }>;
    };
    const googleUser = lookupData?.users?.[0];
    const verifiedEmail = googleUser?.email?.toLowerCase() || '';

    if (!lookupRes.ok || !googleUser?.emailVerified || !verifiedEmail) {
      res.status(401).json({ error: 'Compte Google non vérifié.' });
      return;
    }

    const invite = (store.invitedAdmins || []).find((i) => i.email.toLowerCase() === verifiedEmail);
    if (!invite) {
      appendSecurityLog('Accès Google refusé', verifiedEmail, 'Compte Google non présent dans la liste autorisée.', 'alert');
      res.status(403).json({
        error: `L’e-mail ${verifiedEmail} n’est pas autorisé comme administrateur.`
      });
      return;
    }

    const { hash, salt } = hashPassword(newPassword);
    const nextRecoveryCode = generateRecoveryCode();
    let admin = store.admins.find((a) => a.identifier.toLowerCase() === verifiedEmail);

    if (!admin) {
      admin = {
        id: `adm-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
        name: googleUser.displayName || invite.name || verifiedEmail.split('@')[0],
        identifier: verifiedEmail,
        role: invite.role || 'Administrateur',
        passwordHash: hash,
        salt,
        recoveryCodeHash: hashCode(nextRecoveryCode),
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
      };
      store.admins.push(admin);
    } else {
      admin.passwordHash = hash;
      admin.salt = salt;
      admin.recoveryCodeHash = hashCode(nextRecoveryCode);
      admin.lastLoginAt = new Date().toISOString();
    }

    invite.status = 'active';
    invite.inviteCodeHash = undefined;
    invite.resetCodeHash = undefined;
    invite.resetExpiresAt = undefined;
    invite.registeredAt = invite.registeredAt || new Date().toISOString();
    appendSecurityLog('Réinitialisation via Google', admin.name, `Accès vérifié par Google (${verifiedEmail}).`, 'info');

    const token = signToken(admin.id, store.security.sessionTimeoutMinutes || 120);
    setSessionCookie(res, token, store.security.sessionTimeoutMinutes || 120);
    res.json({ token, admin: toPublicAdmin(admin), recoveryCode: nextRecoveryCode });
  } catch {
    res.status(500).json({ error: 'Erreur lors de la vérification du compte Google.' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  const admin = getAuthenticatedAdmin(req);
  if (admin) {
    appendSecurityLog('Déconnexion', admin.name, 'Session fermée manuellement.', 'info');
  }
  clearSessionCookie(res);
  res.json({ ok: true });
});

// =====================================================================
// ROUTES ADMINISTRATEUR PROTÉGÉES (requireAdmin)
// =====================================================================

app.get('/api/admin/bootstrap', requireAdmin, (_req, res) => {
  runAutomations();
  res.json({
    churchSettings: store.churchSettings,
    heroContent: store.heroContent,
    siteImages: store.siteImages,
    officialLogoUrl: store.churchSettings.logoUrl,
    cultes: store.cultes,
    events: store.events,
    news: store.news,
    albums: store.albums,
    departments: store.departments,
    admins: store.admins.map(toPublicAdmin),
    invitedAdmins: (store.invitedAdmins || []).map(toPublicInvitation),
    security: store.security,
    securityLogs: store.securityLogs,
    pushSubscribersCount: (store.pushSubscriptions || []).length,
    pushHistory: store.pushHistory || [],
    driveAccounts: store.driveAccounts || [],
    driveFolders: store.driveFolders || []
  });
});

// Envoi réel de notifications Push PWA à tous les abonnés
app.post('/api/admin/push/send', requireAdmin, async (req: AuthedRequest, res: Response) => {
  const title = sanitizeText(req.body?.title, 100) || 'Assemblées de Dieu d’Anyama';
  const body = sanitizeText(req.body?.body, 280);
  const url = sanitizeText(req.body?.url, 200) || '/';

  if (!body) {
    res.status(400).json({ error: 'Le message de la notification est requis.' });
    return;
  }

  const subs = store.pushSubscriptions || [];
  const payload = JSON.stringify({ title, body, url, tag: `eeadci-${Date.now()}` });

  let sentCount = 0;
  let failedCount = 0;
  const validSubs: NonNullable<StoreData['pushSubscriptions']> = [];

  for (const sub of subs) {
    try {
      await webpush.sendNotification(sub, payload);
      sentCount += 1;
      validSubs.push(sub);
    } catch (err: any) {
      failedCount += 1;
      // Garder uniquement si l'erreur n'est pas un désabonnement définitif (404 / 410)
      if (err?.statusCode !== 404 && err?.statusCode !== 410) {
        validSubs.push(sub);
      }
    }
  }

  store.pushSubscriptions = validSubs;
  const entry = {
    id: `push-${Date.now()}`,
    title,
    body,
    url,
    sentAt: new Date().toISOString(),
    recipientCount: sentCount
  };
  store.pushHistory = [entry, ...(store.pushHistory || [])].slice(0, 30);
  appendSecurityLog('Notification Push PWA envoyée', req.adminUser!.name, `${title} (${sentCount} appareil(s))`, 'info');

  res.json({
    sentCount,
    failedCount,
    subscribersCount: validSubs.length,
    pushHistory: store.pushHistory
  });
});

// Upload sécurisé multi-format (images, lots de photos, PDF, Word, PowerPoint, Excel, audio, vidéo)
const ALLOWED_MIME_MAP: Record<string, { ext: string[]; docType: 'pdf' | 'notes' | 'diapo' | 'image' | 'audio' | 'video' }> = {
  'image/jpeg': { ext: ['.jpg', '.jpeg'], docType: 'image' },
  'image/png': { ext: ['.png'], docType: 'image' },
  'image/webp': { ext: ['.webp'], docType: 'image' },
  'image/gif': { ext: ['.gif'], docType: 'image' },
  'image/svg+xml': { ext: ['.svg'], docType: 'image' },
  'image/heic': { ext: ['.heic'], docType: 'image' },
  'image/avif': { ext: ['.avif'], docType: 'image' },
  'application/pdf': { ext: ['.pdf'], docType: 'pdf' },
  'application/msword': { ext: ['.doc'], docType: 'notes' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { ext: ['.docx'], docType: 'notes' },
  'application/vnd.ms-powerpoint': { ext: ['.ppt'], docType: 'diapo' },
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': { ext: ['.pptx'], docType: 'diapo' },
  'application/vnd.ms-excel': { ext: ['.xls'], docType: 'notes' },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { ext: ['.xlsx'], docType: 'notes' },
  'text/plain': { ext: ['.txt'], docType: 'notes' },
  'audio/mpeg': { ext: ['.mp3'], docType: 'audio' },
  'audio/mp3': { ext: ['.mp3'], docType: 'audio' },
  'audio/wav': { ext: ['.wav'], docType: 'audio' },
  'audio/mp4': { ext: ['.m4a'], docType: 'audio' },
  'audio/x-m4a': { ext: ['.m4a'], docType: 'audio' },
  'audio/ogg': { ext: ['.ogg'], docType: 'audio' },
  'audio/aac': { ext: ['.aac'], docType: 'audio' },
  'video/mp4': { ext: ['.mp4'], docType: 'video' },
  'video/webm': { ext: ['.webm'], docType: 'video' },
  'video/quicktime': { ext: ['.mov'], docType: 'video' },
  'video/x-m4v': { ext: ['.m4v'], docType: 'video' },
  'video/3gpp': { ext: ['.3gp'], docType: 'video' }
};

const EXT_TO_META: Record<string, { docType: 'pdf' | 'notes' | 'diapo' | 'image' | 'audio' | 'video'; mime: string }> = {
  '.jpg': { docType: 'image', mime: 'image/jpeg' },
  '.jpeg': { docType: 'image', mime: 'image/jpeg' },
  '.png': { docType: 'image', mime: 'image/png' },
  '.webp': { docType: 'image', mime: 'image/webp' },
  '.gif': { docType: 'image', mime: 'image/gif' },
  '.svg': { docType: 'image', mime: 'image/svg+xml' },
  '.heic': { docType: 'image', mime: 'image/heic' },
  '.avif': { docType: 'image', mime: 'image/avif' },
  '.pdf': { docType: 'pdf', mime: 'application/pdf' },
  '.doc': { docType: 'notes', mime: 'application/msword' },
  '.docx': { docType: 'notes', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
  '.ppt': { docType: 'diapo', mime: 'application/vnd.ms-powerpoint' },
  '.pptx': { docType: 'diapo', mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' },
  '.xls': { docType: 'notes', mime: 'application/vnd.ms-excel' },
  '.xlsx': { docType: 'notes', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
  '.txt': { docType: 'notes', mime: 'text/plain' },
  '.mp3': { docType: 'audio', mime: 'audio/mpeg' },
  '.wav': { docType: 'audio', mime: 'audio/wav' },
  '.m4a': { docType: 'audio', mime: 'audio/mp4' },
  '.ogg': { docType: 'audio', mime: 'audio/ogg' },
  '.aac': { docType: 'audio', mime: 'audio/aac' },
  '.mp4': { docType: 'video', mime: 'video/mp4' },
  '.webm': { docType: 'video', mime: 'video/webm' },
  '.mov': { docType: 'video', mime: 'video/quicktime' },
  '.m4v': { docType: 'video', mime: 'video/x-m4v' },
  '.3gp': { docType: 'video', mime: 'video/3gpp' }
};

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} Mo`;
};

app.post(
  '/api/admin/upload',
  requireAdmin,
  express.raw({ type: 'application/octet-stream', limit: '100mb' }),
  (req: AuthedRequest, res: Response) => {
    const rawName = decodeURIComponent(String(req.headers['x-file-name'] || 'fichier'));
    const rawMime = String(req.headers['x-mime-type'] || '').toLowerCase();
    const buffer = req.body as Buffer;

    if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
      res.status(400).json({ error: 'Fichier vide ou invalide.' });
      return;
    }

    const ext = path.extname(rawName).toLowerCase();
    const extMeta = EXT_TO_META[ext];
    const mimeMeta = ALLOWED_MIME_MAP[rawMime];

    if (!extMeta && !mimeMeta) {
      res.status(400).json({ error: `Type de fichier non autorisé (${ext || rawMime}).` });
      return;
    }

    const finalExt = extMeta ? ext : mimeMeta.ext[0];
    const docType = extMeta ? extMeta.docType : mimeMeta.docType;
    const finalMime = mimeMeta ? rawMime : extMeta.mime;

    let finalBuffer = buffer;

    // Assainissement SVG contre les scripts XSS embarqués
    if (finalExt === '.svg') {
      const svgText = buffer
        .toString('utf8')
        .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
        .replace(/\son\w+\s*=\s*(['"])[\s\S]*?\1/gi, '')
        .replace(/javascript:/gi, '');
      finalBuffer = Buffer.from(svgText, 'utf8');
    }

    // Vérification basique d'en-tête PDF / JPEG / PNG pour éviter le spoofing
    if (finalExt === '.pdf' && !buffer.subarray(0, 5).toString('ascii').startsWith('%PDF-')) {
      res.status(400).json({ error: 'Le fichier PDF semble corrompu ou invalide.' });
      return;
    }

    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    const safeFileName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${finalExt}`;
    fs.writeFileSync(path.join(UPLOADS_DIR, safeFileName), finalBuffer);

    // Sur Vercel (/tmp éphémère), encoder directement les images raster <= 1,8 Mo en data URL pour garantir l'affichage permanent
    const inlineRasterMime = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(finalMime);
    const resolvedUrl =
      IS_VERCEL && docType === 'image' && inlineRasterMime && finalBuffer.length <= 1.8 * 1024 * 1024
        ? `data:${finalMime};base64,${finalBuffer.toString('base64')}`
        : `/uploads/${safeFileName}`;

    const displayName = sanitizeText(path.basename(rawName, path.extname(rawName)), 120) || 'Fichier';

    res.json({
      url: resolvedUrl,
      name: displayName,
      size: finalBuffer.length,
      formattedSize: formatSize(finalBuffer.length),
      mimeType: finalMime,
      docType
    });
  }
);

app.put('/api/admin/settings', requireAdmin, (req: AuthedRequest, res: Response) => {
  const { churchSettings, heroContent, siteImages, officialLogoUrl } = req.body || {};

  if (churchSettings) {
    store.churchSettings = {
      ...store.churchSettings,
      ...churchSettings,
      logoUrl:
        officialLogoUrl !== undefined
          ? sanitizeSafeUrl(officialLogoUrl) || null
          : churchSettings.logoUrl !== undefined
          ? sanitizeSafeUrl(churchSettings.logoUrl) || null
          : store.churchSettings.logoUrl
    };
  } else if (officialLogoUrl !== undefined) {
    store.churchSettings.logoUrl = sanitizeSafeUrl(officialLogoUrl) || null;
  }

  if (heroContent) {
    store.heroContent = { ...store.heroContent, ...heroContent };
  }

  if (siteImages) {
    store.siteImages = {
      heroImage: siteImages.heroImage !== undefined ? sanitizeSafeUrl(siteImages.heroImage) : store.siteImages.heroImage,
      pastorImage: siteImages.pastorImage !== undefined ? sanitizeSafeUrl(siteImages.pastorImage) : store.siteImages.pastorImage,
      choirImage: siteImages.choirImage !== undefined ? sanitizeSafeUrl(siteImages.choirImage) : store.siteImages.choirImage,
      youthImage: siteImages.youthImage !== undefined ? sanitizeSafeUrl(siteImages.youthImage) : store.siteImages.youthImage
    };
  }

  saveStore(store);
  appendSecurityLog('Mise à jour apparence/paramètres', req.adminUser!.name, 'Paramètres généraux ou visuels modifiés.', 'info');
  res.json({
    churchSettings: store.churchSettings,
    heroContent: store.heroContent,
    siteImages: store.siteImages,
    officialLogoUrl: store.churchSettings.logoUrl
  });
});

// CRUD Cultes
app.post('/api/admin/cultes', requireAdmin, (req: AuthedRequest, res: Response) => {
  const item = req.body;
  if (!item?.title) {
    res.status(400).json({ error: 'Titre requis.' });
    return;
  }
  const nowIso = new Date().toISOString();
  const normalized = {
    ...item,
    date: item.date || nowIso.slice(0, 10),
    publishedAt: item.publishedAt || nowIso,
    serviceType: item.serviceType || 'dimanche'
  };
  store.cultes = [normalized, ...store.cultes];
  runAutomations();
  saveStore(store);
  appendSecurityLog('Nouveau culte créé', req.adminUser!.name, normalized.title, 'info');
  res.json({ cultes: store.cultes });
});

app.put('/api/admin/cultes/:id', requireAdmin, (req: AuthedRequest, res: Response) => {
  store.cultes = store.cultes.map((c) =>
    c.id === req.params.id
      ? {
          ...req.body,
          id: req.params.id,
          publishedAt: req.body?.publishedAt || c.publishedAt || new Date().toISOString()
        }
      : c
  );
  runAutomations();
  saveStore(store);
  appendSecurityLog('Culte modifié', req.adminUser!.name, req.body?.title || req.params.id, 'info');
  res.json({ cultes: store.cultes });
});

app.delete('/api/admin/cultes/:id', requireAdmin, (req: AuthedRequest, res: Response) => {
  store.cultes = store.cultes.filter((c) => c.id !== req.params.id);
  saveStore(store);
  appendSecurityLog('Culte supprimé', req.adminUser!.name, req.params.id, 'warning');
  res.json({ cultes: store.cultes });
});

// CRUD Événements
app.post('/api/admin/events', requireAdmin, (req: AuthedRequest, res: Response) => {
  const item = req.body;
  if (!item?.title) {
    res.status(400).json({ error: 'Titre requis.' });
    return;
  }
  const nowIso = new Date().toISOString();
  const normalized = {
    ...item,
    date: item.date || nowIso.slice(0, 10),
    publishedAt: item.publishedAt || nowIso
  };
  store.events = [normalized, ...store.events];
  saveStore(store);
  appendSecurityLog('Nouvel événement', req.adminUser!.name, normalized.title, 'info');
  res.json({ events: store.events });
});

app.put('/api/admin/events/:id', requireAdmin, (req: AuthedRequest, res: Response) => {
  store.events = store.events.map((e) => (e.id === req.params.id ? { ...req.body, id: req.params.id } : e));
  saveStore(store);
  res.json({ events: store.events });
});

app.delete('/api/admin/events/:id', requireAdmin, (req: AuthedRequest, res: Response) => {
  store.events = store.events.filter((e) => e.id !== req.params.id);
  saveStore(store);
  res.json({ events: store.events });
});

// CRUD Actualités (date & heure de publication automatiques)
app.post('/api/admin/news', requireAdmin, (req: AuthedRequest, res: Response) => {
  const item = req.body;
  if (!item?.title) {
    res.status(400).json({ error: 'Titre requis.' });
    return;
  }
  const nowIso = new Date().toISOString();
  const normalized = {
    ...item,
    date: nowIso.slice(0, 10),
    publishedAt: nowIso
  };
  store.news = [normalized, ...store.news];
  saveStore(store);
  appendSecurityLog('Nouveau communiqué', req.adminUser!.name, normalized.title, 'info');
  res.json({ news: store.news });
});

app.put('/api/admin/news/:id', requireAdmin, (req: AuthedRequest, res: Response) => {
  const nowIso = new Date().toISOString();
  store.news = store.news.map((n) =>
    n.id === req.params.id
      ? {
          ...req.body,
          id: req.params.id,
          date: req.body?.date || n.date || nowIso.slice(0, 10),
          publishedAt: req.body?.publishedAt || n.publishedAt || nowIso
        }
      : n
  );
  saveStore(store);
  res.json({ news: store.news });
});

app.delete('/api/admin/news/:id', requireAdmin, (req: AuthedRequest, res: Response) => {
  store.news = store.news.filter((n) => n.id !== req.params.id);
  saveStore(store);
  res.json({ news: store.news });
});

// CRUD Albums Galerie
app.post('/api/admin/albums', requireAdmin, (req: AuthedRequest, res: Response) => {
  const item = req.body;
  if (!item?.title) {
    res.status(400).json({ error: 'Titre requis.' });
    return;
  }
  const nowIso = new Date().toISOString();
  const normalized = {
    ...item,
    date: item.date || nowIso.slice(0, 10),
    publishedAt: item.publishedAt || nowIso,
    mediaCount: Array.isArray(item.items) ? item.items.length : item.mediaCount || 0
  };
  store.albums = [normalized, ...store.albums];
  saveStore(store);
  appendSecurityLog('Nouvel album galerie', req.adminUser!.name, `${normalized.title} (${normalized.mediaCount} médias)`, 'info');
  res.json({ albums: store.albums });
});

app.put('/api/admin/albums/:id', requireAdmin, (req: AuthedRequest, res: Response) => {
  const item = req.body;
  const normalized = { ...item, id: req.params.id, mediaCount: Array.isArray(item.items) ? item.items.length : item.mediaCount || 0 };
  store.albums = store.albums.map((a) => (a.id === req.params.id ? normalized : a));
  saveStore(store);
  res.json({ albums: store.albums });
});

app.delete('/api/admin/albums/:id', requireAdmin, (req: AuthedRequest, res: Response) => {
  store.albums = store.albums.filter((a) => a.id !== req.params.id);
  saveStore(store);
  res.json({ albums: store.albums });
});

// =====================================================================
// GOOGLE DRIVE MULTI-COMPTES & SYNCHRONISATION VERS LE SITE (ADMIN UNIQUEMENT)
// =====================================================================

app.post('/api/admin/drive/accounts', requireAdmin, (req: AuthedRequest, res: Response) => {
  const email = sanitizeText(req.body?.email, 160).toLowerCase();
  const displayName = sanitizeText(req.body?.displayName, 120) || email;
  const photoLink = sanitizeSafeUrl(req.body?.photoLink) || undefined;
  if (!email || !email.includes('@')) {
    res.status(400).json({ error: 'Adresse e-mail Google valide requise.' });
    return;
  }
  const existing = (store.driveAccounts || []).find((a) => a.email === email);
  const nowIso = new Date().toISOString();
  const updatedAccount = {
    email,
    displayName,
    photoLink,
    addedAt: existing?.addedAt || nowIso,
    lastSyncedAt: existing?.lastSyncedAt
  };
  store.driveAccounts = [
    updatedAccount,
    ...(store.driveAccounts || []).filter((a) => a.email !== email)
  ];
  saveStore(store);
  appendSecurityLog('Compte Google Drive relié', req.adminUser!.name, email, 'info');
  res.json({ driveAccounts: store.driveAccounts });
});

app.delete('/api/admin/drive/accounts/:email', requireAdmin, (req: AuthedRequest, res: Response) => {
  const targetEmail = decodeURIComponent(req.params.email).toLowerCase();
  store.driveAccounts = (store.driveAccounts || []).filter((a) => a.email !== targetEmail);
  saveStore(store);
  appendSecurityLog('Compte Google Drive dissocié', req.adminUser!.name, targetEmail, 'info');
  res.json({ driveAccounts: store.driveAccounts });
});

app.post('/api/admin/drive/import', requireAdmin, async (req: AuthedRequest, res: Response) => {
  const driveToken = String(req.headers['x-google-access-token'] || '').trim();
  if (!driveToken) {
    res.status(401).json({ error: 'Connexion Google Drive requise pour importer depuis Drive.' });
    return;
  }

  const accountEmail = sanitizeText(req.body?.accountEmail, 160).toLowerCase();
  const folderId = sanitizeText(req.body?.folderId, 160);
  const folderName = sanitizeText(req.body?.folderName, 160) || 'Dossier Google Drive';
  const createAlbum = Boolean(req.body?.createAlbum);
  const existingAlbumId = sanitizeText(req.body?.albumId, 120);
  const albumTitle = sanitizeText(req.body?.albumTitle, 160) || folderName;
  const albumCategory = sanitizeText(req.body?.albumCategory, 80) || 'Événements';
  const importKind = sanitizeText(req.body?.importKind, 20) || 'all'; // 'all' | 'media' | 'document'

  let filesToImport: Array<{ id: string; name: string; mimeType?: string; thumbnailLink?: string }> = Array.isArray(req.body?.files)
    ? req.body.files
    : [];

  const isDriveDocSupported = (mime: string, name: string) => {
    const ext = path.extname(name || '').toLowerCase();
    return (
      mime === 'application/pdf' ||
      mime === 'application/msword' ||
      mime.includes('wordprocessingml') ||
      mime.includes('ms-powerpoint') ||
      mime.includes('presentationml') ||
      mime.includes('ms-excel') ||
      mime.includes('spreadsheetml') ||
      mime === 'text/plain' ||
      mime === 'application/vnd.google-apps.document' ||
      mime === 'application/vnd.google-apps.presentation' ||
      mime === 'application/vnd.google-apps.spreadsheet' ||
      ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.txt'].includes(ext)
    );
  };

  const classifyDriveEntry = (
    mimeRaw: string,
    name: string
  ): { kind: 'photo' | 'video' | 'audio' | 'document'; ext: string; docType?: 'pdf' | 'notes' | 'diapo'; isWorkspaceExport?: boolean; finalMime: string } | null => {
    const mime = (mimeRaw || '').toLowerCase();
    const rawExt = path.extname(name || '').toLowerCase();

    if (mime === 'application/vnd.google-apps.document') {
      return { kind: 'document', ext: '.pdf', docType: 'pdf', isWorkspaceExport: true, finalMime: 'application/pdf' };
    }
    if (mime === 'application/vnd.google-apps.presentation') {
      return { kind: 'document', ext: '.pdf', docType: 'diapo', isWorkspaceExport: true, finalMime: 'application/pdf' };
    }
    if (mime === 'application/vnd.google-apps.spreadsheet') {
      return { kind: 'document', ext: '.pdf', docType: 'pdf', isWorkspaceExport: true, finalMime: 'application/pdf' };
    }

    if (mime.startsWith('image/') || ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.heic', '.avif'].includes(rawExt)) {
      let ext = '.jpg';
      let finalMime = mime || 'image/jpeg';
      if (mime.includes('png') || rawExt === '.png') {
        ext = '.png';
        finalMime = 'image/png';
      } else if (mime.includes('webp') || rawExt === '.webp') {
        ext = '.webp';
        finalMime = 'image/webp';
      } else if (mime.includes('gif') || rawExt === '.gif') {
        ext = '.gif';
        finalMime = 'image/gif';
      }
      return { kind: 'photo', ext, finalMime };
    }

    if (mime.startsWith('video/') || ['.mp4', '.webm', '.mov', '.m4v', '.3gp'].includes(rawExt)) {
      let ext = '.mp4';
      if (mime.includes('webm') || rawExt === '.webm') ext = '.webm';
      else if (mime.includes('quicktime') || rawExt === '.mov') ext = '.mov';
      else if (rawExt === '.m4v') ext = '.m4v';
      else if (rawExt === '.3gp') ext = '.3gp';
      return { kind: 'video', ext, finalMime: mime || 'video/mp4' };
    }

    if (mime.startsWith('audio/') || ['.mp3', '.wav', '.m4a', '.ogg', '.aac'].includes(rawExt)) {
      let ext = '.mp3';
      if (mime.includes('wav') || rawExt === '.wav') ext = '.wav';
      else if (mime.includes('mp4') || mime.includes('m4a') || rawExt === '.m4a') ext = '.m4a';
      else if (mime.includes('ogg') || rawExt === '.ogg') ext = '.ogg';
      else if (mime.includes('aac') || rawExt === '.aac') ext = '.aac';
      return { kind: 'audio', ext, finalMime: mime || 'audio/mpeg' };
    }

    if (isDriveDocSupported(mime, name)) {
      let ext = rawExt || '.pdf';
      let docType: 'pdf' | 'notes' | 'diapo' = 'pdf';
      if (mime === 'application/pdf' || rawExt === '.pdf') {
        ext = '.pdf';
        docType = 'pdf';
      } else if (mime.includes('presentation') || mime.includes('powerpoint') || rawExt === '.ppt' || rawExt === '.pptx') {
        ext = rawExt === '.ppt' ? '.ppt' : '.pptx';
        docType = 'diapo';
      } else if (mime.includes('word') || rawExt === '.doc' || rawExt === '.docx') {
        ext = rawExt === '.doc' ? '.doc' : '.docx';
        docType = 'notes';
      } else if (mime.includes('excel') || mime.includes('spreadsheet') || rawExt === '.xls' || rawExt === '.xlsx') {
        ext = rawExt === '.xls' ? '.xls' : '.xlsx';
        docType = 'notes';
      } else if (mime === 'text/plain' || rawExt === '.txt') {
        ext = '.txt';
        docType = 'notes';
      }
      return { kind: 'document', ext, docType, finalMime: mime || 'application/pdf' };
    }

    return null;
  };

  try {
    const listDriveChildren = async (parentId: string) => {
      const q = `'${parentId.replace(/'/g, '')}' in parents and trashed = false`;
      const listUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,mimeType,thumbnailLink,shortcutDetails)&pageSize=100&includeItemsFromAllDrives=true&supportsAllDrives=true`;
      const listRes = await fetch(listUrl, {
        headers: { Authorization: `Bearer ${driveToken}` }
      });
      const listJson = (await listRes.json().catch(() => ({}))) as { files?: any[]; error?: { message?: string } };
      if (!listRes.ok) {
        const err: any = new Error(listJson?.error?.message || 'Erreur lors de la lecture du dossier Google Drive.');
        err.statusCode = listRes.status;
        throw err;
      }
      return (Array.isArray(listJson.files) ? listJson.files : []).map((f) =>
        f.mimeType === 'application/vnd.google-apps.shortcut' && f.shortcutDetails?.targetId
          ? { ...f, id: f.shortcutDetails.targetId, mimeType: f.shortcutDetails.targetMimeType || f.mimeType }
          : f
      );
    };

    // Si un dossier complet est sélectionné sans liste explicite, lister ses fichiers (+ 1 niveau de sous-dossiers si vide directement)
    if (folderId && filesToImport.length === 0) {
      const entries = await listDriveChildren(folderId);
      const subFolders = entries.filter((f) => f.mimeType === 'application/vnd.google-apps.folder');
      const directFiles = entries.filter((f) => f.mimeType !== 'application/vnd.google-apps.folder');
      const collected = [...directFiles];

      if (collected.length === 0 && subFolders.length > 0) {
        for (const sf of subFolders.slice(0, 12)) {
          const nested = await listDriveChildren(sf.id);
          collected.push(...nested.filter((nf) => nf.mimeType !== 'application/vnd.google-apps.folder'));
        }
      }

      filesToImport = collected.filter((f) => {
        const cls = classifyDriveEntry(f.mimeType || '', f.name || '');
        if (!cls) return false;
        if (importKind === 'media') return cls.kind !== 'document';
        if (importKind === 'document') return cls.kind === 'document';
        return true;
      });
    }

    if (filesToImport.length === 0) {
      res.status(400).json({ error: 'Aucun média ou document pris en charge trouvé dans cette sélection Google Drive.' });
      return;
    }

    let targetAlbum =
      (existingAlbumId && store.albums.find((a) => a.id === existingAlbumId)) ||
      (folderId && createAlbum && store.albums.find((a) => a.driveFolderId === folderId)) ||
      null;

    const existingDriveIds = new Set<string>(
      (targetAlbum?.items || []).map((it: any) => it.driveFileId).filter(Boolean)
    );

    const importedMedia: Array<{
      id: string;
      type: 'photo' | 'video' | 'audio';
      url: string;
      fallbackUrl?: string;
      caption: string;
      mimeType: string;
      fileSize: string;
      driveFileId: string;
      driveAccountEmail: string;
    }> = [];

    const importedDocuments: Array<{
      id: string;
      title: string;
      fileSize: string;
      type: 'pdf' | 'notes' | 'diapo';
      downloadUrl: string;
      mimeType: string;
      driveFileId: string;
      driveAccountEmail: string;
    }> = [];

    let skippedCount = 0;
    let failedCount = 0;
    let firstErrorStatus = 0;
    let firstErrorMessage = '';

    fs.mkdirSync(UPLOADS_DIR, { recursive: true });

    for (const df of filesToImport.slice(0, 80)) {
      if (!df?.id) continue;
      const cls = classifyDriveEntry(df.mimeType || '', df.name || '');
      if (!cls) continue;

      if (targetAlbum && cls.kind !== 'document' && existingDriveIds.has(df.id)) {
        skippedCount += 1;
        continue;
      }

      const cleanTitle = sanitizeText(path.basename(df.name || 'Fichier Drive', path.extname(df.name || '')), 120) || 'Fichier';
      const drivePreviewUrl = `https://drive.google.com/file/d/${encodeURIComponent(df.id)}/preview`;

      const fetchUrl = cls.isWorkspaceExport
        ? `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(df.id)}/export?mimeType=application/pdf`
        : `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(df.id)}?alt=media&supportsAllDrives=true`;

      const mediaRes = await fetch(fetchUrl, {
        headers: { Authorization: `Bearer ${driveToken}` }
      });
      if (!mediaRes.ok) {
        failedCount += 1;
        const errPayload = (await mediaRes.json().catch(() => ({}))) as { error?: { message?: string } };
        if (mediaRes.status === 401) {
          res.status(401).json({
            error: 'Session Google Drive expirée. Veuillez cliquer sur « Reconnecter » puis relancer l’importation.'
          });
          return;
        }
        if (!firstErrorStatus) {
          firstErrorStatus = mediaRes.status;
          firstErrorMessage =
            errPayload?.error?.message ||
            (mediaRes.status === 403
              ? 'Autorisation Google Drive refusée : reconnectez le compte et cochez bien la case d’accès à Google Drive.'
              : `Erreur Google Drive (${mediaRes.status})`);
        }
        continue;
      }

      const arrBuf = await mediaRes.arrayBuffer();
      const buf = Buffer.from(arrBuf);
      if (buf.length === 0) {
        failedCount += 1;
        continue;
      }

      // Sur Vercel, si une vidéo Drive dépasse 45 Mo, basculer vers le lecteur Drive intégré
      if (IS_VERCEL && cls.kind === 'video' && buf.length > 45 * 1024 * 1024) {
        importedMedia.push({
          id: `media-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
          type: 'video',
          url: drivePreviewUrl,
          fallbackUrl: drivePreviewUrl,
          caption: cleanTitle,
          mimeType: cls.finalMime,
          fileSize: formatSize(buf.length),
          driveFileId: df.id,
          driveAccountEmail: accountEmail
        });
        continue;
      }

      if (buf.length > 150 * 1024 * 1024) {
        failedCount += 1;
        continue;
      }

      const safeFileName = `drive-${Date.now()}-${crypto.randomBytes(5).toString('hex')}${cls.ext}`;
      fs.writeFileSync(path.join(UPLOADS_DIR, safeFileName), buf);

      let resolvedMediaUrl = `/uploads/${safeFileName}`;

      // Sur Vercel (/tmp éphémère), garantir un affichage permanent des photos importées
      if (IS_VERCEL && cls.kind === 'photo') {
        const inlineAllowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(cls.finalMime);
        if (inlineAllowed && buf.length <= 1.8 * 1024 * 1024) {
          resolvedMediaUrl = `data:${cls.finalMime};base64,${buf.toString('base64')}`;
        } else if (df.thumbnailLink && /^https:\/\//i.test(df.thumbnailLink)) {
          try {
            const hiResThumb = df.thumbnailLink.replace(/=s\d+.*$/, '=s1600');
            const thumbRes = await fetch(hiResThumb, {
              headers: { Authorization: `Bearer ${driveToken}` }
            });
            if (thumbRes.ok) {
              const tBuf = Buffer.from(await thumbRes.arrayBuffer());
              if (tBuf.length > 0 && tBuf.length <= 1.8 * 1024 * 1024) {
                resolvedMediaUrl = `data:image/jpeg;base64,${tBuf.toString('base64')}`;
              }
            }
          } catch {
            // conserver /uploads/... en dernier recours
          }
        }
      }

      const formattedSize = formatSize(buf.length);

      if (cls.kind === 'document') {
        importedDocuments.push({
          id: `doc-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
          title: cleanTitle,
          fileSize: formattedSize,
          type: cls.docType || 'pdf',
          downloadUrl: resolvedMediaUrl,
          mimeType: cls.finalMime,
          driveFileId: df.id,
          driveAccountEmail: accountEmail
        });
      } else {
        importedMedia.push({
          id: `media-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
          type: cls.kind,
          url: resolvedMediaUrl,
          ...(cls.kind === 'video' ? { fallbackUrl: drivePreviewUrl } : {}),
          caption: cleanTitle,
          mimeType: cls.finalMime,
          fileSize: formattedSize,
          driveFileId: df.id,
          driveAccountEmail: accountEmail
        });
      }
    }

    if (importedMedia.length === 0 && importedDocuments.length === 0 && skippedCount === 0) {
      res.status(firstErrorStatus === 403 ? 403 : 400).json({
        error:
          firstErrorMessage ||
          `Aucun des ${failedCount || filesToImport.length} fichier(s) n’a pu être téléchargé depuis Google Drive.`
      });
      return;
    }

    const nowIso = new Date().toISOString();

    if ((createAlbum || targetAlbum) && importedMedia.length > 0) {
      if (targetAlbum) {
        const mergedItems = [...(targetAlbum.items || []), ...importedMedia];
        const hasPhotos = mergedItems.some((m: any) => m.type === 'photo');
        const hasVideos = mergedItems.some((m: any) => m.type === 'video' || m.type === 'audio');
        const nextType = hasPhotos && hasVideos ? 'mixte' : hasVideos ? 'video' : 'photo';
        const firstPhoto = mergedItems.find((m: any) => m.type === 'photo');
        targetAlbum = {
          ...targetAlbum,
          type: nextType,
          items: mergedItems,
          coverImage: targetAlbum.coverImage || firstPhoto?.url || '',
          mediaCount: mergedItems.length,
          driveFolderId: folderId || targetAlbum.driveFolderId,
          driveAccountEmail: accountEmail || targetAlbum.driveAccountEmail
        };
        store.albums = store.albums.map((a) => (a.id === targetAlbum.id ? targetAlbum : a));
      } else {
        const hasPhotos = importedMedia.some((m) => m.type === 'photo');
        const hasVideos = importedMedia.some((m) => m.type === 'video' || m.type === 'audio');
        const albType = hasPhotos && hasVideos ? 'mixte' : hasVideos ? 'video' : 'photo';
        const firstPhoto = importedMedia.find((m) => m.type === 'photo');
        targetAlbum = {
          id: `alb-${Date.now()}`,
          title: albumTitle,
          category: albumCategory,
          type: albType,
          date: nowIso.slice(0, 10),
          publishedAt: nowIso,
          coverImage: firstPhoto?.url || '',
          mediaCount: importedMedia.length,
          items: importedMedia,
          description: `Médias synchronisés depuis Google Drive (${folderName}).`,
          driveFolderId: folderId || undefined,
          driveAccountEmail: accountEmail || undefined
        };
        store.albums = [targetAlbum, ...store.albums];
      }

      if (folderId && targetAlbum) {
        const folderRec = {
          folderId,
          folderName,
          accountEmail,
          albumId: targetAlbum.id,
          albumTitle: targetAlbum.title,
          lastSyncedAt: nowIso,
          photoCount: targetAlbum.mediaCount
        };
        store.driveFolders = [
          folderRec,
          ...(store.driveFolders || []).filter((f) => !(f.folderId === folderId && f.accountEmail === accountEmail))
        ];
      }
    }

    if (accountEmail) {
      store.driveAccounts = (store.driveAccounts || []).map((acc) =>
        acc.email === accountEmail ? { ...acc, lastSyncedAt: nowIso } : acc
      );
    }

    saveStore(store);
    appendSecurityLog(
      'Importation Google Drive',
      req.adminUser!.name,
      `${importedMedia.length} média(s) et ${importedDocuments.length} document(s) importé(s) depuis ${accountEmail || 'Google Drive'} (${folderName})`,
      'info'
    );

    res.json({
      imported: importedMedia,
      importedDocuments,
      skippedCount,
      albums: store.albums,
      driveFolders: store.driveFolders || [],
      driveAccounts: store.driveAccounts || [],
      album: targetAlbum || null
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Erreur lors de la synchronisation Google Drive.' });
  }
});

// CRUD Départements
app.post('/api/admin/departments', requireAdmin, (req: AuthedRequest, res: Response) => {
  const dept = req.body;
  if (!dept?.name) {
    res.status(400).json({ error: 'Nom requis.' });
    return;
  }
  store.departments = [...store.departments, dept];
  saveStore(store);
  appendSecurityLog('Département ajouté', req.adminUser!.name, dept.name, 'info');
  res.json({ departments: store.departments });
});

app.put('/api/admin/departments/:id', requireAdmin, (req: AuthedRequest, res: Response) => {
  store.departments = store.departments.map((d) => (d.id === req.params.id ? { ...req.body, id: req.params.id } : d));
  saveStore(store);
  res.json({ departments: store.departments });
});

app.delete('/api/admin/departments/:id', requireAdmin, (req: AuthedRequest, res: Response) => {
  store.departments = store.departments.filter((d) => d.id !== req.params.id);
  saveStore(store);
  appendSecurityLog('Département supprimé', req.adminUser!.name, req.params.id, 'warning');
  res.json({ departments: store.departments });
});

// Modération commentaires
app.post('/api/admin/comments/:targetType/:targetId/:commentId/keep', requireAdmin, (_req, res) => {
  const { targetType, targetId, commentId } = _req.params;
  const approve = (list: any[]) =>
    list.map((it) =>
      it.id === targetId
        ? { ...it, comments: (it.comments || []).map((c: any) => (c.id === commentId ? { ...c, status: 'approuve', reported: false } : c)) }
        : it
    );
  if (targetType === 'culte') store.cultes = approve(store.cultes);
  else if (targetType === 'evenement') store.events = approve(store.events);
  else if (targetType === 'actualite') store.news = approve(store.news);
  saveStore(store);
  res.json({ cultes: store.cultes, events: store.events, news: store.news });
});

app.delete('/api/admin/comments/:targetType/:targetId/:commentId', requireAdmin, (req: AuthedRequest, res: Response) => {
  const { targetType, targetId, commentId } = req.params;
  const remove = (list: any[]) =>
    list.map((it) => (it.id === targetId ? { ...it, comments: (it.comments || []).filter((c: any) => c.id !== commentId) } : it));
  if (targetType === 'culte') store.cultes = remove(store.cultes);
  else if (targetType === 'evenement') store.events = remove(store.events);
  else if (targetType === 'actualite') store.news = remove(store.news);
  saveStore(store);
  appendSecurityLog('Commentaire retiré', req.adminUser!.name, `${targetType} / ${commentId}`, 'info');
  res.json({ cultes: store.cultes, events: store.events, news: store.news });
});

// Cybersécurité & Gestion des accès
app.put('/api/admin/security', requireAdmin, (req: AuthedRequest, res: Response) => {
  const { secretGateSlug, enableKeyboardShortcut, enableFooterTap, sessionTimeoutMinutes } = req.body || {};
  if (typeof secretGateSlug === 'string' && /^[a-z0-9_-]{4,60}$/i.test(secretGateSlug.trim())) {
    store.security.secretGateSlug = secretGateSlug.trim().toLowerCase();
  }
  if (typeof enableKeyboardShortcut === 'boolean') store.security.enableKeyboardShortcut = enableKeyboardShortcut;
  if (typeof enableFooterTap === 'boolean') store.security.enableFooterTap = enableFooterTap;
  if (typeof sessionTimeoutMinutes === 'number' && sessionTimeoutMinutes >= 15 && sessionTimeoutMinutes <= 1440) {
    store.security.sessionTimeoutMinutes = sessionTimeoutMinutes;
  }
  saveStore(store);
  appendSecurityLog('Paramètres de sécurité mis à jour', req.adminUser!.name, `Portail caché : #/${store.security.secretGateSlug}`, 'info');
  res.json({ security: store.security, securityLogs: store.securityLogs });
});

app.post('/api/admin/invitations', requireAdmin, async (req: AuthedRequest, res: Response) => {
  const email = sanitizeText(req.body?.email, 120).toLowerCase();
  const name = sanitizeText(req.body?.name, 80) || email.split('@')[0];
  const role = sanitizeText(req.body?.role, 80) || 'Administrateur';

  if (!isValidEmail(email)) {
    res.status(400).json({ error: 'Adresse e-mail Google valide requise.' });
    return;
  }

  const nowIso = new Date().toISOString();
  const existingAdmin = store.admins.find((a) => a.identifier.toLowerCase() === email);
  const existingInvite = (store.invitedAdmins || []).find((i) => i.email.toLowerCase() === email);

  if (existingInvite && existingAdmin) {
    existingInvite.name = name;
    existingInvite.role = role;
    existingAdmin.role = role;
    saveStore(store);
    res.json({
      invitedAdmins: store.invitedAdmins.map(toPublicInvitation),
      admins: store.admins.map(toPublicAdmin),
      securityLogs: store.securityLogs,
      inviteCode: '',
      emailSent: false,
      mailtoUrl: ''
    });
    return;
  }

  store.invitedAdmins = (store.invitedAdmins || []).filter((i) => i.email.toLowerCase() !== email);
  store.invitedAdmins.push({
    email,
    name,
    role,
    status: existingAdmin ? 'active' : 'pending',
    invitedBy: req.adminUser!.name,
    invitedAt: nowIso
  });

  const baseUrl = getRequestBaseUrl(req);
  const portalUrl = `${baseUrl}/#/${store.security.secretGateSlug || 'portail-eeadci'}`;
  const subject = 'Accès Administrateur autorisé — EEADCI Anyama Ran-Extension';
  const mailBody = `Bonjour ${name},\n\nVotre adresse Google (${email}) vient d'être autorisée comme administrateur (${role}) du site de l'Église Évangélique des Assemblées de Dieu d'Anyama — Annexe Ran-Extension Résidentiel.\n\nOuvrez le lien suivant et appuyez simplement sur « Continuer avec Google » avec cette adresse :\n${portalUrl}`;

  const emailSent = await sendAdminEmail(email, subject, mailBody);
  const mailtoUrl = buildMailtoUrl(email, subject, mailBody);
  appendSecurityLog(
    'E-mail Google autorisé',
    req.adminUser!.name,
    `${name} (${email}) ajouté à la liste blanche${emailSent ? ' (e-mail envoyé)' : ''}`,
    'info'
  );

  res.json({
    invitedAdmins: store.invitedAdmins.map(toPublicInvitation),
    admins: store.admins.map(toPublicAdmin),
    securityLogs: store.securityLogs,
    inviteCode: '',
    emailSent,
    mailtoUrl
  });
});

app.post('/api/admin/invitations/:email/reset', requireAdmin, async (req: AuthedRequest, res: Response) => {
  const email = sanitizeText(decodeURIComponent(req.params.email || ''), 120).toLowerCase();
  const invite = (store.invitedAdmins || []).find((i) => i.email.toLowerCase() === email);
  if (!invite) {
    res.status(404).json({ error: 'Adresse introuvable dans la liste autorisée.' });
    return;
  }

  const baseUrl = getRequestBaseUrl(req);
  const portalUrl = `${baseUrl}/#/${store.security.secretGateSlug || 'portail-eeadci'}`;
  const subject = 'EEADCI Anyama — Accès Administrateur Google autorisé';
  const body = `Bonjour ${invite.name},\n\nVotre adresse Google (${email}) est autorisée sur l'espace administrateur.\nOuvrez le portail ci-dessous et cliquez sur « Continuer avec Google » avec cette adresse :\n${portalUrl}`;
  const emailSent = await sendAdminEmail(email, subject, body);
  const mailtoUrl = buildMailtoUrl(email, subject, body);
  appendSecurityLog('Notification d’accès envoyée', req.adminUser!.name, email, 'info');

  res.json({
    invitedAdmins: store.invitedAdmins.map(toPublicInvitation),
    securityLogs: store.securityLogs,
    resetCode: '',
    emailSent,
    mailtoUrl
  });
});

app.delete('/api/admin/invitations/:email', requireAdmin, (req: AuthedRequest, res: Response) => {
  const email = sanitizeText(decodeURIComponent(req.params.email || ''), 120).toLowerCase();
  if (email === req.adminUser!.identifier.toLowerCase()) {
    res.status(400).json({ error: 'Impossible de retirer votre propre adresse pendant la session active.' });
    return;
  }
  const activeMatching = store.admins.find((a) => a.identifier.toLowerCase() === email);
  if (activeMatching && store.admins.length <= 1) {
    res.status(400).json({ error: 'Au moins un administrateur doit rester actif.' });
    return;
  }
  store.invitedAdmins = (store.invitedAdmins || []).filter((i) => i.email.toLowerCase() !== email);
  store.admins = store.admins.filter((a) => a.identifier.toLowerCase() !== email);
  appendSecurityLog('Accès administrateur retiré', req.adminUser!.name, email, 'warning');
  res.json({
    invitedAdmins: store.invitedAdmins.map(toPublicInvitation),
    admins: store.admins.map(toPublicAdmin),
    securityLogs: store.securityLogs
  });
});

app.delete('/api/admin/users/:id', requireAdmin, (req: AuthedRequest, res: Response) => {
  if (req.params.id === req.adminUser!.id) {
    res.status(400).json({ error: 'Impossible de supprimer le compte actuellement connecté.' });
    return;
  }
  if (store.admins.length <= 1) {
    res.status(400).json({ error: 'Au moins un administrateur doit rester actif.' });
    return;
  }
  const target = store.admins.find((a) => a.id === req.params.id);
  store.admins = store.admins.filter((a) => a.id !== req.params.id);
  if (target) {
    store.invitedAdmins = (store.invitedAdmins || []).filter(
      (i) => i.email.toLowerCase() !== target.identifier.toLowerCase()
    );
  }
  appendSecurityLog('Administrateur retiré', req.adminUser!.name, target?.identifier || req.params.id, 'warning');
  res.json({
    admins: store.admins.map(toPublicAdmin),
    invitedAdmins: (store.invitedAdmins || []).map(toPublicInvitation),
    securityLogs: store.securityLogs
  });
});

app.post('/api/admin/change-password', requireAdmin, (req: AuthedRequest, res: Response) => {
  const currentPassword = typeof req.body?.currentPassword === 'string' ? req.body.currentPassword : '';
  const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';

  if (!verifyPassword(currentPassword, req.adminUser!.passwordHash, req.adminUser!.salt)) {
    res.status(400).json({ error: 'Mot de passe actuel incorrect.' });
    return;
  }
  if (newPassword.length < 10) {
    res.status(400).json({ error: 'Le nouveau mot de passe doit contenir au moins 10 caractères.' });
    return;
  }
  const { hash, salt } = hashPassword(newPassword);
  req.adminUser!.passwordHash = hash;
  req.adminUser!.salt = salt;
  appendSecurityLog('Mot de passe modifié', req.adminUser!.name, 'Renouvellement de mot de passe réussi.', 'info');
  res.json({ ok: true, securityLogs: store.securityLogs });
});

app.get('/api/admin/backup', requireAdmin, (req: AuthedRequest, res: Response) => {
  appendSecurityLog('Export de sauvegarde', req.adminUser!.name, 'Téléchargement de la sauvegarde JSON complète.', 'info');
  res.setHeader('Content-Disposition', `attachment; filename="sauvegarde-ad-anyama-${new Date().toISOString().slice(0, 10)}.json"`);
  res.json({
    exportedAt: new Date().toISOString(),
    churchSettings: store.churchSettings,
    heroContent: store.heroContent,
    siteImages: store.siteImages,
    cultes: store.cultes,
    events: store.events,
    news: store.news,
    albums: store.albums,
    departments: store.departments
  });
});

// Planificateur automatique toutes les 60 secondes (serveur persistant hors Vercel)
if (!IS_VERCEL) {
  setInterval(() => {
    runAutomations();
  }, 60_000);
}

// --- Montage Vite (Dev) ou Dist (Prod) ---
async function startServer() {
  const httpServer = http.createServer(app);

  if (process.env.NODE_ENV === 'production') {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: { server: httpServer }
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Serveur Église AD Anyama actif sur http://0.0.0.0:${PORT}`);
  });
}

if (!IS_VERCEL) {
  startServer().catch((err) => {
    console.error('Erreur critique au démarrage du serveur:', err);
    process.exit(1);
  });
}

export { app };
export default app;

