import React from 'react';
import { LucideIcon } from 'lucide-react';

export type AdminPageHeaderProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  /** 标题左侧图标（Lucide 图标组件） */
  icon?: LucideIcon;
  /** 图标颜色，支持 Tailwind 类名 */
  iconClassName?: string;
};

const AdminPageHeader: React.FC<AdminPageHeaderProps> = ({
  title,
  description,
  actions,
  icon: Icon,
  iconClassName = 'text-indigo-500',
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
          {Icon && <Icon className={`w-6 h-6 ${iconClassName}`} />}
          {title}
        </h2>
        {description && <p className="text-gray-500 dark:text-slate-400 mt-1 text-sm">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
};

export default AdminPageHeader;

