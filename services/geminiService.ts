
import { GoogleGenAI, Type } from "@google/genai";

// Fix: Initializing GoogleGenAI with API_KEY from environment variables directly
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const geminiService = {
  async generateDescription(productName: string, category: string): Promise<string> {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Write a persuasive, professional e-commerce product description for a product named "${productName}" in the "${category}" category. Keep it under 100 words and focus on value propositions.`,
        config: {
          temperature: 0.7,
        }
      });
      // Fix: Using .text property instead of .text() method
      return response.text || "Failed to generate description.";
    } catch (error) {
      console.error("Gemini Error:", error);
      return "AI generation failed. Please enter manually.";
    }
  },

  async suggestStoreName(industry: string): Promise<string[]> {
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
      // Fix: Using .text property instead of .text() method
      return JSON.parse(response.text || '[]');
    } catch (error) {
      return ["Default Store Name"];
    }
  }
};
