import React, { useState } from 'react';
import { X, Sparkles, MapPin, Loader2, Send } from 'lucide-react';
import { getSmartRecommendations, type AIRecommendation } from '@/features/ai/api/gemini';
import { logger } from '@/shared/logger';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRecommendation: (rec: AIRecommendation) => void;
}

const AiAssistantModal: React.FC<AiAssistantModalProps> = ({ isOpen, onClose, onSelectRecommendation }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSearch = async () => {
    if (!query.trim() || loading) return;
    setLoading(true);
    setError(null);
    setRecommendations([]);
    try {
      const results = await getSmartRecommendations(query);
      if (!results || results.length === 0) {
        setError('暂时未能获取到智能推荐，可能是 AI 服务未配置或暂时不可用。');
        return;
      }
      setRecommendations(results);
    } catch (err) {
      logger.error('Failed to get AI travel recommendations', err);
      setError('获取 AI 推荐时发生错误，请稍后重试或联系管理员。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 flex justify-between items-start">
          <div>
            <h3 className="text-white text-xl font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5" /> AI 灵感旅行助手
            </h3>
            <p className="text-purple-100 text-sm mt-1">告诉我您的想法，例如"我想去一个适合冲浪的便宜海岛"</p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-gray-50">
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="输入您的旅行愿望..."
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
            />
            <button
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>

          {!loading && error && (
            <div className="mb-4 px-3 py-2 rounded-lg bg-red-50 text-red-600 text-sm">
              {error}
            </div>
          )}

          {loading && (
            <div className="text-center py-10">
              <Loader2 className="w-8 h-8 text-purple-600 dark:text-purple-400 animate-spin mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400 text-sm animate-pulse">正在分析您的需求并寻找最佳目的地...</p>
            </div>
          )}

          {!loading && recommendations.length > 0 && (
            <div className="grid grid-cols-1 gap-4">
              {recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  onClick={() => onSelectRecommendation(rec)}
                  className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-purple-200 cursor-pointer transition-all group"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      <div className="bg-purple-50 p-2 rounded-lg text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800 text-lg group-hover:text-purple-700 transition-colors">
                          {rec.city}
                        </h4>
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-mono">
                          {rec.airportCode}
                        </span>
                        <p className="text-gray-600 text-sm mt-2 leading-relaxed">
                          {rec.reason}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && recommendations.length === 0 && !query && (
            <div className="text-center text-gray-400 dark:text-gray-500 py-10">
              <p>尝试搜索："适合家庭出游的历史名城" 或 "九月份去哪里看红叶"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AiAssistantModal;
