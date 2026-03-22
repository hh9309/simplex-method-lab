export enum SimplexStatus {
  OPTIMAL = '找到最优解 (Optimal)',
  UNBOUNDED = '解无界 (Unbounded)',
  INFEASIBLE = '无可行解 (Infeasible)',
  IN_PROGRESS = '计算中 (In Progress)',
  NOT_STARTED = '未开始'
}

export interface LPProblem {
  numVariables: number;
  numConstraints: number;
  objective: number[]; // Coefficients of Z = c1x1 + c2x2 ...
  constraints: number[][]; // Matrix of LHS coefficients
  rhs: number[]; // Right hand side values
}

// Represents one state of the Tableau
export interface TableauState {
  stepIndex: number;
  tableau: number[][]; // The full grid including slack variables and Z row
  basicVariables: number[]; // Indices of variables currently in the basis (for each row)
  variableNames: string[]; // Headers like x1, x2, s1, s2, RHS
  pivotRow?: number; // Index of the leaving row
  pivotCol?: number; // Index of the entering column
  enteringVar?: string;
  leavingVar?: string;
  zValue: number;
  description: string;
  status: SimplexStatus;
}

export interface SimplexResult {
  steps: TableauState[];
  finalStatus: SimplexStatus;
}

export type AIProvider = 'gemini' | 'deepseek';

export interface AIConfig {
  provider: AIProvider;
  deepSeekKey?: string; // Optional, handled via UI input
  geminiKey?: string;   // Optional, handled via UI input
}