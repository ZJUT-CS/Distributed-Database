import React, { useState, useCallback } from 'react';
import { Eye, EyeOff, Copy, Check, Lock } from 'lucide-react';
import { logger } from '@/shared/logger';

export type SensitiveFieldType = 'phone' | 'idCard' | 'email' | 'bankCard' | 'custom';

export interface SensitiveFieldProps {
  /** 原始值 */
  value: string | number | null | undefined;
  /** 字段类型，用于自动脱敏规则 */
  type?: SensitiveFieldType;
  /** 自定义脱敏函数 */
  maskFn?: (value: string) => string;
  /** 是否允许查看明文（需要权限） */
  allowReveal?: boolean;
  /** 是否允许复制 */
  allowCopy?: boolean;
  /** 查看明文前的确认回调，返回 true 允许查看 */
  onRevealConfirm?: () => Promise<boolean> | boolean;
  /** 查看明文时的审计回调 */
  onRevealAudit?: (value: string) => void;
  /** 复制时的审计回调 */
  onCopyAudit?: (value: string) => void;
  /** 自定义样式类 */
  className?: string;
  /** 空值占位符 */
  placeholder?: string;
}

// 内置脱敏规则
const maskRules: Record<SensitiveFieldType, (v: string) => string> = {
  phone: (v) => {
    if (v.length < 7) return v;
    return `${v.slice(0, 3)}****${v.slice(-4)}`;
  },
  idCard: (v) => {
    if (v.length < 8) return v;
    return `${v.slice(0, 6)}********${v.slice(-4)}`;
  },
  email: (v) => {
    const idx = v.indexOf('@');
    if (idx <= 1) return v;
    const prefix = v.slice(0, idx);
    const domain = v.slice(idx);
    if (prefix.length <= 2) return `${prefix[0]}*${domain}`;
    return `${prefix.slice(0, 2)}${'*'.repeat(Math.min(prefix.length - 2, 4))}${domain}`;
  },
  bankCard: (v) => {
    if (v.length < 8) return v;
    return `${v.slice(0, 4)} **** **** ${v.slice(-4)}`;
  },
  custom: (v) => v,
};

const SensitiveField: React.FC<SensitiveFieldProps> = ({
  value,
  type = 'custom',
  maskFn,
  allowReveal = true,
  allowCopy = true,
  onRevealConfirm,
  onRevealAudit,
  onCopyAudit,
  className = '',
  placeholder = '-',
}) => {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const rawValue = String(value ?? '').trim();
  
  if (!rawValue) {
    return <span className={`text-gray-400 ${className}`}>{placeholder}</span>;
  }

  const maskedValue = maskFn ? maskFn(rawValue) : maskRules[type](rawValue);
  const displayValue = revealed ? rawValue : maskedValue;

  const handleReveal = useCallback(async () => {
    if (revealed) {
      setRevealed(false);
      return;
    }

    if (onRevealConfirm) {
      setLoading(true);
      try {
        const confirmed = await onRevealConfirm();
        if (!confirmed) {
          setLoading(false);
          return;
        }
      } catch {
        setLoading(false);
        return;
      }
      setLoading(false);
    }

    setRevealed(true);
    onRevealAudit?.(rawValue);

    // 30秒后自动隐藏
    setTimeout(() => setRevealed(false), 30000);
  }, [revealed, rawValue, onRevealConfirm, onRevealAudit]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(rawValue);
      setCopied(true);
      onCopyAudit?.(rawValue);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      logger.error('复制失败:', err);
    }
  }, [rawValue, onCopyAudit]);

  return (
    <span className={`inline-flex items-center gap-1.5 group ${className}`}>
      {/* 显示值 */}
      <span className={`font-mono text-sm ${revealed ? 'text-gray-900' : 'text-gray-600'}`}>
        {displayValue}
      </span>

      {/* 操作按钮组 - hover 时显示 */}
      <span className="inline-flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* 查看/隐藏按钮 */}
        {allowReveal && (
          <button
            onClick={handleReveal}
            disabled={loading}
            className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors disabled:opacity-50"
            title={revealed ? '隐藏' : '查看明文'}
          >
            {loading ? (
              <Lock className="w-3.5 h-3.5 animate-pulse" />
            ) : revealed ? (
              <EyeOff className="w-3.5 h-3.5" />
            ) : (
              <Eye className="w-3.5 h-3.5" />
            )}
          </button>
        )}

        {/* 复制按钮 */}
        {allowCopy && (
          <button
            onClick={handleCopy}
            className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
            title="复制"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-green-500" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        )}
      </span>
    </span>
  );
};

export default SensitiveField;
