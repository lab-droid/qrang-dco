export enum StepStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export enum StepType {
  SEARCH = 'SEARCH',
  PLANNING = 'PLANNING',
  CREATION = 'CREATION',
  CHANNELS = 'CHANNELS',
  STRATEGY = 'STRATEGY',
  FINAL = 'FINAL'
}

export interface MarketingDetails {
  targetAudience: string;
  toneOfVoice: string;
  marketingGoal: string;
  additionalKeywords: string;
}

export interface ProcessingStep {
  id: StepType;
  label: string;
  description: string;
  status: StepStatus;
  result?: string;
}

export interface DCOContext {
  productName: string;
  productFeatures: string;
}

export interface GeneratedCreative {
  id: number;
  title: string;
  mainCopy: string;
  subCopy: string;
  imageBase64: string;
  reasoning: string;
}
