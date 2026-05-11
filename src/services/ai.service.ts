import { GoogleGenAI } from "@google/genai";

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateProductDescription(productName: string, category: string, features?: string) {
  try {
    const prompt = `Génère une description de produit attrayante et vendeuse pour une boutique en Côte d'Ivoire.
    Le produit est : ${productName}
    Catégorie : ${category}
    ${features ? `Caractéristiques : ${features}` : ''}
    
    La description doit être courte (max 300 caractères), utiliser un ton local chaleureux (français de Côte d'Ivoire léger), et inclure des emojis. 
    Mets l'accent sur la qualité et pourquoi le client devrait l'acheter maintenant.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("AI Generation error:", error);
    return null;
  }
}

export async function getBusinessAdvice(stats: any) {
  try {
    const prompt = `En tant qu'expert en business e-commerce pour le marché ivoirien, analyse ces statistiques de vente et donne 3 conseils concrets pour augmenter le chiffre d'affaires.
    Stats : ${JSON.stringify(stats)}
    Donne les conseils sous forme de liste à puces.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("AI Advice error:", error);
    return null;
  }
}
