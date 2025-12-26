import React from 'react';
import { User, ShieldCheck, AlertCircle } from 'lucide-react';
import type { PassengerInfo } from '../types';

export interface PassengerCardProps {
  index: number;
  passenger: PassengerInfo;
  canUseSelfFill: boolean;
  isPrimarySelf: boolean;
  showErrors: boolean;
  nameError?: string;
  idCardError?: string;
  onTypeChange: (type: 'adult' | 'child') => void;
  onNameChange: (name: string) => void;
  onIdCardChange: (idCard: string) => void;
  onToggleSelf: (checked: boolean) => void;
}

export const PassengerCard: React.FC<PassengerCardProps> = ({
  index,
  passenger,
  canUseSelfFill,
  isPrimarySelf,
  showErrors,
  nameError,
  idCardError,
  onTypeChange,
  onNameChange,
  onIdCardChange,
  onToggleSelf,
}) => {
  const normalizeIdCard = (v: string) => v.replace(/\s+/g, '').toUpperCase();

  return (
    <div id={`passenger-card-${index}`} className="rounded-3xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      <div className="px-6 py-4 bg-gray-50/70 border-b border-gray-100 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-700 font-extrabold">
            {index + 1}
          </div>
          <div className="min-w-0">
            <div className="font-extrabold text-gray-900 truncate">乘机人 {index + 1}</div>
            <div className="mt-0.5 text-xs text-gray-500">{passenger.type === 'child' ? '儿童' : '成人'}</div>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <select
            value={passenger.type || 'adult'}
            onChange={(e) => onTypeChange(e.target.value === 'child' ? 'child' : 'adult')}
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 bg-white outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="adult">成人</option>
            <option value="child">儿童</option>
          </select>

          {index === 0 && (
            <label className={`flex items-center gap-2 text-sm font-bold ${canUseSelfFill ? 'text-gray-700' : 'text-gray-400'}`}>
              <input
                type="checkbox"
                checked={isPrimarySelf}
                disabled={!canUseSelfFill}
                onChange={(e) => onToggleSelf(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500 disabled:opacity-50"
              />
              我是乘机人
            </label>
          )}
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-500 uppercase ml-1">姓名</label>
          <div className="relative group">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-sky-500 w-5 h-5 transition-colors" />
            <input
              type="text"
              value={passenger.name}
              onChange={(e) => onNameChange(e.target.value)}
              className={`w-full pl-12 pr-4 py-3.5 border rounded-2xl outline-none transition-all bg-gray-50 focus:bg-white focus:ring-4 ${
                showErrors && nameError ? 'border-red-300 focus:ring-red-100' : 'border-gray-200 focus:ring-sky-50 focus:border-sky-400'
              }`}
              placeholder="请输入姓名"
            />
          </div>
          {showErrors && nameError && (
            <p className="text-xs text-red-500 ml-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {nameError}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-500 uppercase ml-1">身份证号</label>
          <div className="relative group">
            <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-sky-500 w-5 h-5 transition-colors" />
            <input
              type="text"
              value={passenger.idCard}
              onChange={(e) => onIdCardChange(normalizeIdCard(e.target.value))}
              className={`w-full pl-12 pr-4 py-3.5 border rounded-2xl outline-none transition-all bg-gray-50 focus:bg-white focus:ring-4 ${
                showErrors && idCardError ? 'border-red-300 focus:ring-red-100' : 'border-gray-200 focus:ring-sky-50 focus:border-sky-400'
              }`}
              placeholder="18 位身份证号"
            />
          </div>
          {showErrors && idCardError && (
            <p className="text-xs text-red-500 ml-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {idCardError}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
