import { GoogleGenAI, Type } from "@google/genai";
import { AIScoringResult } from "../types";

const apiKey = process.env.API_KEY || '';

export const analyzeIssueWithAI = async (
  title: string,
  description: string,
  area: string
): Promise<AIScoringResult | null> => {
  if (!apiKey) {
    console.error("API Key is missing");
    return null;
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const prompt = `
      Você é um engenheiro sênior especialista em plantas de produção de BIOMETANO e Biogás.
      Analise o seguinte problema relatado na planta e sugira uma pontuação para a Matriz GUT (Gravidade, Urgência, Tendência).
      
      Área da Planta: ${area}
      Problema: ${title}
      Descrição Detalhada: ${description}

      Definições para pontuação (1 a 5):
      Gravidade (G): Impacto na segurança, qualidade do gás (pureza CH4), meio ambiente e ativos.
      Urgência (U): Pressão do tempo para resolver antes de falha crítica.
      Tendência (T): Potencial de agravamento do problema com o tempo.

      Retorne APENAS um objeto JSON com os campos: gravity, urgency, tendency (números inteiros de 1-5) e reasoning (uma explicação curta e técnica em português).
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            gravity: { type: Type.INTEGER, description: "Score from 1 to 5" },
            urgency: { type: Type.INTEGER, description: "Score from 1 to 5" },
            tendency: { type: Type.INTEGER, description: "Score from 1 to 5" },
            reasoning: { type: Type.STRING, description: "Technical explanation for the scores" },
          },
          required: ["gravity", "urgency", "tendency", "reasoning"],
        },
      },
    });

    const text = response.text;
    if (!text) return null;

    return JSON.parse(text) as AIScoringResult;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return null;
  }
};