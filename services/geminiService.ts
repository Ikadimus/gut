import { GoogleGenAI, Type } from "@google/genai";
import { AIScoringResult } from "../types";

export const analyzeIssueWithAI = async (
  title: string,
  description: string,
  area: string
): Promise<AIScoringResult | null> => {
  // Inicialização estritamente dentro da função para capturar a chave de API injetada no ambiente de produção
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("AI_ERROR: API Key não detectada no ambiente de produção.");
    return null;
  }

  // Criação da instância no momento do disparo para evitar estados obsoletos
  const ai = new GoogleGenAI({ apiKey });

  try {
    const prompt = `
      Você é um Consultor Sênior de Segurança Operacional e Especialista em Upgrading de Biogás (Plantas de Biometano).
      Sua missão é realizar uma análise técnica de risco baseada na metodologia GUT (Gravidade, Urgência e Tendência).

      DADOS TÉCNICOS:
      - Subsistema: ${area}
      - Evento: ${title}
      - Contexto Detalhado: ${description}

      DIRETRIZES DE PONTUAÇÃO (Escala 1 a 5):
      - Gravidade (G): Considere o impacto na pureza do gás (CH4), danos a membranas, contaminação de catalisadores ou riscos explosivos.
      - Urgência (U): Analise o tempo disponível para intervenção antes de uma parada não programada ou violação de normas ANP.
      - Tendência (T): Se nada for feito, o problema escalará para uma falha catastrófica rapidamente ou é um desvio estável?

      Responda EXCLUSIVAMENTE em formato JSON.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            gravity: { type: Type.INTEGER, description: "Peso G (1-5)" },
            urgency: { type: Type.INTEGER, description: "Peso U (1-5)" },
            tendency: { type: Type.INTEGER, description: "Peso T (1-5)" },
            reasoning: { type: Type.STRING, description: "Justificativa técnica concisa para a pontuação" },
          },
          required: ["gravity", "urgency", "tendency", "reasoning"],
        },
      },
    });

    const resultText = response.text;
    if (!resultText) throw new Error("Resposta da IA vazia.");

    return JSON.parse(resultText) as AIScoringResult;
  } catch (error) {
    console.error("GENAI_CORE_ERROR:", error);
    return null;
  }
};