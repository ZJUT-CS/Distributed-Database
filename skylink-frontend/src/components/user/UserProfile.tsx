import React from 'react';
import { User } from '../../types';
import { ArrowLeft, Edit2, Mail, Shield, User as UserIcon } from 'lucide-react';

interface UserProfileProps {
  user: User;
  onBack: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, onBack }) => {
  return (
    <div className="animate-fade-in-up mt-8 max-w-5xl mx-auto mb-20 px-4 sm:px-6">
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 shadow-xl">
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-blue-500/15 blur-3xl" />
        <div className="absolute -bottom-24 -left-16 w-64 h-64 rounded-full bg-indigo-500/15 blur-3xl" />

        <div className="relative p-6 sm:p-8">
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2.5 rounded-xl bg-white/10 border border-white/10 hover:bg-white/15 text-white/90 transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">个人信息管理</h2>
                <p className="text-sm text-slate-300 mt-1">维护您的账户资料与安全信息</p>
              </div>
            </div>

            <button className="shrink-0 px-4 py-2.5 rounded-xl bg-white text-slate-900 text-sm font-bold hover:bg-slate-100 transition-colors flex items-center gap-2 shadow-lg shadow-black/10">
              <Edit2 className="w-4 h-4" /> 编辑资料
            </button>
          </div>

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">
            <div className="rounded-3xl bg-white/5 border border-white/10 p-6 sm:p-7">
              <div className="flex items-start gap-5">
                <div className="relative">
                  <img
                    src={user.avatarUrl}
                    alt={user.username}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border border-white/10 object-cover"
                  />
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center border border-white/10 shadow-lg shadow-blue-500/20">
                    <UserIcon className="w-4 h-4" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-xl sm:text-2xl font-bold text-white truncate">{user.username}</h3>
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full border ${
                        user.role === 'admin'
                          ? 'bg-purple-500/15 text-purple-200 border-purple-400/20'
                          : 'bg-blue-500/15 text-blue-200 border-blue-400/20'
                      }`}
                    >
                      {user.role === 'admin' ? 'Administrator' : 'Verified User'}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                      <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">邮箱</div>
                      <div className="mt-1 flex items-center gap-2 text-sm text-white/90">
                        <Mail className="w-4 h-4 text-slate-300" />
                        <span className="truncate">{user.email || '未绑定'}</span>
                      </div>
                    </div>
                    <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                      <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">角色</div>
                      <div className="mt-1 flex items-center gap-2 text-sm text-white/90">
                        <Shield className="w-4 h-4 text-slate-300" />
                        <span className="capitalize">{user.role}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-7">
              <div className="text-sm font-bold text-slate-900">账户概览</div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                  <div className="text-xs text-slate-500 font-medium">账户状态</div>
                  <div className="mt-1 text-lg font-bold text-slate-900">正常</div>
                </div>
                <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                  <div className="text-xs text-slate-500 font-medium">安全等级</div>
                  <div className="mt-1 text-lg font-bold text-slate-900">A</div>
                </div>
              </div>
              <button className="mt-5 w-full rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3 hover:from-blue-500 hover:to-indigo-500 transition-all shadow-lg shadow-blue-500/25">
                绑定邮箱与安全信息
              </button>
              <div className="mt-3 text-xs text-slate-500">
                完善资料可提升购票与改签体验
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;

