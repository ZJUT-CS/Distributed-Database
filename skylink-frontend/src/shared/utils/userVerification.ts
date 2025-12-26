/**
 * 统一的用户实名认证校验工具
 * 用于确保个人中心和下单页使用相同的校验标准
 */

import { isIdCardValid, normalizeName, normalizeIdCard } from './validation';

export { isIdCardValid, normalizeName, normalizeIdCard };

/**
 * 判断用户是否已完成实名认证
 * 标准：真实姓名非空 + 身份证号符合18位格式
 */
export const isUserVerified = (user: { realName?: string | null; idCard?: string | null } | null | undefined): boolean => {
    if (!user) return false;
    const realName = user.realName?.trim();
    const idCard = user.idCard?.trim();

    // 必须有真实姓名且身份证号格式正确
    return !!(realName && realName.length >= 2 && idCard && isIdCardValid(idCard));
};

/**
 * 获取用户认证状态描述
 */
export const getUserVerificationStatus = (user: { realName?: string | null; idCard?: string | null } | null | undefined): {
    verified: boolean;
    reason: string;
} => {
    if (!user) return { verified: false, reason: '用户未登录' };

    const realName = user.realName?.trim();
    const idCard = user.idCard?.trim();

    if (!realName || realName.length < 2) {
        return { verified: false, reason: '缺少真实姓名' };
    }

    if (!idCard) {
        return { verified: false, reason: '缺少身份证号' };
    }

    if (!isIdCardValid(idCard)) {
        return { verified: false, reason: '身份证号格式无效' };
    }

    return { verified: true, reason: '已完成实名认证' };
};
