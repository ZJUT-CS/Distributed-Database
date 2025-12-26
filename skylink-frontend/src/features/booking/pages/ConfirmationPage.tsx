import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { type ConfirmedBooking } from '@/features/booking';
import { CheckCircle, Sparkles, Map as MapIcon } from 'lucide-react';
import { getDestinationGuide } from '@/features/ai';
import { POPULAR_AIRPORTS } from '@/config/data/airports';

const ConfirmationPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const booking = location.state?.booking as ConfirmedBooking;

  const [aiGuide, setAiGuide] = useState<string>('');
  const [loadingGuide, setLoadingGuide] = useState(false);

  useEffect(() => {
    if (booking && booking.flights && booking.flights.length > 0) {
      const fetchGuide = async () => {
        setLoadingGuide(true);
        const finalDestCode = booking.flights![booking.flights!.length - 1].destination;
        const destName = POPULAR_AIRPORTS.find(a => a.code === finalDestCode)?.city || finalDestCode;
        const guide = await getDestinationGuide(destName);
        setAiGuide(guide);
        setLoadingGuide(false);
      };
      fetchGuide();
    }
  }, [booking]);

  if (!booking) {
    navigate('/');
    return null;
  }

  return (
    <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 pt-10 transition-colors duration-500">
      <div className="mt-10 max-w-3xl mx-auto animate-fade-in-up">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-green-100 dark:border-slate-800">
          <div className="bg-green-50 dark:bg-emerald-900/20 p-8 text-center border-b border-green-100 dark:border-slate-800">
            <div className="bg-green-100 dark:bg-emerald-900/40 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-3xl font-bold text-green-800 dark:text-emerald-100 mb-2">预订成功！</h2>
            <p className="text-green-700 dark:text-emerald-400">您的 {booking.flights?.length} 段航班行程已确认。</p>
            <p className="text-sm text-green-600 dark:text-slate-400 mt-2">
              乘客: <span className="text-slate-900 dark:text-slate-100 font-medium">{booking.passengerName}</span>
              {booking.passengers && booking.passengers.length > 1 ? ` 等 ${booking.passengers.length} 人` : ''}
            </p>

            <button
              onClick={() => navigate('/my-bookings')}
              className="mt-4 text-green-700 dark:text-emerald-500 underline text-sm hover:text-green-900 dark:hover:text-emerald-400 transition-colors"
            >
              查看我的订单
            </button>
          </div>

          <div className="p-8 bg-white dark:bg-slate-900">
            <h3 className="text-xl font-bold text-gray-800 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              AI 目的地指南
            </h3>

            {loadingGuide ? (
              <div className="flex items-center justify-center py-10 gap-3 text-purple-600 dark:text-purple-400">
                <div className="w-2 h-2 bg-purple-600 dark:bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                <div className="w-2 h-2 bg-purple-600 dark:bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-purple-600 dark:bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                <span className="ml-2 text-sm font-medium">正在生成专属旅行攻略...</span>
              </div>
            ) : (
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6 border border-purple-100 dark:border-purple-800/50">
                <div
                  className="prose prose-purple dark:prose-invert prose-sm max-w-none text-gray-700 dark:text-slate-300"
                  dangerouslySetInnerHTML={{ __html: aiGuide }}
                />
                <div className="mt-4 flex items-center gap-2 text-xs text-purple-500 dark:text-purple-400 font-medium bg-white/50 dark:bg-slate-800/40 p-2 rounded inline-flex border border-purple-100/50 dark:border-purple-800/30">
                  <MapIcon className="w-3 h-3" /> 由 Gemini 提供实时建议
                </div>
              </div>
            )}
            Broadway

            <div className="mt-8 text-center">
              <button
                onClick={() => navigate('/')}
                className="bg-slate-900 dark:bg-blue-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-slate-800 dark:hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/10 dark:shadow-blue-900/30 active:scale-95"
              >
                返回首页
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationPage;
