import React, { useEffect, useState } from 'react';
import { Search, Plus, Shield, UserCog, Lock, Trash2, RefreshCw, Download } from 'lucide-react';
import { Pagination, TableActionMenu, AdminBadge, AdminButton, AdminModal, AdminPageHeader, FilterBar, AdminTableState, useAdminList, useConfirm, useToast } from '@/features/admin';
import { createAdmin, deleteAdmin, resetAdminPassword, listAdminsPage, type AdminItem } from '@/features/admin/api/admins';
import EntityCell from '@/components/common/EntityCell';
import { formatApiError } from '@/utils/apiError';
import { formatDateTimeZhCN } from '@/utils/formatters';

// 角色常量
const ADMIN_ROLE = {
  NORMAL: 1,
  SUPER: 2,
} as const;

const ADMIN_ROLE_MAP: Record<number, { label: string; variant: 'purple' | 'primary' }> = {
  [ADMIN_ROLE.SUPER]: { label: '超级管理员', variant: 'purple' },
  [ADMIN_ROLE.NORMAL]: { label: '普通管理员', variant: 'primary' },
};

const AdminsMgmt: React.FC = () => {
  const { confirm } = useConfirm();
  const toast = useToast();
  const [keywordInput, setKeywordInput] = useState('');
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const ITEMS_PER_PAGE = 10;

  const {
    items: admins,
    total,
    page,
    totalPages,
    loading,
    error,
    filters,
    setPage,
    setFilters,
    refresh,
    retry,
  } = useAdminList<AdminItem, { keyword?: string }>({
    pageSize: ITEMS_PER_PAGE,
    initialFilters: { keyword: '' },
    fetchFn: async ({ page, size, keyword }) => {
      const res = await listAdminsPage({ page, size, keyword: String(keyword ?? '').trim() || undefined });
      return { data: res.data ?? [], total: res.total ?? 0 };
    },
  });

  // 新增弹窗
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ adminAccount: '', password: '', role: ADMIN_ROLE.NORMAL });

  // 重置密码弹窗
  const [resetPwdOpen, setResetPwdOpen] = useState(false);
  const [resetPwdAdmin, setResetPwdAdmin] = useState<AdminItem | null>(null);
  const [resetPwdValue, setResetPwdValue] = useState('');

  // 关键词输入防抖，避免每次键入都请求
  useEffect(() => {
    const t = setTimeout(() => {
      const next = keywordInput.trim();
      const current = String(filters.keyword ?? '');
      if (next === current) return;
      setFilters({ keyword: next });
    }, 300);
    return () => clearTimeout(t);
  }, [keywordInput, filters.keyword, setFilters]);

  const handleSearch = () => {
    const next = keywordInput.trim();
    const current = String(filters.keyword ?? '');
    if (next === current) return;
    setFilters({ keyword: next });
  };

  const closeCreateModal = () => {
    setIsModalOpen(false);
    setFormData({ adminAccount: '', password: '', role: ADMIN_ROLE.NORMAL });
  };

  const handleCreate = async () => {
    if (!formData.adminAccount || !formData.password) {
      toast.error('请填写账号和密码');
      return;
    }
    try {
      await createAdmin(formData);
      toast.success('创建成功');
      closeCreateModal();
      setPage(1);
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  const handleDelete = async (adminId: string) => {
    const ok = await confirm({
      title: '删除管理员',
      message: '确定要删除该管理员吗？此操作不可恢复。',
      confirmText: '删除',
      cancelText: '取消',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await deleteAdmin(adminId);
      toast.success('删除成功');
      refresh(false);
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  const openResetPassword = (a: AdminItem) => {
    setResetPwdAdmin(a);
    setResetPwdValue('');
    setResetPwdOpen(true);
    setActiveActionId(null);
  };

  const closeResetPassword = () => {
    setResetPwdOpen(false);
    setResetPwdAdmin(null);
    setResetPwdValue('');
  };

  const handleResetPassword = async () => {
    if (!resetPwdAdmin?.adminId) return;
    const newPassword = resetPwdValue.trim();
    if (!newPassword || newPassword.length < 6) {
      toast.error('密码不能为空且至少6位');
      return;
    }
    try {
      await resetAdminPassword(resetPwdAdmin.adminId, newPassword);
      toast.success('密码重置成功');
      closeResetPassword();
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };


  return (
    <div className="space-y-6 animate-fade-in-up">
      <AdminPageHeader
        icon={Shield}
        iconClassName="text-indigo-500"
        title="管理员管理"
        description="维护后台管理员账号与角色权限"
        actions={
          <div className="flex items-center gap-3">
            <button className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all flex items-center gap-2">
              <Download className="w-4 h-4" /> 导出数据
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all duration-300 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> 新增管理员
            </button>
          </div>
        }
      />

      <FilterBar
        left={
          <div className="relative flex-1 md:max-w-md w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜索管理员账号..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-sm"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
        }
        right={
          <div className="flex items-center gap-2">
            <AdminButton variant="outline" className="h-9 px-3" onClick={handleSearch} disabled={loading}>
              搜索
            </AdminButton>
            <button
              onClick={() => refresh(true)}
              disabled={loading}
              className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50"
              title="刷新"
              type="button"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        }
      />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-visible min-h-[400px] flex flex-col">
        <AdminTableState
          loading={loading}
          error={error}
          isEmpty={admins.length === 0}
          onRetry={retry}
          emptyIcon={Shield}
          emptyTitle={keywordInput.trim() ? '未找到匹配管理员' : '暂无管理员'}
          emptyDescription={keywordInput.trim() ? '请尝试调整搜索条件' : '点击上方按钮添加管理员'}
          skeletonRows={5}
          skeletonColumns={5}
        >
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50/80">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">管理员</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">角色</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">创建时间</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">最后登录</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {admins.map((a) => (
                <tr key={a.adminId} className="hover:bg-indigo-50/30 transition-colors group">
                  <td className="px-6 py-4">
                    <EntityCell
                      leading={
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${a.role === ADMIN_ROLE.SUPER ? 'bg-purple-600/10 text-purple-600 border-purple-100' : 'bg-indigo-600/10 text-indigo-600 border-indigo-100'}`}>
                          <Shield className="w-5 h-5" />
                        </div>
                      }
                      title={a.adminAccount}
                      subtitle={`ID: ${a.adminId}`}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <AdminBadge
                      icon={UserCog}
                      variant={ADMIN_ROLE_MAP[a.role]?.variant || 'primary'}
                    >
                      {ADMIN_ROLE_MAP[a.role]?.label || `角色${a.role}`}
                    </AdminBadge>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500">{formatDateTimeZhCN(a.createTime)}</td>
                  <td className="px-6 py-4 text-xs text-gray-500">{formatDateTimeZhCN(a.lastLoginTime)}</td>
                  <td className="px-6 py-4 text-right">
                    <TableActionMenu
                      isOpen={activeActionId === a.adminId}
                      onToggle={(e) => {
                        e.stopPropagation();
                        setActiveActionId(activeActionId === a.adminId ? null : a.adminId);
                      }}
                      onClose={() => setActiveActionId(null)}
                    >
                      <button
                        onClick={() => openResetPassword(a)}
                        className="w-full text-left px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Lock className="w-3.5 h-3.5 text-orange-500" /> 重置密码
                      </button>
                      <div className="h-px bg-gray-100 my-0" />
                      <button
                        onClick={() => { handleDelete(a.adminId); setActiveActionId(null); }}
                        disabled={a.role === ADMIN_ROLE.SUPER}
                        className="w-full text-left px-4 py-2.5 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> 删除管理员
                      </button>
                    </TableActionMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            setPage={setPage}
            totalItems={total}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        </AdminTableState>
      </div>

      {/* 新增管理员弹窗 */}
      <AdminModal
        isOpen={isModalOpen}
        onClose={closeCreateModal}
        title="新增管理员"
        theme="indigo-purple"
        maxWidth="md"
      >
        <div className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500">账号</label>
            <input
              type="text"
              value={formData.adminAccount}
              onChange={(e) => setFormData({ ...formData, adminAccount: e.target.value })}
              placeholder="请输入管理员账号"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500">密码</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="请输入密码（至少6位）"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500">角色</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: Number(e.target.value) as typeof ADMIN_ROLE.NORMAL })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value={ADMIN_ROLE.NORMAL}>普通管理员</option>
              <option value={ADMIN_ROLE.SUPER}>超级管理员</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <AdminButton variant="outline" onClick={closeCreateModal}>
              取消
            </AdminButton>
            <AdminButton variant="primary" onClick={handleCreate}>
              创建
            </AdminButton>
          </div>
        </div>
      </AdminModal>

      {/* 重置密码弹窗 */}
      <AdminModal
        isOpen={resetPwdOpen}
        onClose={closeResetPassword}
        title="重置管理员密码"
        theme="indigo-purple"
        maxWidth="md"
      >
        <div className="p-6 space-y-4">
          <div className="text-sm text-gray-600">
            账号：<span className="font-semibold text-gray-900">{resetPwdAdmin?.adminAccount ?? '-'}</span>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500">新密码</label>
            <input
              type="password"
              value={resetPwdValue}
              onChange={(e) => setResetPwdValue(e.target.value)}
              placeholder="请输入新密码（至少6位）"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <AdminButton variant="outline" onClick={closeResetPassword}>
              取消
            </AdminButton>
            <AdminButton variant="primary" onClick={handleResetPassword}>
              确认重置
            </AdminButton>
          </div>
        </div>
      </AdminModal>
    </div>
  );
};

export default AdminsMgmt;

