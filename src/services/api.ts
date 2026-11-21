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

const buildHeaders = (extra?: Record<string, string>): Record<string, string> => {
  const headers: Record<string, string> = { ...(extra || {}) };
  if (inMemoryToken) {
    headers['Authorization'] = `Bearer ${inMemoryToken}`;
  }
  return headers;
};

async function apiJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: 'include',
    ...init,
    headers: buildHeaders({
      'Content-Type': 'application/json',
      ...(init?.headers as Record<string, string> | undefined)
    })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || `Erreur serveur (${res.status})`);
  }
  return data as T;
}

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
  // Public
  fetchPublicData: () => apiJson<PublicBootstrapPayload>('/api/public/data'),
  reactCulte: (id: string, type: 'likes' | 'hearts' | 'prayers') =>
    apiJson<{ reactions: Culte['reactions'] }>(`/api/public/cultes/${encodeURIComponent(id)}/react`, {
      method: 'POST',
      body: JSON.stringify({ type })
    }),
  commentCulte: (id: string, authorName: string, text: string) =>
    apiJson<{ comment: any }>(`/api/public/cultes/${encodeURIComponent(id)}/comment`, {
      method: 'POST',
      body: JSON.stringify({ authorName, text })
    }),
  reportComment: (commentId: string) =>
    apiJson<{ ok: boolean }>(`/api/public/cultes/comments/${encodeURIComponent(commentId)}/report`, {
      method: 'POST'
    }),
  toggleEventRegister: (id: string, registered: boolean) =>
    apiJson<{ attendeesCount: number }>(`/api/public/events/${encodeURIComponent(id)}/register`, {
      method: 'POST',
      body: JSON.stringify({ registered })
    }),
  likeEvent: (id: string) =>
    apiJson<{ likes: number }>(`/api/public/events/${encodeURIComponent(id)}/like`, { method: 'POST' }),
  commentEvent: (id: string, authorName: string, text: string) =>
    apiJson<{ comment: any }>(`/api/public/events/${encodeURIComponent(id)}/comment`, {
      method: 'POST',
      body: JSON.stringify({ authorName, text })
    }),
  voteEventPoll: (id: string, optionId: string) =>
    apiJson<{ poll: EventItem['poll'] }>(`/api/public/events/${encodeURIComponent(id)}/vote`, {
      method: 'POST',
      body: JSON.stringify({ optionId })
    }),
  likeNews: (id: string) =>
    apiJson<{ likes: number }>(`/api/public/news/${encodeURIComponent(id)}/like`, { method: 'POST' }),
  commentNews: (id: string, authorName: string, text: string) =>
    apiJson<{ comment: any }>(`/api/public/news/${encodeURIComponent(id)}/comment`, {
      method: 'POST',
      body: JSON.stringify({ authorName, text })
    }),

  recordView: (type: 'cultes' | 'events' | 'news' | 'albums', id: string) =>
    apiJson<{ viewsCount?: number; readsCount?: number }>(`/api/public/${type}/${encodeURIComponent(id)}/view`, {
      method: 'POST'
    }),

  getVapidPublicKey: () => apiJson<{ publicKey: string }>('/api/public/push/vapid-key'),
  subscribePush: (subscription: PushSubscriptionJSON) =>
    apiJson<{ ok: boolean; count: number }>('/api/public/push/subscribe', {
      method: 'POST',
      body: JSON.stringify({ subscription })
    }),
  unsubscribePush: (endpoint: string) =>
    apiJson<{ ok: boolean }>('/api/public/push/unsubscribe', {
      method: 'POST',
      body: JSON.stringify({ endpoint })
    }),

  // Auth & Hidden Gate
  verifyGate: (slug: string) =>
    apiJson<{ valid: boolean }>('/api/auth/verify-gate', {
      method: 'POST',
      body: JSON.stringify({ slug })
    }),
  getAuthStatus: () => apiJson<AuthStatus>('/api/auth/status'),
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
  loginWithGoogle: (firebaseIdToken: string) =>
    apiJson<{ token: string; admin: AdminUserPublic }>('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify({ firebaseIdToken })
    }),
  logoutAdmin: () => apiJson<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }),

  // Admin Protected
  fetchAdminBootstrap: () => apiJson<AdminBootstrapPayload>('/api/admin/bootstrap'),

  uploadSingleFile: async (file: File): Promise<UploadedFileResult> => {
    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      credentials: 'include',
      headers: buildHeaders({
        'Content-Type': 'application/octet-stream',
        'X-File-Name': encodeURIComponent(file.name),
        'X-Mime-Type': file.type || 'application/octet-stream'
      }),
      body: file
    });
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

  updateSettings: (payload: {
    churchSettings?: Partial<ChurchSettings>;
    heroContent?: HeroContent;
    siteImages?: SiteImages;
    officialLogoUrl?: string | null;
  }) =>
    apiJson<{
      churchSettings: ChurchSettings;
      heroContent: HeroContent;
      siteImages: SiteImages;
      officialLogoUrl: string | null;
    }>('/api/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),

  createCulte: (culte: Culte) =>
    apiJson<{ cultes: Culte[] }>('/api/admin/cultes', { method: 'POST', body: JSON.stringify(culte) }),
  updateCulte: (culte: Culte) =>
    apiJson<{ cultes: Culte[] }>(`/api/admin/cultes/${encodeURIComponent(culte.id)}`, {
      method: 'PUT',
      body: JSON.stringify(culte)
    }),
  deleteCulte: (id: string) =>
    apiJson<{ cultes: Culte[] }>(`/api/admin/cultes/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  createEvent: (ev: EventItem) =>
    apiJson<{ events: EventItem[] }>('/api/admin/events', { method: 'POST', body: JSON.stringify(ev) }),
  updateEvent: (ev: EventItem) =>
    apiJson<{ events: EventItem[] }>(`/api/admin/events/${encodeURIComponent(ev.id)}`, {
      method: 'PUT',
      body: JSON.stringify(ev)
    }),
  deleteEvent: (id: string) =>
    apiJson<{ events: EventItem[] }>(`/api/admin/events/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  createNews: (item: NewsItem) =>
    apiJson<{ news: NewsItem[] }>('/api/admin/news', { method: 'POST', body: JSON.stringify(item) }),
  updateNews: (item: NewsItem) =>
    apiJson<{ news: NewsItem[] }>(`/api/admin/news/${encodeURIComponent(item.id)}`, {
      method: 'PUT',
      body: JSON.stringify(item)
    }),
  deleteNews: (id: string) =>
    apiJson<{ news: NewsItem[] }>(`/api/admin/news/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  createAlbum: (album: AlbumItem) =>
    apiJson<{ albums: AlbumItem[] }>('/api/admin/albums', { method: 'POST', body: JSON.stringify(album) }),
  updateAlbum: (album: AlbumItem) =>
    apiJson<{ albums: AlbumItem[] }>(`/api/admin/albums/${encodeURIComponent(album.id)}`, {
      method: 'PUT',
      body: JSON.stringify(album)
    }),
  deleteAlbum: (id: string) =>
    apiJson<{ albums: AlbumItem[] }>(`/api/admin/albums/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  createDepartment: (dept: DepartmentItem) =>
    apiJson<{ departments: DepartmentItem[] }>('/api/admin/departments', {
      method: 'POST',
      body: JSON.stringify(dept)
    }),
  updateDepartment: (dept: DepartmentItem) =>
    apiJson<{ departments: DepartmentItem[] }>(`/api/admin/departments/${encodeURIComponent(dept.id)}`, {
      method: 'PUT',
      body: JSON.stringify(dept)
    }),
  deleteDepartment: (id: string) =>
    apiJson<{ departments: DepartmentItem[] }>(`/api/admin/departments/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    }),

  keepComment: (targetType: 'culte' | 'evenement' | 'actualite', targetId: string, commentId: string) =>
    apiJson<{ cultes: Culte[]; events: EventItem[]; news: NewsItem[] }>(
      `/api/admin/comments/${targetType}/${encodeURIComponent(targetId)}/${encodeURIComponent(commentId)}/keep`,
      { method: 'POST' }
    ),
  removeComment: (targetType: 'culte' | 'evenement' | 'actualite', targetId: string, commentId: string) =>
    apiJson<{ cultes: Culte[]; events: EventItem[]; news: NewsItem[] }>(
      `/api/admin/comments/${targetType}/${encodeURIComponent(targetId)}/${encodeURIComponent(commentId)}`,
      { method: 'DELETE' }
    ),

  updateSecurity: (settings: Partial<SecuritySettings>) =>
    apiJson<{ security: SecuritySettings; securityLogs: SecurityLogEntry[] }>('/api/admin/security', {
      method: 'PUT',
      body: JSON.stringify(settings)
    }),
  addAdminUser: (payload: { name: string; identifier: string; role: string; password: string }) =>
    apiJson<{ admins: AdminUserPublic[]; securityLogs: SecurityLogEntry[] }>('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  inviteAdmin: (payload: { email: string; name: string; role: string; originUrl?: string }) =>
    apiJson<{
      invitedAdmins: AdminInvitation[];
      admins: AdminUserPublic[];
      securityLogs: SecurityLogEntry[];
      inviteCode: string;
      emailSent: boolean;
      mailtoUrl: string;
    }>('/api/admin/invitations', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
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
  removeAdminInvitation: (email: string) =>
    apiJson<{
      invitedAdmins: AdminInvitation[];
      admins: AdminUserPublic[];
      securityLogs: SecurityLogEntry[];
    }>(`/api/admin/invitations/${encodeURIComponent(email)}`, {
      method: 'DELETE'
    }),
  deleteAdminUser: (id: string) =>
    apiJson<{ admins: AdminUserPublic[]; invitedAdmins?: AdminInvitation[]; securityLogs: SecurityLogEntry[] }>(
      `/api/admin/users/${encodeURIComponent(id)}`,
      { method: 'DELETE' }
    ),
  changePassword: (currentPassword: string, newPassword: string) =>
    apiJson<{ ok: boolean; securityLogs: SecurityLogEntry[] }>('/api/admin/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword })
    }),
  sendAdminPush: (payload: { title: string; body: string; url?: string }) =>
    apiJson<{
      sentCount: number;
      failedCount: number;
      subscribersCount: number;
      pushHistory: PushNotificationRecord[];
    }>('/api/admin/push/send', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  saveDriveAccount: (payload: { email: string; displayName: string; photoLink?: string }) =>
    apiJson<{ driveAccounts: LinkedDriveAccount[] }>('/api/admin/drive/accounts', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  removeDriveAccount: (email: string) =>
    apiJson<{ driveAccounts: LinkedDriveAccount[] }>(`/api/admin/drive/accounts/${encodeURIComponent(email)}`, {
      method: 'DELETE'
    }),
  importFromDrive: (
    driveAccessToken: string,
    payload: {
      accountEmail: string;
      folderId?: string;
      folderName?: string;
      files?: Array<{ id: string; name: string; mimeType?: string }>;
      importKind?: 'all' | 'media' | 'document';
      createAlbum?: boolean;
      albumId?: string;
      albumTitle?: string;
      albumCategory?: AlbumItem['category'];
    }
  ) =>
    apiJson<{
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
    }),

  downloadBackupUrl: () => '/api/admin/backup'
};

export type { AdminSubPage };
