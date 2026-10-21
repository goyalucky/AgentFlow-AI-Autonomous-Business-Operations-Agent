import type { TaskStatus, AgentStatus, LogStatus } from '@/types';

interface StatusConfig {
  label: string;
  classes: string;
  dot: string;
}

const taskStatusConfig: Record<TaskStatus, StatusConfig> = {
  pending: { label: 'Pending', classes: 'bg-gray-500/15 text-gray-400', dot: 'bg-gray-400' },
  running: { label: 'Running', classes: 'bg-info-500/15 text-info-400', dot: 'bg-info-400' },
  completed: { label: 'Completed', classes: 'bg-success-500/15 text-success-400', dot: 'bg-success-400' },
  failed: { label: 'Failed', classes: 'bg-error-500/15 text-error-400', dot: 'bg-error-400' },
};

const agentStatusConfig: Record<AgentStatus, StatusConfig> = {
  idle: { label: 'Idle', classes: 'bg-gray-500/15 text-gray-400', dot: 'bg-gray-400' },
  active: { label: 'Active', classes: 'bg-info-500/15 text-info-400', dot: 'bg-info-400 animate-pulse' },
  completed: { label: 'Completed', classes: 'bg-success-500/15 text-success-400', dot: 'bg-success-400' },
  error: { label: 'Error', classes: 'bg-error-500/15 text-error-400', dot: 'bg-error-400' },
};

const logStatusConfig: Record<LogStatus, StatusConfig> = {
  info: { label: 'Info', classes: 'bg-info-500/15 text-info-400', dot: 'bg-info-400' },
  success: { label: 'Success', classes: 'bg-success-500/15 text-success-400', dot: 'bg-success-400' },
  warning: { label: 'Warning', classes: 'bg-warning-500/15 text-warning-400', dot: 'bg-warning-400' },
  error: { label: 'Error', classes: 'bg-error-500/15 text-error-400', dot: 'bg-error-400' },
  running: { label: 'Running', classes: 'bg-info-500/15 text-info-400', dot: 'bg-info-400 animate-pulse' },
};

interface StatusPillProps {
  status: TaskStatus | AgentStatus | LogStatus;
  kind: 'task' | 'agent' | 'log';
}

function getConfig(kind: 'task' | 'agent' | 'log', status: string): StatusConfig {
  if (kind === 'task') return taskStatusConfig[status as TaskStatus];
  if (kind === 'agent') return agentStatusConfig[status as AgentStatus];
  return logStatusConfig[status as LogStatus];
}

export default function StatusPill({ status, kind }: StatusPillProps) {
  const config = getConfig(kind, status);

  return (
    <span className={`badge ${config.classes}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
