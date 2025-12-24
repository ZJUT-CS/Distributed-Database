import React from 'react';

const CITY_GROUPS = {
  domestic: ['北京', '上海', '广州', '深圳', '成都', '杭州', '西安', '重庆', '香港'],
  international: ['东京', '新加坡', '曼谷', '伦敦', '纽约', '悉尼'],
};

export interface CityPickerProps {
  isOpen: boolean;
  cityTab: 'domestic' | 'international';
  onTabChange: (tab: 'domestic' | 'international') => void;
  onCitySelect: (city: string) => void;
}

export const CityPicker: React.FC<CityPickerProps> = ({ isOpen, cityTab, onTabChange, onCitySelect }) => {
  if (!isOpen) return null;

  return (
    <div
      className="absolute top-full z-50 bg-white rounded-3xl shadow-2xl border border-gray-100 p-6 w-[400px] animate-in fade-in zoom-in-95 duration-200 mt-2 left-0"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-2">
        <button
          type="button"
          onClick={() => onTabChange('domestic')}
          className={`pb-2 px-2 text-sm font-bold transition-colors border-b-2 ${
            cityTab === 'domestic' ? 'text-blue-600 border-blue-600' : 'text-gray-500 border-transparent hover:text-gray-700'
          }`}
        >
          热门国内
        </button>
        <button
          type="button"
          onClick={() => onTabChange('international')}
          className={`pb-2 px-2 text-sm font-bold transition-colors border-b-2 ${
            cityTab === 'international' ? 'text-blue-600 border-blue-600' : 'text-gray-500 border-transparent hover:text-gray-700'
          }`}
        >
          热门国际
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {CITY_GROUPS[cityTab].map((city) => (
          <button
            key={city}
            type="button"
            onClick={() => onCitySelect(city)}
            className="py-2 px-1 rounded-lg text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors text-center truncate"
          >
            {city}
          </button>
        ))}
      </div>
    </div>
  );
};
