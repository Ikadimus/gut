
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { AIScoringResult, AIThermographyResult, AIVibrationResult } from "../types";

export const analyzeIssueWithAI = async (
  title: string,
  description: string,
  area: string,
  immediateAction: string
): Promise<AIScoringResult | null> => {
  try {
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

    const response: GenerateContentResponse = await ai.models.generateContent({
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

export const evaluateResolutionWithAI = async (
  title: string,
  description: string,
  resolution: string
): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `
      Você é um Auditor Técnico de Processos de Biometano. 
      Analise a SOLUÇÃO que foi aplicada para o problema abaixo e dê um veredito técnico (validação).

      PROBLEMA: "${title}" - ${description}
      SOLUÇÃO APLICADA: "${resolution}"

      REQUISITOS DA RESPOSTA:
      - Seja direto e extremamente técnico.
      - Valide se a solução resolve a causa raiz ou apenas o sintoma.
      - Mencione riscos residuais se houver (ex: pressão, H2S, integridade de membranas).
      - Conclua com "SOLUÇÃO VALIDADA" ou "RECOMENDA-SE REVISÃO ADICIONAL".
      - Máximo 400 caracteres.
    `;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        temperature: 0.5,
      },
    });

    return response.text || "Não foi possível gerar a avaliação técnica.";
  } catch (error: any) {
    console.error("Erro na avaliação da resolução:", error);
    return "Falha técnica ao consultar a IA para avaliação da solução.";
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

      REQUISITOS DE RESPOSTA (JSON):
      - analysis: Explicação técnica correlacionando os dados térmicos e o relato de campo. Máximo 300 caracteres.
      - recommendation: Ações de manutenção imediatas e preventivas.
      - riskLevel: Categorize como 'Baixo', 'Moderado', 'Alto' ou 'Crítico'.

      Mantenha um tom profissional e diagnóstico.
    `;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
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

    const text = response.text;
    if (!text) throw new Error("A IA retornou uma resposta vazia.");

    return JSON.parse(text.trim()) as AIThermographyResult;
  } catch (error: any) {
    console.error("Erro na IA Termográfica:", error);
    throw new Error(error.message || "Falha técnica na análise térmica da IA.");
  }
};

export const analyzeVibrationWithAI = async (
  equipmentName: string,
  area: string,
  velocity: number,
  acceleration: number,
  peakFreq: number,
  notes: string
): Promise<AIVibrationResult | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `
      Você é um Especialista em Análise de Vibração e Manutenção Preditiva Industrial.
      Avalie o seguinte ativo da usina de biometano:

      DADOS DE VIBRAÇÃO:
      - Ativo: ${equipmentName} (${area})
      - Velocidade Global (RMS): ${velocity} mm/s
      - Aceleração Global: ${acceleration} g
      - Frequência de Pico Observada: ${peakFreq || 'Não informada'} Hz
      - NOTAS DE CAMPO: ${notes}

      REQUISITOS DE RESPOSTA (JSON):
      - analysis: Diagnóstico técnico com base na severidade de vibração (use ISO 10816 como referência). Indique se há sinais de desbalanceamento, desalinhamento, folga ou falha em rolamento.
      - recommendation: Ação imediata (ex: balanceamento, reaperto, substituição).
      - riskLevel: 'Normal', 'Alerta', 'Perigoso' ou 'Crítico'.

      Seja extremamente preciso e técnico.
    `;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            analysis: { type: Type.STRING },
            recommendation: { type: Type.STRING },
            riskLevel: { type: Type.STRING },
          },
          required: ["analysis", "recommendation", "riskLevel"],
        },
      },
    });

    // Added fix: safety check for response.text property.
    const text = response.text;
    if (!text) throw new Error("A IA retornou uma resposta vazia.");

    return JSON.parse(text.trim()) as AIVibrationResult;
  } catch (error: any) {
    console.error("Erro na IA de Vibração:", error);
    throw new Error("Falha na análise vibracional da IA.");
  }
};

export const explainSystemToUser = async (question: string, userName: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const context = `
      Você é a "BIOHUB", a Central de Inteligência e Wiki técnica da plataforma "Biometano GUT Matrix".
      Seu objetivo é guiar o usuário ${userName} exclusivamente sobre o funcionamento do sistema e metodologias aplicadas.

      RESTRICÇÕES CRÍTICAS (LEIA COM ATENÇÃO):
      - Você NÃO tem sensores em tempo real na planta física.
      - Você NÃO conhece o estado atual da usina além dos registros salvos no banco de dados deste sistema.
      - Se o usuário perguntar algo sobre a planta que não está no sistema (ex: "como está a pressão agora?"), você deve responder que não possui acesso a telemetria externa direta e que ele deve consultar os painéis do PLC ou os registros de campo no sistema.

      SUA IDENTIDADE:
      - Nome: BIOHUB.
      - Papel: Wiki do Sistema, Consultora de Metodologia GUT e Guia de Interface.
      - Personalidade: Extremamente técnica, organizada e transparente sobre suas limitações.

      REGRAS DE RESPOSTA:
      1. Sempre comece a primeira resposta saudando o usuário: "Olá ${userName}!".
      2. Deixe claro que você é a BIOHUB, o guia do sistema.
      3. Explique livremente: Metodologia GUT, Lógica de Termografia, Análise de Vibração, Gestão de Ativos e Uso da Interface.
      4. Desenvolvedor: Cite 6580005 como o arquiteto desta infraestrutura digital.

      ESTILO:
      - Markdown (negrito, tabelas, listas).
      - Tom de mentoria técnica.
    `;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `USUÁRIO: ${userName}\nCONTEXTO:\n${context}\n\nPERGUNTA: ${question}`,
      config: {
        temperature: 0.7,
      },
    });

    return response.text || "Erro ao processar requisição na BIOHUB.";
  } catch (error: any) {
    console.error("Erro no BIOHUB:", error);
    return "Falha de conexão com a Wiki BIOHUB.";
  }
};
