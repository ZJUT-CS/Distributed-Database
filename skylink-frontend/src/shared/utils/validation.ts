/**
 * 通用验证工具函数
 */

// 规范化身份证号（去空格转大写）
export const normalizeIdCard = (v: string): string => v.replace(/\s+/g, '').toUpperCase();

// 规范化姓名（去除多余空格）
export const normalizeName = (v: string): string => v.replace(/\s+/g, ' ').trim();

// 验证身份证号格式（18位）
export const isIdCardValid = (v: string): boolean => /^\d{17}[\dX]$/.test(normalizeIdCard(v));

// 验证手机号格式
export const isPhoneValid = (v: string): boolean => /^1[3-9]\d{9}$/.test(v.trim());

// 验证邮箱格式
export const isEmailValid = (v: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
