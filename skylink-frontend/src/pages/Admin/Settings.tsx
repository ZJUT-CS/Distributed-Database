import React, { useState } from 'react';
import { Save, Globe, Bell, Shield, Server, CreditCard } from 'lucide-react';
import { INITIAL_GATEWAYS } from '../../utils/mockData';

const Settings: React.FC = () => {
  const [gateways, setGateways] = useState(INITIAL_GATEWAYS);

  return (
    <div className="w-full space-y-6 animate-fade-in-up pb-10">
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 p-6 md:p-7 text-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">系统配置</h2>
              <p className="mt-1 text-sm text-indigo-100">集中管理基础信息、安全策略、通知与支付网关</p>
            </div>
            <button className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white transition-all text-sm font-bold shadow-lg shadow-indigo-500/30">
              <Save className="w-4 h-4" /> 保存更改
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
                      defaultValue="SkyLink"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">联系邮箱</label>
                    <input
                      type="email"
                      defaultValue="support@skylink.com"
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
                        defaultValue="8"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all bg-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">会话超时 (分钟)</label>
                      <input
                        type="number"
                        defaultValue="30"
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
                      <input type="checkbox" className="sr-only peer" />
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
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>

                  <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-gray-800">新订单提醒</div>
                      <div className="text-xs text-gray-500 mt-0.5">有新订单时发送通知</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
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
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                    </label>
                  </div>

                  <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-gray-800">允许新用户注册</div>
                      <div className="text-xs text-gray-500 mt-0.5">关闭后仅管理员可后台添加用户</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
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
              {gateways.map((g) => (
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
                          g.status
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            : 'bg-gray-100 text-gray-600 border-gray-200'
                        }`}
                      >
                        {g.status ? '运行中' : '已停用'}
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={g.status}
                          onChange={() =>
                            setGateways((prev) =>
                              prev.map((x) => (x.id === g.id ? { ...x, status: !x.status } : x))
                            )
                          }
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
