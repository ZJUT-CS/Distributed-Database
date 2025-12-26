import React from 'react';
import { AlertCircle } from 'lucide-react';

export function DashboardErrorBanner(props: { errorMessage: string | null }) {
  const { errorMessage } = props;

  if (!errorMessage) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-red-500/40 bg-gradient-to-r from-red-950/80 to-red-900/60 backdrop-blur-xl p-5 shadow-xl shadow-red-500/10">
      <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-transparent" />
      <div className="relative flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center">
          <AlertCircle className="w-6 h-6 text-red-400" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-red-200 mb-1 text-base">数据加载失败</h3>
          <p className="text-sm text-red-300/90 leading-relaxed">
            无法连接后端服务，请检查服务状态或网络连接。
            <span className="text-red-400/70 ml-2 text-xs">错误: {errorMessage}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
