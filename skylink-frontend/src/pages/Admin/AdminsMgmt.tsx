import React, { useState } from 'react';
import { Search, Plus, Shield, UserCog, Mail, Phone, Filter, Lock, Trash2, RefreshCw } from 'lucide-react';
import Pagination from '../../features/admin/components/Pagination';
import TableActionMenu from '../../features/admin/components/TableActionMenu';

type AdminRole = 'super_admin' | 'ops' | 'auditor';
type AdminStatus = 'active' | 'disabled';

interface AdminItem {
  id: string;
  username: string;
  realName: string;
  email: string;
  phone: string;
  role: AdminRole;
  status: AdminStatus;
  createdAt: string;
  lastLogin: string;
}

const MOCK_ADMINS: AdminItem[] = [
  {
    id: 'ADM-0001',
    username: 'sys_admin',
    realName: '系统超级管理员',
    email: 'admin@skylink.com',
    phone: '138****0001',
    role: 'super_admin',
    status: 'active',
    createdAt: '2024-01-01 09:00',
    lastLogin: '2024-05-20 09:30',
  },
  {
    id: 'ADM-0002',
    username: 'ops_zhang',
    realName: '张运营',
    email: 'ops.zhang@skylink.com',
    phone: '138****0002',
    role: 'ops',
    status: 'active',
    createdAt: '2024-02-10 10:15',
    lastLogin: '2024-05-19 14:20',
  },
  {
    id: 'ADM-0003',
    username: 'auditor_li',
    realName: '李风控',
    email: 'auditor.li@skylink.com',
    phone: '138****0003',
    role: 'auditor',
    status: 'active',
    createdAt: '2024-03-05 16:40',
    lastLogin: '2024-05-18 18:05',
  },
  {
    id: 'ADM-0004',
    username: 'ops_wang',
    realName: '王运营',
    email: 'ops.wang@skylink.com',
    phone: '138****0004',
    role: 'ops',
    status: 'disabled',
    createdAt: '2024-03-18 11:30',
    lastLogin: '2024-04-28 11:00',
  },
];

const AdminsMgmt: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | AdminRole>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | AdminStatus>('all');
  const [page, setPage] = useState(1);
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const ITEMS_PER_PAGE = 8;

  const filteredAdmins = MOCK_ADMINS.filter((a) => {
    const matchRole = roleFilter === 'all' || a.role === roleFilter;
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    const keyword = searchTerm.toLowerCase();
    const matchKeyword =
      !keyword ||
      a.username.toLowerCase().includes(keyword) ||
      a.realName.toLowerCase().includes(keyword) ||
      a.email.toLowerCase().includes(keyword);
    return matchRole && matchStatus && matchKeyword;
  });

  const totalPages = Math.ceil(filteredAdmins.length / ITEMS_PER_PAGE) || 1;
  const paginatedAdmins = filteredAdmins.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">管理员管理</h2>
          <p className="text-gray-500 mt-1 text-sm">维护后台管理员账号与角色权限</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all">
          <Plus className="w-4 h-4" /> 新增管理员
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 md:max-w-md w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="搜索管理员用户名、姓名或邮箱..."
            className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full transition-all"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 text-sm whitespace-nowrap">
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">筛选</span>
          </button>
          <div className="h-6 w-px bg-gray-200 hidden md:block" />
          <div className="flex bg-gray-100 p-1 rounded-lg">
            {[
              { id: 'all', label: '全部角色' },
              { id: 'super_admin', label: '超级管理员' },
              { id: 'ops', label: '运营' },
              { id: 'auditor', label: '风控审核' },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => {
                  setRoleFilter(opt.id as 'all' | AdminRole);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                  roleFilter === opt.id ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="flex bg-gray-100 p-1 rounded-lg">
            {[
              { id: 'all', label: '全部状态' },
              { id: 'active', label: '启用' },
              { id: 'disabled', label: '停用' },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => {
                  setStatusFilter(opt.id as 'all' | AdminStatus);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                  statusFilter === opt.id ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50/50 text-gray-500 font-medium border-b border-gray-100">
            <tr>
              <th className="px-6 py-4">管理员</th>
              <th className="px-6 py-4">角色</th>
              <th className="px-6 py-4">状态</th>
              <th className="px-6 py-4">创建时间</th>
              <th className="px-6 py-4">最后登录</th>
              <th className="px-6 py-4 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {paginatedAdmins.map((a) => (
              <tr key={a.id} className="hover:bg-gray-50/80 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600/10 text-blue-600 flex items-center justify-center border border-blue-100">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 flex items-center gap-2">
                        {a.realName}
                        <span className="text-xs text-gray-400 font-mono">{a.username}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {a.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {a.phone}
                        </span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      a.role === 'super_admin'
                        ? 'bg-purple-50 text-purple-700'
                        : a.role === 'ops'
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    <UserCog className="w-3 h-3" />
                    {a.role === 'super_admin' ? '超级管理员' : a.role === 'ops' ? '运营' : '风控审核'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      a.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        a.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                      }`}
                    />
                    {a.status === 'active' ? '启用' : '停用'}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs text-gray-500">{a.createdAt}</td>
                <td className="px-6 py-4 text-xs text-gray-500">{a.lastLogin}</td>
                <td className="px-6 py-4 text-right">
                  <TableActionMenu
                    isOpen={activeActionId === a.id}
                    onToggle={(e) => {
                      e.stopPropagation();
                      setActiveActionId(activeActionId === a.id ? null : a.id);
                    }}
                    onClose={() => setActiveActionId(null)}
                  >
                    <button className="w-full text-left px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                      <UserCog className="w-3.5 h-3.5 text-blue-500" /> 编辑角色
                    </button>
                    <button className="w-full text-left px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 text-orange-500" /> 重置密码
                    </button>
                    <button className="w-full text-left px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 text-emerald-500" /> 强制下线
                    </button>
                    <div className="h-px bg-gray-100 my-0" />
                    <button className="w-full text-left px-4 py-2.5 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2">
                      <Trash2 className="w-3.5 h-3.5" /> 删除管理员
                    </button>
                  </TableActionMenu>
                </td>
              </tr>
            ))}
            {paginatedAdmins.length === 0 && (
              <tr>
                <td className="px-6 py-10 text-center text-sm text-gray-400" colSpan={6}>
                  暂无符合条件的管理员记录
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          setPage={setPage}
          totalItems={filteredAdmins.length}
          itemsPerPage={ITEMS_PER_PAGE}
        />
      </div>
    </div>
  );
};

export default AdminsMgmt;

