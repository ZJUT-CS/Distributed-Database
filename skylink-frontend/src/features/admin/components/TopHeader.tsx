import React from 'react';
import { Search, Bell } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';

interface TopHeaderProps {
  isVisible: boolean;
}

const TopHeader: React.FC<TopHeaderProps> = ({ isVisible }) => {
  const { user } = useAuth();
  const location = useLocation();
  const date = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });

  const getTitle = (path: string) => {
    if (path === '/admin') return '仪表盘';
    if (path.includes('flights')) return '航班管理';
    if (path.includes('bookings')) return '订单管理';
    if (path.includes('users')) return '用户管理';
    if (path.includes('payments')) return '支付管理';
    if (path.includes('settings')) return '系统设置';
    return '管理后台';
  };

  return (
    <div
      className={`fixed top-0 right-0 left-64 h-16 bg-white/80 backdrop-blur-md shadow-sm z-40 flex items-center justify-between px-8 transition-transform duration-300 ease-in-out ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="flex items-center gap-4 text-gray-800">
        <h2 className="text-xl font-bold tracking-tight">{getTitle(location.pathname)}</h2>
        <div className="h-4 w-px bg-gray-300 mx-2"></div>
        <span className="text-sm text-gray-500 flex items-center gap-2">
          欢迎回来，
          <Link to="/admin/settings" className="font-medium text-gray-700 hover:text-blue-600 transition-colors">
            {user?.username}
          </Link>
          。今天是 {date}
        </span>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative hidden md:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="搜索订单、用户或航班号..."
            className="pl-10 pr-4 py-2 bg-gray-100 border-transparent focus:bg-white border focus:border-blue-500 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none w-64 transition-all"
          />
        </div>
        <button className="relative p-2 hover:bg-gray-100 rounded-full transition-colors group">
          <Bell className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-colors" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </button>
      </div>
    </div>
  );
};

export default TopHeader;

