import React, { useState } from 'react';
import { Shield, Bell, Globe, Save, Smartphone, Mail, ArrowLeft, DollarSign, Key, LogOut } from 'lucide-react';
import { useToast } from '@/features/admin/components/Toast';

interface UserSettingsProps {
  onBack?: () => void;
  mode?: 'page' | 'embedded';
}

const UserSettings: React.FC<UserSettingsProps> = ({ onBack, mode = 'page' }) => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState({
    emailOrder: true,
    emailPromo: false,
    smsOrder: true,
    smsSecurity: true,
  });
  const [preferences, setPreferences] = useState({
    language: 'zh-CN',
    currency: 'CNY',
    timezone: 'Asia/Shanghai',
  });

  const handleToggle = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('系统设置已保存');
    }, 1000);
  };

  const Toggle = ({ active, onClick }: { active: boolean; onClick: () => void }) => (
    <button
      type="button"
      onClick={onClick}
      className={`w-14 h-8 rounded-full p-1 transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${active ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
        }`}
    >
      <div
        className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${active ? 'translate-x-6' : 'translate-x-0'
          }`}
      ></div>
    </button>
  );

  return (
    <div className={mode === 'page' ? 'animate-fade-in-up mt-8 w-full max-w-screen-2xl mx-auto mb-20 px-4 sm:px-6 lg:px-8' : 'animate-fade-in-up'}>
      {mode === 'page' && (
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-sm text-gray-600 dark:text-gray-300 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">账户设置</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm">管理您的安全、语言及偏好</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-8">
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="px-8 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
            <div className="bg-red-50 dark:bg-red-900/20 p-2.5 rounded-xl text-red-600 dark:text-red-400">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg">安全中心</h3>
          </div>
          <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex gap-4">
                <div className="bg-gray-50 dark:bg-gray-800 p-2.5 rounded-xl h-fit text-gray-500 dark:text-gray-400">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 dark:text-gray-200">登录密码</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-[200px] sm:max-w-none">建议定期修改密码以保护账户安全</p>
                </div>
              </div>
              <button className="px-5 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 transition-colors shadow-sm">
                修改
              </button>
            </div>

            <div className="h-px bg-gray-100 dark:bg-gray-800 w-full"></div>

            <div className="flex items-center justify-between">
              <div className="flex gap-4">
                <div className="bg-gray-50 dark:bg-gray-800 p-2.5 rounded-xl h-fit text-gray-500 dark:text-gray-400">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 dark:text-gray-200">两步验证 (2FA)</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-[200px] sm:max-w-none">在登录时需要额外的手机验证码</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">未开启</span>
                <Toggle active={false} onClick={() => toast.warning('请先绑定手机号')} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="px-8 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-2.5 rounded-xl text-blue-600 dark:text-blue-400">
              <Globe className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg">通用偏好</h3>
          </div>
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide ml-1">界面语言</label>
              <select
                value={preferences.language}
                onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-700 transition-all cursor-pointer font-medium text-gray-700 dark:text-gray-200"
              >
                <option value="zh-CN">简体中文 (Chinese)</option>
                <option value="en-US">English (US)</option>
                <option value="ja-JP">日本語 (Japanese)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide ml-1">货币单位</label>
              <select
                value={preferences.currency}
                onChange={(e) => setPreferences({ ...preferences, currency: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-700 transition-all cursor-pointer font-medium text-gray-700 dark:text-gray-200"
              >
                <option value="CNY">人民币 (CNY ¥)</option>
                <option value="USD">美元 (USD $)</option>
                <option value="EUR">欧元 (EUR €)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="px-8 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
            <div className="bg-purple-50 dark:bg-purple-900/20 p-2.5 rounded-xl text-purple-600 dark:text-purple-400">
              <Bell className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg">通知设置</h3>
          </div>
          <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex gap-4 items-center">
                <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-lg text-gray-500 dark:text-gray-400">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-gray-800 dark:text-gray-200 text-sm">订单邮件通知</div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">接收出票成功、航班变动提醒</div>
                </div>
              </div>
              <Toggle active={notifications.emailOrder} onClick={() => handleToggle('emailOrder')} />
            </div>

            <div className="h-px bg-gray-50 dark:bg-gray-800 w-full"></div>

            <div className="flex items-center justify-between">
              <div className="flex gap-4 items-center">
                <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-lg text-gray-500 dark:text-gray-400">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-gray-800 dark:text-gray-200 text-sm">促销与优惠</div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">接收最新的机票特价信息</div>
                </div>
              </div>
              <Toggle active={notifications.emailPromo} onClick={() => handleToggle('emailPromo')} />
            </div>

            <div className="h-px bg-gray-50 dark:bg-gray-800 w-full"></div>

            <div className="flex items-center justify-between">
              <div className="flex gap-4 items-center">
                <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-lg text-gray-500 dark:text-gray-400">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-gray-800 dark:text-gray-200 text-sm">短信行程提醒</div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">起飞前接收短信通知</div>
                </div>
              </div>
              <Toggle active={notifications.smsOrder} onClick={() => handleToggle('smsOrder')} />
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 pb-8">
          <button className="text-red-500 text-sm font-bold flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
            <LogOut className="w-4 h-4" /> 注销账户
          </button>

          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gray-900 dark:bg-white hover:bg-black dark:hover:bg-gray-100 text-white dark:text-gray-900 px-8 py-3.5 rounded-xl font-bold shadow-xl shadow-gray-500/20 dark:shadow-none transition-all transform hover:-translate-y-1 active:scale-95 disabled:opacity-70 disabled:transform-none"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <>
                <Save className="w-5 h-5" /> 保存所有设置
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserSettings;
