import React, { useEffect, useState } from 'react';
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
import api, { getErrorMessage } from '../../shared/api';
import GlassCard from '../../shared/components/GlassCard';
import AppleButton from '../../shared/components/AppleButton';

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
    badgeCls: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    dotCls: 'bg-rose-500',
  },
  room: {
    label: 'Room Double-Booking',
    badgeCls: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    dotCls: 'bg-orange-500',
  },
  section: {
    label: 'Section Clash',
    badgeCls: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    dotCls: 'bg-amber-500',
  },
  availability: {
    label: 'Availability Violation',
    badgeCls: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    dotCls: 'bg-sky-500',
  },
  lab: {
    label: 'Lab Resource Mismatch',
    badgeCls: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    dotCls: 'bg-purple-500',
  },
  workload: {
    label: 'Workload Cap Overrun',
    badgeCls: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30',
    dotCls: 'bg-zinc-500',
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

  const silentRefresh = () => {
    api
      .get('/conflicts/scan')
      .then((r) => {
        setData(r.data);
      })
      .catch(() => {});
  };

  useEffect(() => {
    runScan();
    const interval = setInterval(silentRefresh, 15000);
    return () => clearInterval(interval);
  }, []);

  const scanning = phase === 'scanning';

  const filteredConflicts = (data?.conflicts || []).filter((c) => {
    if (filterSeverity === 'all') return true;
    return c.severity === filterSeverity;
  });

  return (
    <div className="space-y-8 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-[rgba(16,20,32,0.65)] border border-white/10 backdrop-blur-3xl shadow-[0_14px_40px_rgba(0,0,0,0.5)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#74C947]/10 text-[#74C947] border border-[#74C947]/30">
              <Radio className="w-3 h-3 text-[#74C947] animate-pulse" />
              Diagnostics Core
            </span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white">Conflict Radar</h2>
          <p className="text-xs text-white/60 mt-1 max-w-2xl">
            Real-time constraint radar evaluating teacher double-bookings, room overlaps, and workload caps.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <AppleButton variant="glass" size="md" onClick={runScan} disabled={scanning} className="bg-white/[0.06] hover:bg-white/[0.12]">
            <RefreshCw className={`w-4 h-4 ${scanning ? 'animate-spin text-[#74C947]' : ''}`} />
            <span>{scanning ? 'Sweeping Radar…' : 'Run Full Radar'}</span>
          </AppleButton>
          {data && data.summary.total > 0 && (
            <Link to="/admin/resolver">
              <AppleButton variant="primary" size="md">
                <Zap className="w-4 h-4" />
                <span>Resolve with AI</span>
              </AppleButton>
            </Link>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs text-center font-medium">
          {error}
        </div>
      )}

      {/* Radar scanning indicator animation */}
      <AnimatePresence>
        {scanning && (
          <GlassCard className="!p-6 relative overflow-hidden">
            <div className="flex items-center gap-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-12 h-12 rounded-2xl bg-[#74C947]/15 border border-[#74C947]/30 flex items-center justify-center text-[#74C947]"
              >
                <Radio className="w-6 h-6" />
              </motion.div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Executing Global Radar Sweep…
                </h3>
                <p className="text-xs text-white/60 mt-0.5">
                  Scanning 6-day academic matrix across all active departments, physical classrooms,
                  and faculty allocations.
                </p>
              </div>
            </div>
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#74C947] to-transparent"
            />
          </GlassCard>
        )}
      </AnimatePresence>

      {/* Telemetry Summary Cards */}
      {phase === 'done' && data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <GlassCard className="!p-5">
            <div className="text-xs text-white/50 uppercase tracking-wider font-mono font-medium">
              Total Conflicts
            </div>
            <div className="text-3xl font-extrabold tracking-tight text-white mt-2">
              {data.summary.total}
            </div>
            <div className="text-xs text-white/50 mt-1">Detected across slots</div>
          </GlassCard>

          <GlassCard className="!p-5">
            <div className="text-xs text-rose-400 uppercase tracking-wider font-mono font-semibold">
              High Severity
            </div>
            <div className="text-3xl font-extrabold tracking-tight text-rose-400 mt-2">
              {data.summary.high}
            </div>
            <div className="text-xs text-white/50 mt-1">Direct double-bookings</div>
          </GlassCard>

          <GlassCard className="!p-5">
            <div className="text-xs text-amber-400 uppercase tracking-wider font-mono font-semibold">
              Medium Severity
            </div>
            <div className="text-3xl font-extrabold tracking-tight text-amber-400 mt-2">
              {data.summary.medium}
            </div>
            <div className="text-xs text-white/50 mt-1">Availability & capacity</div>
          </GlassCard>

          <GlassCard className="!p-5">
            <div className="text-xs text-[#74C947] uppercase tracking-wider font-mono font-semibold">
              Low Severity
            </div>
            <div className="text-3xl font-extrabold tracking-tight text-[#74C947] mt-2">
              {data.summary.low}
            </div>
            <div className="text-xs text-white/50 mt-1">Curriculum warnings</div>
          </GlassCard>
        </div>
      )}

      {/* Filter and List */}
      {phase === 'done' && data && (
        <GlassCard variant="pro" className="!p-6 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-white">Radar Stream Output</span>
              <span className="text-xs font-mono text-white/40">
                ({filteredConflicts.length} of {data.summary.total} flagged)
              </span>
            </div>

            <div className="flex items-center gap-2">
              {['all', 'high', 'medium', 'low'].map((sev) => (
                <button
                  key={sev}
                  onClick={() => setFilterSeverity(sev)}
                  className={`px-3 py-1 rounded-xl text-xs font-mono uppercase transition cursor-pointer font-medium ${
                    filterSeverity === sev
                      ? 'bg-[#74C947] text-[#081a05] font-bold shadow-[0_0_12px_rgba(116,201,71,0.3)]'
                      : 'text-white/60 hover:text-white bg-white/[0.04]'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          {filteredConflicts.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#74C947]/15 border border-[#74C947]/30 flex items-center justify-center text-[#74C947] mx-auto shadow-[0_0_20px_rgba(116,201,71,0.2)]">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Matrix 100% Invariant Compliant</h3>
              <p className="text-xs text-white/60 max-w-sm mx-auto">
                No faculty overlaps, venue double-bookings, or unavailable slot violations detected in this view.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredConflicts.map((c) => {
                const meta = TYPE_META[c.type] || {
                  label: c.type,
                  badgeCls: 'bg-white/10 text-white border-white/20',
                  dotCls: 'bg-white/50',
                };

                return (
                  <div
                    key={c.id}
                    className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 shadow-sm space-y-3 hover:border-white/20 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${meta.dotCls}`} />
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${meta.badgeCls}`}>
                          {meta.label}
                        </span>
                        <span className="text-xs font-mono uppercase text-white/40">
                          {c.severity} severity
                        </span>
                      </div>

                      <Link to="/admin/resolver">
                        <AppleButton variant="glow" size="sm">
                          <Zap className="w-3 h-3" />
                          <span>AI Fix</span>
                        </AppleButton>
                      </Link>
                    </div>

                    <p className="text-sm text-white font-medium">{c.message}</p>

                    {/* Conflicting entries breakdown */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      {c.entries.map((e, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-white/[0.03] border border-white/10 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[#74C947] font-semibold">{e.subject_code}</span>
                            <span className="text-white/40 font-mono">
                              {DAY_NAMES[e.day]} P{e.period}
                            </span>
                          </div>
                          <div className="text-white font-medium">{e.teacher_name}</div>
                          <div className="text-white/60 flex items-center justify-between text-[11px]">
                            <span>Venue: {e.room_name}</span>
                            <span>Sec: {e.section_name}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>
      )}
    </div>
  );
}
