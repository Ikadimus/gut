
import { GoogleGenAI, Type } from "@google/genai";
import { AIScoringResult } from "../types";

export const analyzeIssueWithAI = async (
  title: string,
  description: string,
  area: string,
  immediateAction: string
): Promise<AIScoringResult | null> => {
  const apiKey = process.env.API_KEY;

  if (!apiKey || apiKey === "undefined" || apiKey === "") {
    throw new Error("API_KEY_NOT_FOUND: Chave de API não configurada.");
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

    const prompt = `
      Você é um Engenheiro Sênior de Processos em uma Usina de Purificação de Biometano.
      Sua tarefa é avaliar um evento operacional e a resposta proposta pelo operador.

      CONTEÚDO:
      - Evento: ${title} (${area})
      - Relato: ${description}
      - Ação Proposta pelo Operador: ${immediateAction || "Nenhuma ação informada"}

      REQUISITOS DE RESPOSTA (JSON):
      1. gravity, urgency, tendency: Notas de 1 a 5 seguindo a metodologia GUT.
      2. reasoning: Uma análise técnica concisa sobre POR QUE essas notas foram dadas (focado no problema).
      3. actionComment: Uma análise CRÍTICA sobre a Ação Proposta. Se a ação for boa, valide-a. Se for insuficiente para biometano (risco de H2S, explosão, contaminação de membranas), sugira o refinamento correto.

      Mantenha os textos curtos e técnicos.
    `;

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
            actionComment: { type: Type.STRING },
          },
          required: ["gravity", "urgency", "tendency", "reasoning", "actionComment"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("A IA retornou uma resposta vazia.");

    return JSON.parse(text.trim()) as AIScoringResult;
  } catch (error: any) {
    console.error("Erro na IA:", error);
    throw new Error(error.message || "Falha técnica na análise da IA.");
  }
};
