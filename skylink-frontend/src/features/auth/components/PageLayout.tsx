import React from 'react';

interface PageLayoutProps {
  children: React.ReactNode;
  backgroundUrl?: string;
  overlayColor?: string;
  overlayBlur?: string;
  className?: string;
}

const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  backgroundUrl = 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?ixlib=rb-4.0.3&auto=format&fit=crop&w=2074&q=80',
  overlayColor = 'bg-slate-900/40',
  overlayBlur = 'backdrop-blur-[2px]',
  className = '',
}) => {
  return (
    <div className={`relative min-h-screen w-full flex items-center justify-center overflow-hidden ${className}`}>
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transform scale-105"
        style={{ backgroundImage: `url("${backgroundUrl}")` }}
      >
        <div className={`absolute inset-0 ${overlayColor} dark:bg-slate-900/60 dark:bg-gradient-to-tr dark:from-cosmos-bg/90 dark:via-cosmos-bg/70 dark:to-transparent ${overlayBlur}`}></div>
      </div>

      <div className="relative z-10 w-full max-w-md px-4">
        {children}
      </div>
    </div>
  );
};

export default PageLayout;
