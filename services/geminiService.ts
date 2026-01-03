
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { AIScoringResult, AIThermographyResult } from "../types";

export const analyzeIssueWithAI = async (
  title: string,
  description: string,
  area: string,
  immediateAction: string
): Promise<AIScoringResult | null> => {
  try {
    // Initializing Gemini API with direct usage of the environment variable API_KEY
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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

    // Using gemini-3-pro-preview for complex engineering evaluation
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
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

    // Directly accessing .text property from the response
    const text = response.text;
    if (!text) throw new Error("A IA retornou uma resposta vazia.");

    return JSON.parse(text.trim()) as AIScoringResult;
  } catch (error: any) {
    console.error("Erro na IA:", error);
    throw new Error(error.message || "Falha técnica na análise da IA.");
  }
};

export const analyzeThermographyWithAI = async (
  equipmentName: string,
  area: string,
  currentTemp: number,
  maxTemp: number,
  minTemp: number,
  notes: string
): Promise<AIThermographyResult | null> => {
  try {
    // Initializing Gemini API with direct usage of the environment variable API_KEY
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `
      Você é um Engenheiro Especialista em Termografia e Manutenção Preditiva para Usinas de Biometano (Essencis Caieiras).
      Realize uma análise técnica profunda do seguinte ativo:

      DADOS TÉCNICOS:
      - Equipamento: ${equipmentName}
      - Área: ${area}
      - Temperatura Atual: ${currentTemp}°C
      - Limite de Projeto (Máx): ${maxTemp}°C
      - Temperatura de Referência (Mín/Ambiente): ${minTemp}°C
      - RELATO DE CAMPO: ${notes || "O operador não informou sintomas adicionais."}

      INSTRUÇÕES CRÍTICAS:
      1. Use o RELATO DE CAMPO para correlacionar a temperatura com possíveis falhas mecânicas ou elétricas. Se o operador citar "ruído", considere falha de rolamento ou atrito. Se citar "cheiro", considere queima de isolamento.
      2. Analise o "Delta T" (Atual - Referência).
      3. Seja específico sobre riscos ao processo de purificação de biogás.

      REQUISITOS DE RESPOSTA (JSON):
      - analysis: Explicação técnica correlacionando os dados térmicos e o relato de campo. Máximo 300 caracteres.
      - recommendation: Ações de manutenção imediatas e preventivas.
      - riskLevel: Categorize como 'Baixo', 'Moderado', 'Alto' ou 'Crítico'.

      Mantenha um tom profissional e diagnóstico.
    `;

    // Using gemini-3-pro-preview for complex reasoning and diagnosis
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            analysis: { type: Type.STRING },
            recommendation: { type: Type.STRING },
            riskLevel: { 
              type: Type.STRING,
              description: "Must be one of: 'Baixo', 'Moderado', 'Alto', 'Crítico'."
            },
          },
          required: ["analysis", "recommendation", "riskLevel"],
        },
      },
    });

    // Directly accessing .text property from the response
    const text = response.text;
    if (!text) throw new Error("A IA retornou uma resposta vazia.");

    return JSON.parse(text.trim()) as AIThermographyResult;
  } catch (error: any) {
    console.error("Erro na IA Termográfica:", error);
    throw new Error(error.message || "Falha técnica na análise térmica da IA.");
  }
};
