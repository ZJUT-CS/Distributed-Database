/**
 * 通用 CSV 导出工具
 * @description 将数据数组导出为 CSV 格式并下载
 */

import { logger } from '@/lib/logger';

export interface ExportColumn<T = Record<string, unknown>> {
    /** 数据字段 key */
    key: string;
    /** CSV 表头标签 */
    label: string;
    /** 格式化函数 (可选) */
    formatter?: (item: T) => string | number;
}

/**
 * 将数据导出为 CSV 文件并触发下载
 * @param data 数据数组
 * @param filename 文件名 (不含扩展名)
 * @param columns 列配置
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function exportToCSV<T extends Record<string, any>>(
    data: T[],
    filename: string,
    columns: ExportColumn<T>[]
): void {
    if (!data.length) {
        logger.warn('exportToCSV: 数据为空，无法导出');
        return;
    }

    // 构建表头
    const headers = columns.map((col) => escapeCSVField(col.label));

    // 构建数据行
    const rows = data.map((item) =>
        columns.map((col) => {
            let value: unknown;
            if (col.formatter) {
                value = col.formatter(item);
            } else {
                value = getNestedValue(item, String(col.key));
            }
            return escapeCSVField(formatValue(value));
        })
    );

    // 组装 CSV 内容
    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\r\n');

    // 添加 UTF-8 BOM 以支持 Excel 正确显示中文
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

    // 触发下载
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${formatDateForFilename(new Date())}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * 转义 CSV 字段中的特殊字符
 */
function escapeCSVField(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
        return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
}

/**
 * 格式化值为字符串
 */
function formatValue(value: unknown): string {
    if (value === null || value === undefined) {
        return '';
    }
    if (typeof value === 'object') {
        return JSON.stringify(value);
    }
    return String(value);
}

/**
 * 获取嵌套对象的值
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce((acc: unknown, key) => {
        if (acc && typeof acc === 'object' && key in (acc as Record<string, unknown>)) {
            return (acc as Record<string, unknown>)[key];
        }
        return undefined;
    }, obj);
}

/**
 * 生成文件名中使用的日期字符串
 */
function formatDateForFilename(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${y}${m}${d}_${h}${min}`;
}
