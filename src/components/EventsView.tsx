import React, { useState } from 'react';
import { EventItem } from '../types';
import { getFirstDirectVideo, getFirstDisplayablePhoto } from '../utils/security';
import { Clock, MapPin, Check, CalendarDays, Play } from 'lucide-react';
import { PageIntro, DateBlock, EmptyState } from './ui';

interface EventsViewProps {
  events: EventItem[];
  onSelectEvent: (event: EventItem) => void;
  onToggleRegister: (eventId: string) => void;
  onOpenShare: (title: string, summary: string) => void;
}

export const EventsView: React.FC<EventsViewProps> = ({ events, onSelectEvent, onToggleRegister }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', ...Array.from(new Set(events.map((e) => e.category)))];
  const filtered = events.filter((ev) => selectedCategory === 'all' || ev.category === selectedCategory);

  return (
    <div>
      <PageIntro
        title="Événements"
        lead="Veillées, retraites, séminaires et rencontres spéciales annoncés par l’église."
      >
        {categories.length > 2 && (
          <div className="mt-5 flex flex-wrap gap-2">
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
        {events.length === 0 ? (
          <EmptyState message="Aucun événement programmé pour le moment." />
        ) : filtered.length === 0 ? (
          <EmptyState message="Aucun événement dans cette catégorie." actionLabel="Voir tous les événements" onAction={() => setSelectedCategory('all')} />
        ) : (
          <ul className="space-y-5">
            {filtered.map((ev) => {
              const coverPhoto = getFirstDisplayablePhoto(ev);
              const coverVideo = !coverPhoto ? getFirstDirectVideo(ev) : '';
              return (
              <li key={ev.id} className="surface surface-interactive overflow-hidden">
                <div className="grid md:grid-cols-[280px_1fr]">
                  <button
                    onClick={() => onSelectEvent(ev)}
                    className="group relative block bg-church-navy overflow-hidden"
                    aria-label={ev.title}
                  >
                    {coverPhoto ? (
                      <img
                        src={coverPhoto}
                        alt={`Affiche ${ev.title}`}
                        className="aspect-[16/9] h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 md:aspect-auto"
                      />
                    ) : coverVideo ? (
                      <span className="relative block aspect-[16/9] h-full min-h-[150px] w-full bg-black md:aspect-auto">
                        <video
                          preload="metadata"
                          muted
                          playsInline
                          src={`${coverVideo}#t=0.5`}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <span className="absolute inset-0 flex items-center justify-center bg-church-navy/25">
                          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-church-navy shadow-md">
                            <Play className="h-5 w-5 fill-church-navy" aria-hidden="true" />
                          </span>
                        </span>
                      </span>
                    ) : (
                      <span className="flex aspect-[16/9] h-full min-h-[150px] w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-church-navy to-church-blue/90 p-5 text-white md:aspect-auto">
                        <CalendarDays className="h-8 w-8 text-white/80" aria-hidden="true" />
                        <span className="text-xs font-medium uppercase tracking-wider text-white/80">{ev.category}</span>
                      </span>
                    )}
                  </button>

                  <div className="flex gap-4 p-5 sm:p-6">
                    <DateBlock date={ev.date} className="hidden sm:flex" />
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-medium text-church-blue">{ev.category}</span>
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
                      {ev.description && <p className="mt-3 line-clamp-2 text-[15px] text-church-dark">{ev.description}</p>}
                      <div className="mt-4 flex flex-wrap items-center gap-2.5">
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
                        <button onClick={() => onSelectEvent(ev)} className="btn-secondary">
                          Affiche & programme
                        </button>
                        {ev.attendeesCount > 0 && (
                          <span className="ml-auto text-sm text-church-muted tabular-nums">
                            {ev.attendeesCount} participant{ev.attendeesCount > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};
