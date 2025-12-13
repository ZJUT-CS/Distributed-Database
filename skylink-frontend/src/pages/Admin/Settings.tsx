import React from 'react';
import { Save } from 'lucide-react';

const Settings: React.FC = () => {
  return (
    <div className="max-w-4xl space-y-6 animate-fade-in-up">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">系统设置</h2>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all">
            <Save className="w-4 h-4" /> 保存更改
        </button>
      </div>

      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 space-y-6">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600">网站名称</label>
                <input type="text" defaultValue="SkyLink AI" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600">联系邮箱</label>
                <input type="email" defaultValue="support@skylink.com" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
         </div>
         
         <div className="pt-6 border-t border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4">功能开关</h3>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="font-bold text-sm">系统维护模式</div>
                        <div className="text-xs text-gray-500">开启后前台将不可访问</div>
                    </div>
                    <div className="w-12 h-6 bg-gray-200 rounded-full relative cursor-pointer">
                        <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 shadow-sm"></div>
                    </div>
                </div>
                <div className="flex items-center justify-between">
                    <div>
                        <div className="font-bold text-sm">允许新用户注册</div>
                        <div className="text-xs text-gray-500">关闭后仅管理员可添加用户</div>
                    </div>
                    <div className="w-12 h-6 bg-green-500 rounded-full relative cursor-pointer">
                        <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5 shadow-sm"></div>
                    </div>
                </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Settings;
