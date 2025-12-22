import React, { useEffect, useMemo, useState } from 'react';
import { Search, Plus, Edit, Trash2, Shield, Mail, Filter, Ban, Lock } from 'lucide-react';
import { createAdminUser, deleteAdminUser, listAdminUsers, resetAdminUserPassword, updateAdminUser, type AdminUserItem } from '../../features/admin/api/users';
import Pagination from '../../features/admin/components/Pagination';
import TableActionMenu from '../../features/admin/components/TableActionMenu';

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-2xl font-bold text-gray-800">用户管理</h2>
           <p className="text-gray-500 mt-1 text-sm">管理系统用户、角色与权限</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all"
        >
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
           <div className="h-6 w-px bg-gray-200 hidden md:block"></div>
           <div className="text-xs text-gray-500">{loading ? '加载中...' : `共 ${total} 条`}</div>
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
            {items.map((u) => (
              <tr key={String(u.userId)} className="hover:bg-gray-50/80 transition-colors group">
                <td className="px-6 py-4">
                   <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-600/10 text-blue-700 flex items-center justify-center border-2 border-white shadow-sm font-bold">
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
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border bg-gray-50 text-gray-700 border-gray-100">
                        USER
                    </span>
                 </td>
                 <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        u.userStatus === 1 ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.userStatus === 1 ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                        {u.userStatus === 1 ? '正常' : '禁用'}
                    </span>
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
                            <Edit className="w-3.5 h-3.5 text-blue-500" /> 编辑信息
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
                <td className="px-6 py-10 text-center text-sm text-gray-400" colSpan={5}>
                  暂无数据
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

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="font-bold text-gray-900">{editing ? '编辑用户' : '添加用户'}</div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-sm text-gray-500 hover:text-gray-700"
                type="button"
              >
                关闭
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <div className="text-sm font-semibold text-gray-700">手机号</div>
                <input
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white"
                />
              </div>
              <div className="space-y-2">
                <div className="text-sm font-semibold text-gray-700">姓名</div>
                <input
                  value={formRealName}
                  onChange={(e) => setFormRealName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white"
                />
              </div>
              <div className="space-y-2">
                <div className="text-sm font-semibold text-gray-700">邮箱</div>
                <input
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white"
                />
              </div>
              {!editing && (
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-gray-700">初始密码</div>
                  <input
                    type="password"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white"
                  />
                </div>
              )}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  type="button"
                >
                  取消
                </button>
                <button
                  onClick={submit}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
                  type="button"
                  disabled={loading}
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersMgmt;
