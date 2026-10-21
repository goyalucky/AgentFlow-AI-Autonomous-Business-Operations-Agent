import { useEffect, useState, useCallback } from 'react';
import {
  Workflow,
  ArrowRight,
  Brain,
  BarChart3,
  Search,
  ShieldCheck,
  FileBarChart,
  RefreshCw,
  GitBranch,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import StatusPill from '@/components/ui/StatusPill';
import StateWrapper from '@/components/ui/StateWrapper';
import { api, ApiError } from '@/services/api';
import type { Agent, AgentName } from '@/types';

const agentIcons: Record<AgentName, typeof Brain> = {
  Planner: Brain,
  'Data Analyst': BarChart3,
  Researcher: Search,
  Reviewer: ShieldCheck,
  'Report Generator': FileBarChart,
};

const agentColors: Record<AgentName, { bg: string; border: string; text: string }> = {
  Planner: { bg: 'bg-primary-500/10', border: 'border-primary-500/20', text: 'text-primary-400' },
  'Data Analyst': { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400' },
  Researcher: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400' },
  Reviewer: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400' },
  'Report Generator': { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400' },
};

export default function AgentWorkflow() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback((silent = false) => {
    if (!silent) setLoading(true);
    else setIsRefreshing(true);
    setError(null);

    api
      .getAgents()
      .then(setAgents)
      .catch((err: unknown) => {
        if (!silent) {
          setError(err instanceof ApiError ? err.message : 'Failed to load agent workflow.');
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

  // Live polling for agent status updates
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      loadData(true);
    }, 4000);
    return () => clearInterval(interval);
  }, [autoRefresh, loadData]);

  const sortedAgents = [...agents].sort((a, b) => a.order - b.order);

  const planner = sortedAgents.find((a) => a.name === 'Planner');
  const analyst = sortedAgents.find((a) => a.name === 'Data Analyst');
  const researcher = sortedAgents.find((a) => a.name === 'Researcher');
  const reviewer = sortedAgents.find((a) => a.name === 'Reviewer');
  const reporter = sortedAgents.find((a) => a.name === 'Report Generator');

  return (
    <div className="animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <PageHeader
          title="Agent Workflow"
          subtitle="Multi-agent graph with dynamic conditional routing and quality audits."
          icon={<Workflow className="w-5 h-5" />}
        />
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
            title="Refresh agents"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-primary-400' : ''}`} />
          </button>
        </div>
      </div>

      <StateWrapper
        loading={loading}
        error={error}
        empty={!loading && !error && agents.length === 0}
        emptyMessage="No agents configured yet."
        onRetry={() => loadData(false)}
      >
        {/* Branching Architecture Visualizer */}
        <div className="mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-primary-400" />
                  LangGraph Branching Pipeline
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Conditional edge evaluates dataset presence to branch into Data Analyst or Researcher before audit.
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-4 px-2 overflow-x-auto">
              {/* Planner Node */}
              {planner && (
                <div className={`flex flex-col items-center p-3 rounded-xl border ${agentColors['Planner'].bg} ${agentColors['Planner'].border} min-w-[130px]`}>
                  <Brain className={`w-5 h-5 mb-1 ${agentColors['Planner'].text}`} />
                  <span className="text-xs font-semibold text-white">{planner.name}</span>
                  <span className="text-2xs text-gray-400 mt-0.5">Task Planning</span>
                  <div className="mt-2"><StatusPill status={planner.status} kind="agent" /></div>
                </div>
              )}

              <ArrowRight className="w-5 h-5 text-gray-600 hidden md:block" />

              {/* Conditional Branch: Analyst & Researcher */}
              <div className="flex flex-col gap-3 min-w-[180px]">
                {analyst && (
                  <div className={`flex items-center justify-between p-3 rounded-xl border ${agentColors['Data Analyst'].bg} ${agentColors['Data Analyst'].border}`}>
                    <div className="flex items-center gap-2">
                      <BarChart3 className={`w-4 h-4 ${agentColors['Data Analyst'].text}`} />
                      <div>
                        <p className="text-xs font-semibold text-white leading-none">{analyst.name}</p>
                        <p className="text-2xs text-gray-400 mt-1 leading-none">Dataset branch</p>
                      </div>
                    </div>
                    <StatusPill status={analyst.status} kind="agent" />
                  </div>
                )}

                {researcher && (
                  <div className={`flex items-center justify-between p-3 rounded-xl border ${agentColors['Researcher'].bg} ${agentColors['Researcher'].border}`}>
                    <div className="flex items-center gap-2">
                      <Search className={`w-4 h-4 ${agentColors['Researcher'].text}`} />
                      <div>
                        <p className="text-xs font-semibold text-white leading-none">{researcher.name}</p>
                        <p className="text-2xs text-gray-400 mt-1 leading-none">Web search branch</p>
                      </div>
                    </div>
                    <StatusPill status={researcher.status} kind="agent" />
                  </div>
                )}
              </div>

              <ArrowRight className="w-5 h-5 text-gray-600 hidden md:block" />

              {/* Reviewer Node */}
              {reviewer && (
                <div className={`flex flex-col items-center p-3 rounded-xl border ${agentColors['Reviewer'].bg} ${agentColors['Reviewer'].border} min-w-[130px]`}>
                  <ShieldCheck className={`w-5 h-5 mb-1 ${agentColors['Reviewer'].text}`} />
                  <span className="text-xs font-semibold text-white">{reviewer.name}</span>
                  <span className="text-2xs text-gray-400 mt-0.5">Quality Audit</span>
                  <div className="mt-2"><StatusPill status={reviewer.status} kind="agent" /></div>
                </div>
              )}

              <ArrowRight className="w-5 h-5 text-gray-600 hidden md:block" />

              {/* Report Generator */}
              {reporter && (
                <div className={`flex flex-col items-center p-3 rounded-xl border ${agentColors['Report Generator'].bg} ${agentColors['Report Generator'].border} min-w-[130px]`}>
                  <FileBarChart className={`w-5 h-5 mb-1 ${agentColors['Report Generator'].text}`} />
                  <span className="text-xs font-semibold text-white">{reporter.name}</span>
                  <span className="text-2xs text-gray-400 mt-0.5">Synthesis</span>
                  <div className="mt-2"><StatusPill status={reporter.status} kind="agent" /></div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Detailed Agent Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {sortedAgents.map((agent) => {
            const Icon = agentIcons[agent.name];
            const colors = agentColors[agent.name];
            return (
              <Card key={agent.id} className="p-6 transition-all hover:border-base-600">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${colors.text}`} strokeWidth={1.8} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xs font-medium text-gray-500 uppercase tracking-wider">Step {agent.order}</span>
                      </div>
                      <h3 className="text-base font-semibold text-white">{agent.name}</h3>
                      <p className="text-xs text-gray-500">{agent.role}</p>
                    </div>
                  </div>
                  <StatusPill status={agent.status} kind="agent" />
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">{agent.description}</p>
              </Card>
            );
          })}
        </div>
      </StateWrapper>
    </div>
  );
}