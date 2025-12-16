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
      <div className="relative overflow-hidden rounded-3xl border border-sky-100 bg-gradient-to-br from-sky-400 via-sky-300 to-sky-500 shadow-xl">
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-16 w-64 h-64 rounded-full bg-sky-200/60 blur-3xl" />

        <div className="relative p-6 sm:p-8">
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2.5 rounded-xl bg-sky-50/80 border border-white/60 hover:bg-white text-sky-700 transition-all shadow-sm"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-sky-50 tracking-tight drop-shadow-sm">个人信息管理</h2>
                <p className="text-sm text-sky-100/90 mt-1">维护您的账户资料与安全信息</p>
              </div>
            </div>

            <button className="shrink-0 px-4 py-2.5 rounded-xl bg-white/95 text-sky-900 text-sm font-bold hover:bg-white transition-colors flex items-center gap-2 shadow-lg shadow-sky-500/30">
              <Edit2 className="w-4 h-4" /> 编辑资料
            </button>
          </div>

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">
            <div className="rounded-3xl bg-white/90 border border-sky-100 p-6 sm:p-7 shadow-md shadow-sky-900/10">
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
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900 truncate">{user.username}</h3>
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full border ${
                        user.role === 'admin'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : 'bg-sky-50 text-sky-700 border-sky-200'
                      }`}
                    >
                      {user.role === 'admin' ? 'Administrator' : 'Verified User'}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-sky-50/70 border border-sky-100 p-4">
                      <div className="text-[10px] font-bold text-sky-600 uppercase tracking-wider">邮箱</div>
                      <div className="mt-1 flex items-center gap-2 text-sm text-slate-800">
                        <Mail className="w-4 h-4 text-sky-500" />
                        <span className="truncate">{user.email || '未绑定'}</span>
                      </div>
                    </div>
                    <div className="rounded-2xl bg-sky-50/70 border border-sky-100 p-4">
                      <div className="text-[10px] font-bold text-sky-600 uppercase tracking-wider">角色</div>
                      <div className="mt-1 flex items-center gap-2 text-sm text-slate-800">
                        <Shield className="w-4 h-4 text-sky-500" />
                        <span className="capitalize">{user.role}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-sky-50 border border-sky-100 p-6 sm:p-7">
              <div className="text-sm font-bold text-slate-900">账户概览</div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white border border-sky-100 p-4">
                  <div className="text-xs text-slate-500 font-medium">账户状态</div>
                  <div className="mt-1 text-lg font-bold text-sky-700">正常</div>
                </div>
                <div className="rounded-2xl bg-white border border-sky-100 p-4">
                  <div className="text-xs text-slate-500 font-medium">安全等级</div>
                  <div className="mt-1 text-lg font-bold text-sky-700">A</div>
                </div>
              </div>
              <button className="mt-5 w-full rounded-2xl bg-gradient-to-r from-sky-500 to-sky-600 text-white font-bold py-3 hover:from-sky-400 hover:to-sky-600 transition-all shadow-lg shadow-sky-400/50">
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

