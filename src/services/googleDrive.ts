import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

export const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

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

// Stockage strictement en mémoire vive (aucun jeton stocké dans localStorage ou sessionStorage)
const inMemorySessions = new Map<string, DriveAccountSession>();

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

export const connectGoogleDriveAccount = async (loginHint?: string): Promise<DriveAccountSession> => {
  const provider = new GoogleAuthProvider();
  for (const scope of SCOPES) {
    provider.addScope(scope);
  }
  provider.setCustomParameters({
    prompt: 'select_account',
    ...(loginHint ? { login_hint: loginHint } : {})
  });

  const result = await signInWithPopup(auth, provider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  const accessToken = credential?.accessToken;
  if (!accessToken) {
    throw new Error('Impossible de récupérer l’autorisation Google Drive.');
  }

  let email = result.user.email || '';
  let displayName = result.user.displayName || 'Compte Google';
  let photoLink = result.user.photoURL || undefined;

  try {
    const aboutRes = await fetch(
      'https://www.googleapis.com/drive/v3/about?fields=user(displayName,emailAddress,photoLink)',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (aboutRes.ok) {
      const aboutData = await aboutRes.json();
      if (aboutData?.user?.emailAddress) email = aboutData.user.emailAddress;
      if (aboutData?.user?.displayName) displayName = aboutData.user.displayName;
      if (aboutData?.user?.photoLink) photoLink = aboutData.user.photoLink;
    }
  } catch {
    // Conserve les informations utilisateur Firebase si about échoue
  }

  if (!email) {
    throw new Error('Adresse e-mail du compte Google introuvable.');
  }

  const session: DriveAccountSession = {
    email: email.toLowerCase(),
    displayName,
    photoLink,
    accessToken,
    connectedAt: Date.now()
  };

  inMemorySessions.set(session.email, session);
  return session;
};

export const signInGoogleForIdentity = async (
  loginHint?: string
): Promise<{ email: string; idToken: string; displayName: string }> => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: 'select_account',
    ...(loginHint ? { login_hint: loginHint } : {})
  });
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

export const listDriveFolders = async (
  accessToken: string,
  parentFolderId = 'root'
): Promise<DriveFolderItem[]> => {
  const q = `'${parentFolderId.replace(/'/g, '')}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const params = new URLSearchParams({
    q,
    fields: 'files(id, name, modifiedTime)',
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
  return Array.isArray(data.files) ? data.files : [];
};

export const classifyDriveMimeType = (mimeType: string, fileName = ''): DriveFileKind | null => {
  const mime = (mimeType || '').toLowerCase();
  const ext = fileName.toLowerCase().split('.').pop() || '';
  if (mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) return 'photo';
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

export const listDriveFilesInFolder = async (
  accessToken: string,
  folderId = 'root'
): Promise<DriveItemFile[]> => {
  const q = `'${folderId.replace(/'/g, '')}' in parents and mimeType != 'application/vnd.google-apps.folder' and trashed = false`;
  const params = new URLSearchParams({
    q,
    fields: 'files(id, name, mimeType, thumbnailLink, size, modifiedTime, videoMediaMetadata)',
    orderBy: 'createdTime desc',
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
  const rawFiles = Array.isArray(data.files) ? data.files : [];
  const mapped: DriveItemFile[] = [];
  for (const f of rawFiles) {
    const kind = classifyDriveMimeType(f.mimeType || '', f.name || '');
    if (kind) {
      mapped.push({
        ...f,
        kind
      });
    }
  }
  return mapped;
};

export const listDriveImagesInFolder = listDriveFilesInFolder;
