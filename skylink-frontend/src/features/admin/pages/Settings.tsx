import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Save, Globe, Bell, Shield, Server, CreditCard } from 'lucide-react';
import { createAdminConfig, listAdminConfigs, updateAdminConfig, type AdminConfigItem } from '@/features/admin/api/configs';
import { useConfirm, useToast } from '@/features/admin';

type GatewayMeta = {
  id: string;
  name: string;
  fee: string;
  cycle: string;
  color: string;
};

const SETTINGS_KEY = {
  siteName: 'ui.settings.siteName',
  supportEmail: 'ui.settings.supportEmail',
  passwordMinLen: 'ui.settings.security.passwordMinLen',
  sessionTimeoutMinutes: 'ui.settings.security.sessionTimeoutMinutes',
  enforce2fa: 'ui.settings.security.enforce2fa',
  notifySystemUpdates: 'ui.settings.notify.systemUpdates',
  notifyNewOrders: 'ui.settings.notify.newOrders',
  maintenanceMode: 'ui.settings.system.maintenanceMode',
  allowRegistration: 'ui.settings.system.allowRegistration',
} as const;

const GATEWAY_CATALOG: GatewayMeta[] = [
  { id: 'alipay', name: '支付宝', fee: '0.6%', cycle: 'T+1', color: 'bg-indigo-600' },
  { id: 'wechat', name: '微信支付', fee: '0.6%', cycle: 'T+1', color: 'bg-emerald-600' },
  { id: 'unionpay', name: '银联', fee: '0.55%', cycle: 'T+2', color: 'bg-orange-500' },
  { id: 'stripe', name: 'Stripe', fee: '2.9% + ¥2', cycle: 'T+7', color: 'bg-purple-600' },
];

const gatewayEnabledKey = (id: string) => `ui.settings.paymentGateways.${id}.enabled`;

const getConfigByName = (configs: AdminConfigItem[], name: string) => configs.find((c) => c.configName === name);

const getBool = (v: string | undefined, fallback: boolean) => {
  if (v == null) return fallback;
  const s = String(v).trim().toLowerCase();
  if (s === '1' || s === 'true' || s === 'yes' || s === 'on') return true;
  if (s === '0' || s === 'false' || s === 'no' || s === 'off') return false;
  return fallback;
};

const getNum = (v: string | undefined, fallback: number) => {
  if (v == null) return fallback;
  const n = Number(String(v).trim());
  return Number.isFinite(n) ? n : fallback;
};

const Settings: React.FC = () => {
  const { confirm } = useConfirm();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [configs, setConfigs] = useState<AdminConfigItem[]>([]);
  const configMap = useMemo(() => {
    const map = new Map<string, AdminConfigItem>();
    for (const c of configs) map.set(c.configName, c);
    return map;
  }, [configs]);

  const [siteName, setSiteName] = useState('SkyLink');
  const [supportEmail, setSupportEmail] = useState('support@skylink.com');
  const [passwordMinLen, setPasswordMinLen] = useState(8);
  const [sessionTimeoutMinutes, setSessionTimeoutMinutes] = useState(30);
  const [enforce2fa, setEnforce2fa] = useState(false);

  const [notifySystemUpdates, setNotifySystemUpdates] = useState(true);
  const [notifyNewOrders, setNotifyNewOrders] = useState(true);

  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [allowRegistration, setAllowRegistration] = useState(true);

  const [gatewayEnabled, setGatewayEnabled] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const g of GATEWAY_CATALOG) init[g.id] = true;
    return init;
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // 拉取系统配置（第一页足够覆盖本项目配置量）
      const res = await listAdminConfigs({ page: 1, size: 100 });
      const rows = res?.data ?? [];
      setConfigs(rows);

      const pick = (key: string) => getConfigByName(rows, key)?.configValue;
      setSiteName(pick(SETTINGS_KEY.siteName) ?? 'SkyLink');
      setSupportEmail(pick(SETTINGS_KEY.supportEmail) ?? 'support@skylink.com');
      setPasswordMinLen(getNum(pick(SETTINGS_KEY.passwordMinLen), 8));
      setSessionTimeoutMinutes(getNum(pick(SETTINGS_KEY.sessionTimeoutMinutes), 30));
      setEnforce2fa(getBool(pick(SETTINGS_KEY.enforce2fa), false));

      setNotifySystemUpdates(getBool(pick(SETTINGS_KEY.notifySystemUpdates), true));
      setNotifyNewOrders(getBool(pick(SETTINGS_KEY.notifyNewOrders), true));

      setMaintenanceMode(getBool(pick(SETTINGS_KEY.maintenanceMode), false));
      setAllowRegistration(getBool(pick(SETTINGS_KEY.allowRegistration), true));

      const gw: Record<string, boolean> = {};
      for (const g of GATEWAY_CATALOG) {
        gw[g.id] = getBool(getConfigByName(rows, gatewayEnabledKey(g.id))?.configValue, true);
      }
      setGatewayEnabled(gw);
    } catch (e: any) {
      toast.error(e?.message || '加载配置失败');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const upsertConfig = async (name: string, value: string) => {
    const existed = configMap.get(name);
    if (existed?.configId != null) {
      await updateAdminConfig(existed.configId, { configName: name, configValue: value });
      return;
    }
    await createAdminConfig({ configName: name, configValue: value });
  };

  const onSave = async () => {
    const ok = await confirm({
      title: '保存系统配置',
      message: '确定要保存当前更改吗？',
      confirmText: '保存',
      cancelText: '取消',
    });
    if (!ok) return;

    const name = siteName.trim();
    const email = supportEmail.trim();
    if (!name) {
      toast.warning('请填写网站名称');
      return;
    }
    if (!email) {
      toast.warning('请填写联系邮箱');
      return;
    }
    if (!Number.isFinite(passwordMinLen) || passwordMinLen < 6) {
      toast.warning('密码最小长度建议不小于 6');
      return;
    }
    if (!Number.isFinite(sessionTimeoutMinutes) || sessionTimeoutMinutes <= 0) {
      toast.warning('会话超时必须大于 0');
      return;
    }

    setSaving(true);
    try {
      await Promise.all([
        upsertConfig(SETTINGS_KEY.siteName, name),
        upsertConfig(SETTINGS_KEY.supportEmail, email),
        upsertConfig(SETTINGS_KEY.passwordMinLen, String(passwordMinLen)),
        upsertConfig(SETTINGS_KEY.sessionTimeoutMinutes, String(sessionTimeoutMinutes)),
        upsertConfig(SETTINGS_KEY.enforce2fa, enforce2fa ? 'true' : 'false'),
        upsertConfig(SETTINGS_KEY.notifySystemUpdates, notifySystemUpdates ? 'true' : 'false'),
        upsertConfig(SETTINGS_KEY.notifyNewOrders, notifyNewOrders ? 'true' : 'false'),
        upsertConfig(SETTINGS_KEY.maintenanceMode, maintenanceMode ? 'true' : 'false'),
        upsertConfig(SETTINGS_KEY.allowRegistration, allowRegistration ? 'true' : 'false'),
        ...GATEWAY_CATALOG.map((g) =>
          upsertConfig(gatewayEnabledKey(g.id), gatewayEnabled[g.id] ? 'true' : 'false'),
        ),
      ]);

      toast.success('保存成功');
      await load();
    } catch (e: any) {
      toast.error(e?.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full space-y-6 animate-fade-in-up pb-10">
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 p-6 md:p-7 text-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">系统配置</h2>
              <p className="mt-1 text-sm text-indigo-100">集中管理基础信息、安全策略、通知与支付网关</p>
            </div>
            <button
              onClick={onSave}
              disabled={loading || saving}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white transition-all text-sm font-bold shadow-lg shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              type="button"
            >
              <Save className="w-4 h-4" /> {saving ? '保存中...' : '保存更改'}
            </button>
          </div>
        </div>

        <div className="p-6 md:p-7 bg-slate-50">
          <div className="grid grid-cols-1 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
            <div className="lg:col-span-2 2xl:col-span-3 space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-white">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600/10 text-indigo-700 flex items-center justify-center border border-indigo-100">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">基础信息</h3>
                      <p className="text-xs text-gray-500">网站展示与默认运行参数</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">网站名称</label>
                    <input
                      type="text"
                      value={siteName}
                      onChange={(e) => setSiteName(e.target.value)}
                      disabled={loading}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">联系邮箱</label>
                    <input
                      type="email"
                      value={supportEmail}
                      onChange={(e) => setSupportEmail(e.target.value)}
                      disabled={loading}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">默认语言</label>
                    <select className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white">
                      <option>简体中文</option>
                      <option>English</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">时区</label>
                    <select className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white">
                      <option>(GMT+08:00) Beijing, Chongqing, Hong Kong</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-white">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600/10 text-emerald-700 flex items-center justify-center border border-emerald-100">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">安全策略</h3>
                      <p className="text-xs text-gray-500">密码规则、会话与双重认证</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">密码最小长度</label>
                      <input
                        type="number"
                        value={passwordMinLen}
                        onChange={(e) => setPasswordMinLen(Number(e.target.value))}
                        disabled={loading}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all bg-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">会话超时 (分钟)</label>
                      <input
                        type="number"
                        value={sessionTimeoutMinutes}
                        onChange={(e) => setSessionTimeoutMinutes(Number(e.target.value))}
                        disabled={loading}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all bg-white"
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-gray-800">强制双重认证 (2FA)</div>
                      <div className="text-xs text-gray-500 mt-0.5">管理员登录必须进行二次验证</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={enforce2fa}
                        onChange={() => setEnforce2fa((v) => !v)}
                        disabled={loading}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-white">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-600/10 text-purple-700 flex items-center justify-center border border-purple-100">
                      <Bell className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">通知</h3>
                      <p className="text-xs text-gray-500">系统消息推送策略</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-gray-800">系统更新通知</div>
                      <div className="text-xs text-gray-500 mt-0.5">接收关于系统版本更新的邮件提醒</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={notifySystemUpdates}
                        onChange={() => setNotifySystemUpdates((v) => !v)}
                        disabled={loading}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>

                  <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-gray-800">新订单提醒</div>
                      <div className="text-xs text-gray-500 mt-0.5">有新订单时发送通知</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={notifyNewOrders}
                        onChange={() => setNotifyNewOrders((v) => !v)}
                        disabled={loading}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-white">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-700 flex items-center justify-center border border-orange-100">
                      <Server className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">系统功能</h3>
                      <p className="text-xs text-gray-500">维护模式与注册策略</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-gray-800">系统维护模式</div>
                      <div className="text-xs text-gray-500 mt-0.5">开启后前台将不可访问，仅显示维护页面</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={maintenanceMode}
                        onChange={() => setMaintenanceMode((v) => !v)}
                        disabled={loading}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                    </label>
                  </div>

                  <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-gray-800">允许新用户注册</div>
                      <div className="text-xs text-gray-500 mt-0.5">关闭后仅管理员可后台添加用户</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={allowRegistration}
                        onChange={() => setAllowRegistration((v) => !v)}
                        disabled={loading}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/10 text-indigo-700 flex items-center justify-center border border-indigo-100">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">支付网关</h3>
                  <p className="text-xs text-gray-500">统一管理可用的支付方式与展示状态</p>
                </div>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {GATEWAY_CATALOG.map((g) => (
                <div
                  key={g.id}
                  className="bg-white rounded-2xl border border-gray-100 hover:border-indigo-100 hover:shadow-sm transition-all overflow-hidden"
                >
                  <div className="p-4 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg ${g.color}`}>
                        {g.name.trim()[0]}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900">{g.name}</div>
                        <div className="text-[11px] text-gray-500 mt-0.5">前台展示与支付通道开关</div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`px-2 py-1 rounded-lg text-xs font-bold border ${
                          gatewayEnabled[g.id]
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            : 'bg-gray-100 text-gray-600 border-gray-200'
                        }`}
                      >
                        {gatewayEnabled[g.id] ? '运行中' : '已停用'}
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={!!gatewayEnabled[g.id]}
                          onChange={() =>
                            setGatewayEnabled((prev) => ({
                              ...prev,
                              [g.id]: !prev[g.id],
                            }))
                          }
                          disabled={loading}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                  </div>

                  <div className="px-4 pb-4">
                    <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-3 grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-[11px] text-gray-500">费率</div>
                        <div className="text-sm font-semibold text-gray-800 mt-0.5">{g.fee}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-gray-500">结算周期</div>
                        <div className="text-sm font-semibold text-gray-800 mt-0.5">{g.cycle}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Settings;
