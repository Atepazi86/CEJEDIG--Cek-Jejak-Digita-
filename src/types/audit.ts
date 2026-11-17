export interface BreachIncident {
  id: string;
  breach: string;
  domain: string;
  year: string;
  industry: string;
  passwordRisk: string;
  exposedData: string[];
  recordsCount: number;
  details: string;
  verified: boolean;
  confirmed: boolean;
}

export interface BreachCheckResponse {
  status: 'clean' | 'exposed';
  breachCount: number;
  breaches: Omit<BreachIncident, 'confirmed'>[];
  source: string;
}

export interface OsintQueryItem {
  id: string;
  pathway: 'name' | 'phone';
  category: string;
  title: string;
  description: string;
  query: string;
  googleUrl: string;
  confirmed: boolean;
  note: string;
}

export type NameFindingSeverity = 'aman' | 'waspada' | 'bahaya';

export interface NameSearchFinding {
  id: string;
  title: string;
  url: string;
  domain: string;
  category: string;
  severity: NameFindingSeverity;
  reason: string;
  exposedElements: string[];
  confirmed: boolean;
}

export interface NameSearchResponse {
  status: 'clean' | 'found';
  summary: string;
  findings: Omit<NameSearchFinding, 'confirmed'>[];
}

export interface CarrierAnalysis {
  normalizedLocal: string;
  normalizedIntl: string;
  normalizedDash: string;
  whatsappFormat: string;
  carrier: string;
  isValidIndonesianMobile: boolean;
  riskNotes: string[];
}

export interface RiskScenario {
  title: string;
  severity: 'Rendah' | 'Sedang' | 'Tinggi' | 'Kritis';
  attackVector: string;
  combinedDataUsed: string[];
  explanation: string;
}

export interface PriorityAction {
  priority: number;
  title: string;
  category: string;
  description: string;
  officialLinkLabel?: string;
  officialLinkUrl?: string;
}

export interface DefenseChecklistItem {
  id: string;
  task: string;
  targetService: string;
  urgency: 'Segera' | 'Tinggi' | 'Normal';
  howTo: string;
  completed?: boolean;
}

export interface TakedownDraftTemplate {
  id: string;
  title: string;
  recipientType: string;
  legalBasis: string;
  subject: string;
  body: string;
}

export interface ExposureAnalysisResult {
  exposureScore: number;
  riskLevel: 'Rendah' | 'Sedang' | 'Tinggi' | 'Kritis';
  scoreBreakdown: {
    emailImpact: number;
    publicIdentityImpact: number;
    phoneExposureImpact: number;
    correlationMultiplier: string;
  };
  executiveSummary: string;
  riskScenarios: RiskScenario[];
  priorityActions: PriorityAction[];
  accountDefenseChecklist: DefenseChecklistItem[];
  takedownDrafts: TakedownDraftTemplate[];
}

export interface CustomTakedownResult {
  subject: string;
  recipientSuggestion: string;
  legalBasis: string;
  letterBody: string;
  sendingTips: string[];
}
