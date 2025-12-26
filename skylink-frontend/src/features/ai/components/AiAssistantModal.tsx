import React, { useState, useEffect, useRef } from 'react';
import { X, Sparkles, MapPin, Loader2, Send, Calendar, MessageCircle, Plane, ChevronRight, ArrowLeft } from 'lucide-react';
import {
  getSmartRecommendations,
  generateItinerary,
  chatWithAI,
  type AIRecommendation,
  type ItineraryPlan,
  type ChatMessage,
  type AIProvider
} from '@/features/ai/api/gemini';
import { getAirportLocations } from '@/features/flight/api/search';
import { logger } from '@/shared/logger';

type ModalMode = 'menu' | 'recommend' | 'itinerary' | 'chat';

const AVAILABLE_MODELS: { id: AIProvider; name: string }[] = [
  { id: 'gemini', name: 'Gemini Pro' },
  { id: 'deepseek', name: 'DeepSeek V3' }
];

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRecommendation: (rec: AIRecommendation) => void;
  currentDestination?: string;
}

const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  isOpen,
  onClose,
  onSelectRecommendation,
  currentDestination
}) => {
  const [mode, setMode] = useState<ModalMode>('menu');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<AIProvider>('gemini');

  // Recommendation state
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [availableCities, setAvailableCities] = useState<string[]>([]);

  // Itinerary state
  const [itineraryDays, setItineraryDays] = useState(3);
  const [itineraryCity, setItineraryCity] = useState('');
  const [itinerary, setItinerary] = useState<ItineraryPlan | null>(null);
  const [citySearchOpen, setCitySearchOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Filter cities based on input
  const filteredCities = availableCities.filter(city =>
    city.toLowerCase().includes(itineraryCity.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setCitySearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Chat state
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getAirportLocations()
      .then(airports => {
        const cities = [...new Set(airports.map(a => a.city))];
        setAvailableCities(cities);
      })
      .catch(err => logger.error('Failed to fetch available cities', err));
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  if (!isOpen) return null;

  const handleBack = () => {
    setMode('menu');
    setError(null);
    setRecommendations([]);
    setItinerary(null);
  };

  // ============ Recommendation ============
  const handleRecommendSearch = async () => {
    if (!query.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      const results = await getSmartRecommendations(query, availableCities, selectedModel);
      if (!results?.length) {
        setError('暂无匹配的推荐');
        return;
      }
      setRecommendations(results);
    } catch {
      setError('获取推荐失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // ============ Itinerary ============
  const handleGenerateItinerary = async () => {
    if (!itineraryCity.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      const plan = await generateItinerary(itineraryCity, itineraryDays, query, selectedModel);
      setItinerary(plan);
    } catch {
      setError('生成行程失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // ============ Chat ============
  const handleChatSend = async () => {
    if (!query.trim() || loading) return;
    const userMessage = query;
    setQuery('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);
    try {
      const response = await chatWithAI(userMessage, chatHistory, { destination: currentDestination }, selectedModel);
      setChatHistory(prev => [...prev, { role: 'assistant', content: response }]);
    } catch {
      setChatHistory(prev => [...prev, { role: 'assistant', content: '抱歉，我暂时无法回答，请稍后再试。' }]);
    } finally {
      setLoading(false);
    }
  };

  const renderMenu = () => (
    <div className="grid grid-cols-1 gap-3">
      {[
        { id: 'recommend', icon: MapPin, title: '智能推荐', desc: '告诉我你想去什么样的地方' },
        { id: 'itinerary', icon: Calendar, title: '行程规划', desc: '为你规划完整旅行行程' },
        { id: 'chat', icon: MessageCircle, title: '旅行问答', desc: '问我任何旅行相关问题' },
      ].map(item => (
        <button
          key={item.id}
          onClick={() => setMode(item.id as ModalMode)}
          className="flex items-center gap-4 p-4 bg-white hover:bg-purple-50 rounded-xl border border-gray-100 hover:border-purple-200 transition-all group text-left"
        >
          <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
            <item.icon className="w-6 h-6" />
          </div>
          <div>
            <div className="font-bold text-gray-800">{item.title}</div>
            <div className="text-sm text-gray-500">{item.desc}</div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-300 ml-auto group-hover:text-purple-500" />
        </button>
      ))}
    </div>
  );

  const renderRecommend = () => (
    <div>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleRecommendSearch()}
          placeholder="例如：适合带孩子的海岛"
          className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none"
        />
        <button onClick={handleRecommendSearch} disabled={loading} className="bg-purple-600 hover:bg-purple-700 text-white px-5 rounded-xl disabled:opacity-50">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </button>
      </div>
      {recommendations.map((rec, idx) => (
        <div key={idx} onClick={() => onSelectRecommendation(rec)} className="bg-white p-4 rounded-xl border border-gray-100 hover:border-purple-200 cursor-pointer mb-3 transition-all">
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-purple-600" />
            <span className="font-bold text-lg">{rec.city}</span>
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">{rec.airportCode}</span>
          </div>
          <p className="text-gray-600 text-sm mt-2">{rec.reason}</p>
        </div>
      ))}
    </div>
  );

  const renderItinerary = () => (
    <div>
      {!itinerary ? (
        <div className="space-y-4">
          <div ref={wrapperRef} className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">目的地</label>
            <input
              type="text"
              value={itineraryCity}
              onChange={(e) => {
                setItineraryCity(e.target.value);
                setCitySearchOpen(true);
              }}
              onFocus={() => setCitySearchOpen(true)}
              placeholder="输入或选择城市"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none"
            />
            {citySearchOpen && (filteredCities.length > 0 || availableCities.length > 0) && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                {filteredCities.length > 0 ? (
                  filteredCities.map(city => (
                    <button
                      key={city}
                      onClick={() => {
                        setItineraryCity(city);
                        setCitySearchOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-purple-50 text-gray-700 hover:text-purple-700 transition-colors"
                    >
                      {city}
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-2 text-gray-400 text-sm">未找到匹配城市</div>
                )}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">天数</label>
            <div className="flex gap-2">
              {[2, 3, 5, 7].map(d => (
                <button
                  key={d}
                  onClick={() => setItineraryDays(d)}
                  className={`flex-1 py-2 rounded-xl border ${itineraryDays === d ? 'bg-purple-600 text-white border-purple-600' : 'border-gray-200 hover:border-purple-300'}`}
                >
                  {d}天
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">偏好（可选）</label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="例如：喜欢美食、不想太累"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none"
            />
          </div>
          <button onClick={handleGenerateItinerary} disabled={loading || !itineraryCity} className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-bold disabled:opacity-50">
            {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : '生成行程'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-purple-50 p-4 rounded-xl">
            <h4 className="font-bold text-purple-800">{itinerary.destination} {itinerary.duration}日游</h4>
            <p className="text-sm text-purple-600 mt-1">{itinerary.summary}</p>
            <div className="flex gap-4 mt-3 text-xs text-purple-700">
              <span>💰 {itinerary.budget}</span>
              <span>🗓️ {itinerary.bestSeason}</span>
            </div>
          </div>
          {itinerary.itinerary.map((day: any) => (
            <div key={day.day} className="bg-white p-4 rounded-xl border border-gray-100">
              <div className="font-bold text-gray-800">Day {day.day}: {day.title}</div>
              <ul className="mt-2 space-y-1">
                {day.activities.map((a: string, i: number) => <li key={i} className="text-sm text-gray-600">• {a}</li>)}
              </ul>
              <p className="text-xs text-purple-600 mt-2">💡 {day.tips}</p>
            </div>
          ))}
          <button onClick={() => setItinerary(null)} className="w-full py-2 text-purple-600 hover:bg-purple-50 rounded-xl">重新规划</button>
        </div>
      )}
    </div>
  );

  const renderChat = () => (
    <div className="flex flex-col h-[400px]">
      <div className="flex-1 overflow-y-auto space-y-3 mb-3">
        {chatHistory.length === 0 && (
          <div className="text-center text-gray-400 py-10">
            <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>问我任何旅行相关的问题吧！</p>
          </div>
        )}
        {chatHistory.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] px-4 py-2 rounded-2xl ${msg.role === 'user' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleChatSend()}
          placeholder="输入你的问题..."
          className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none"
        />
        <button onClick={handleChatSend} disabled={loading} className="bg-purple-600 hover:bg-purple-700 text-white px-5 rounded-xl disabled:opacity-50">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            {mode !== 'menu' && (
              <button onClick={handleBack} className="text-white/80 hover:text-white">
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h3 className="text-white text-lg font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5" /> AI 旅行助手
              </h3>
              <p className="text-purple-100 text-xs mt-0.5">
                {mode === 'menu' && '选择你需要的服务'}
                {mode === 'recommend' && '智能目的地推荐'}
                {mode === 'itinerary' && '行程规划'}
                {mode === 'chat' && '旅行问答'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value as AIProvider)}
              className="bg-white/10 text-white text-xs border border-white/20 rounded-lg px-2 py-1 outline-none focus:bg-white/20 hover:bg-white/20 cursor-pointer"
            >
              {AVAILABLE_MODELS.map(m => (
                <option key={m.id} value={m.id} className="text-gray-900">{m.name}</option>
              ))}
            </select>
            <button onClick={onClose} className="text-white/80 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1 bg-gray-50">
          {error && <div className="mb-4 px-3 py-2 rounded-lg bg-red-50 text-red-600 text-sm">{error}</div>}
          {mode === 'menu' && renderMenu()}
          {mode === 'recommend' && renderRecommend()}
          {mode === 'itinerary' && renderItinerary()}
          {mode === 'chat' && renderChat()}
        </div>
      </div>
    </div>
  );
};

export default AiAssistantModal;
