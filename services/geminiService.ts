
import { GoogleGenAI, Type } from "@google/genai";
import { AIScoringResult } from "../types";

export const analyzeIssueWithAI = async (
  title: string,
  description: string,
  area: string
): Promise<AIScoringResult | null> => {
  // Use direct process.env.API_KEY initialization as per guidelines
  const apiKey = process.env.API_KEY;

  if (!apiKey || apiKey === "undefined" || apiKey === "") {
    throw new Error("API_KEY_NOT_FOUND: Chave de API não configurada. Use o botão 'ATIVAR IA' no topo.");
  }

  try {
    // Inicializa o cliente com a chave configurada seguindo as diretrizes do SDK: new GoogleGenAI({ apiKey: process.env.API_KEY })
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

    const prompt = `
      Você é um Engenheiro Sênior de Segurança de Processos em uma Usina de Purificação de Biometano.
      Analise o evento abaixo e sugira notas para a Matriz GUT (1 a 5).
      
      CRITÉRIOS:
      - Gravidade (G): Impacto no processo/segurança.
      - Urgência (U): Prazo para ação.
      - Tendência (T): Potencial de piora se nada for feito.

      EVENTO PARA ANÁLISE:
      - Título: ${title}
      - Área: ${area}
      - Descrição: ${description}

      Retorne estritamente um JSON com: gravity (int), urgency (int), tendency (int) e reasoning (string, max 150 caracteres).
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
          },
          required: ["gravity", "urgency", "tendency", "reasoning"],
        },
      },
    });

    // Directly access the .text property from GenerateContentResponse as per guidelines (not a method)
    const text = response.text;
    if (!text) throw new Error("A IA retornou uma resposta vazia.");

    return JSON.parse(text.trim()) as AIScoringResult;
  } catch (error: any) {
    console.error("Erro na Chamada Gemini:", error);
    // Tratamento amigável para erro de cota
    if (error.message?.includes("429") || error.message?.includes("quota")) {
      throw new Error("Limite de requisições da IA atingido. Tente novamente em alguns segundos.");
    }
    throw new Error(error.message || "Falha técnica na análise da IA.");
  }
};
