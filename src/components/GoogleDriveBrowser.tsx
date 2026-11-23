import React, { useEffect, useMemo, useState } from 'react';
import type { AlbumItem, CulteDocument, LinkedDriveAccount, LinkedDriveFolder, MediaItem } from '../types';
import {
  clearDriveSession,
  connectGoogleDriveAccount,
  formatFirebaseGoogleError,
  getCachedDriveSessions,
  getDriveSessionToken,
  isInsideIframe,
  isStandalonePwa,
  listDriveFolders,
  listDriveFilesInFolder,
  shouldUseRedirectFallback,
  startGoogleDriveRedirect,
  type DriveAccountSession,
  type DriveFileKind,
  type DriveFolderItem,
  type DriveItemFile
} from '../services/googleDrive';
import { api } from '../services/api';
import { formatFileSize } from '../utils/security';
import {
  Folder,
  FolderOpen,
  RefreshCw,
  Check,
  CheckSquare,
  Square,
  Image as ImageIcon,
  Film,
  Headphones,
  FileText,
  ChevronRight,
  ArrowLeft,
  Plus,
  Trash2,
  CloudUpload,
  CheckCircle2,
  AlertTriangle,
  Share2,
  Sparkles,
  ExternalLink
} from 'lucide-react';

interface GoogleDriveBrowserProps {
  linkedAccounts: LinkedDriveAccount[];
  linkedFolders: LinkedDriveFolder[];
  compact?: boolean;
  targetAlbumId?: string;
  defaultCategory?: AlbumItem['category'];
  allowDocuments?: boolean;
  initialMode?: 'group-or-single' | 'document';
  onSyncDriveState: (patch: {
    driveAccounts?: LinkedDriveAccount[];
    driveFolders?: LinkedDriveFolder[];
    albums?: AlbumItem[];
  }) => void;
  onImportedToForm?: (items: MediaItem[], documents?: CulteDocument[]) => void;
  onNotify?: (msg: string, type?: 'ok' | 'err') => void;
}

const formatDurationMs = (msStr?: string): string => {
  const ms = Number(msStr);
  if (!ms || Number.isNaN(ms)) return '';
  const totalSec = Math.round(ms / 1000);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
};

const docMimeLabel = (mime: string, name: string): string => {
  const m = (mime || '').toLowerCase();
  if (m === 'application/vnd.google-apps.document') return 'Google Doc → PDF';
  if (m === 'application/vnd.google-apps.presentation') return 'Google Slides → PDF';
  if (m === 'application/vnd.google-apps.spreadsheet') return 'Google Sheets → PDF';
  if (m === 'application/pdf' || name.toLowerCase().endsWith('.pdf')) return 'Document PDF';
  if (m.includes('word') || /\.docx?$/i.test(name)) return 'Document Word';
  if (m.includes('presentation') || m.includes('powerpoint') || /\.pptx?$/i.test(name)) return 'Présentation';
  if (m.includes('excel') || m.includes('spreadsheet') || /\.xlsx?$/i.test(name)) return 'Tableur';
  return 'Document';
};

export const GoogleDriveBrowser: React.FC<GoogleDriveBrowserProps> = ({
  linkedAccounts,
  linkedFolders,
  compact = false,
  targetAlbumId,
  defaultCategory = 'Cultes',
  allowDocuments = true,
  initialMode = 'group-or-single',
  onSyncDriveState,
  onImportedToForm,
  onNotify
}) => {
  const [sessions, setSessions] = useState<DriveAccountSession[]>(() => getCachedDriveSessions());
  const [activeEmail, setActiveEmail] = useState<string>(() => {
    const cached = getCachedDriveSessions();
    if (cached[0]) return cached[0].email;
    return linkedAccounts[0]?.email || '';
  });

  const [connecting, setConnecting] = useState(false);
  const [loadingDrive, setLoadingDrive] = useState(false);
  const [importing, setImporting] = useState(false);
  const [removingEmail, setRemovingEmail] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [confirmUnlinkEmail, setConfirmUnlinkEmail] = useState<string | null>(null);

  const [importMode, setImportMode] = useState<'group-or-single' | 'document'>(initialMode);
  const [mediaKindFilter, setMediaKindFilter] = useState<'all' | 'photo' | 'video' | 'audio'>('all');

  const [breadcrumbs, setBreadcrumbs] = useState<Array<{ id: string; name: string }>>([{ id: 'root', name: 'Mon Drive' }]);
  const [folders, setFolders] = useState<DriveFolderItem[]>([]);
  const [files, setFiles] = useState<DriveItemFile[]>([]);
  const [selectedFolderIds, setSelectedFolderIds] = useState<string[]>([]);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [albumCategory, setAlbumCategory] = useState<AlbumItem['category']>(defaultCategory);

  const currentFolder = breadcrumbs[breadcrumbs.length - 1] || { id: 'root', name: 'Mon Drive' };
  const activeToken = activeEmail ? getDriveSessionToken(activeEmail) : null;
  const inIframe = isInsideIframe();
  const inStandalonePwa = isStandalonePwa();

  const refreshSessions = () => {
    setSessions(getCachedDriveSessions());
  };

  const loadFolderContents = async (token: string, folderId: string) => {
    setLoadingDrive(true);
    setStatusError(null);
    setSelectedFolderIds([]);
    setSelectedFileIds([]);
    try {
      const [subFolders, folderFiles] = await Promise.all([
        listDriveFolders(token, folderId),
        listDriveFilesInFolder(token, folderId)
      ]);
      setFolders(subFolders);
      setFiles(folderFiles);
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : 'Impossible de lire ce dossier Google Drive.');
    } finally {
      setLoadingDrive(false);
    }
  };

  useEffect(() => {
    if (activeEmail && activeToken) {
      loadFolderContents(activeToken, currentFolder.id);
    } else {
      setFolders([]);
      setFiles([]);
      setSelectedFolderIds([]);
      setSelectedFileIds([]);
    }
  }, [activeEmail, activeToken, currentFolder.id]);

  // Synchroniser activeEmail si la liste des comptes change après suppression
  useEffect(() => {
    const allEmails = new Set([
      ...linkedAccounts.map((a) => a.email.toLowerCase()),
      ...sessions.map((s) => s.email.toLowerCase())
    ]);
    if (activeEmail && !allEmails.has(activeEmail.toLowerCase())) {
      const first = linkedAccounts[0]?.email || sessions[0]?.email || '';
      setActiveEmail(first);
    } else if (!activeEmail && allEmails.size > 0) {
      const first = sessions[0]?.email || linkedAccounts[0]?.email || '';
      if (first) setActiveEmail(first);
    }
  }, [linkedAccounts, sessions, activeEmail]);

  const mediaFiles = useMemo(() => files.filter((f) => f.kind !== 'document'), [files]);
  const documentFiles = useMemo(() => files.filter((f) => f.kind === 'document'), [files]);

  const filteredMediaFiles = useMemo(() => {
    if (mediaKindFilter === 'all') return mediaFiles;
    return mediaFiles.filter((f) => f.kind === mediaKindFilter);
  }, [mediaFiles, mediaKindFilter]);

  const handleConnectAccount = async (loginHint?: string) => {
    setConnecting(true);
    setStatusError(null);

    if (inStandalonePwa && !inIframe) {
      try {
        await startGoogleDriveRedirect(loginHint);
        return;
      } catch (err) {
        setConnecting(false);
        setStatusError(err instanceof Error ? err.message : 'Impossible de lancer la redirection Google Drive.');
        return;
      }
    }

    try {
      const session = await connectGoogleDriveAccount(loginHint);
      refreshSessions();
      setActiveEmail(session.email);
      setBreadcrumbs([{ id: 'root', name: 'Mon Drive' }]);

      const saved = await api.saveDriveAccount({
        email: session.email,
        displayName: session.displayName,
        photoLink: session.photoLink
      });
      onSyncDriveState({ driveAccounts: saved.driveAccounts });
      onNotify?.(`Compte Google Drive relié : ${session.email}`);
    } catch (err: any) {
      if (shouldUseRedirectFallback(err) && !inIframe) {
        try {
          await startGoogleDriveRedirect(loginHint);
          return;
        } catch {
          // continue to error handling below
        }
      }

      const formatted = formatFirebaseGoogleError(err, inIframe);
      const message =
        !formatted.isUnauthorizedDomain && !formatted.isPopupOrTestIssue && err instanceof Error && err.message
          ? err.message
          : formatted.message;
      setStatusError(message);
      onNotify?.(message, 'err');
    } finally {
      setConnecting(false);
    }
  };

  const handleRemoveAccount = async (email: string) => {
    const normalized = email.toLowerCase();
    setRemovingEmail(normalized);
    setStatusError(null);
    try {
      const res = await api.removeDriveAccount(normalized);
      await clearDriveSession(normalized);
      refreshSessions();
      onSyncDriveState({ driveAccounts: res.driveAccounts });
      setConfirmUnlinkEmail(null);
      if (activeEmail.toLowerCase() === normalized) {
        const remaining = res.driveAccounts[0]?.email || getCachedDriveSessions()[0]?.email || '';
        setActiveEmail(remaining);
        setBreadcrumbs([{ id: 'root', name: 'Mon Drive' }]);
      }
      onNotify?.(`Compte Google Drive ${email} supprimé.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la suppression du compte Drive.';
      setStatusError(msg);
      onNotify?.(msg, 'err');
    } finally {
      setRemovingEmail(null);
    }
  };

  const toggleFolderSelect = (folderId: string) => {
    setSelectedFolderIds((prev) => (prev.includes(folderId) ? prev.filter((id) => id !== folderId) : [...prev, folderId]));
  };

  const toggleFileSelect = (fileId: string) => {
    setSelectedFileIds((prev) => (prev.includes(fileId) ? prev.filter((id) => id !== fileId) : [...prev, fileId]));
  };

  const allFoldersSelected = folders.length > 0 && folders.every((f) => selectedFolderIds.includes(f.id));
  const toggleSelectAllFolders = () => {
    if (allFoldersSelected) {
      setSelectedFolderIds([]);
    } else {
      setSelectedFolderIds(folders.map((f) => f.id));
    }
  };

  const visibleSelectableFiles = importMode === 'document' ? documentFiles : filteredMediaFiles;
  const allVisibleFilesSelected =
    visibleSelectableFiles.length > 0 && visibleSelectableFiles.every((f) => selectedFileIds.includes(f.id));

  const toggleSelectAllFiles = () => {
    if (allVisibleFilesSelected) {
      const visibleSet = new Set(visibleSelectableFiles.map((f) => f.id));
      setSelectedFileIds((prev) => prev.filter((id) => !visibleSet.has(id)));
    } else {
      setSelectedFileIds(visibleSelectableFiles.map((f) => f.id));
    }
  };

  const handleImportSelectedFolders = async () => {
    if (!activeToken || !activeEmail || selectedFolderIds.length === 0) return;
    setImporting(true);
    setStatusError(null);
    let totalMedia = 0;
    let totalDocs = 0;
    let totalSkipped = 0;
    try {
      for (const fId of selectedFolderIds) {
        const folderObj = folders.find((f) => f.id === fId);
        const res = await api.importFromDrive(activeToken, {
          accountEmail: activeEmail,
          folderId: fId,
          folderName: folderObj?.name || 'Dossier Google Drive',
          importKind: 'all',
          createAlbum: !onImportedToForm && !targetAlbumId,
          albumId: targetAlbumId,
          albumTitle: folderObj?.name || 'Album Google Drive',
          albumCategory
        });
        totalMedia += res.imported.length;
        totalDocs += (res.importedDocuments || []).length;
        totalSkipped += res.skippedCount || 0;
        onSyncDriveState({
          albums: res.albums,
          driveFolders: res.driveFolders,
          driveAccounts: res.driveAccounts
        });
        if (onImportedToForm && (res.imported.length > 0 || (res.importedDocuments || []).length > 0)) {
          onImportedToForm(res.imported, res.importedDocuments || []);
        }
      }
      setSelectedFolderIds([]);
      if (totalMedia === 0 && totalDocs === 0 && totalSkipped > 0) {
        onNotify?.('Ces médias sont déjà présents dans l’album sélectionné.');
      } else {
        onNotify?.(
          `Importation réussie : ${totalMedia} média(s)${totalDocs > 0 ? ` et ${totalDocs} document(s)` : ''} importé(s).`
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur d’importation Google Drive.';
      setStatusError(msg);
      onNotify?.(msg, 'err');
    } finally {
      setImporting(false);
    }
  };

  const handleImportFiles = async (pickedFiles: DriveItemFile[], importKind: 'media' | 'document' | 'all') => {
    if (!activeToken || !activeEmail || pickedFiles.length === 0) {
      onNotify?.('Aucun élément sélectionné pour l’importation.', 'err');
      return;
    }

    setImporting(true);
    setStatusError(null);
    try {
      const folderIdForApi =
        currentFolder.id === 'root' || currentFolder.id === 'sharedWithMe' || currentFolder.id === 'recentPhotos'
          ? undefined
          : currentFolder.id;

      // Découper en petits lots pour éviter tout dépassement de délai serveur (Vercel) sur les photos/vidéos
      const batches: DriveItemFile[][] = [];
      let currentPhotoBatch: DriveItemFile[] = [];
      for (const f of pickedFiles) {
        if (f.kind === 'video' || f.kind === 'audio' || f.kind === 'document') {
          if (currentPhotoBatch.length > 0) {
            batches.push(currentPhotoBatch);
            currentPhotoBatch = [];
          }
          batches.push([f]);
        } else {
          currentPhotoBatch.push(f);
          if (currentPhotoBatch.length >= 4) {
            batches.push(currentPhotoBatch);
            currentPhotoBatch = [];
          }
        }
      }
      if (currentPhotoBatch.length > 0) batches.push(currentPhotoBatch);

      let activeAlbumId = targetAlbumId;
      const shouldCreateAlbum = !onImportedToForm && !targetAlbumId && importKind !== 'document';
      let totalMediaCount = 0;
      let totalDocsCount = 0;
      let totalSkipped = 0;
      const aggregatedMedia: MediaItem[] = [];
      const aggregatedDocs: CulteDocument[] = [];

      for (const batch of batches) {
        const res = await api.importFromDrive(activeToken, {
          accountEmail: activeEmail,
          folderId: folderIdForApi,
          folderName: currentFolder.name,
          importKind,
          files: batch.map((f) => ({
            id: f.id,
            name: f.name,
            mimeType: f.mimeType,
            thumbnailLink: f.thumbnailLink
          })),
          createAlbum: shouldCreateAlbum && !activeAlbumId,
          albumId: activeAlbumId,
          albumTitle:
            folderIdForApi ? currentFolder.name : currentFolder.id === 'recentPhotos' ? 'Photos Google Drive' : 'Médias Google Drive',
          albumCategory
        });

        if (res.album?.id && !activeAlbumId) {
          activeAlbumId = res.album.id;
        }
        totalMediaCount += res.imported.length;
        totalDocsCount += (res.importedDocuments || []).length;
        totalSkipped += res.skippedCount || 0;
        aggregatedMedia.push(...res.imported);
        aggregatedDocs.push(...(res.importedDocuments || []));

        onSyncDriveState({
          albums: res.albums,
          driveFolders: res.driveFolders,
          driveAccounts: res.driveAccounts
        });
      }

      if (onImportedToForm && (aggregatedMedia.length > 0 || aggregatedDocs.length > 0)) {
        onImportedToForm(aggregatedMedia, aggregatedDocs);
      }
      setSelectedFileIds([]);

      if (totalMediaCount === 0 && totalDocsCount === 0 && totalSkipped > 0) {
        onNotify?.(`Ces ${totalSkipped} élément(s) étaient déjà importés dans cet album.`);
      } else {
        onNotify?.(
          `Importation Google Drive réussie : ${
            totalDocsCount > 0 && totalMediaCount === 0
              ? `${totalDocsCount} document(s) entier(s)`
              : `${totalMediaCount} média(s)${totalDocsCount > 0 ? ` et ${totalDocsCount} document(s)` : ''}`
          }${totalSkipped > 0 ? ` (${totalSkipped} déjà présent(s))` : ''}.`
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de l’importation Google Drive.';
      setStatusError(msg);
      onNotify?.(msg, 'err');
    } finally {
      setImporting(false);
    }
  };

  const handleResyncLinkedFolder = async (folder: LinkedDriveFolder) => {
    let token = getDriveSessionToken(folder.accountEmail);
    if (!token) {
      try {
        const session = await connectGoogleDriveAccount(folder.accountEmail);
        refreshSessions();
        token = session.accessToken;
        setActiveEmail(session.email);
      } catch (err) {
        onNotify?.(err instanceof Error ? err.message : 'Connexion au compte Google annulée.', 'err');
        return;
      }
    }
    setImporting(true);
    try {
      const res = await api.importFromDrive(token, {
        accountEmail: folder.accountEmail,
        folderId: folder.folderId,
        folderName: folder.folderName,
        importKind: 'media',
        albumId: folder.albumId
      });
      onSyncDriveState({
        albums: res.albums,
        driveFolders: res.driveFolders,
        driveAccounts: res.driveAccounts
      });
      onNotify?.(
        res.imported.length > 0
          ? `${res.imported.length} nouveau(x) média(s) ajouté(s) à « ${folder.albumTitle} ».`
          : `L’album « ${folder.albumTitle} » est déjà à jour avec Google Drive.`
      );
    } catch (err) {
      onNotify?.(err instanceof Error ? err.message : 'Erreur de resynchronisation.', 'err');
    } finally {
      setImporting(false);
    }
  };

  const mergedAccounts: Array<LinkedDriveAccount & { isOnline: boolean }> = [];
  const seenEmails = new Set<string>();
  for (const acc of linkedAccounts) {
    const lower = acc.email.toLowerCase();
    seenEmails.add(lower);
    mergedAccounts.push({ ...acc, isOnline: Boolean(getDriveSessionToken(lower)) });
  }
  for (const s of sessions) {
    const lower = s.email.toLowerCase();
    if (!seenEmails.has(lower)) {
      mergedAccounts.push({
        email: s.email,
        displayName: s.displayName,
        photoLink: s.photoLink,
        addedAt: new Date(s.connectedAt).toISOString(),
        isOnline: true
      });
    }
  }

  const kindIcon = (kind: DriveFileKind) => {
    if (kind === 'video') return <Film className="h-5 w-5 text-church-blue" />;
    if (kind === 'audio') return <Headphones className="h-5 w-5 text-church-blue" />;
    if (kind === 'document') return <FileText className="h-5 w-5 text-church-blue" />;
    return <ImageIcon className="h-5 w-5 text-church-blue" />;
  };

  const currentRootId = breadcrumbs[0]?.id || 'root';
  const selectRootScope = (scope: 'root' | 'sharedWithMe' | 'recentPhotos', label: string) => {
    setBreadcrumbs([{ id: scope, name: label }]);
  };

  const openInNewTabUrl =
    typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}#/portail-eeadci` : '#';

  return (
    <div className="space-y-5">
      {/* Barre multi-comptes Google Drive */}
      <div className="rounded-2xl border border-church-line bg-church-light/60 p-4 sm:p-5 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-serif text-lg sm:text-xl text-church-navy">
              Comptes Google Drive reliés ({mergedAccounts.length})
            </h3>
            <p className="text-xs sm:text-sm text-church-muted">
              Lors de la connexion Google, cochez bien la case d’accès à Google Drive, puis sélectionnez vos photos, vidéos ou documents à importer.
            </p>
          </div>

          <button
            type="button"
            disabled={connecting}
            onClick={() => handleConnectAccount()}
            className="inline-flex min-h-[44px] items-center justify-center gap-2.5 rounded-xl border border-[#747775]/40 bg-white px-4 py-2 text-sm font-medium text-[#1F1F1F] shadow-xs transition-colors hover:bg-gray-50 disabled:opacity-60 whitespace-nowrap shrink-0"
          >
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
            </svg>
            <span>
              {connecting
                ? 'Connexion en cours...'
                : mergedAccounts.length > 0
                ? 'Ajouter un autre compte Google'
                : 'Connecter Google Drive'}
            </span>
          </button>
        </div>

        {mergedAccounts.length > 0 && (
          <div className="grid gap-2.5 sm:grid-cols-2">
            {mergedAccounts.map((acc) => {
              const lower = acc.email.toLowerCase();
              const selected = activeEmail.toLowerCase() === lower;
              const isConfirming = confirmUnlinkEmail === lower;
              const isRemoving = removingEmail === lower;
              return (
                <div
                  key={acc.email}
                  className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3 transition-colors ${
                    selected ? 'border-church-blue bg-white shadow-2xs' : 'border-church-line bg-white/80'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setActiveEmail(lower);
                      setBreadcrumbs([{ id: 'root', name: 'Mon Drive' }]);
                    }}
                    className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                  >
                    {acc.photoLink ? (
                      <img src={acc.photoLink} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
                    ) : (
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-church-tint text-sm font-semibold text-church-navy">
                        {(acc.displayName || acc.email).charAt(0).toUpperCase()}
                      </span>
                    )}
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-church-navy">{acc.displayName}</span>
                      <span className="block truncate text-xs text-church-muted">{acc.email}</span>
                    </span>
                  </button>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {acc.isOnline ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 px-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Actif
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={connecting}
                        onClick={() => handleConnectAccount(acc.email)}
                        className="btn-secondary min-h-[36px] px-2.5 text-xs"
                      >
                        Reconnecter
                      </button>
                    )}

                    {isConfirming ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={isRemoving}
                          onClick={() => handleRemoveAccount(acc.email)}
                          className="btn-primary min-h-[34px] bg-red-600 hover:bg-red-700 px-2.5 text-xs"
                        >
                          {isRemoving ? 'Suppression…' : 'Supprimer'}
                        </button>
                        <button
                          type="button"
                          disabled={isRemoving}
                          onClick={() => setConfirmUnlinkEmail(null)}
                          className="btn-ghost min-h-[34px] px-2 text-xs"
                        >
                          Annuler
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmUnlinkEmail(lower)}
                        className="inline-flex h-9 items-center gap-1 rounded-lg px-2 text-xs font-medium text-red-700 hover:bg-red-50"
                        title={`Supprimer le compte ${acc.email}`}
                        aria-label={`Supprimer ${acc.email}`}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="hidden sm:inline">Supprimer</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {statusError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs sm:text-sm text-red-900 space-y-2">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{statusError}</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 pl-6">
            {activeEmail && (
              <button
                type="button"
                disabled={connecting}
                onClick={() => handleConnectAccount(activeEmail)}
                className="btn-secondary min-h-[34px] px-3 text-xs border-red-300 text-red-900 hover:bg-red-100"
              >
                Reconnecter {activeEmail}
              </button>
            )}
            {inIframe && (
              <a
                href={openInNewTabUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-church-navy underline"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Ouvrir dans un nouvel onglet
              </a>
            )}
            <a
              href="https://console.cloud.google.com/auth/audience?project=gen-lang-client-0797796121"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold underline text-red-900"
            >
              Google Cloud Console → Utilisateurs tests
            </a>
          </div>
        </div>
      )}

      {/* Explorateur Google Drive avec accès rapide et sélection intuitive */}
      {activeEmail && activeToken ? (
        <div className="rounded-2xl border border-church-line bg-white p-4 sm:p-5 space-y-4">
          {/* Emplacements rapides Google Drive */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => selectRootScope('root', 'Mon Drive')}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  currentRootId === 'root'
                    ? 'border-church-blue bg-church-tint text-church-navy'
                    : 'border-church-line bg-white text-church-muted hover:text-church-navy'
                }`}
              >
                <Folder className="h-3.5 w-3.5 text-church-blue" />
                Mon Drive
              </button>
              <button
                type="button"
                onClick={() => selectRootScope('recentPhotos', 'Toutes les photos & vidéos')}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  currentRootId === 'recentPhotos'
                    ? 'border-church-blue bg-church-tint text-church-navy'
                    : 'border-church-line bg-white text-church-muted hover:text-church-navy'
                }`}
              >
                <Sparkles className="h-3.5 w-3.5 text-church-blue" />
                Toutes mes photos & vidéos
              </button>
              <button
                type="button"
                onClick={() => selectRootScope('sharedWithMe', 'Partagés avec moi')}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  currentRootId === 'sharedWithMe'
                    ? 'border-church-blue bg-church-tint text-church-navy'
                    : 'border-church-line bg-white text-church-muted hover:text-church-navy'
                }`}
              >
                <Share2 className="h-3.5 w-3.5 text-church-blue" />
                Partagés avec moi
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {!onImportedToForm && !targetAlbumId && importMode === 'group-or-single' && (
                <select
                  value={albumCategory}
                  onChange={(e) => setAlbumCategory(e.target.value as AlbumItem['category'])}
                  className="field min-h-[36px] py-1 text-xs w-auto"
                  aria-label="Catégorie d'album"
                >
                  <option value="Cultes">Catégorie : Cultes</option>
                  <option value="Événements">Catégorie : Événements</option>
                  <option value="Jeunesse">Catégorie : Jeunesse</option>
                  <option value="Chorale & Louange">Catégorie : Chorale & Louange</option>
                  <option value="Femmes MIFA">Catégorie : Femmes MIFA</option>
                  <option value="Départements">Catégorie : Départements</option>
                </select>
              )}
              <button
                type="button"
                onClick={() => loadFolderContents(activeToken, currentFolder.id)}
                disabled={loadingDrive}
                className="btn-secondary min-h-[36px] px-3 text-xs"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loadingDrive ? 'animate-spin' : ''}`} />
                Actualiser
              </button>
            </div>
          </div>

          {/* Choix du mode d'importation Google Drive */}
          {allowDocuments && (
            <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-church-light p-1 border border-church-line w-fit">
              <button
                type="button"
                onClick={() => {
                  setImportMode('group-or-single');
                  setSelectedFileIds([]);
                }}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                  importMode === 'group-or-single'
                    ? 'bg-church-navy text-white shadow-xs'
                    : 'text-church-dark hover:bg-white'
                }`}
              >
                <FolderOpen className="h-3.5 w-3.5" />
                Photos, vidéos & audios ({mediaFiles.length})
              </button>

              <button
                type="button"
                onClick={() => {
                  setImportMode('document');
                  setSelectedFileIds([]);
                  setSelectedFolderIds([]);
                }}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                  importMode === 'document'
                    ? 'bg-church-navy text-white shadow-xs'
                    : 'text-church-dark hover:bg-white'
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                Document entier ({documentFiles.length})
              </button>
            </div>
          )}

          {/* Fil d'Ariane dossiers */}
          <div className="flex flex-wrap items-center gap-1.5 border-b border-church-line pb-2.5 text-sm">
            {breadcrumbs.length > 1 && (
              <button
                type="button"
                onClick={() => setBreadcrumbs((prev) => prev.slice(0, -1))}
                className="btn-secondary min-h-[34px] px-2.5 text-xs mr-1"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Retour
              </button>
            )}
            {breadcrumbs.map((b, idx) => (
              <React.Fragment key={b.id}>
                {idx > 0 && <ChevronRight className="h-3.5 w-3.5 text-church-muted" />}
                <button
                  type="button"
                  onClick={() => setBreadcrumbs((prev) => prev.slice(0, idx + 1))}
                  className={`rounded-lg px-2 py-1 text-xs sm:text-sm ${
                    idx === breadcrumbs.length - 1 ? 'font-semibold text-church-navy bg-church-light' : 'text-church-blue hover:underline'
                  }`}
                >
                  {b.name}
                </button>
              </React.Fragment>
            ))}
          </div>

          {loadingDrive ? (
            <div className="py-10 text-center text-sm text-church-muted">Chargement de Google Drive…</div>
          ) : (
            <>
              {/* Sous-dossiers Google Drive */}
              {folders.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-church-muted">
                        Dossiers ({folders.length})
                      </p>
                      {importMode === 'group-or-single' && (
                        <button
                          type="button"
                          onClick={toggleSelectAllFolders}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-church-blue hover:underline"
                        >
                          {allFoldersSelected ? (
                            <>
                              <CheckSquare className="h-3.5 w-3.5" /> Tout désélectionner
                            </>
                          ) : (
                            <>
                              <Square className="h-3.5 w-3.5" /> Tout sélectionner ({folders.length})
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {importMode === 'group-or-single' && selectedFolderIds.length > 0 && (
                      <button
                        type="button"
                        disabled={importing}
                        onClick={handleImportSelectedFolders}
                        className="btn-primary min-h-[38px] text-xs"
                      >
                        <CloudUpload className="h-4 w-4" />
                        {importing
                          ? 'Importation en cours…'
                          : `Importer ${selectedFolderIds.length} dossier(s) entier(s)`}
                      </button>
                    )}
                  </div>

                  <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                    {folders.map((folder) => {
                      const isChecked = selectedFolderIds.includes(folder.id);
                      return (
                        <div
                          key={folder.id}
                          className={`flex items-center justify-between gap-2 rounded-xl border p-2.5 transition-colors ${
                            isChecked ? 'border-church-blue bg-church-tint/40' : 'border-church-line hover:bg-church-light/60'
                          }`}
                        >
                          {importMode === 'group-or-single' && (
                            <button
                              type="button"
                              onClick={() => toggleFolderSelect(folder.id)}
                              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${
                                isChecked ? 'border-church-blue bg-church-blue text-white' : 'border-church-line bg-white'
                              }`}
                              aria-label={`Cocher le dossier ${folder.name}`}
                              title="Cocher pour importer tout le contenu de ce dossier"
                            >
                              {isChecked && <Check className="h-4 w-4" />}
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setBreadcrumbs((prev) => [...prev, { id: folder.id, name: folder.name }])}
                            className="flex min-w-0 flex-1 items-center gap-2 py-1 text-left"
                          >
                            <Folder className="h-4 w-4 shrink-0 text-church-blue" />
                            <span className="truncate text-sm font-medium text-church-navy">{folder.name}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setBreadcrumbs((prev) => [...prev, { id: folder.id, name: folder.name }])}
                            className="text-xs font-medium text-church-blue hover:underline px-1.5"
                          >
                            Ouvrir
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* MODE DOCUMENT ENTIER */}
              {importMode === 'document' && allowDocuments && (
                <div className="space-y-3 pt-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-church-muted">
                        Documents dans « {currentFolder.name} » ({documentFiles.length})
                      </p>
                      {documentFiles.length > 0 && (
                        <button
                          type="button"
                          onClick={toggleSelectAllFiles}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-church-blue hover:underline"
                        >
                          {allVisibleFilesSelected ? (
                            <>
                              <CheckSquare className="h-3.5 w-3.5" /> Tout désélectionner
                            </>
                          ) : (
                            <>
                              <Square className="h-3.5 w-3.5" /> Tout sélectionner ({documentFiles.length})
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {selectedFileIds.length > 0 && (
                      <button
                        type="button"
                        disabled={importing}
                        onClick={() =>
                          handleImportFiles(
                            documentFiles.filter((d) => selectedFileIds.includes(d.id)),
                            'document'
                          )
                        }
                        className="btn-primary min-h-[38px] text-xs"
                      >
                        <CloudUpload className="h-4 w-4" />
                        {importing ? 'Import en cours…' : `Importer ${selectedFileIds.length} document(s) entier(s)`}
                      </button>
                    )}
                  </div>

                  {documentFiles.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-church-line py-6 text-center text-xs sm:text-sm text-church-muted">
                      Aucun document (PDF, Word, Google Docs…) trouvé directement dans ce dossier.
                    </p>
                  ) : (
                    <ul className="divide-y divide-church-line rounded-xl border border-church-line">
                      {documentFiles.map((doc) => {
                        const picked = selectedFileIds.includes(doc.id);
                        return (
                          <li key={doc.id} className="flex flex-wrap items-center justify-between gap-3 p-3 hover:bg-church-light/40">
                            <button
                              type="button"
                              onClick={() => toggleFileSelect(doc.id)}
                              className="flex min-w-0 flex-1 items-center gap-3 text-left"
                            >
                              <span
                                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${
                                  picked ? 'border-church-blue bg-church-blue text-white' : 'border-church-line bg-white'
                                }`}
                              >
                                {picked && <Check className="h-3.5 w-3.5" />}
                              </span>
                              <FileText className="h-5 w-5 shrink-0 text-church-blue" />
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-church-navy">{doc.name}</p>
                                <p className="text-xs text-church-muted">
                                  {docMimeLabel(doc.mimeType, doc.name)}
                                  {doc.size ? ` · ${formatFileSize(Number(doc.size))}` : ''}
                                </p>
                              </div>
                            </button>
                            <button
                              type="button"
                              disabled={importing}
                              onClick={() => handleImportFiles([doc], 'document')}
                              className="btn-secondary min-h-[36px] px-3 text-xs shrink-0"
                            >
                              <CloudUpload className="h-3.5 w-3.5 text-church-blue" />
                              {importing ? 'Import…' : 'Importer'}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              )}

              {/* MODE PHOTOS / VIDÉOS / AUDIOS */}
              {importMode === 'group-or-single' && (
                <div className="space-y-3 pt-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-church-muted">
                        Fichiers ({filteredMediaFiles.length})
                      </p>
                      {filteredMediaFiles.length > 0 && (
                        <button
                          type="button"
                          onClick={toggleSelectAllFiles}
                          className="inline-flex items-center gap-1 rounded-lg border border-church-line bg-church-light px-2.5 py-1 text-xs font-semibold text-church-navy hover:bg-church-tint"
                        >
                          {allVisibleFilesSelected ? (
                            <>
                              <CheckSquare className="h-3.5 w-3.5 text-church-blue" /> Tout désélectionner
                            </>
                          ) : (
                            <>
                              <Square className="h-3.5 w-3.5 text-church-blue" /> Tout sélectionner ({filteredMediaFiles.length})
                            </>
                          )}
                        </button>
                      )}
                      <div className="flex items-center gap-1 rounded-lg bg-church-light p-0.5 border border-church-line">
                        {(
                          [
                            { id: 'all', label: `Tout (${mediaFiles.length})` },
                            { id: 'photo', label: `Photos (${mediaFiles.filter((f) => f.kind === 'photo').length})` },
                            { id: 'video', label: `Vidéos (${mediaFiles.filter((f) => f.kind === 'video').length})` },
                            { id: 'audio', label: `Audios (${mediaFiles.filter((f) => f.kind === 'audio').length})` }
                          ] as const
                        ).map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setMediaKindFilter(t.id)}
                            className={`rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                              mediaKindFilter === t.id ? 'bg-white text-church-navy shadow-2xs' : 'text-church-muted hover:text-church-navy'
                            }`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {selectedFileIds.length > 0 && (
                        <button
                          type="button"
                          disabled={importing}
                          onClick={() =>
                            handleImportFiles(
                              mediaFiles.filter((m) => selectedFileIds.includes(m.id)),
                              'media'
                            )
                          }
                          className="btn-primary min-h-[38px] text-xs"
                        >
                          <Plus className="h-4 w-4" />
                          {importing ? 'Import en cours…' : `Importer la sélection (${selectedFileIds.length})`}
                        </button>
                      )}
                      {filteredMediaFiles.length > 0 && (
                        <button
                          type="button"
                          disabled={importing}
                          onClick={() => handleImportFiles(filteredMediaFiles, 'media')}
                          className="btn-secondary min-h-[38px] text-xs border-church-blue text-church-navy"
                        >
                          <CloudUpload className="h-4 w-4 text-church-blue" />
                          {importing ? 'Import en cours…' : `Tout importer (${filteredMediaFiles.length})`}
                        </button>
                      )}
                    </div>
                  </div>

                  {filteredMediaFiles.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-church-line py-6 px-4 text-center space-y-2">
                      <p className="text-xs sm:text-sm text-church-muted">
                        Aucun média affiché directement dans « {currentFolder.name} ».
                      </p>
                      {currentRootId !== 'recentPhotos' && (
                        <button
                          type="button"
                          onClick={() => selectRootScope('recentPhotos', 'Toutes les photos & vidéos')}
                          className="btn-secondary min-h-[36px] text-xs"
                        >
                          <Sparkles className="h-3.5 w-3.5 text-church-blue" />
                          Afficher toutes mes photos & vidéos Drive
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className={`grid gap-2.5 ${compact ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2 sm:grid-cols-4 md:grid-cols-5'}`}>
                      {filteredMediaFiles.map((item) => {
                        const picked = selectedFileIds.includes(item.id);
                        const dur = formatDurationMs(item.videoMediaMetadata?.durationMillis);
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => toggleFileSelect(item.id)}
                            className={`group relative overflow-hidden rounded-xl border text-left transition-all ${
                              picked ? 'border-church-blue ring-2 ring-church-blue/40 bg-church-tint/20' : 'border-church-line hover:border-church-blue/50'
                            }`}
                          >
                            {item.thumbnailLink && item.kind === 'photo' ? (
                              <img
                                src={item.thumbnailLink}
                                alt={item.name}
                                referrerPolicy="no-referrer"
                                className="aspect-square w-full object-cover bg-church-light"
                              />
                            ) : (
                              <div className="flex aspect-square w-full flex-col items-center justify-center gap-1.5 bg-church-light px-2 text-center text-church-navy">
                                {item.thumbnailLink && item.kind === 'video' ? (
                                  <div className="relative h-full w-full">
                                    <img
                                      src={item.thumbnailLink}
                                      alt={item.name}
                                      referrerPolicy="no-referrer"
                                      className="h-full w-full object-cover"
                                    />
                                    <span className="absolute inset-0 flex items-center justify-center bg-black/35">
                                      <Film className="h-6 w-6 text-white" />
                                    </span>
                                  </div>
                                ) : (
                                  <>
                                    {kindIcon(item.kind)}
                                    <span className="text-[11px] font-semibold uppercase tracking-wide text-church-blue">
                                      {item.kind === 'video' ? 'Vidéo' : item.kind === 'audio' ? 'Audio' : 'Photo'}
                                      {dur ? ` · ${dur}` : ''}
                                    </span>
                                  </>
                                )}
                              </div>
                            )}

                            <span
                              className={`absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full border shadow-xs ${
                                picked ? 'border-church-blue bg-church-blue text-white' : 'border-white/90 bg-black/45 text-white'
                              }`}
                            >
                              {picked && <Check className="h-3.5 w-3.5" />}
                            </span>
                            <span className="block truncate bg-white px-2 py-1 text-[11px] font-medium text-church-dark">
                              {item.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      ) : activeEmail ? (
        <div className="rounded-2xl border border-dashed border-church-line bg-white p-6 text-center space-y-3">
          <p className="text-sm text-church-dark">
            Pour parcourir les dossiers et photos de <strong>{activeEmail}</strong>, reconnectez votre session Google Drive en un clic.
          </p>
          <button
            type="button"
            disabled={connecting}
            onClick={() => handleConnectAccount(activeEmail)}
            className="btn-primary text-sm"
          >
            Reconnecter {activeEmail}
          </button>
        </div>
      ) : null}

      {/* Dossiers Drive déjà synchronisés avec le site */}
      {!compact && linkedFolders.length > 0 && (
        <div className="rounded-2xl border border-church-line bg-white p-4 sm:p-5 space-y-3">
          <h3 className="font-serif text-lg text-church-navy">Dossiers Drive synchronisés sur le site</h3>
          <div className="divide-y divide-church-line">
            {linkedFolders.map((lf) => (
              <div key={`${lf.accountEmail}:${lf.folderId}`} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium text-church-navy truncate">
                    {lf.folderName} → Album « {lf.albumTitle} »
                  </p>
                  <p className="text-xs text-church-muted">
                    {lf.accountEmail} · {lf.photoCount} média(s) · Mis à jour le{' '}
                    {new Date(lf.lastSyncedAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={importing}
                  onClick={() => handleResyncLinkedFolder(lf)}
                  className="btn-secondary min-h-[38px] text-xs shrink-0"
                >
                  <RefreshCw className={`h-3.5 w-3.5 text-church-blue ${importing ? 'animate-spin' : ''}`} />
                  Resynchroniser les nouveaux médias
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
