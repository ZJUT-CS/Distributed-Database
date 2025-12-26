import React from 'react';
import { Search, Bell } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';

interface TopHeaderProps {
  isVisible: boolean;
  isDashboard: boolean;
}

const TopHeader: React.FC<TopHeaderProps> = ({ isVisible, isDashboard }) => {
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
      className={`fixed top-0 right-0 left-64 h-16 backdrop-blur-md shadow-sm z-40 flex items-center justify-between px-8 transition-transform duration-300 ease-in-out border-b ${isVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
      style={isDashboard ? {
        backgroundColor: 'rgba(15, 23, 42, 0.8)', // slate-900/80
        borderColor: '#1e293b', // slate-800
        color: '#f1f5f9' // slate-100
      } : {
        backgroundColor: 'rgba(255, 255, 255, 0.8)', // white/80
        borderColor: '#f3f4f6', // gray-100
        color: '#1f2937' // gray-800
      }}
    >
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-bold tracking-tight" style={{ color: isDashboard ? '#ffffff' : '#111827' }}>{getTitle(location.pathname)}</h2>
        <div className="h-4 w-px mx-2" style={{ backgroundColor: isDashboard ? '#475569' : '#d1d5db' }}></div>
        <span className="text-sm flex items-center gap-2" style={{ color: isDashboard ? '#94a3b8' : '#6b7280' }}>
          欢迎回来，
          <Link to="/admin/settings" className="font-medium transition-colors hover:text-blue-600" style={{ color: isDashboard ? '#cbd5e1' : '#374151' }}>
            {user?.username}
          </Link>
          。今天是 {date}
        </span>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative hidden md:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: isDashboard ? '#64748b' : '#9ca3af' }} />
          <input
            type="text"
            placeholder="搜索订单、用户或航班号..."
            className="pl-10 pr-4 py-2 border-transparent rounded-lg text-sm outline-none w-64 transition-all"
            style={isDashboard ? {
              backgroundColor: '#1e293b',
              color: '#e2e8f0',
            } : {
              backgroundColor: '#f3f4f6',
              color: '#111827',
            }}
          />
        </div>
        <button className="relative p-2 rounded-full transition-colors group">
          <Bell className="w-5 h-5 transition-colors" style={{ color: isDashboard ? '#94a3b8' : '#4b5563' }} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border" style={{ borderColor: isDashboard ? '#0f172a' : '#ffffff' }}></span>
        </button>
      </div>
    </div>
  );
};
export default TopHeader;


