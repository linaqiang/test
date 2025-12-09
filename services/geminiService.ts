import { GoogleGenAI, Type, Modality } from "@google/genai";
import { AnalysisResult } from "../types";

// const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const ai = new GoogleGenAI({ 
    apiKey: 'FAKE_KEY', 
    // 强制 SDK 使用您的 Cloudflare Worker 代理路径
    // 它会调用 https://<Your Pages URL>/api/gemini
    baseUrl: window.location.origin + '/api/gemini' 
});

// 1. Analyze the image to get the word, phonetic, description, and color
export const analyzeImage = async (base64Image: string): Promise<AnalysisResult> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image,
            },
          },
          {
            text: `Identify the single main object in this image. 
            Return a JSON object with:
            1. 'word': The English name of the object (singular, capitalized).
            2. 'phonetic': The IPA phonetic transcription of the word.
            3. 'visualDescription': A short description of the object.
            4. 'themeColor': A HEX color code that matches the main color of the object. It should be a somewhat saturated, pleasing color suitable for a card background (e.g. if red mug, return a nice #CC3333).
            `,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            word: { type: Type.STRING },
            phonetic: { type: Type.STRING },
            visualDescription: { type: Type.STRING },
            themeColor: { type: Type.STRING },
          },
          required: ["word", "phonetic", "visualDescription", "themeColor"],
        },
      },
    });

    const result = JSON.parse(response.text || "{}");
    if (!result.word) throw new Error("Failed to identify object");
    return result as AnalysisResult;
  } catch (error) {
    console.error("Analyze Error:", error);
    throw error;
  }
};

// 2. Generate a sticker based on the original image (Image-to-Image)
export const generateSticker = async (base64Image: string, word: string, themeColor: string = "#FFFFFF"): Promise<string> => {
  try {
    // We generate a vertical 3:4 image where the sticker is centered on a solid background.
    // This allows the image to fill the entire card without awkward cropping or background boxes.
    const prompt = `Create a high-quality die-cut sticker of the ${word} shown in this image.
    DETAILS:
    1. Object: Keep it photorealistic, exactly like the original.
    2. Sticker Effect: Add a smooth, thick white border around the object.
    3. Background: The entire background must be a solid, flat, matte color: ${themeColor}. No gradients, no shadows on the background itself.
    4. Composition: Center the sticker vertically and horizontally. Leave generous margin around the sticker so it doesn't touch the edges.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [
            {
                inlineData: {
                  mimeType: "image/jpeg",
                  data: base64Image,
                },
            },
            { text: prompt }
        ],
      },
      config: {
        imageConfig: {
            // 3:4 aspect ratio matches the vertical card layout better than 1:1
            aspectRatio: "3:4" 
        }
      }
    });

    // Extract image
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image generated");
  } catch (error) {
    console.error("Sticker Gen Error:", error);
    throw error;
  }
};

// 3. Generate Audio for the word
export const generatePronunciation = async (text: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Puck" }, // Friendly voice
          },
        },
      },
    });

    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!audioData) throw new Error("No audio generated");
    return audioData;
  } catch (error) {
    console.error("TTS Error:", error);
    throw error;
  }
};
