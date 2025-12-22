import React from 'react';

export type AdminPageHeaderProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  level?: 'h1' | 'h2';
};

const AdminPageHeader: React.FC<AdminPageHeaderProps> = ({ title, description, actions, level = 'h2' }) => {
  const titleCls = level === 'h1' ? 'text-admin-h1' : 'text-admin-h2';

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h2 className={`${titleCls} font-extrabold text-admin-text`}>{title}</h2>
        {description ? <p className="text-admin-base text-admin-muted mt-1">{description}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
    </div>
  );
};

export default AdminPageHeader;

