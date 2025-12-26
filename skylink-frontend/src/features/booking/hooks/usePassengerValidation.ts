import { useMemo } from 'react';
import type { PassengerInfo } from '../types';

export interface PassengerValidationResult {
  isValid: boolean;
  hasErrors: boolean;
  errors: Record<string, string>;
  isIdCardValid: (v: string) => boolean;
}

export const normalizeIdCard = (v: string) => v.replace(/\s+/g, '').toUpperCase();
export const normalizeName = (v: string) => v.replace(/\s+/g, ' ').trim();

export const isIdCardValid = (v: string) => /^\d{17}[\dX]$/.test(normalizeIdCard(v));
export const isPhoneValid = (v: string) => /^1[3-9]\d{9}$/.test(v.trim());
export const isEmailValid = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

export const usePassengerValidation = (passengers: PassengerInfo[]) => {
  const validationResult = useMemo(() => {
    const errors: Record<string, string> = {};
    let isValid = true;

    passengers.forEach((p, index) => {
      const prefix = `passenger_${index}`;

      if (!p.name || p.name.trim() === '') {
        errors[`${prefix}_name`] = '请输入姓名';
        isValid = false;
      } else if (p.name.trim().length < 2) {
        errors[`${prefix}_name`] = '姓名至少2个字符';
        isValid = false;
      }

      if (!p.idCard || p.idCard.trim() === '') {
        errors[`${prefix}_idCard`] = '请输入身份证号';
        isValid = false;
      } else if (!isIdCardValid(p.idCard)) {
        errors[`${prefix}_idCard`] = '身份证号格式不正确';
        isValid = false;
      }
    });

    return { isValid, hasErrors: !isValid, errors, isIdCardValid };
  }, [passengers]);

  return validationResult;
};

export const useContactValidation = (contact: { phone: string; email: string }) => {
  const validationResult = useMemo(() => {
    const errors: Record<string, string> = {};
    let isValid = true;

    if (!contact.phone || contact.phone.trim() === '') {
      errors.phone = '请输入手机号';
      isValid = false;
    } else if (!isPhoneValid(contact.phone)) {
      errors.phone = '手机号格式不正确';
      isValid = false;
    }

    if (!contact.email || contact.email.trim() === '') {
      errors.email = '请输入邮箱';
      isValid = false;
    } else if (!isEmailValid(contact.email)) {
      errors.email = '邮箱格式不正确';
      isValid = false;
    }

    return { isValid, errors };
  }, [contact]);

  return validationResult;
};
