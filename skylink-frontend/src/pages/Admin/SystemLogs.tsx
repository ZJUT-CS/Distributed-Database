import React, { useState } from 'react';
import { Search, Filter, FileText, Shield, User, Globe, AlertCircle } from 'lucide-react';
import Pagination from './components/Pagination';

type LogLevel = 'info' | 'warning' | 'error';

interface SystemLogItem {
  id: string;
  time: string;
  module: string;
  operator: string;
  operatorRole: string;
  ip: string;
  action: string;
  level: LogLevel;
}

const MOCK_LOGS: SystemLogItem[] = [
  {
    id: 'LOG-20251216001',
    time: '2025-12-16 09:15:21',
    module: '航班管理',
    operator: 'sys_admin',
    operatorRole: '超级管理员',
    ip: '10.0.0.12',
    action: '修改航班 CA1831 票价：1240 → 1390',
    level: 'info',
  },
  {
    id: 'LOG-20251216002',
    time: '2025-12-16 09:20:03',
    module: '订单中心',
    operator: 'ops_zhang',
    operatorRole: '运营',
    ip: '10.0.0.23',
    action: '手工关闭超时未支付订单 ORD-992813',
    level: 'warning',
  },
  {
    id: 'LOG-20251216003',
    time: '2025-12-16 09:35:47',
    module: '退改签审核',
    operator: 'auditor_li',
    operatorRole: '风控审核',
    ip: '10.0.0.35',
    action: '审核通过退票申请 RC-2025001，并触发原路退款',
    level: 'info',
  },
  {
    id: 'LOG-20251216004',
    time: '2025-12-16 09:50:12',
    module: '系统配置',
    operator: 'sys_admin',
    operatorRole: '超级管理员',
    ip: '10.0.0.12',
    action: '修改参数「订单支付超时时间」：15 分钟 → 30 分钟',
    level: 'info',
  },
  {
    id: 'LOG-20251216005',
    time: '2025-12-16 10:02:08',
    module: '登录安全',
    operator: '系统',
    operatorRole: '系统守护',
    ip: '203.0.113.45',
    action: '检测到来自非常用地区的连续登录失败 5 次，已锁定账号 ops_wang 10 分钟',
    level: 'error',
  },
];

const SystemLogs: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState<'all' | string>('all');
  const [levelFilter, setLevelFilter] = useState<'all' | LogLevel>('all');
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  const modules = Array.from(new Set(MOCK_LOGS.map((l) => l.module)));

  const filteredLogs = MOCK_LOGS.filter((l) => {
    const matchModule = moduleFilter === 'all' || l.module === moduleFilter;
    const matchLevel = levelFilter === 'all' || l.level === levelFilter;
    const keyword = searchTerm.toLowerCase();
    const matchKeyword =
      !keyword ||
      l.id.toLowerCase().includes(keyword) ||
      l.operator.toLowerCase().includes(keyword) ||
      l.action.toLowerCase().includes(keyword) ||
      l.ip.toLowerCase().includes(keyword);
    return matchModule && matchLevel && matchKeyword;
  });

  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE) || 1;
  const paginatedLogs = filteredLogs.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const getLevelBadge = (level: LogLevel) => {
    if (level === 'info') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
          <FileText className="w-3 h-3" />
          正常
        </span>
      );
    }
    if (level === 'warning') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
          <AlertCircle className="w-3 h-3" />
          注意
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">
        <AlertCircle className="w-3 h-3" />
        异常
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">操作日志</h2>
          <p className="text-gray-500 mt-1 text-sm">审计管理员关键操作，保障系统安全可追踪</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 md:max-w-md w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="搜索日志编号、操作人、IP 或关键字..."
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
            <button
              onClick={() => {
                setModuleFilter('all');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                moduleFilter === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              全部模块
            </button>
            {modules.map((m) => (
              <button
                key={m}
                onClick={() => {
                  setModuleFilter(m);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                  moduleFilter === m ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
          <div className="flex bg-gray-100 p-1 rounded-lg">
            {[
              { id: 'all', label: '全部级别' },
              { id: 'info', label: '正常' },
              { id: 'warning', label: '注意' },
              { id: 'error', label: '异常' },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => {
                  setLevelFilter(opt.id as 'all' | LogLevel);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                  levelFilter === opt.id ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
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
              <th className="px-6 py-4">时间</th>
              <th className="px-6 py-4">管理员</th>
              <th className="px-6 py-4">模块</th>
              <th className="px-6 py-4">操作内容</th>
              <th className="px-6 py-4">来源 IP</th>
              <th className="px-6 py-4">结果</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {paginatedLogs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50/80 transition-colors group">
                <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">{log.time}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-900 text-slate-100 flex items-center justify-center">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        {log.operator}
                        <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          {log.operatorRole}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-gray-400">
                        <User className="w-3 h-3" />
                        {log.id}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">{log.module}</td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  <div className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
                    <span>{log.action}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    {log.ip}
                  </span>
                </td>
                <td className="px-6 py-4">{getLevelBadge(log.level)}</td>
              </tr>
            ))}
            {paginatedLogs.length === 0 && (
              <tr>
                <td className="px-6 py-10 text-center text-sm text-gray-400" colSpan={6}>
                  暂无符合条件的操作日志记录
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          setPage={setPage}
          totalItems={filteredLogs.length}
          itemsPerPage={ITEMS_PER_PAGE}
        />
      </div>
    </div>
  );
};

export default SystemLogs;

