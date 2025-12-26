import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Plane,
  Ticket,
  Users,
  CreditCard,
  Settings,
  LogOut,
  ChevronRight,
  Shield,
  FileText,
  Home,
  MapPin,
  Sliders,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '../../auth/hooks/useAuth';
import { Image } from '@/components/common';

interface SidebarProps {
  isDashboard: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isDashboard }) => {
  const { user, logout } = useAuth();
  const [sidebarDark, setSidebarDark] = React.useState(() => {
    // 默认暗色，从 localStorage 读取用户偏好
    const saved = localStorage.getItem('adminSidebarTheme');
    return saved === 'light' ? false : true; // 默认 true (暗色)
  });

  const toggleSidebarTheme = () => {
    setSidebarDark(prev => {
      const newValue = !prev;
      localStorage.setItem('adminSidebarTheme', newValue ? 'dark' : 'light');
      return newValue;
    });
  };

  const navGroups = [
    {
      title: 'OVERVIEW',
      items: [{ id: 'dashboard', icon: LayoutDashboard, label: '仪表盘', path: '/admin' }],
    },
    {
      title: 'BUSINESS',
      items: [
        { id: 'flights', icon: Plane, label: '航班管理', path: '/admin/flights' },
        { id: 'orders', icon: Ticket, label: '订单管理', path: '/admin/orders' },
        { id: 'order-audit', icon: Ticket, label: '审核中心', path: '/admin/orders/audit' },
        { id: 'payments', icon: CreditCard, label: '支付流水', path: '/admin/payments' },
      ],
    },
    {
      title: 'BASE DATA',
      items: [
        { id: 'routes', icon: MapPin, label: '航线管理', path: '/admin/routes' },
        { id: 'aircraft-models', icon: Plane, label: '机型管理', path: '/admin/aircraft-models' },
        { id: 'cabin-configs', icon: Sliders, label: '舱位配置', path: '/admin/cabin-configs' },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        { id: 'users', icon: Users, label: '用户管理', path: '/admin/users' },
        { id: 'admins', icon: Shield, label: '管理员管理', path: '/admin/admins' },
        { id: 'logs', icon: FileText, label: '操作日志', path: '/admin/system/logs' },
        { id: 'settings', icon: Settings, label: '系统配置', path: '/admin/system/config' },
      ],
    },
  ];

  return (
    <div
      className="w-64 h-screen fixed left-0 top-0 flex flex-col shadow-2xl z-50 transition-all duration-300 border-r"
      style={sidebarDark ? {
        backgroundColor: '#0f172a', // slate-900
        borderColor: '#1e293b', // slate-800
        color: '#ffffff'
      } : {
        backgroundColor: '#ffffff',
        borderColor: '#e2e8f0', // slate-200
        color: '#0f172a' // slate-900
      }}
    >
      <div className="p-6 border-b flex items-center gap-3" style={{ borderColor: sidebarDark ? '#1e293b' : '#f1f5f9' }}>
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-2 rounded-xl shadow-lg shadow-blue-500/20">
          <Plane className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold tracking-tight" style={{ color: sidebarDark ? '#ffffff' : '#0f172a' }}>SkyLink</h1>
          <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: sidebarDark ? '#94a3b8' : '#64748b' }}>Admin Panel</p>
        </div>
        {/* 主题切换按钮 */}
        <button
          onClick={toggleSidebarTheme}
          className="p-2 rounded-lg transition-all hover:scale-110"
          style={{
            backgroundColor: sidebarDark ? 'rgba(148, 163, 184, 0.1)' : 'rgba(100, 116, 139, 0.1)',
            color: sidebarDark ? '#94a3b8' : '#64748b'
          }}
          title={sidebarDark ? '切换到浅色模式' : '切换到深色模式'}
        >
          {sidebarDark ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </button>
      </div>

      <nav className="flex-1 p-4 overflow-y-auto custom-scrollbar">
        {navGroups.map((group, groupIndex) => (
          <div key={group.title} className={groupIndex > 0 ? 'mt-6' : ''}>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3 px-2" style={{ color: sidebarDark ? '#64748b' : '#94a3b8' }}>{group.title}</h3>
            <div className="space-y-1">
              {group.items.map((item) => (
                <NavLink
                  key={item.id}
                  to={item.path}
                  end={item.id === 'dashboard'}
                  className={({ isActive }) =>
                    `w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 group ${isActive
                      ? 'font-bold shadow-sm border'
                      : ''
                    }`
                  }
                  style={({ isActive }) => isActive
                    ? (sidebarDark ? {
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      color: '#60a5fa',
                      borderColor: 'rgba(59, 130, 246, 0.2)'
                    } : {
                      backgroundColor: '#eff6ff',
                      color: '#2563eb',
                      borderColor: '#bfdbfe'
                    })
                    : (sidebarDark ? {
                      color: '#94a3b8'
                    } : {
                      color: '#475569'
                    })
                  }
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  <ChevronRight className="w-3 h-3 opacity-0 -translate-x-2 transition-all group-hover:opacity-50 group-hover:translate-x-0" />
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t" style={{ borderColor: sidebarDark ? '#1e293b' : '#f1f5f9', backgroundColor: sidebarDark ? 'rgba(15, 23, 42, 0.5)' : 'rgba(248, 250, 252, 0.5)' }}>
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-10 h-10 rounded-full border-2 overflow-hidden shadow-sm" style={{ backgroundColor: sidebarDark ? '#334155' : '#e2e8f0', borderColor: sidebarDark ? '#475569' : '#ffffff' }}>
            <Image src={user?.avatarUrl || ''} alt="Admin" loading="eager" />
          </div>
          <div>
            <p className="font-bold text-sm" style={{ color: sidebarDark ? '#ffffff' : '#0f172a' }}>{user?.username}</p>
            <p className="text-xs text-slate-500">System Administrator</p>
          </div>
        </div>

        <Link
          to="/"
          className="w-full flex items-center justify-center gap-2 text-sm font-semibold p-3 rounded-xl transition-all duration-200 hover:-translate-y-px active:translate-y-0 active:scale-[0.99] mb-3 shadow-sm border"
          style={sidebarDark ? {
            color: '#e2e8f0',
            backgroundColor: 'rgba(30, 41, 59, 0.6)',
            borderColor: '#475569'
          } : {
            color: '#475569',
            backgroundColor: '#ffffff',
            borderColor: '#e2e8f0'
          }}
        >
          <Home className="w-4 h-4" /> 返回主页面
        </Link>
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 text-sm font-semibold p-3 rounded-xl transition-all duration-200 hover:-translate-y-px active:translate-y-0 active:scale-[0.99] border shadow-sm"
          style={sidebarDark ? {
            backgroundColor: 'rgba(30, 41, 59, 0.6)',
            color: '#e2e8f0',
            borderColor: '#475569'
          } : {
            backgroundColor: '#ffffff',
            color: '#475569',
            borderColor: '#e2e8f0'
          }}
        >
          <LogOut className="w-4 h-4" /> 退出登录
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

