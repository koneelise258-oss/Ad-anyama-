/**
 * Utilitaires de cybersécurité et d'assainissement des entrées/URLs côté client.
 */

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);

/**
 * Valide et assainit une URL pour empêcher toute injection `javascript:`, `vbscript:` ou `data:text/html`.
 */
export const sanitizeUrl = (raw?: string | null, allowDataImage = true): string => {
  if (!raw || typeof raw !== 'string') return '';
  const trimmed = raw.trim();
  if (!trimmed || trimmed === '#') return '';

  // Chemins relatifs locaux autorisés (/uploads/..., /assets/..., /logos/..., /src/...)
  if (
    trimmed.startsWith('/uploads/') ||
    trimmed.startsWith('/assets/') ||
    trimmed.startsWith('/logos/') ||
    trimmed.startsWith('/src/')
  ) {
    return trimmed;
  }

  // Data URLs d'images raster uniquement (bloque SVG/HTML pour éviter XSS)
  if (trimmed.startsWith('data:')) {
    if (!allowDataImage) return '';
    if (/^data:image\/(png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=]+$/i.test(trimmed)) {
      return trimmed;
    }
    return '';
  }

  try {
    const parsed = new URL(trimmed, window.location.origin);
    if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
      return '';
    }
    return parsed.href;
  } catch {
    return '';
  }
};

/**
 * Extrait l'identifiant vidéo YouTube de façon stricte (11 caractères alphanumériques/-/_).
 */
export const extractYoutubeId = (url?: string): string | null => {
  if (!url) return null;
  const match = /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtube-nocookie\.com\/embed\/)([\w-]{11})/.exec(
    url.trim()
  );
  return match ? match[1] : null;
};

/**
 * Convertit tout lien YouTube valide en URL embed respectueuse de la vie privée (youtube-nocookie).
 */
export const toSafeYoutubeEmbed = (url: string): string => {
  const id = extractYoutubeId(url);
  if (!id) return sanitizeUrl(url, false);
  return `https://www.youtube-nocookie.com/embed/${id}`;
};

/**
 * Extrait automatiquement la miniature HD d'une vidéo YouTube.
 */
export const extractYoutubeThumbnail = (url: string): string | null => {
  const id = extractYoutubeId(url);
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
};

/**
 * Nettoie un texte saisi pour éviter les caractères de contrôle invisibles.
 */
export const sanitizeText = (value: string, maxLength = 2000): string => {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLength);
};

/**
 * Évalue la robustesse d'un mot de passe administrateur.
 */
export const validatePasswordStrength = (
  password: string
): { valid: boolean; score: number; label: string; issues: string[] } => {
  const issues: string[] = [];
  if (password.length < 10) issues.push('Au moins 10 caractères');
  if (!/[a-z]/.test(password)) issues.push('Une lettre minuscule');
  if (!/[A-Z]/.test(password)) issues.push('Une lettre majuscule');
  if (!/[0-9]/.test(password)) issues.push('Un chiffre');

  const score = 4 - issues.length;
  const labels = ['Très faible', 'Faible', 'Moyen', 'Bon', 'Fort'];
  return {
    valid: issues.length === 0,
    score,
    label: labels[score] || 'Faible',
    issues
  };
};

/**
 * Formate une taille en octets lisiblement (Ko / Mo).
 */
export const formatFileSize = (bytes: number): string => {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} Mo`;
};

export const isDirectVideoUrl = (url?: string | null): boolean => {
  if (!url) return false;
  return /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url) || url.startsWith('/uploads/');
};

export const isDirectAudioUrl = (url?: string | null): boolean => {
  if (!url) return false;
  return /\.(mp3|wav|m4a|ogg|aac)(\?|$)/i.test(url) || url.startsWith('/uploads/');
};

export const buildDownloadUrl = (rawUrl?: string | null, preferredName?: string): string => {
  const safe = sanitizeUrl(rawUrl);
  if (!safe) return '';
  if (safe.startsWith('/uploads/')) {
    const sep = safe.includes('?') ? '&' : '?';
    const nameParam = preferredName ? `&name=${encodeURIComponent(preferredName)}` : '';
    return `${safe}${sep}download=1${nameParam}`;
  }
  return safe;
};

