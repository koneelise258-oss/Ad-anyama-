import React, { useRef, useState } from 'react';
import { Upload, FolderOpen, FileText, Image as ImageIcon, Music, Video, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { CulteDocument, UploadedFileResult } from '../types';

interface MediaBatchUploaderProps {
  mode: 'photos' | 'documents' | 'audio' | 'video' | 'single-image';
  label?: string;
  helperText?: string;
  allowFolder?: boolean;
  onUploadedFiles: (results: UploadedFileResult[]) => void;
  onUploadedDocuments?: (docs: CulteDocument[]) => void;
}

export const MediaBatchUploader: React.FC<MediaBatchUploaderProps> = ({
  mode,
  label,
  helperText,
  allowFolder = mode === 'photos' || mode === 'documents',
  onUploadedFiles,
  onUploadedDocuments
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number; current: string }>({
    done: 0,
    total: 0,
    current: ''
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [lastSuccessCount, setLastSuccessCount] = useState<number>(0);

  const acceptAttr =
    mode === 'photos' || mode === 'single-image'
      ? 'image/jpeg,image/png,image/webp,image/gif,image/svg+xml'
      : mode === 'documents'
      ? '.pdf,.doc,.docx,.ppt,.pptx,.txt'
      : mode === 'audio'
      ? 'audio/*,.mp3,.m4a,.wav,.ogg'
      : 'video/mp4,video/webm,.mp4,.webm';

  const filterFilesForMode = (rawFiles: File[]): File[] => {
    if (mode === 'photos' || mode === 'single-image') {
      const imgs = rawFiles.filter(
        (f) => f.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|svg)$/i.test(f.name)
      );
      return mode === 'single-image' ? imgs.slice(0, 1) : imgs;
    }
    if (mode === 'documents') {
      return rawFiles.filter((f) => /\.(pdf|docx?|pptx?|txt)$/i.test(f.name));
    }
    if (mode === 'audio') {
      return rawFiles.filter((f) => f.type.startsWith('audio/') || /\.(mp3|m4a|wav|ogg)$/i.test(f.name)).slice(0, 1);
    }
    return rawFiles.filter((f) => f.type.startsWith('video/') || /\.(mp4|webm)$/i.test(f.name)).slice(0, 1);
  };

  const processFiles = async (fileList: FileList | File[] | null) => {
    if (!fileList) return;
    const raw = Array.from(fileList);
    const filtered = filterFilesForMode(raw);
    if (filtered.length === 0) {
      setErrors(['Aucun fichier compatible trouvé dans cette sélection.']);
      return;
    }

    setErrors([]);
    setLastSuccessCount(0);
    setIsUploading(true);
    setProgress({ done: 0, total: filtered.length, current: filtered[0].name });

    const { uploaded, errors: uploadErrors } = await api.uploadBatch(filtered, (done, total, currentName) => {
      setProgress({ done, total, current: currentName });
    });

    setIsUploading(false);
    setErrors(uploadErrors);

    if (uploaded.length > 0) {
      setLastSuccessCount(uploaded.length);
      onUploadedFiles(uploaded);

      if (onUploadedDocuments) {
        const docs: CulteDocument[] = uploaded.map((u, idx) => ({
          id: `doc-${Date.now()}-${idx}`,
          title: u.name,
          fileSize: u.formattedSize,
          type: u.docType === 'diapo' ? 'diapo' : u.docType === 'notes' ? 'notes' : 'pdf',
          downloadUrl: u.url,
          mimeType: u.mimeType
        }));
        onUploadedDocuments(docs);
      }
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
    if (folderInputRef.current) folderInputRef.current.value = '';
  };

  const Icon =
    mode === 'photos' || mode === 'single-image'
      ? ImageIcon
      : mode === 'documents'
      ? FileText
      : mode === 'audio'
      ? Music
      : Video;

  const defaultLabel =
    mode === 'photos'
      ? 'Importer plusieurs photos ou un dossier complet'
      : mode === 'documents'
      ? 'Importer des documents (PDF, Word, PowerPoint)'
      : mode === 'audio'
      ? 'Importer un fichier audio (MP3, M4A, WAV)'
      : mode === 'video'
      ? 'Importer une vidéo (MP4, WebM)'
      : 'Importer une image';

  const folderAttrs = {
    webkitdirectory: '',
    directory: ''
  } as unknown as React.InputHTMLAttributes<HTMLInputElement>;

  return (
    <div className="space-y-2.5">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          processFiles(e.dataTransfer.files);
        }}
        className={`rounded-2xl border-2 border-dashed p-4 sm:p-5 text-center transition-colors ${
          isDragging
            ? 'border-church-blue bg-church-tint/60'
            : 'border-church-line bg-church-light/40 hover:border-church-blue/60'
        }`}
      >
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-church-tint text-church-blue">
            {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Icon className="h-5 w-5" />}
          </div>

          <p className="text-sm font-semibold text-church-navy">{label || defaultLabel}</p>
          {helperText && <p className="text-xs text-church-muted max-w-md">{helperText}</p>}

          {isUploading ? (
            <div className="mt-2 w-full max-w-sm space-y-1.5">
              <div className="flex justify-between text-xs font-medium text-church-navy">
                <span className="truncate max-w-[200px]">{progress.current}</span>
                <span>
                  {progress.done} / {progress.total}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-church-line">
                <div
                  className="h-full rounded-full bg-church-blue transition-all duration-200"
                  style={{ width: `${progress.total ? Math.round((progress.done / progress.total) * 100) : 0}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn-secondary min-h-[38px] px-3.5 text-xs"
              >
                <Upload className="h-3.5 w-3.5 text-church-blue" />
                {mode === 'single-image' || mode === 'audio' || mode === 'video'
                  ? 'Choisir un fichier'
                  : 'Sélectionner des fichiers'}
              </button>

              {allowFolder && (
                <button
                  type="button"
                  onClick={() => folderInputRef.current?.click()}
                  className="btn-secondary min-h-[38px] px-3.5 text-xs"
                >
                  <FolderOpen className="h-3.5 w-3.5 text-church-blue" />
                  Importer un dossier entier
                </button>
              )}
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={acceptAttr}
          multiple={mode === 'photos' || mode === 'documents'}
          className="hidden"
          onChange={(e) => processFiles(e.target.files)}
        />

        {allowFolder && (
          <input
            ref={folderInputRef}
            type="file"
            multiple
            {...folderAttrs}
            className="hidden"
            onChange={(e) => processFiles(e.target.files)}
          />
        )}
      </div>

      {lastSuccessCount > 0 && (
        <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {lastSuccessCount} fichier{lastSuccessCount > 1 ? 's' : ''} envoyé{lastSuccessCount > 1 ? 's' : ''} sur le serveur avec succès.
        </p>
      )}

      {errors.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800 space-y-1">
          <div className="flex items-center gap-1.5 font-semibold">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Certains fichiers n’ont pas pu être importés :
          </div>
          {errors.map((err, i) => (
            <p key={i}>{err}</p>
          ))}
        </div>
      )}
    </div>
  );
};
