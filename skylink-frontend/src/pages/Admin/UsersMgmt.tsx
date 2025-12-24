import React, { useEffect, useMemo, useState } from 'react';
import { Search, Plus, Edit, Trash2, Shield, Mail, Ban, Lock, Users, Download, Phone, CreditCard, Eye, CheckSquare, Square, X } from 'lucide-react';
import { listAdminUsers, type AdminUserItem } from '../../features/admin/api/users';
import {
  Pagination,
  TableActionMenu,
  AdminPageHeader,
  AdminModal,
  AdminBadge,
  AdminTableState,
  FilterBar,
  ErrorBanner,
  SensitiveField,
  AdminDrawer,
  useConfirm,
  useToast,
  useSensitiveAudit,
  GENDER_MAP,
  GENDER_OPTIONS,
} from '@/features/admin';
import EntityCell from '@/components/common/EntityCell';
import { exportToCSV } from '@/utils/export';
import { useAdminUsers, useCreateAdminUser, useUpdateAdminUser, useResetAdminUserPassword, useDeleteAdminUser } from '@/features/admin/hooks/useAdminUsers';

const maskPhone = (v?: string | number | null) => {
  const s = String(v ?? '').trim();
  if (!s) return '-';
  if (s.length < 7) return s;
  return `${s.slice(0, 3)}****${s.slice(-4)}`;
};

const UsersMgmt: React.FC = () => {
  const { confirm } = useConfirm();
  const toast = useToast();
  const { createRevealAudit, createCopyAudit, createRevealConfirm } = useSensitiveAudit();

  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const ITEMS_PER_PAGE = 8;

  // 重置密码弹窗状态
  const [resetPwdOpen, setResetPwdOpen] = useState(false);
  const [resetPwdUser, setResetPwdUser] = useState<AdminUserItem | null>(null);
  const [resetPwdValue, setResetPwdValue] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUserItem | null>(null);
  const [formPhone, setFormPhone] = useState('');
  const [formRealName, setFormRealName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formGender, setFormGender] = useState<number | ''>('');
  const [formIdCard, setFormIdCard] = useState('');

  // 用户详情 Drawer
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUserItem | null>(null);

  const normalizedSearch = useMemo(() => searchTerm.trim(), [searchTerm]);

  const { data: usersData, isLoading, error, refetch } = useAdminUsers(
    { page, size: ITEMS_PER_PAGE, keyword: normalizedSearch || undefined },
    true
  );

  const items = usersData?.data || [];
  const total = usersData?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));

  const createUserMutation = useCreateAdminUser();
  const updateUserMutation = useUpdateAdminUser();
  const resetPasswordMutation = useResetAdminUserPassword();
  const deleteUserMutation = useDeleteAdminUser();

  const loadError = error ? String(error.message || '加载失败') : null;

  const openCreate = () => {
    setEditing(null);
    setFormPhone('');
    setFormRealName('');
    setFormEmail('');
    setFormPassword('');
    setFormGender('');
    setFormIdCard('');
    setModalOpen(true);
  };

  const openEdit = (u: AdminUserItem) => {
    setEditing(u);
    setFormPhone(u.phoneNumber ? String(u.phoneNumber) : '');
    setFormRealName(u.realName ? String(u.realName) : '');
    setFormEmail(u.email ? String(u.email) : '');
    setFormPassword('');
    setFormGender(u.gender != null ? Number(u.gender) : '');
    setFormIdCard('');
    setModalOpen(true);
  };

  const submit = async () => {
    const phoneNumber = formPhone.trim();
    const realName = formRealName.trim();
    const email = formEmail.trim();
    const gender = formGender === '' ? undefined : Number(formGender);
    const idCard = formIdCard.trim() || undefined;
    if (!phoneNumber) {
      toast.warning('请输入手机号');
      return;
    }

    try {
      if (editing?.userId) {
        await updateUserMutation.mutateAsync({ userId: editing.userId, body: { phoneNumber, realName, email, gender, idCard } });
        toast.success('用户信息已更新');
      } else {
        if (!formPassword.trim()) {
          toast.warning('请输入初始密码');
          return;
        }
        await createUserMutation.mutateAsync({ phoneNumber, password: formPassword.trim(), realName, email });
        toast.success('用户创建成功');
      }
      setModalOpen(false);
    } catch (e: any) {
      toast.error(e?.message || '操作失败');
    }
  };

  const handleDisable = async (u: AdminUserItem) => {
    if (!u.userId) return;
    const confirmed = await confirm({
      title: '禁用账号',
      message: `确定要禁用用户 ${u.realName || maskPhone(u.phoneNumber)} 的账号吗？`,
      variant: 'warning',
      confirmText: '确认禁用',
    });
    if (!confirmed) return;
    try {
      await updateUserMutation.mutateAsync({ userId: u.userId, body: { userStatus: 2 } });
      toast.success('账号已禁用');
    } catch (e: any) {
      toast.error(e?.message || '操作失败');
    }
  };

  const handleEnable = async (u: AdminUserItem) => {
    if (!u.userId) return;
    try {
      await updateUserMutation.mutateAsync({ userId: u.userId, body: { userStatus: 1 } });
      toast.success('账号已启用');
    } catch (e: any) {
      toast.error(e?.message || '操作失败');
    }
  };

  const openResetPwdModal = (u: AdminUserItem) => {
    setResetPwdUser(u);
    setResetPwdValue('');
    setResetPwdOpen(true);
    setActiveActionId(null);
  };

  const handleResetPassword = async () => {
    if (!resetPwdUser?.userId) return;
    const pwd = resetPwdValue.trim();
    if (!pwd) {
      toast.warning('请输入新密码');
      return;
    }
    try {
      await resetPasswordMutation.mutateAsync({ userId: resetPwdUser.userId, password: pwd });
      toast.success('密码已重置');
      setResetPwdOpen(false);
    } catch (e: any) {
      toast.error(e?.message || '操作失败');
    }
  };

  const handleDelete = async (u: AdminUserItem) => {
    if (!u.userId) return;
    const confirmed = await confirm({
      title: '删除用户',
      message: `确定要删除用户 ${u.realName || maskPhone(u.phoneNumber)} 吗？此操作不可恢复。`,
      variant: 'danger',
      confirmText: '确认删除',
    });
    if (!confirmed) return;
    try {
      await deleteUserMutation.mutateAsync(u.userId);
      setPage(1);
      toast.success('用户已删除');
    } catch (e: any) {
      toast.error(e?.message || '操作失败');
    }
  };

  const handleBatchDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) {
      toast.warning('请先选择要删除的用户');
      return;
    }
    const confirmed = await confirm({
      title: '批量删除用户',
      message: `确定要删除选中的 ${ids.length} 个用户吗？此操作不可恢复。`,
      variant: 'danger',
      confirmText: '确认删除',
    });
    if (!confirmed) return;
    try {
      await Promise.all(ids.map(id => deleteUserMutation.mutateAsync(id)));
      toast.success('删除成功');
      setSelectedIds(new Set());
      setPage(1);
    } catch (e: any) {
      toast.error(e?.message || '操作失败');
    }
  };

  const handleBatchDisable = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) {
      toast.warning('请先选择要禁用的用户');
      return;
    }
    const confirmed = await confirm({
      title: '批量禁用账号',
      message: `确定要禁用选中的 ${ids.length} 个用户账号吗？`,
      variant: 'warning',
      confirmText: '确认禁用',
    });
    if (!confirmed) return;
    try {
      await Promise.all(ids.map(id => updateUserMutation.mutateAsync({ userId: id, body: { userStatus: 2 } })));
      toast.success('账号已禁用');
      setSelectedIds(new Set());
    } catch (e: any) {
      toast.error(e?.message || '操作失败');
    }
  };

  const handleBatchEnable = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) {
      toast.warning('请先选择要启用的用户');
      return;
    }
    try {
      await Promise.all(ids.map(id => updateUserMutation.mutateAsync({ userId: id, body: { userStatus: 1 } })));
      toast.success('账号已启用');
      setSelectedIds(new Set());
    } catch (e: any) {
      toast.error(e?.message || '操作失败');
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map(u => String(u.userId))));
    }
  };

  const handleSelectOne = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const allSelected = items.length > 0 && selectedIds.size === items.length;
  const someSelected = selectedIds.size > 0;

  // 导出数据
  const handleExport = async () => {
    try {
      toast.info('正在导出数据...');
      const res = await listAdminUsers({ page: 1, size: 1000, keyword: normalizedSearch || undefined });
      const data = res.data ?? [];
      if (!data.length) {
        toast.warning('暂无数据可导出');
        return;
      }
      exportToCSV(data, '用户列表', [
        { key: 'userId', label: '用户ID' },
        { key: 'phoneNumber', label: '手机号', formatter: (item) => maskPhone(item.phoneNumber) },
        { key: 'realName', label: '姓名', formatter: (item) => item.realName || '' },
        { key: 'email', label: '邮箱', formatter: (item) => item.email || '' },
        { key: 'gender', label: '性别', formatter: (item) => item.gender != null && item.gender in GENDER_MAP ? GENDER_MAP[item.gender as keyof typeof GENDER_MAP] : '' },
        { key: 'userStatus', label: '状态', formatter: (item) => item.userStatus === 1 ? '正常' : item.userStatus === 2 ? '锁定' : item.userStatus === 3 ? '注销' : '异常' },
        { key: 'createTime', label: '创建时间', formatter: (item) => item.createTime ? String(item.createTime).replace('T', ' ').slice(0, 19) : '' },
      ]);
      toast.success('导出成功');
    } catch (e: any) {
      toast.error(e?.message || '导出失败');
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
            <button onClick={handleExport} className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all flex items-center gap-2">
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
      <FilterBar
        left={
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
              onKeyDown={(e) => {
                if (e.key === 'Enter') refetch();
              }}
            />
          </div>
        }
        right={
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors"
            >
              搜索
            </button>
            <div className="text-xs text-gray-500">{isLoading ? '加载中...' : `共 ${total} 条`}</div>
          </div>
        }
      />

      {/* Users Table */}
      {loadError ? <ErrorBanner message={loadError} onRetry={() => refetch()} /> : null}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-visible min-h-[400px] flex flex-col">
        {someSelected && (
          <div className="px-6 py-3 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between">
            <span className="text-sm font-medium text-indigo-700">已选择 {selectedIds.size} 项</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleBatchEnable}
                className="px-3 py-1.5 text-xs font-medium text-emerald-600 bg-white border border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors flex items-center gap-1"
              >
                <Shield className="w-3.5 h-3.5" /> 批量启用
              </button>
              <button
                onClick={handleBatchDisable}
                className="px-3 py-1.5 text-xs font-medium text-orange-600 bg-white border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors flex items-center gap-1"
              >
                <Ban className="w-3.5 h-3.5" /> 批量禁用
              </button>
              <button
                onClick={handleBatchDelete}
                className="px-3 py-1.5 text-xs font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> 批量删除
              </button>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
        <AdminTableState
          loading={isLoading}
          error={loadError}
          isEmpty={items.length === 0}
          onRetry={() => refetch()}
          emptyTitle={normalizedSearch ? '未找到匹配用户' : '暂无用户数据'}
          emptyDescription={normalizedSearch ? '请尝试调整搜索条件' : '当前没有符合条件的用户记录'}
          skeletonRows={5}
          skeletonColumns={5}
        >
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50/80">
              <tr>
                <th className="px-6 py-4 w-10">
                  <button
                    onClick={handleSelectAll}
                    className="text-gray-400 hover:text-indigo-600 transition-colors"
                  >
                    {allSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                  </button>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">用户</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">角色</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">状态</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">创建时间</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((u) => (
                <tr key={String(u.userId)} className="hover:bg-indigo-50/30 transition-colors group">
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleSelectOne(String(u.userId))}
                      className="text-gray-400 hover:text-indigo-600 transition-colors"
                    >
                      {selectedIds.has(String(u.userId)) ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <EntityCell
                      leading={
                        <div className="w-10 h-10 rounded-full bg-indigo-600/10 text-indigo-700 flex items-center justify-center border-2 border-white shadow-sm font-bold">
                          {(u.realName || u.phoneNumber || 'U').slice(0, 1).toUpperCase()}
                        </div>
                      }
                      title={u.realName || maskPhone(u.phoneNumber) || '-'}
                      subtitle={u.userId != null ? `UID:${String(u.userId)}` : undefined}
                      meta={[
                        { icon: Phone, text: maskPhone(u.phoneNumber) },
                        { icon: Mail, text: u.email || '-' },
                        { icon: CreditCard, text: u.idCardPresent ? (u.idCardMasked || '已实名') : '未实名' },
                      ]}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <AdminBadge icon={Shield} variant="info">
                      USER
                    </AdminBadge>
                  </td>
                  <td className="px-6 py-4">
                    <AdminBadge dot variant={u.userStatus === 1 ? 'success' : 'danger'}>
                      {u.userStatus === 1 ? '正常' : u.userStatus === 2 ? '锁定' : u.userStatus === 3 ? '注销' : '异常'}
                    </AdminBadge>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500">
                    {u.createTime ? String(u.createTime).replace('T', ' ').slice(0, 16) : '-'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <TableActionMenu
                      isOpen={activeActionId === String(u.userId)}
                      onToggle={(e) => {
                        e.stopPropagation();
                        setActiveActionId(activeActionId === String(u.userId) ? null : String(u.userId));
                      }}
                      onClose={() => setActiveActionId(null)}
                    >
                      <button
                        onClick={() => {
                          setSelectedUser(u);
                          setDetailDrawerOpen(true);
                          setActiveActionId(null);
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Eye className="w-3.5 h-3.5 text-blue-500" /> 查看详情
                      </button>
                      <button
                        onClick={() => openEdit(u)}
                        className="w-full text-left px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Edit className="w-3.5 h-3.5 text-indigo-500" /> 编辑信息
                      </button>
                      <button
                        onClick={() => openResetPwdModal(u)}
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

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500">性别</label>
            <select
              value={formGender}
              onChange={(e) => setFormGender(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
            >
              {GENDER_OPTIONS.map((opt) => (
                <option key={String(opt.value)} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500">身份证号</label>
            <input
              value={formIdCard}
              onChange={(e) => setFormIdCard(e.target.value)}
              placeholder={editing?.idCardPresent ? `已实名：${editing.idCardMasked || '已设置'}（不可覆盖，留空即可）` : '未实名：请输入身份证号（可选）'}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            {editing?.idCardPresent ? (
              <div className="text-xs text-gray-400">提示：为保护身份信息，系统不支持覆盖已实名证件号。</div>
            ) : null}
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
              disabled={createUserMutation.isPending || updateUserMutation.isPending}
            >
              保存
            </button>
          </div>
        </div>
      </AdminModal>

      {/* 重置密码弹窗 */}
      <AdminModal
        isOpen={resetPwdOpen}
        onClose={() => setResetPwdOpen(false)}
        title="重置密码"
        theme="purple-pink"
        maxWidth="sm"
      >
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600">
            正在为用户 <span className="font-semibold text-gray-800">{resetPwdUser?.realName || maskPhone(resetPwdUser?.phoneNumber)}</span> 重置密码：
          </p>
          <input
            type="password"
            value={resetPwdValue}
            onChange={(e) => setResetPwdValue(e.target.value)}
            placeholder="请输入新密码"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
          <div className="flex gap-3">
            <button
              onClick={() => setResetPwdOpen(false)}
              className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
              type="button"
            >
              取消
            </button>
            <button
              onClick={handleResetPassword}
              className="flex-1 py-2.5 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 shadow-md shadow-orange-500/30 transition-colors"
              type="button"
              disabled={resetPasswordMutation.isPending}
            >
              确认重置
            </button>
          </div>
        </div>
      </AdminModal>

      {/* 用户详情 Drawer */}
      <AdminDrawer
        open={detailDrawerOpen}
        onClose={() => setDetailDrawerOpen(false)}
        title={`用户详情`}
        subtitle={selectedUser?.realName || `UID: ${selectedUser?.userId}`}
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setDetailDrawerOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              关闭
            </button>
            <button
              onClick={() => {
                if (selectedUser) {
                  openEdit(selectedUser);
                  setDetailDrawerOpen(false);
                }
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              编辑用户
            </button>
          </div>
        }
      >
        {selectedUser && (
          <div className="space-y-6">
            {/* 状态卡片 */}
            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">账号状态</span>
                <AdminBadge dot variant={selectedUser.userStatus === 1 ? 'success' : 'danger'}>
                  {selectedUser.userStatus === 1 ? '正常' : selectedUser.userStatus === 2 ? '锁定' : selectedUser.userStatus === 3 ? '注销' : '异常'}
                </AdminBadge>
              </div>
            </div>

            {/* 基本信息 */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">基本信息</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">用户ID</div>
                  <div className="font-mono text-sm text-gray-900">{selectedUser.userId}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">真实姓名</div>
                  <div className="text-sm text-gray-900">{selectedUser.realName || '-'}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">性别</div>
                  <div className="text-sm text-gray-900">
                    {selectedUser.gender != null ? (GENDER_MAP[selectedUser.gender] || '未设置') : '未设置'}
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">注册时间</div>
                  <div className="text-sm text-gray-900">
                    {selectedUser.createTime ? String(selectedUser.createTime).replace('T', ' ').slice(0, 16) : '-'}
                  </div>
                </div>
              </div>
            </div>

            {/* 敏感信息（带审计） */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Lock className="w-4 h-4 text-orange-500" />
                敏感信息
                <span className="text-xs text-gray-400 font-normal">（查看/复制将被记录）</span>
              </h4>
              <div className="space-y-3">
                <div className="p-3 bg-orange-50/50 rounded-lg border border-orange-100">
                  <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                    <Phone className="w-3 h-3" /> 手机号码
                  </div>
                  <SensitiveField
                    value={selectedUser.phoneNumber}
                    type="phone"
                    onRevealConfirm={createRevealConfirm('确定要查看完整手机号吗？此操作将被记录。')}
                    onRevealAudit={createRevealAudit('phone', selectedUser.userId, 'phoneNumber')}
                    onCopyAudit={createCopyAudit('phone', selectedUser.userId, 'phoneNumber')}
                  />
                </div>
                <div className="p-3 bg-orange-50/50 rounded-lg border border-orange-100">
                  <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                    <Mail className="w-3 h-3" /> 电子邮箱
                  </div>
                  <SensitiveField
                    value={selectedUser.email}
                    type="email"
                    onRevealConfirm={createRevealConfirm('确定要查看完整邮箱吗？此操作将被记录。')}
                    onRevealAudit={createRevealAudit('email', selectedUser.userId, 'email')}
                    onCopyAudit={createCopyAudit('email', selectedUser.userId, 'email')}
                  />
                </div>
                <div className="p-3 bg-orange-50/50 rounded-lg border border-orange-100">
                  <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                    <CreditCard className="w-3 h-3" /> 身份证号
                  </div>
                  {selectedUser.idCardPresent ? (
                    <SensitiveField
                      value={selectedUser.idCardMasked || '已实名（数据脱敏）'}
                      type="idCard"
                      allowReveal={false}
                      allowCopy={false}
                    />
                  ) : (
                    <span className="text-sm text-gray-400">未实名认证</span>
                  )}
                </div>
              </div>
            </div>

            {/* 更新记录 */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">时间记录</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">注册时间</span>
                  <span className="text-gray-900">
                    {selectedUser.createTime ? String(selectedUser.createTime).replace('T', ' ').slice(0, 19) : '-'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </AdminDrawer>
    </div>
  );
};

export default UsersMgmt;
