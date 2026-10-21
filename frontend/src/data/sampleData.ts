import type {
  Task,
  Agent,
  LogEntry,
  Report,
  DashboardStats,
  ReportSection,
} from '@/types';

export const sampleStats: DashboardStats = {
  totalTasks: 24,
  completedTasks: 18,
  failedTasks: 3,
  runningTasks: 3,
};

export const sampleTasks: Task[] = [
  {
    id: 'task-001',
    title: 'Q4 Revenue Analysis',
    description: 'Analyze Q4 revenue streams across all product lines and identify growth opportunities.',
    type: 'data-analysis',
    status: 'completed',
    createdAt: '2026-10-09T09:30:00Z',
    completedAt: '2026-10-09T11:15:00Z',
    fileName: 'q4_revenue.csv',
  },
  {
    id: 'task-002',
    title: 'Competitor Market Research',
    description: 'Research top 5 competitors and summarize their positioning, pricing, and recent announcements.',
    type: 'market-research',
    status: 'running',
    createdAt: '2026-10-10T08:00:00Z',
    fileName: 'competitors.csv',
  },
  {
    id: 'task-003',
    title: 'Internal Financial Audit',
    description: 'Audit internal financial records for Q3 and flag any discrepancies.',
    type: 'financial-audit',
    status: 'completed',
    createdAt: '2026-10-07T14:00:00Z',
    completedAt: '2026-10-07T17:30:00Z',
  },
  {
    id: 'task-004',
    title: 'GDPR Compliance Review',
    description: 'Review data handling practices against GDPR requirements.',
    type: 'compliance-review',
    status: 'failed',
    createdAt: '2026-10-05T10:00:00Z',
    completedAt: '2026-10-05T10:45:00Z',
  },
  {
    id: 'task-005',
    title: 'Customer Churn Analysis',
    description: 'Identify patterns in customer churn over the past 6 months.',
    type: 'data-analysis',
    status: 'running',
    createdAt: '2026-10-10T07:15:00Z',
    fileName: 'churn_data.csv',
  },
];

export const sampleAgents: Agent[] = [
  {
    id: 'agent-planner',
    name: 'Planner',
    role: 'Strategic Planning',
    description: 'Decomposes the task into sub-tasks, assigns them to the right agents, and defines the execution order.',
    status: 'completed',
    order: 1,
  },
  {
    id: 'agent-analyst',
    name: 'Data Analyst',
    role: 'Data Processing',
    description: 'Cleans, transforms, and analyzes the uploaded datasets to extract meaningful patterns and metrics.',
    status: 'active',
    order: 2,
  },
  {
    id: 'agent-researcher',
    name: 'Researcher',
    role: 'Context Gathering',
    description: 'Gathers external context, benchmarks, and supporting information to enrich the analysis.',
    status: 'idle',
    order: 3,
  },
  {
    id: 'agent-reviewer',
    name: 'Reviewer',
    role: 'Quality Assurance',
    description: 'Validates findings, checks for inconsistencies, and ensures outputs meet quality standards.',
    status: 'idle',
    order: 4,
  },
  {
    id: 'agent-reporter',
    name: 'Report Generator',
    role: 'Report Synthesis',
    description: 'Compiles all agent outputs into a structured, executive-ready report with clear recommendations.',
    status: 'idle',
    order: 5,
  },
];

export const sampleLogs: LogEntry[] = [
  {
    id: 'log-001',
    timestamp: '2026-10-10T08:00:12Z',
    agent: 'Planner',
    status: 'success',
    message: 'Task decomposed into 4 sub-tasks',
    output: 'Sub-tasks: data_cleaning, trend_analysis, competitor_benchmark, report_draft',
  },
  {
    id: 'log-002',
    timestamp: '2026-10-10T08:00:45Z',
    agent: 'Data Analyst',
    status: 'running',
    message: 'Parsing uploaded CSV file (1,247 rows)',
    output: 'Detected columns: company, revenue, quarter, yoy_growth, market_share',
  },
  {
    id: 'log-003',
    timestamp: '2026-10-10T08:01:30Z',
    agent: 'Data Analyst',
    status: 'info',
    message: 'Data cleaning complete — 12 rows removed due to missing values',
  },
  {
    id: 'log-004',
    timestamp: '2026-10-10T08:02:15Z',
    agent: 'Data Analyst',
    status: 'warning',
    message: 'Outlier detected in revenue column for row 843',
    output: 'Value $4.2M is 15x the median. Flagged for review.',
  },
  {
    id: 'log-005',
    timestamp: '2026-10-10T08:03:00Z',
    agent: 'Researcher',
    status: 'info',
    message: 'Waiting for Data Analyst to complete processing',
  },
  {
    id: 'log-006',
    timestamp: '2026-10-09T11:14:50Z',
    agent: 'Reviewer',
    status: 'success',
    message: 'All findings validated. 0 inconsistencies found.',
    output: 'Quality score: 96/100. Approved for report generation.',
  },
  {
    id: 'log-007',
    timestamp: '2026-10-09T11:15:05Z',
    agent: 'Report Generator',
    status: 'success',
    message: 'Report generated successfully (12 pages, 4 charts)',
    output: 'Report ID: rpt-001 saved to Reports.',
  },
  {
    id: 'log-008',
    timestamp: '2026-10-05T10:42:00Z',
    agent: 'Data Analyst',
    status: 'error',
    message: 'Failed to parse CSV — invalid encoding detected',
    output: 'Error: Expected UTF-8 encoding but file uses ISO-8859-1. Task aborted.',
  },
];

const reportSections1: ReportSection[] = [
  {
    id: 'sec-1-1',
    heading: 'Executive Summary',
    content: 'Q4 saw a 14.2% year-over-year revenue increase, driven primarily by the Enterprise tier expansion. Three product lines exceeded targets, while one underperformed by 8%.',
  },
  {
    id: 'sec-1-2',
    heading: 'Revenue by Product Line',
    content: 'Enterprise SaaS: $2.4M (+22%), Professional Services: $1.1M (+6%), Self-Serve: $780K (-8%), Training: $340K (+12%). Total Q4 revenue: $4.62M.',
  },
  {
    id: 'sec-1-3',
    heading: 'Key Findings',
    content: '1. Enterprise expansion is the primary growth driver. 2. Self-Serve churn increased to 11%. 3. Professional Services margins improved by 3pp. 4. Training revenue shows seasonal strength.',
  },
  {
    id: 'sec-1-4',
    heading: 'Recommendations',
    content: 'Prioritize Enterprise customer success initiatives. Investigate Self-Serve onboarding friction. Scale Training offerings for Q1 seasonal demand.',
  },
];

const reportSections2: ReportSection[] = [
  {
    id: 'sec-2-1',
    heading: 'Executive Summary',
    content: 'Q3 internal financial audit reviewed 847 transactions across 6 departments. Two discrepancies identified and resolved. Overall financial controls rated strong.',
  },
  {
    id: 'sec-2-2',
    heading: 'Audit Scope',
    content: 'Departments audited: Engineering, Sales, Marketing, Operations, Finance, HR. Transaction volume: 847. Date range: Jul 1 – Sep 30, 2026.',
  },
  {
    id: 'sec-2-3',
    heading: 'Discrepancies Found',
    content: '1. Marketing: $4,200 invoice duplicated (resolved). 2. Operations: $1,800 misclassified expense (reclassified). No evidence of fraud or systemic issues.',
  },
  {
    id: 'sec-2-4',
    heading: 'Control Assessment',
    content: 'Approval workflows: Effective. Segregation of duties: Effective. Reconciliation processes: Effective with minor improvement needed in Marketing.',
  },
];

export const sampleReports: Report[] = [
  {
    id: 'rpt-001',
    title: 'Q4 Revenue Analysis Report',
    summary: 'Comprehensive analysis of Q4 revenue across all product lines with growth recommendations.',
    type: 'data-analysis',
    createdAt: '2026-10-09T11:15:00Z',
    status: 'final',
    sections: reportSections1,
  },
  {
    id: 'rpt-002',
    title: 'Q3 Internal Financial Audit',
    summary: 'Full audit of Q3 financial records across 6 departments with control assessment.',
    type: 'financial-audit',
    createdAt: '2026-10-07T17:30:00Z',
    status: 'final',
    sections: reportSections2,
  },
];
