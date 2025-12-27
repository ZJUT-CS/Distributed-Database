import React, { useState, useEffect } from 'react';
import { Plane, Heart, Github } from 'lucide-react';
import ThemeToggle from '../common/ThemeToggle';

const Footer: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      // 在页面底部附近时始终显示
      const isNearBottom = currentScrollY + windowHeight >= documentHeight - 100;

      // 在页面顶部时始终显示
      const isNearTop = currentScrollY < 50;

      if (isNearBottom || isNearTop) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY) {
        // 向下滚动 - 显示页脚
        setIsVisible(true);
      } else if (currentScrollY < lastScrollY) {
        // 向上滚动 - 隐藏页脚
        setIsVisible(false);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <footer className={`fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-slate-950/80 border-t border-slate-200/60 dark:border-slate-800/50 py-3 backdrop-blur-md transition-all duration-300 ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}>
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-row justify-between items-center gap-4">

          {/* Brand & Copyright - 单行紧凑布局 */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-br from-sky-500 to-indigo-600 p-1 rounded-md shadow-sm">
                <Plane className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-sm text-slate-800 dark:text-slate-100">SkyLink</span>
            </div>
            <span className="hidden sm:inline text-slate-300 dark:text-slate-700">|</span>
            <p className="hidden sm:block text-slate-500 dark:text-slate-400 text-xs">
              © 2025 Powered by 熵增架构师
            </p>
          </div>

          {/* Actions & Info - 紧凑右侧 */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
              <span>Made with</span>
              <Heart className="w-3 h-3 text-red-500 fill-red-500 animate-pulse" />
            </div>

            <div className="hidden md:block w-px h-5 bg-slate-200 dark:bg-slate-700"></div>

            <div className="flex items-center gap-2">
              <a href="#" className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors" title="Github">
                <Github className="w-4 h-4" />
              </a>
              <ThemeToggle />
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
};

export default Footer;
