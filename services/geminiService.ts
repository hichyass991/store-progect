import { GoogleGenAI, Type } from "@google/genai";

/**
 * Gwapashop Strategic Intelligence Service
 * Handles AI-powered features across the platform.
 */
export const geminiService = {
  /**
   * Performs deep strategic reasoning on complex queries.
   */
  async performDeepThinking(prompt: string, context?: any): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: context 
          ? `[BUSINESS_CONTEXT]\n${JSON.stringify(context, null, 2)}\n\n[QUERY]\n${prompt}` 
          : prompt,
        config: {
          thinkingConfig: { thinkingBudget: 32768 },
          temperature: 0.8,
        }
      });
      return response.text || "Strategic assistant failed to formulate a response. The query may be outside the current operational parameters.";
    } catch (error) {
      console.error("Deep Thinking Error:", error);
      return "Critical Error: Strategic reasoning engine interrupted. Please verify configuration and network stability.";
    }
  },

  async generateDescription(productName: string, category: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Write a persuasive, professional e-commerce product description for a product named "${productName}" in the "${category}" category. Keep it under 100 words and focus on value propositions.`,
        config: {
          temperature: 0.7,
        }
      });
      return response.text || "Failed to generate description.";
    } catch (error) {
      console.error("Gemini Error:", error);
      return "AI generation failed. Please enter manually.";
    }
  },

  async suggestStoreName(industry: string): Promise<string[]> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Suggest 5 catchy, modern store names for a business in the ${industry} industry.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      });
      return JSON.parse(response.text || '[]');
    } catch (error) {
      return ["Default Store Name"];
    }
  }
};