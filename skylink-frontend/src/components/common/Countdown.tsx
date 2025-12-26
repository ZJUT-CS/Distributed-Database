import React, { useEffect, useState, useRef } from 'react';
import { Clock, AlertCircle } from 'lucide-react';

interface CountdownProps {
    /** 目标截止时间 (Date 或 毫秒时间戳) */
    targetTime: Date | number;
    /** 倒计时结束时回调 */
    onExpire?: () => void;
    /** 自定义样式类名 */
    className?: string;
    /** 显示模式: 'badge' | 'inline' | 'full' */
    variant?: 'badge' | 'inline' | 'full';
    /** 是否显示图标 */
    showIcon?: boolean;
    /** 进入警告状态的剩余秒数阈值 (默认60秒) */
    warningThreshold?: number;
    /** 是否禁用 */
    disabled?: boolean;
}

const pad2 = (n: number) => String(n).padStart(2, '0');

const Countdown: React.FC<CountdownProps> = ({
    targetTime,
    onExpire,
    className = '',
    variant = 'badge',
    showIcon = true,
    warningThreshold = 60,
    disabled = false,
}) => {
    const [timeLeft, setTimeLeft] = useState(() => {
        const target = typeof targetTime === 'number' ? targetTime : targetTime.getTime();
        return Math.max(0, Math.floor((target - Date.now()) / 1000));
    });
    const expiredRef = useRef(false);

    useEffect(() => {
        if (disabled) return;

        const target = typeof targetTime === 'number' ? targetTime : targetTime.getTime();

        const tick = () => {
            const diff = Math.max(0, Math.floor((target - Date.now()) / 1000));
            setTimeLeft(diff);

            if (diff <= 0 && !expiredRef.current) {
                expiredRef.current = true;
                onExpire?.();
            }
        };

        tick();
        const timer = window.setInterval(tick, 1000);
        return () => window.clearInterval(timer);
    }, [targetTime, onExpire, disabled]);

    // 计算显示时间
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const isExpired = timeLeft <= 0;
    const isWarning = timeLeft > 0 && timeLeft <= warningThreshold;

    // 颜色状态
    const getColorClasses = () => {
        if (isExpired) {
            return 'bg-gray-100 text-gray-500 border-gray-200';
        }
        if (isWarning) {
            return 'bg-red-50 text-red-600 border-red-200 animate-pulse';
        }
        return 'bg-orange-50 text-orange-600 border-orange-200';
    };

    // Badge 样式
    if (variant === 'badge') {
        return (
            <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${getColorClasses()} ${className}`}
            >
                {showIcon && <Clock className="w-3.5 h-3.5" />}
                {isExpired ? '已过期' : `${pad2(minutes)}:${pad2(seconds)}`}
            </span>
        );
    }

    // Inline 样式
    if (variant === 'inline') {
        return (
            <span className={`inline-flex items-center gap-1 text-sm font-mono ${isExpired ? 'text-gray-400' : isWarning ? 'text-red-600' : 'text-orange-600'} ${className}`}>
                {showIcon && <Clock className="w-4 h-4" />}
                {isExpired ? '--:--' : `${pad2(minutes)}:${pad2(seconds)}`}
            </span>
        );
    }

    // Full 样式 (带提示)
    return (
        <div className={`rounded-xl border p-4 ${getColorClasses()} ${className}`}>
            <div className="flex items-center gap-3">
                {showIcon && (
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isExpired ? 'bg-gray-200' : isWarning ? 'bg-red-100' : 'bg-orange-100'}`}>
                        {isExpired || isWarning ? (
                            <AlertCircle className="w-5 h-5" />
                        ) : (
                            <Clock className="w-5 h-5" />
                        )}
                    </div>
                )}
                <div>
                    <div className="text-2xl font-bold font-mono">
                        {isExpired ? '00:00' : `${pad2(minutes)}:${pad2(seconds)}`}
                    </div>
                    <div className="text-xs mt-0.5">
                        {isExpired
                            ? '支付时间已过期'
                            : isWarning
                                ? '即将过期，请尽快支付'
                                : '剩余支付时间'}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Countdown;
