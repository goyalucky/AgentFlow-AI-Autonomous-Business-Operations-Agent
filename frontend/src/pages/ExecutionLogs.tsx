import { useEffect, useState, useMemo, useCallback } from 'react';
import { ScrollText, Filter, ChevronDown, RefreshCw, Terminal, Search } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import StatusPill from '@/components/ui/StatusPill';
import StateWrapper from '@/components/ui/StateWrapper';
import { api, ApiError } from '@/services/api';
import type { LogEntry, LogStatus, AgentName } from '@/types';

const agentFilterOptions: ('all' | AgentName)[] = [
  'all', 'Planner', 'Data Analyst', 'Researcher', 'Reviewer', 'Report Generator',
];

const statusFilterOptions: ('all' | LogStatus)[] = [
  'all', 'info', 'success', 'warning', 'error', 'running',
];

function formatTimestamp(rawTimestamp?: string): string {
  if (!rawTimestamp) return '';
  try {
    const date = new Date(rawTimestamp);
    if (isNaN(date.getTime())) return rawTimestamp;
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  } catch {
    return rawTimestamp;
  }
}

export default function ExecutionLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [agentFilter, setAgentFilter] = useState<'all' | AgentName>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | LogStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadData = useCallback((silent = false) => {
    if (!silent) setLoading(true);
    else setIsRefreshing(true);
    setError(null);

    api.getLogs()
      .then((data) => setLogs(data || []))
      .catch((err: unknown) => {
        if (!silent) {
          setError(err instanceof ApiError ? err.message : 'Failed to load execution logs.');
        }
      })
      .finally(() => {
        setLoading(false);
        setIsRefreshing(false);
      });
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      loadData(true);
    }, 4000);
    return () => clearInterval(interval);
  }, [autoRefresh, loadData]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (agentFilter !== 'all' && log.agent !== agentFilter) return false;
      if (statusFilter !== 'all' && log.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchMessage = (log.message || '').toLowerCase().includes(q);
        const matchTaskId = log.taskId ? log.taskId.toLowerCase().includes(q) : false;
        const matchOutput = log.output ? log.output.toLowerCase().includes(q) : false;
        if (!matchMessage && !matchTaskId && !matchOutput) return false;
      }
      return true;
    });
  }, [logs, agentFilter, statusFilter, searchQuery]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Execution Logs"
        subtitle="Real-time log entries from every agent during task execution."
        icon={<ScrollText className="w-5 h-5" />}
      />

      {/* Controls & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Filter className="w-4 h-4" />
            <span>Filter:</span>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search logs or task..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-base-850 border border-base-700/60 rounded-xl pl-9 pr-3 py-2 text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-primary-500/40 w-48 sm:w-60"
            />
          </div>

          <div className="relative">
            <select
              value={agentFilter}
              onChange={(e) => setAgentFilter(e.target.value as 'all' | AgentName)}
              className="appearance-none bg-base-850 border border-base-700/60 rounded-xl pl-4 pr-10 py-2.5 text-sm text-gray-300 transition-all focus:outline-none focus:border-primary-500/40 cursor-pointer"
            >
              {agentFilterOptions.map((opt) => (
                <option key={opt} value={opt} className="bg-base-850">
                  {opt === 'all' ? 'All Agents' : opt}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | LogStatus)}
              className="appearance-none bg-base-850 border border-base-700/60 rounded-xl pl-4 pr-10 py-2.5 text-sm text-gray-300 transition-all focus:outline-none focus:border-primary-500/40 cursor-pointer"
            >
              {statusFilterOptions.map((opt) => (
                <option key={opt} value={opt} className="bg-base-850">
                  {opt === 'all' ? 'All Statuses' : opt.charAt(0).toUpperCase() + opt.slice(1)}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>

          {(agentFilter !== 'all' || statusFilter !== 'all' || searchQuery.trim()) && (
            <button
              onClick={() => { setAgentFilter('all'); setStatusFilter('all'); setSearchQuery(''); }}
              className="text-xs text-primary-400 hover:text-primary-300 underline"
            >
              Clear filters
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-base-700 bg-base-850 text-primary-500 focus:ring-0"
            />
            Live Updates (4s)
          </label>
          <button
            onClick={() => loadData(false)}
            disabled={loading || isRefreshing}
            className="p-2.5 rounded-xl bg-base-850 border border-base-700/60 text-gray-400 hover:text-gray-200 transition-all disabled:opacity-50"
            title="Refresh logs"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-primary-400' : ''}`} />
          </button>
        </div>
      </div>

      <StateWrapper
        loading={loading}
        error={error}
        empty={!loading && !error && filteredLogs.length === 0}
        emptyMessage={logs.length === 0 ? 'No execution logs recorded yet.' : 'No logs match your filters.'}
        onRetry={() => loadData(false)}
      >
        <Card className="overflow-hidden">
          <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 border-b border-base-700/60 bg-base-900/50">
            <div className="col-span-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</div>
            <div className="col-span-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Agent</div>
            <div className="col-span-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</div>
            <div className="col-span-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Message & Details</div>
          </div>

          <div className="divide-y divide-base-700/40">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="px-5 py-4 hover:bg-base-800/40 transition-colors cursor-pointer select-none"
                onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
              >
                <div className="hidden md:grid grid-cols-12 gap-4 items-start">
                  <div className="col-span-2">
                    <span className="font-mono text-xs text-gray-500">{formatTimestamp(log.timestamp)}</span>
                    {log.taskId && (
                      <div className="text-[11px] font-mono text-gray-600 truncate">{log.taskId}</div>
                    )}
                  </div>
                  <div className="col-span-2">
                    <span className="text-sm font-medium text-gray-300">{log.agent}</span>
                  </div>
                  <div className="col-span-2">
                    <StatusPill status={log.status} kind="log" />
                  </div>
                  <div className="col-span-6">
                    <p className="text-sm text-gray-300">{log.message}</p>
                    {log.output && expandedId === log.id && (
                      <div 
                        className="mt-2 p-3 rounded-lg bg-base-900 border border-base-700/40"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-1.5 text-2xs text-gray-500 uppercase tracking-wider mb-1">
                          <Terminal className="w-3 h-3 text-primary-400" />
                          <span>Payload Output</span>
                        </div>
                        <pre className="font-mono text-xs text-gray-400 whitespace-pre-wrap break-words max-h-60 overflow-y-auto">{log.output}</pre>
                      </div>
                    )}
                  </div>
                </div>

                <div className="md:hidden space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-gray-300">{log.agent}</span>
                    <StatusPill status={log.status} kind="log" />
                  </div>
                  <p className="text-sm text-gray-400">{log.message}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="font-mono">{formatTimestamp(log.timestamp)}</span>
                    {log.taskId && <span className="font-mono text-gray-600">{log.taskId}</span>}
                  </div>
                  {log.output && expandedId === log.id && (
                    <div 
                      className="mt-2 p-3 rounded-lg bg-base-900 border border-base-700/40"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-1.5 text-2xs text-gray-500 uppercase tracking-wider mb-1">
                        <Terminal className="w-3 h-3 text-primary-400" />
                        <span>Payload Output</span>
                      </div>
                      <pre className="font-mono text-xs text-gray-400 whitespace-pre-wrap break-words max-h-60 overflow-y-auto">{log.output}</pre>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <p className="text-xs text-gray-600 mt-4">
          Showing {filteredLogs.length} of {logs.length} live log entries
        </p>
      </StateWrapper>
    </div>
  );
}