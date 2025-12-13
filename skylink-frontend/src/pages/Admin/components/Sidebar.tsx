import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Plane, Ticket, Users, CreditCard, Settings, LogOut, ChevronRight } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: '仪表盘', path: '/admin' },
    { id: 'flights', icon: Plane, label: '航班管理', path: '/admin/flights' },
    { id: 'bookings', icon: Ticket, label: '订单管理', path: '/admin/bookings' },
    { id: 'users', icon: Users, label: '用户管理', path: '/admin/users' },
    { id: 'payments', icon: CreditCard, label: '支付网关', path: '/admin/payments' },
    { id: 'settings', icon: Settings, label: '系统设置', path: '/admin/settings' },
  ];

  return (
    <div className="w-64 bg-slate-900 h-screen fixed left-0 top-0 text-white flex flex-col shadow-2xl z-50">
      {/* Brand */}
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-xl shadow-lg shadow-blue-500/20">
          <Plane className="w-6 h-6 text-white" />
        </div>
        <div>
           <h1 className="text-xl font-bold tracking-tight">SkyLink</h1>
           <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Admin Panel</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            end={item.id === 'dashboard'} 
            className={({ isActive }) => `w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-200 group ${
              isActive 
                ? 'bg-blue-600 shadow-lg shadow-blue-900/50 text-white' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <item.icon className={`w-5 h-5 transition-transform group-hover:scale-110`} />
              <span className="font-medium">{item.label}</span>
            </div>
            <ChevronRight className={`w-4 h-4 opacity-0 -translate-x-2 transition-all group-hover:opacity-50 group-hover:translate-x-0`} />
          </NavLink>
        ))}
      </nav>

      {/* User & Logout */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/50">
         <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-slate-700 border-2 border-slate-600 overflow-hidden">
               <img src={user?.avatarUrl} alt="Admin" className="w-full h-full object-cover" />
            </div>
            <div>
               <p className="font-bold text-sm text-white">{user?.username}</p>
               <p className="text-xs text-slate-500">System Administrator</p>
            </div>
         </div>
         <button 
           onClick={logout}
           className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-red-500/10 hover:text-red-400 text-slate-400 p-3 rounded-xl transition-all border border-slate-700 hover:border-red-500/30"
         >
           <LogOut className="w-4 h-4" /> 退出登录
         </button>
      </div>
    </div>
  );
};

export default Sidebar;
