import type { Culte, CulteServiceType } from '../types';

export const CULTE_TYPE_ORDER: CulteServiceType[] = ['dimanche', 'evenement', 'mardi'];

export const CULTE_TYPE_LABELS: Record<CulteServiceType, string> = {
  dimanche: 'Dimanche',
  evenement: 'Événement',
  mardi: 'Mardi'
};

export const inferCulteServiceType = (culte: Pick<Culte, 'serviceType' | 'date' | 'title' | 'eventLabel'>): CulteServiceType => {
  if (culte.serviceType && ['dimanche', 'evenement', 'mardi'].includes(culte.serviceType)) {
    return culte.serviceType;
  }
  if (culte.eventLabel?.trim()) {
    return 'evenement';
  }
  const lowerTitle = (culte.title || '').toLowerCase();
  if (
    /veill[ée]e|conf[ée]rence|croisade|retraite|s[ée]minaire|convention|p[âa]ques|no[ëe]l|sp[ée]cial|[ée]v[ée]nement/.test(
      lowerTitle
    )
  ) {
    return 'evenement';
  }
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(culte.date || '');
  if (m) {
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    const day = d.getDay();
    if (day === 0) return 'dimanche';
    if (day === 2) return 'mardi';
    return 'evenement';
  }
  return 'dimanche';
};

export const sortCultesByDateDesc = (list: Culte[]): Culte[] => {
  return [...list].sort((a, b) => {
    const cmpDate = String(b.date || '').localeCompare(String(a.date || ''));
    if (cmpDate !== 0) return cmpDate;
    return String(b.publishedAt || '').localeCompare(String(a.publishedAt || ''));
  });
};

export const groupCultesByCategory = (list: Culte[]): Array<{ type: CulteServiceType; label: string; items: Culte[] }> => {
  const buckets: Record<CulteServiceType, Culte[]> = {
    dimanche: [],
    evenement: [],
    mardi: []
  };

  for (const culte of list) {
    const t = inferCulteServiceType(culte);
    buckets[t].push(culte);
  }

  return CULTE_TYPE_ORDER.map((type) => ({
    type,
    label:
      type === 'dimanche'
        ? 'Cultes du Dimanche'
        : type === 'evenement'
        ? 'Cultes d’Événement'
        : 'Cultes du Mardi',
    items: sortCultesByDateDesc(buckets[type])
  }));
};
