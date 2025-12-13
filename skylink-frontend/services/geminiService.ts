import { GoogleGenAI, Type } from "@google/genai";
import { AIRecommendation } from '../types';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

const createClient = () => {
  if (!apiKey) {
    console.error("Gemini API key is not configured. Please set VITE_GEMINI_API_KEY in .env.local.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const getSmartRecommendations = async (query: string): Promise<AIRecommendation[]> => {
  try {
    const ai = createClient();
    if (!ai) {
      return [];
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `User wants travel recommendations based on this query: "${query}".
      Provide 3 suitable cities. For each city, provide the closest major airport code (IATA) and a short reason in Chinese.
      Only return valid JSON matching the schema.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              city: { type: Type.STRING },
              airportCode: { type: Type.STRING },
              reason: { type: Type.STRING }
            },
            required: ["city", "airportCode", "reason"]
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as AIRecommendation[];
    }
    return [];
  } catch (error) {
    console.error("Gemini API Error:", error);
    return [];
  }
};

export const getDestinationGuide = async (city: string): Promise<string> => {
  try {
    const ai = createClient();
    if (!ai) {
      return "暂时无法获取目的地指南，请联系管理员配置 Gemini API Key。";
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Write a short, engaging travel guide for ${city} in Chinese. 
      Include 3 must-visit attractions and 1 local food recommendation. 
      Keep it under 150 words. Format with simple HTML tags like <strong> for emphasis.`,
    });
    return response.text || "暂无指南信息。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "获取目的地指南失败，请稍后重试。";
  }
};
