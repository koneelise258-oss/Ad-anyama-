import React from 'react';
import { DepartmentItem } from '../types';
import { ChevronRight } from 'lucide-react';
import { PageIntro } from './ui';

interface DepartementsViewProps {
  departments: DepartmentItem[];
  onSelectDepartment: (dept: DepartmentItem) => void;
  onOpenShare: (title: string, summary: string) => void;
}

export const DepartementsView: React.FC<DepartementsViewProps> = ({ departments, onSelectDepartment }) => (
  <div>
    <PageIntro
      title="Départements et groupes"
      lead="Les départements et groupes de l’église. Chacun dispose de sa page avec ses activités, ses annonces et ses photos."
    />

    <div className="page py-8">
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {departments.map((dept) => (
          <li key={dept.id}>
            <button
              onClick={() => onSelectDepartment(dept)}
              className="surface group flex h-full w-full items-center gap-4 overflow-hidden text-left hover:border-church-blue"
            >
              <img src={dept.coverImage} alt="" className="h-24 w-24 shrink-0 object-cover sm:h-28 sm:w-28" />
              <span className="min-w-0 flex-1 py-3">
                <span className="block font-serif text-lg font-semibold leading-snug text-church-navy group-hover:text-church-blue">
                  {dept.name}
                </span>
              </span>
              <ChevronRight className="mr-4 h-5 w-5 shrink-0 text-church-muted" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  </div>
);
