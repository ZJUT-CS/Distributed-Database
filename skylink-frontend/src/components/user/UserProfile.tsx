import React from 'react';
import { User } from '../../types';
import { ArrowLeft, Edit2 } from 'lucide-react';

interface UserProfileProps {
  user: User;
  onBack: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, onBack }) => {
  return (
    <div className="animate-fade-in-up mt-10 max-w-3xl mx-auto mb-20">
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
            <p className="text-gray-500 text-sm">查看并管理您的账户资料</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 flex items-start gap-6">
          <img src={user.avatarUrl} alt={user.username} className="w-20 h-20 rounded-2xl border border-gray-200 object-cover" />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-800">{user.username}</h3>
                <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${
                  user.role === 'admin' 
                  ? 'bg-purple-50 text-purple-600 border-purple-100' 
                  : 'bg-blue-50 text-blue-600 border-blue-100'
                }`}>
                  {user.role === 'admin' ? 'Administrator' : 'Verified User'}
                </span>
              </div>
              <button className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold hover:bg-gray-50 text-gray-700 transition-colors flex items-center gap-2">
                <Edit2 className="w-4 h-4" /> 编辑资料
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="space-y-1">
                <div className="text-xs font-bold text-gray-500 uppercase">昵称</div>
                <div className="text-gray-800">{user.username}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs font-bold text-gray-500 uppercase">角色</div>
                <div className="text-gray-800">{user.role}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;

