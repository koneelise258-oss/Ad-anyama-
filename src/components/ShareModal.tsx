import React, { useEffect, useState } from 'react';
import { X, Check, Copy, MessageCircle, Facebook, Send, Share2 } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  url: string;
  summary?: string;
}

/** Fenêtre de partage (utilisée sur ordinateur ; sur téléphone le menu du système s’ouvre directement). */
export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, title, url, summary }) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setCopied(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const text = `${title}\n${summary ? summary.slice(0, 140) + '…\n' : ''}`;
  const encodedText = encodeURIComponent(`${text}${url}`);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const input = document.getElementById('share-url') as HTMLInputElement | null;
      input?.select();
      document.execCommand?.('copy');
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const options = [
    { label: 'WhatsApp', icon: MessageCircle, href: `https://api.whatsapp.com/send?text=${encodedText}`, external: true },
    { label: 'Facebook', icon: Facebook, href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, external: true },
    { label: 'SMS', icon: Send, href: `sms:?body=${encodedText}`, external: false }
  ];

  return (
    <div className="fixed inset-0 z-[65] flex items-end justify-center bg-church-navy/50 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="w-full rounded-t-xl bg-white p-5 pb-8 sm:max-w-md sm:rounded-xl sm:pb-5"
        role="dialog"
        aria-modal="true"
        aria-labelledby="partage-titre"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="partage-titre" className="text-2xl">
            Partager
          </h2>
          <button onClick={onClose} className="-mr-2 -mt-1 rounded-md p-2 text-church-muted hover:text-church-navy" aria-label="Fermer">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-1 line-clamp-2 text-church-muted">{title}</p>

        <ul className="mt-4 grid grid-cols-3 gap-2">
          {options.map(({ label, icon: Icon, href, external }) => (
            <li key={label}>
              <a
                href={href}
                {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                className="flex flex-col items-center gap-2 rounded-lg border border-church-line p-3 text-sm font-medium text-church-navy hover:border-church-blue"
              >
                <Icon className="h-6 w-6 text-church-blue" aria-hidden="true" />
                {label}
              </a>
            </li>
          ))}
        </ul>

        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <button
            onClick={() => navigator.share({ title, text: summary, url }).catch(() => {})}
            className="btn-secondary mt-3 w-full"
          >
            <Share2 className="h-4 w-4 text-church-blue" aria-hidden="true" /> Autres applications
          </button>
        )}

        <label htmlFor="share-url" className="mt-5 block text-sm font-medium">
          Lien direct
        </label>
        <div className="mt-1 flex gap-2">
          <input id="share-url" readOnly value={url} className="field min-w-0 flex-1 text-sm" onFocus={(e) => e.target.select()} />
          <button onClick={copy} className="btn-primary shrink-0">
            {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
            {copied ? 'Copié' : 'Copier'}
          </button>
        </div>
      </div>
    </div>
  );
};
