import React, { useState } from 'react';
import { NewsItem } from '../types';
import { sanitizeUrl } from '../utils/security';
import { ChevronRight } from 'lucide-react';
import { PageIntro, EmptyState, formatPublishedDateTime } from './ui';

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
          <div className="mt-4 flex flex-wrap gap-2">
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

      <div className="page py-6 sm:py-8">
        {news.length === 0 ? (
          <EmptyState message="Aucune actualité ou communiqué publié pour le moment." />
        ) : filtered.length === 0 ? (
          <EmptyState message="Aucune publication dans cette catégorie." actionLabel="Voir toutes les publications" onAction={() => setActiveCategory('all')} />
        ) : (
          <ul className="surface divide-y divide-church-line overflow-hidden">
            {filtered.map((item) => {
              const official = item.category === 'Communiqué officiel';
              const safeImg = sanitizeUrl(item.coverImage);
              return (
                <li key={item.id}>
                  <button
                    onClick={() => onSelectNews(item)}
                    className="flex w-full items-center gap-3.5 p-4 text-left transition-colors hover:bg-church-light sm:gap-4 sm:p-6"
                  >
                    {safeImg && (
                      <img
                        src={safeImg}
                        alt=""
                        className="h-16 w-16 shrink-0 rounded-xl object-cover bg-church-navy sm:h-20 sm:w-24"
                      />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs sm:text-sm">
                        <span className={official ? 'font-semibold text-church-blue' : 'text-church-muted'}>
                          {item.category}
                        </span>
                        <span aria-hidden="true" className="text-church-line">·</span>
                        <span className="text-church-muted">{formatPublishedDateTime(item.date, item.publishedAt)}</span>
                        {item.isUrgent && <span className="font-semibold text-[#B42318]">Important</span>}
                      </span>
                      <span className="mt-1 block font-serif text-lg font-semibold leading-snug text-church-navy sm:text-2xl">
                        {item.title}
                      </span>
                      {item.summary && <span className="mt-1 line-clamp-2 block text-sm sm:text-[15px] text-church-dark">{item.summary}</span>}
                    </span>
                    <ChevronRight className="h-5 w-5 shrink-0 text-church-muted" aria-hidden="true" />
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
