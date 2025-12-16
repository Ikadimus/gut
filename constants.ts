import { PlantArea, GUTIssue, Status } from './types';

export const GUT_SCALES = {
  gravity: [
    { value: 1, label: '1 - Sem gravidade (Danos leves)' },
    { value: 2, label: '2 - Pouco grave (Pequenas perdas)' },
    { value: 3, label: '3 - Grave (Perdas processo/qualidade)' },
    { value: 4, label: '4 - Muito grave (Parada parcial/Segurança)' },
    { value: 5, label: '5 - Extremamente grave (Parada total/Risco vida)' },
  ],
  urgency: [
    { value: 1, label: '1 - Pode esperar (Planejamento longo)' },
    { value: 2, label: '2 - Pouco urgente (Próxima manutenção)' },
    { value: 3, label: '3 - Urgente (Intervir brevemente)' },
    { value: 4, label: '4 - Muito urgente (Intervir agora)' },
    { value: 5, label: '5 - Imediata (Emergência total)' },
  ],
  tendency: [
    { value: 1, label: '1 - Não irá piorar' },
    { value: 2, label: '2 - Piorará a longo prazo' },
    { value: 3, label: '3 - Piorará a médio prazo' },
    { value: 4, label: '4 - Piorará a curto prazo' },
    { value: 5, label: '5 - Piorará imediatamente' },
  ]
};

export const MOCK_ISSUES: GUTIssue[] = [
  {
    id: '1',
    title: 'Saturação Filtro Carvão Ativado',
    description: 'Leituras de H2S na saída do vaso V-101 estão subindo rapidamente (50ppm). Risco de contaminar membranas.',
    area: PlantArea.DESULFURIZATION,
    gravity: 5,
    urgency: 4,
    tendency: 5,
    score: 100,
    status: Status.OPEN,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Vibração Compressor C-202',
    description: 'Vibração acima do normal no estágio 2, mas temperatura estável.',
    area: PlantArea.COMPRESSION,
    gravity: 3,
    urgency: 3,
    tendency: 2,
    score: 18,
    status: Status.IN_PROGRESS,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: '3',
    title: 'Queda de Pressão Permeado',
    description: 'Diferencial de pressão no banco 1 de membranas aumentou 5%.',
    area: PlantArea.MEMBRANES,
    gravity: 3,
    urgency: 2,
    tendency: 2,
    score: 12,
    status: Status.OPEN,
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  }
];
