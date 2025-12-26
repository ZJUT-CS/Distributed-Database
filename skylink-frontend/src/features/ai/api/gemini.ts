import { GoogleGenAI, Type } from '@google/genai';
import { logger } from '@/shared/logger';

export interface AIRecommendation {
  city: string;
  airportCode: string;
  reason: string;
}

const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
const deepseekApiKey = import.meta.env.VITE_DEEPSEEK_API_KEY as string | undefined;
const deepseekBaseUrl = 'https://api.deepseek.com';

export type AIProvider = 'gemini' | 'deepseek';

const createGeminiClient = () => {
  if (!geminiApiKey) throw new Error('Gemini API key is not configured');
  return new GoogleGenAI({ apiKey: geminiApiKey });
};

const callDeepSeek = async (prompt: string, responseJson: boolean = false): Promise<string> => {
  if (!deepseekApiKey) throw new Error('DeepSeek API key is not configured');

  const response = await fetch(`${deepseekBaseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${deepseekApiKey}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      response_format: responseJson ? { type: 'json_object' } : undefined,
      temperature: 0.7,
    })
  });

  if (!response.ok) {
    throw new Error(`DeepSeek API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
};

export const getSmartRecommendations = async (query: string, availableCities?: string[], provider: AIProvider = 'gemini'): Promise<AIRecommendation[]> => {
  const cityConstraint = availableCities && availableCities.length > 0
    ? `You MUST only recommend cities from this list: [${availableCities.join(', ')}]. Do not suggest any city outside this list.`
    : '';

  const prompt = `User wants travel recommendations based on this query: "${query}".
${cityConstraint}
Provide up to 3 suitable cities from the allowed list. For each city, provide the closest major airport code (IATA) and a short reason in Chinese.
If none of the allowed cities match the user's query well, still pick the best matches and explain why.
Return ONLY valid JSON array with format: [{"city":"城市名","airportCode":"CODE","reason":"推荐理由"}]`;

  const tryGemini = async () => {
    if (!geminiApiKey) return null;
    const ai = createGeminiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }, // Simplified config for brevity, schema implied
    });
    return response.text ? JSON.parse(response.text) as AIRecommendation[] : null;
  };

  const tryDeepSeek = async () => {
    if (!deepseekApiKey) return null;
    const response = await callDeepSeek(prompt, true);
    return JSON.parse(response) as AIRecommendation[];
  };

  try {
    if (provider === 'gemini') {
      const result = await tryGemini();
      if (result) {
        logger.info('Using Gemini API for recommendations');
        return result;
      }
      // Fallback
      const fallback = await tryDeepSeek();
      if (fallback) {
        logger.info('Using DeepSeek API for recommendations (fallback)');
        return fallback;
      }
    } else {
      const result = await tryDeepSeek();
      if (result) {
        logger.info('Using DeepSeek API for recommendations');
        return result;
      }
      // Fallback
      const fallback = await tryGemini();
      if (fallback) {
        logger.info('Using Gemini API for recommendations (fallback)');
        return fallback;
      }
    }
  } catch (err) {
    logger.error('AI Preference execution failed:', err);
    throw err;
  }

  throw new Error('No AI provider configured or both failed.');
};

export const getDestinationGuide = async (city: string, provider: AIProvider = 'gemini'): Promise<string> => {
  const prompt = `Write a short, engaging travel guide for ${city} in Chinese. 
Include 3 must-visit attractions and 1 local food recommendation. 
Keep it under 150 words. Format with simple HTML tags like <strong> for emphasis.`;

  const tryGemini = async () => {
    if (!geminiApiKey) return null;
    const ai = createGeminiClient();
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text;
  };

  const tryDeepSeek = async () => {
    if (!deepseekApiKey) return null;
    return await callDeepSeek(prompt);
  };

  try {
    if (provider === 'gemini') {
      const res = await tryGemini() || await tryDeepSeek();
      if (res) return res;
    } else {
      const res = await tryDeepSeek() || await tryGemini();
      if (res) return res;
    }
  } catch (e) {
    logger.error('AI execution failed', e);
  }

  return '获取目的地指南失败，请稍后重试。';
};

// ============ 智能行程规划 ============

export interface ItineraryDay {
  day: number;
  title: string;
  activities: string[];
  tips: string;
}

export interface ItineraryPlan {
  destination: string;
  duration: number;
  summary: string;
  budget: string;
  bestSeason: string;
  itinerary: ItineraryDay[];
}

export const generateItinerary = async (
  destination: string,
  days: number,
  preferences?: string,
  provider: AIProvider = 'gemini'
): Promise<ItineraryPlan> => {
  const prefText = preferences ? `用户偏好：${preferences}` : '';
  const prompt = `为用户规划一个${days}天的${destination}旅行行程。${prefText}
请用中文回答，包含每日行程安排、预算估算和旅行建议。
Return ONLY valid JSON matching the schema: {"destination":string,"duration":number,"summary":string,"budget":string,"bestSeason":string,"itinerary":[{"day":number,"title":string,"activities":string[],"tips":string}]}`;

  const tryGemini = async () => {
    if (!geminiApiKey) return null;
    const ai = createGeminiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });
    return response.text ? JSON.parse(response.text) as ItineraryPlan : null;
  };

  const tryDeepSeek = async () => {
    if (!deepseekApiKey) return null;
    const response = await callDeepSeek(prompt, true);
    return JSON.parse(response) as ItineraryPlan;
  };

  if (provider === 'gemini') {
    const res = await tryGemini() || await tryDeepSeek();
    if (res) return res;
  } else {
    const res = await tryDeepSeek() || await tryGemini();
    if (res) return res;
  }

  throw new Error('No AI provider configured');
};

// ============ 旅行问答对话 ============

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const chatWithAI = async (
  message: string,
  history: ChatMessage[],
  context?: { destination?: string; flightInfo?: string },
  provider: AIProvider = 'gemini'
): Promise<string> => {
  const contextInfo = context?.destination
    ? `当前用户正在查看前往${context.destination}的航班。`
    : '';

  const historyText = history
    .slice(-6)
    .map(m => `${m.role === 'user' ? '用户' : 'AI'}: ${m.content}`)
    .join('\n');

  const prompt = `你是一个专业的旅行助手，帮助用户解答旅行相关问题。
${contextInfo}

对话历史：
${historyText}

用户最新问题：${message}

请用中文简洁回答，不超过200字。如果问题与旅行无关，礼貌地引导用户回到旅行话题。`;

  const tryGemini = async () => {
    if (!geminiApiKey) return null;
    const ai = createGeminiClient();
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text;
  };

  const tryDeepSeek = async () => {
    if (!deepseekApiKey) return null;
    return await callDeepSeek(prompt);
  };

  if (provider === 'gemini') {
    const res = await tryGemini() || await tryDeepSeek();
    if (res) return res;
  } else {
    const res = await tryDeepSeek() || await tryGemini();
    if (res) return res;
  }

  throw new Error('No AI provider configured');
};

// ============ 航班智能对比 ============

export interface FlightComparisonInput {
  flightNo: string;
  price: number;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  airline: string;
  stops: number;
}

export interface FlightAnalysis {
  recommendation: string;
  cheapest: string;
  fastest: string;
  bestValue: string;
  analysis: string;
}

export const compareFlights = async (
  flights: FlightComparisonInput[],
  userPreference?: string,
  provider: AIProvider = 'gemini'
): Promise<FlightAnalysis> => {
  const flightsList = flights.map((f, i) =>
    `${i + 1}. ${f.flightNo} | ${f.airline} | ¥${f.price} | ${f.departureTime}-${f.arrivalTime} | ${f.duration} | ${f.stops === 0 ? '直飞' : f.stops + '次转机'}`
  ).join('\n');

  const prefText = userPreference ? `用户偏好：${userPreference}` : '';
  const prompt = `分析以下航班并给出推荐：
${flightsList}

${prefText}

请用中文分析每个航班的优缺点，推荐最佳选择。
Return ONLY valid JSON matching the schema: {"recommendation":string,"cheapest":string,"fastest":string,"bestValue":string,"analysis":string}`;

  const tryGemini = async () => {
    if (!geminiApiKey) return null;
    const ai = createGeminiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });
    return response.text ? JSON.parse(response.text) as FlightAnalysis : null;
  };

  const tryDeepSeek = async () => {
    if (!deepseekApiKey) return null;
    const response = await callDeepSeek(prompt, true);
    return JSON.parse(response) as FlightAnalysis;
  };

  if (provider === 'gemini') {
    const res = await tryGemini() || await tryDeepSeek();
    if (res) return res;
  } else {
    const res = await tryDeepSeek() || await tryGemini();
    if (res) return res;
  }

  throw new Error('No AI provider configured');
};
