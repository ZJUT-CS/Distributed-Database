import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User as UserIcon, Lock, ArrowRight, ShieldAlert } from 'lucide-react';
import { adminRegisterApi } from '../../features/auth/api/auth';
import { useToast } from '@/features/admin/components/Toast';
import { PageLayout } from '@/features/auth';

const AdminApplyPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const u = username.trim();
    const p = password;
    if (!u || !p) return;
    if (u.length < 3) {
      toast.error('账号长度至少 3 位');
      return;
    }
    if (p.length < 6) {
      toast.error('密码长度至少 6 位');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('两次输入的密码不一致');
      return;
    }

    setLoading(true);
    try {
      const ok = await adminRegisterApi({ adminAccount: u, password: p });
      if (!ok) throw new Error('提交失败');

      toast.success('入驻申请已提交（管理员账号已创建），请使用该账号在管理员登录入口登录');
      navigate('/login');
    } catch (err: any) {
      toast.error(err?.message || '请求失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout>
      <div className="min-h-[600px] flex items-center justify-center p-4 animate-fade-in-up">
        <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
            {/* Header */}
            <div className="p-8 text-center relative overflow-hidden transition-colors duration-500 bg-gradient-to-br from-blue-700 to-indigo-800">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-8 -mt-8 blur-2xl"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-8 -mb-8 blur-xl"></div>

              <div className="relative z-10">
                <div className="w-12 h-12 bg-white/20 rounded-2xl mx-auto mb-4 flex items-center justify-center backdrop-blur-sm shadow-inner">
                  <ShieldAlert className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">管理员入驻申请</h2>
                <p className="text-blue-100/90 text-sm font-medium">SkyLink 内部管理系统</p>
              </div>
            </div>

            {/* Form */}
            <div className="p-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase ml-1">管理员账号</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <UserIcon className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white"
                      placeholder="例如：admin"
                      required
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
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase ml-1">确认密码</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock
                        className={`h-5 w-5 transition-colors ${
                          password && confirmPassword && password !== confirmPassword
                            ? 'text-red-400'
                            : 'text-gray-400 group-focus-within:text-blue-500'
                        }`}
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
                  {password && confirmPassword && password !== confirmPassword && (
                    <p className="text-xs text-red-500 ml-1">两次输入的密码不一致</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white transition-all transform hover:-translate-y-0.5 active:translate-y-0 bg-slate-800 hover:bg-slate-700 shadow-slate-500/30"
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      提交入驻申请 <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-8 pt-6 border-t border-gray-100 flex justify-between items-center text-xs">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="flex items-center gap-1.5 text-gray-400 hover:text-gray-700 transition-colors"
                >
                  返回登录
                  <ArrowRight className="w-3 h-3" />
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="flex items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors ml-auto"
                >
                  暂不申请，先看看
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
      </div>
      </PageLayout>
  );
};

export default AdminApplyPage;
