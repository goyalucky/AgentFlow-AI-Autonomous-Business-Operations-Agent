// Core domain types for AgentFlow AI

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed';
export type TaskType = 'data-analysis' | 'market-research' | 'financial-audit' | 'compliance-review' | 'custom';

export type AgentStatus = 'idle' | 'active' | 'completed' | 'error';
export type AgentName = 'Planner' | 'Data Analyst' | 'Researcher' | 'Reviewer' | 'Report Generator';

export type LogStatus = 'info' | 'success' | 'warning' | 'error' | 'running';

// --- SubTask & Analyst Types ---
export interface SubTask {
  task_id: number;
  title: string;
  assigned_agent: string;
  tool_required: string;
  description: string;
}

export interface AnalystInspection {
  columns: string[];
  row_count: number;
  missing_values: Record<string, number>;
  sample_records: Record<string, any>[];
}

export interface AnalystMetrics {
  selected_metric_column?: string;
  selected_date_column?: string;
  mean: number;
  median: number;
  min: number;
  max: number;
  anomaly_count: number;
  anomalies: number[];
  average_growth_rate?: string;
  error?: string;
}

export interface AnalystExecutionResult {
  inspection: AnalystInspection;
  metrics: AnalystMetrics;
  insights: string;
}

export interface Phase2BackendResponse {
  status: string;
  plan: {
    objective: string;
    tasks: SubTask[];
  };
  analyst_execution: AnalystExecutionResult | null;
}

// --- Phase 3 LangGraph State Models ---
export interface ResearchSource {
  title: string;
  snippet: string;
  link: string;
}

export interface ResearchOutput {
  search_query: string;
  sources: ResearchSource[];
  brief: string;
}

export interface ReviewerOutput {
  validation_status: string;
  audit_summary: string;
}

export interface WorkflowState {
  task_id: string;
  objective: string;
  file_path: string | null;
  target_metric: string | null;
  date_col: string | null;
  plan: {
    objective: string;
    tasks: SubTask[];
  } | null;
  analyst_output: AnalystExecutionResult | null;
  research_output: ResearchOutput | null;
  reviewer_output: ReviewerOutput | null;
  current_step: string;
  errors: string[];
}

export interface Phase3BackendResponse {
  status: string;
  state: WorkflowState;
}

// --- General Application Models ---
export interface Task {
  id: string;
  title: string;
  description: string;
  type: TaskType;
  status: TaskStatus;
  createdAt: string;
  completedAt?: string;
  fileName?: string;
  phase2Data?: Phase2BackendResponse;
  workflowState?: WorkflowState;
}

export interface Agent {
  id: string;
  name: AgentName;
  role: string;
  description: string;
  status: AgentStatus;
  order: number;
}

export interface LogEntry {
  id: string;
  taskId?: string;
  agent: AgentName;
  status: LogStatus;
  message: string;
  output?: string;
  timestamp: string;
}

export interface Report {
  id: string;
  title: string;
  summary: string;
  type: TaskType;
  createdAt: string;
  status: 'draft' | 'final' | 'archived';
  sections: ReportSection[];
}

export interface ReportSection {
  id: string;
  heading: string;
  content: string;
}

export interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  runningTasks: number;
}