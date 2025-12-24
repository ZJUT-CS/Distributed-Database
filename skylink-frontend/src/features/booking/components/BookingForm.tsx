import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { Flight } from '../../flight/types';
import type { BookingDetails } from '../types';
import { useAuth } from '../../auth/hooks/useAuth';
import { useBookingLogic } from '../hooks/useBookingLogic';
import { normalizeIdCard, normalizeName } from '../hooks/usePassengerValidation';
import { PassengerCard } from './PassengerCard';
import { CreditCard, Plane, Clock, Mail, Phone, ChevronRight, CheckCircle2, QrCode, Smartphone, Wallet, ArrowLeft, AlertCircle, Lock, BadgeCheck, ShieldCheck, User } from 'lucide-react';

interface BookingFormProps {
  flights: Flight[];
  passengerCount: number;
  cabinClass: 'economy' | 'business' | 'first';
  onConfirm: (details: BookingDetails) => void | Promise<void>;
  onCancel: () => void;
}

type PaymentMethod = 'alipay' | 'wechat' | 'credit_card';

const cabinMeta = (c: 'economy' | 'business' | 'first') => {
  if (c === 'first') return { name: '头等舱', code: 'F', benefits: ['免费退改', '40KG行李', '贵宾休息室'] };
  if (c === 'business') return { name: '商务舱', code: 'J', benefits: ['优先值机', '30KG行李', '快速安检'] };
  return { name: '经济舱', code: 'Y', benefits: ['可退改', '20KG行李', '含餐食'] };
};

const BookingForm: React.FC<BookingFormProps> = ({ flights, passengerCount, cabinClass, onConfirm, onCancel }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    state,
    actions,
    pricing,
    validation,
    canUseSelfFill,
  } = useBookingLogic(flights, passengerCount, cabinClass, user || undefined);

  const promptVerifyAccount = () => {
    const ok = window.confirm('购票前请先完成实名认证，是否前往个人中心认证？');
    if (!ok) return;
    actions.saveDraft(location);
    navigate({ pathname: '/user-center', search: '?tab=profile' });
  };

  const handleNextStep = () => {
    const result = actions.handleNextStep();
    if (result?.shouldPromptVerify) {
      promptVerifyAccount();
    }
  };

  const handleFinalSubmit = () => {
    const result = actions.handleFinalSubmit(onConfirm);
    if (result?.shouldPromptVerify) {
      promptVerifyAccount();
    }
  };

  const StepIndicator = () => (
    <div className="flex items-center justify-center mb-8 px-4 relative">
      <div className="flex items-center w-full max-w-lg">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all z-10 ${state.step >= 1 ? 'bg-sky-600 text-white shadow-lg shadow-sky-500/30' : 'bg-gray-200 text-gray-500'}`}>1</div>
        <div className="flex-1 h-1 mx-2 relative bg-gray-200 rounded-full overflow-hidden">
          <div className={`absolute top-0 left-0 h-full bg-sky-600 transition-all duration-500 ease-in-out ${state.step === 2 ? 'w-full' : 'w-0'}`} />
        </div>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all z-10 ${state.step >= 2 ? 'bg-sky-600 text-white shadow-lg shadow-sky-500/30' : 'bg-gray-200 text-gray-500'}`}>2</div>
      </div>
      <div className="absolute flex w-full max-w-lg justify-between mt-14 text-xs font-bold text-gray-500 uppercase tracking-wide">
        <span className={state.step >= 1 ? 'text-sky-600' : ''}>填写信息</span>
        <span className={state.step >= 2 ? 'text-sky-600' : ''}>支付订单</span>
      </div>
    </div>
  );

  const SummaryCard = () => {
    const meta = cabinMeta(cabinClass);
    return (
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm sticky top-24 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/60">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-gray-900 text-sm uppercase tracking-wider flex items-center gap-2">
              <Plane className="w-4 h-4 text-gray-400" /> 行程清单
            </h3>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl bg-white border border-gray-200 text-xs font-extrabold text-gray-700">
                {meta.name} ({meta.code})
              </span>
              <span className="inline-flex items-center px-3 py-2 rounded-2xl bg-sky-600 text-white text-xs font-extrabold shadow-lg shadow-sky-500/25">
                ×{passengerCount}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
            {flights.map((flight, idx) => (
              <div key={idx} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-sky-500" />
                <div className="flex justify-between items-start mb-2 pl-2">
                  <span className="text-[10px] font-extrabold text-sky-700 bg-sky-50 px-2 py-0.5 rounded uppercase">
                    Flight {idx + 1}
                  </span>
                  <span className="font-extrabold text-gray-900">¥{flight.price.toLocaleString()}</span>
                </div>
                <div className="pl-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-extrabold text-gray-900">{flight.origin}</span>
                    <ArrowLeft className="w-3 h-3 text-gray-300 rotate-180" />
                    <span className="text-sm font-extrabold text-gray-900">{flight.destination}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {new Date(flight.departureTime).toLocaleDateString('zh-CN')}
                    </span>
                    <span>{flight.duration}</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    {flight.airline} • {flight.flightNumber}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {meta.benefits.map((b) => (
              <span key={b} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-white border border-sky-100 text-sky-700">
                <BadgeCheck className="w-3.5 h-3.5" />
                {b}
              </span>
            ))}
          </div>

          <div className="pt-4 border-t border-gray-100 mt-4 space-y-2">
            <div className="text-xs font-bold text-gray-500 mb-1">费用明细</div>
            <div className="flex justify-between items-center text-sm text-gray-700">
              <span>机票 (×{passengerCount})</span>
              <span className="font-extrabold">¥{pricing.ticketAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-sm text-gray-700">
              <span>机建燃油 (×{passengerCount})</span>
              <span className="font-extrabold">¥{pricing.taxAmount.toLocaleString()}</span>
            </div>
            {state.addons.insurance && (
              <div className="flex justify-between items-center text-sm text-gray-700">
                <span>航空意外险</span>
                <span className="font-extrabold">¥{pricing.insuranceAmount.toLocaleString()}</span>
              </div>
            )}
            {state.addons.fastTicket && (
              <div className="flex justify-between items-center text-sm text-gray-700">
                <span>极速出票</span>
                <span className="font-extrabold">¥{pricing.fastTicketAmount.toLocaleString()}</span>
              </div>
            )}
            <div className="h-px bg-gray-100 my-2" />
            <div className="flex justify-between items-center">
              <span className="text-gray-900 font-extrabold">应付总额</span>
              <span className="text-2xl font-extrabold text-orange-600">¥{pricing.totalAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const showErrors = state.attemptedNext;

  return (
    <div className="w-full">
      <StepIndicator />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6">
        <div className="lg:col-span-8 space-y-6">
          {state.step === 1 ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-left-8 duration-500">
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-sky-600 p-2 rounded-xl text-white shadow-lg shadow-sky-500/20">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-extrabold text-gray-900">乘机人</h2>
                      <p className="text-xs text-gray-500">共 {passengerCount} 人，信息需与证件一致</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 bg-gray-50 border border-gray-200 px-3 py-2 rounded-2xl">
                    <Lock className="w-4 h-4 text-gray-400" />
                    人数已锁定，需修改请返回搜索页
                  </div>
                </div>

                <div className="p-8 space-y-5">
                  {state.passengers.map((p, idx) => (
                    <PassengerCard
                      key={idx}
                      index={idx}
                      passenger={p}
                      canUseSelfFill={canUseSelfFill}
                      isPrimarySelf={state.primaryIsSelf}
                      showErrors={showErrors}
                      nameError={validation.errors[`passenger_${idx}_name`]}
                      idCardError={validation.errors[`passenger_${idx}_idCard`]}
                      onTypeChange={(type) => actions.updatePassenger(idx, { type })}
                      onNameChange={(name) => actions.updatePassenger(idx, { name })}
                      onIdCardChange={(idCard) => actions.updatePassenger(idx, { idCard })}
                      onToggleSelf={(checked) => actions.handleToggleSelf(checked)}
                    />
                  ))}

                  {!canUseSelfFill && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 mt-0.5" />
                      <div className="min-w-0">
                        <div className="font-bold">未检测到实名认证信息</div>
                        <div className="text-xs text-amber-700 mt-1">完成实名认证后，可在乘机人 1 使用“一键填充”。</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div id="contact-section" className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex items-center gap-3">
                  <div className="bg-sky-600 p-2 rounded-xl text-white shadow-lg shadow-sky-500/20">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-gray-900">联系人</h2>
                    <p className="text-xs text-gray-500">用于接收出票短信与航班动态</p>
                  </div>
                </div>

                <div className="p-8 space-y-5">
                  <label className={`flex items-center gap-2 text-sm font-bold ${user ? 'text-gray-700' : 'text-gray-400'}`}>
                    <input
                      type="checkbox"
                      checked={state.contactSameAsAccount}
                      disabled={!user}
                      onChange={(e) => actions.setContactSameAsAccount(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500 disabled:opacity-50"
                    />
                    与账号联系方式一致
                  </label>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase ml-1">手机号（必填）</label>
                      <div className="relative group">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-sky-500 w-5 h-5 transition-colors" />
                        <input
                          type="text"
                          value={state.contact.phone}
                          onChange={(e) => actions.setContact({ ...state.contact, phone: e.target.value })}
                          className={`w-full pl-12 pr-4 py-3.5 border rounded-2xl outline-none transition-all bg-gray-50 focus:bg-white focus:ring-4 ${showErrors && validation.errors.contact_phone ? 'border-red-300 focus:ring-red-100' : 'border-gray-200 focus:ring-sky-50 focus:border-sky-400'}`}
                          placeholder="11 位手机号"
                        />
                      </div>
                      {showErrors && validation.errors.contact_phone && (
                        <p className="text-xs text-red-500 ml-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {validation.errors.contact_phone}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase ml-1">电子邮箱（选填）</label>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-sky-500 w-5 h-5 transition-colors" />
                        <input
                          type="email"
                          value={state.contact.email}
                          onChange={(e) => actions.setContact({ ...state.contact, email: e.target.value })}
                          className={`w-full pl-12 pr-4 py-3.5 border rounded-2xl outline-none transition-all bg-gray-50 focus:bg-white focus:ring-4 ${showErrors && validation.errors.contact_email ? 'border-red-300 focus:ring-red-100' : 'border-gray-200 focus:ring-sky-50 focus:border-sky-400'}`}
                          placeholder="用于接收电子行程单"
                        />
                      </div>
                      {showErrors && validation.errors.contact_email && (
                        <p className="text-xs text-red-500 ml-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {validation.errors.contact_email}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex items-center gap-3">
                  <div className="bg-sky-600 p-2 rounded-xl text-white shadow-lg shadow-sky-500/20">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-gray-900">增值服务</h2>
                    <p className="text-xs text-gray-500">按乘机人数计费，可随时取消勾选</p>
                  </div>
                </div>

                <div className="p-8 space-y-4">
                  <label className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-gray-100 hover:border-sky-100 hover:bg-sky-50/30 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={state.addons.insurance}
                        onChange={(e) => actions.setAddons({ ...state.addons, insurance: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                      />
                      <div>
                        <div className="font-extrabold text-gray-900">航空意外险</div>
                        <div className="text-xs text-gray-500 mt-0.5">保障更安心，建议购买</div>
                      </div>
                    </div>
                    <div className="text-sm font-extrabold text-gray-900">
                      ¥30/份 × {passengerCount}
                    </div>
                  </label>

                  <label className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-gray-100 hover:border-sky-100 hover:bg-sky-50/30 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={state.addons.fastTicket}
                        onChange={(e) => actions.setAddons({ ...state.addons, fastTicket: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                      />
                      <div>
                        <div className="font-extrabold text-gray-900">极速出票</div>
                        <div className="text-xs text-gray-500 mt-0.5">优先处理出票，节省等待</div>
                      </div>
                    </div>
                    <div className="text-sm font-extrabold text-gray-900">
                      ¥20/份 × {passengerCount}
                    </div>
                  </label>
                </div>

                <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                  <button
                    onClick={onCancel}
                    className="text-gray-600 font-extrabold text-sm hover:text-gray-900 px-4 py-2 rounded-xl hover:bg-gray-200/50 transition-colors"
                  >
                    返回修改人数
                  </button>
                  <button
                    onClick={handleNextStep}
                    aria-disabled={validation.hasErrors}
                    className={`text-white px-8 py-3.5 rounded-2xl font-extrabold shadow-xl flex items-center gap-2 transition-all transform hover:-translate-y-1 active:scale-95 ${
                      validation.hasErrors
                        ? 'bg-gray-300 shadow-none hover:-translate-y-0 cursor-pointer'
                        : 'bg-sky-600 hover:bg-sky-700 shadow-sky-500/30'
                    }`}
                  >
                    下一步：支付订单 <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-4 min-w-0">
                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 border border-emerald-100 shrink-0">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-extrabold text-gray-900">信息复核</h3>
                      <div className="mt-1 text-sm text-gray-600">
                        乘机人：{normalizeName(state.passengers[0]?.name || '-')}
                        {state.passengers.length > 1 ? ` 等 ${state.passengers.length} 人` : ''}
                      </div>
                      <div className="mt-0.5 text-xs text-gray-500">手机号：{state.contact.phone.trim() || '-'}</div>
                      <div className="mt-0.5 text-xs text-gray-500">邮箱：{state.contact.email.trim() || '-'}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      actions.setStep(1);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="text-sky-700 text-xs font-extrabold hover:underline px-3 py-2 bg-sky-50 rounded-xl hover:bg-sky-100 transition-colors shrink-0"
                  >
                    返回修改
                  </button>
                </div>

                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {state.passengers.map((p, idx) => (
                    <div key={idx} className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
                      <div className="flex items-center justify-between">
                        <div className="font-extrabold text-gray-900 truncate">{normalizeName(p.name) || `乘机人 ${idx + 1}`}</div>
                        <div className="text-xs font-bold text-gray-500">{p.type === 'child' ? '儿童' : '成人'}</div>
                      </div>
                      <div className="mt-1 text-xs text-gray-500 font-mono break-all">
                        {normalizeIdCard(p.idCard) ? `身份证：${normalizeIdCard(p.idCard).slice(0, 6)}********${normalizeIdCard(p.idCard).slice(-4)}` : '身份证：-'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex items-center gap-3">
                  <div className="bg-orange-500 p-2 rounded-xl text-white shadow-lg shadow-orange-500/20">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-gray-900">选择支付方式</h2>
                    <p className="text-xs text-gray-500">支付安全由平台保障</p>
                  </div>
                </div>

                <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => actions.setPaymentMethod('alipay')}
                    className={`relative p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 group ${state.paymentMethod === 'alipay' ? 'border-sky-500 bg-sky-50/50' : 'border-gray-100 hover:border-sky-200 hover:bg-gray-50'}`}
                  >
                    {state.paymentMethod === 'alipay' && <div className="absolute top-3 right-3 text-sky-500"><CheckCircle2 className="w-5 h-5" /></div>}
                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center p-2">
                      <QrCode className="w-8 h-8 text-sky-500" />
                    </div>
                    <span className={`font-extrabold ${state.paymentMethod === 'alipay' ? 'text-sky-700' : 'text-gray-600'}`}>支付宝</span>
                  </button>

                  <button
                    onClick={() => actions.setPaymentMethod('wechat')}
                    className={`relative p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 group ${state.paymentMethod === 'wechat' ? 'border-emerald-500 bg-emerald-50/50' : 'border-gray-100 hover:border-emerald-200 hover:bg-gray-50'}`}
                  >
                    {state.paymentMethod === 'wechat' && <div className="absolute top-3 right-3 text-emerald-500"><CheckCircle2 className="w-5 h-5" /></div>}
                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center p-2">
                      <Smartphone className="w-8 h-8 text-emerald-600" />
                    </div>
                    <span className={`font-extrabold ${state.paymentMethod === 'wechat' ? 'text-emerald-700' : 'text-gray-600'}`}>微信支付</span>
                  </button>

                  <button
                    onClick={() => actions.setPaymentMethod('credit_card')}
                    className={`relative p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 group ${state.paymentMethod === 'credit_card' ? 'border-purple-500 bg-purple-50/50' : 'border-gray-100 hover:border-purple-200 hover:bg-gray-50'}`}
                  >
                    {state.paymentMethod === 'credit_card' && <div className="absolute top-3 right-3 text-purple-500"><CheckCircle2 className="w-5 h-5" /></div>}
                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center p-2">
                      <CreditCard className="w-8 h-8 text-purple-600" />
                    </div>
                    <span className={`font-extrabold ${state.paymentMethod === 'credit_card' ? 'text-purple-700' : 'text-gray-600'}`}>信用卡/银联</span>
                  </button>
                </div>

                <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                  <button
                    onClick={() => {
                      actions.setStep(1);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="text-gray-600 font-extrabold text-sm hover:text-gray-900 px-4 py-2 rounded-xl hover:bg-gray-200/50 transition-colors flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" /> 返回上一步
                  </button>
                  <button
                    onClick={handleFinalSubmit}
                    disabled={state.loading}
                    className="bg-sky-600 hover:bg-sky-700 text-white px-8 py-3.5 rounded-2xl font-extrabold shadow-xl shadow-sky-500/30 flex items-center gap-2 transition-all transform hover:-translate-y-1 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed min-w-[220px] justify-center"
                  >
                    {state.loading ? (
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        确认支付 <span className="text-sky-200 font-normal">|</span> ¥{pricing.totalAmount.toLocaleString()}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-4">
          <SummaryCard />
        </div>
      </div>
    </div>
  );
};

export default BookingForm;
