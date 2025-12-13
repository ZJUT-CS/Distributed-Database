import React, { useState } from 'react';
import { User as UserIcon, Lock, ArrowRight, ShieldAlert, HelpCircle } from 'lucide-react';
import { User } from '../types';

interface LoginFormProps {
  onLogin: (user: User) => void;
  onCancel: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin, onCancel }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      onLogin({
        username: username,
        role: isAdminMode ? 'admin' : 'user',
        avatarUrl: `https://ui-avatars.com/api/?name=${username}&background=0D8ABC&color=fff`
      });
      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-[600px] flex items-center justify-center p-4 animate-fade-in-up">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-white/10 opacity-30 skew-y-6 transform origin-top-left scale-150"></div>
          <h2 className="text-3xl font-bold text-white relative z-10 mb-2">
            {isAdminMode ? '管理员登录' : '欢迎回来'}
          </h2>
          <p className="text-blue-100 relative z-10 text-sm">
            {isAdminMode ? 'SkyLink 内部管理系统' : '登录以开启您的智能旅程'}
          </p>
        </div>

        {/* Form */}
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase ml-1">
                {isAdminMode ? '管理员账号' : '用户名 / 手机号'}
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white"
                  placeholder={isAdminMode ? "admin" : "请输入用户名"}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase ml-1">密码</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white transition-all transform active:scale-95 ${
                isAdminMode 
                  ? 'bg-slate-800 hover:bg-slate-900 shadow-slate-500/30' 
                  : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30'
              }`}
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isAdminMode ? '系统登录' : '立即登录'} <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer Options */}
          <div className="mt-8 flex justify-between items-center text-xs">
            <button
              type="button"
              onClick={() => setIsAdminMode(!isAdminMode)}
              className="flex items-center gap-1.5 text-gray-400 hover:text-gray-700 transition-colors"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              {isAdminMode ? '切换回普通用户' : '管理员登录'}
            </button>

            <button
              type="button"
              onClick={() => alert('重置密码链接已发送至您的邮箱')}
              className="flex items-center gap-1.5 text-gray-400 hover:text-blue-600 transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              忘记密码？
            </button>
          </div>
          
          <div className="mt-6 text-center">
             <button onClick={onCancel} className="text-gray-300 hover:text-gray-500 text-xs transition-colors">
               暂不登录，先看看 (部分功能受限)
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
