import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import {
  DEFAULT_CHURCH_SETTINGS,
  DEFAULT_HERO_CONTENT,
  DEFAULT_SITE_IMAGES,
  INITIAL_DEPARTMENTS
} from '../mockData';
import type {
  AdminInvitation,
  AdminUserPublic,
  AlbumItem,
  ChurchSettings,
  Culte,
  CulteReaction,
  DepartmentItem,
  EventItem,
  HeroContent,
  ItemComment,
  LinkedDriveAccount,
  LinkedDriveFolder,
  MediaItem,
  NewsItem,
  PushNotificationRecord,
  SecurityLogEntry,
  SecuritySettings,
  SiteImages
} from '../types';
import type { AdminBootstrapPayload, PublicBootstrapPayload } from './api';

const BOOTSTRAP_ADMINS: Array<{ email: string; name: string; role: string }> = [
  { email: 'koneelise258@gmail.com', name: 'Élisé Kone', role: 'Administrateur Principal' },
  { email: 'mikeyservice98@gmail.com', name: 'Mikey Service', role: 'Administrateur' }
];

const DEPT_PRIORITY_IDS = ['ecodim', 'aoc', 'hac', 'jadci'];

export function stripUndefined<T>(input: T): T {
  if (Array.isArray(input)) {
    return input.map((v) => stripUndefined(v)) as unknown as T;
  }
  if (input && typeof input === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
      if (v !== undefined) {
        out[k] = stripUndefined(v);
      }
    }
    return out as T;
  }
  return input;
}

export async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function compressDataUrlIfNeeded(url: string, maxChars = 680_000): Promise<string> {
  if (!url || !url.startsWith('data:image/') || url.length <= maxChars || typeof document === 'undefined') {
    return url;
  }
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const maxDim = 1280;
        let w = img.naturalWidth || img.width;
        let h = img.naturalHeight || img.height;
        if (w > maxDim || h > maxDim) {
          const ratio = Math.min(maxDim / w, maxDim / h);
          w = Math.max(1, Math.round(w * ratio));
          h = Math.max(1, Math.round(h * ratio));
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(url);
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        const compressed = canvas.toDataURL('image/jpeg', 0.8);
        resolve(compressed.length < url.length ? compressed : url);
      } catch {
        resolve(url);
      }
    };
    img.onerror = () => resolve(url);
    img.src = url;
  });
}

const sortByDateDesc = <T extends { date?: string; publishedAt?: string }>(items: T[]): T[] => {
  return [...items].sort((a, b) => {
    const ta = new Date(b.publishedAt || b.date || 0).getTime();
    const tb = new Date(a.publishedAt || a.date || 0).getTime();
    return ta - tb;
  });
};

const sortDepartments = (list: DepartmentItem[]): DepartmentItem[] => {
  return [
    ...DEPT_PRIORITY_IDS.map((id) => list.find((d) => d.id === id)).filter((d): d is DepartmentItem => Boolean(d)),
    ...list.filter((d) => !DEPT_PRIORITY_IDS.includes(d.id))
  ];
};

const hydrateAlbumWithItems = async (album: AlbumItem): Promise<AlbumItem> => {
  try {
    const itemsSnap = await getDocs(collection(db, 'albums', album.id, 'items'));
    if (itemsSnap.empty) {
      return {
        ...album,
        items: Array.isArray(album.items) ? album.items : []
      };
    }
    const subItems = itemsSnap.docs
      .map((d) => d.data() as MediaItem & { order?: number })
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map(({ order: _order, ...rest }) => rest as MediaItem);
    return {
      ...album,
      items: subItems,
      mediaCount: subItems.length
    };
  } catch {
    return {
      ...album,
      items: Array.isArray(album.items) ? album.items : []
    };
  }
};

export async function addSecurityLogToFirestore(
  event: string,
  actor: string,
  detail: string,
  severity: 'info' | 'warning' | 'alert' = 'info'
): Promise<SecurityLogEntry> {
  const id = `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const entry: SecurityLogEntry = {
    id,
    timestamp: new Date().toISOString(),
    event: String(event).slice(0, 160),
    actor: String(actor || 'Admin').slice(0, 120),
    detail: String(detail || '').slice(0, 500),
    severity
  };
  try {
    await setDoc(doc(db, 'security_logs', id), entry);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `security_logs/${id}`);
  }
  return entry;
}

export async function verifySecretGateInFirestore(slug: string): Promise<boolean | null> {
  try {
    const metaSnap = await getDoc(doc(db, 'settings', 'meta'));
    if (!metaSnap.exists()) return null;
    const gateHash = String(metaSnap.data()?.gateHash || '');
    if (!gateHash) return null;
    const candidateHash = await sha256Hex(slug.trim().toLowerCase());
    return candidateHash === gateHash;
  } catch {
    return null;
  }
}

export async function checkEmailAuthorizedInFirestore(email: string): Promise<boolean> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return false;
  if (BOOTSTRAP_ADMINS.some((a) => a.email === normalized)) return true;
  try {
    const snap = await getDoc(doc(db, 'authorized_emails', normalized));
    return snap.exists();
  } catch {
    return false;
  }
}

export async function registerCurrentFirebaseAdminInFirestore(fallbackRole?: string): Promise<AdminUserPublic | null> {
  const user = auth.currentUser;
  if (!user || !user.email || !user.emailVerified) return null;

  const emailLower = user.email.toLowerCase();
  const seedMatch = BOOTSTRAP_ADMINS.find((a) => a.email === emailLower);
  const inviteSnap = await getDoc(doc(db, 'authorized_emails', emailLower)).catch(() => null);
  const inviteData = inviteSnap?.exists() ? (inviteSnap.data() as AdminInvitation) : null;

  if (!seedMatch && !inviteData) {
    return null;
  }

  const nowIso = new Date().toISOString();
  const displayName = user.displayName || inviteData?.name || seedMatch?.name || emailLower.split('@')[0];
  const role = inviteData?.role || seedMatch?.role || fallbackRole || 'Administrateur';

  const existingAdminSnap = await getDoc(doc(db, 'admins', user.uid)).catch(() => null);
  const existingData = existingAdminSnap?.exists() ? (existingAdminSnap.data() as AdminUserPublic) : null;

  const adminDoc = stripUndefined({
    uid: user.uid,
    id: user.uid,
    name: displayName,
    identifier: emailLower,
    role,
    createdAt: existingData?.createdAt || nowIso,
    lastLoginAt: nowIso
  });

  try {
    await setDoc(doc(db, 'admins', user.uid), adminDoc, { merge: true });
    await setDoc(
      doc(db, 'authorized_emails', emailLower),
      stripUndefined({
        email: emailLower,
        name: displayName,
        role,
        status: 'active',
        invitedBy: inviteData?.invitedBy || 'Système',
        invitedAt: inviteData?.invitedAt || nowIso,
        registeredAt: inviteData?.registeredAt || nowIso
      }),
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `admins/${user.uid}`);
  }

  return {
    id: adminDoc.id,
    name: adminDoc.name,
    identifier: adminDoc.identifier,
    role: adminDoc.role,
    createdAt: adminDoc.createdAt,
    lastLoginAt: adminDoc.lastLoginAt
  };
}

export async function fetchPublicDataFromFirestore(): Promise<{
  seeded: boolean;
  data: PublicBootstrapPayload;
}> {
  try {
    const [
      churchSnap,
      heroSnap,
      siteImagesSnap,
      metaSnap,
      cultesSnap,
      eventsSnap,
      newsSnap,
      albumsSnap,
      deptsSnap
    ] = await Promise.all([
      getDoc(doc(db, 'settings', 'church')),
      getDoc(doc(db, 'settings', 'hero')),
      getDoc(doc(db, 'settings', 'siteImages')),
      getDoc(doc(db, 'settings', 'meta')),
      getDocs(query(collection(db, 'cultes'), where('status', '==', 'publie'))),
      getDocs(collection(db, 'events')),
      getDocs(collection(db, 'news')),
      getDocs(collection(db, 'albums')),
      getDocs(collection(db, 'departments'))
    ]);

    const seeded =
      metaSnap.exists() ||
      churchSnap.exists() ||
      !cultesSnap.empty ||
      !eventsSnap.empty ||
      !newsSnap.empty ||
      !albumsSnap.empty;

    const churchSettings: ChurchSettings = churchSnap.exists()
      ? {
          ...DEFAULT_CHURCH_SETTINGS,
          ...(churchSnap.data() as Partial<ChurchSettings>),
          theme: {
            ...DEFAULT_CHURCH_SETTINGS.theme!,
            ...((churchSnap.data()?.theme as ChurchSettings['theme']) || {})
          },
          homeSections: {
            ...DEFAULT_CHURCH_SETTINGS.homeSections!,
            ...((churchSnap.data()?.homeSections as ChurchSettings['homeSections']) || {})
          }
        }
      : DEFAULT_CHURCH_SETTINGS;

    const heroContent: HeroContent = heroSnap.exists()
      ? { ...DEFAULT_HERO_CONTENT, ...(heroSnap.data() as Partial<HeroContent>) }
      : DEFAULT_HERO_CONTENT;

    const siteImages: SiteImages = siteImagesSnap.exists()
      ? { ...DEFAULT_SITE_IMAGES, ...(siteImagesSnap.data() as Partial<SiteImages>) }
      : DEFAULT_SITE_IMAGES;

    const cultes = sortByDateDesc(cultesSnap.docs.map((d) => d.data() as Culte));
    const events = sortByDateDesc(eventsSnap.docs.map((d) => d.data() as EventItem));
    const news = sortByDateDesc(newsSnap.docs.map((d) => d.data() as NewsItem));
    const rawAlbums = sortByDateDesc(albumsSnap.docs.map((d) => d.data() as AlbumItem));
    const albums = await Promise.all(rawAlbums.map(hydrateAlbumWithItems));

    const departments = !deptsSnap.empty
      ? sortDepartments(deptsSnap.docs.map((d) => d.data() as DepartmentItem))
      : INITIAL_DEPARTMENTS;

    return {
      seeded,
      data: {
        churchSettings,
        heroContent,
        siteImages,
        officialLogoUrl: churchSettings.logoUrl ?? null,
        cultes,
        events,
        news,
        albums,
        departments
      }
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'public_bootstrap');
  }
}

export async function ensureFirestoreSeeded(fallbackSeed?: Partial<AdminBootstrapPayload>): Promise<void> {
  if (!auth.currentUser) return;
  const metaSnap = await getDoc(doc(db, 'settings', 'meta')).catch(() => null);
  const nowIso = new Date().toISOString();

  // Toujours garantir les adresses d'amorçage dans authorized_emails
  for (const seed of BOOTSTRAP_ADMINS) {
    const ref = doc(db, 'authorized_emails', seed.email);
    const snap = await getDoc(ref).catch(() => null);
    if (!snap?.exists()) {
      await setDoc(
        ref,
        {
          email: seed.email,
          name: seed.name,
          role: seed.role,
          status: 'pending',
          invitedBy: 'Système',
          invitedAt: nowIso
        },
        { merge: true }
      ).catch(() => {});
    }
  }

  if (metaSnap?.exists() && metaSnap.data()?.seeded) {
    return;
  }

  const batch = writeBatch(db);
  batch.set(doc(db, 'test', 'connection'), { ok: true, updatedAt: nowIso }, { merge: true });

  const church = stripUndefined({ ...DEFAULT_CHURCH_SETTINGS, ...(fallbackSeed?.churchSettings || {}) });
  if (fallbackSeed?.officialLogoUrl !== undefined) {
    church.logoUrl = fallbackSeed.officialLogoUrl;
  }
  const hero = stripUndefined({ ...DEFAULT_HERO_CONTENT, ...(fallbackSeed?.heroContent || {}) });
  const siteImgs = stripUndefined({ ...DEFAULT_SITE_IMAGES, ...(fallbackSeed?.siteImages || {}) });

  const secSlug = fallbackSeed?.security?.secretGateSlug || 'portail-eeadci';
  const gateHash = await sha256Hex(secSlug.toLowerCase());

  batch.set(doc(db, 'settings', 'church'), church);
  batch.set(doc(db, 'settings', 'hero'), hero);
  batch.set(doc(db, 'settings', 'siteImages'), siteImgs);
  batch.set(doc(db, 'settings', 'meta'), { seeded: true, gateHash, updatedAt: nowIso });
  batch.set(
    doc(db, 'security_config', 'gate'),
    stripUndefined({
      secretGateSlug: secSlug,
      enableKeyboardShortcut: fallbackSeed?.security?.enableKeyboardShortcut ?? true,
      enableFooterTap: fallbackSeed?.security?.enableFooterTap ?? true,
      sessionTimeoutMinutes: fallbackSeed?.security?.sessionTimeoutMinutes ?? 120,
      updatedAt: nowIso
    })
  );

  const existingDeptsSnap = await getDocs(collection(db, 'departments')).catch(() => null);
  if (!existingDeptsSnap || existingDeptsSnap.empty) {
    const depts = fallbackSeed?.departments?.length ? fallbackSeed.departments : INITIAL_DEPARTMENTS;
    for (const dept of depts) {
      batch.set(doc(db, 'departments', dept.id), stripUndefined(dept));
    }
  }

  await batch.commit().catch((err) => handleFirestoreError(err, OperationType.WRITE, 'initial_seed'));

  // Migrer d'éventuelles publications déjà en store local
  if (fallbackSeed?.cultes?.length) {
    for (const c of fallbackSeed.cultes) {
      await saveCulteToFirestore(c).catch(() => {});
    }
  }
  if (fallbackSeed?.events?.length) {
    for (const ev of fallbackSeed.events) {
      await saveEventToFirestore(ev).catch(() => {});
    }
  }
  if (fallbackSeed?.news?.length) {
    for (const n of fallbackSeed.news) {
      await saveNewsToFirestore(n).catch(() => {});
    }
  }
  if (fallbackSeed?.albums?.length) {
    for (const a of fallbackSeed.albums) {
      await saveAlbumToFirestore(a).catch(() => {});
    }
  }
}

export async function fetchAdminBootstrapFromFirestore(
  fallbackSeed?: Partial<AdminBootstrapPayload>
): Promise<AdminBootstrapPayload> {
  await ensureFirestoreSeeded(fallbackSeed);
  await registerCurrentFirebaseAdminInFirestore();

  try {
    const [
      churchSnap,
      heroSnap,
      siteImagesSnap,
      gateSnap,
      cultesSnap,
      eventsSnap,
      newsSnap,
      albumsSnap,
      deptsSnap,
      adminsSnap,
      invitesSnap,
      logsSnap,
      driveAccSnap,
      driveFoldSnap,
      pushSubsSnap,
      pushHistSnap
    ] = await Promise.all([
      getDoc(doc(db, 'settings', 'church')),
      getDoc(doc(db, 'settings', 'hero')),
      getDoc(doc(db, 'settings', 'siteImages')),
      getDoc(doc(db, 'security_config', 'gate')),
      getDocs(collection(db, 'cultes')),
      getDocs(collection(db, 'events')),
      getDocs(collection(db, 'news')),
      getDocs(collection(db, 'albums')),
      getDocs(collection(db, 'departments')),
      getDocs(collection(db, 'admins')),
      getDocs(collection(db, 'authorized_emails')),
      getDocs(query(collection(db, 'security_logs'), orderBy('timestamp', 'desc'), limit(100))),
      getDocs(collection(db, 'drive_accounts')),
      getDocs(collection(db, 'drive_folders')),
      getDocs(collection(db, 'push_subscriptions')),
      getDocs(query(collection(db, 'push_history'), orderBy('sentAt', 'desc'), limit(30)))
    ]);

    const churchSettings: ChurchSettings = churchSnap.exists()
      ? { ...DEFAULT_CHURCH_SETTINGS, ...(churchSnap.data() as Partial<ChurchSettings>) }
      : DEFAULT_CHURCH_SETTINGS;
    const heroContent: HeroContent = heroSnap.exists()
      ? { ...DEFAULT_HERO_CONTENT, ...(heroSnap.data() as Partial<HeroContent>) }
      : DEFAULT_HERO_CONTENT;
    const siteImages: SiteImages = siteImagesSnap.exists()
      ? { ...DEFAULT_SITE_IMAGES, ...(siteImagesSnap.data() as Partial<SiteImages>) }
      : DEFAULT_SITE_IMAGES;

    const security: SecuritySettings = gateSnap.exists()
      ? {
          secretGateSlug: String(gateSnap.data()?.secretGateSlug || 'portail-eeadci'),
          enableKeyboardShortcut: gateSnap.data()?.enableKeyboardShortcut ?? true,
          enableFooterTap: gateSnap.data()?.enableFooterTap ?? true,
          sessionTimeoutMinutes: Number(gateSnap.data()?.sessionTimeoutMinutes || 120)
        }
      : {
          secretGateSlug: 'portail-eeadci',
          enableKeyboardShortcut: true,
          enableFooterTap: true,
          sessionTimeoutMinutes: 120
        };

    const rawAlbums = sortByDateDesc(albumsSnap.docs.map((d) => d.data() as AlbumItem));
    const albums = await Promise.all(rawAlbums.map(hydrateAlbumWithItems));

    return {
      churchSettings,
      heroContent,
      siteImages,
      officialLogoUrl: churchSettings.logoUrl ?? null,
      cultes: sortByDateDesc(cultesSnap.docs.map((d) => d.data() as Culte)),
      events: sortByDateDesc(eventsSnap.docs.map((d) => d.data() as EventItem)),
      news: sortByDateDesc(newsSnap.docs.map((d) => d.data() as NewsItem)),
      albums,
      departments: !deptsSnap.empty
        ? sortDepartments(deptsSnap.docs.map((d) => d.data() as DepartmentItem))
        : INITIAL_DEPARTMENTS,
      admins: adminsSnap.docs.map((d) => {
        const data = d.data() as AdminUserPublic & { uid?: string };
        return {
          id: data.id || d.id,
          name: data.name,
          identifier: data.identifier,
          role: data.role,
          createdAt: data.createdAt,
          lastLoginAt: data.lastLoginAt
        };
      }),
      invitedAdmins: invitesSnap.docs.map((d) => d.data() as AdminInvitation),
      security,
      securityLogs: logsSnap.docs.map((d) => d.data() as SecurityLogEntry),
      pushSubscribersCount: pushSubsSnap.size,
      pushHistory: pushHistSnap.docs.map((d) => d.data() as PushNotificationRecord),
      driveAccounts: driveAccSnap.docs.map((d) => d.data() as LinkedDriveAccount),
      driveFolders: driveFoldSnap.docs.map((d) => d.data() as LinkedDriveFolder)
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'admin_bootstrap');
  }
}

// ==================== SETTINGS ====================

export async function updateSettingsInFirestore(payload: {
  churchSettings?: Partial<ChurchSettings>;
  heroContent?: HeroContent;
  siteImages?: SiteImages;
  officialLogoUrl?: string | null;
}): Promise<{
  churchSettings: ChurchSettings;
  heroContent: HeroContent;
  siteImages: SiteImages;
  officialLogoUrl: string | null;
}> {
  const [churchSnap, heroSnap, siteSnap] = await Promise.all([
    getDoc(doc(db, 'settings', 'church')),
    getDoc(doc(db, 'settings', 'hero')),
    getDoc(doc(db, 'settings', 'siteImages'))
  ]);

  let nextChurch: ChurchSettings = {
    ...DEFAULT_CHURCH_SETTINGS,
    ...(churchSnap.exists() ? (churchSnap.data() as Partial<ChurchSettings>) : {}),
    ...(payload.churchSettings || {})
  };
  if (payload.officialLogoUrl !== undefined) {
    nextChurch.logoUrl = payload.officialLogoUrl
      ? await compressDataUrlIfNeeded(payload.officialLogoUrl, 450_000)
      : null;
  } else if (nextChurch.logoUrl) {
    nextChurch.logoUrl = await compressDataUrlIfNeeded(nextChurch.logoUrl, 450_000);
  }

  const nextHero: HeroContent = {
    ...DEFAULT_HERO_CONTENT,
    ...(heroSnap.exists() ? (heroSnap.data() as Partial<HeroContent>) : {}),
    ...(payload.heroContent || {})
  };

  const rawSite: SiteImages = {
    ...DEFAULT_SITE_IMAGES,
    ...(siteSnap.exists() ? (siteSnap.data() as Partial<SiteImages>) : {}),
    ...(payload.siteImages || {})
  };
  const nextSite: SiteImages = {
    heroImage: await compressDataUrlIfNeeded(rawSite.heroImage || '', 450_000),
    pastorImage: await compressDataUrlIfNeeded(rawSite.pastorImage || '', 300_000),
    choirImage: await compressDataUrlIfNeeded(rawSite.choirImage || '', 300_000),
    youthImage: await compressDataUrlIfNeeded(rawSite.youthImage || '', 300_000)
  };

  try {
    await Promise.all([
      setDoc(doc(db, 'settings', 'church'), stripUndefined(nextChurch)),
      setDoc(doc(db, 'settings', 'hero'), stripUndefined(nextHero)),
      setDoc(doc(db, 'settings', 'siteImages'), stripUndefined(nextSite))
    ]);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'settings');
  }

  return {
    churchSettings: nextChurch,
    heroContent: nextHero,
    siteImages: nextSite,
    officialLogoUrl: nextChurch.logoUrl ?? null
  };
}

// ==================== CULTES ====================

export async function saveCulteToFirestore(culte: Culte): Promise<Culte[]> {
  const nowIso = new Date().toISOString();
  const compactCover = culte.coverImage ? await compressDataUrlIfNeeded(culte.coverImage, 420_000) : '';
  const compactPhotos = await Promise.all((culte.photos || []).slice(0, 20).map((p) => compressDataUrlIfNeeded(p, 320_000)));
  const compactMediaItems = await Promise.all(
    (culte.mediaItems || []).slice(0, 30).map(async (m) => ({
      ...m,
      url: m.type === 'photo' ? await compressDataUrlIfNeeded(m.url, 320_000) : m.url
    }))
  );

  const normalized: Culte = stripUndefined({
    ...culte,
    date: culte.date || nowIso.slice(0, 10),
    publishedAt: culte.publishedAt || nowIso,
    serviceType: culte.serviceType || 'dimanche',
    coverImage: compactCover,
    photos: compactPhotos,
    mediaItems: compactMediaItems,
    reactions: culte.reactions || { likes: 0, hearts: 0, prayers: 0 },
    comments: culte.comments || []
  });

  try {
    await setDoc(doc(db, 'cultes', normalized.id), normalized);
    const snap = await getDocs(collection(db, 'cultes'));
    return sortByDateDesc(snap.docs.map((d) => d.data() as Culte));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `cultes/${normalized.id}`);
  }
}

export async function deleteCulteFromFirestore(id: string): Promise<Culte[]> {
  try {
    await deleteDoc(doc(db, 'cultes', id));
    const snap = await getDocs(collection(db, 'cultes'));
    return sortByDateDesc(snap.docs.map((d) => d.data() as Culte));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `cultes/${id}`);
  }
}

// ==================== EVENTS ====================

export async function saveEventToFirestore(ev: EventItem): Promise<EventItem[]> {
  const nowIso = new Date().toISOString();
  const compactCover = ev.coverImage ? await compressDataUrlIfNeeded(ev.coverImage, 420_000) : '';
  const compactMediaItems = await Promise.all(
    (ev.mediaItems || []).slice(0, 30).map(async (m) => ({
      ...m,
      url: m.type === 'photo' ? await compressDataUrlIfNeeded(m.url, 320_000) : m.url
    }))
  );
  const normalized: EventItem = stripUndefined({
    ...ev,
    date: ev.date || nowIso.slice(0, 10),
    publishedAt: ev.publishedAt || nowIso,
    coverImage: compactCover,
    mediaItems: compactMediaItems,
    attendeesCount: ev.attendeesCount || 0,
    likes: ev.likes || 0,
    comments: ev.comments || []
  });

  try {
    await setDoc(doc(db, 'events', normalized.id), normalized);
    const snap = await getDocs(collection(db, 'events'));
    return sortByDateDesc(snap.docs.map((d) => d.data() as EventItem));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `events/${normalized.id}`);
  }
}

export async function deleteEventFromFirestore(id: string): Promise<EventItem[]> {
  try {
    await deleteDoc(doc(db, 'events', id));
    const snap = await getDocs(collection(db, 'events'));
    return sortByDateDesc(snap.docs.map((d) => d.data() as EventItem));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `events/${id}`);
  }
}

// ==================== NEWS ====================

export async function saveNewsToFirestore(item: NewsItem): Promise<NewsItem[]> {
  const nowIso = new Date().toISOString();
  const compactCover = item.coverImage ? await compressDataUrlIfNeeded(item.coverImage, 420_000) : '';
  const compactMediaItems = await Promise.all(
    (item.mediaItems || []).slice(0, 30).map(async (m) => ({
      ...m,
      url: m.type === 'photo' ? await compressDataUrlIfNeeded(m.url, 320_000) : m.url
    }))
  );
  const normalized: NewsItem = stripUndefined({
    ...item,
    date: item.date || nowIso.slice(0, 10),
    publishedAt: item.publishedAt || nowIso,
    coverImage: compactCover,
    mediaItems: compactMediaItems,
    readsCount: item.readsCount || 0,
    likes: item.likes || 0,
    comments: item.comments || []
  });

  try {
    await setDoc(doc(db, 'news', normalized.id), normalized);
    const snap = await getDocs(collection(db, 'news'));
    return sortByDateDesc(snap.docs.map((d) => d.data() as NewsItem));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `news/${normalized.id}`);
  }
}

export async function deleteNewsFromFirestore(id: string): Promise<NewsItem[]> {
  try {
    await deleteDoc(doc(db, 'news', id));
    const snap = await getDocs(collection(db, 'news'));
    return sortByDateDesc(snap.docs.map((d) => d.data() as NewsItem));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `news/${id}`);
  }
}

// ==================== ALBUMS (avec sous-collection items) ====================

export async function saveAlbumToFirestore(album: AlbumItem): Promise<AlbumItem[]> {
  const nowIso = new Date().toISOString();
  const preparedItems: MediaItem[] = await Promise.all(
    (album.items || []).map(async (it) => ({
      ...it,
      url: it.type === 'photo' ? await compressDataUrlIfNeeded(it.url, 650_000) : it.url
    }))
  );

  let coverImage = album.coverImage || '';
  if (coverImage.startsWith('data:image/')) {
    coverImage = await compressDataUrlIfNeeded(coverImage, 420_000);
  } else if (!coverImage) {
    const firstPhoto = preparedItems.find((i) => i.type === 'photo');
    if (firstPhoto) {
      coverImage = await compressDataUrlIfNeeded(firstPhoto.url, 420_000);
    }
  }

  // Conserver dans le doc parent uniquement des métadonnées légères (les médias complets vivent dans albums/{id}/items/{itemId})
  const parentDoc: AlbumItem = stripUndefined({
    ...album,
    date: album.date || nowIso.slice(0, 10),
    publishedAt: album.publishedAt || nowIso,
    coverImage,
    mediaCount: preparedItems.length,
    items: []
  });

  try {
    await setDoc(doc(db, 'albums', album.id), parentDoc);

    const existingItemsSnap = await getDocs(collection(db, 'albums', album.id, 'items'));
    const nextIds = new Set(preparedItems.map((it) => it.id));
    const batch = writeBatch(db);

    for (const oldDoc of existingItemsSnap.docs) {
      if (!nextIds.has(oldDoc.id)) {
        batch.delete(oldDoc.ref);
      }
    }

    preparedItems.forEach((item, index) => {
      batch.set(
        doc(db, 'albums', album.id, 'items', item.id),
        stripUndefined({ ...item, order: index })
      );
    });

    await batch.commit();

    const albumsSnap = await getDocs(collection(db, 'albums'));
    const rawAlbums = sortByDateDesc(albumsSnap.docs.map((d) => d.data() as AlbumItem));
    return Promise.all(rawAlbums.map(hydrateAlbumWithItems));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `albums/${album.id}`);
  }
}

export async function deleteAlbumFromFirestore(id: string): Promise<AlbumItem[]> {
  try {
    const itemsSnap = await getDocs(collection(db, 'albums', id, 'items'));
    if (!itemsSnap.empty) {
      const batch = writeBatch(db);
      itemsSnap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
    await deleteDoc(doc(db, 'albums', id));
    const albumsSnap = await getDocs(collection(db, 'albums'));
    const rawAlbums = sortByDateDesc(albumsSnap.docs.map((d) => d.data() as AlbumItem));
    return Promise.all(rawAlbums.map(hydrateAlbumWithItems));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `albums/${id}`);
  }
}

// ==================== DEPARTMENTS ====================

export async function saveDepartmentToFirestore(dept: DepartmentItem): Promise<DepartmentItem[]> {
  const normalized: DepartmentItem = stripUndefined({
    ...dept,
    coverImage: dept.coverImage ? await compressDataUrlIfNeeded(dept.coverImage, 420_000) : '',
    logoUrl: dept.logoUrl ? await compressDataUrlIfNeeded(dept.logoUrl, 320_000) : undefined,
    galleryImages: await Promise.all(
      (dept.galleryImages || []).slice(0, 12).map((g) => compressDataUrlIfNeeded(g, 280_000))
    )
  });

  try {
    await setDoc(doc(db, 'departments', normalized.id), normalized);
    const snap = await getDocs(collection(db, 'departments'));
    return sortDepartments(snap.docs.map((d) => d.data() as DepartmentItem));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `departments/${normalized.id}`);
  }
}

export async function deleteDepartmentFromFirestore(id: string): Promise<DepartmentItem[]> {
  try {
    await deleteDoc(doc(db, 'departments', id));
    const snap = await getDocs(collection(db, 'departments'));
    return sortDepartments(snap.docs.map((d) => d.data() as DepartmentItem));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `departments/${id}`);
  }
}

// ==================== SECURITY, ADMINS & INVITATIONS ====================

export async function updateSecurityInFirestore(
  settings: Partial<SecuritySettings>
): Promise<{ security: SecuritySettings; securityLogs: SecurityLogEntry[] }> {
  try {
    const gateSnap = await getDoc(doc(db, 'security_config', 'gate'));
    const current = (gateSnap.exists() ? gateSnap.data() : {}) as Partial<SecuritySettings>;
    const next: SecuritySettings = {
      secretGateSlug:
        typeof settings.secretGateSlug === 'string' && /^[a-z0-9_-]{4,60}$/i.test(settings.secretGateSlug.trim())
          ? settings.secretGateSlug.trim().toLowerCase()
          : current.secretGateSlug || 'portail-eeadci',
      enableKeyboardShortcut: settings.enableKeyboardShortcut ?? current.enableKeyboardShortcut ?? true,
      enableFooterTap: settings.enableFooterTap ?? current.enableFooterTap ?? true,
      sessionTimeoutMinutes:
        typeof settings.sessionTimeoutMinutes === 'number' &&
        settings.sessionTimeoutMinutes >= 15 &&
        settings.sessionTimeoutMinutes <= 1440
          ? settings.sessionTimeoutMinutes
          : current.sessionTimeoutMinutes || 120
    };

    const gateHash = await sha256Hex(next.secretGateSlug);
    await Promise.all([
      setDoc(doc(db, 'security_config', 'gate'), { ...next, updatedAt: new Date().toISOString() }),
      setDoc(doc(db, 'settings', 'meta'), { gateHash, updatedAt: new Date().toISOString() }, { merge: true })
    ]);

    await addSecurityLogToFirestore(
      'Paramètres de sécurité mis à jour',
      auth.currentUser?.displayName || auth.currentUser?.email || 'Admin',
      `Portail caché : #/${next.secretGateSlug}`,
      'info'
    );

    const logsSnap = await getDocs(query(collection(db, 'security_logs'), orderBy('timestamp', 'desc'), limit(100)));
    return {
      security: next,
      securityLogs: logsSnap.docs.map((d) => d.data() as SecurityLogEntry)
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'security_config/gate');
  }
}

export async function inviteAdminInFirestore(payload: {
  email: string;
  name: string;
  role: string;
}): Promise<{
  invitedAdmins: AdminInvitation[];
  admins: AdminUserPublic[];
  securityLogs: SecurityLogEntry[];
}> {
  const emailLower = payload.email.trim().toLowerCase();
  const cleanName = payload.name.trim() || emailLower.split('@')[0];
  const cleanRole = payload.role.trim() || 'Administrateur';
  const nowIso = new Date().toISOString();

  try {
    const existingSnap = await getDoc(doc(db, 'authorized_emails', emailLower));
    const existing = existingSnap.exists() ? (existingSnap.data() as AdminInvitation) : null;
    await setDoc(
      doc(db, 'authorized_emails', emailLower),
      stripUndefined({
        email: emailLower,
        name: cleanName,
        role: cleanRole,
        status: existing?.status === 'active' ? 'active' : 'pending',
        invitedBy: auth.currentUser?.displayName || auth.currentUser?.email || 'Administrateur',
        invitedAt: existing?.invitedAt || nowIso,
        registeredAt: existing?.registeredAt
      })
    );

    await addSecurityLogToFirestore(
      'E-mail Google autorisé',
      auth.currentUser?.displayName || 'Administrateur',
      `${cleanName} (${emailLower}) ajouté à la liste blanche`,
      'info'
    );

    const [invSnap, admSnap, logsSnap] = await Promise.all([
      getDocs(collection(db, 'authorized_emails')),
      getDocs(collection(db, 'admins')),
      getDocs(query(collection(db, 'security_logs'), orderBy('timestamp', 'desc'), limit(100)))
    ]);

    return {
      invitedAdmins: invSnap.docs.map((d) => d.data() as AdminInvitation),
      admins: admSnap.docs.map((d) => d.data() as AdminUserPublic),
      securityLogs: logsSnap.docs.map((d) => d.data() as SecurityLogEntry)
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `authorized_emails/${emailLower}`);
  }
}

export async function removeAdminInvitationFromFirestore(email: string): Promise<{
  invitedAdmins: AdminInvitation[];
  admins: AdminUserPublic[];
  securityLogs: SecurityLogEntry[];
}> {
  const emailLower = email.trim().toLowerCase();
  try {
    await deleteDoc(doc(db, 'authorized_emails', emailLower));
    const admSnapBefore = await getDocs(collection(db, 'admins'));
    for (const d of admSnapBefore.docs) {
      const data = d.data() as AdminUserPublic;
      if (data.identifier?.toLowerCase() === emailLower && d.id !== auth.currentUser?.uid) {
        await deleteDoc(d.ref);
      }
    }

    await addSecurityLogToFirestore(
      'Accès administrateur retiré',
      auth.currentUser?.displayName || 'Administrateur',
      emailLower,
      'warning'
    );

    const [invSnap, admSnap, logsSnap] = await Promise.all([
      getDocs(collection(db, 'authorized_emails')),
      getDocs(collection(db, 'admins')),
      getDocs(query(collection(db, 'security_logs'), orderBy('timestamp', 'desc'), limit(100)))
    ]);

    return {
      invitedAdmins: invSnap.docs.map((d) => d.data() as AdminInvitation),
      admins: admSnap.docs.map((d) => d.data() as AdminUserPublic),
      securityLogs: logsSnap.docs.map((d) => d.data() as SecurityLogEntry)
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `authorized_emails/${emailLower}`);
  }
}

export async function deleteAdminUserFromFirestore(id: string): Promise<{
  admins: AdminUserPublic[];
  invitedAdmins: AdminInvitation[];
  securityLogs: SecurityLogEntry[];
}> {
  try {
    const targetSnap = await getDoc(doc(db, 'admins', id));
    const targetData = targetSnap.exists() ? (targetSnap.data() as AdminUserPublic) : null;
    await deleteDoc(doc(db, 'admins', id));
    if (targetData?.identifier) {
      await deleteDoc(doc(db, 'authorized_emails', targetData.identifier.toLowerCase())).catch(() => {});
    }

    await addSecurityLogToFirestore(
      'Administrateur retiré',
      auth.currentUser?.displayName || 'Administrateur',
      targetData?.identifier || id,
      'warning'
    );

    const [invSnap, admSnap, logsSnap] = await Promise.all([
      getDocs(collection(db, 'authorized_emails')),
      getDocs(collection(db, 'admins')),
      getDocs(query(collection(db, 'security_logs'), orderBy('timestamp', 'desc'), limit(100)))
    ]);

    return {
      admins: admSnap.docs.map((d) => d.data() as AdminUserPublic),
      invitedAdmins: invSnap.docs.map((d) => d.data() as AdminInvitation),
      securityLogs: logsSnap.docs.map((d) => d.data() as SecurityLogEntry)
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `admins/${id}`);
  }
}

// ==================== COMMENTS MODERATION ====================

export async function moderateCommentInFirestore(
  action: 'keep' | 'remove',
  targetType: 'culte' | 'evenement' | 'actualite',
  targetId: string,
  commentId: string
): Promise<{ cultes: Culte[]; events: EventItem[]; news: NewsItem[] }> {
  const colName = targetType === 'culte' ? 'cultes' : targetType === 'evenement' ? 'events' : 'news';
  const ref = doc(db, colName, targetId);
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const currentComments: ItemComment[] = Array.isArray(snap.data()?.comments) ? snap.data().comments : [];
      const nextComments =
        action === 'keep'
          ? currentComments.map((c) => (c.id === commentId ? { ...c, status: 'approuve', reported: false } : c))
          : currentComments.filter((c) => c.id !== commentId);
      await updateDoc(ref, { comments: stripUndefined(nextComments) });
    }
    const [cultesSnap, eventsSnap, newsSnap] = await Promise.all([
      getDocs(collection(db, 'cultes')),
      getDocs(collection(db, 'events')),
      getDocs(collection(db, 'news'))
    ]);
    return {
      cultes: sortByDateDesc(cultesSnap.docs.map((d) => d.data() as Culte)),
      events: sortByDateDesc(eventsSnap.docs.map((d) => d.data() as EventItem)),
      news: sortByDateDesc(newsSnap.docs.map((d) => d.data() as NewsItem))
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${colName}/${targetId}`);
  }
}

// ==================== GOOGLE DRIVE METADATA ====================

export async function saveDriveAccountToFirestore(payload: {
  email: string;
  displayName: string;
  photoLink?: string;
}): Promise<LinkedDriveAccount[]> {
  const emailLower = payload.email.trim().toLowerCase();
  const existingSnap = await getDoc(doc(db, 'drive_accounts', emailLower)).catch(() => null);
  const existing = existingSnap?.exists() ? (existingSnap.data() as LinkedDriveAccount) : null;
  const record: LinkedDriveAccount = stripUndefined({
    email: emailLower,
    displayName: payload.displayName.trim() || emailLower,
    photoLink: payload.photoLink,
    addedAt: existing?.addedAt || new Date().toISOString(),
    lastSyncedAt: existing?.lastSyncedAt
  });
  try {
    await setDoc(doc(db, 'drive_accounts', emailLower), record);
    const snap = await getDocs(collection(db, 'drive_accounts'));
    return snap.docs.map((d) => d.data() as LinkedDriveAccount);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `drive_accounts/${emailLower}`);
  }
}

export async function removeDriveAccountFromFirestore(email: string): Promise<LinkedDriveAccount[]> {
  const emailLower = email.trim().toLowerCase();
  try {
    await deleteDoc(doc(db, 'drive_accounts', emailLower));
    const snap = await getDocs(collection(db, 'drive_accounts'));
    return snap.docs.map((d) => d.data() as LinkedDriveAccount);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `drive_accounts/${emailLower}`);
  }
}

export async function syncDriveImportResultsToFirestore(params: {
  accountEmail?: string;
  album: AlbumItem | null;
  driveFolders: LinkedDriveFolder[];
}): Promise<{
  albums: AlbumItem[];
  driveFolders: LinkedDriveFolder[];
  driveAccounts: LinkedDriveAccount[];
}> {
  const nowIso = new Date().toISOString();
  try {
    if (params.album) {
      await saveAlbumToFirestore(params.album);
    }

    for (const f of params.driveFolders || []) {
      const folderKey = `${f.accountEmail.toLowerCase()}__${f.folderId}`.replace(/[^a-zA-Z0-9._@+-]/g, '_');
      await setDoc(doc(db, 'drive_folders', folderKey), stripUndefined({ ...f, id: folderKey }));
    }

    if (params.accountEmail) {
      const emailLower = params.accountEmail.toLowerCase();
      const accSnap = await getDoc(doc(db, 'drive_accounts', emailLower));
      if (accSnap.exists()) {
        await updateDoc(doc(db, 'drive_accounts', emailLower), { lastSyncedAt: nowIso });
      }
    }

    const [albumsSnap, foldersSnap, accSnap] = await Promise.all([
      getDocs(collection(db, 'albums')),
      getDocs(collection(db, 'drive_folders')),
      getDocs(collection(db, 'drive_accounts'))
    ]);
    const rawAlbums = sortByDateDesc(albumsSnap.docs.map((d) => d.data() as AlbumItem));
    const albums = await Promise.all(rawAlbums.map(hydrateAlbumWithItems));

    return {
      albums,
      driveFolders: foldersSnap.docs.map((d) => d.data() as LinkedDriveFolder),
      driveAccounts: accSnap.docs.map((d) => d.data() as LinkedDriveAccount)
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'drive_sync');
  }
}

// ==================== WEB PUSH SUBSCRIPTIONS & HISTORY ====================

export interface StoredPushSubscription {
  id: string;
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
  createdAt: string;
}

export async function savePushSubscriptionToFirestore(subscription: PushSubscriptionJSON): Promise<void> {
  if (!subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) return;
  const subId = await sha256Hex(subscription.endpoint);
  const record: StoredPushSubscription = {
    id: subId,
    endpoint: subscription.endpoint,
    expirationTime: subscription.expirationTime ?? null,
    keys: {
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth
    },
    createdAt: new Date().toISOString()
  };
  try {
    await setDoc(doc(db, 'push_subscriptions', subId), record);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `push_subscriptions/${subId}`);
  }
}

export async function getAllPushSubscriptionsFromFirestore(): Promise<StoredPushSubscription[]> {
  try {
    const snap = await getDocs(collection(db, 'push_subscriptions'));
    return snap.docs.map((d) => d.data() as StoredPushSubscription);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'push_subscriptions');
  }
}

export async function pruneExpiredPushSubscriptionsInFirestore(endpoints: string[]): Promise<number> {
  try {
    for (const ep of endpoints) {
      const subId = await sha256Hex(ep);
      await deleteDoc(doc(db, 'push_subscriptions', subId)).catch(() => {});
    }
    const snap = await getDocs(collection(db, 'push_subscriptions'));
    return snap.size;
  } catch {
    return 0;
  }
}

export async function recordPushHistoryInFirestore(entry: PushNotificationRecord): Promise<PushNotificationRecord[]> {
  try {
    await setDoc(doc(db, 'push_history', entry.id), stripUndefined(entry));
    const snap = await getDocs(query(collection(db, 'push_history'), orderBy('sentAt', 'desc'), limit(30)));
    return snap.docs.map((d) => d.data() as PushNotificationRecord);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `push_history/${entry.id}`);
  }
}

// ==================== PUBLIC INTERACTIONS ====================

export async function reactCulteInFirestore(
  id: string,
  type: 'likes' | 'hearts' | 'prayers'
): Promise<CulteReaction> {
  const ref = doc(db, 'cultes', id);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Culte introuvable');
  const prev = (snap.data()?.reactions || { likes: 0, hearts: 0, prayers: 0 }) as CulteReaction;
  const next: CulteReaction = {
    likes: prev.likes || 0,
    hearts: prev.hearts || 0,
    prayers: prev.prayers || 0,
    [type]: (prev[type] || 0) + 1
  };
  await updateDoc(ref, { reactions: next });
  return next;
}

export async function commentItemInFirestore(
  targetType: 'culte' | 'evenement' | 'actualite',
  targetId: string,
  authorName: string,
  text: string
): Promise<ItemComment> {
  const colName = targetType === 'culte' ? 'cultes' : targetType === 'evenement' ? 'events' : 'news';
  const ref = doc(db, colName, targetId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Publication introuvable');
  const existing = Array.isArray(snap.data()?.comments) ? (snap.data().comments as ItemComment[]) : [];
  const comment: ItemComment = {
    id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    targetId,
    targetType,
    targetTitle: String(snap.data()?.title || ''),
    authorName: authorName.trim().slice(0, 80) || 'Membre',
    text: text.trim().slice(0, 1000),
    date: new Date().toISOString().slice(0, 10),
    status: 'auto-publie'
  };
  await updateDoc(ref, { comments: [comment, ...existing].slice(0, 500) });
  return comment;
}

export async function reportCulteCommentInFirestore(commentId: string): Promise<void> {
  const snap = await getDocs(query(collection(db, 'cultes'), where('status', '==', 'publie')));
  for (const d of snap.docs) {
    const comments = Array.isArray(d.data()?.comments) ? (d.data().comments as ItemComment[]) : [];
    if (comments.some((c) => c.id === commentId)) {
      const updated = comments.map((c) => (c.id === commentId ? { ...c, reported: true } : c));
      await updateDoc(d.ref, { comments: updated });
      return;
    }
  }
}

export async function toggleEventRegisterInFirestore(id: string, registered: boolean): Promise<number> {
  const ref = doc(db, 'events', id);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Événement introuvable');
  const prev = Number(snap.data()?.attendeesCount || 0);
  const next = Math.max(0, prev + (registered ? 1 : -1));
  await updateDoc(ref, { attendeesCount: next });
  return next;
}

export async function likeItemInFirestore(col: 'events' | 'news', id: string): Promise<number> {
  const ref = doc(db, col, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Élément introuvable');
  const next = Number(snap.data()?.likes || 0) + 1;
  await updateDoc(ref, { likes: next });
  return next;
}

export async function voteEventPollInFirestore(
  id: string,
  optionId: string
): Promise<EventItem['poll']> {
  const ref = doc(db, 'events', id);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Événement introuvable');
  const poll = snap.data()?.poll as EventItem['poll'];
  if (!poll) throw new Error('Sondage introuvable');
  const nextPoll = {
    question: poll.question,
    options: (poll.options || []).map((o) =>
      o.id === optionId ? { ...o, votes: (o.votes || 0) + 1 } : o
    ),
    totalVotes: (poll.totalVotes || 0) + 1
  };
  await updateDoc(ref, { poll: nextPoll });
  return nextPoll;
}

export async function recordViewInFirestore(
  type: 'cultes' | 'events' | 'news' | 'albums',
  id: string
): Promise<{ viewsCount?: number; readsCount?: number }> {
  const ref = doc(db, type, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return {};
  if (type === 'news') {
    const readsCount = Number(snap.data()?.readsCount || 0) + 1;
    await updateDoc(ref, { readsCount });
    return { readsCount };
  }
  const viewsCount = Number(snap.data()?.viewsCount || 0) + 1;
  await updateDoc(ref, { viewsCount });
  return { viewsCount };
}
