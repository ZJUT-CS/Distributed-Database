import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, CalendarDays, Check, Lock, Mail, Phone, Shield, ShieldCheck, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import {
  bindEmail,
  bindPhone,
  changePassword,
  getMyProfile,
  sendEmailCode as sendEmailCodeApi,
  sendPhoneCode as sendPhoneCodeApi,
  updateMyProfile,
} from '../../services/auth';

type TabKey = 'profile' | 'security';
type ToastState = { type: 'success' | 'error'; message: string };

const UserCenterPage: React.FC = () => {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const initialTab = useMemo<TabKey>(() => {
    const tab = new URLSearchParams(location.search).get('tab');
    return tab === 'security' ? 'security' : 'profile';
  }, [location.search]);

  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [toast, setToast] = useState<ToastState | null>(null);

  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailDraft, setEmailDraft] = useState('');
  const [emailCodeDraft, setEmailCodeDraft] = useState('');
  const [isEmailCodeSent, setIsEmailCodeSent] = useState(false);

  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [phoneDraft, setPhoneDraft] = useState('');
  const [phoneCodeDraft, setPhoneCodeDraft] = useState('');
  const [isPhoneCodeSent, setIsPhoneCodeSent] = useState(false);

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [realNameDraft, setRealNameDraft] = useState('');
  const [idCardDraft, setIdCardDraft] = useState('');
  const [idCardError, setIdCardError] = useState('');
  const [genderDraft, setGenderDraft] = useState<0 | 1 | 2>(0);
  const [syncing, setSyncing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [sendingPhone, setSendingPhone] = useState(false);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2500);
    return () => window.clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!user) return;
    setEmailDraft(user.email || '');
    setEmailCodeDraft('');
    setIsEmailCodeSent(false);
    setPhoneDraft(user.phoneNumber || '');
    setRealNameDraft(user.realName || '');
    setIdCardDraft(user.idCard || '');
    setGenderDraft(user.gender ?? 0);
    setIdCardError('');
  }, [user]);

  const isVerified = !!user?.realName && !!user?.idCard;

  const showToast = (type: ToastState['type'], message: string) => {
    setToast({ type, message });
  };

  const applyProfileToLocalUser = (p: any) => {
    const genderRaw = p?.gender;
    const g: 0 | 1 | 2 = genderRaw === 1 || genderRaw === 2 ? genderRaw : 0;
    updateUser({
      id: p?.userId ?? user?.id,
      phoneNumber: p?.phoneNumber ?? undefined,
      email: p?.email ?? undefined,
      realName: p?.realName ?? undefined,
      idCard: p?.idCard ?? undefined,
      gender: g,
      avatarUrl: p?.avatarUrl ?? undefined,
      createdAt: p?.createTime ? String(p.createTime) : user?.createdAt,
    });
  };

  useEffect(() => {
    if (!user?.id) return;
    setSyncing(true);
    getMyProfile()
      .then((p) => {
        applyProfileToLocalUser(p);
      })
      .catch((e: any) => {
        showToast('error', e?.message || '同步个人资料失败');
      })
      .finally(() => setSyncing(false));
  }, [user?.id]);

  const maskPhone = (phone?: string) => {
    if (!phone) return '未绑定';
    const p = phone.trim();
    if (p.length !== 11) return p;
    return `${p.slice(0, 3)}****${p.slice(-4)}`;
  };

  const maskIdCard = (id?: string) => {
    if (!id) return '';
    const v = id.trim();
    if (v.length < 8) return v;
    return `${v.slice(0, 6)}********${v.slice(-4)}`;
  };

  const getRegisterDays = (createdAt?: string) => {
    if (!createdAt) return 1;
    const created = new Date(createdAt).getTime();
    if (Number.isNaN(created)) return 1;
    const diff = Date.now() - created;
    return Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24)));
  };

  const displayName = user?.realName && user.realName.trim().length > 0 ? user.realName : user?.username || '';
  const avatarChar = displayName.charAt(displayName.length - 1) || 'U';
  const colors = ['bg-blue-500', 'bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-sky-500'];
  const colorSeed = displayName.charCodeAt(0) || 0;
  const avatarColor = colors[colorSeed % colors.length];

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    const params = new URLSearchParams(location.search);
    params.set('tab', tab);
    navigate({ pathname: '/user-center', search: `?${params.toString()}` }, { replace: true });
  };

  const handleBack = () => {
    if (!isVerified) {
      const ok = window.confirm('您尚未实名认证，将无法购买机票，是否现在去认证？');
      if (ok) {
        setActiveTab('profile');
        const params = new URLSearchParams(location.search);
        params.set('tab', 'profile');
        navigate({ pathname: '/user-center', search: `?${params.toString()}` }, { replace: true });
        return;
      }
    }
    navigate('/');
  };

  const validateIdCard = (val: string) => {
    const v = val.trim();
    return /^\d{17}[\dXx]$/.test(v);
  };

  const handleSubmitRealName = () => {
    if (saving) return;
    if (isVerified) {
      alert('实名信息无法直接修改，请联系客服人工审核。');
      return;
    }
    const rn = realNameDraft.trim();
    const id = idCardDraft.trim();
    if (!rn || !id) {
      setIdCardError('⚠️ 身份证号码格式不正确');
      showToast('error', '请填写姓名与身份证号');
      return;
    }
    if (!validateIdCard(id)) {
      setIdCardError('⚠️ 身份证号码格式不正确');
      showToast('error', '实名认证失败');
      return;
    }
    setIdCardError('');
    setSaving(true);
    updateMyProfile({ realName: rn, idCard: id })
      .then((p) => {
        applyProfileToLocalUser(p);
        showToast('success', '✅ 个人资料已更新');
      })
      .catch((e: any) => showToast('error', e?.message || '实名认证失败'))
      .finally(() => setSaving(false));
  };

  const handleSaveProfile = () => {
    if (saving) return;
    setSaving(true);
    updateMyProfile({ gender: genderDraft })
      .then((p) => {
        applyProfileToLocalUser(p);
        showToast('success', '✅ 个人资料已更新');
      })
      .catch((e: any) => showToast('error', e?.message || '保存失败'))
      .finally(() => setSaving(false));
  };

  const openEmailModal = () => {
    setEmailDraft(user?.email || '');
    setEmailCodeDraft('');
    setIsEmailCodeSent(false);
    setIsEmailModalOpen(true);
  };

  const sendEmailVerifyCode = () => {
    const v = emailDraft.trim();
    if (!v) {
      showToast('error', '请输入邮箱');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(v)) {
      showToast('error', '邮箱格式不正确');
      return;
    }
    if (sendingEmail) return;
    setSendingEmail(true);
    sendEmailCodeApi(v)
      .then(() => {
        setIsEmailCodeSent(true);
        showToast('success', '验证码已发送');
      })
      .catch((e: any) => showToast('error', e?.message || '发送失败'))
      .finally(() => setSendingEmail(false));
  };

  const saveEmail = () => {
    const v = emailDraft.trim();
    if (!v) {
      showToast('error', '请输入邮箱');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(v)) {
      showToast('error', '邮箱格式不正确');
      return;
    }
    if (!isEmailCodeSent) {
      showToast('error', '请先发送验证码');
      return;
    }
    if (!emailCodeDraft.trim()) {
      showToast('error', '请输入验证码');
      return;
    }
    if (saving) return;
    setSaving(true);
    bindEmail({ email: v, code: emailCodeDraft.trim() })
      .then((p) => {
        applyProfileToLocalUser(p);
        setIsEmailModalOpen(false);
        showToast('success', '✅ 个人资料已更新');
      })
      .catch((e: any) => showToast('error', e?.message || '保存失败'))
      .finally(() => setSaving(false));
  };

  const openPhoneModal = () => {
    setPhoneDraft(user?.phoneNumber || '');
    setPhoneCodeDraft('');
    setIsPhoneCodeSent(false);
    setIsPhoneModalOpen(true);
  };

  const sendPhoneCode = () => {
    const v = phoneDraft.trim();
    if (!/^1[3-9]\d{9}$/.test(v)) {
      showToast('error', '手机号格式不正确');
      return;
    }
    if (sendingPhone) return;
    setSendingPhone(true);
    sendPhoneCodeApi(v)
      .then(() => {
        setIsPhoneCodeSent(true);
        showToast('success', '验证码已发送');
      })
      .catch((e: any) => showToast('error', e?.message || '发送失败'))
      .finally(() => setSendingPhone(false));
  };

  const savePhone = () => {
    const v = phoneDraft.trim();
    if (!/^1[3-9]\d{9}$/.test(v)) {
      showToast('error', '手机号格式不正确');
      return;
    }
    if (!isPhoneCodeSent) {
      showToast('error', '请先发送验证码');
      return;
    }
    if (!phoneCodeDraft.trim()) {
      showToast('error', '请输入验证码');
      return;
    }
    if (saving) return;
    setSaving(true);
    bindPhone({ phone: v, code: phoneCodeDraft.trim() })
      .then((p) => {
        applyProfileToLocalUser(p);
        setIsPhoneModalOpen(false);
        showToast('success', '✅ 个人资料已更新');
      })
      .catch((e: any) => showToast('error', e?.message || '保存失败'))
      .finally(() => setSaving(false));
  };

  const openPasswordModal = () => {
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setIsPasswordModalOpen(true);
  };

  const submitPasswordReset = () => {
    if (saving) return;
    if (!oldPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      showToast('error', '请完整填写密码信息');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('error', '两次输入的新密码不一致');
      return;
    }
    setSaving(true);
    changePassword({ oldPassword: oldPassword.trim(), newPassword: newPassword.trim() })
      .then(() => {
        setIsPasswordModalOpen(false);
        showToast('success', '✅ 密码修改成功，请重新登录');
        window.setTimeout(() => {
          logout();
          navigate('/login');
        }, 600);
      })
      .catch((e: any) => showToast('error', e?.message || '修改失败'))
      .finally(() => setSaving(false));
  };

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="relative animate-fade-in-up mt-8 w-full max-w-screen-2xl mx-auto mb-20 px-4 sm:px-6 lg:px-8">
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 rounded-2xl px-4 py-3 shadow-xl border text-sm font-semibold ${
            toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-[520px] w-[520px] rounded-full bg-sky-200/35 blur-3xl" />
        <div className="absolute -bottom-52 -left-48 h-[560px] w-[560px] rounded-full bg-indigo-200/25 blur-3xl" />
        <div className="absolute top-1/3 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-blue-200/20 blur-3xl" />
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-sky-200 bg-gradient-to-r from-sky-600 via-sky-500 to-indigo-600 text-white shadow-xl shadow-sky-500/15 mb-6">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/15 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-sky-200/25 blur-3xl" />
        <div className="relative p-6 sm:p-7">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBack}
                className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 text-white transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/15 text-white flex items-center justify-center border border-white/20">
                  <UserIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">个人中心</h2>
                  <p className="text-sm text-white/85 mt-1">账号概览与资料安全管理</p>
                </div>
              </div>
            </div>

            <div className="text-xs sm:text-sm font-semibold text-white/85">
              {syncing ? '同步中...' : `注册 ${getRegisterDays(user.createdAt)} 天`}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] xl:grid-cols-[420px_1fr] gap-6">
        <div className="rounded-3xl border border-sky-100 bg-white/90 backdrop-blur shadow-sm overflow-hidden">
          <div className="p-6">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl ${avatarColor} flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-sky-500/20`}>
                {avatarChar}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="text-lg font-bold text-gray-900 truncate max-w-[180px]">{displayName}</div>
                  {isVerified ? (
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <ShieldCheck className="w-3 h-3" /> 已认证
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                      <AlertTriangle className="w-3 h-3" /> 未认证
                    </span>
                  )}
                </div>
                <div className="mt-1 text-xs text-gray-500">欢迎回来，祝旅途顺利</div>
              </div>
            </div>

            {!isVerified && (
              <div className="mt-5 rounded-2xl border border-sky-100 bg-sky-50 p-4 text-xs text-sky-800">
                购票前请务必完成实名认证，避免影响出票与退改签审核
              </div>
            )}

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-sky-500" />
                    身份证号
                  </div>
                  {isVerified && <ShieldCheck className="w-4 h-4 text-emerald-500" />}
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-900 break-all">{user.idCard ? maskIdCard(user.idCard) : '未实名认证'}</div>
              </div>
              <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                  <Phone className="w-4 h-4 text-sky-500" />
                  手机号
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-900">{maskPhone(user.phoneNumber)}</div>
              </div>
              <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                  <Mail className="w-4 h-4 text-sky-500" />
                  邮箱
                </div>
                <div className={`mt-1 text-sm font-semibold ${user.email ? 'text-slate-900' : 'text-slate-400'}`}>{user.email || '未绑定'}</div>
              </div>
              <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                  <CalendarDays className="w-4 h-4 text-sky-500" />
                  注册天数
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-900">{getRegisterDays(user.createdAt)} 天</div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-sky-100 bg-white/90 backdrop-blur shadow-sm overflow-hidden">
          <div className="px-6 pt-6">
            <div className="grid grid-cols-2 bg-sky-50 p-1 rounded-2xl w-full sm:w-[360px] border border-sky-100">
              <button
                type="button"
                onClick={() => handleTabChange('profile')}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                  activeTab === 'profile' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                基本资料
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('security')}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                  activeTab === 'security' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                账号安全
              </button>
            </div>
          </div>

          {activeTab === 'profile' && (
            <div className="p-6 sm:p-8 space-y-6">
              <div className="rounded-3xl border border-sky-100 bg-white overflow-hidden">
                <div className="px-6 py-4 bg-sky-50/70 border-b border-sky-100 flex items-center justify-between">
                  <div className="font-bold text-gray-900">实名认证</div>
                  {isVerified ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <ShieldCheck className="w-3 h-3" /> 已认证
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                      <AlertTriangle className="w-3 h-3" /> 未认证
                    </span>
                  )}
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs font-bold text-gray-500 mb-1">姓名</div>
                      <div
                        onClick={() => {
                          if (isVerified) alert('实名信息无法直接修改，请联系客服人工审核。');
                        }}
                        className="relative"
                      >
                        <input
                          value={realNameDraft}
                          onChange={(e) => setRealNameDraft(e.target.value)}
                          readOnly={isVerified}
                          className={`w-full px-4 py-3 rounded-2xl border text-sm outline-none ${
                            isVerified
                              ? 'bg-gray-50 border-gray-200 text-gray-700 cursor-not-allowed'
                              : 'bg-white border-gray-200 focus:ring-2 focus:ring-sky-500'
                          }`}
                          placeholder="请输入真实姓名"
                        />
                        {isVerified && <Lock className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2" />}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-gray-500 mb-1">身份证号</div>
                      <div
                        onClick={() => {
                          if (isVerified) alert('实名信息无法直接修改，请联系客服人工审核。');
                        }}
                        className="relative"
                      >
                        <input
                          value={isVerified ? maskIdCard(idCardDraft) : idCardDraft}
                          onChange={(e) => setIdCardDraft(e.target.value)}
                          readOnly={isVerified}
                          className={`w-full px-4 py-3 rounded-2xl border text-sm outline-none ${
                            isVerified
                              ? 'bg-gray-50 border-gray-200 text-gray-700 cursor-not-allowed'
                              : 'bg-white border-gray-200 focus:ring-2 focus:ring-sky-500'
                          } ${idCardError ? 'border-red-300 focus:ring-red-200' : ''}`}
                          placeholder="请输入 18 位身份证号"
                        />
                        {isVerified && <Lock className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2" />}
                      </div>
                      {idCardError && <div className="mt-2 text-xs text-red-600">{idCardError}</div>}
                    </div>
                  </div>

                  {!isVerified && (
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <div className="text-xs text-gray-500">提交后将用于购票与退改签实名核验</div>
                      <button
                        type="button"
                        onClick={handleSubmitRealName}
                        disabled={saving}
                        className={`px-5 py-2.5 rounded-2xl bg-sky-600 text-white text-sm font-bold transition-colors shadow-lg shadow-sky-500/20 ${
                          saving ? 'opacity-60 cursor-not-allowed' : 'hover:bg-sky-700'
                        }`}
                      >
                        {saving ? '提交中...' : '提交认证'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-sky-100 bg-white overflow-hidden">
                <div className="px-6 py-4 bg-sky-50/70 border-b border-sky-100 font-bold text-gray-900">基本资料</div>
                <div className="p-6 space-y-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-gray-500">邮箱</div>
                      <div className={`mt-1 text-sm font-semibold ${user.email ? 'text-gray-900' : 'text-gray-400'}`}>{user.email || '未绑定'}</div>
                    </div>
                    <button
                      type="button"
                      onClick={openEmailModal}
                      className={`px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${
                        user.email
                          ? 'border-gray-200 text-gray-700 hover:bg-gray-50'
                          : 'border-sky-200 text-sky-700 bg-sky-50 hover:bg-sky-100'
                      }`}
                    >
                      {user.email ? '修改邮箱' : '立即绑定'}
                    </button>
                  </div>

                  <div>
                    <div className="text-xs font-bold text-gray-500 mb-2">性别</div>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setGenderDraft(1)}
                        className={`rounded-2xl border px-4 py-3 text-left transition-all ${
                          genderDraft === 1
                            ? 'border-blue-200 bg-blue-50 text-blue-700'
                            : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <div className="text-sm font-bold">🚹 男</div>
                        <div className="text-xs opacity-70 mt-1">选择后将用于乘机人信息</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setGenderDraft(2)}
                        className={`rounded-2xl border px-4 py-3 text-left transition-all ${
                          genderDraft === 2
                            ? 'border-pink-200 bg-pink-50 text-pink-700'
                            : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <div className="text-sm font-bold">🚺 女</div>
                        <div className="text-xs opacity-70 mt-1">选择后将用于乘机人信息</div>
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className={`px-6 py-2.5 rounded-2xl bg-sky-600 text-white text-sm font-bold transition-colors shadow-lg shadow-sky-500/20 ${
                        saving ? 'opacity-60 cursor-not-allowed' : 'hover:bg-sky-700'
                      }`}
                    >
                      {saving ? '保存中...' : '保存基本资料'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="p-6 sm:p-8 space-y-6">
              <div className="rounded-3xl border border-sky-100 bg-white overflow-hidden">
                <div className="px-6 py-4 bg-sky-50/70 border-b border-sky-100 font-bold text-gray-900">隐私与绑定</div>
                <div className="p-6 space-y-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-gray-500 flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" /> 手机号
                      </div>
                      <div className={`mt-1 text-sm font-semibold ${user.phoneNumber ? 'text-gray-900' : 'text-gray-400'}`}>{maskPhone(user.phoneNumber)}</div>
                    </div>
                    <button
                      type="button"
                      onClick={openPhoneModal}
                      className="px-4 py-2 rounded-xl text-sm font-bold border border-sky-200 text-sky-700 bg-sky-50 hover:bg-sky-100 transition-colors"
                    >
                      修改手机号
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-gray-500 flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" /> 邮箱
                      </div>
                      <div className={`mt-1 text-sm font-semibold ${user.email ? 'text-gray-900' : 'text-gray-400'}`}>{user.email || '未绑定'}</div>
                    </div>
                    <button
                      type="button"
                      onClick={openEmailModal}
                      className="px-4 py-2 rounded-xl text-sm font-bold border border-sky-200 text-sky-700 bg-sky-50 hover:bg-sky-100 transition-colors"
                    >
                      {user.email ? '修改邮箱' : '立即绑定'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-sky-100 bg-white overflow-hidden">
                <div className="px-6 py-4 bg-sky-50/70 border-b border-sky-100 font-bold text-gray-900">密码管理</div>
                <div className="p-6 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-gray-500 flex items-center gap-2">
                      <Lock className="w-4 h-4 text-gray-400" /> 登录密码
                    </div>
                    <div className="mt-1 text-sm font-semibold text-gray-900">******** (已设置)</div>
                  </div>
                  <button
                    type="button"
                    onClick={openPasswordModal}
                    className="px-4 py-2 rounded-xl text-sm font-bold bg-sky-600 text-white hover:bg-sky-700 transition-colors shadow-lg shadow-sky-500/20"
                  >
                    重置密码
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {isEmailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 sm:p-8">
            <div className="text-lg font-bold text-gray-900">{user.email ? '修改邮箱' : '绑定邮箱'}</div>
            <div className="mt-1 text-sm text-gray-500">验证码为模拟发送（固定为 123456）</div>

            <div className="mt-5 space-y-4">
              <div className="text-xs font-bold text-gray-500 mb-1">邮箱</div>
              <input
                value={emailDraft}
                onChange={(e) => setEmailDraft(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-sky-500 outline-none text-sm"
                placeholder="例如：name@example.com"
              />
              <div className="grid grid-cols-[1fr_auto] gap-3">
                <input
                  value={emailCodeDraft}
                  onChange={(e) => setEmailCodeDraft(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-sky-500 outline-none text-sm"
                  placeholder="请输入验证码"
                />
                <button
                  type="button"
                  onClick={sendEmailVerifyCode}
                  disabled={sendingEmail}
                  className={`px-4 py-3 rounded-2xl border text-gray-700 text-sm font-bold transition-colors ${
                    sendingEmail ? 'border-gray-200 opacity-60 cursor-not-allowed' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {sendingEmail ? '发送中' : '发送'}
                </button>
              </div>
              {isEmailCodeSent && (
                <div className="text-xs text-gray-500 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500" /> 已发送验证码
                </div>
              )}
            </div>

            <div className="mt-7 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsEmailModalOpen(false)}
                className="flex-1 px-4 py-2.5 rounded-2xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                type="button"
                onClick={saveEmail}
                disabled={saving}
                className={`flex-1 px-4 py-2.5 rounded-2xl bg-sky-600 text-white font-bold transition-colors ${
                  saving ? 'opacity-60 cursor-not-allowed' : 'hover:bg-sky-700'
                }`}
              >
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isPhoneModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 sm:p-8">
            <div className="text-lg font-bold text-gray-900">修改手机号</div>
            <div className="mt-1 text-sm text-gray-500">验证码为模拟发送（固定为 123456）</div>

            <div className="mt-5 space-y-4">
              <div>
                <div className="text-xs font-bold text-gray-500 mb-1">新手机号</div>
                <input
                  value={phoneDraft}
                  onChange={(e) => setPhoneDraft(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-sky-500 outline-none text-sm"
                  placeholder="例如：13800001234"
                />
              </div>

              <div className="grid grid-cols-[1fr_auto] gap-3">
                <input
                  value={phoneCodeDraft}
                  onChange={(e) => setPhoneCodeDraft(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-sky-500 outline-none text-sm"
                  placeholder="请输入验证码"
                />
                <button
                  type="button"
                  onClick={sendPhoneCode}
                  disabled={sendingPhone}
                  className={`px-4 py-3 rounded-2xl border text-gray-700 text-sm font-bold transition-colors ${
                    sendingPhone ? 'border-gray-200 opacity-60 cursor-not-allowed' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {sendingPhone ? '发送中' : '发送'}
                </button>
              </div>

              {isPhoneCodeSent && (
                <div className="text-xs text-gray-500 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500" /> 已发送验证码
                </div>
              )}
            </div>

            <div className="mt-7 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsPhoneModalOpen(false)}
                className="flex-1 px-4 py-2.5 rounded-2xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                type="button"
                onClick={savePhone}
                disabled={saving}
                className={`flex-1 px-4 py-2.5 rounded-2xl bg-sky-600 text-white font-bold transition-colors ${
                  saving ? 'opacity-60 cursor-not-allowed' : 'hover:bg-sky-700'
                }`}
              >
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 sm:p-8">
            <div className="text-lg font-bold text-gray-900">重置密码</div>
            <div className="mt-1 text-sm text-gray-500">修改成功后将强制退出登录</div>

            <div className="mt-5 space-y-4">
              <div>
                <div className="text-xs font-bold text-gray-500 mb-1">旧密码</div>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-sky-500 outline-none text-sm"
                  placeholder="请输入旧密码"
                />
              </div>
              <div>
                <div className="text-xs font-bold text-gray-500 mb-1">新密码</div>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-sky-500 outline-none text-sm"
                  placeholder="请输入新密码"
                />
              </div>
              <div>
                <div className="text-xs font-bold text-gray-500 mb-1">确认新密码</div>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-sky-500 outline-none text-sm"
                  placeholder="请再次输入新密码"
                />
              </div>
            </div>

            <div className="mt-7 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                className="flex-1 px-4 py-2.5 rounded-2xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                type="button"
                onClick={submitPasswordReset}
                disabled={saving}
                className={`flex-1 px-4 py-2.5 rounded-2xl bg-sky-600 text-white font-bold transition-colors ${
                  saving ? 'opacity-60 cursor-not-allowed' : 'hover:bg-sky-700'
                }`}
              >
                {saving ? '提交中...' : '确认修改'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserCenterPage;
