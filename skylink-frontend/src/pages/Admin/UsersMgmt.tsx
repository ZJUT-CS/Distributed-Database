import React, { useEffect, useMemo, useState } from 'react';
import { Search, Plus, Edit, Trash2, Shield, Mail, Ban, Lock, Users, Download } from 'lucide-react';
import { createAdminUser, deleteAdminUser, listAdminUsers, resetAdminUserPassword, updateAdminUser, type AdminUserItem } from '../../features/admin/api/users';
import { Pagination, TableActionMenu, AdminPageHeader, AdminModal, AdminBadge } from '@/features/admin';

const UsersMgmt: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const ITEMS_PER_PAGE = 8;

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<AdminUserItem[]>([]);
  const [total, setTotal] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUserItem | null>(null);
  const [formPhone, setFormPhone] = useState('');
  const [formRealName, setFormRealName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');

  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));

  const normalizedSearch = useMemo(() => searchTerm.trim(), [searchTerm]);

  const reload = async (nextPage: number) => {
    setLoading(true);
    try {
      const res = await listAdminUsers({
        page: nextPage,
        size: ITEMS_PER_PAGE,
        keyword: normalizedSearch || undefined,
      });
      setItems(res.data || []);
      setTotal(res.total || 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload(page);
  }, [page, normalizedSearch]);

  const openCreate = () => {
    setEditing(null);
    setFormPhone('');
    setFormRealName('');
    setFormEmail('');
    setFormPassword('');
    setModalOpen(true);
  };

  const openEdit = (u: AdminUserItem) => {
    setEditing(u);
    setFormPhone(u.phoneNumber ?? '');
    setFormRealName(u.realName ?? '');
    setFormEmail(u.email ?? '');
    setFormPassword('');
    setModalOpen(true);
  };

  const submit = async () => {
    const phoneNumber = formPhone.trim();
    const realName = formRealName.trim();
    const email = formEmail.trim();
    if (!phoneNumber) {
      alert('请输入手机号');
      return;
    }

    setLoading(true);
    try {
      if (editing?.userId) {
        await updateAdminUser(editing.userId, { phoneNumber, realName, email });
      } else {
        if (!formPassword.trim()) {
          alert('请输入初始密码');
          return;
        }
        await createAdminUser({ phoneNumber, password: formPassword.trim(), realName, email });
      }
      setModalOpen(false);
      await reload(page);
    } catch (e: any) {
      alert(e?.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async (u: AdminUserItem) => {
    if (!u.userId) return;
    if (!confirm('确定要禁用该账号吗？')) return;
    setLoading(true);
    try {
      await updateAdminUser(u.userId, { userStatus: 0 });
      await reload(page);
    } catch (e: any) {
      alert(e?.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  const handleEnable = async (u: AdminUserItem) => {
    if (!u.userId) return;
    setLoading(true);
    try {
      await updateAdminUser(u.userId, { userStatus: 1 });
      await reload(page);
    } catch (e: any) {
      alert(e?.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (u: AdminUserItem) => {
    if (!u.userId) return;
    const pwd = prompt('请输入新密码（将覆盖旧密码）');
    if (!pwd?.trim()) return;
    setLoading(true);
    try {
      await resetAdminUserPassword(u.userId, pwd.trim());
      alert('密码已重置');
    } catch (e: any) {
      alert(e?.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (u: AdminUserItem) => {
    if (!u.userId) return;
    if (!confirm('确定要删除该用户吗？此操作不可恢复。')) return;
    setLoading(true);
    try {
      await deleteAdminUser(u.userId);
      await reload(1);
      setPage(1);
    } catch (e: any) {
      alert(e?.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <AdminPageHeader
        icon={Users}
        iconClassName="text-indigo-500"
        title="用户管理"
        description="管理系统用户、角色与权限"
        actions={
          <div className="flex items-center gap-3">
            <button className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all flex items-center gap-2">
              <Download className="w-4 h-4" /> 导出数据
            </button>
            <button
              onClick={openCreate}
              className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all duration-300 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> 添加用户
            </button>
          </div>
        }
      />

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 md:max-w-md w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
                type="text" 
                placeholder="搜索用户姓名、邮箱..." 
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-sm"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
            />
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
           <button 
             onClick={() => reload(page)}
             className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors"
           >
             搜索
           </button>
           <div className="text-xs text-gray-500">{loading ? '加载中...' : `共 ${total} 条`}</div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm text-left">
           <thead className="bg-gray-50/80">
             <tr>
               <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">用户</th>
               <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">角色</th>
               <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">状态</th>
               <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">最后登录</th>
               <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">操作</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-gray-100">
            {items.map((u) => (
              <tr key={String(u.userId)} className="hover:bg-indigo-50/30 transition-colors group">
                <td className="px-6 py-4">
                   <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-600/10 text-indigo-700 flex items-center justify-center border-2 border-white shadow-sm font-bold">
                          {(u.realName || u.phoneNumber || 'U').slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                            <div className="font-bold text-gray-900">{u.realName || u.phoneNumber || '-'}</div>
                            <div className="text-xs text-gray-400 flex items-center gap-1">
                                <Mail className="w-3 h-3" /> {u.email || '-'}
                            </div>
                        </div>
                    </div>
                 </td>
                 <td className="px-6 py-4">
                    <AdminBadge icon={Shield} variant="neutral">
                      USER
                    </AdminBadge>
                 </td>
                 <td className="px-6 py-4">
                    <AdminBadge dot variant={u.userStatus === 1 ? 'success' : 'neutral'}>
                      {u.userStatus === 1 ? '正常' : '禁用'}
                    </AdminBadge>
                 </td>
                 <td className="px-6 py-4 text-xs text-gray-500">{u.createTime ? String(u.createTime).replace('T', ' ').slice(0, 16) : '-'}</td>
                 <td className="px-6 py-4 text-right">
                    <TableActionMenu
                      isOpen={activeActionId === String(u.userId)}
                      onToggle={(e) => { e.stopPropagation(); setActiveActionId(activeActionId === String(u.userId) ? null : String(u.userId)); }}
                      onClose={() => setActiveActionId(null)}
                    >
                        <button
                          onClick={() => openEdit(u)}
                          className="w-full text-left px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                            <Edit className="w-3.5 h-3.5 text-indigo-500" /> 编辑信息
                        </button>
                        <button
                          onClick={() => handleResetPassword(u)}
                          className="w-full text-left px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                            <Lock className="w-3.5 h-3.5 text-orange-500" /> 重置密码
                        </button>
                        {u.userStatus === 1 ? (
                          <button
                            onClick={() => handleDisable(u)}
                            className="w-full text-left px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                              <Ban className="w-3.5 h-3.5 text-gray-500" /> 禁用账号
                          </button>
                        ) : (
                          <button
                            onClick={() => handleEnable(u)}
                            className="w-full text-left px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                              <Shield className="w-3.5 h-3.5 text-emerald-500" /> 启用账号
                          </button>
                        )}
                        <div className="h-px bg-gray-100 my-0"></div>
                        <button
                          onClick={() => handleDelete(u)}
                          className="w-full text-left px-4 py-2.5 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                            <Trash2 className="w-3.5 h-3.5" /> 删除用户
                        </button>
                    </TableActionMenu>
                 </td>
               </tr>
             ))}
            {!loading && items.length === 0 && (
              <tr>
                <td className="px-6 py-12 text-center text-sm text-gray-400" colSpan={5}>
                  暂无用户数据
                </td>
              </tr>
            )}
           </tbody>
        </table>
        
        {/* Pagination */}
        <Pagination 
          currentPage={page}
          totalPages={totalPages}
          setPage={setPage}
          totalItems={total}
          itemsPerPage={ITEMS_PER_PAGE}
        />
      </div>

      <AdminModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? '编辑用户' : '添加用户'}
        theme="indigo-purple"
      >
        <div className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500">手机号</label>
            <input
              value={formPhone}
              onChange={(e) => setFormPhone(e.target.value)}
              placeholder="请输入手机号"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500">姓名</label>
            <input
              value={formRealName}
              onChange={(e) => setFormRealName(e.target.value)}
              placeholder="请输入姓名"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500">邮箱</label>
            <input
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              placeholder="请输入邮箱"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          {!editing && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500">初始密码</label>
              <input
                type="password"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                placeholder="请输入初始密码"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          )}
          <div className="pt-4 flex gap-3">
            <button
              onClick={() => setModalOpen(false)}
              className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
              type="button"
            >
              取消
            </button>
            <button
              onClick={submit}
              className="flex-1 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-500/30 transition-colors"
              type="button"
              disabled={loading}
            >
              保存
            </button>
          </div>
        </div>
      </AdminModal>
    </div>
  );
};

export default UsersMgmt;
