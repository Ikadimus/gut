
import { GoogleGenAI, Type } from "@google/genai";
import { AIScoringResult } from "../types";

export const analyzeIssueWithAI = async (
  title: string,
  description: string,
  area: string
): Promise<AIScoringResult | null> => {
  // A chave API deve ser obtida exclusivamente de process.env.API_KEY
  // Em produção, o seletor do AI Studio injeta a chave aqui automaticamente após a escolha do usuário.
  const apiKey = process.env.API_KEY;

  if (!apiKey || apiKey === "undefined" || apiKey === "") {
    throw new Error("AUTH_REQUIRED: Clique no botão 'Vincular Chave API' ou no ícone de conexão no topo para autorizar a IA.");
  }

  try {
    // Instanciamos o cliente no momento da chamada para garantir o uso da chave mais recente
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
      Você é um Engenheiro Sênior de Segurança de Processos em uma Usina de Purificação de Biometano.
      Sua tarefa é analisar o evento operacional abaixo e sugerir pontuações para a Matriz GUT (Gravidade, Urgência e Tendência).

      DADOS DA OCORRÊNCIA:
      - Título: ${title}
      - Subsistema/Área: ${area}
      - Descrição do Evento: ${description}

      CRITÉRIOS DE AVALIAÇÃO (Escala 1 a 5):
      - Gravity (G): Impacto no processo, segurança e meio ambiente.
      - Urgency (U): Prazo necessário para intervir.
      - Tendency (T): Probabilidade de agravamento se nada for feito.

      REQUISITOS DE RESPOSTA:
      - Retorne estritamente um JSON.
      - Campos: gravity (inteiro), urgency (inteiro), tendency (inteiro), reasoning (texto explicativo técnico de até 150 caracteres).
    `;

    // Utilizamos o gemini-3-pro-preview para análises técnicas que exigem alto raciocínio
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            gravity: { 
              type: Type.INTEGER,
              description: "Nota de 1 a 5 para Gravidade"
            },
            urgency: { 
              type: Type.INTEGER,
              description: "Nota de 1 a 5 para Urgência"
            },
            tendency: { 
              type: Type.INTEGER,
              description: "Nota de 1 a 5 para Tendência"
            },
            reasoning: { 
              type: Type.STRING,
              description: "Breve parecer técnico justificando as notas"
            },
          },
          required: ["gravity", "urgency", "tendency", "reasoning"],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("Falha na resposta: A IA não gerou conteúdo.");
    }

    return JSON.parse(text.trim()) as AIScoringResult;
  } catch (error: any) {
    console.error("Gemini Error:", error);
    
    // Tratamento para chave inválida ou erro de permissão
    if (error.message?.includes("Requested entity was not found") || error.message?.includes("API key not valid")) {
      throw new Error("CHAVE_INVALIDA: A chave de API selecionada é inválida ou não possui permissão para este modelo. Por favor, tente vincular novamente.");
    }
    
    throw error;
  }
};
