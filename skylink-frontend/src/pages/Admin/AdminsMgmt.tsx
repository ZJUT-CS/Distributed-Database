import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Shield, UserCog, Lock, Trash2, RefreshCw, Download, X } from 'lucide-react';
import { Pagination, TableActionMenu, AdminBadge, AdminPageHeader, FilterBar, AdminTableState, useConfirm, useToast } from '@/features/admin';
import { listAdmins, createAdmin, deleteAdmin, resetAdminPassword, type AdminItem } from '@/features/admin/api/admins';
import EntityCell from '@/components/common/EntityCell';
import { formatApiError } from '@/utils/apiError';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const ITEMS_PER_PAGE = 10;

  const [admins, setAdmins] = useState<AdminItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 新增弹窗
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ adminAccount: '', password: '', role: ADMIN_ROLE.NORMAL });

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listAdmins(searchTerm || undefined);
      setAdmins(data);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  // 前端分页
  const totalPages = Math.ceil(admins.length / ITEMS_PER_PAGE) || 1;
  const paginatedAdmins = admins.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleSearch = () => {
    setPage(1);
    fetchAdmins();
  };

  const handleCreate = async () => {
    if (!formData.adminAccount || !formData.password) {
      toast.error('请填写账号和密码');
      return;
    }
    try {
      await createAdmin(formData);
      toast.success('创建成功');
      setIsModalOpen(false);
      setFormData({ adminAccount: '', password: '', role: ADMIN_ROLE.NORMAL });
      fetchAdmins();
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
      fetchAdmins();
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  const handleResetPassword = async (adminId: string) => {
    const newPassword = prompt('请输入新密码（至少6位）：');
    if (!newPassword || newPassword.length < 6) {
      toast.error('密码不能为空且至少6位');
      return;
    }
    try {
      await resetAdminPassword(adminId, newPassword);
      toast.success('密码重置成功');
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  const formatTime = (timestamp?: number) => {
    if (!timestamp) return '-';
    return new Date(timestamp).toLocaleString('zh-CN');
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
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
        }
        right={
          <button
            onClick={() => fetchAdmins()}
            disabled={loading}
            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50"
            title="刷新"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        }
      />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-visible min-h-[400px] flex flex-col">
        <AdminTableState
          loading={loading}
          error={error}
          isEmpty={paginatedAdmins.length === 0}
          onRetry={fetchAdmins}
          emptyIcon={Shield}
          emptyTitle={searchTerm ? '未找到匹配管理员' : '暂无管理员'}
          emptyDescription={searchTerm ? '请尝试调整搜索条件' : '点击上方按钮添加管理员'}
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
              {paginatedAdmins.map((a) => (
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
                  <td className="px-6 py-4 text-xs text-gray-500">{formatTime(a.createTime)}</td>
                  <td className="px-6 py-4 text-xs text-gray-500">{formatTime(a.lastLoginTime)}</td>
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
                        onClick={() => { handleResetPassword(a.adminId); setActiveActionId(null); }}
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
            totalItems={admins.length}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        </AdminTableState>
      </div>

      {/* 新增管理员弹窗 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">新增管理员</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-white/70 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
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
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleCreate}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  创建
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminsMgmt;

