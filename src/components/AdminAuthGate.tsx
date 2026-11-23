import React, { useState } from 'react';
import { Lock, ArrowLeft, AlertCircle, ShieldCheck, ExternalLink, LogIn, Copy, Check } from 'lucide-react';
import { api, setSessionToken } from '../services/api';
import {
  formatFirebaseGoogleError,
  isInsideIframe,
  isStandalonePwa,
  shouldUseRedirectFallback,
  signInGoogleForIdentity,
  startGoogleIdentityRedirect
} from '../services/googleDrive';
import { AdminUserPublic, AuthStatus } from '../types';

interface AdminAuthGateProps {
  authStatus: AuthStatus;
  initialError?: string;
  onAuthenticated: (admin: AdminUserPublic) => void;
  onCancel: () => void;
}

export const AdminAuthGate: React.FC<AdminAuthGateProps> = ({
  initialError = '',
  onAuthenticated,
  onCancel
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(initialError);
  const [copiedDomain, setCopiedDomain] = useState(false);

  const inIframe = isInsideIframe();
  const inStandalonePwa = isStandalonePwa();
  const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';
  const isDomainError = /non encore autorisé|unauthorized-domain|Domaine non autorisé/i.test(error);

  const handleDirectRedirect = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      await startGoogleIdentityRedirect();
    } catch (err: any) {
      setIsSubmitting(false);
      setError(formatFirebaseGoogleError(err, inIframe).message);
    }
  };

  const handleContinueWithGoogle = async () => {
    setError('');
    setIsSubmitting(true);

    // En application épinglée / installée (PWA standalone), la redirection directe évite la perte de session popup
    if (inStandalonePwa && !inIframe) {
      await handleDirectRedirect();
      return;
    }

    try {
      const googleAuth = await signInGoogleForIdentity();
      const res = await api.loginWithGoogle(googleAuth.idToken);
      setSessionToken(res.token);
      onAuthenticated(res.admin);
    } catch (err: any) {
      if (shouldUseRedirectFallback(err) && !inIframe) {
        await handleDirectRedirect();
        return;
      }
      setError(formatFirebaseGoogleError(err, inIframe).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openInNewTabUrl =
    typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}#/portail-eeadci` : '#';

  return (
    <div className="page flex min-h-[75vh] items-center justify-center py-10">
      <div className="surface w-full max-w-md p-6 sm:p-8 animate-soft-in">
        <button onClick={onCancel} className="btn-ghost -ml-2 mb-4 text-xs sm:text-sm">
          <ArrowLeft className="h-4 w-4" /> Retour au site public
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-church-tint text-church-blue">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl leading-tight">Espace administrateur</h1>
            <p className="text-xs text-church-muted">Connexion sécurisée via Google</p>
          </div>
        </div>

        <p className="mt-5 rounded-xl border border-church-line bg-church-light/70 p-3.5 text-xs sm:text-sm text-church-dark leading-relaxed">
          Seules les adresses Google préalablement autorisées par l’administration peuvent accéder à cet espace. Toute autre adresse est automatiquement refusée.
        </p>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs sm:text-sm text-red-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="space-y-2 min-w-0 flex-1">
              <p>{error}</p>
              {isDomainError && currentHost && (
                <div className="space-y-1.5 rounded-lg border border-red-200 bg-white/85 p-2.5 text-xs text-church-navy">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <code className="break-all font-mono font-semibold text-red-900">{currentHost}</code>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(currentHost).then(() => {
                          setCopiedDomain(true);
                          setTimeout(() => setCopiedDomain(false), 2500);
                        });
                      }}
                      className="inline-flex items-center gap-1 rounded-md border border-church-line bg-church-light px-2 py-1 text-[11px] font-semibold text-church-navy hover:bg-church-tint"
                    >
                      {copiedDomain ? <Check className="h-3 w-3 text-emerald-700" /> : <Copy className="h-3 w-3" />}
                      {copiedDomain ? 'Copié' : 'Copier le domaine'}
                    </button>
                  </div>
                  <a
                    href="https://console.firebase.google.com/project/gen-lang-client-0797796121/authentication/settings"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-church-blue underline"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Ajouter dans Firebase → Domaines autorisés
                  </a>
                </div>
              )}
              {inIframe && (
                <a
                  href={openInNewTabUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-semibold text-church-navy underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Ouvrir dans un nouvel onglet pour se connecter
                </a>
              )}
              {/Utilisateurs tests|access_denied|validation|blocked/i.test(error) && (
                <a
                  href="https://console.cloud.google.com/auth/audience?project=gen-lang-client-0797796121"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block font-semibold underline"
                >
                  Ouvrir Google Cloud Console → Utilisateurs tests
                </a>
              )}
            </div>
          </div>
        )}

        <div className="mt-6 space-y-3">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleContinueWithGoogle}
            className="flex min-h-[48px] w-full items-center justify-center gap-3 rounded-xl border border-[#747775]/45 bg-white px-4 py-2.5 text-sm font-semibold text-[#1F1F1F] shadow-xs transition-colors hover:bg-gray-50 disabled:opacity-60"
          >
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path
                fill="#EA4335"
                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
              />
              <path
                fill="#4285F4"
                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
              />
              <path
                fill="#FBBC05"
                d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
              />
              <path
                fill="#34A853"
                d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
              />
            </svg>
            <span>{isSubmitting ? 'Vérification Google…' : 'Continuer avec Google'}</span>
          </button>

          {!inIframe && !inStandalonePwa && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleDirectRedirect}
              className="btn-ghost w-full text-xs text-church-blue"
            >
              <LogIn className="h-3.5 w-3.5" />
              Connexion directe sans fenêtre popup
            </button>
          )}

          {inIframe && (
            <a
              href={openInNewTabUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-[40px] w-full items-center justify-center gap-1.5 rounded-xl border border-church-line bg-church-light/60 px-3 text-xs font-medium text-church-navy hover:bg-church-tint"
            >
              <ExternalLink className="h-3.5 w-3.5 text-church-blue" />
              Ouvrir dans un nouvel onglet (si la fenêtre Google bloque)
            </a>
          )}

          <p className="flex items-center justify-center gap-1.5 text-center text-xs text-church-muted">
            <ShieldCheck className="h-3.5 w-3.5 text-church-blue" aria-hidden="true" />
            Contrôle strict par liste blanche d’adresses e-mail
          </p>
        </div>
      </div>
    </div>
  );
};
