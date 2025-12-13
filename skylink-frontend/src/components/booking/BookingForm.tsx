
import React, { useState } from 'react';
import { Flight, BookingDetails } from '../../types';
import { CreditCard, User, ShieldCheck, Plane, Clock, Mail, Phone, ChevronRight, CheckCircle2, QrCode, Smartphone, Wallet, ArrowLeft, AlertCircle } from 'lucide-react';

interface BookingFormProps {
  flights: Flight[];
  onConfirm: (details: BookingDetails) => void;
  onCancel: () => void;
}

type BookingStep = 1 | 2;
type PaymentMethod = 'alipay' | 'wechat' | 'credit_card';

const BookingForm: React.FC<BookingFormProps> = ({ flights, onConfirm, onCancel }) => {
  // Step State
  const [step, setStep] = useState<BookingStep>(1);
  
  // Form State
  const [formData, setFormData] = useState<BookingDetails>({
    passengerName: '',
    passportNumber: '',
    contactEmail: '',
    phone: ''
  });
  
  // Validation State
  const [errors, setErrors] = useState<Partial<Record<keyof BookingDetails, string>>>({});
  
  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('alipay');
  const [loading, setLoading] = useState(false);

  const totalPrice = flights.reduce((sum, flight) => sum + flight.price, 0);

  // --- Handlers ---

  const handleInputChange = (field: keyof BookingDetails, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateStep1 = (): boolean => {
    const newErrors: Partial<Record<keyof BookingDetails, string>> = {};
    
    if (!formData.passengerName.trim()) newErrors.passengerName = '请输入乘客姓名';
    if (!formData.passportNumber.trim()) newErrors.passportNumber = '请输入证件号码';
    if (!formData.phone.trim()) newErrors.phone = '请输入手机号码';
    else if (!/^1[3-9]\d{9}$/.test(formData.phone)) newErrors.phone = '手机号格式不正确';
    
    if (!formData.contactEmail.trim()) newErrors.contactEmail = '请输入电子邮箱';
    else if (!/\S+@\S+\.\S+/.test(formData.contactEmail)) newErrors.contactEmail = '邮箱格式不正确';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleFinalSubmit = () => {
    setLoading(true);
    // Simulate Payment Processing
    setTimeout(() => {
      onConfirm(formData);
      setLoading(false);
    }, 2000);
  };

  // --- Components ---

  const StepIndicator = () => (
    <div className="flex items-center justify-center mb-8 px-4">
      <div className="flex items-center w-full max-w-lg relative">
        {/* Step 1 Circle */}
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all z-10 ${step >= 1 ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-gray-200 text-gray-500'}`}>
          1
        </div>
        
        {/* Connector Line */}
        <div className="flex-1 h-1 mx-2 relative bg-gray-200 rounded-full overflow-hidden">
          <div className={`absolute top-0 left-0 h-full bg-blue-600 transition-all duration-500 ease-in-out ${step === 2 ? 'w-full' : 'w-0'}`}></div>
        </div>

        {/* Step 2 Circle */}
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all z-10 ${step >= 2 ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-gray-200 text-gray-500'}`}>
          2
        </div>
      </div>
      
      {/* Labels */}
      <div className="absolute flex w-full max-w-lg justify-between mt-14 text-xs font-bold text-gray-500 uppercase tracking-wide">
        <span className={step >= 1 ? 'text-blue-600' : ''}>乘客信息</span>
        <span className={step >= 2 ? 'text-blue-600' : ''}>支付订单</span>
      </div>
    </div>
  );

  const FlightSummaryCard = () => (
    <div className="bg-gray-50/80 backdrop-blur-sm rounded-2xl p-5 border border-gray-200 sticky top-24">
      <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
        <Plane className="w-4 h-4 text-gray-400" /> 行程清单
      </h3>
      
      <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
        {flights.map((flight, idx) => (
          <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
            <div className="flex justify-between items-start mb-2 pl-2">
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded uppercase">
                    Flight {idx + 1}
                </span>
                <span className="font-bold text-gray-800">¥{flight.price.toLocaleString()}</span>
            </div>
            <div className="pl-2">
              <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-gray-800">{flight.origin}</span>
                  <ArrowLeft className="w-3 h-3 text-gray-300 rotate-180" />
                  <span className="text-sm font-bold text-gray-800">{flight.destination}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500 mb-1">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(flight.departureTime).toLocaleDateString()}</span>
                  <span>{flight.duration}</span>
              </div>
              <div className="text-xs text-gray-400">
                  {flight.airline} • {flight.flightNumber}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-gray-200 mt-4 space-y-2">
         <div className="flex justify-between items-center text-sm text-gray-600">
            <span>机票总价</span>
            <span>¥{totalPrice.toLocaleString()}</span>
         </div>
         <div className="flex justify-between items-center text-sm text-gray-600">
            <span>机建燃油</span>
            <span>¥{flights.length * 120}</span>
         </div>
         <div className="flex justify-between items-center text-sm text-green-600">
            <span>限时优惠</span>
            <span>-¥50</span>
         </div>
         <div className="h-px bg-gray-200 my-2"></div>
         <div className="flex justify-between items-center">
             <span className="text-gray-800 font-bold">应付总额</span>
             <span className="text-2xl font-bold text-orange-600">¥{(totalPrice + flights.length * 120 - 50).toLocaleString()}</span>
         </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header Stepper */}
      <StepIndicator />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6">
        {/* Main Content Area */}
        <div className="lg:col-span-8 space-y-6">
          
          {step === 1 ? (
            // --- STEP 1: PASSENGER INFO ---
            <div className="space-y-6 animate-in fade-in slide-in-from-left-8 duration-500">
              <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex items-center gap-3">
                  <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-500/20">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-800">乘客信息</h2>
                    <p className="text-xs text-gray-500">请确保信息与证件一致</p>
                  </div>
                </div>
                
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  {/* Name */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">乘客姓名</label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 w-5 h-5 transition-colors" />
                      <input
                        type="text"
                        value={formData.passengerName}
                        onChange={(e) => handleInputChange('passengerName', e.target.value)}
                        className={`w-full pl-12 pr-4 py-3.5 border rounded-xl outline-none transition-all bg-gray-50 focus:bg-white focus:ring-4 ${errors.passengerName ? 'border-red-300 focus:ring-red-100' : 'border-gray-200 focus:ring-blue-50 focus:border-blue-400'}`}
                        placeholder="请输入姓名"
                      />
                    </div>
                    {errors.passengerName && <p className="text-xs text-red-500 ml-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.passengerName}</p>}
                  </div>

                  {/* Passport */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">身份证/护照</label>
                    <div className="relative group">
                      <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 w-5 h-5 transition-colors" />
                      <input
                        type="text"
                        value={formData.passportNumber}
                        onChange={(e) => handleInputChange('passportNumber', e.target.value)}
                        className={`w-full pl-12 pr-4 py-3.5 border rounded-xl outline-none transition-all bg-gray-50 focus:bg-white focus:ring-4 ${errors.passportNumber ? 'border-red-300 focus:ring-red-100' : 'border-gray-200 focus:ring-blue-50 focus:border-blue-400'}`}
                        placeholder="请输入证件号码"
                      />
                    </div>
                    {errors.passportNumber && <p className="text-xs text-red-500 ml-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.passportNumber}</p>}
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">联系手机</label>
                    <div className="relative group">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 w-5 h-5 transition-colors" />
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className={`w-full pl-12 pr-4 py-3.5 border rounded-xl outline-none transition-all bg-gray-50 focus:bg-white focus:ring-4 ${errors.phone ? 'border-red-300 focus:ring-red-100' : 'border-gray-200 focus:ring-blue-50 focus:border-blue-400'}`}
                        placeholder="接收航班动态"
                      />
                    </div>
                    {errors.phone && <p className="text-xs text-red-500 ml-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.phone}</p>}
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">电子邮箱</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 w-5 h-5 transition-colors" />
                      <input
                        type="email"
                        value={formData.contactEmail}
                        onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                        className={`w-full pl-12 pr-4 py-3.5 border rounded-xl outline-none transition-all bg-gray-50 focus:bg-white focus:ring-4 ${errors.contactEmail ? 'border-red-300 focus:ring-red-100' : 'border-gray-200 focus:ring-blue-50 focus:border-blue-400'}`}
                        placeholder="接收电子行程单"
                      />
                    </div>
                    {errors.contactEmail && <p className="text-xs text-red-500 ml-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.contactEmail}</p>}
                  </div>
                </div>

                <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                   <button 
                     onClick={onCancel}
                     className="text-gray-500 font-bold text-sm hover:text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-200/50 transition-colors"
                   >
                     取消预订
                   </button>
                   <button 
                     onClick={handleNextStep}
                     className="bg-gray-900 hover:bg-black text-white px-8 py-3.5 rounded-xl font-bold shadow-xl shadow-gray-500/20 flex items-center gap-2 transition-all transform hover:-translate-y-1 active:scale-95"
                   >
                     下一步：支付订单 <ChevronRight className="w-4 h-4" />
                   </button>
                </div>
              </div>
            </div>
          ) : (
            // --- STEP 2: PAYMENT ---
            <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
               {/* 1. Review Info */}
               <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-start justify-between">
                  <div className="flex gap-4">
                     <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-600">
                        <CheckCircle2 className="w-6 h-6" />
                     </div>
                     <div>
                        <h3 className="font-bold text-gray-800">乘机人信息已确认</h3>
                        <p className="text-sm text-gray-500 mt-1">{formData.passengerName} • {formData.phone}</p>
                        <p className="text-xs text-gray-400 mt-0.5 font-mono">{formData.contactEmail}</p>
                     </div>
                  </div>
                  <button 
                    onClick={() => setStep(1)}
                    className="text-blue-600 text-xs font-bold hover:underline px-3 py-1 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    修改信息
                  </button>
               </div>

               {/* 2. Payment Method */}
               <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                  <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex items-center gap-3">
                    <div className="bg-orange-500 p-2 rounded-xl text-white shadow-lg shadow-orange-500/20">
                      <Wallet className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-800">选择支付方式</h2>
                      <p className="text-xs text-gray-500">支付安全由平台保障</p>
                    </div>
                  </div>

                  <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                     <button 
                       onClick={() => setPaymentMethod('alipay')}
                       className={`relative p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 group ${paymentMethod === 'alipay' ? 'border-blue-500 bg-blue-50/50' : 'border-gray-100 hover:border-blue-200 hover:bg-gray-50'}`}
                     >
                        {paymentMethod === 'alipay' && <div className="absolute top-3 right-3 text-blue-500"><CheckCircle2 className="w-5 h-5" /></div>}
                        <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center p-2">
                           <QrCode className="w-8 h-8 text-blue-500" />
                        </div>
                        <span className={`font-bold ${paymentMethod === 'alipay' ? 'text-blue-700' : 'text-gray-600'}`}>支付宝</span>
                     </button>

                     <button 
                       onClick={() => setPaymentMethod('wechat')}
                       className={`relative p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 group ${paymentMethod === 'wechat' ? 'border-green-500 bg-green-50/50' : 'border-gray-100 hover:border-green-200 hover:bg-gray-50'}`}
                     >
                        {paymentMethod === 'wechat' && <div className="absolute top-3 right-3 text-green-500"><CheckCircle2 className="w-5 h-5" /></div>}
                        <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center p-2">
                           <Smartphone className="w-8 h-8 text-green-600" />
                        </div>
                        <span className={`font-bold ${paymentMethod === 'wechat' ? 'text-green-700' : 'text-gray-600'}`}>微信支付</span>
                     </button>

                     <button 
                       onClick={() => setPaymentMethod('credit_card')}
                       className={`relative p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 group ${paymentMethod === 'credit_card' ? 'border-purple-500 bg-purple-50/50' : 'border-gray-100 hover:border-purple-200 hover:bg-gray-50'}`}
                     >
                        {paymentMethod === 'credit_card' && <div className="absolute top-3 right-3 text-purple-500"><CheckCircle2 className="w-5 h-5" /></div>}
                        <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center p-2">
                           <CreditCard className="w-8 h-8 text-purple-600" />
                        </div>
                        <span className={`font-bold ${paymentMethod === 'credit_card' ? 'text-purple-700' : 'text-gray-600'}`}>信用卡/银联</span>
                     </button>
                  </div>

                  <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                     <button 
                       onClick={() => setStep(1)}
                       className="text-gray-500 font-bold text-sm hover:text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-200/50 transition-colors flex items-center gap-2"
                     >
                       <ArrowLeft className="w-4 h-4" /> 返回上一步
                     </button>
                     <button 
                       onClick={handleFinalSubmit}
                       disabled={loading}
                       className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-xl font-bold shadow-xl shadow-blue-500/30 flex items-center gap-2 transition-all transform hover:-translate-y-1 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed min-w-[180px] justify-center"
                     >
                       {loading ? (
                         <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                       ) : (
                         <>确认支付 <span className="text-blue-200 font-normal">|</span> ¥{(totalPrice + flights.length * 120 - 50).toLocaleString()}</>
                       )}
                     </button>
                  </div>
               </div>
            </div>
          )}
        </div>

        {/* Right Sidebar: Summary (Sticky) */}
        <div className="lg:col-span-4">
           <FlightSummaryCard />
        </div>
      </div>
    </div>
  );
};

export default BookingForm;
