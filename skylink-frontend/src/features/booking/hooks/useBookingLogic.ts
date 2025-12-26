import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Flight } from '../../flight/types';
import type { BookingDetails, PassengerInfo } from '../types';
import { usePassengerValidation } from './usePassengerValidation';
import { isUserVerified } from '@/shared/utils/userVerification';

const BOOKING_DRAFT_KEY = 'skylink_booking_form_draft';

export const createPassengers = (count: number): PassengerInfo[] => {
  const safeCount = Number.isFinite(count) && count > 0 ? Math.floor(count) : 1;
  return Array.from({ length: safeCount }, () => ({ name: '', idCard: '', type: 'adult' as const }));
};

export interface BookingLogicState {
  step: 1 | 2;
  passengers: PassengerInfo[];
  primaryIsSelf: boolean;
  contactSameAsAccount: boolean;
  contact: { phone: string; email: string };
  addons: { insurance: boolean; fastTicket: boolean };
  paymentMethod: 'alipay' | 'wechat' | 'credit_card';
  loading: boolean;
  attemptedNext: boolean;
}

export interface BookingLogicActions {
  setStep: (step: 1 | 2) => void;
  setPassengers: (passengers: PassengerInfo[]) => void;
  updatePassenger: (index: number, patch: Partial<PassengerInfo>) => void;
  setPrimaryIsSelf: (checked: boolean) => void;
  setContactSameAsAccount: (checked: boolean) => void;
  setContact: (contact: { phone: string; email: string }) => void;
  setAddons: (addons: { insurance: boolean; fastTicket: boolean }) => void;
  setPaymentMethod: (method: 'alipay' | 'wechat' | 'credit_card') => void;
  setLoading: (loading: boolean) => void;
  setAttemptedNext: (attempted: boolean) => void;
  handleToggleSelf: (checked: boolean, user?: { realName?: string; idCard?: string }) => void;
  handleNextStep: () => void;
  handleFinalSubmit: (onConfirm: (details: BookingDetails) => void | Promise<void>) => void;
  saveDraft: (location: { pathname: string; search: string }) => void;
}

export const useBookingLogic = (
  flights: Flight[],
  passengerCount: number,
  cabinClass: 'economy' | 'business' | 'first',
  user?: { phoneNumber?: string; email?: string; realName?: string; idCard?: string }
) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [passengers, setPassengers] = useState<PassengerInfo[]>(() => createPassengers(passengerCount));
  const [primaryIsSelf, setPrimaryIsSelf] = useState(false);
  const [contactSameAsAccount, setContactSameAsAccount] = useState(true);
  const [contact, setContact] = useState<{ phone: string; email: string }>({
    phone: user?.phoneNumber || '',
    email: user?.email || '',
  });
  const [addons, setAddons] = useState<{ insurance: boolean; fastTicket: boolean }>({
    insurance: false,
    fastTicket: false,
  });
  const [paymentMethod, setPaymentMethod] = useState<'alipay' | 'wechat' | 'credit_card'>('alipay');
  const [loading, setLoading] = useState(false);
  const [attemptedNext, setAttemptedNext] = useState(false);

  const flightKey = useMemo(() => flights.map((f) => String(f.id || '')).join('|'), [flights]);

  useEffect(() => {
    setPassengers(createPassengers(passengerCount));
    setPrimaryIsSelf(false);
    setAttemptedNext(false);
  }, [passengerCount]);

  useEffect(() => {
    const raw = sessionStorage.getItem(BOOKING_DRAFT_KEY);
    if (!raw) return;
    try {
      const draft = JSON.parse(raw) as any;
      if (!draft || typeof draft !== 'object') return;
      if (draft.flightKey !== flightKey) {
        sessionStorage.removeItem(BOOKING_DRAFT_KEY);
        return;
      }
      if (Number(draft.passengerCount) !== Number(passengerCount)) {
        sessionStorage.removeItem(BOOKING_DRAFT_KEY);
        return;
      }
      if (draft.cabinClass !== cabinClass) {
        sessionStorage.removeItem(BOOKING_DRAFT_KEY);
        return;
      }

      const base = createPassengers(passengerCount);
      const list = Array.isArray(draft.passengers) ? draft.passengers : [];
      const nextPassengers = base.map((p, idx) => {
        const src = list[idx] as any;
        if (!src || typeof src !== 'object') return p;
        const name = String(src.name ?? '');
        const idCard = String(src.idCard ?? '');
        const type: 'adult' | 'child' = src.type === 'child' ? 'child' : 'adult';
        return { ...p, name, idCard, type };
      });

      setStep(draft.step === 2 ? 2 : 1);
      setAttemptedNext(false);
      setPassengers(nextPassengers);
      setPrimaryIsSelf(!!draft.primaryIsSelf);
      setAddons({
        insurance: !!draft.addons?.insurance,
        fastTicket: !!draft.addons?.fastTicket,
      });

      const sameAsAccount = draft.contactSameAsAccount !== false;
      setContactSameAsAccount(sameAsAccount);
      if (!sameAsAccount) {
        const phone = String(draft.contact?.phone ?? '');
        const email = String(draft.contact?.email ?? '');
        setContact({ phone, email });
      }
    } catch {
    } finally {
      sessionStorage.removeItem(BOOKING_DRAFT_KEY);
    }
  }, [cabinClass, flightKey, passengerCount]);

  useEffect(() => {
    if (!contactSameAsAccount) return;
    setContact({
      phone: user?.phoneNumber || '',
      email: user?.email || '',
    });
  }, [contactSameAsAccount, user?.email, user?.phoneNumber]);

  const pricing = useMemo(() => {
    const ticketPerPassenger = flights.reduce((sum, f) => sum + f.price, 0);
    const ticketAmount = ticketPerPassenger * passengerCount;
    const taxAmount = flights.length * 120 * passengerCount;
    const insuranceAmount = addons.insurance ? 30 * passengerCount : 0;
    const fastTicketAmount = addons.fastTicket ? 20 * passengerCount : 0;
    const totalAmount = ticketAmount + taxAmount + insuranceAmount + fastTicketAmount;
    return { ticketPerPassenger, ticketAmount, taxAmount, insuranceAmount, fastTicketAmount, totalAmount };
  }, [addons.fastTicket, addons.insurance, flights, passengerCount]);

  const passengerValidation = usePassengerValidation(passengers);

  // 使用统一的严格校验标准判断用户是否可以一键填充
  const canUseSelfFill = isUserVerified(user);

  const updatePassenger = useCallback((index: number, patch: Partial<PassengerInfo>) => {
    setPassengers((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  }, []);

  const handleToggleSelf = useCallback((checked: boolean) => {
    setPrimaryIsSelf(checked);
    if (!checked) return;
    if (!canUseSelfFill) return;
    updatePassenger(0, { name: user?.realName || '', idCard: user?.idCard || '', type: 'adult' });
  }, [canUseSelfFill, updatePassenger, user?.idCard, user?.realName]);

  const handleNextStep = useCallback(() => {
    setAttemptedNext(true);
    if (!canUseSelfFill) {
      return { shouldPromptVerify: true };
    }
    if (!passengerValidation.isValid) {
      const firstPassengerErrorIndex = Object.keys(passengerValidation.errors).findIndex((key) => key.startsWith('passenger_'));
      window.setTimeout(() => {
        if (firstPassengerErrorIndex >= 0) {
          document.getElementById(`passenger-card-${firstPassengerErrorIndex}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }
        if (passengerValidation.errors.phone || passengerValidation.errors.email) {
          document.getElementById('contact-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 0);
      return { shouldPromptVerify: false, hasErrors: true };
    }
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return { shouldPromptVerify: false, hasErrors: false };
  }, [canUseSelfFill, passengerValidation]);

  const handleFinalSubmit = useCallback((onConfirm: (details: BookingDetails) => void | Promise<void>) => {
    if (!canUseSelfFill) {
      return { shouldPromptVerify: true };
    }
    setLoading(true);
    const details: BookingDetails = {
      passengerName: passengers[0]?.name || '',
      passportNumber: passengers[0]?.idCard || '',
      passengers: passengers.map((p) => ({ name: p.name, idCard: p.idCard, type: p.type })),
      contactEmail: contact.email.trim(),
      phone: contact.phone.trim(),
      cabinClass,
      addons,
      totalAmount: pricing.totalAmount,
    };
    window.setTimeout(() => {
      Promise.resolve(onConfirm(details)).finally(() => setLoading(false));
    }, 1200);
    return { shouldPromptVerify: false };
  }, [canUseSelfFill, passengers, contact, cabinClass, addons, pricing.totalAmount]);

  const saveDraft = useCallback((location: { pathname: string; search: string }) => {
    try {
      sessionStorage.setItem(
        BOOKING_DRAFT_KEY,
        JSON.stringify({
          flightKey,
          passengerCount,
          cabinClass,
          step,
          passengers,
          primaryIsSelf,
          contactSameAsAccount,
          contact,
          addons,
          from: `${location.pathname}${location.search}`,
          savedAt: Date.now(),
        })
      );
    } catch {
    }
  }, [flightKey, passengerCount, cabinClass, step, passengers, primaryIsSelf, contactSameAsAccount, contact, addons]);

  return {
    state: { step, passengers, primaryIsSelf, contactSameAsAccount, contact, addons, paymentMethod, loading, attemptedNext },
    actions: {
      setStep,
      setPassengers,
      updatePassenger,
      setPrimaryIsSelf,
      setContactSameAsAccount,
      setContact,
      setAddons,
      setPaymentMethod,
      setLoading,
      setAttemptedNext,
      handleToggleSelf,
      handleNextStep,
      handleFinalSubmit,
      saveDraft,
    },
    pricing,
    validation: passengerValidation,
    canUseSelfFill,
  };
};
