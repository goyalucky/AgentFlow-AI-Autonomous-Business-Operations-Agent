import { Menu, Search, Bell } from 'lucide-react';

interface TopbarProps {
  onMenuClick: () => void;
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 bg-base-950/80 backdrop-blur-xl border-b border-base-700/60">
      <div className="flex items-center justify-between px-6 py-4 gap-4">
        <div className="flex items-center gap-3 flex-1">
          <button
            onClick={onMenuClick}
            className="lg:hidden text-gray-400 hover:text-white p-1.5 -ml-1.5"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
            <input
              type="text"
              placeholder="Search tasks, reports, agents..."
              className="w-full bg-base-850 border border-base-700/60 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-300 placeholder:text-gray-600 transition-all focus:outline-none focus:border-primary-500/40 focus:ring-1 focus:ring-primary-500/20"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="relative w-9 h-9 rounded-xl bg-base-850 border border-base-700/60 flex items-center justify-center text-gray-400 hover:text-white hover:border-base-650 transition-all">
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary-400" />
          </button>
          <div className="flex items-center gap-3 pl-3 border-l border-base-700/60">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-white leading-tight">Alex Morgan</p>
              <p className="text-2xs text-gray-500">Operations Lead</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-sm font-bold text-base-950">
              AM
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
