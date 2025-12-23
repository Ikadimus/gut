
import { GoogleGenAI, Type } from "@google/genai";
import { AIScoringResult } from "../types";

export const analyzeIssueWithAI = async (
  title: string,
  description: string,
  area: string
): Promise<AIScoringResult | null> => {
  // O SDK da Gemini injeta automaticamente a chave selecionada no process.env.API_KEY
  const apiKey = process.env.API_KEY;

  if (!apiKey || apiKey === "undefined" || apiKey === "") {
    throw new Error("API_KEY_NOT_FOUND: Por favor, clique em 'Selecionar Chave API' para autorizar a IA.");
  }

  try {
    // Sempre instanciar um novo cliente antes da chamada para garantir a chave mais atual
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
      Sua função é atuar como Analista Sênior de Riscos para uma Usina de Purificação de Biometano.
      Avalie o seguinte evento operacional e forneça a pontuação GUT (1 a 5).

      DADOS DO EVENTO:
      - Título: ${title}
      - Área da Planta: ${area}
      - Descrição Técnica: ${description}

      REGRAS DE RESPOSTA:
      - Retorne APENAS um objeto JSON.
      - Campos: gravity, urgency, tendency (números 1-5).
      - Field 'reasoning': Uma breve explicação técnica (máx 150 caracteres).
    `;

    // Usamos o gemini-3-pro-preview para tarefas de raciocínio técnico complexo
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

    const resultText = response.text;
    if (!resultText) {
      throw new Error("A IA não conseguiu gerar uma análise válida.");
    }

    return JSON.parse(resultText) as AIScoringResult;
  } catch (error: any) {
    console.error("Erro Crítico Gemini:", error);
    
    // Tratamento específico para entidade não encontrada (chave inválida ou projeto incorreto)
    if (error.message?.includes("Requested entity was not found")) {
      throw new Error("CHAVE_INVALIDA: A chave selecionada não possui acesso a este modelo ou projeto. Tente novamente.");
    }
    
    throw error;
  }
};
