import { auth } from './firebase';
import {
  addSecurityLogToFirestore,
  checkEmailAuthorizedInFirestore,
  commentItemInFirestore,
  compressDataUrlIfNeeded,
  deleteAlbumFromFirestore,
  deleteCulteFromFirestore,
  deleteDepartmentFromFirestore,
  deleteEventFromFirestore,
  deleteNewsFromFirestore,
  deleteAdminUserFromFirestore,
  fetchAdminBootstrapFromFirestore,
  fetchPublicDataFromFirestore,
  getAllPushSubscriptionsFromFirestore,
  inviteAdminInFirestore,
  likeItemInFirestore,
  moderateCommentInFirestore,
  pruneExpiredPushSubscriptionsInFirestore,
  reactCulteInFirestore,
  recordPushHistoryInFirestore,
  recordViewInFirestore,
  registerCurrentFirebaseAdminInFirestore,
  removeAdminInvitationFromFirestore,
  removeDriveAccountFromFirestore,
  reportCulteCommentInFirestore,
  saveAlbumToFirestore,
  saveCulteToFirestore,
  saveDepartmentToFirestore,
  saveDriveAccountToFirestore,
  saveEventToFirestore,
  saveNewsToFirestore,
  savePushSubscriptionToFirestore,
  syncDriveImportResultsToFirestore,
  toggleEventRegisterInFirestore,
  updateSecurityInFirestore,
  updateSettingsInFirestore,
  verifySecretGateInFirestore,
  voteEventPollInFirestore
} from './firestoreStore';
import type {
  AdminInvitation,
  AdminSubPage,
  AdminUserPublic,
  AlbumItem,
  AuthStatus,
  ChurchSettings,
  Culte,
  CulteDocument,
  DepartmentItem,
  EventItem,
  HeroContent,
  LinkedDriveAccount,
  LinkedDriveFolder,
  MediaItem,
  NewsItem,
  PushNotificationRecord,
  SecurityLogEntry,
  SecuritySettings,
  SiteImages,
  UploadedFileResult
} from '../types';

let inMemoryToken: string | null = null;

export const setSessionToken = (token: string | null) => {
  inMemoryToken = token;
};

export const getSessionToken = () => inMemoryToken;

const buildHeadersAsync = async (extra?: Record<string, string>): Promise<Record<string, string>> => {
  const headers: Record<string, string> = { ...(extra || {}) };
  if (inMemoryToken) {
    headers['Authorization'] = `Bearer ${inMemoryToken}`;
  }
  if (auth.currentUser) {
    try {
      const fbToken = await auth.currentUser.getIdToken();
      if (fbToken) {
        headers['X-Firebase-Id-Token'] = fbToken;
      }
    } catch {
      // ignore token refresh failure
    }
  }
  return headers;
};

async function apiJson<T>(url: string, init?: RequestInit): Promise<T> {
  const headers = await buildHeadersAsync({
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string> | undefined)
  });
  const res = await fetch(url, {
    credentials: 'include',
    ...init,
    headers
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || `Erreur serveur (${res.status})`);
  }
  return data as T;
}

const currentActorName = () => auth.currentUser?.displayName || auth.currentUser?.email || 'Administrateur';

export interface PublicBootstrapPayload {
  churchSettings: ChurchSettings;
  heroContent: HeroContent;
  siteImages: SiteImages;
  officialLogoUrl: string | null;
  cultes: Culte[];
  events: EventItem[];
  news: NewsItem[];
  albums: AlbumItem[];
  departments: DepartmentItem[];
}

export interface AdminBootstrapPayload extends PublicBootstrapPayload {
  admins: AdminUserPublic[];
  invitedAdmins: AdminInvitation[];
  security: SecuritySettings;
  securityLogs: SecurityLogEntry[];
  pushSubscribersCount: number;
  pushHistory: PushNotificationRecord[];
  driveAccounts?: LinkedDriveAccount[];
  driveFolders?: LinkedDriveFolder[];
}

export const api = {
  // ==================== PUBLIC (Firestore + secours serveur) ====================
  fetchPublicData: async (): Promise<PublicBootstrapPayload> => {
    try {
      const fsRes = await fetchPublicDataFromFirestore();
      if (fsRes.seeded) {
        return fsRes.data;
      }
      // Si Firestore n'a pas encore été initialisé par un admin, fusionner avec les éventuelles données serveur locales
      const srv = await apiJson<PublicBootstrapPayload>('/api/public/data').catch(() => null);
      if (srv && (srv.cultes?.length || srv.events?.length || srv.news?.length || srv.albums?.length)) {
        return srv;
      }
      return fsRes.data;
    } catch {
      return apiJson<PublicBootstrapPayload>('/api/public/data');
    }
  },

  reactCulte: async (id: string, type: 'likes' | 'hearts' | 'prayers') => {
    const reactions = await reactCulteInFirestore(id, type).catch(async () => {
      const res = await apiJson<{ reactions: Culte['reactions'] }>(`/api/public/cultes/${encodeURIComponent(id)}/react`, {
        method: 'POST',
        body: JSON.stringify({ type })
      });
      return res.reactions;
    });
    return { reactions };
  },

  commentCulte: async (id: string, authorName: string, text: string) => {
    const comment = await commentItemInFirestore('culte', id, authorName, text).catch(async () => {
      const res = await apiJson<{ comment: any }>(`/api/public/cultes/${encodeURIComponent(id)}/comment`, {
        method: 'POST',
        body: JSON.stringify({ authorName, text })
      });
      return res.comment;
    });
    return { comment };
  },

  reportComment: async (commentId: string) => {
    await reportCulteCommentInFirestore(commentId).catch(() =>
      apiJson<{ ok: boolean }>(`/api/public/cultes/comments/${encodeURIComponent(commentId)}/report`, {
        method: 'POST'
      })
    );
    return { ok: true };
  },

  toggleEventRegister: async (id: string, registered: boolean) => {
    const attendeesCount = await toggleEventRegisterInFirestore(id, registered).catch(async () => {
      const res = await apiJson<{ attendeesCount: number }>(`/api/public/events/${encodeURIComponent(id)}/register`, {
        method: 'POST',
        body: JSON.stringify({ registered })
      });
      return res.attendeesCount;
    });
    return { attendeesCount };
  },

  likeEvent: async (id: string) => {
    const likes = await likeItemInFirestore('events', id).catch(async () => {
      const res = await apiJson<{ likes: number }>(`/api/public/events/${encodeURIComponent(id)}/like`, {
        method: 'POST'
      });
      return res.likes;
    });
    return { likes };
  },

  commentEvent: async (id: string, authorName: string, text: string) => {
    const comment = await commentItemInFirestore('evenement', id, authorName, text).catch(async () => {
      const res = await apiJson<{ comment: any }>(`/api/public/events/${encodeURIComponent(id)}/comment`, {
        method: 'POST',
        body: JSON.stringify({ authorName, text })
      });
      return res.comment;
    });
    return { comment };
  },

  voteEventPoll: async (id: string, optionId: string) => {
    const poll = await voteEventPollInFirestore(id, optionId).catch(async () => {
      const res = await apiJson<{ poll: EventItem['poll'] }>(`/api/public/events/${encodeURIComponent(id)}/vote`, {
        method: 'POST',
        body: JSON.stringify({ optionId })
      });
      return res.poll;
    });
    return { poll };
  },

  likeNews: async (id: string) => {
    const likes = await likeItemInFirestore('news', id).catch(async () => {
      const res = await apiJson<{ likes: number }>(`/api/public/news/${encodeURIComponent(id)}/like`, {
        method: 'POST'
      });
      return res.likes;
    });
    return { likes };
  },

  commentNews: async (id: string, authorName: string, text: string) => {
    const comment = await commentItemInFirestore('actualite', id, authorName, text).catch(async () => {
      const res = await apiJson<{ comment: any }>(`/api/public/news/${encodeURIComponent(id)}/comment`, {
        method: 'POST',
        body: JSON.stringify({ authorName, text })
      });
      return res.comment;
    });
    return { comment };
  },

  recordView: async (type: 'cultes' | 'events' | 'news' | 'albums', id: string) => {
    try {
      return await recordViewInFirestore(type, id);
    } catch {
      return apiJson<{ viewsCount?: number; readsCount?: number }>(`/api/public/${type}/${encodeURIComponent(id)}/view`, {
        method: 'POST'
      });
    }
  },

  getVapidPublicKey: () => apiJson<{ publicKey: string }>('/api/public/push/vapid-key'),

  subscribePush: async (subscription: PushSubscriptionJSON) => {
    await savePushSubscriptionToFirestore(subscription).catch(() => {});
    const res = await apiJson<{ ok: boolean; count: number }>('/api/public/push/subscribe', {
      method: 'POST',
      body: JSON.stringify({ subscription })
    }).catch(() => ({ ok: true, count: 1 }));
    return res;
  },

  unsubscribePush: (endpoint: string) =>
    apiJson<{ ok: boolean }>('/api/public/push/unsubscribe', {
      method: 'POST',
      body: JSON.stringify({ endpoint })
    }),

  // ==================== AUTH & PORTAIL CACHÉ ====================
  verifyGate: async (slug: string) => {
    const fsValid = await verifySecretGateInFirestore(slug);
    if (fsValid !== null) {
      return { valid: fsValid };
    }
    return apiJson<{ valid: boolean }>('/api/auth/verify-gate', {
      method: 'POST',
      body: JSON.stringify({ slug })
    });
  },

  getAuthStatus: async (): Promise<AuthStatus> => {
    await auth.authStateReady().catch(() => {});
    const fbUser = auth.currentUser;
    if (fbUser && fbUser.email && fbUser.emailVerified) {
      const allowed = await checkEmailAuthorizedInFirestore(fbUser.email);
      if (allowed) {
        const currentAdmin = await registerCurrentFirebaseAdminInFirestore().catch(() => null);
        if (currentAdmin) {
          return { needsSetup: false, authenticated: true, currentAdmin };
        }
      }
    }
    return apiJson<AuthStatus>('/api/auth/status');
  },

  setupFirstAdmin: (name: string, identifier: string, password: string) =>
    apiJson<{ token: string; admin: AdminUserPublic; recoveryCode?: string }>('/api/auth/setup', {
      method: 'POST',
      body: JSON.stringify({ name, identifier, password })
    }),
  registerInvitedAdmin: (payload: { email: string; name: string; password: string; inviteCode?: string }) =>
    apiJson<{ token: string; admin: AdminUserPublic; recoveryCode: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  loginAdmin: (identifier: string, password: string) =>
    apiJson<{ token: string; admin: AdminUserPublic }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password })
    }),
  forgotPassword: (email: string) =>
    apiJson<{ ok: boolean; emailSent: boolean; message: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    }),
  resetPassword: (payload: { email: string; code: string; newPassword: string }) =>
    apiJson<{ token: string; admin: AdminUserPublic; recoveryCode: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  resetPasswordWithGoogle: (firebaseIdToken: string, newPassword: string) =>
    apiJson<{ token: string; admin: AdminUserPublic; recoveryCode: string }>('/api/auth/reset-password-google', {
      method: 'POST',
      body: JSON.stringify({ firebaseIdToken, newPassword })
    }),

  loginWithGoogle: async (firebaseIdToken: string) => {
    const res = await apiJson<{ token: string; admin: AdminUserPublic }>('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify({ firebaseIdToken })
    });
    const fsAdmin = await registerCurrentFirebaseAdminInFirestore(res.admin.role).catch(() => null);
    await addSecurityLogToFirestore(
      'Connexion Google réussie',
      (fsAdmin || res.admin).name,
      `Accès administrateur (${(fsAdmin || res.admin).identifier}).`,
      'info'
    ).catch(() => {});
    return {
      token: res.token,
      admin: fsAdmin || res.admin
    };
  },

  logoutAdmin: async () => {
    if (auth.currentUser) {
      await addSecurityLogToFirestore('Déconnexion', currentActorName(), 'Session fermée manuellement.', 'info').catch(
        () => {}
      );
      await auth.signOut().catch(() => {});
    }
    return apiJson<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }).catch(() => ({ ok: true }));
  },

  // ==================== ADMIN PROTÉGÉ (Firestore Persistant) ====================
  fetchAdminBootstrap: async (): Promise<AdminBootstrapPayload> => {
    const seedHint = await apiJson<AdminBootstrapPayload>('/api/admin/bootstrap').catch(() => undefined);
    return fetchAdminBootstrapFromFirestore(seedHint);
  },

  uploadSingleFile: async (file: File): Promise<UploadedFileResult> => {
    const headers = await buildHeadersAsync({
      'Content-Type': 'application/octet-stream',
      'X-File-Name': encodeURIComponent(file.name),
      'X-Mime-Type': file.type || 'application/octet-stream'
    });
    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      credentials: 'include',
      headers,
      body: file
    });
    if (res.status === 413) {
      throw new Error(
        `« ${file.name} » dépasse la limite d’envoi direct (4,5 Mo sur Vercel). Importez cette vidéo via Google Drive ou YouTube.`
      );
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.error || `Échec d'envoi pour ${file.name}`);
    }
    return data as UploadedFileResult;
  },

  uploadBatch: async (
    files: File[],
    onProgress?: (done: number, total: number, currentName: string) => void
  ): Promise<{ uploaded: UploadedFileResult[]; errors: string[] }> => {
    const uploaded: UploadedFileResult[] = [];
    const errors: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      onProgress?.(i, files.length, f.name);
      try {
        const res = await api.uploadSingleFile(f);
        uploaded.push(res);
      } catch (err) {
        errors.push(`${f.name}: ${err instanceof Error ? err.message : 'Erreur'}`);
      }
      onProgress?.(i + 1, files.length, f.name);
    }
    return { uploaded, errors };
  },

  updateSettings: async (payload: {
    churchSettings?: Partial<ChurchSettings>;
    heroContent?: HeroContent;
    siteImages?: SiteImages;
    officialLogoUrl?: string | null;
  }) => {
    const updated = await updateSettingsInFirestore(payload);
    await addSecurityLogToFirestore(
      'Mise à jour apparence/paramètres',
      currentActorName(),
      'Paramètres généraux ou visuels enregistrés dans Firebase.',
      'info'
    ).catch(() => {});
    return updated;
  },

  createCulte: async (culte: Culte) => {
    const cultes = await saveCulteToFirestore(culte);
    await addSecurityLogToFirestore('Nouveau culte créé', currentActorName(), culte.title, 'info').catch(() => {});
    return { cultes };
  },
  updateCulte: async (culte: Culte) => {
    const cultes = await saveCulteToFirestore(culte);
    await addSecurityLogToFirestore('Culte modifié', currentActorName(), culte.title, 'info').catch(() => {});
    return { cultes };
  },
  deleteCulte: async (id: string) => {
    const cultes = await deleteCulteFromFirestore(id);
    await addSecurityLogToFirestore('Culte supprimé', currentActorName(), id, 'warning').catch(() => {});
    return { cultes };
  },

  createEvent: async (ev: EventItem) => {
    const events = await saveEventToFirestore(ev);
    await addSecurityLogToFirestore('Nouvel événement', currentActorName(), ev.title, 'info').catch(() => {});
    return { events };
  },
  updateEvent: async (ev: EventItem) => {
    const events = await saveEventToFirestore(ev);
    return { events };
  },
  deleteEvent: async (id: string) => {
    const events = await deleteEventFromFirestore(id);
    return { events };
  },

  createNews: async (item: NewsItem) => {
    const nowIso = new Date().toISOString();
    const news = await saveNewsToFirestore({
      ...item,
      date: nowIso.slice(0, 10),
      publishedAt: nowIso
    });
    await addSecurityLogToFirestore('Nouveau communiqué', currentActorName(), item.title, 'info').catch(() => {});
    return { news };
  },
  updateNews: async (item: NewsItem) => {
    const news = await saveNewsToFirestore(item);
    return { news };
  },
  deleteNews: async (id: string) => {
    const news = await deleteNewsFromFirestore(id);
    return { news };
  },

  createAlbum: async (album: AlbumItem) => {
    const albums = await saveAlbumToFirestore(album);
    await addSecurityLogToFirestore(
      'Nouvel album galerie',
      currentActorName(),
      `${album.title} (${album.items?.length || 0} médias)`,
      'info'
    ).catch(() => {});
    return { albums };
  },
  updateAlbum: async (album: AlbumItem) => {
    const albums = await saveAlbumToFirestore(album);
    return { albums };
  },
  deleteAlbum: async (id: string) => {
    const albums = await deleteAlbumFromFirestore(id);
    return { albums };
  },

  createDepartment: async (dept: DepartmentItem) => {
    const departments = await saveDepartmentToFirestore(dept);
    await addSecurityLogToFirestore('Département ajouté', currentActorName(), dept.name, 'info').catch(() => {});
    return { departments };
  },
  updateDepartment: async (dept: DepartmentItem) => {
    const departments = await saveDepartmentToFirestore(dept);
    return { departments };
  },
  deleteDepartment: async (id: string) => {
    const departments = await deleteDepartmentFromFirestore(id);
    await addSecurityLogToFirestore('Département supprimé', currentActorName(), id, 'warning').catch(() => {});
    return { departments };
  },

  keepComment: (targetType: 'culte' | 'evenement' | 'actualite', targetId: string, commentId: string) =>
    moderateCommentInFirestore('keep', targetType, targetId, commentId),

  removeComment: async (targetType: 'culte' | 'evenement' | 'actualite', targetId: string, commentId: string) => {
    const res = await moderateCommentInFirestore('remove', targetType, targetId, commentId);
    await addSecurityLogToFirestore(
      'Commentaire retiré',
      currentActorName(),
      `${targetType} / ${commentId}`,
      'info'
    ).catch(() => {});
    return res;
  },

  updateSecurity: (settings: Partial<SecuritySettings>) => updateSecurityInFirestore(settings),

  addAdminUser: (payload: { name: string; identifier: string; role: string; password: string }) =>
    apiJson<{ admins: AdminUserPublic[]; securityLogs: SecurityLogEntry[] }>('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  inviteAdmin: async (payload: { email: string; name: string; role: string; originUrl?: string }) => {
    const fsRes = await inviteAdminInFirestore({
      email: payload.email,
      name: payload.name,
      role: payload.role
    });
    const srvRes = await apiJson<{
      inviteCode: string;
      emailSent: boolean;
      mailtoUrl: string;
    }>('/api/admin/invitations', {
      method: 'POST',
      body: JSON.stringify(payload)
    }).catch(() => ({ inviteCode: '', emailSent: false, mailtoUrl: '' }));

    return {
      ...fsRes,
      inviteCode: srvRes.inviteCode || '',
      emailSent: srvRes.emailSent || false,
      mailtoUrl: srvRes.mailtoUrl || ''
    };
  },

  sendAdminResetEmail: (email: string, originUrl?: string) =>
    apiJson<{
      invitedAdmins: AdminInvitation[];
      securityLogs: SecurityLogEntry[];
      resetCode: string;
      emailSent: boolean;
      mailtoUrl: string;
    }>(`/api/admin/invitations/${encodeURIComponent(email)}/reset`, {
      method: 'POST',
      body: JSON.stringify({ originUrl })
    }),

  removeAdminInvitation: (email: string) => removeAdminInvitationFromFirestore(email),

  deleteAdminUser: (id: string) => deleteAdminUserFromFirestore(id),

  changePassword: (currentPassword: string, newPassword: string) =>
    apiJson<{ ok: boolean; securityLogs: SecurityLogEntry[] }>('/api/admin/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword })
    }),

  sendAdminPush: async (payload: { title: string; body: string; url?: string }) => {
    const subscriptions = await getAllPushSubscriptionsFromFirestore().catch(() => []);
    const res = await apiJson<{
      sentCount: number;
      failedCount: number;
      expiredEndpoints?: string[];
      subscribersCount: number;
      entry?: PushNotificationRecord;
      pushHistory: PushNotificationRecord[];
    }>('/api/admin/push/send', {
      method: 'POST',
      body: JSON.stringify({
        ...payload,
        subscriptions
      })
    });

    if (res.expiredEndpoints?.length) {
      await pruneExpiredPushSubscriptionsInFirestore(res.expiredEndpoints);
    }
    const entry: PushNotificationRecord = res.entry || {
      id: `push-${Date.now()}`,
      title: payload.title,
      body: payload.body,
      url: payload.url || '/',
      sentAt: new Date().toISOString(),
      recipientCount: res.sentCount
    };
    const pushHistory = await recordPushHistoryInFirestore(entry).catch(() => res.pushHistory || [entry]);
    await addSecurityLogToFirestore(
      'Notification Push PWA envoyée',
      currentActorName(),
      `${entry.title} (${res.sentCount} appareil(s))`,
      'info'
    ).catch(() => {});

    return {
      sentCount: res.sentCount,
      failedCount: res.failedCount,
      subscribersCount: Math.max(0, subscriptions.length - (res.expiredEndpoints?.length || 0)),
      pushHistory
    };
  },

  saveDriveAccount: async (payload: { email: string; displayName: string; photoLink?: string }) => {
    const driveAccounts = await saveDriveAccountToFirestore(payload);
    await addSecurityLogToFirestore('Compte Google Drive relié', currentActorName(), payload.email, 'info').catch(
      () => {}
    );
    return { driveAccounts };
  },

  removeDriveAccount: async (email: string) => {
    const driveAccounts = await removeDriveAccountFromFirestore(email);
    await addSecurityLogToFirestore('Compte Google Drive dissocié', currentActorName(), email, 'info').catch(
      () => {}
    );
    return { driveAccounts };
  },

  importFromDrive: async (
    driveAccessToken: string,
    payload: {
      accountEmail: string;
      folderId?: string;
      folderName?: string;
      files?: Array<{ id: string; name: string; mimeType?: string; thumbnailLink?: string }>;
      importKind?: 'all' | 'media' | 'document';
      createAlbum?: boolean;
      albumId?: string;
      albumTitle?: string;
      albumCategory?: AlbumItem['category'];
    }
  ) => {
    const res = await apiJson<{
      imported: MediaItem[];
      importedDocuments: CulteDocument[];
      skippedCount: number;
      albums: AlbumItem[];
      driveFolders: LinkedDriveFolder[];
      driveAccounts: LinkedDriveAccount[];
      album: AlbumItem | null;
    }>('/api/admin/drive/import', {
      method: 'POST',
      headers: {
        'X-Google-Access-Token': driveAccessToken
      },
      body: JSON.stringify(payload)
    });

    const compactMedia: MediaItem[] = await Promise.all(
      (res.imported || []).map(async (m) => ({
        ...m,
        url: m.type === 'photo' ? await compressDataUrlIfNeeded(m.url, 620_000) : m.url
      }))
    );

    const fsPublic = await fetchPublicDataFromFirestore();
    const existingAlbums = fsPublic.data.albums || [];
    let targetAlbum =
      (payload.albumId && existingAlbums.find((a) => a.id === payload.albumId)) ||
      (payload.folderId && payload.createAlbum && existingAlbums.find((a) => a.driveFolderId === payload.folderId)) ||
      null;

    const nowIso = new Date().toISOString();
    let nextFolders = res.driveFolders || [];

    if ((payload.createAlbum || targetAlbum) && compactMedia.length > 0) {
      if (targetAlbum) {
        const existingDriveIds = new Set((targetAlbum.items || []).map((it) => it.driveFileId).filter(Boolean));
        const newOnly = compactMedia.filter((m) => !m.driveFileId || !existingDriveIds.has(m.driveFileId));
        const mergedItems = [...(targetAlbum.items || []), ...newOnly];
        const hasPhotos = mergedItems.some((m) => m.type === 'photo');
        const hasVideos = mergedItems.some((m) => m.type === 'video' || m.type === 'audio');
        const firstPhoto = mergedItems.find((m) => m.type === 'photo');
        targetAlbum = {
          ...targetAlbum,
          type: hasPhotos && hasVideos ? 'mixte' : hasVideos ? 'video' : 'photo',
          items: mergedItems,
          coverImage: targetAlbum.coverImage || firstPhoto?.url || '',
          mediaCount: mergedItems.length,
          driveFolderId: payload.folderId || targetAlbum.driveFolderId,
          driveAccountEmail: payload.accountEmail || targetAlbum.driveAccountEmail
        };
      } else {
        const hasPhotos = compactMedia.some((m) => m.type === 'photo');
        const hasVideos = compactMedia.some((m) => m.type === 'video' || m.type === 'audio');
        const firstPhoto = compactMedia.find((m) => m.type === 'photo');
        targetAlbum = {
          id: res.album?.id || `alb-${Date.now()}`,
          title: payload.albumTitle || payload.folderName || 'Album Google Drive',
          category: payload.albumCategory || 'Événements',
          type: hasPhotos && hasVideos ? 'mixte' : hasVideos ? 'video' : 'photo',
          date: nowIso.slice(0, 10),
          publishedAt: nowIso,
          coverImage: firstPhoto?.url || '',
          mediaCount: compactMedia.length,
          items: compactMedia,
          description: `Médias synchronisés depuis Google Drive (${payload.folderName || 'Dossier Drive'}).`,
          driveFolderId: payload.folderId || undefined,
          driveAccountEmail: payload.accountEmail || undefined
        };
      }

      if (payload.folderId && targetAlbum) {
        nextFolders = [
          {
            folderId: payload.folderId,
            folderName: payload.folderName || targetAlbum.title,
            accountEmail: payload.accountEmail,
            albumId: targetAlbum.id,
            albumTitle: targetAlbum.title,
            lastSyncedAt: nowIso,
            photoCount: targetAlbum.mediaCount
          }
        ];
      }
    }

    const synced = await syncDriveImportResultsToFirestore({
      accountEmail: payload.accountEmail,
      album: targetAlbum,
      driveFolders: nextFolders
    });

    await addSecurityLogToFirestore(
      'Importation Google Drive',
      currentActorName(),
      `${compactMedia.length} média(s) et ${res.importedDocuments?.length || 0} document(s) importé(s) depuis ${payload.accountEmail || 'Google Drive'}`,
      'info'
    ).catch(() => {});

    return {
      imported: compactMedia,
      importedDocuments: res.importedDocuments || [],
      skippedCount: res.skippedCount || 0,
      albums: synced.albums,
      driveFolders: synced.driveFolders,
      driveAccounts: synced.driveAccounts,
      album: targetAlbum
    };
  },

  downloadBackupUrl: () => '/api/admin/backup'
};

export type { AdminSubPage };
