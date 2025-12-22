import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User as UserIcon, Lock, ArrowRight, ShieldAlert, Mail } from 'lucide-react';
import { adminLoginApi, loginApi, registerApi } from '../api/auth';
import type { User } from '../types';

interface LoginFormProps {
  onLogin: (user: User) => void;
  onCancel: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin, onCancel }) => {
  const navigate = useNavigate();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const account = phoneNumber.trim();
    const pwd = password;
    const mail = email.trim();

    if (!account || !pwd) return;
    if (!isAdminMode && !/^\d{11}$/.test(account)) {
      alert('请输入正确的手机号（11位数字）');
      return;
    }
    if (pwd.length < 6) {
      alert('密码长度至少 6 位');
      return;
    }

    if (isRegisterMode) {
      if (!mail) {
        alert('请输入邮箱');
        return;
      }
      if (!/^\S+@\S+\.\S+$/.test(mail)) {
        alert('请输入正确的邮箱');
        return;
      }
      if (pwd !== confirmPassword) {
        alert('两次输入的密码不一致');
        return;
      }
    }

    setLoading(true);
    try {
      if (isRegisterMode) {
        const ok = await registerApi({ phoneNumber: account, password: pwd, email: mail });
        if (!ok) throw new Error('注册失败');
      }

      const res = isAdminMode
        ? await adminLoginApi({ adminAccount: account, password: pwd })
        : await loginApi({ phoneNumber: account, password: pwd });
      if (!res) {
        throw new Error('登录失败：服务端未返回用户信息');
      }

      if (isAdminMode && res.role !== 'admin') {
        throw new Error('该账号不是管理员，无法登录控制台');
      }

      if (res.token) {
        localStorage.setItem('token', res.token);
      }

      const resolvedUserId = (res as any).userId ?? (res as any).id;
      const resolvedUsername = (res as any).username ?? (res as any).displayName ?? account;

      onLogin({
        id: resolvedUserId,
        username: resolvedUsername,
        email: isRegisterMode ? mail : undefined,
        phoneNumber: isAdminMode ? undefined : account,
        createdAt: new Date().toISOString(),
        role: res.role,
        adminRole: isAdminMode ? (res as any).adminRole : undefined,
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(resolvedUsername)}&background=${isRegisterMode ? 'random' : '0D8ABC'}&color=fff`,
      });
    } catch (err: any) {
      alert(err?.message || '请求失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsRegisterMode(!isRegisterMode);
    setIsAdminMode(false);
    setPassword('');
    setConfirmPassword('');
    setEmail('');
  };

  return (
    <div className="min-h-[600px] flex items-center justify-center p-4 animate-fade-in-up">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
        <div
          className={`p-8 text-center relative overflow-hidden transition-colors duration-500 ${
            isRegisterMode ? 'bg-gradient-to-br from-cyan-500 to-blue-600' : 'bg-gradient-to-br from-blue-700 to-indigo-800'
          }`}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-8 -mt-8 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-8 -mb-8 blur-xl"></div>

          <div className="relative z-10">
            <div className="w-12 h-12 bg-white/20 rounded-2xl mx-auto mb-4 flex items-center justify-center backdrop-blur-sm shadow-inner">
              {isRegisterMode ? <UserIcon className="w-6 h-6 text-white" /> : <Lock className="w-6 h-6 text-white" />}
            </div>
            <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">
              {isRegisterMode ? '创建新账号' : isAdminMode ? '管理员控制台' : '欢迎回来'}
            </h2>
            <p className="text-blue-100/90 text-sm font-medium">
              {isRegisterMode ? '开启您的智能飞行之旅' : isAdminMode ? 'SkyLink 内部管理系统' : '登录以管理您的行程'}
            </p>
          </div>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase ml-1">{isAdminMode ? '管理员账号' : '手机号'}</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white"
                  placeholder={isAdminMode ? 'admin' : '请输入手机号（11位）'}
                  required
                />
              </div>
            </div>

            {isRegisterMode && (
              <div className="space-y-1 animate-fade-in">
                <label className="text-xs font-semibold text-gray-500 uppercase ml-1">电子邮箱</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white"
                    placeholder="your@email.com"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-gray-500 uppercase ml-1">密码</label>
                {!isRegisterMode && (
                  <button
                    type="button"
                    onClick={() => alert('重置密码链接已发送至您的邮箱')}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  >
                    忘记密码？
                  </button>
                )}
              </div>
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
                  required
                />
              </div>
            </div>

            {isRegisterMode && (
              <div className="space-y-1 animate-fade-in">
                <label className="text-xs font-semibold text-gray-500 uppercase ml-1">确认密码</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock
                      className={`h-5 w-5 transition-colors ${password && confirmPassword && password !== confirmPassword ? 'text-red-400' : 'text-gray-400 group-focus-within:text-blue-500'}`}
                    />
                  </div>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`block w-full pl-10 pr-3 py-3 border rounded-xl focus:ring-2 outline-none transition-all bg-gray-50 focus:bg-white ${
                      password && confirmPassword && password !== confirmPassword
                        ? 'border-red-300 focus:ring-red-200'
                        : 'border-gray-200 focus:ring-blue-500 focus:border-transparent'
                    }`}
                    placeholder="••••••••"
                    required
                  />
                </div>
                {password && confirmPassword && password !== confirmPassword && <p className="text-xs text-red-500 ml-1">两次输入的密码不一致</p>}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white transition-all transform hover:-translate-y-0.5 active:translate-y-0 ${
                isRegisterMode
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-cyan-500/30'
                  : isAdminMode
                    ? 'bg-slate-800 hover:bg-slate-700 shadow-slate-500/30'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-500/30'
              }`}
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isRegisterMode ? '立即注册' : isAdminMode ? '系统登录' : '立即登录'} <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                if (!isRegisterMode && isAdminMode) {
                  navigate('/admin-apply');
                  return;
                }
                toggleMode();
              }}
              className={`text-sm font-medium transition-colors hover:underline ${
                isRegisterMode ? 'text-cyan-600 hover:text-cyan-700' : 'text-blue-600 hover:text-blue-700'
              }`}
            >
              {isRegisterMode ? '已有账号？立即登录' : isAdminMode ? '提交入驻申请' : '没有账号？立即注册'}
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100 flex justify-between items-center text-xs">
            {!isRegisterMode ? (
              <button
                type="button"
                onClick={() => setIsAdminMode(!isAdminMode)}
                className="flex items-center gap-1.5 text-gray-400 hover:text-gray-700 transition-colors"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                {isAdminMode ? '普通用户登录' : '管理员登录'}
              </button>
            ) : (
              <div />
            )}

            <button
              onClick={onCancel}
              className="flex items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors ml-auto"
            >
              暂不登录，先看看
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
