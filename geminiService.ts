import { GoogleGenAI, Type } from "@google/genai";
import { AIScoringResult } from "../types";

export const analyzeIssueWithAI = async (
  title: string,
  description: string,
  area: string
): Promise<AIScoringResult | null> => {
  // A chave de API deve ser lida diretamente do ambiente
  const apiKey = process.env.API_KEY;

  if (!apiKey || apiKey === "undefined") {
    console.error("AI_CONFIG_ERROR: Chave de API (process.env.API_KEY) não configurada no ambiente.");
    return null;
  }

  try {
    // Inicialização conforme as diretrizes do Google GenAI SDK
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
      Você é um Consultor Sênior de Segurança Operacional e Especialista em Upgrading de Biogás (Plantas de Biometano).
      Sua missão é realizar uma análise técnica de risco baseada na metodologia GUT (Gravidade, Urgência e Tendência).

      DADOS TÉCNICOS:
      - Subsistema: ${area}
      - Evento: ${title}
      - Contexto Detalhado: ${description}

      DIRETRIZES DE PONTUAÇÃO (Escala 1 a 5):
      - Gravidade (G): Impacto na pureza do gás (CH4), danos a membranas, contaminação de catalisadores ou riscos de explosão/incêndio.
      - Urgência (U): Tempo disponível para intervenção antes de uma parada não programada ou violação de normas da ANP.
      - Tendência (T): Se nada for feito agora, o problema escalará para uma falha catastrófica ou é um desvio estável?

      Responda EXCLUSIVAMENTE em formato JSON.
    `;

    // Chamada direta conforme regras da biblioteca
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            gravity: { type: Type.INTEGER, description: "Pontuação de Gravidade (1-5)" },
            urgency: { type: Type.INTEGER, description: "Pontuação de Urgência (1-5)" },
            tendency: { type: Type.INTEGER, description: "Pontuação de Tendência (1-5)" },
            reasoning: { type: Type.STRING, description: "Breve justificativa técnica da análise" },
          },
          required: ["gravity", "urgency", "tendency", "reasoning"],
        },
      },
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("O modelo retornou uma resposta vazia.");
    }

    return JSON.parse(resultText) as AIScoringResult;
  } catch (error: any) {
    console.error("AI_RUNTIME_ERROR:", error);
    // Repassa o erro de forma que possamos identificar se é 401 (Chave), 429 (Limite) ou 500 (Modelo)
    throw error;
  }
};