/**
 * AI Command Page — Natural Language Campaign Control
 * Premium UI for sending AI-powered email campaign commands
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Bot,
  Sparkles,
  Send,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Zap,
  ChevronRight,
  Terminal,
  Mail,
  Users,
  Server,
} from 'lucide-react';
import { aiApi, type AICommandResponse } from '@/services/ai.service';

// ============================================
// EXAMPLE COMMANDS
// ============================================

const EXAMPLE_COMMANDS = [
  'Send Offer template to Clients using Gmail SMTP',
  'Send Welcome Email to Leads using Outlook SMTP',
  'Run Offer Campaign',
  'Execute Black Friday Campaign',
  'Send Discount Template to Premium Customers',
  'Start Summer Sale Campaign',
];

// ============================================
// PIPELINE STAGES
// ============================================

type PipelineStage = 'idle' | 'thinking' | 'understanding' | 'validating' | 'executing' | 'completed' | 'error';

const STAGE_CONFIG: Record<PipelineStage, { label: string; icon: typeof Loader2; color: string }> = {
  idle: { label: 'Ready', icon: Terminal, color: 'hsl(var(--muted-foreground))' },
  thinking: { label: 'Thinking...', icon: Loader2, color: 'hsl(var(--primary))' },
  understanding: { label: 'Understanding Command...', icon: Bot, color: 'hsl(var(--primary))' },
  validating: { label: 'Validating...', icon: AlertTriangle, color: 'hsl(216, 90%, 58%)' },
  executing: { label: 'Executing Campaign...', icon: Zap, color: 'hsl(280, 80%, 60%)' },
  completed: { label: 'Completed Successfully', icon: CheckCircle2, color: 'hsl(142, 71%, 45%)' },
  error: { label: 'Error', icon: XCircle, color: 'hsl(0, 84%, 60%)' },
};

// ============================================
// COMPONENT
// ============================================

export default function AiCommandPage() {
  const navigate = useNavigate();
  const [command, setCommand] = useState('');
  const [stage, setStage] = useState<PipelineStage>('idle');
  const [result, setResult] = useState<AICommandResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleExecute = useCallback(async () => {
    if (!command.trim() || stage === 'thinking' || stage === 'understanding' || stage === 'validating' || stage === 'executing') {
      return;
    }

    setResult(null);
    setErrorMessage(null);

    // Animate through stages
    setStage('thinking');
    await sleep(600);
    setStage('understanding');

    try {
      const response = await aiApi.executeCommand(command.trim());
      const data = response.data.data as AICommandResponse;

      if (data.status === 'success') {
        setStage('validating');
        await sleep(400);
        setStage('executing');
        await sleep(400);
        setStage('completed');
      } else {
        if (data.stage === 'parsing') {
          setStage('error');
        } else if (data.stage === 'validation') {
          setStage('validating');
          await sleep(300);
          setStage('error');
        } else {
          setStage('executing');
          await sleep(300);
          setStage('error');
        }
        setErrorMessage(data.error || 'An unknown error occurred');
      }

      setResult(data);
    } catch (err: any) {
      setStage('error');
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to execute command. Please try again.';
      setErrorMessage(msg);
    }
  }, [command, stage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleExecute();
    }
  };

  const handleExampleClick = (example: string) => {
    setCommand(example);
    setStage('idle');
    setResult(null);
    setErrorMessage(null);
  };

  const isProcessing = ['thinking', 'understanding', 'validating', 'executing'].includes(stage);
  const stageInfo = STAGE_CONFIG[stage];
  const StageIcon = stageInfo.icon;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl"
          style={{ background: 'linear-gradient(135deg, hsl(280, 80%, 55%), hsl(220, 90%, 55%))' }}>
          <Bot className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">AI Command</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Control campaigns with natural language
          </p>
        </div>
      </div>

      {/* Main Command Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-lg"
        style={{
          boxShadow: '0 4px 24px hsl(var(--primary) / 0.06), 0 1px 3px hsl(var(--primary) / 0.04)',
        }}
      >
        {/* Input Area */}
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-[hsl(var(--primary))]" />
            <span className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
              What would you like to do?
            </span>
          </div>

          <textarea
            id="ai-command-input"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. Send Offer template to Clients using Gmail SMTP"
            disabled={isProcessing}
            rows={3}
            className="w-full resize-none rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-3 text-[15px] text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground)/0.5)] focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.2)] disabled:opacity-50 transition-all duration-200"
          />

          {/* Execute Button */}
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-[hsl(var(--muted-foreground))]">
              Press <kbd className="rounded border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] px-1.5 py-0.5 font-mono text-xs">Enter</kbd> to execute
            </span>

            <button
              id="ai-execute-button"
              onClick={handleExecute}
              disabled={!command.trim() || isProcessing}
              className="inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: isProcessing
                  ? 'hsl(var(--muted))'
                  : 'linear-gradient(135deg, hsl(280, 80%, 55%), hsl(220, 90%, 55%))',
                boxShadow: !isProcessing && command.trim()
                  ? '0 4px 14px hsl(280, 80%, 55%, 0.35)'
                  : 'none',
              }}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Execute
                </>
              )}
            </button>
          </div>
        </div>

        {/* Example Commands */}
        <div className="mt-5 border-t border-[hsl(var(--border))] pt-4">
          <span className="text-xs font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
            Examples
          </span>
          <div className="mt-2 flex flex-wrap gap-2">
            {EXAMPLE_COMMANDS.map((example) => (
              <button
                key={example}
                onClick={() => handleExampleClick(example)}
                disabled={isProcessing}
                className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.5)] px-3 py-1.5 text-xs text-[hsl(var(--foreground))] transition-all duration-150 hover:border-[hsl(var(--primary)/0.4)] hover:bg-[hsl(var(--primary)/0.08)] hover:text-[hsl(var(--primary))] disabled:opacity-40"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Status Pipeline */}
      <AnimatePresence mode="wait">
        {stage !== 'idle' && (
          <motion.div
            key="status"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-sm"
          >
            <h3 className="mb-4 text-sm font-semibold text-[hsl(var(--foreground))]">
              AI Status
            </h3>

            {/* Progress Steps */}
            <div className="flex items-center gap-2 flex-wrap">
              {(['thinking', 'understanding', 'validating', 'executing', 'completed'] as PipelineStage[]).map((s, i) => {
                const isActive = s === stage;
                const isPast = getStageIndex(stage) > getStageIndex(s);
                const stepInfo = STAGE_CONFIG[s];
                const Icon = stepInfo.icon;

                return (
                  <div key={s} className="flex items-center gap-2">
                    <motion.div
                      animate={{
                        scale: isActive ? 1.05 : 1,
                        opacity: isPast || isActive ? 1 : 0.35,
                      }}
                      className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium"
                      style={{
                        backgroundColor: isPast
                          ? 'hsl(142, 71%, 45%, 0.12)'
                          : isActive
                            ? `${stepInfo.color.replace(')', ', 0.12)').replace('hsl', 'hsl')}`
                            : 'hsl(var(--secondary))',
                        color: isPast
                          ? 'hsl(142, 71%, 45%)'
                          : isActive
                            ? stepInfo.color
                            : 'hsl(var(--muted-foreground))',
                      }}
                    >
                      {isPast ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : isActive && isProcessing ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Icon className="h-3.5 w-3.5" />
                      )}
                      {stepInfo.label.replace('...', '')}
                    </motion.div>
                    {i < 4 && (
                      <ChevronRight className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground)/0.3)]" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Current Stage Banner */}
            <motion.div
              key={stage}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="mt-4 flex items-center gap-3 rounded-xl p-3"
              style={{
                backgroundColor: stage === 'error'
                  ? 'hsl(0, 84%, 60%, 0.08)'
                  : stage === 'completed'
                    ? 'hsl(142, 71%, 45%, 0.08)'
                    : 'hsl(var(--primary) / 0.06)',
                borderLeft: `3px solid ${stageInfo.color}`,
              }}
            >
              {isProcessing ? (
                <Loader2 className="h-5 w-5 animate-spin flex-shrink-0" style={{ color: stageInfo.color }} />
              ) : (
                <StageIcon className="h-5 w-5 flex-shrink-0" style={{ color: stageInfo.color }} />
              )}
              <span className="text-sm font-medium" style={{ color: stageInfo.color }}>
                {stageInfo.label}
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Parsed Command */}
      <AnimatePresence mode="wait">
        {result?.parsedCommand && (
          <motion.div
            key="parsed"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-sm"
          >
            <h3 className="mb-4 text-sm font-semibold text-[hsl(var(--foreground))]">
              Parsed Command
            </h3>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <InfoChip
                icon={<Zap className="h-4 w-4" />}
                label="Action"
                value={formatAction(result.parsedCommand.action)}
                color="hsl(280, 80%, 55%)"
              />

              {result.parsedCommand.group && (
                <InfoChip
                  icon={<Users className="h-4 w-4" />}
                  label="Group"
                  value={result.parsedCommand.group}
                  color="hsl(220, 90%, 55%)"
                />
              )}

              {result.parsedCommand.template && (
                <InfoChip
                  icon={<Mail className="h-4 w-4" />}
                  label="Template"
                  value={result.parsedCommand.template}
                  color="hsl(142, 71%, 45%)"
                />
              )}

              {result.parsedCommand.smtp && (
                <InfoChip
                  icon={<Server className="h-4 w-4" />}
                  label="SMTP"
                  value={result.parsedCommand.smtp}
                  color="hsl(32, 95%, 50%)"
                />
              )}

              {result.parsedCommand.campaign && (
                <InfoChip
                  icon={<Send className="h-4 w-4" />}
                  label="Campaign"
                  value={result.parsedCommand.campaign}
                  color="hsl(220, 90%, 55%)"
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Validation Status */}
      <AnimatePresence mode="wait">
        {result?.validation && (
          <motion.div
            key="validation"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-sm"
          >
            <h3 className="mb-3 text-sm font-semibold text-[hsl(var(--foreground))]">
              Validation Status
            </h3>

            {result.validation.valid ? (
              <div className="flex items-center gap-2 rounded-xl bg-[hsl(142,71%,45%,0.08)] p-3">
                <CheckCircle2 className="h-5 w-5 text-[hsl(142,71%,45%)]" />
                <span className="text-sm font-medium text-[hsl(142,71%,45%)]">
                  All fields validated successfully
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                {result.validation.errors?.map((err, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-xl bg-[hsl(0,84%,60%,0.08)] p-3">
                    <XCircle className="h-4 w-4 flex-shrink-0 text-[hsl(0,84%,60%)]" />
                    <span className="text-sm text-[hsl(0,84%,60%)]">{err}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Show resolved details */}
            {result.validation.resolved && (
              <div className="mt-3 grid gap-2 rounded-xl bg-[hsl(var(--secondary)/0.4)] p-3 text-xs text-[hsl(var(--muted-foreground))]">
                {result.validation.resolved.groupName && (
                  <div>
                    <span className="font-medium">Group:</span> {result.validation.resolved.groupName}
                    {result.validation.resolved.contactCount !== undefined &&
                      ` (${result.validation.resolved.contactCount} contacts)`}
                  </div>
                )}
                {result.validation.resolved.templateName && (
                  <div><span className="font-medium">Template:</span> {result.validation.resolved.templateName}</div>
                )}
                {result.validation.resolved.smtpName && (
                  <div><span className="font-medium">SMTP:</span> {result.validation.resolved.smtpName}</div>
                )}
                {result.validation.resolved.campaignName && (
                  <div><span className="font-medium">Campaign:</span> {result.validation.resolved.campaignName}</div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Execution Result */}
      <AnimatePresence mode="wait">
        {result?.execution && (
          <motion.div
            key="execution"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-sm"
          >
            <h3 className="mb-3 text-sm font-semibold text-[hsl(var(--foreground))]">
              Execution Result
            </h3>

            {result.execution.success ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 rounded-xl bg-[hsl(142,71%,45%,0.08)] p-4">
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-[hsl(142,71%,45%)]" />
                  <span className="text-sm font-medium text-[hsl(142,71%,45%)]">
                    {result.execution.message}
                  </span>
                </div>

                {result.execution.campaignId && (
                  <button
                    onClick={() => navigate(`/campaigns/${result.execution!.campaignId}`)}
                    className="inline-flex items-center gap-2 rounded-xl border border-[hsl(var(--primary)/0.3)] bg-[hsl(var(--primary)/0.06)] px-4 py-2 text-sm font-medium text-[hsl(var(--primary))] transition-all hover:bg-[hsl(var(--primary)/0.12)]"
                  >
                    View Campaign
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-start gap-2 rounded-xl bg-[hsl(0,84%,60%,0.08)] p-4">
                <XCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-[hsl(0,84%,60%)]" />
                <div>
                  <p className="text-sm font-medium text-[hsl(0,84%,60%)]">
                    {result.execution.message}
                  </p>
                  {result.execution.error && (
                    <p className="mt-1 text-xs text-[hsl(0,84%,60%,0.7)]">
                      {result.execution.error}
                    </p>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Display (for non-API errors) */}
      <AnimatePresence mode="wait">
        {errorMessage && !result && (
          <motion.div
            key="error-generic"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-2xl border border-[hsl(0,84%,60%,0.2)] bg-[hsl(var(--card))] p-6 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <XCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-[hsl(0,84%,60%)]" />
              <div>
                <h3 className="text-sm font-semibold text-[hsl(0,84%,60%)]">Error</h3>
                <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{errorMessage}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// HELPER COMPONENTS
// ============================================

function InfoChip({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div
      className="flex items-center gap-3 rounded-xl p-3"
      style={{ backgroundColor: `${color.replace(')', ', 0.08)').replace('hsl', 'hsl')}` }}
    >
      <div
        className="flex h-8 w-8 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${color.replace(')', ', 0.15)').replace('hsl', 'hsl')}`, color }}
      >
        {icon}
      </div>
      <div>
        <div className="text-[10px] font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
          {label}
        </div>
        <div className="text-sm font-semibold text-[hsl(var(--foreground))]">{value}</div>
      </div>
    </div>
  );
}

// ============================================
// HELPERS
// ============================================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getStageIndex(s: PipelineStage): number {
  const order: PipelineStage[] = ['idle', 'thinking', 'understanding', 'validating', 'executing', 'completed'];
  return order.indexOf(s);
}

function formatAction(action: string): string {
  return action
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
