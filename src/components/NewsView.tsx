import React, { useState } from 'react';
import { NewsItem } from '../types';
import { ChevronRight } from 'lucide-react';
import { PageIntro, EmptyState, formatDate } from './ui';

interface NewsViewProps {
  news: NewsItem[];
  onSelectNews: (item: NewsItem) => void;
  onOpenShare: (title: string, summary: string) => void;
}

export const NewsView: React.FC<NewsViewProps> = ({ news, onSelectNews }) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const categories = ['all', ...Array.from(new Set(news.map((n) => n.category)))];
  const filtered = news.filter((n) => activeCategory === 'all' || n.category === activeCategory);

  return (
    <div>
      <PageIntro title="Actualités et communiqués" lead="Les informations de la vie de l’église et les communiqués officiels.">
        {categories.length > 2 && (
          <div className="no-scrollbar -mx-4 mt-6 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setActiveCategory(c)}
                className={activeCategory === c ? 'chip-active' : 'chip'}
                aria-pressed={activeCategory === c}
              >
                {c === 'all' ? 'Toutes' : c}
              </button>
            ))}
          </div>
        )}
      </PageIntro>

      <div className="page py-8">
        {filtered.length === 0 ? (
          <EmptyState message="Aucune publication dans cette catégorie." actionLabel="Voir toutes les publications" onAction={() => setActiveCategory('all')} />
        ) : (
          <ul className="surface divide-y divide-church-line">
            {filtered.map((item) => {
              const official = item.category === 'Communiqué officiel';
              return (
                <li key={item.id}>
                  <button
                    onClick={() => onSelectNews(item)}
                    className={`flex w-full items-start gap-4 p-5 text-left hover:bg-church-light sm:p-6 ${
                      official ? 'border-l-[3px] border-church-blue' : 'border-l-[3px] border-transparent'
                    }`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                        <span className={official ? 'font-semibold text-church-blue' : 'text-church-muted'}>{item.category}</span>
                        <span className="text-church-muted">{formatDate(item.date)}</span>
                        {item.isUrgent && <span className="font-semibold text-[#B42318]">Important</span>}
                        {item.isDemo && <span className="demo-tag">Démonstration</span>}
                      </span>
                      <span className="mt-1.5 block font-serif text-xl font-semibold leading-snug text-church-navy sm:text-2xl">
                        {item.title}
                      </span>
                      <span className="mt-2 line-clamp-2 block text-[15px]">{item.summary}</span>
                    </span>
                    <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-church-muted" aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};
