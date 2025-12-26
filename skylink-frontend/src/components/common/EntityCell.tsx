import React from 'react';
import type { LucideIcon } from 'lucide-react';

export type EntityMetaItem = {
  icon?: LucideIcon;
  text: React.ReactNode;
};

export interface EntityCellProps {
  leading: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  meta?: EntityMetaItem[];
  className?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  metaClassName?: string;
}

const EntityCell: React.FC<EntityCellProps> = ({
  leading,
  title,
  subtitle,
  meta = [],
  className,
  titleClassName,
  subtitleClassName,
  metaClassName,
}) => {
  return (
    <div className={`flex items-center gap-3 min-w-0 ${className ?? ''}`.trim()}>
      <div className="shrink-0">{leading}</div>

      <div className="min-w-0">
        <div className={(titleClassName ?? 'font-bold text-gray-900 flex items-center gap-2 min-w-0').trim()}>
          <span className="truncate">{title}</span>
          {subtitle ? (
            <span className={(subtitleClassName ?? 'text-xs text-gray-400 font-mono shrink-0').trim()}>{subtitle}</span>
          ) : null}
        </div>

        {meta.length > 0 ? (
          <div className={(metaClassName ?? 'flex flex-wrap items-center gap-3 text-xs text-gray-400 mt-0.5').trim()}>
            {meta.map((m, idx) => {
              const Icon = m.icon;
              return (
                <span key={idx} className="flex items-center gap-1 min-w-0">
                  {Icon ? <Icon className="w-3 h-3 shrink-0" /> : null}
                  <span className="truncate">{m.text}</span>
                </span>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default EntityCell;
