import React, { useState } from 'react';
import { EventItem } from '../types';
import { Clock, MapPin, Check } from 'lucide-react';
import { PageIntro, DateBlock, EmptyState } from './ui';

interface EventsViewProps {
  events: EventItem[];
  onSelectEvent: (event: EventItem) => void;
  onToggleRegister: (eventId: string) => void;
  onOpenShare: (title: string, summary: string) => void;
}

export const EventsView: React.FC<EventsViewProps> = ({ events, onSelectEvent, onToggleRegister }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Catégories réellement présentes dans les données (pas de filtre vide)
  const categories = ['all', ...Array.from(new Set(events.map((e) => e.category)))];
  const filtered = events.filter((ev) => selectedCategory === 'all' || ev.category === selectedCategory);

  return (
    <div>
      <PageIntro
        title="Événements"
        lead="Veillées, retraites, séminaires et campagnes d’évangélisation annoncés par l’église."
      >
        {categories.length > 2 && (
          <div className="no-scrollbar -mx-4 mt-6 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={selectedCategory === cat ? 'chip-active' : 'chip'}
                aria-pressed={selectedCategory === cat}
              >
                {cat === 'all' ? 'Tous' : cat}
              </button>
            ))}
          </div>
        )}
      </PageIntro>

      <div className="page py-8">
        {filtered.length === 0 ? (
          <EmptyState message="Aucun événement dans cette catégorie." actionLabel="Voir tous les événements" onAction={() => setSelectedCategory('all')} />
        ) : (
          <ul className="space-y-4">
            {filtered.map((ev) => (
              <li key={ev.id} className="surface overflow-hidden">
                <div className="grid md:grid-cols-[1fr_280px]">
                  <div className="flex gap-4 p-5">
                    <DateBlock date={ev.date} className="hidden sm:flex" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">
                        <span className="font-medium text-church-blue">{ev.category}</span>
                        {ev.isDemo && <span className="demo-tag ml-2">Démonstration</span>}
                      </p>
                      <h2 className="mt-1 text-xl sm:text-2xl">
                        <button onClick={() => onSelectEvent(ev)} className="text-left hover:text-church-blue">
                          {ev.title}
                        </button>
                      </h2>
                      <dl className="mt-3 space-y-1.5 text-[15px]">
                        <div className="flex items-start gap-2">
                          <dt className="sr-only">Date et heure</dt>
                          <Clock className="mt-1 h-4 w-4 shrink-0 text-church-blue" aria-hidden="true" />
                          <dd>
                            <span className="font-medium text-church-navy">{ev.date}</span>
                            {ev.time && <span className="text-church-muted">, {ev.time}</span>}
                          </dd>
                        </div>
                        {ev.location && (
                          <div className="flex items-start gap-2">
                            <dt className="sr-only">Lieu</dt>
                            <MapPin className="mt-1 h-4 w-4 shrink-0 text-church-blue" aria-hidden="true" />
                            <dd className="text-church-muted">{ev.location}</dd>
                          </div>
                        )}
                      </dl>
                      <p className="mt-3 line-clamp-2 text-[15px]">{ev.description}</p>
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => onToggleRegister(ev.id)}
                          aria-pressed={!!ev.isRegistered}
                          className={ev.isRegistered ? 'btn-secondary border-church-blue text-church-blue' : 'btn-primary'}
                        >
                          {ev.isRegistered ? (
                            <>
                              <Check className="h-4 w-4" aria-hidden="true" /> Je participe
                            </>
                          ) : (
                            'Je participe'
                          )}
                        </button>
                        <button onClick={() => onSelectEvent(ev)} className="btn-ghost">
                          Voir le programme
                        </button>
                        {ev.attendeesCount > 0 && (
                          <span className="ml-auto text-sm text-church-muted">{ev.attendeesCount} participants</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => onSelectEvent(ev)} className="order-first block bg-church-navy md:order-none" aria-label={ev.title}>
                    <img src={ev.coverImage} alt="" className="aspect-[16/9] h-full w-full object-cover md:aspect-auto" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
