
import { GoogleGenAI, Type } from "@google/genai";
import { AIScoringResult } from "../types";

export const analyzeIssueWithAI = async (
  title: string,
  description: string,
  area: string
): Promise<AIScoringResult | null> => {
  // Verificação segura da API Key para evitar ReferenceError: process is not defined
  let apiKey = "";
  try {
    apiKey = process.env.API_KEY || "";
  } catch (e) {
    console.error("Ambiente não suporta process.env diretamente.");
  }

  if (!apiKey || apiKey === "undefined") {
    throw new Error("API_KEY_MISSING: A chave de API não foi detectada no ambiente de produção.");
  }

  try {
    // Inicialização do SDK dentro da função conforme diretrizes
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
      Atue como Especialista Sênior em Segurança de Processos de Biometano.
      Analise tecnicamente e sugira a pontuação GUT (1 a 5) para:
      
      EVENTO: ${title}
      ÁREA: ${area}
      DESCRIÇÃO: ${description}

      Responda estritamente em JSON com as chaves: gravity, urgency, tendency (números de 1-5) e reasoning (texto curto).
    `;

    // Chamada simplificada para máxima compatibilidade
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
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
    if (!text) throw new Error("A IA não retornou conteúdo.");

    return JSON.parse(text.trim()) as AIScoringResult;
  } catch (error: any) {
    console.error("Erro na análise da IA:", error);
    throw error;
  }
};
