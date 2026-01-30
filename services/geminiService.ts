
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

  /**
   * Generates a high-conversion e-commerce description based on rich product data.
   */
  async generateDescription(context: {
    title: string;
    category: string;
    price: number;
    currency: string;
    sku: string;
    variants?: any[];
  }): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const variantText = context.variants && context.variants.length > 0 
        ? `Available in multiple options including: ${context.variants.map(v => `${v.name} (${v.value})`).join(', ')}.`
        : "";

      const prompt = `
        Role: Senior E-commerce Copywriter for a Luxury Brand.
        Task: Write a professional, high-conversion product description.
        Product Name: "${context.title}"
        Category: "${context.category}"
        Price Point: ${context.price} ${context.currency}
        SKU Reference: ${context.sku}
        ${variantText}

        Guidelines:
        1. Keep it under 120 words.
        2. Use a sophisticated, persuasive, and architectural tone.
        3. Focus on quality, exclusivity, and user benefits.
        4. Use short, punchy sentences.
        5. Do not use generic filler words.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          temperature: 0.75,
          topP: 0.95,
        }
      });
      return response.text || "Failed to generate narrative.";
    } catch (error) {
      console.error("Gemini Generation Error:", error);
      return "AI generation failed. Please enter narrative manually.";
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
