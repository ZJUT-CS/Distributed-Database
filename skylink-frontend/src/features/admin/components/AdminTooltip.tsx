import React from 'react';

export type AdminTooltipProps = {
  content: React.ReactNode;
  children: React.ReactNode;
  placement?: 'top' | 'bottom';
};

const AdminTooltip: React.FC<AdminTooltipProps> = ({ content, children, placement = 'top' }) => {
  const pos = placement === 'top' ? 'bottom-full mb-2' : 'top-full mt-2';

  return (
    <span className="relative inline-flex group">
      <span className="inline-flex" tabIndex={0}>
        {children}
      </span>
      <span
        className={`pointer-events-none absolute left-1/2 -translate-x-1/2 ${pos} z-50 w-admin-tooltip p-admin-tooltip rounded-admin bg-slate-900 text-white text-admin-tooltip shadow-admin-md opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0 transition-all duration-150`}
        role="tooltip"
      >
        {content}
      </span>
    </span>
  );
};

export default AdminTooltip;

