import { GoogleGenAI } from "@google/genai";

const MODEL_NAME = 'gemini-3-pro-image-preview';

/**
 * Ensures the user has selected an API key.
 * This is required for gemini-3-pro-image-preview (Nano Banana Pro).
 */
export const ensureApiKey = async (): Promise<boolean> => {
  const win = window as any;
  if (win.aistudio) {
    const hasKey = await win.aistudio.hasSelectedApiKey();
    if (!hasKey) {
      await win.aistudio.openSelectKey();
      // Assume success after dialog interaction to avoid race conditions
      return true; 
    }
    return true;
  }
  // Fallback for dev environments without the studio wrapper (assumes process.env.API_KEY might be present or handled elsewhere)
  return !!process.env.API_KEY;
};

export const generateHeatmapForFold = async (imageBase64: string): Promise<string> => {
  // Always create a new instance to ensure the latest key is used
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          {
            text: "Generate a predictive visual attention heatmap for this website design fold. Highlight areas likely to capture user attention in red/warm colors (hotspots) and less attended areas in cool colors/transparent. The output must be the original image with the heatmap overlaid nicely.",
          },
          {
            inlineData: {
              data: imageBase64,
              mimeType: 'image/png',
            },
          },
        ],
      },
      config: {
        // Nano banana pro supports image generation/editing
      }
    });

    // Parse response for image
    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return part.inlineData.data;
        }
      }
    }
    
    throw new Error("No image data returned from model.");

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    // Handle specific "Requested entity was not found" error for API key issues
    const win = window as any;
    if (error.message && error.message.includes("Requested entity was not found") && win.aistudio) {
        await win.aistudio.openSelectKey();
        throw new Error("API Key invalid or expired. Please select a key again.");
    }
    throw error;
  }
};