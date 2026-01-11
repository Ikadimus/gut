
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

export enum UserRole {
  DEVELOPER = 'Desenvolvedor',
  ADMIN = 'Administrador',
  EDITOR = 'Editor',
  VIEWER = 'Visualizador'
}

export interface RolePermissions {
  role: string;
  can_view_dashboard: boolean;
  can_view_sector: boolean;
  can_view_gut: boolean;
  can_view_thermo: boolean;
  can_view_assets: boolean;
  can_view_users: boolean;
  can_view_settings: boolean;
  can_view_reports: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: string;
  sector?: string;
  createdAt: string;
}

export interface Equipment {
  id: string;
  tag: string;
  name: string;
  areaName: string;
  imageUrl?: string;
  minRotation?: number;
  maxRotation?: number;
  minTemp?: number;
  maxTemp?: number;
  lastMaintenance?: string;
  lastLubrication?: string;
  technicalDescription?: string;
  installationDate?: string;
}

export interface GUTIssue {
  id: string;
  title: string;
  description: string;
  immediateAction?: string;
  area: string;
  equipmentName?: string;
  gravity: number;
  urgency: number;
  tendency: number;
  score: number;
  status: Status;
  createdAt: string;
  aiSuggestion?: string;
  aiActionSuggestion?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  resolution?: string;
  aiResolutionEvaluation?: string;
}

export interface AIScoringResult {
  gravity: number;
  urgency: number;
  tendency: number;
  reasoning: string;
  actionComment: string;
}

export interface AIThermographyResult {
  analysis: string;
  recommendation: string;
  riskLevel: 'Baixo' | 'Moderado' | 'Alto' | 'Crítico';
}

export interface ThermographyRecord {
  id: string;
  equipmentName: string;
  area: string;
  currentTemp: number;
  maxTemp: number;
  minTemp: number;
  lastInspection: string;
  createdAt: string;
  notes?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  aiAnalysis?: string;
  aiRecommendation?: string;
  riskLevel?: string;
}

export interface SystemSettings {
  id?: string;
  criticalThreshold: number;
  warningThreshold: number;
  individualCriticalThreshold: number;
  individualWarningThreshold: number;
  accentColor: string;
  colorNormal: string;
  colorWarning: string;
  colorCritical: string;
}
