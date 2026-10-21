import { useState } from 'react';
import Layout from '@/components/layout/Layout';
import type { PageId } from '@/components/layout/Sidebar';
import Dashboard from '@/pages/Dashboard';
import NewTask from '@/pages/NewTask';
import AgentWorkflow from '@/pages/AgentWorkflow';
import ExecutionLogs from '@/pages/ExecutionLogs';
import Reports from '@/pages/Reports';

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentPage} />;
      case 'new-task':
        return <NewTask />;
      case 'workflow':
        return <AgentWorkflow />;
      case 'logs':
        return <ExecutionLogs />;
      case 'reports':
        return <Reports />;
      default:
        return <Dashboard onNavigate={setCurrentPage} />;
    }
  };

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
}
