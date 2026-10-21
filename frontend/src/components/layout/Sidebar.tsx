import { useState, useEffect } from 'react';
import { Bot, LayoutDashboard, PlusCircle, Workflow, ScrollText, FileText, X } from 'lucide-react';

export type PageId = 'dashboard' | 'new-task' | 'workflow' | 'logs' | 'reports';

interface SidebarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  isOpen: boolean;
  onClose: () => void;
}

const navItems: { id: PageId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'new-task', label: 'New Task', icon: PlusCircle },
  { id: 'workflow', label: 'Agent Workflow', icon: Workflow },
  { id: 'logs', label: 'Execution Logs', icon: ScrollText },
  { id: 'reports', label: 'Reports', icon: FileText },
];

export default function Sidebar({ currentPage, onNavigate, isOpen, onClose }: SidebarProps) {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  useEffect(() => {
    const checkBackendStatus = async () => {
      try {
        const response = await fetch('http://localhost:8000/health');
        if (response.ok) {
          const data = await response.json();
          setIsConnected(data.status === 'healthy');
        } else {
          setIsConnected(false);
        }
      } catch {
        setIsConnected(false);
      }
    };

    checkBackendStatus();
    const interval = setInterval(checkBackendStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden animate-fade-in"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-50 lg:z-10
          w-72 h-screen flex-shrink-0
          bg-base-900 border-r border-base-700/60
          flex flex-col
          transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-6 border-b border-base-700/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-glow">
              <Bot className="w-5 h-5 text-base-950" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight leading-tight">AgentFlow AI</h1>
              <p className="text-2xs text-gray-500 uppercase tracking-wider">Operations Agent</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-gray-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          <p className="px-4 pb-3 text-2xs font-medium text-gray-600 uppercase tracking-wider">Menu</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`nav-item w-full text-left ${isActive ? 'nav-item-active' : ''}`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" strokeWidth={2} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Dynamic Status footer */}
        <div className="px-4 py-5 border-t border-base-700/60">
          <div className="card !rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  isConnected === null
                    ? 'bg-gray-500 animate-pulse'
                    : isConnected
                    ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50'
                    : 'bg-amber-400 animate-pulse'
                }`}
              />
              <span className="text-xs font-medium text-gray-300">
                {isConnected === null
                  ? 'Connecting...'
                  : isConnected
                  ? 'Backend: Connected'
                  : 'Backend: Not Connected'}
              </span>
            </div>
            <p className="text-2xs text-gray-500 leading-relaxed">
              {isConnected
                ? 'FastAPI & Ollama service active.'
                : 'Frontend preview mode. API integration pending.'}
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}