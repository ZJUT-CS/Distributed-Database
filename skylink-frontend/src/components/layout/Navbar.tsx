
import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Plane, Sparkles, User as UserIcon, LayoutDashboard, Ticket, UserCog, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import AiAssistantModal from '../common/AiAssistantModal';
import { AIRecommendation } from '../../types';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const isResultsPage = location.pathname.includes('/results');

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

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsUserMenuOpen(false);
  };

  const handleAiRecommendation = (rec: AIRecommendation) => {
    setIsAiModalOpen(false);
    // Navigate to results with destination. 
    // Note: This is a simple redirect. The Results page will need to parse query params.
    navigate(`/results?origin=PEK&destination=${rec.airportCode}&date=${new Date().toISOString().split('T')[0]}`); 
  };

  return (
    <>
      <nav className={`backdrop-blur-md border-b sticky top-0 z-40 transition-all duration-300 ${isResultsPage ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white/90 border-gray-200 text-slate-800'}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link 
              to="/"
              className="flex items-center gap-2 cursor-pointer" 
            >
              <div className="bg-blue-600 p-1.5 rounded-lg text-white">
                <Plane className="w-5 h-5" />
              </div>
              <span className={`font-bold text-xl tracking-tight ${isResultsPage ? 'text-white' : 'text-gray-900'}`}>SkyLink AI</span>
            </Link>
            
            <div className="flex items-center gap-4">
              {user && (
                <button 
                  onClick={() => setIsAiModalOpen(true)}
                  className={`hidden md:flex items-center gap-1 font-medium px-3 py-1.5 rounded-lg transition-colors ${isResultsPage ? 'text-purple-300 hover:bg-white/10' : 'text-purple-600 hover:bg-purple-50'}`}
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
                  <div className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-all flex items-center justify-center ${
                      isResultsPage ? 'border-slate-600 bg-slate-800' : 'border-gray-300 bg-gray-100 group-hover:border-blue-400'
                    } ${user ? 'border-blue-400' : ''}`}>
                    {user ? (
                      <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className={`w-5 h-5 ${isResultsPage ? 'text-slate-400' : 'text-gray-400'} group-hover:text-blue-500`} />
                    )}
                  </div>
                  {user ? (
                     <span className={`text-sm font-medium hidden sm:block ${isResultsPage ? 'text-gray-200' : 'text-gray-700'}`}>{user.username}</span>
                  ) : (
                     <span className={`text-sm font-medium group-hover:text-blue-600 hidden sm:block ${isResultsPage ? 'text-gray-400' : 'text-gray-500'}`}>登录</span>
                  )}
                </button>

                {/* User Menu Popover */}
                {isUserMenuOpen && user && (
                  <div className="absolute right-0 top-full mt-3 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 z-50">
                    <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                      <p className="font-bold text-gray-800 truncate">{user.username}</p>
                      <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${
                        user.role === 'admin' 
                          ? 'bg-purple-50 text-purple-600 border-purple-100' 
                          : 'bg-blue-50 text-blue-600 border-blue-100'
                      }`}>
                        {user.role === 'admin' ? 'Administrator' : 'Verified User'}
                      </span>
                    </div>
                    
                    <div className="p-2 space-y-1">
                      {user.role === 'admin' ? (
                        <Link 
                          to="/admin"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-purple-600 rounded-xl transition-colors text-left"
                        >
                          <LayoutDashboard className="w-4 h-4" /> 管理后台
                        </Link>
                      ) : (
                        <Link 
                          to="/my-bookings"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-600 rounded-xl transition-colors text-left"
                        >
                          <Ticket className="w-4 h-4" /> 我的订单
                        </Link>
                      )}
                      
                      <Link 
                        to="/profile"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-600 rounded-xl transition-colors text-left"
                      >
                        <UserCog className="w-4 h-4" /> 个人信息管理
                      </Link>

                      <Link 
                        to="/settings"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-600 rounded-xl transition-colors text-left"
                      >
                        <Settings className="w-4 h-4" /> 账户设置
                      </Link>
                    </div>

                    <div className="p-2 border-t border-gray-100 bg-gray-50/30">
                      <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors text-left"
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
      
      <AiAssistantModal 
        isOpen={isAiModalOpen} 
        onClose={() => setIsAiModalOpen(false)} 
        onSelectRecommendation={handleAiRecommendation}
      />
    </>
  );
};

export default Navbar;
