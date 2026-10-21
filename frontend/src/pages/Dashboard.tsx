import { useEffect, useState } from 'react';
import { LayoutDashboard, CheckCircle2, XCircle, Activity, ListChecks, ArrowRight, Clock } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import StatusPill from '@/components/ui/StatusPill';
import StateWrapper from '@/components/ui/StateWrapper';
import { api, ApiError } from '@/services/api';
import type { DashboardStats, Task } from '@/types';
import type { PageId } from '@/components/layout/Sidebar';

interface DashboardProps {
  onNavigate: (page: PageId) => void;
}

interface StatCardData {
  key: keyof DashboardStats;
  label: string;
  icon: typeof LayoutDashboard;
  color: string;
  bg: string;
  border: string;
}

const statCards: StatCardData[] = [
  { key: 'totalTasks', label: 'Total Tasks', icon: ListChecks, color: 'text-primary-400', bg: 'bg-primary-500/10', border: 'border-primary-500/20' },
  { key: 'completedTasks', label: 'Completed', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  { key: 'failedTasks', label: 'Failed', icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  { key: 'runningTasks', label: 'Running', icon: Activity, color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20' },
];

function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = () => {
    setLoading(true);
    setError(null);
    Promise.all([api.getStats(), api.getTasks()])
      .then(([s, t]) => {
        setStats(s);
        setTasks(t);
      })
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : 'Failed to load dashboard data.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(loadData, []);

  const completionRate = stats && stats.totalTasks > 0
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
    : 0;

  const circumference = 2 * Math.PI * 60;
  const strokeDashoffset = circumference - (completionRate / 100) * circumference;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Dashboard"
        subtitle="Overview of your autonomous operations and task execution."
        icon={<LayoutDashboard className="w-5 h-5" />}
      />

      {/* Stats Grid */}
      <StateWrapper
        loading={loading}
        error={error}
        empty={!loading && !error && !stats}
        onRetry={loadData}
      >
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            {statCards.map((card, idx) => {
              const Icon = card.icon;
              const value = stats[card.key];
              return (
                <Card
                  key={card.key}
                  className="p-5 animate-slide-up"
                  hover
                >
                  <div style={{ animationDelay: `${idx * 60}ms` }}>
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-11 h-11 rounded-xl ${card.bg} border ${card.border} flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${card.color}`} strokeWidth={2} />
                      </div>
                    </div>
                    <p className="text-sm text-gray-400 mb-1">{card.label}</p>
                    <p className="text-2xl font-bold text-white">{value}</p>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Completion + Recent Activity */}
        {stats && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Completion Rate */}
            <Card className="p-6 lg:col-span-1">
              <h3 className="text-base font-semibold text-gray-200 mb-1">Completion Rate</h3>
              <p className="text-xs text-gray-500 mb-6">Overall task success</p>
              <div className="flex flex-col items-center justify-center">
                <div className="relative w-36 h-36 mb-4">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 144 144">
                    <circle
                      cx="72" cy="72" r="60"
                      fill="none" stroke="currentColor"
                      strokeWidth="10"
                      className="text-base-800"
                    />
                    <circle
                      cx="72" cy="72" r="60"
                      fill="none" stroke="currentColor"
                      strokeWidth="10"
                      className="text-primary-500 transition-all duration-1000"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-white">{completionRate}%</span>
                    <span className="text-[10px] text-gray-500 uppercase tracking-wide">complete</span>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-gray-400">{stats.completedTasks} done</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-400" />
                    <span className="text-gray-400">{stats.failedTasks} failed</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Recent Activity */}
            <Card className="p-6 lg:col-span-2">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-base font-semibold text-gray-200">Recent Activity</h3>
                  <p className="text-xs text-gray-500 mt-1">Latest task executions</p>
                </div>
                <button
                  onClick={() => onNavigate('logs')}
                  className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1"
                >
                  View all <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2">
                {tasks.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between gap-4 px-3 py-3 rounded-xl bg-base-900 border border-base-700/60 hover:bg-base-800/50 transition-colors cursor-pointer"
                    onClick={() => onNavigate('new-task')}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-base-800 flex items-center justify-center flex-shrink-0">
                        <Clock className="w-4 h-4 text-gray-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-200 truncate">{task.title}</p>
                        <p className="text-xs text-gray-500">{formatRelativeTime(task.createdAt)}</p>
                      </div>
                    </div>
                    <StatusPill status={task.status} kind="task" />
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </StateWrapper>
    </div>
  );
}