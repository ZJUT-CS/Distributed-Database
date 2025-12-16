import React, { useState } from 'react';
import { Save, Globe, Bell, Shield, Server, CreditCard } from 'lucide-react';
import { INITIAL_GATEWAYS } from '../../services/mockData';

const Settings: React.FC = () => {
  const [gateways, setGateways] = useState(INITIAL_GATEWAYS);

  return (
    <div className="max-w-5xl space-y-6 animate-fade-in-up pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-2xl font-bold text-gray-800">系统设置</h2>
           <p className="text-gray-500 mt-1 text-sm">管理系统的全局配置与参数</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all text-sm font-medium">
            <Save className="w-4 h-4" /> 保存更改
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* General Settings */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
           <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
              <div className="p-2 bg-blue-50 rounded-lg">
                 <Globe className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                 <h3 className="font-bold text-gray-800">基本设置</h3>
                 <p className="text-xs text-gray-500">网站基础信息配置</p>
              </div>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-600">网站名称</label>
                  <input type="text" defaultValue="SkyLink AI" className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
              </div>
              <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-600">联系邮箱</label>
                  <input type="email" defaultValue="support@skylink.com" className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
              </div>
              <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-600">默认语言</label>
                  <select className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all">
                      <option>简体中文</option>
                      <option>English</option>
                  </select>
              </div>
              <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-600">时区</label>
                  <select className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all">
                      <option>(GMT+08:00) Beijing, Chongqing, Hong Kong</option>
                  </select>
              </div>
           </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
           <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
              <div className="p-2 bg-purple-50 rounded-lg">
                 <Bell className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                 <h3 className="font-bold text-gray-800">通知设置</h3>
                 <p className="text-xs text-gray-500">系统消息推送配置</p>
              </div>
           </div>
           
           <div className="space-y-4">
                <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <div>
                        <div className="font-bold text-sm text-gray-700">系统更新通知</div>
                        <div className="text-xs text-gray-500">接收关于系统版本更新的邮件提醒</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>
                <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <div>
                        <div className="font-bold text-sm text-gray-700">新订单提醒</div>
                        <div className="text-xs text-gray-500">有新订单时发送通知</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>
           </div>
        </div>

        {/* Security */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
           <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
              <div className="p-2 bg-green-50 rounded-lg">
                 <Shield className="w-5 h-5 text-green-600" />
              </div>
              <div>
                 <h3 className="font-bold text-gray-800">安全设置</h3>
                 <p className="text-xs text-gray-500">系统访问与安全策略</p>
              </div>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-600">密码最小长度</label>
                  <input type="number" defaultValue="8" className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none transition-all" />
              </div>
              <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-600">会话超时 (分钟)</label>
                  <input type="number" defaultValue="30" className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none transition-all" />
              </div>
           </div>
        
           <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <div>
                        <div className="font-bold text-sm text-gray-700">强制双重认证 (2FA)</div>
                        <div className="text-xs text-gray-500">管理员登录必须进行二次验证</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                </div>
           </div>
        </div>

        {/* System */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
           <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
              <div className="p-2 bg-orange-50 rounded-lg">
                 <Server className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                 <h3 className="font-bold text-gray-800">系统功能</h3>
                 <p className="text-xs text-gray-500">高级功能开关与维护</p>
              </div>
           </div>
           
           <div className="space-y-4">
                <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <div>
                        <div className="font-bold text-sm text-gray-700">系统维护模式</div>
                        <div className="text-xs text-gray-500">开启后前台将不可访问，仅显示维护页面</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                    </label>
                </div>
                <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <div>
                        <div className="font-bold text-sm text-gray-700">允许新用户注册</div>
                        <div className="text-xs text-gray-500">关闭后仅管理员可后台添加用户</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                    </label>
                </div>
           </div>
        </div>

        {/* Payment Gateways */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
           <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
              <div className="p-2 bg-blue-50 rounded-lg">
                 <CreditCard className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                 <h3 className="font-bold text-gray-800">支付网关</h3>
                 <p className="text-xs text-gray-500">统一管理可用的支付方式</p>
              </div>
           </div>
           
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
             {gateways.map(g => (
               <div key={g.id} className="bg-white p-4 rounded-xl border border-gray-100 hover:border-blue-100 hover:shadow-sm transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg ${g.color}`}>
                        {g.name.trim()[0]}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-800">{g.name}</div>
                        <div className="text-[11px] text-gray-400">前台展示与支付通道开关</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded-lg text-xs font-bold ${
                          g.status ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-gray-100 text-gray-500 border border-gray-200'
                        }`}
                      >
                        {g.status ? '运行中' : '已停用'}
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer">
                         <input
                           type="checkbox"
                           className="sr-only peer"
                           checked={g.status}
                           onChange={() => setGateways(prev => prev.map(x => (x.id === g.id ? { ...x, status: !x.status } : x)))}
                         />
                         <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-50 grid grid-cols-2 gap-4 text-xs">
                      <div>
                          <span className="text-gray-400 block mb-1">费率</span>
                          <span className="font-semibold text-gray-700 text-sm">{g.fee}</span>
                      </div>
                      <div>
                          <span className="text-gray-400 block mb-1">结算周期</span>
                          <span className="font-semibold text-gray-700 text-sm">{g.cycle}</span>
                      </div>
                  </div>
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
