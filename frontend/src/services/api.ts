/**
 * API Service Module — AgentFlow AI
 * Complete integration: SSE streaming, live tasks, logs, agent states, and reports.
 */

import type {
  Task,
  Agent,
  LogEntry,
  Report,
  DashboardStats,
  TaskType,
  WorkflowState,
} from '@/types';
import {
  sampleStats,
  sampleTasks,
  sampleAgents,
  sampleLogs,
  sampleReports,
} from '@/data/sampleData';

const API_BASE = 'http://localhost:8000/api/tasks';
const SIMULATED_DELAY = 400;

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export interface StreamEvent {
  event: 'start' | 'node_complete' | 'done' | 'error';
  task_id?: string;
  step?: string;
  node?: string;
  data?: any;
  final_state?: WorkflowState;
  message?: string;
}

function delay<T>(data: T, ms = SIMULATED_DELAY): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms));
}

export const api = {
  /** Uploads a dataset directly to FastAPI backend /uploads directory */
  async uploadFile(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new ApiError(err.detail || 'File upload failed', res.status);
    }

    const data = await res.json();
    return data.filename;
  },

  /** Submit a new task — triggers LangGraph workflow */
  async createTask(input: {
    description: string;
    type: TaskType;
    fileName?: string;
    targetMetric?: string;
    dateCol?: string;
  }): Promise<Task> {
    const formData = new FormData();
    formData.append('objective', input.description);

    if (input.fileName) {
      formData.append('filename', input.fileName);
    }
    if (input.targetMetric) {
      formData.append('target_metric', input.targetMetric);
    }
    if (input.dateCol) {
      formData.append('date_col', input.dateCol);
    }

    const res = await fetch(`${API_BASE}/run-phase3`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new ApiError(
        err.detail || `Execution failed with status ${res.status}`,
        res.status
      );
    }

    const result: { status: string; state: WorkflowState } = await res.json();
    const finalState = result.state;

    const createdTask: Task = {
      id: finalState.task_id || `task-${Date.now()}`,
      title: input.description.slice(0, 48) + (input.description.length > 48 ? '...' : ''),
      description: input.description,
      type: input.fileName ? 'data-analysis' : 'market-research',
      status: finalState.errors && finalState.errors.length > 0 ? 'failed' : 'completed',
      createdAt: new Date().toISOString(),
      fileName: input.fileName,
      workflowState: finalState,
      phase2Data: {
        status: result.status,
        plan: finalState.plan || { objective: input.description, tasks: [] },
        analyst_execution: finalState.analyst_output,
      },
    };

    return createdTask;
  },

  /** Real-Time Streaming: Streams live node updates via SSE */
  async createTaskStream(
    input: {
      description: string;
      type: TaskType;
      fileName?: string;
      targetMetric?: string;
      dateCol?: string;
    },
    onEvent: (event: StreamEvent) => void
  ): Promise<WorkflowState> {
    const formData = new FormData();
    formData.append('objective', input.description);

    if (input.fileName) formData.append('filename', input.fileName);
    if (input.targetMetric) formData.append('target_metric', input.targetMetric);
    if (input.dateCol) formData.append('date_col', input.dateCol);

    const response = await fetch(`${API_BASE}/run-phase3-stream`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok || !response.body) {
      const err = await response.json().catch(() => ({}));
      throw new ApiError(err.detail || 'Streaming failed to initialize', response.status);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let finalWorkflowState: WorkflowState | null = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ')) {
          try {
            const parsed: StreamEvent = JSON.parse(trimmed.slice(6));
            onEvent(parsed);
            if (parsed.event === 'done' && parsed.final_state) {
              finalWorkflowState = parsed.final_state;
            }
          } catch {
            // Ignore malformed chunks
          }
        }
      }
    }

    if (!finalWorkflowState) {
      throw new ApiError('Stream closed before graph completion.');
    }

    return finalWorkflowState;
  },

  /** Dashboard summary statistics — returns live data first */
  async getStats(): Promise<DashboardStats> {
    try {
      const res = await fetch(`${API_BASE}/stats`);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback if offline
    }
    return delay(sampleStats);
  },

  /** Task history — returns live data directly */
  async getTasks(): Promise<Task[]> {
    try {
      const res = await fetch(`${API_BASE}`);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback if offline
    }
    return delay(sampleTasks);
  },

  /** Agent workflow states — live backend query with fallback */
  async getAgents(): Promise<Agent[]> {
    try {
      const res = await fetch(`${API_BASE}/agents`);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback if backend is offline
    }
    return delay(sampleAgents);
  },

  /** All reports — queries live backend with sample fallback */
  async getReports(): Promise<Report[]> {
    try {
      const res = await fetch(`${API_BASE}/reports`);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback if backend offline
    }
    return delay(sampleReports);
  },

  /** Single report by ID */
  async getReport(id: string): Promise<Report | undefined> {
    try {
      const res = await fetch(`${API_BASE}/reports/${id}`);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }
    const report = sampleReports.find((r) => r.id === id);
    return delay(report);
  },

  /** Execution log entries — live backend query with fallback */
  async getLogs(): Promise<LogEntry[]> {
    try {
      const res = await fetch(`${API_BASE}/logs`);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback if backend is offline
    }
    return delay(sampleLogs);
  },
};

export { API_BASE };