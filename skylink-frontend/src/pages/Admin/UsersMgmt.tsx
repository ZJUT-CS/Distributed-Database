import React, { useState } from 'react';
import { Search, Plus, Edit, Trash2, Shield, Mail, Filter, Ban, Lock } from 'lucide-react';
import { INITIAL_USERS } from '../../services/mockData';
import Pagination from './components/Pagination';
import TableActionMenu from './components/TableActionMenu';

const UsersMgmt: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const ITEMS_PER_PAGE = 8;

  const filteredUsers = INITIAL_USERS.filter(u => 
    (roleFilter === 'all' || u.role === roleFilter) &&
    (u.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-2xl font-bold text-gray-800">用户管理</h2>
           <p className="text-gray-500 mt-1 text-sm">管理系统用户、角色与权限</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all">
            <Plus className="w-4 h-4" /> 添加用户
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 md:max-w-md w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
                type="text" 
                placeholder="搜索用户姓名、邮箱..." 
                className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
           <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 text-sm whitespace-nowrap">
             <Filter className="w-4 h-4" />
             <span className="hidden sm:inline">筛选</span>
           </button>
           <div className="h-6 w-px bg-gray-200 hidden md:block"></div>
           <div className="flex bg-gray-100 p-1 rounded-lg">
              {['all', 'admin', 'user'].map(role => (
                <button 
                 key={role}
                 onClick={() => { setRoleFilter(role); setPage(1); }}
                 className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all whitespace-nowrap ${roleFilter === role ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {role === 'all' ? '全部角色' : role}
                </button>
              ))}
           </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm text-left">
           <thead className="bg-gray-50/50 text-gray-500 font-medium border-b border-gray-100">
             <tr>
               <th className="px-6 py-4">用户</th>
               <th className="px-6 py-4">角色</th>
               <th className="px-6 py-4">状态</th>
               <th className="px-6 py-4">最后登录</th>
               <th className="px-6 py-4 text-right">操作</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-gray-50">
            {paginatedUsers.map(u => (
              <tr key={u.id} className="hover:bg-gray-50/80 transition-colors group">
                <td className="px-6 py-4">
                   <div className="flex items-center gap-3">
                        <img src={u.avatar} alt={u.username} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" />
                        <div>
                            <div className="font-bold text-gray-900">{u.username}</div>
                            <div className="text-xs text-gray-400 flex items-center gap-1">
                                <Mail className="w-3 h-3" /> {u.email}
                            </div>
                        </div>
                    </div>
                 </td>
                 <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        u.role === 'admin' 
                            ? 'bg-purple-50 text-purple-700 border-purple-100' 
                            : 'bg-gray-50 text-gray-700 border-gray-100'
                    }`}>
                        {u.role === 'admin' && <Shield className="w-3 h-3" />}
                        {u.role.toUpperCase()}
                    </span>
                 </td>
                 <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        u.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                        {u.status === 'active' ? '正常' : '禁用'}
                    </span>
                 </td>
                 <td className="px-6 py-4 text-xs text-gray-500">{u.lastLogin}</td>
                 <td className="px-6 py-4 text-right">
                    <TableActionMenu
                      isOpen={activeActionId === u.id}
                      onToggle={(e) => { e.stopPropagation(); setActiveActionId(activeActionId === u.id ? null : u.id); }}
                      onClose={() => setActiveActionId(null)}
                    >
                        <button className="w-full text-left px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                            <Edit className="w-3.5 h-3.5 text-blue-500" /> 编辑信息
                        </button>
                        <button className="w-full text-left px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                            <Lock className="w-3.5 h-3.5 text-orange-500" /> 重置密码
                        </button>
                        <button className="w-full text-left px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                            <Ban className="w-3.5 h-3.5 text-gray-500" /> 禁用账号
                        </button>
                        <div className="h-px bg-gray-100 my-0"></div>
                        <button className="w-full text-left px-4 py-2.5 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2">
                            <Trash2 className="w-3.5 h-3.5" /> 删除用户
                        </button>
                    </TableActionMenu>
                 </td>
               </tr>
             ))}
           </tbody>
        </table>
        
        {/* Pagination */}
        <Pagination 
          currentPage={page}
          totalPages={totalPages}
          setPage={setPage}
          totalItems={filteredUsers.length}
          itemsPerPage={ITEMS_PER_PAGE}
        />
      </div>
    </div>
  );
};

export default UsersMgmt;
