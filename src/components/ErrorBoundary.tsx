import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error?.message || 'Une erreur inattendue est survenue.'
    };
  }

  componentDidCatch(error: Error) {
    console.error('Application ErrorBoundary:', error);
  }

  render() {
    if (this.state.hasError) {
      let friendly = 'Une erreur technique est survenue lors du chargement des données.';
      try {
        const parsed = JSON.parse(this.state.message);
        if (parsed?.error) {
          friendly = /permission|insufficient/i.test(String(parsed.error))
            ? 'Accès refusé aux données demandées. Vérifiez votre connexion administrateur.'
            : String(parsed.error);
        }
      } catch {
        if (this.state.message) friendly = this.state.message;
      }

      return (
        <div className="flex min-h-screen items-center justify-center bg-church-light p-6">
          <div className="surface max-w-md w-full p-6 text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-700">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-church-navy">Interruption temporaire</h2>
            <p className="text-sm text-church-muted leading-relaxed">{friendly}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="btn-primary w-full justify-center"
            >
              <RefreshCw className="h-4 w-4" /> Recharger la page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
