import React from 'react';
import { INITIAL_USERS } from '../../services/mockData';

const UsersMgmt: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <h2 className="text-2xl font-bold text-gray-800">用户管理</h2>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm text-left">
           <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase text-xs">
             <tr>
               <th className="px-6 py-4">用户</th>
               <th className="px-6 py-4">角色</th>
               <th className="px-6 py-4">状态</th>
               <th className="px-6 py-4">最后登录</th>
             </tr>
           </thead>
           <tbody>
             {INITIAL_USERS.map(u => (
               <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                 <td className="px-6 py-4 flex items-center gap-3">
                    <img src={u.avatar} alt={u.username} className="w-8 h-8 rounded-full" />
                    <div>
                        <div className="font-bold">{u.username}</div>
                        <div className="text-xs text-gray-400">{u.email}</div>
                    </div>
                 </td>
                 <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                        {u.role}
                    </span>
                 </td>
                 <td className="px-6 py-4">
                    <span className={`flex items-center gap-1.5 text-xs font-medium ${u.status === 'active' ? 'text-green-600' : 'text-gray-400'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'active' ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                        {u.status === 'active' ? '正常' : '禁用'}
                    </span>
                 </td>
                 <td className="px-6 py-4 text-xs text-gray-500">{u.lastLogin}</td>
               </tr>
             ))}
           </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsersMgmt;
