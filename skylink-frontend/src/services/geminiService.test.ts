import { describe, it, expect, vi, beforeAll } from 'vitest';
import { getSmartRecommendations } from './geminiService';
import { AIRecommendation } from '../types';

vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: vi.fn().mockImplementation(() => ({
      models: {
        generateContent: vi.fn().mockResolvedValue({
          text: JSON.stringify([
            { city: '东京', airportCode: 'HND', reason: '美食与购物' },
            { city: '曼谷', airportCode: 'BKK', reason: '性价比高' },
            { city: '大阪', airportCode: 'KIX', reason: '亲子游友好' },
          ] as AIRecommendation[]),
        }),
      },
    })),
    Type: {
      ARRAY: 'ARRAY',
      OBJECT: 'OBJECT',
      STRING: 'STRING',
    },
  };
});

describe('geminiService.getSmartRecommendations', () => {
  beforeAll(() => {
    (import.meta as any).env = {
      ...(import.meta as any).env,
      VITE_GEMINI_API_KEY: 'test-key',
    };
  });

  it('返回解析后的推荐列表', async () => {
    const result = await getSmartRecommendations('适合亲子游的海岛');
    expect(result).toHaveLength(3);
    expect(result[0].city).toBe('东京');
    expect(result[0].airportCode).toBe('HND');
  });
});

