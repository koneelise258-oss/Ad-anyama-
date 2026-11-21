import React, { useEffect, useState } from 'react';
import { X, CalendarPlus, MapPin, BellRing, BellOff, CheckCircle2 } from 'lucide-react';
import { ChurchSettings } from '../types';
import { DEFAULT_CHURCH_SETTINGS } from '../mockData';
import { downloadWeeklySchedule } from '../calendar';
import { usePushNotifications } from '../hooks/usePWAInstall';
import { PWAInstallButton } from './PWAInstallBanner';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  churchSettings?: ChurchSettings;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  churchSettings = DEFAULT_CHURCH_SETTINGS
}) => {
  const { supported, isSubscribed, loading, error, subscribe, unsubscribe } = usePushNotifications();
  const [pushDone, setPushDone] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleTogglePush = async () => {
    if (isSubscribed) {
      await unsubscribe();
      setPushDone(false);
    } else {
      const ok = await subscribe();
      if (ok) setPushDone(true);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[65] flex items-end justify-center bg-church-navy/50 backdrop-blur-[2px] sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-h-[90vh] overflow-y-auto rounded-t-3xl bg-white p-6 pb-8 shadow-xl sm:max-w-md sm:rounded-3xl sm:pb-6 animate-soft-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rappels-titre"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="rappels-titre" className="text-2xl">
            Horaires & Rappels
          </h2>
          <button
            onClick={onClose}
            className="-mr-2 -mt-1 rounded-xl p-2 text-church-muted hover:bg-church-light hover:text-church-navy"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Notifications Push PWA sans création de compte */}
        <div className="mt-4 rounded-2xl border border-church-line bg-church-tint/50 p-4 space-y-2.5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-church-navy">Notifications Push directes</p>
              <p className="text-xs text-church-muted">
                Recevez les nouveaux cultes et annonces sur cet appareil, sans créer de compte.
              </p>
            </div>
          </div>

          {supported ? (
            <button
              type="button"
              disabled={loading}
              onClick={handleTogglePush}
              className={isSubscribed ? 'btn-secondary w-full text-xs sm:text-sm' : 'btn-primary w-full text-xs sm:text-sm'}
            >
              {isSubscribed ? (
                <>
                  <BellOff className="h-4 w-4 text-church-blue" aria-hidden="true" />
                  Notifications activées (Désactiver)
                </>
              ) : (
                <>
                  <BellRing className="h-4 w-4" aria-hidden="true" />
                  {loading ? 'Activation...' : 'Activer les notifications Push'}
                </>
              )}
            </button>
          ) : (
            <p className="text-xs text-church-muted">
              Pour recevoir des alertes sur iPhone/iPad, installez d’abord l’application sur l’écran d’accueil.
            </p>
          )}

          {pushDone && (
            <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Cet appareil recevra désormais les notifications de l’église.
            </p>
          )}

          {error && <p className="text-xs text-red-700">{error}</p>}
        </div>

        <p className="mt-4 text-sm text-church-muted">
          Ajoutez nos cultes hebdomadaires à l’agenda de votre appareil pour recevoir un rappel 1 heure avant.
        </p>

        <ul className="mt-3 divide-y divide-church-line rounded-2xl border border-church-line bg-church-light/40">
          {(churchSettings.schedules || []).map((s, idx) => (
            <li key={s.id || idx} className="px-4 py-3">
              <span className="block font-semibold text-church-navy">
                {s.day}
                {s.time ? `, ${s.time}` : ''}
              </span>
              <span className="text-sm text-church-dark">{s.name}</span>
            </li>
          ))}
        </ul>

        {churchSettings.address && (
          <p className="mt-3 flex items-center gap-2 text-xs sm:text-sm text-church-muted">
            <MapPin className="h-4 w-4 shrink-0 text-church-blue" aria-hidden="true" />
            <span>{churchSettings.address}</span>
          </p>
        )}

        <div className="mt-5 space-y-2.5">
          <button
            onClick={() => {
              downloadWeeklySchedule(churchSettings.schedules, churchSettings.address);
              onClose();
            }}
            className="btn-secondary w-full"
          >
            <CalendarPlus className="h-4 w-4 text-church-blue" aria-hidden="true" /> Ajouter à mon agenda (.ics)
          </button>

          <PWAInstallButton />
        </div>
      </div>
    </div>
  );
};
