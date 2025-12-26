import React from 'react';
import type { User } from '../../auth/types';
import { ArrowLeft, Mail, Shield, User as UserIcon, CreditCard, CalendarDays, ShieldCheck } from 'lucide-react';
import { isUserVerified } from '@/shared/utils/userVerification';

interface UserProfileProps {
  user: User;
  onBack?: () => void;
  mode?: 'page' | 'embedded';
}

const UserProfile: React.FC<UserProfileProps> = ({ user, onBack, mode = 'page' }) => {
  const containerClassName =
    mode === 'page' ? 'animate-fade-in-up mt-8 w-full max-w-screen-2xl mx-auto mb-20 px-4 sm:px-6 lg:px-8' : 'animate-fade-in-up';

  const displayName = user.realName && user.realName.trim().length > 0 ? user.realName : user.username;

  const lastChar = displayName.charAt(displayName.length - 1) || '?';
  const seed = displayName.charCodeAt(0) || 0;
  const colors = ['bg-blue-500', 'bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-sky-500'];
  const avatarColor = colors[seed % colors.length];

  // 使用统一的严格校验标准
  const isVerified = isUserVerified(user);

  const formatMaskedIdCard = (id?: string) => {
    if (!id) return '未实名认证';
    if (id.length < 8) return '证件号格式不完整';
    const prefix = id.slice(0, 6);
    const suffix = id.slice(-4);
    return `${prefix}********${suffix}`;
  };

  const getGenderLabel = (gender?: 0 | 1 | 2) => {
    if (gender === 1) return '男';
    if (gender === 2) return '女';
    return '未设置';
  };

  const getRegisterDays = (createdAt?: string) => {
    if (!createdAt) return null;
    const created = new Date(createdAt).getTime();
    if (Number.isNaN(created)) return null;
    const diff = Date.now() - created;
    const days = Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24)));
    return days;
  };

  const registerDays = getRegisterDays(user.createdAt);

  return (
    <div className={containerClassName}>
      <div className="relative overflow-hidden rounded-3xl border border-sky-100 dark:border-sky-900/30 bg-gradient-to-br from-sky-400 via-sky-300 to-sky-500 dark:from-sky-900 dark:via-sky-800 dark:to-indigo-900 shadow-xl">
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-16 w-64 h-64 rounded-full bg-sky-200/60 blur-3xl" />

        <div className="relative p-6 sm:p-8">
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-center gap-4">
              {mode === 'page' && (
                <button
                  onClick={onBack}
                  className="p-2.5 rounded-xl bg-sky-50/80 dark:bg-sky-900/40 border border-white/60 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 text-sky-700 dark:text-sky-100 transition-all shadow-sm"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-sky-50 tracking-tight drop-shadow-sm">个人概览</h2>
                <p className="text-sm text-sky-100/90 mt-1">实名信息与账号基础信息总览</p>
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-[0.32fr_0.68fr] gap-6">
            <div className="rounded-3xl bg-white/95 dark:bg-slate-800/95 border border-sky-100 dark:border-sky-900/50 p-6 sm:p-7 shadow-md shadow-sky-900/10 flex flex-col items-center text-center">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={displayName}
                  className="w-24 h-24 rounded-full object-cover shadow-lg shadow-sky-500/40"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    const fallback = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
              ) : null}
              <div
                className={`w-24 h-24 rounded-full ${avatarColor} flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-sky-500/40 ${user.avatarUrl ? 'hidden' : ''}`}
              >
                {lastChar}
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-center gap-2">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-gray-100 truncate max-w-[200px]">{displayName}</h3>
                  {isVerified ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                      <ShieldCheck className="w-3 h-3" /> 已实名认证
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                      <Shield className="w-3 h-3" /> 未实名认证
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-sky-500/90 dark:text-sky-400/80">购票前请务必完成实名认证</p>
              </div>

              <div className="mt-5 w-full grid grid-cols-2 gap-3 text-left">
                <div className="rounded-2xl bg-sky-50/80 dark:bg-sky-900/20 border border-sky-100 dark:border-sky-800/30 p-4">
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <CreditCard className="w-4 h-4 text-sky-500" />
                    身份证号
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-gray-200 break-all">{formatMaskedIdCard(user.idCard)}</div>
                </div>
                <div className="rounded-2xl bg-sky-50/80 dark:bg-sky-900/20 border border-sky-100 dark:border-sky-800/30 p-4">
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <UserIcon className="w-4 h-4 text-sky-500" />
                    性别
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-gray-200">{getGenderLabel(user.gender)}</div>
                </div>
                <div className="rounded-2xl bg-sky-50/80 dark:bg-sky-900/20 border border-sky-100 dark:border-sky-800/30 p-4">
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <Mail className="w-4 h-4 text-sky-500" />
                    邮箱
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-gray-200 truncate">{user.email || '未绑定'}</div>
                </div>
                <div className="rounded-2xl bg-sky-50/80 dark:bg-sky-900/20 border border-sky-100 dark:border-sky-800/30 p-4">
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium dark:text-gray-400">
                    <CalendarDays className="w-4 h-4 text-sky-500 dark:text-sky-400" />
                    注册天数
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-gray-200">{registerDays ? `${registerDays} 天` : '未统计'}</div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-sky-50/90 dark:bg-slate-800/50 border border-sky-100 dark:border-sky-900/30 p-6 sm:p-7">
              <div className="text-sm font-bold text-slate-900 dark:text-gray-200 mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4 text-sky-600" />
                账户概览
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white dark:bg-slate-700/50 border border-sky-100 dark:border-sky-900/30 p-4">
                  <div className="text-xs text-slate-500 font-medium dark:text-gray-400">账户状态</div>
                  <div className="mt-1 text-lg font-bold text-sky-700 flex items-center gap-1 dark:text-sky-400">正常</div>
                </div>
                <div className="rounded-2xl bg-white dark:bg-slate-700/50 border border-sky-100 dark:border-sky-900/30 p-4">
                  <div className="text-xs text-slate-500 font-medium dark:text-gray-400">实名认证</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900 flex items-center gap-1 dark:text-gray-100">
                    {isVerified ? (
                      <>
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                        已完成
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4 text-amber-500" />
                        未完成
                      </>
                    )}
                  </div>
                </div>
                <div className="rounded-2xl bg-white dark:bg-slate-700/50 border border-sky-100 dark:border-sky-900/30 p-4">
                  <div className="text-xs text-slate-500 font-medium dark:text-gray-400">性别</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-gray-200">{getGenderLabel(user.gender)}</div>
                </div>
                <div className="rounded-2xl bg-white dark:bg-slate-700/50 border border-sky-100 dark:border-sky-900/30 p-4">
                  <div className="text-xs text-slate-500 font-medium">绑定邮箱</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-gray-200">{user.email ? '已绑定' : '未绑定'}</div>
                </div>
              </div>
              <div className="mt-5 text-xs text-slate-500 dark:text-gray-400">实名信息无法在此直接修改，如需变更请联系人工客服处理。</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
