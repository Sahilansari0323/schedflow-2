import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  Zap,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  Check,
} from 'lucide-react';
import api, { getErrorMessage } from '../../api';
import GlassCard from '../../components/GlassCard';

const TYPE_LABEL: Record<string, string> = {
  teacher: 'Teacher Clash',
  room: 'Room Double-Booking',
  section: 'Section Clash',
  availability: 'Availability Violation',
  lab: 'Lab Mismatch',
  workload: 'Workload Overrun',
};

const ACTION_ICON: Record<string, string> = {
  move_slot: '🗓',
  change_room: '🏫',
  change_teacher: '👤',
};

interface Suggestion {
  entry_id: number;
  action: string;
  to_day?: number;
  to_period?: number;
  room_id?: number;
  teacher_id?: number;
  label: string;
  detail: string;
}

interface ConflictEntry {
  entry_id: number;
  timetable_id: number;
  day: number;
  period: number;
  subject_code: string;
  teacher_name: string;
  room_name: string;
  section_name: string;
}

interface ConflictItem {
  id: string;
  type: string;
  severity: string;
  message: string;
  entries: ConflictEntry[];
  suggestions?: Suggestion[];
}

interface ScanData {
  summary: {
    total: number;
    high: number;
    medium: number;
    low: number;
  };
  conflicts: ConflictItem[];
}

export default function AIResolver() {
  const [phase, setPhase] = useState<'loading' | 'ready'>('loading');
  const [data, setData] = useState<ScanData | null>(null);
  const [error, setError] = useState('');
  const [applying, setApplying] = useState<string | null>(null);
  const [toast, setToast] = useState<{ tone: 'ok' | 'warn' | 'err'; text: string } | null>(null);

  const load = () => {
    setPhase('loading');
    api
      .get('/conflicts/scan')
      .then((r) => {
        setData(r.data);
        setPhase('ready');
      })
      .catch((err) => {
        setError(getErrorMessage(err, 'Could not load timetable conflicts.'));
        setPhase('ready');
      });
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(t);
  }, [toast]);

  const apply = async (conflict: ConflictItem, opt: Suggestion, key: string) => {
    setApplying(key);
    setError('');
    try {
      const res = await api.post('/conflicts/apply', {
        entry_id: opt.entry_id,
        action: opt.action,
        to_day: opt.to_day,
        to_period: opt.to_period,
        room_id: opt.room_id,
        teacher_id: opt.teacher_id,
      });
      const remaining = res.data.remaining_conflicts?.length ?? 0;
      if (remaining === 0) {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#3b82f6', '#60a5fa', '#93c5fd', '#ffffff'],
        });
      }
      setToast({
        tone: remaining ? 'warn' : 'ok',
        text: remaining
          ? `Applied: ${opt.label}. ${remaining} conflict(s) still remain on this slot.`
          : `Applied: ${opt.label}. Matrix slot is now 100% conflict-free!`,
      });
      load();
    } catch (err: any) {
      setToast({
        tone: 'err',
        text: getErrorMessage(err, 'Could not apply automatic heuristic fix.'),
      });
    } finally {
      setApplying(null);
    }
  };

  const conflicts = data?.conflicts ?? [];
  const resolvable = conflicts.filter((c) => (c.suggestions?.length ?? 0) > 0);

  return (
    <div className="space-y-8 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Zap className="w-3 h-3 text-cyan-300" />
              Heuristic Engine
            </span>
            <span className="text-xs text-white/40 tracking-wider uppercase font-mono">
              CSP Solver 12ms
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
            AI Heuristic Resolver
          </h1>
          <p className="text-sm text-white/60 mt-1 max-w-2xl">
            Ranked, constraint-satisfaction repair paths for detected conflicts. Evaluates faculty
            workload caps, available physical venues, and curriculum windows in sub-second cycles.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={load}
            disabled={phase === 'loading'}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white/80 bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${phase === 'loading' ? 'animate-spin text-blue-400' : ''}`} />
            Re-evaluate
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            className={`p-4 rounded-xl border text-sm flex items-center justify-between shadow-xl ${
              toast.tone === 'ok'
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                : toast.tone === 'warn'
                ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-3">
              {toast.tone === 'ok' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              )}
              <span>{toast.text}</span>
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-white/40 hover:text-white text-xs px-2 py-1"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm">
          {error}
        </div>
      )}

      {/* State View: Loading / Empty / Resolvable Conflicts */}
      {phase === 'loading' ? (
        <GlassCard className="p-12 text-center flex flex-col items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-4"
          >
            <Zap className="w-6 h-6 text-cyan-300" />
          </motion.div>
          <h3 className="text-base font-medium text-white">Computing CSP Repair Trajectories…</h3>
          <p className="text-xs text-white/50 mt-1">
            Analyzing graph cuts and faculty availability matrices across all active cohorts.
          </p>
        </GlassCard>
      ) : conflicts.length === 0 ? (
        <GlassCard className="p-16 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 shadow-[0_0_24px_rgba(16,185,129,0.25)]">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-semibold text-white">Zero Clashes — Perfect Schedule</h2>
          <p className="text-sm text-white/50 mt-1.5 max-w-md">
            The CSP solver verifies that all timetables are currently fully relaxed with zero room,
            teacher, or cohort clashes.
          </p>
          <div className="mt-6 flex items-center gap-3">
            <Link
              to="/admin/conflicts"
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-white/10 hover:bg-white/15 border border-white/10 transition"
            >
              Review Radar Status
            </Link>
            <Link
              to="/admin/builder"
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white/70 hover:text-white transition flex items-center gap-1"
            >
              Open Builder <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </GlassCard>
      ) : (
        <div className="space-y-6">
          {/* Header Metric Bar */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="px-4 py-1.5 rounded-full text-xs font-semibold bg-white/10 text-white border border-white/15">
              {conflicts.length} conflict{conflicts.length !== 1 ? 's' : ''} detected
            </span>
            <span className="px-4 py-1.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
              {resolvable.length} with 1-click ranked solutions
            </span>
            {conflicts.length > resolvable.length && (
              <Link
                to="/admin/conflicts"
                className="text-xs text-white/50 hover:text-white flex items-center gap-1.5 ml-auto transition"
              >
                Inspect unresolvable in Radar <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          {/* Conflict Resolver Cards */}
          <div className="space-y-4">
            {conflicts.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.06, 0.4) }}
              >
                <GlassCard className="overflow-hidden border border-white/10">
                  {/* Card Title Bar */}
                  <div className="p-5 border-b border-white/10 bg-white/[0.02] flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          {TYPE_LABEL[c.type] || c.type}
                        </span>
                        <span className="text-xs font-mono uppercase text-white/40">
                          {c.severity} severity
                        </span>
                      </div>
                      <h4 className="text-sm font-medium text-white/90">{c.message}</h4>
                    </div>

                    {/* Matrix Coordinates */}
                    <div className="flex flex-wrap gap-1.5">
                      {c.entries.map((e) => (
                        <span
                          key={e.entry_id}
                          className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] text-white/70"
                        >
                          {e.subject_code} • {e.teacher_name} • {e.room_name}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Suggestions Section */}
                  <div className="p-5">
                    {c.suggestions && c.suggestions.length > 0 ? (
                      <div className="space-y-2.5">
                        <div className="text-xs text-white/40 uppercase tracking-wider font-mono mb-2">
                          Ranked Candidate Solutions
                        </div>
                        {c.suggestions.map((opt, oi) => {
                          const key = `${c.id}:${oi}`;
                          const isBest = oi === 0;
                          const isBusy = applying === key;

                          return (
                            <div
                              key={key}
                              className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                                isBest
                                  ? 'bg-blue-500/10 border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.15)]'
                                  : 'bg-white/[0.02] border-white/5 hover:border-white/15'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <span className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-lg shrink-0">
                                  {ACTION_ICON[opt.action] || '✦'}
                                </span>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-white">
                                      {opt.label}
                                    </span>
                                    {isBest && (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-blue-500 to-indigo-500 text-white flex items-center gap-1 shadow-sm">
                                        <Sparkles className="w-2.5 h-2.5" /> Optimal
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-white/60 mt-0.5">{opt.detail}</p>
                                </div>
                              </div>

                              <button
                                onClick={() => apply(c, opt, key)}
                                disabled={isBusy || applying !== null}
                                className={`px-4 py-2 rounded-xl text-xs font-semibold shrink-0 transition flex items-center gap-2 ${
                                  isBest
                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)] hover:brightness-110'
                                    : 'bg-white/10 text-white/80 hover:bg-white/15 hover:text-white border border-white/10'
                                } disabled:opacity-50`}
                              >
                                {isBusy ? (
                                  <>
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    Applying Solution…
                                  </>
                                ) : (
                                  <>
                                    <Check className="w-3.5 h-3.5" />
                                    Apply Fix
                                  </>
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-white/50 flex items-center justify-between">
                        <span>
                          No automated permutation relaxed this constraint without secondary
                          cascades. Manual adjustment required in the matrix builder.
                        </span>
                        <Link
                          to="/admin/builder"
                          className="font-semibold text-blue-400 hover:underline shrink-0 ml-4"
                        >
                          Open Builder
                        </Link>
                      </div>
                    )}
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
