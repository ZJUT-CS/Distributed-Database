import React from 'react';

export type AdminSelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  containerClassName?: string;
};

const AdminSelect = React.forwardRef<HTMLSelectElement, AdminSelectProps>(({ className, containerClassName, ...rest }, ref) => {
  const cls =
    `w-full h-10 px-3 rounded-admin border border-admin-border bg-admin-surface text-admin-text ` +
    `focus:ring-2 focus:ring-admin-primary focus:border-transparent outline-none transition-colors text-admin-base ${className ?? ''}`;

  if (containerClassName) {
    return (
      <div className={containerClassName}>
        <select ref={ref} className={cls} {...rest} />
      </div>
    );
  }

  return <select ref={ref} className={cls} {...rest} />;
});

AdminSelect.displayName = 'AdminSelect';

export default AdminSelect;

