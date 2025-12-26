
import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Plane, Sparkles, User as UserIcon, LayoutDashboard, Ticket, RefreshCw, LogOut } from 'lucide-react';
import { useAuth } from '@/features/auth';
import AiAssistantModal from '@/features/ai/components/AiAssistantModal';
import { type AIRecommendation } from '@/features/ai';
import { ThemeToggle, Image } from '@/components/common';

const pad2 = (n: number) => String(n).padStart(2, '0');

const formatLocalYmd = (d: Date) => {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const isResultsPage = location.pathname.includes('/results');

  // Handle scroll to hide/show navbar
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Always show at top or if scrolling up
      if (currentScrollY < 10 || currentScrollY < lastScrollY) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Hide when scrolling down past 100px
        setIsVisible(false);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Click Outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Listen open-ai-modal event triggered from SearchForm/Result
  useEffect(() => {
    const handler = () => setIsAiModalOpen(true);
    window.addEventListener('open-ai-modal', handler as EventListener);
    return () => window.removeEventListener('open-ai-modal', handler as EventListener);
  }, []);

  useEffect(() => {
    setIsUserMenuOpen(false);
    setIsLogoutConfirmOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setIsLogoutConfirmOpen(false);
      setIsUserMenuOpen(false);
      setIsAiModalOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogoutClick = () => {
    setIsUserMenuOpen(false);
    setIsLogoutConfirmOpen(true);
  };

  const handleConfirmLogout = () => {
    setIsLogoutConfirmOpen(false);
    setIsUserMenuOpen(false);
    logout();
    navigate('/');
  };

  const handleAiRecommendation = (rec: AIRecommendation) => {
    setIsAiModalOpen(false);
    // Navigate to results with destination. 
    // Note: This is a simple redirect. The Results page will need to parse query params.
    navigate(`/results?origin=PEK&destination=${rec.airportCode}&date=${formatLocalYmd(new Date())}`);
  };

  return (
    <>
      <nav
        className={`backdrop-blur-md border-b sticky top-0 z-40 transition-all duration-300 transform ${isVisible ? 'translate-y-0' : '-translate-y-full'
          } ${isResultsPage ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white/90 dark:bg-gray-900/90 border-gray-200 dark:border-gray-800 text-slate-800 dark:text-gray-100'
          }`}
      >
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link
              to="/"
              className="flex items-center gap-2 cursor-pointer"
            >
              <div className="bg-blue-600 p-1.5 rounded-lg text-white">
                <Plane className="w-5 h-5" />
              </div>
              <span className={`font-bold text-xl tracking-tight ${isResultsPage ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>SkyLink</span>
            </Link>

            <div className="flex items-center gap-4">
              <ThemeToggle size="sm" />

              {user && (
                <button
                  onClick={() => setIsAiModalOpen(true)}
                  className={`hidden md:flex items-center gap-1 font-medium px-3 py-1.5 rounded-lg transition-colors ${isResultsPage ? 'text-purple-300 hover:bg-white/10' : 'text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30'}`}
                >
                  <Sparkles className="w-4 h-4" /> AI 助手
                </button>
              )}

              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => user ? setIsUserMenuOpen(!isUserMenuOpen) : navigate('/login')}
                  className="group flex items-center gap-2 focus:outline-none"
                  title={user ? "用户菜单" : "点击登录"}
                >
                  <div className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-all flex items-center justify-center ${isResultsPage ? 'border-slate-600 bg-slate-800' : 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 group-hover:border-blue-400'
                    } ${user ? 'border-blue-400' : ''}`}>
                    {user ? (
                      <Image src={user.avatarUrl || ''} alt={user.username} loading="eager" />
                    ) : (
                      <UserIcon className={`w-5 h-5 ${isResultsPage ? 'text-slate-400' : 'text-gray-400 dark:text-gray-500'} group-hover:text-blue-500`} />
                    )}
                  </div>
                  {user ? (
                    <span className={`text-sm font-medium hidden sm:block ${isResultsPage ? 'text-gray-200' : 'text-gray-700 dark:text-gray-200'}`}>{user.username}</span>
                  ) : (
                    <span className={`text-sm font-medium group-hover:text-blue-600 dark:hover:text-blue-400 hidden sm:block ${isResultsPage ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>登录</span>
                  )}
                </button>

                {/* User Menu Popover */}
                {isUserMenuOpen && user && (
                  <div className="absolute right-0 top-full mt-3 w-64 bg-white dark:bg-gray-800 rounded-2xl shadow-xl dark:shadow-gray-900/50 border border-gray-100 dark:border-gray-700 overflow-hidden animate-in fade-in slide-in-from-top-2 z-50">
                    <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/50">
                      <p className="font-bold text-gray-800 dark:text-gray-100 truncate">{user.username}</p>
                      <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${user.role === 'admin'
                        ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-800/50'
                        : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800/50'
                        }`}>
                        {user.role === 'admin' ? 'Administrator' : 'Verified User'}
                      </span>
                    </div>

                    <div className="p-2 space-y-1">
                      {user.role === 'admin' ? (
                        <NavLink
                          to="/admin"
                          onClick={() => setIsUserMenuOpen(false)}
                          className={({ isActive }) =>
                            `w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-colors text-left ${isActive
                              ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                              : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-purple-600 dark:hover:text-purple-400'
                            }`
                          }
                        >
                          <LayoutDashboard className="w-4 h-4" /> 管理后台
                        </NavLink>
                      ) : (
                        <NavLink
                          to="/my-bookings"
                          onClick={() => setIsUserMenuOpen(false)}
                          className={({ isActive }) =>
                            `w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-colors text-left ${isActive
                              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                              : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-blue-600 dark:hover:text-blue-400'
                            }`
                          }
                        >
                          <Ticket className="w-4 h-4" /> 我的订单
                        </NavLink>
                      )}

                      <NavLink
                        to="/refunds-help"
                        onClick={() => setIsUserMenuOpen(false)}
                        className={({ isActive }) =>
                          `w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-colors text-left ${isActive
                            ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-red-600 dark:hover:text-red-400'
                          }`
                        }
                      >
                        <RefreshCw className="w-4 h-4" /> 退改/售后
                      </NavLink>

                      <NavLink
                        to="/user-center"
                        onClick={() => setIsUserMenuOpen(false)}
                        className={({ isActive }) =>
                          `w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-colors text-left ${isActive
                            ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-indigo-600 dark:hover:text-indigo-400'
                          }`
                        }
                      >
                        <UserIcon className="w-4 h-4" /> 个人中心
                      </NavLink>
                    </div>

                    <div className="p-2 border-t border-gray-100 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-700/30">
                      <button
                        onClick={handleLogoutClick}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4" /> 退出登录
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {isLogoutConfirmOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setIsLogoutConfirmOpen(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm shadow-2xl dark:shadow-gray-900/50 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700">
              <div className="text-lg font-bold text-gray-900 dark:text-gray-100">确认退出登录</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">退出后需要重新登录才能继续管理行程</div>
            </div>
            <div className="px-6 py-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsLogoutConfirmOpen(false)}
                className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmLogout}
                className="px-4 py-2 rounded-xl bg-red-600 dark:bg-red-700 text-white text-sm font-semibold hover:bg-red-700 dark:hover:bg-red-800 transition-colors"
              >
                退出登录
              </button>
            </div>
          </div>
        </div>
      )}

      <AiAssistantModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onSelectRecommendation={handleAiRecommendation}
      />
    </>
  );
};

export default Navbar;
