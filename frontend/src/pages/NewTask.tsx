import { useState, useRef, useCallback } from 'react';
import {
  PlusCircle,
  Upload,
  FileText,
  X,
  Play,
  AlertCircle,
  CheckCircle2,
  ListOrdered,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Globe,
  ExternalLink,
  ShieldCheck,
  Search,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import { api, ApiError, StreamEvent } from '@/services/api';
import type { TaskType, WorkflowState } from '@/types';

const taskTypes: { value: TaskType; label: string; description: string }[] = [
  { value: 'data-analysis', label: 'Data Analysis', description: 'Process and analyze datasets to extract insights.' },
  { value: 'market-research', label: 'Market Research', description: 'Research competitors, trends, and market positioning.' },
  { value: 'financial-audit', label: 'Financial Audit', description: 'Audit financial records and flag discrepancies.' },
  { value: 'compliance-review', label: 'Compliance Review', description: 'Review practices against regulatory requirements.' },
  { value: 'custom', label: 'Custom Task', description: 'Define a custom analysis workflow.' },
];

interface FormErrors {
  description?: string;
  type?: string;
}

export default function NewTask() {
  const [description, setDescription] = useState('');
  const [taskType, setTaskType] = useState<TaskType | ''>('data-analysis');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [targetMetric, setTargetMetric] = useState('Sales');
  const [dateCol, setDateCol] = useState('Date');
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [workflowResult, setWorkflowResult] = useState<Partial<WorkflowState> | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const validate = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    if (description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters.';
    }
    if (description.trim().length > 2000) {
      newErrors.description = 'Description must be under 2000 characters.';
    }
    if (!taskType) {
      newErrors.type = 'Please select a task type.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [description, taskType]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.csv') && !file.name.endsWith('.xlsx')) {
        setSubmitError('Only CSV and XLSX files are supported.');
        return;
      }
      setSubmitError(null);
      setSelectedFile(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('border-primary-500/50', 'bg-primary-500/5');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('border-primary-500/50', 'bg-primary-500/5');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-primary-500/50', 'bg-primary-500/5');
    const file = e.dataTransfer.files?.[0];
    if (file && (file.name.endsWith('.csv') || file.name.endsWith('.xlsx'))) {
      setSubmitError(null);
      setSelectedFile(file);
    } else {
      setSubmitError('Only CSV and XLSX files are supported.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setWorkflowResult({});

    if (!validate()) return;

    setSubmitting(true);
    setStatusMessage('Initializing LangGraph stream...');
    setActiveNode('planner');

    try {
      let uploadedFilename: string | undefined = undefined;

      if (selectedFile) {
        setStatusMessage('Uploading dataset...');
        uploadedFilename = await api.uploadFile(selectedFile);
      }

      setStatusMessage('Streaming multi-agent execution...');

      await api.createTaskStream(
        {
          description: description.trim(),
          type: taskType as TaskType,
          fileName: uploadedFilename,
          targetMetric: targetMetric.trim() || undefined,
          dateCol: dateCol.trim() || undefined,
        },
        (event: StreamEvent) => {
          if (event.event === 'start') {
            setStatusMessage('Planner Agent decomposing objective...');
            setActiveNode('planner');
          } else if (event.event === 'node_complete' && event.node && event.data) {
            setActiveNode(event.node);
            setWorkflowResult((prev) => ({
              ...prev,
              ...event.data,
            }));

            if (event.node === 'planner') {
              setStatusMessage(
                uploadedFilename
                  ? 'Analyst Agent processing metrics...'
                  : 'Researcher Agent gathering web intelligence...'
              );
            } else if (event.node === 'analyst' || event.node === 'researcher') {
              setStatusMessage('Reviewer Agent conducting QA audit...');
            } else if (event.node === 'reviewer') {
              setStatusMessage('Workflow completed successfully.');
            }
          } else if (event.event === 'done' && event.final_state) {
            setWorkflowResult(event.final_state);
            setStatusMessage(null);
            setActiveNode(null);
          } else if (event.event === 'error') {
            setSubmitError(event.message || 'Stream reported an error.');
            setStatusMessage(null);
            setActiveNode(null);
          }
        }
      );
    } catch (err: unknown) {
      setSubmitError(err instanceof ApiError ? err.message : 'An unexpected error occurred.');
      setStatusMessage(null);
      setActiveNode(null);
    } finally {
      setSubmitting(false);
    }
  };

  const isFormValid = description.trim().length >= 10 && taskType !== '';

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="New Task"
        subtitle="Define an objective for the autonomous agents to plan, execute, and verify."
        icon={<PlusCircle className="w-5 h-5" />}
      />

      <div className="max-w-4xl space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Task Description */}
          <Card className="p-6">
            <label htmlFor="description" className="label text-sm font-medium text-gray-200">
              Task Description <span className="text-red-400">*</span>
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (errors.description) setErrors({ ...errors, description: undefined });
              }}
              rows={4}
              placeholder="e.g. Analyze our quarterly sales report, or investigate competitor market trends..."
              className={`input-field w-full p-3 bg-base-900 border border-base-700 rounded-xl text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary-500 resize-none ${
                errors.description ? 'border-red-500 focus:border-red-500' : ''
              }`}
            />
            <div className="flex items-center justify-between mt-2">
              {errors.description ? (
                <p className="text-xs text-red-400 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.description}
                </p>
              ) : (
                <p className="text-xs text-gray-500">Minimum 10 characters.</p>
              )}
              <span className="text-xs text-gray-500">{description.length}/2000</span>
            </div>
          </Card>

          {/* Task Type Selector */}
          <Card className="p-6">
            <label className="label text-sm font-medium text-gray-200 mb-3 block">
              Task Type <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {taskTypes.map((type) => {
                const isSelected = taskType === type.value;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => {
                      setTaskType(type.value);
                      if (errors.type) setErrors({ ...errors, type: undefined });
                    }}
                    className={`text-left p-4 rounded-xl border transition-all duration-200 ${
                      isSelected
                        ? 'border-primary-500 bg-primary-500/10 ring-1 ring-primary-500/30'
                        : 'border-base-700 bg-base-900 hover:border-base-600 hover:bg-base-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-medium ${isSelected ? 'text-primary-400' : 'text-gray-200'}`}>
                        {type.label}
                      </span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-primary-400" />}
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">{type.description}</p>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Dataset Upload & Configuration */}
          <Card className="p-6 space-y-4">
            <label className="label text-sm font-medium text-gray-200 block">
              Dataset File <span className="text-gray-500 font-normal">(Optional — routes to Web Research if omitted)</span>
            </label>

            {!selectedFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className="border-2 border-dashed border-base-700 rounded-xl p-6 text-center cursor-pointer transition-all hover:border-primary-500 hover:bg-base-800/40"
              >
                <div className="w-12 h-12 rounded-xl bg-base-800 flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-sm text-gray-300 mb-1">
                  <span className="text-primary-400 font-medium">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">CSV or Excel up to 20MB</p>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 rounded-xl bg-base-900 border border-base-700">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-primary-500/10 border border-primary-500/20 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-primary-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-200 truncate">{selectedFile.name}</p>
                    <p className="text-xs text-gray-400">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx"
              onChange={handleFileSelect}
              className="hidden"
            />

            {selectedFile && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-xs text-gray-400 font-medium block mb-1">Target Numeric Column</label>
                  <input
                    type="text"
                    value={targetMetric}
                    onChange={(e) => setTargetMetric(e.target.value)}
                    placeholder="e.g. Sales, Revenue"
                    className="w-full p-2.5 bg-base-900 border border-base-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-medium block mb-1">Date / Chronological Column</label>
                  <input
                    type="text"
                    value={dateCol}
                    onChange={(e) => setDateCol(e.target.value)}
                    placeholder="e.g. Date, Month"
                    className="w-full p-2.5 bg-base-900 border border-base-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>
            )}
          </Card>

          {/* Submission Status Alerts */}
          {submitError && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-400">Execution Error</p>
                <p className="text-xs text-gray-300 mt-0.5">{submitError}</p>
              </div>
            </div>
          )}

          {/* Submit Button & Stream Indicator */}
          <div className="flex items-center gap-4 pt-2">
            <button
              type="submit"
              disabled={!isFormValid || submitting}
              className="px-6 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-500/20"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Streaming Workflow...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Run Agent Workflow</span>
                </>
              )}
            </button>
            {statusMessage && (
              <span className="text-xs text-primary-400 animate-pulse">{statusMessage}</span>
            )}
          </div>
        </form>

        {/* Phase 4 Live Streaming Output Cards */}
        {workflowResult && Object.keys(workflowResult).length > 0 && (
          <div className="space-y-6 pt-4 animate-slide-up">
            <h3 className="text-lg font-semibold text-gray-200 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              Real-Time Execution State
            </h3>

            {/* 1. Planner Agent Output */}
            {workflowResult.plan && (
              <Card className="p-6 space-y-4 animate-fade-in">
                <div className="flex items-center justify-between border-b border-base-700/60 pb-3">
                  <div className="flex items-center gap-2">
                    <ListOrdered className="w-5 h-5 text-primary-400" />
                    <h4 className="text-base font-semibold text-gray-200">Execution Plan (Planner Agent)</h4>
                  </div>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Step Completed
                  </span>
                </div>
                <div className="space-y-3">
                  {workflowResult.plan.tasks.map((task) => (
                    <div
                      key={task.task_id}
                      className="p-4 rounded-xl bg-base-900 border border-base-700 flex flex-col gap-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-200">
                          {task.task_id}. {task.title}
                        </span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-primary-500/10 text-primary-400 border border-primary-500/20">
                          {task.assigned_agent}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">{task.description}</p>
                      <div className="text-[11px] text-gray-500">
                        Tool: <span className="font-mono text-gray-400">{task.tool_required}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* 2A. Conditional Branch: Analyst Agent Output */}
            {workflowResult.analyst_output && (
              <Card className="p-6 space-y-5 animate-fade-in">
                <div className="flex items-center justify-between border-b border-base-700/60 pb-3">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary-400" />
                    <h4 className="text-base font-semibold text-gray-200">Data Analytics (Analyst Node)</h4>
                  </div>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Branch: Dataset Attached
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-base-900 border border-base-700">
                    <span className="text-xs text-gray-400">Mean Value</span>
                    <div className="text-lg font-bold text-gray-100 mt-1">
                      {workflowResult.analyst_output.metrics.mean}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-base-900 border border-base-700">
                    <span className="text-xs text-gray-400">Min / Max</span>
                    <div className="text-lg font-bold text-gray-100 mt-1">
                      {workflowResult.analyst_output.metrics.min} / {workflowResult.analyst_output.metrics.max}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-base-900 border border-base-700">
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Anomalies
                    </span>
                    <div className="text-lg font-bold text-amber-400 mt-1">
                      {workflowResult.analyst_output.metrics.anomaly_count}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-base-900 border border-base-700">
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Growth Rate
                    </span>
                    <div className="text-lg font-bold text-emerald-400 mt-1">
                      {workflowResult.analyst_output.metrics.average_growth_rate || 'N/A'}
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-base-900 border border-base-700 space-y-2">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Analyst Synthesized Findings
                  </span>
                  <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
                    {workflowResult.analyst_output.insights}
                  </p>
                </div>
              </Card>
            )}

            {/* 2B. Conditional Branch: Web Researcher Agent Output */}
            {workflowResult.research_output && (
              <Card className="p-6 space-y-4 animate-fade-in">
                <div className="flex items-center justify-between border-b border-base-700/60 pb-3">
                  <div className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-sky-400" />
                    <h4 className="text-base font-semibold text-gray-200">Market Intelligence (Researcher Node)</h4>
                  </div>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    Branch: Web Research
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-400 bg-base-900 p-3 rounded-lg border border-base-700">
                  <Search className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                  <span>Search Query:</span>
                  <span className="font-medium text-gray-200">"{workflowResult.research_output.search_query}"</span>
                </div>

                <div className="p-4 rounded-xl bg-base-900 border border-base-700 space-y-2">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Synthesized Research Brief
                  </span>
                  <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
                    {workflowResult.research_output.brief}
                  </p>
                </div>

                {workflowResult.research_output.sources.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Sources Cited ({workflowResult.research_output.sources.length})
                    </span>
                    <div className="grid grid-cols-1 gap-2">
                      {workflowResult.research_output.sources.map((src, i) => (
                        <a
                          key={i}
                          href={src.link}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-start justify-between gap-3 p-3 rounded-lg bg-base-900/60 border border-base-700 hover:border-base-600 transition-colors"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-primary-400 truncate">{src.title}</p>
                            <p className="text-[11px] text-gray-400 line-clamp-1 mt-0.5">{src.snippet}</p>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-gray-500 flex-shrink-0 mt-0.5" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* 3. Reviewer Agent Validation Audit */}
            {workflowResult.reviewer_output && (
              <Card className="p-6 space-y-4 animate-fade-in">
                <div className="flex items-center justify-between border-b border-base-700/60 pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <h4 className="text-base font-semibold text-gray-200">Quality Assurance & Audit (Reviewer Node)</h4>
                  </div>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                    Status: {workflowResult.reviewer_output.validation_status}
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-base-900 border border-base-700">
                  <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
                    {workflowResult.reviewer_output.audit_summary}
                  </p>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}