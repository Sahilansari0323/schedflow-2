import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Zap,
  Radio,
  Calendar,
  Layers,
  MapPin,
  User,
  Clock,
  ArrowRight,
} from 'lucide-react';
import api, { getErrorMessage } from '../../api';
import GlassCard from '../../components/GlassCard';

interface ConflictEntry {
  entry_id: number;
  timetable_id: number;
  day: number;
  period: number;
  subject_code: string;
  teacher_name: string;
  room_name: string;
  section_name: string;
  status: string;
}

interface ConflictItem {
  id: string;
  type: 'teacher' | 'room' | 'section' | 'availability' | 'lab' | 'workload' | string;
  severity: 'high' | 'medium' | 'low';
  message: string;
  entries: ConflictEntry[];
  suggestions?: Array<{
    label: string;
    action: string;
    detail: string;
  }>;
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

const TYPE_META: Record<string, { label: string; badgeCls: string; dotCls: string }> = {
  teacher: {
    label: 'Teacher Clash',
    badgeCls: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    dotCls: 'bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.6)]',
  },
  room: {
    label: 'Room Double-Booking',
    badgeCls: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
    dotCls: 'bg-orange-400 shadow-[0_0_8px_rgba(249,115,22,0.6)]',
  },
  section: {
    label: 'Section Clash',
    badgeCls: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    dotCls: 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.6)]',
  },
  availability: {
    label: 'Availability Violation',
    badgeCls: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    dotCls: 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.6)]',
  },
  lab: {
    label: 'Lab Resource Mismatch',
    badgeCls: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    dotCls: 'bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.6)]',
  },
  workload: {
    label: 'Workload Cap Overrun',
    badgeCls: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
    dotCls: 'bg-slate-400',
  },
};

const DAY_NAMES: Record<number, string> = {
  1: 'Mon',
  2: 'Tue',
  3: 'Wed',
  4: 'Thu',
  5: 'Fri',
  6: 'Sat',
};

export default function ConflictDetection() {
  const [phase, setPhase] = useState<'idle' | 'scanning' | 'done'>('scanning');
  const [data, setData] = useState<ScanData | null>(null);
  const [error, setError] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  const runScan = () => {
    setPhase('scanning');
    setError('');
    const startedAt = Date.now();
    api
      .get('/conflicts/scan')
      .then((r) => {
        const wait = Math.max(0, 800 - (Date.now() - startedAt));
        setTimeout(() => {
          setData(r.data);
          setPhase('done');
        }, wait);
      })
      .catch((err) => {
        setError(getErrorMessage(err, 'Global matrix conflict scan failed.'));
        setPhase('done');
      });
  };

  useEffect(() => {
    runScan();
  }, []);

  const scanning = phase === 'scanning';

  const filteredConflicts = (data?.conflicts || []).filter((c) => {
    if (filterSeverity === 'all') return true;
    return c.severity === filterSeverity;
  });

  return (
    <div className="space-y-8 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Radio className="w-3 h-3 text-blue-400 animate-pulse" />
              Diagnostics Core
            </span>
            <span className="text-xs text-white/40 tracking-wider uppercase font-mono">
              Deterministic Radar
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
            Conflict Detection
          </h1>
          <p className="text-sm text-white/60 mt-1 max-w-2xl">
            Real-time constraint radar evaluating teacher double-bookings, room overlaps,
            availability caps, and curriculum invariants across the campus matrix.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={runScan}
            disabled={scanning}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white/80 bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${scanning ? 'animate-spin text-blue-400' : ''}`} />
            {scanning ? 'Scanning Matrix…' : 'Run Full Radar'}
          </button>
          {data && data.summary.total > 0 && (
            <Link
              to="/admin/resolver"
              className="btn-wave flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:brightness-110 transition"
            >
              <Zap className="w-4 h-4 text-cyan-300" />
              Resolve with AI
            </Link>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm">
          {error}
        </div>
      )}

      {/* Radar scanning indicator animation */}
      <AnimatePresence>
        {scanning && (
          <GlassCard className="p-6 relative overflow-hidden">
            <div className="flex items-center gap-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400"
              >
                <Radio className="w-6 h-6" />
              </motion.div>
              <div>
                <h3 className="text-base font-medium text-white">
                  Executing Global Radar Sweep…
                </h3>
                <p className="text-xs text-white/50 mt-0.5">
                  Scanning 6-day academic matrix across all active departments, physical classrooms,
                  and faculty allocations.
                </p>
              </div>
            </div>
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent"
            />
          </GlassCard>
        )}
      </AnimatePresence>

      {/* Telemetry Summary Cards */}
      {phase === 'done' && data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <GlassCard className="p-5">
            <div className="text-xs text-white/50 uppercase tracking-wider font-mono">
              Total Conflicts
            </div>
            <div className="text-3xl font-semibold tracking-tight text-white mt-2">
              {data.summary.total}
            </div>
            <div className="text-xs text-white/40 mt-1">Detected across slots</div>
          </GlassCard>

          <GlassCard className="p-5">
            <div className="text-xs text-rose-400 uppercase tracking-wider font-mono">
              High Severity
            </div>
            <div className="text-3xl font-semibold tracking-tight text-rose-400 mt-2">
              {data.summary.high}
            </div>
            <div className="text-xs text-white/40 mt-1">Direct double-bookings</div>
          </GlassCard>

          <GlassCard className="p-5">
            <div className="text-xs text-amber-400 uppercase tracking-wider font-mono">
              Medium Severity
            </div>
            <div className="text-3xl font-semibold tracking-tight text-amber-400 mt-2">
              {data.summary.medium}
            </div>
            <div className="text-xs text-white/40 mt-1">Lab / Capacity mismatches</div>
          </GlassCard>

          <GlassCard className="p-5">
            <div className="text-xs text-sky-400 uppercase tracking-wider font-mono">
              Low Severity
            </div>
            <div className="text-3xl font-semibold tracking-tight text-sky-400 mt-2">
              {data.summary.low}
            </div>
            <div className="text-xs text-white/40 mt-1">Soft constraint warnings</div>
          </GlassCard>
        </div>
      )}

      {/* Filter and Conflict Feed */}
      {phase === 'done' && data && (
        <div className="space-y-4">
          {data.summary.total === 0 ? (
            <GlassCard className="p-16 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 shadow-[0_0_24px_rgba(16,185,129,0.25)]">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-semibold text-white">All Schedules Conflict-Free</h2>
              <p className="text-sm text-white/50 mt-1.5 max-w-md">
                Every teacher, classroom, lab, and section check has validated with zero overlaps
                across the entire university dataset.
              </p>
              <div className="mt-6 flex items-center gap-3">
                <Link
                  to="/admin/builder"
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-white/10 hover:bg-white/15 border border-white/10 transition"
                >
                  Open Matrix Builder
                </Link>
                <Link
                  to="/timetable"
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white/70 hover:text-white transition flex items-center gap-1"
                >
                  View Public Board <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </GlassCard>
          ) : (
            <>
              {/* Filter Tabs */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2 p-1 rounded-xl bg-white/[0.04] border border-white/10">
                  {['all', 'high', 'medium', 'low'].map((sev) => (
                    <button
                      key={sev}
                      onClick={() => setFilterSeverity(sev)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition ${
                        filterSeverity === sev
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : 'text-white/60 hover:text-white'
                      }`}
                    >
                      {sev === 'all' ? 'All Severities' : `${sev} Priority`}
                    </button>
                  ))}
                </div>

                <div className="text-xs text-white/40">
                  Showing {filteredConflicts.length} of {data.summary.total} detected violations
                </div>
              </div>

              {/* Conflict Cards Grid */}
              <div className="space-y-3">
                {filteredConflicts.map((c, i) => {
                  const meta = TYPE_META[c.type] || TYPE_META.workload;
                  return (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.05, 0.4) }}
                    >
                      <GlassCard className="p-5 border-l-4 border-l-blue-500">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <span className={`w-2.5 h-2.5 rounded-full ${meta.dotCls}`} />
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${meta.badgeCls}`}
                            >
                              {meta.label}
                            </span>
                            <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-white/5 text-white/50">
                              {c.severity} severity
                            </span>
                          </div>

                          <Link
                            to="/admin/resolver"
                            className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition"
                          >
                            Resolve with AI <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>

                        <p className="text-sm font-medium text-white/90 mt-3">{c.message}</p>

                        {/* Colliding Matrix Entries */}
                        <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap gap-2">
                          {c.entries.map((e) => (
                            <div
                              key={e.entry_id}
                              className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/10 text-xs text-white/80 flex items-center gap-2.5"
                            >
                              <span className="font-semibold text-blue-300">
                                {DAY_NAMES[e.day] || `Day ${e.day}`} P{e.period}
                              </span>
                              <span className="text-white/30">•</span>
                              <span className="text-white/90">{e.subject_code}</span>
                              <span className="text-white/30">•</span>
                              <span className="text-white/60">{e.teacher_name}</span>
                              <span className="text-white/30">•</span>
                              <span className="text-white/60">{e.room_name}</span>
                              <span className="text-white/30">•</span>
                              <span className="text-white/60">Sec {e.section_name}</span>
                              {e.status === 'draft' && (
                                <span className="text-[10px] text-amber-400 uppercase tracking-wider font-mono">
                                  [Draft]
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </GlassCard>
                    </motion.div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
