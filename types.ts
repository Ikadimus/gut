export enum PlantArea {
  PRE_TREATMENT = 'Pré-tratamento (Desumidificação/Partículas)',
  DESULFURIZATION = 'Dessulfurização (H2S Removal)',
  COMPRESSION = 'Compressão & Resfriamento',
  MEMBRANES = 'Membranas de Separação (Upgrading)',
  FLARE = 'Flare / Queimador',
  STORAGE = 'Armazenamento & Odorização',
  AUTOMATION = 'Automação & PLC',
  UTILITIES = 'Utilidades Gerais'
}

export enum Status {
  OPEN = 'Aberto',
  IN_PROGRESS = 'Em Análise',
  MITIGATED = 'Mitigado',
  RESOLVED = 'Resolvido'
}

export interface GUTIssue {
  id: string;
  title: string;
  description: string;
  area: string; // Changed from PlantArea to string to allow dynamic areas
  gravity: number; // 1-5
  urgency: number; // 1-5
  tendency: number; // 1-5
  score: number; // G * U * T
  status: Status;
  createdAt: string;
  aiSuggestion?: string;
}

export interface AIScoringResult {
  gravity: number;
  urgency: number;
  tendency: number;
  reasoning: string;
}
