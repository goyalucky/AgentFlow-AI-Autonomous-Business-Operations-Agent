import { useEffect, useState } from 'react';
import { FileText, ArrowLeft, Clock, Download, Share2, Check } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import StateWrapper from '@/components/ui/StateWrapper';
import { api, ApiError } from '@/services/api';
import type { Report } from '@/types';

const reportStatusConfig: Record<Report['status'], { label: string; classes: string }> = {
  draft: { label: 'Draft', classes: 'bg-amber-500/15 text-amber-400' },
  final: { label: 'Final', classes: 'bg-emerald-500/15 text-emerald-400' },
  archived: { label: 'Archived', classes: 'bg-gray-500/15 text-gray-400' },
};

const reportTypeLabels: Record<Report['type'], string> = {
  'data-analysis': 'Data Analysis',
  'market-research': 'Market Research',
  'financial-audit': 'Financial Audit',
  'compliance-review': 'Compliance Review',
  custom: 'Custom',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function Reports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadData = () => {
    setLoading(true);
    setError(null);
    api
      .getReports()
      .then(setReports)
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : 'Failed to load reports.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(loadData, []);

  const handleSelectReport = (id: string) => {
    setSelectedId(id);
    setDetailLoading(true);
    setSelectedReport(null);
    api
      .getReport(id)
      .then((report) => {
        if (report) setSelectedReport(report);
      })
      .catch(() => {
        const found = reports.find((r) => r.id === id);
        if (found) setSelectedReport(found);
      })
      .finally(() => setDetailLoading(false));
  };

  const handleExportMarkdown = () => {
    if (!selectedReport) return;
    const markdownContent =
      (selectedReport as any).rawMarkdown ||
      `# ${selectedReport.title}\n\n${selectedReport.summary}\n\n` +
        selectedReport.sections.map((s) => `## ${s.heading}\n\n${s.content}`).join('\n\n');

    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${selectedReport.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Detail View
  if (selectedId) {
    const statusConfig = selectedReport ? reportStatusConfig[selectedReport.status] : null;
    return (
      <div className="animate-fade-in">
        <button
          onClick={() => {
            setSelectedId(null);
            setSelectedReport(null);
          }}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Reports
        </button>

        <StateWrapper
          loading={detailLoading}
          error={null}
          empty={!detailLoading && !selectedReport}
          emptyMessage="Report not found."
        >
          {selectedReport && statusConfig && (
            <>
              <div className="flex items-start justify-between gap-4 mb-8">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`badge ${statusConfig.classes}`}>{statusConfig.label}</span>
                    <span className="text-xs text-gray-500">{reportTypeLabels[selectedReport.type]}</span>
                  </div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">{selectedReport.title}</h1>
                  <p className="text-sm text-gray-400 mt-2">{selectedReport.summary}</p>
                  <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                    <Clock className="w-3.5 h-3.5" />
                    Generated on {formatDate(selectedReport.createdAt)}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={handleShare} className="btn-secondary text-xs flex items-center gap-1.5">
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Share'}</span>
                  </button>
                  <button onClick={handleExportMarkdown} className="btn-secondary text-xs flex items-center gap-1.5">
                    <Download className="w-3.5 h-3.5" />
                    <span>Export MD</span>
                  </button>
                </div>
              </div>

              <div className="space-y-5">
                {selectedReport.sections.map((section, idx) => (
                  <Card key={section.id} className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="w-7 h-7 rounded-lg bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-xs font-bold text-primary-400">
                        {idx + 1}
                      </span>
                      <h2 className="text-lg font-semibold text-white">{section.heading}</h2>
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">{section.content}</p>
                  </Card>
                ))}
              </div>
            </>
          )}
        </StateWrapper>
      </div>
    );
  }

  // List View
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Reports"
        subtitle="Generated executive reports synthesized from completed agent workflows."
        icon={<FileText className="w-5 h-5" />}
      />

      <StateWrapper
        loading={loading}
        error={error}
        empty={!loading && !error && reports.length === 0}
        emptyMessage="No reports generated yet. Complete a task to see reports here."
        emptyIcon={<FileText className="w-6 h-6 text-gray-500" />}
        onRetry={loadData}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {reports.map((report) => {
            const statusConfig = reportStatusConfig[report.status];
            return (
              <Card
                key={report.id}
                className="p-6 cursor-pointer hover:border-primary-500/50 transition-all"
                onClick={() => handleSelectReport(report.id)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary-400" />
                  </div>
                  <span className={`badge ${statusConfig.classes}`}>{statusConfig.label}</span>
                </div>
                <h3 className="text-base font-semibold text-white mb-2 leading-snug">{report.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed line-clamp-2 mb-4">{report.summary}</p>
                <div className="flex items-center justify-between pt-4 border-t border-base-700/60">
                  <span className="text-xs text-gray-500">{reportTypeLabels[report.type]}</span>
                  <span className="text-xs text-gray-500 flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    {formatDate(report.createdAt)}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      </StateWrapper>
    </div>
  );
}