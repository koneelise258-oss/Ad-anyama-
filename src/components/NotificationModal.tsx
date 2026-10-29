import React, { useEffect } from 'react';
import { X, CalendarPlus, Bell } from 'lucide-react';
import { CHURCH_INFO } from '../mockData';
import { downloadWeeklySchedule } from '../calendar';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Rappels des cultes.
 * Les alertes (WhatsApp, e-mail, navigateur) ne sont pas encore branchées : on ne fait pas semblant.
 * Ce qui fonctionne dès maintenant : ajouter les 3 cultes hebdomadaires à l’agenda du téléphone,
 * avec un rappel automatique 1 h avant.
 */
export const NotificationModal: React.FC<NotificationModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[65] flex items-end justify-center bg-church-navy/50 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="w-full rounded-t-xl bg-white p-5 pb-8 sm:max-w-md sm:rounded-xl sm:pb-5"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rappels-titre"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="rappels-titre" className="text-2xl">
            Ne manquez aucun culte
          </h2>
          <button onClick={onClose} className="-mr-2 -mt-1 rounded-md p-2 text-church-muted hover:text-church-navy" aria-label="Fermer">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-2 text-church-muted">
          Ajoutez les cultes à l’agenda de votre téléphone. Vous recevrez un rappel une heure avant chaque culte.
        </p>

        <ul className="mt-4 divide-y divide-church-line rounded-lg border border-church-line">
          {CHURCH_INFO.schedules.map((s) => (
            <li key={s.day} className="px-4 py-3">
              <span className="block font-semibold text-church-navy">
                {s.day}, {s.time}
              </span>
              <span className="text-sm">{s.name}</span>
            </li>
          ))}
        </ul>

        <button
          onClick={() => {
            downloadWeeklySchedule(CHURCH_INFO.schedules, CHURCH_INFO.address);
            onClose();
          }}
          className="btn-primary mt-5 w-full"
        >
          <CalendarPlus className="h-4 w-4" aria-hidden="true" /> Ajouter à mon agenda
        </button>
        <p className="mt-2 text-center text-sm text-church-muted">Ouvrez ensuite le fichier téléchargé pour confirmer.</p>

        <div className="mt-5 flex gap-3 rounded-lg bg-church-light p-4 text-sm">
          <Bell className="mt-0.5 h-4 w-4 shrink-0 text-church-blue" aria-hidden="true" />
          <p>Les alertes par WhatsApp et par e-mail pour les nouvelles publications arriveront prochainement.</p>
        </div>
      </div>
    </div>
  );
};
