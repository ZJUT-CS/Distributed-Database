import React from 'react';

export type AdminInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  containerClassName?: string;
};

const AdminInput = React.forwardRef<HTMLInputElement, AdminInputProps>(({ className, containerClassName, ...rest }, ref) => {
  const cls =
    `w-full h-10 px-3 rounded-admin border border-admin-border bg-admin-surface text-admin-text placeholder:text-admin-muted/70 ` +
    `focus:ring-2 focus:ring-admin-primary focus:border-transparent outline-none transition-colors text-admin-base ${className ?? ''}`;

  if (containerClassName) {
    return (
      <div className={containerClassName}>
        <input ref={ref} className={cls} {...rest} />
      </div>
    );
  }

  return <input ref={ref} className={cls} {...rest} />;
});

AdminInput.displayName = 'AdminInput';

export default AdminInput;

