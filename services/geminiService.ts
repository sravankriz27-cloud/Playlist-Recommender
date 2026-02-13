import { GoogleGenAI, Type } from "@google/genai";
import { PlaylistPreferences, GenerationResult } from "../types";

const API_KEY = (typeof process !== "undefined" && process.env?.API_KEY) || "";

export const generateRecommendations = async (
  prefs: PlaylistPreferences,
): Promise<GenerationResult> => {
  if (!API_KEY) throw new Error("Missing Gemini API Key.");

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const {
    mood,
    energy,
    popularity,
    danceability,
    acousticness,
    instrumentalness,
    genre,
    prompt,
  } = prefs;

  const systemPrompt = `You are an expert music curator. Curate exactly 25 tracks matching these criteria:
  Mood: ${mood}/100, Energy: ${energy}/100, Popularity: ${popularity}/100, Danceability: ${danceability}/100, Genre: ${genre}, Context: ${prompt}.
  Generate a creative playlist name and thematic description.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Generate my personalized sonic journey.",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            playlistName: { type: Type.STRING },
            playlistDescription: { type: Type.STRING },
            tracks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  artist: { type: Type.STRING },
                  album: { type: Type.STRING },
                  popularityScore: { type: Type.NUMBER },
                  reason: { type: Type.STRING },
                  genre: { type: Type.STRING },
                },
                required: [
                  "id",
                  "title",
                  "artist",
                  "reason",
                  "genre",
                  "popularityScore",
                ],
              },
            },
          },
          required: ["playlistName", "playlistDescription", "tracks"],
        },
      },
    });

    const result = JSON.parse(response.text || "{}");
    return {
      ...result,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error("Gemini Track Generation Error:", error);
    throw error;
  }
};

export const generateCoverImage = async (
  name: string,
  description: string,
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const prompt = `Create a high-quality abstract minimalist music playlist cover titled "${name}". Description: ${description}. Geometric shapes, cinematic gradients, no text.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: { aspectRatio: "1:1" },
      },
    });

    const candidates = response.candidates;
    if (candidates?.[0]?.content?.parts) {
      for (const part of candidates[0].content.parts) {
        if (part.inlineData) return part.inlineData.data;
      }
    }
    return "";
  } catch (err: any) {
    // If we hit a 429 (Quota) or 400 (Invalid request for image), log it but don't break the app
    console.warn(
      "Cover image generation skipped or failed due to quota/error:",
      err.message,
    );
    return "";
  }
};
