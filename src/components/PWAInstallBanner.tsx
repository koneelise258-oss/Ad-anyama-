import React, { useState } from 'react';
import { Download, Smartphone, WifiOff, X } from 'lucide-react';
import { useOnlineStatus, usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  compact?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) return null;

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className={
          compact
            ? 'btn-secondary px-3 text-xs sm:text-sm'
            : 'btn-primary w-full text-sm'
        }
        aria-label="Installer l’application sur cet appareil"
      >
        <Download className="h-4 w-4 text-current" aria-hidden="true" />
        <span className={compact ? 'hidden md:inline' : ''}>Installer l’app</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className={
            compact
              ? 'btn-secondary px-3 text-xs'
              : 'btn-secondary w-full text-sm'
          }
          aria-label="Installer l’application sur iPhone ou iPad"
        >
          <Smartphone className="h-4 w-4 text-church-blue" aria-hidden="true" />
          <span className={compact ? 'hidden md:inline' : ''}>Installer sur iOS</span>
        </button>

        {showIOSGuide && (
          <div
            className="fixed inset-0 z-[75] flex items-center justify-center bg-church-navy/55 p-4 backdrop-blur-[2px]"
            onClick={() => setShowIOSGuide(false)}
          >
            <div
              className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl animate-soft-in"
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-xl font-serif text-church-navy">Installer sur iPhone / iPad</h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="-mr-1 -mt-1 rounded-xl p-1.5 text-church-muted hover:bg-church-light"
                  aria-label="Fermer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <ol className="mt-3 space-y-2 text-sm text-church-dark">
                <li>1. Appuyez sur le bouton <strong>Partager</strong> dans la barre de Safari.</li>
                <li>2. Faites défiler puis sélectionnez <strong>Sur l’écran d’accueil</strong>.</li>
                <li>3. Confirmez en appuyant sur <strong>Ajouter</strong>.</li>
              </ol>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="btn-primary mt-5 w-full"
              >
                Compris
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-20 left-4 right-4 z-[60] mx-auto flex max-w-md items-center justify-center gap-2 rounded-2xl bg-amber-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg lg:bottom-5"
    >
      <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>Mode hors connexion — Données en cache affichées</span>
    </div>
  );
};
