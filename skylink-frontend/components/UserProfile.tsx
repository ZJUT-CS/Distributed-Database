
import React, { useState } from 'react';
import { User } from '../types';
import { User as UserIcon, Mail, Phone, MapPin, CreditCard, Save, Camera, FileText, ArrowLeft, Calendar, ShieldCheck, Award } from 'lucide-react';

interface UserProfileProps {
  user: User;
  onBack: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: user.username,
    realName: '张三',
    email: 'zhangsan@example.com',
    phone: '13800138000',
    address: '北京市朝阳区科技园路 88 号',
    passportNumber: 'E12345678',
    passportExpiry: '2028-05-20',
    nationality: 'CN'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      alert('个人信息已更新');
    }, 1000);
  };

  return (
    <div className="animate-fade-in-up mt-8 max-w-6xl mx-auto mb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 hover:shadow-sm text-gray-600 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">个人信息</h2>
            <p className="text-gray-500 text-sm">管理您的基本资料及出行证件</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Profile Card */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-3xl shadow-lg shadow-gray-200/50 border border-gray-100 overflow-hidden sticky top-24">
            {/* Banner Background */}
            <div className="h-32 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 relative">
               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            </div>
            
            <div className="px-8 pb-8 text-center -mt-14 relative">
              <div className="relative inline-block mb-4">
                <div className="w-28 h-28 rounded-full overflow-hidden border-[4px] border-white shadow-md bg-white">
                  <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
                </div>
                <button className="absolute bottom-1 right-1 p-2 bg-gray-900 text-white rounded-full hover:bg-black shadow-lg transition-transform hover:scale-110 border-2 border-white">
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900">{formData.username}</h3>
              <p className="text-gray-500 text-sm flex items-center justify-center gap-1 mt-1">
                {user.role === 'admin' ? <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> : <Award className="w-3.5 h-3.5 text-yellow-500" />}
                {user.role === 'admin' ? '系统管理员' : '金牌会员'}
              </p>

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-2 mt-8 py-4 border-t border-b border-gray-100">
                 <div className="text-center">
                    <div className="text-xs text-gray-400 mb-1 uppercase tracking-wide font-bold">总里程</div>
                    <div className="text-lg font-bold text-gray-800">12,450</div>
                 </div>
                 <div className="text-center border-l border-r border-gray-100">
                    <div className="text-xs text-gray-400 mb-1 uppercase tracking-wide font-bold">航段</div>
                    <div className="text-lg font-bold text-gray-800">12</div>
                 </div>
                 <div className="text-center">
                    <div className="text-xs text-gray-400 mb-1 uppercase tracking-wide font-bold">积分</div>
                    <div className="text-lg font-bold text-blue-600">3,200</div>
                 </div>
              </div>

              <div className="mt-6 space-y-3">
                 <div className="flex items-center justify-between text-sm p-3 bg-gray-50 rounded-xl">
                    <span className="text-gray-500">会员等级</span>
                    <span className="font-bold text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded text-xs">Lv.3 探索者</span>
                 </div>
                 <div className="flex items-center justify-between text-sm p-3 bg-gray-50 rounded-xl">
                    <span className="text-gray-500">注册时间</span>
                    <span className="font-medium text-gray-700 font-mono">2023-08-15</span>
                 </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Edit Forms */}
        <div className="lg:col-span-8 space-y-6">
          <form onSubmit={handleSave}>
            {/* Basic Info Section */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-6">
              <div className="px-8 py-6 border-b border-gray-100 flex items-center gap-3">
                <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                  <UserIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">基本资料</h3>
                  <p className="text-gray-400 text-xs">用于身份验证及联系方式</p>
                </div>
              </div>
              
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide ml-1">用户名</label>
                  <input 
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white transition-all font-medium text-gray-800" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide ml-1">真实姓名</label>
                  <input 
                    name="realName"
                    value={formData.realName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white transition-all font-medium text-gray-800" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide ml-1 flex items-center gap-1"><Phone className="w-3 h-3" /> 手机号码</label>
                  <input 
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white transition-all font-medium text-gray-800" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide ml-1 flex items-center gap-1"><Mail className="w-3 h-3" /> 电子邮箱</label>
                  <input 
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white transition-all font-medium text-gray-800" 
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide ml-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> 联系地址</label>
                  <input 
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white transition-all font-medium text-gray-800" 
                  />
                </div>
              </div>
            </div>

            {/* Travel Docs Section */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-6">
              <div className="px-8 py-6 border-b border-gray-100 flex items-center gap-3">
                <div className="bg-purple-50 p-2 rounded-lg text-purple-600">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">常用证件</h3>
                  <p className="text-gray-400 text-xs">加快预订流程，自动填充信息</p>
                </div>
              </div>
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide ml-1">护照号码</label>
                  <div className="relative">
                    <input 
                      name="passportNumber"
                      value={formData.passportNumber}
                      onChange={handleChange}
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white transition-all font-mono font-medium text-gray-800" 
                    />
                    <CreditCard className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide ml-1">国籍/地区</label>
                  <select 
                    name="nationality"
                    value={formData.nationality}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white transition-all font-medium text-gray-800 appearance-none"
                  >
                    <option value="CN">中国 (China)</option>
                    <option value="US">美国 (USA)</option>
                    <option value="JP">日本 (Japan)</option>
                    <option value="GB">英国 (UK)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide ml-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> 有效期至</label>
                  <input 
                    name="passportExpiry"
                    type="date"
                    value={formData.passportExpiry}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white transition-all font-medium text-gray-800" 
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4">
              <button 
                type="submit" 
                disabled={loading}
                className="flex items-center gap-2 bg-gray-900 hover:bg-black text-white px-8 py-3.5 rounded-xl font-bold shadow-xl shadow-gray-500/20 transition-all transform hover:-translate-y-1 active:scale-95 disabled:opacity-70 disabled:transform-none"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <>
                    <Save className="w-5 h-5" /> 保存更改
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
