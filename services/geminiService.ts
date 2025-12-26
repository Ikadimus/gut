
import { GoogleGenAI, Type } from "@google/genai";
import { AIScoringResult } from "../types";

export const analyzeIssueWithAI = async (
  title: string,
  description: string,
  area: string
): Promise<AIScoringResult | null> => {
  const apiKey = process.env.API_KEY;

  if (!apiKey || apiKey === "undefined" || apiKey === "") {
    throw new Error("API_KEY_NOT_FOUND: Chave de API não configurada no ambiente. Verifique as configurações do projeto.");
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
      Você é um Engenheiro Sênior de Segurança de Processos em uma Usina de Purificação de Biometano.
      Analise o evento abaixo e sugira notas GUT (1-5).
      
      EVENTO:
      - Título: ${title}
      - Área: ${area}
      - Descrição: ${description}

      Retorne apenas o JSON com gravity, urgency, tendency e reasoning (máx 150 caracteres).
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            gravity: { type: Type.INTEGER },
            urgency: { type: Type.INTEGER },
            tendency: { type: Type.INTEGER },
            reasoning: { type: Type.STRING },
          },
          required: ["gravity", "urgency", "tendency", "reasoning"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("Resposta da IA vazia.");

    return JSON.parse(text.trim()) as AIScoringResult;
  } catch (error: any) {
    console.error("Gemini Error:", error);
    throw new Error(error.message || "Falha na análise da IA.");
  }
};
