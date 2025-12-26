import React from 'react';
import { Plane, Heart, Github } from 'lucide-react';
import ThemeToggle from '../common/ThemeToggle';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white/80 dark:bg-slate-950/30 border-t border-slate-200/60 dark:border-slate-800/50 py-8 mt-auto backdrop-blur-md transition-all duration-300">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">

          {/* Brand & Copyright */}
          <div className="flex flex-col items-center md:items-start gap-3">
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-br from-sky-500 to-indigo-600 p-1.5 rounded-lg shadow-sm">
                <Plane className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg text-slate-800 dark:text-slate-100">SkyLink</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              © 2025 SkyLink. Powered by 熵增架构师.
            </p>
          </div>

          {/* Actions & Info */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <a href="#" className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors" title="Github">
                <Github className="w-5 h-5" />
              </a>
              <ThemeToggle />
            </div>

            <div className="hidden md:block w-px h-8 bg-slate-200 dark:bg-slate-800"></div>

            <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
              <span>Made with</span>
              <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 animate-pulse" />
              <span>for project</span>
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
};

export default Footer;
