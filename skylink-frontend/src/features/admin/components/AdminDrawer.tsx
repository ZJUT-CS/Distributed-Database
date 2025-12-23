import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

export interface AdminDrawerProps {
  /** 是否打开 */
  open: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 标题 */
  title: string;
  /** 副标题/描述 */
  subtitle?: string;
  /** 宽度：sm(384px) / md(480px) / lg(640px) / xl(800px) */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** 底部操作区 */
  footer?: React.ReactNode;
  /** 内容 */
  children: React.ReactNode;
  /** 是否显示遮罩 */
  showOverlay?: boolean;
  /** 点击遮罩是否关闭 */
  closeOnOverlayClick?: boolean;
}

const sizeMap = {
  sm: 'max-w-sm',   // 384px
  md: 'max-w-md',   // 448px
  lg: 'max-w-lg',   // 512px
  xl: 'max-w-xl',   // 576px
};

const AdminDrawer: React.FC<AdminDrawerProps> = ({
  open,
  onClose,
  title,
  subtitle,
  size = 'md',
  footer,
  children,
  showOverlay = true,
  closeOnOverlayClick = true,
}) => {
  const drawerRef = useRef<HTMLDivElement>(null);

  // ESC 关闭
  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  // 锁定 body 滚动
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // 聚焦管理
  useEffect(() => {
    if (open && drawerRef.current) {
      drawerRef.current.focus();
    }
  }, [open]);

  if (!open) return null;

  const content = (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* 遮罩层 */}
      {showOverlay && (
        <div
          className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
          onClick={closeOnOverlayClick ? onClose : undefined}
          aria-hidden="true"
        />
      )}

      {/* 抽屉面板 */}
      <div
        ref={drawerRef}
        tabIndex={-1}
        className={`
          relative w-full ${sizeMap[size]} h-full bg-white shadow-2xl
          flex flex-col outline-none
          transform transition-transform duration-300 ease-out
          animate-slide-in-right
        `}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        {/* 头部 */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0 pr-4">
              <h2
                id="drawer-title"
                className="text-lg font-semibold text-gray-900 truncate"
              >
                {title}
              </h2>
              {subtitle && (
                <p className="mt-1 text-sm text-gray-500 truncate">{subtitle}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 p-2 -m-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="关闭"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 内容区 - 可滚动 */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {children}
        </div>

        {/* 底部操作区 */}
        {footer && (
          <div className="flex-shrink-0 px-6 py-4 border-t border-gray-100 bg-gray-50/30">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(content, document.body);
};

export default AdminDrawer;
