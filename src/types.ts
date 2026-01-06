export interface VisaStrategy {
  primaryPath: string;
  backupPaths: string[];
  eligibilityScore: number; // 0–100
  riskLevel: "Low" | "Medium" | "High";
  riskReasons: string[];
  countryRedFlags: string[];
}

export interface VisaOption {
  name: string;
  description: string;
  suitabilityReason: string;
}

export interface ChecklistItem {
  id: string;
  category: "identity" | "finances" | "education" | "employment" | "other";
  label: string;
  details: string;
  importance: "high" | "medium" | "low";
}

export interface TimelineStep {
  title: string;
  description: string;
  estimatedDuration: string;
  delayRisk?: "Low" | "Medium" | "High";
}

export interface ApprovalSimulation {
  approvalProbability: number; // 0–100
  confidenceLabel: "Low" | "Medium" | "High";
  topRejectionRisks: string[];
  fastestImprovements: {
    action: string;
    impactPercent: number;
  }[];
}

export interface MobilityScore {
  score: number; // 0–100
  explanation: string;
}

export interface PlanResponse {
  mobilityScore: MobilityScore;
  approvalSimulation: ApprovalSimulation;
  strategy: VisaStrategy;
  visaComparison: {
    visa: string;
    approvalProbability: number;
    processingTime: string;
    riskLevel: "Low" | "Medium" | "High";
  }[];
  checklist: ChecklistItem[];
  timeline: TimelineStep[];
  relocationTips: string[];
}


export interface DocumentCheckResponse {
  overallAssessment: string;
  rejectionProbability: "Low" | "Medium" | "High";
  issues: {
    type: "missing-info" | "low-quality" | "inconsistency" | "warning";
    severity: "low" | "medium" | "high";
    message: string;
    suggestion: string;
  }[];
}
