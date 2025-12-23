import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Search, Eye, Download, XCircle, ShoppingCart, CheckSquare, Square, X } from 'lucide-react';
import { cancelAdminOrder, listAdminOrders, type AdminOrderItem } from '../../features/admin/api/orders';
import {
  Pagination,
  TableActionMenu,
  AdminBadge,
  AdminPageHeader,
  AdminTableState,
  FilterBar,
  ErrorBanner,
  AdminDrawer,
  SensitiveField,
  useAdminList,
  useConfirm,
  useToast,
  useSensitiveAudit,
  ORDER_STATUS,
  ORDER_STATUS_MAP,
} from '@/features/admin';
import EntityCell from '@/components/common/EntityCell';
import { exportToCSV } from '@/utils/export';

const BookingsMgmt: React.FC = () => {
  const { confirm } = useConfirm();
  const toast = useToast();
  const { createRevealAudit, createCopyAudit } = useSensitiveAudit();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const ITEMS_PER_PAGE = 8;

  // Drawer 状态
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrderItem | null>(null);

  type BookingFilters = {
    orderNo?: number;
    orderStatus?: number;
  };

  const fetchOrders = useCallback(
    async (params: { page: number; size: number } & BookingFilters) => {
      const res = await listAdminOrders({
        page: params.page,
        size: params.size,
        orderNo: params.orderNo,
        orderStatus: params.orderStatus,
      });
      return { data: res.data ?? [], total: res.total ?? 0 };
    },
    []
  );

  const {
    items,
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
  } = useAdminList<AdminOrderItem, BookingFilters>({
    pageSize: ITEMS_PER_PAGE,
    initialFilters: {},
    fetchFn: fetchOrders,
  });

  const parsedOrderNo = useMemo(() => {
    const s = String(searchTerm ?? '').trim();
    if (!s) return undefined;
    if (!/^\d+$/.test(s)) return undefined;
    const v = parseInt(s, 10);
    return Number.isFinite(v) ? v : undefined;
  }, [searchTerm]);

  const mappedOrderStatus = useMemo(() => {
    const statusMapping: Record<string, number | undefined> = {
      all: undefined,
      paid: ORDER_STATUS.CONFIRMED,
      pending: ORDER_STATUS.PENDING_PAYMENT,
      cancelled: ORDER_STATUS.CANCELLED,
      audit: ORDER_STATUS.PENDING_AUDIT,
    };
    return statusMapping[statusFilter];
  }, [statusFilter]);

  // 搜索输入：300ms debounce
  useEffect(() => {
    const t = window.setTimeout(() => {
      if (filters.orderNo === parsedOrderNo) return;
      setFilters({ orderNo: parsedOrderNo });
    }, 300);
    return () => window.clearTimeout(t);
  }, [filters.orderNo, parsedOrderNo, setFilters]);

  // 状态筛选：点击即生效（去重，避免重复请求）
  useEffect(() => {
    if (filters.orderStatus === mappedOrderStatus) return;
    setFilters({ orderStatus: mappedOrderStatus });
  }, [filters.orderStatus, mappedOrderStatus, setFilters]);

  const loadError = useMemo(() => {
    const msg = String(error ?? '').trim();
    if (!msg) return null;
    if (/admin required/i.test(msg) || /403/.test(msg)) {
      return '加载失败：当前登录态不是管理员或缺少管理员请求头（X-User-Type: 2）。请使用管理员账号登录后台后重试。';
    }
    return `加载失败：${msg}`;
  }, [error]);

  const getStatusInfo = (s?: number | null) => {
    const status = s ?? -1;
    const mapped = ORDER_STATUS_MAP[status];
    if (mapped) return mapped;
    // fallback
    return { label: '其他', variant: 'neutral' as const };
  };

  const handleCancel = async (orderNo: string | number) => {
    const confirmed = await confirm({
      title: '取消订单',
      message: `确定要取消订单 ${orderNo} 吗？`,
      variant: 'warning',
      confirmText: '确认取消',
    });
    if (!confirmed) return;
    try {
      await cancelAdminOrder(orderNo);
      refresh(false);
      toast.success('订单已取消');
    } catch (e: any) {
      toast.error(e?.message || '取消失败');
    }
  };

  const handleViewDetail = (b: AdminOrderItem) => {
    setSelectedOrder(b);
    setDrawerOpen(true);
    setActiveActionId(null);
  };

  const handleDownloadReceipt = (b: AdminOrderItem) => {
    setActiveActionId(null);
    toast.info('票据下载功能开发中，敬请期待');
  };

  const handleBatchCancel = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) {
      toast.warning('请先选择要取消的订单');
      return;
    }
    const confirmed = await confirm({
      title: '批量取消订单',
      message: `确定要取消选中的 ${ids.length} 个订单吗？`,
      variant: 'warning',
      confirmText: '确认取消',
    });
    if (!confirmed) return;
    try {
      await Promise.all(ids.map(id => cancelAdminOrder(id)));
      toast.success('订单已取消');
      setSelectedIds(new Set());
      refresh(false);
    } catch (e: any) {
      toast.error(e?.message || '取消失败');
    }
  };

  const handleBatchExport = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) {
      toast.warning('请先选择要导出的订单');
      return;
    }
    try {
      toast.info('正在导出数据...');
      const res = await listAdminOrders({ page: 1, size: 1000, orderNo: filters.orderNo, orderStatus: filters.orderStatus });
      const data = res.data?.filter(item => ids.includes(String(item.orderNo))) ?? [];
      if (!data.length) {
        toast.warning('暂无数据可导出');
        return;
      }
      exportToCSV(data, '订单列表', [
        { key: 'orderNo', label: '订单号' },
        { key: 'userId', label: '用户ID' },
        { key: 'passengerName', label: '乘客姓名', formatter: (item) => item.passengerName || '' },
        { key: 'flightNo', label: '航班号', formatter: (item) => item.flightNo || '' },
        { key: 'totalAmount', label: '订单金额', formatter: (item) => String(item.totalAmount || 0) },
        { key: 'orderStatus', label: '状态', formatter: (item) => ORDER_STATUS_MAP[item.orderStatus ?? -1]?.label || '' },
        { key: 'orderTime', label: '下单时间', formatter: (item) => item.orderTime?.replace('T', ' ').slice(0, 19) || '' },
      ]);
      toast.success('导出成功');
      setSelectedIds(new Set());
    } catch (e: any) {
      toast.error(e?.message || '导出失败');
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map(b => String(b.orderNo))));
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
      const res = await listAdminOrders({ page: 1, size: 1000, orderNo: filters.orderNo, orderStatus: filters.orderStatus });
      const data = res.data ?? [];
      if (!data.length) {
        toast.warning('暂无数据可导出');
        return;
      }
      exportToCSV(data, '订单列表', [
        { key: 'orderNo', label: '订单号' },
        { key: 'userId', label: '用户ID' },
        { key: 'passengerName', label: '乘客姓名', formatter: (item) => item.passengerName || '' },
        { key: 'flightNo', label: '航班号', formatter: (item) => item.flightNo || '' },
        { key: 'totalAmount', label: '订单金额', formatter: (item) => String(item.totalAmount || 0) },
        { key: 'orderStatus', label: '状态', formatter: (item) => ORDER_STATUS_MAP[item.orderStatus ?? -1]?.label || '' },
        { key: 'orderTime', label: '下单时间', formatter: (item) => item.orderTime?.replace('T', ' ').slice(0, 19) || '' },
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
        icon={ShoppingCart}
        iconClassName="text-indigo-500"
        title="订单管理"
        description="查看与管理所有航班预订订单"
        actions={
          <button
            onClick={handleExport}
            className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> 导出数据
          </button>
        }
      />

      {loadError && <ErrorBanner message={loadError} onRetry={retry} />}

      {/* Search & Filter Bar */}
      <FilterBar
        left={
          <div className="relative flex-1 md:max-w-md w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜索订单号（数字）..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-sm"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key !== 'Enter') return;
                if (filters.orderNo === parsedOrderNo) return;
                setFilters({ orderNo: parsedOrderNo });
              }}
            />
          </div>
        }
        right={
          <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            <div className="flex bg-gray-100 p-1 rounded-lg">
              {[
                { id: 'all', label: '全部' },
                { id: 'paid', label: '已支付' },
                { id: 'pending', label: '待支付' },
                { id: 'cancelled', label: '已取消' },
              ].map((status) => (
                <button
                  key={status.id}
                  onClick={() => {
                    setStatusFilter(status.id);
                  }}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all whitespace-nowrap ${statusFilter === status.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>
        }
      />

      {/* Bookings Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-visible min-h-[400px] flex flex-col">
        {someSelected && (
          <div className="px-6 py-3 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between">
            <span className="text-sm font-medium text-indigo-700">已选择 {selectedIds.size} 项</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleBatchCancel}
                className="px-3 py-1.5 text-xs font-medium text-orange-600 bg-white border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors flex items-center gap-1"
              >
                <XCircle className="w-3.5 h-3.5" /> 批量取消
              </button>
              <button
                onClick={handleBatchExport}
                className="px-3 py-1.5 text-xs font-medium text-indigo-600 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" /> 批量导出
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
          loading={loading}
          error={loadError}
          isEmpty={items.length === 0}
          onRetry={retry}
          emptyTitle={searchTerm ? '未找到匹配订单' : '暂无订单数据'}
          emptyDescription={searchTerm ? '请尝试调整搜索条件' : '当前没有符合条件的订单记录'}
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
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">订单号</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">客户</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">航班</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">金额</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">状态</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((b) => {
                const st = getStatusInfo(b.orderStatus);
                const route = b.origin && b.destination ? `${b.origin} → ${b.destination}` : '-';
                const customerName = b.passengerName || (b.userId != null ? `用户#${b.userId}` : '-');
                return (
                  <tr key={String(b.orderNo)} className="hover:bg-indigo-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleSelectOne(String(b.orderNo))}
                        className="text-gray-400 hover:text-indigo-600 transition-colors"
                      >
                        {selectedIds.has(String(b.orderNo)) ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <EntityCell
                        leading={
                          <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <ShoppingCart className="w-5 h-5" />
                          </div>
                        }
                        title={String(b.orderNo)}
                        titleClassName="font-mono text-gray-800 flex items-center gap-2 min-w-0"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{customerName}</div>
                      <div className="text-xs text-gray-400">
                        <SensitiveField
                          value={b.email}
                          type="email"
                          onRevealAudit={createRevealAudit('email', String(b.orderNo))}
                          onCopyAudit={createCopyAudit('email', String(b.orderNo))}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <AdminBadge size="sm" variant="info">
                          {b.flightNo || '-'}
                        </AdminBadge>
                        <span className="text-xs text-gray-400">{route}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900">¥{Number(b.totalAmount || 0).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <AdminBadge dot variant={st.variant}>
                        {st.label}
                      </AdminBadge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <TableActionMenu
                        isOpen={activeActionId === String(b.orderNo)}
                        onToggle={(e) => { e.stopPropagation(); setActiveActionId(activeActionId === String(b.orderNo) ? null : String(b.orderNo)); }}
                        onClose={() => setActiveActionId(null)}
                      >
                        <button
                          onClick={() => handleViewDetail(b)}
                          className="w-full text-left px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Eye className="w-3.5 h-3.5 text-indigo-500" /> 查看详情
                        </button>
                        <button
                          onClick={() => handleDownloadReceipt(b)}
                          className="w-full text-left px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Download className="w-3.5 h-3.5 text-gray-500" /> 下载票据
                        </button>
                        <div className="h-px bg-gray-100 my-0"></div>
                        <button
                          onClick={() => handleCancel(b.orderNo)}
                          disabled={b.orderStatus !== ORDER_STATUS.PENDING_AUDIT && b.orderStatus !== ORDER_STATUS.PENDING_PAYMENT}
                          className="w-full text-left px-4 py-2.5 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2 disabled:opacity-40"
                        >
                          <XCircle className="w-3.5 h-3.5" /> 取消订单
                        </button>
                      </TableActionMenu>
                    </td>
                  </tr>
                )
              })}
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
        </AdminTableState>
      </div>

      {/* 订单详情 Drawer */}
      <AdminDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={`订单详情 #${selectedOrder?.orderNo || ''}`}
        subtitle={selectedOrder?.flightNo ? `航班 ${selectedOrder.flightNo}` : undefined}
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setDrawerOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              关闭
            </button>
            {selectedOrder && (selectedOrder.orderStatus === ORDER_STATUS.PENDING_AUDIT || selectedOrder.orderStatus === ORDER_STATUS.PENDING_PAYMENT) && (
              <button
                onClick={() => {
                  setDrawerOpen(false);
                  handleCancel(selectedOrder.orderNo);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
              >
                取消订单
              </button>
            )}
          </div>
        }
      >
        {selectedOrder && (
          <div className="space-y-6">
            {/* 状态卡片 */}
            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">订单状态</span>
                <AdminBadge variant={getStatusInfo(selectedOrder.orderStatus).variant}>
                  {getStatusInfo(selectedOrder.orderStatus).label}
                </AdminBadge>
              </div>
            </div>

            {/* 基本信息 */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">基本信息</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">订单号</div>
                  <div className="font-mono text-sm text-gray-900">{selectedOrder.orderNo}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">用户ID</div>
                  <div className="font-mono text-sm text-gray-900">{selectedOrder.userId || '-'}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">乘客姓名</div>
                  <div className="text-sm text-gray-900">{selectedOrder.passengerName || '-'}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">联系电话</div>
                  <div className="text-sm text-gray-900">
                    <SensitiveField
                      value={selectedOrder.phoneNumber}
                      type="phone"
                      onRevealAudit={createRevealAudit('phone', String(selectedOrder.orderNo))}
                      onCopyAudit={createCopyAudit('phone', String(selectedOrder.orderNo))}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 航班信息 */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">航班信息</h4>
              <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <span className="text-indigo-600 font-bold text-xs">
                      {(selectedOrder.flightNo || '').substring(0, 2)}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{selectedOrder.flightNo || '-'}</div>
                    <div className="text-xs text-gray-500">航班号</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">起飞：</span>
                    <span className="text-gray-900">{selectedOrder.departureTime?.replace('T', ' ').slice(0, 16) || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">到达：</span>
                    <span className="text-gray-900">{selectedOrder.arrivalTime?.replace('T', ' ').slice(0, 16) || '-'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 金额信息 */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">金额信息</h4>
              <div className="p-4 bg-green-50/50 rounded-xl border border-green-100">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">订单总额</span>
                  <span className="text-2xl font-bold text-green-600">
                    ¥{Number(selectedOrder.totalAmount || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* 时间信息 */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">时间记录</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">下单时间</span>
                  <span className="text-gray-900">{selectedOrder.orderTime?.replace('T', ' ').slice(0, 19) || '-'}</span>
                </div>
                {selectedOrder.payTime && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">支付时间</span>
                    <span className="text-gray-900">{selectedOrder.payTime.replace('T', ' ').slice(0, 19)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </AdminDrawer>
    </div>
  );
};

export default BookingsMgmt;
