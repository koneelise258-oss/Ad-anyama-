import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  type UserCredential
} from 'firebase/auth';
import { auth } from './firebase';

export const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];
const REDIRECT_MODE_KEY = 'eeadci_auth_redirect_mode';

export interface DriveAccountSession {
  email: string;
  displayName: string;
  photoLink?: string;
  accessToken: string;
  connectedAt: number;
}

export interface DriveFolderItem {
  id: string;
  name: string;
  modifiedTime?: string;
}

export type DriveFileKind = 'photo' | 'video' | 'audio' | 'document';

export interface DriveItemFile {
  id: string;
  name: string;
  mimeType: string;
  kind: DriveFileKind;
  thumbnailLink?: string;
  size?: string;
  modifiedTime?: string;
  videoMediaMetadata?: {
    durationMillis?: string;
  };
}

export type DriveImageFile = DriveItemFile;

export type DriveRootScope = 'root' | 'sharedWithMe' | 'recentPhotos';

// Stockage strictement en mémoire vive (aucun jeton stocké dans localStorage ou sessionStorage)
const inMemorySessions = new Map<string, DriveAccountSession>();

export const isInsideIframe = (): boolean => {
  try {
    return typeof window !== 'undefined' && window.self !== window.top;
  } catch {
    return true;
  }
};

export const isStandalonePwa = (): boolean => {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)')?.matches === true ||
    (window.navigator as { standalone?: boolean }).standalone === true
  );
};

export const initDriveAuthListener = (onSignedOut?: () => void) => {
  return onAuthStateChanged(auth, (user) => {
    if (!user) {
      inMemorySessions.clear();
      onSignedOut?.();
    }
  });
};

export const getCachedDriveSessions = (): DriveAccountSession[] => {
  return Array.from(inMemorySessions.values());
};

export const getDriveSessionToken = (email: string): string | null => {
  return inMemorySessions.get(email.toLowerCase())?.accessToken || null;
};

export const clearDriveSession = async (email?: string) => {
  if (email) {
    inMemorySessions.delete(email.toLowerCase());
  } else {
    inMemorySessions.clear();
    await auth.signOut().catch(() => {});
  }
};

const verifyAndRegisterDriveSession = async (
  result: UserCredential,
  accessToken: string
): Promise<DriveAccountSession> => {
  let email = (result.user.email || '').toLowerCase();
  let displayName = result.user.displayName || 'Compte Google';
  let photoLink = result.user.photoURL || undefined;

  const aboutRes = await fetch(
    'https://www.googleapis.com/drive/v3/about?fields=user(displayName,emailAddress,photoLink)',
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (aboutRes.status === 401 || aboutRes.status === 403) {
    const errJson = await aboutRes.json().catch(() => ({}));
    const detail = String(errJson?.error?.message || '');
    if (aboutRes.status === 403 || /insufficient|scope|permission/i.test(detail)) {
      throw new Error(
        'Autorisation Google Drive non cochée : lors de la connexion Google, cochez bien la case « Afficher et télécharger tous vos fichiers Google Drive » puis réessayez.'
      );
    }
    throw new Error('Session Google Drive refusée ou expirée. Veuillez reconnecter ce compte.');
  }

  if (aboutRes.ok) {
    const aboutData = await aboutRes.json();
    if (aboutData?.user?.emailAddress) email = String(aboutData.user.emailAddress).toLowerCase();
    if (aboutData?.user?.displayName) displayName = aboutData.user.displayName;
    if (aboutData?.user?.photoLink) photoLink = aboutData.user.photoLink;
  }

  // Vérifier l'accès effectif aux fichiers (portée drive.readonly)
  const checkRes = await fetch('https://www.googleapis.com/drive/v3/files?pageSize=1&fields=files(id)', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (checkRes.status === 403) {
    throw new Error(
      'Permission Google Drive insuffisante : recommencez la connexion et cochez la case d’accès à Google Drive sur l’écran Google.'
    );
  }

  if (!email) {
    throw new Error('Adresse e-mail du compte Google introuvable.');
  }

  const session: DriveAccountSession = {
    email,
    displayName,
    photoLink,
    accessToken,
    connectedAt: Date.now()
  };

  inMemorySessions.set(session.email, session);
  return session;
};

const buildIdentityProvider = (loginHint?: string) => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: 'select_account',
    ...(loginHint ? { login_hint: loginHint } : {})
  });
  return provider;
};

const buildDriveProvider = (loginHint?: string) => {
  const provider = new GoogleAuthProvider();
  for (const scope of SCOPES) {
    provider.addScope(scope);
  }
  provider.setCustomParameters({
    prompt: 'consent select_account',
    include_granted_scopes: 'true',
    ...(loginHint ? { login_hint: loginHint } : {})
  });
  return provider;
};

export const startGoogleIdentityRedirect = async (loginHint?: string): Promise<void> => {
  try {
    sessionStorage.setItem(REDIRECT_MODE_KEY, 'admin');
  } catch {
    // ignore storage errors
  }
  await signInWithRedirect(auth, buildIdentityProvider(loginHint));
};

export const startGoogleDriveRedirect = async (loginHint?: string): Promise<void> => {
  try {
    sessionStorage.setItem(REDIRECT_MODE_KEY, 'drive');
  } catch {
    // ignore storage errors
  }
  await signInWithRedirect(auth, buildDriveProvider(loginHint));
};

export type GoogleRedirectCompletion =
  | { mode: 'admin'; email: string; idToken: string; displayName: string }
  | { mode: 'drive'; driveSession: DriveAccountSession }
  | null;

export const consumeGoogleRedirectResult = async (): Promise<GoogleRedirectCompletion> => {
  let pendingMode: string | null = null;
  try {
    pendingMode = sessionStorage.getItem(REDIRECT_MODE_KEY);
  } catch {
    pendingMode = null;
  }

  let result: UserCredential | null = null;
  try {
    result = await getRedirectResult(auth);
  } finally {
    try {
      sessionStorage.removeItem(REDIRECT_MODE_KEY);
    } catch {
      // ignore
    }
  }

  if (!result) return null;

  if (pendingMode === 'drive') {
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken;
    if (!accessToken) {
      throw new Error('Impossible de récupérer l’autorisation Google Drive après redirection.');
    }
    const driveSession = await verifyAndRegisterDriveSession(result, accessToken);
    return { mode: 'drive', driveSession };
  }

  const email = (result.user.email || '').toLowerCase();
  if (!email) {
    throw new Error('Adresse e-mail Google introuvable.');
  }
  const idToken = await result.user.getIdToken();
  return {
    mode: 'admin',
    email,
    idToken,
    displayName: result.user.displayName || email.split('@')[0]
  };
};

export const shouldUseRedirectFallback = (err: unknown): boolean => {
  const code = String((err as { code?: string })?.code || '');
  return (
    code === 'auth/popup-blocked' ||
    code === 'auth/operation-not-supported-in-this-environment' ||
    code === 'auth/popup-closed-by-user' ||
    code === 'auth/cancelled-popup-request'
  );
};

export const connectGoogleDriveAccount = async (loginHint?: string): Promise<DriveAccountSession> => {
  const provider = buildDriveProvider(loginHint);
  const result = await signInWithPopup(auth, provider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  const accessToken = credential?.accessToken;
  if (!accessToken) {
    throw new Error('Impossible de récupérer l’autorisation Google Drive.');
  }

  return verifyAndRegisterDriveSession(result, accessToken);
};

export const formatFirebaseGoogleError = (
  err: unknown,
  inIframe = isInsideIframe()
): { message: string; isUnauthorizedDomain: boolean; domain: string; isPopupOrTestIssue: boolean } => {
  const code = String((err as { code?: string })?.code || '');
  const rawMsg = err instanceof Error ? err.message : String(err || '');
  const domain = typeof window !== 'undefined' ? window.location.hostname : '';

  if (code === 'auth/unauthorized-domain' || /unauthorized-domain/i.test(rawMsg)) {
    return {
      isUnauthorizedDomain: true,
      isPopupOrTestIssue: false,
      domain,
      message: `Ce domaine (« ${domain} ») n’est pas encore autorisé dans Firebase Authentication. Ajoutez « ${domain} » dans Firebase Console → Authentication → Settings → Authorized domains.`
    };
  }

  if (
    code === 'auth/popup-blocked' ||
    code === 'auth/popup-closed-by-user' ||
    code === 'auth/cancelled-popup-request'
  ) {
    return {
      isUnauthorizedDomain: false,
      isPopupOrTestIssue: true,
      domain,
      message: inIframe
        ? 'La fenêtre Google a été bloquée ou fermée dans l’aperçu intégré. Ouvrez le site dans un nouvel onglet pour vous connecter sans blocage.'
        : 'Connexion Google interrompue ou bloquée par le navigateur. Essayez la connexion directe ci-dessous.'
    };
  }

  if (/access_denied|validation|verified|blocked/i.test(rawMsg)) {
    return {
      isUnauthorizedDomain: false,
      isPopupOrTestIssue: true,
      domain,
      message:
        'Accès refusé par Google (application en mode Test) : vérifiez que votre compte Gmail est bien ajouté dans Google Cloud Console → Utilisateurs tests.'
    };
  }

  return {
    isUnauthorizedDomain: false,
    isPopupOrTestIssue: false,
    domain,
    message: rawMsg || 'Accès refusé. Utilisez un compte Google autorisé.'
  };
};

export const signInGoogleForIdentity = async (
  loginHint?: string
): Promise<{ email: string; idToken: string; displayName: string }> => {
  const provider = buildIdentityProvider(loginHint);
  const result = await signInWithPopup(auth, provider);
  const email = (result.user.email || '').toLowerCase();
  if (!email) {
    throw new Error('Adresse e-mail Google introuvable.');
  }
  const idToken = await result.user.getIdToken();
  return {
    email,
    idToken,
    displayName: result.user.displayName || email.split('@')[0]
  };
};

interface RawDriveApiFile {
  id: string;
  name: string;
  mimeType: string;
  thumbnailLink?: string;
  size?: string;
  modifiedTime?: string;
  videoMediaMetadata?: { durationMillis?: string };
  shortcutDetails?: { targetId?: string; targetMimeType?: string };
}

export const classifyDriveMimeType = (mimeType: string, fileName = ''): DriveFileKind | null => {
  const mime = (mimeType || '').toLowerCase();
  const ext = fileName.toLowerCase().split('.').pop() || '';
  if (mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic'].includes(ext)) return 'photo';
  if (mime.startsWith('video/') || ['mp4', 'webm', 'mov', 'm4v'].includes(ext)) return 'video';
  if (mime.startsWith('audio/') || ['mp3', 'wav', 'm4a', 'ogg', 'aac'].includes(ext)) return 'audio';
  if (
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
    ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt'].includes(ext)
  ) {
    return 'document';
  }
  return null;
};

const normalizeShortcutFile = (f: RawDriveApiFile): RawDriveApiFile => {
  if (f.mimeType === 'application/vnd.google-apps.shortcut' && f.shortcutDetails?.targetId) {
    return {
      ...f,
      id: f.shortcutDetails.targetId,
      mimeType: f.shortcutDetails.targetMimeType || f.mimeType
    };
  }
  return f;
};

export const listDriveFolders = async (
  accessToken: string,
  parentFolderId: string = 'root'
): Promise<DriveFolderItem[]> => {
  if (parentFolderId === 'recentPhotos') {
    return [];
  }

  const q =
    parentFolderId === 'sharedWithMe'
      ? `sharedWithMe = true and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
      : `'${parentFolderId.replace(/'/g, '')}' in parents and (mimeType = 'application/vnd.google-apps.folder' or mimeType = 'application/vnd.google-apps.shortcut') and trashed = false`;

  const params = new URLSearchParams({
    q,
    fields: 'files(id, name, mimeType, modifiedTime, shortcutDetails)',
    orderBy: 'folder,name',
    pageSize: '100',
    includeItemsFromAllDrives: 'true',
    supportsAllDrives: 'true'
  });

  const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error?.message || 'Accès expiré ou refusé sur ce compte Google Drive.');
  }
  const rawFiles: RawDriveApiFile[] = Array.isArray(data.files) ? data.files : [];
  return rawFiles
    .map(normalizeShortcutFile)
    .filter((f) => f.mimeType === 'application/vnd.google-apps.folder')
    .map((f) => ({ id: f.id, name: f.name, modifiedTime: f.modifiedTime }));
};

export const listDriveFilesInFolder = async (
  accessToken: string,
  folderId: string = 'root'
): Promise<DriveItemFile[]> => {
  let q = `'${folderId.replace(/'/g, '')}' in parents and mimeType != 'application/vnd.google-apps.folder' and trashed = false`;
  if (folderId === 'sharedWithMe') {
    q = `sharedWithMe = true and mimeType != 'application/vnd.google-apps.folder' and trashed = false`;
  } else if (folderId === 'recentPhotos') {
    q = `(mimeType contains 'image/' or mimeType contains 'video/' or mimeType contains 'audio/') and trashed = false`;
  }

  const params = new URLSearchParams({
    q,
    fields: 'files(id, name, mimeType, thumbnailLink, size, modifiedTime, videoMediaMetadata, shortcutDetails)',
    orderBy: 'modifiedTime desc',
    pageSize: '100',
    includeItemsFromAllDrives: 'true',
    supportsAllDrives: 'true'
  });

  const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error?.message || 'Impossible de lire les fichiers de ce dossier Drive.');
  }
  const rawFiles: RawDriveApiFile[] = Array.isArray(data.files) ? data.files : [];
  const mapped: DriveItemFile[] = [];
  for (const raw of rawFiles) {
    const f = normalizeShortcutFile(raw);
    const kind = classifyDriveMimeType(f.mimeType || '', f.name || '');
    if (kind) {
      mapped.push({
        id: f.id,
        name: f.name,
        mimeType: f.mimeType,
        kind,
        thumbnailLink: f.thumbnailLink,
        size: f.size,
        modifiedTime: f.modifiedTime,
        videoMediaMetadata: f.videoMediaMetadata
      });
    }
  }
  return mapped;
};

export const listDriveImagesInFolder = listDriveFilesInFolder;
