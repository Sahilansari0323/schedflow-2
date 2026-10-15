import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  BarChart3,
  DoorOpen,
  Users,
  Grid,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  Clock,
  Sparkles,
  Layers,
} from 'lucide-react';
import api, { getErrorMessage } from '../../api';
import GlassCard from '../../components/GlassCard';

interface AnalyticsData {
  rooms: Array<{
    name: string;
    room_type: string;
    used: number;
    utilization: number;
  }>;
  teachers: Array<{
    name: string;
    assigned: number;
    max: number;
    days: Record<string, number>;
  }>;
  gaps: Array<[string, { gaps: number; busy_days: number }]>;
  sections: Array<{
    name: string;
    semester: number;
    filled: number;
    fill_pct: number;
  }>;
}

export default function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/analytics');
      setData(res.data);
    } catch (err: any) {
      setError(getErrorMessage(err, 'Failed to fetch analytics metrics.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-8 select-none pb-12">
      {/* Header */}
      <GlassCard variant="compact" className="!p-8 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#00d2ff]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>FACILITY & FACULTY TELEMETRY</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Campus Schedule Analytics</h1>
            <p className="text-xs text-white/60">
              Live room capacity utilization, faculty weekly workload distribution, gap analysis, and section fill ratios.
            </p>
          </div>

          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="px-4 py-2.5 rounded-full liquid-glass border border-white/20 text-white text-xs font-medium hover:border-[#00d2ff]/60 flex items-center gap-2 transition-all cursor-pointer shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#00d2ff]' : ''}`} />
            <span>Refresh Telemetry</span>
          </button>
        </div>
      </GlassCard>

      {error && (
        <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading && !data && (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#00d2ff] border-t-transparent animate-spin" />
          <div className="text-xs text-white/50 font-mono">Aggregating cross-timetable matrix metrics...</div>
        </div>
      )}

      {data && (
        <div className="space-y-8">
          {/* Top Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. Room Utilization */}
            <GlassCard variant="compact" className="!p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#00d2ff]/10 border border-[#00d2ff]/30 flex items-center justify-center text-[#00d2ff]">
                    <DoorOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-white">Physical Venue Utilization</h3>
                    <div className="text-[11px] text-white/50">Weekly period load vs total 48 slots (6 days × 8)</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-[#00d2ff] px-2 py-0.5 rounded-full bg-[#00d2ff]/10 border border-[#00d2ff]/20">
                  {data.rooms.length} Rooms
                </span>
              </div>

              <div className="space-y-3 pt-2">
                {data.rooms.map((r) => (
                  <div key={r.name} className="space-y-1 text-xs">
                    <div className="flex items-center justify-between text-white/80">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{r.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/40 uppercase">
                          {r.room_type}
                        </span>
                      </div>
                      <div className="font-mono text-[11px]">
                        <span className="text-[#00d2ff] font-semibold">{r.used}</span>
                        <span className="text-white/40">/48 slots ({r.utilization}%)</span>
                      </div>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(r.utilization, 100)}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className={`h-full rounded-full ${
                          r.utilization > 75
                            ? 'bg-gradient-to-r from-[#00d2ff] to-emerald-400'
                            : 'bg-gradient-to-r from-blue-500 to-[#00d2ff]'
                        }`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* 2. Faculty Workload */}
            <GlassCard variant="compact" className="!p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center text-cyan-300">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-white">Faculty Workload Distribution</h3>
                    <div className="text-[11px] text-white/50">Assigned weekly teaching periods against cap</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-cyan-300 px-2 py-0.5 rounded-full bg-cyan-400/10 border border-cyan-400/20">
                  {data.teachers.length} Faculty
                </span>
              </div>

              <div className="space-y-3 pt-2">
                {data.teachers.map((t) => {
                  const pct = Math.round((t.assigned / (t.max || 20)) * 100);
                  const isOver = t.assigned > t.max;
                  return (
                    <div key={t.name} className="space-y-1 text-xs">
                      <div className="flex items-center justify-between text-white/80">
                        <span className="font-semibold text-white">{t.name}</span>
                        <div className="font-mono text-[11px]">
                          <span className={isOver ? 'text-rose-400 font-bold' : 'text-cyan-300 font-semibold'}>
                            {t.assigned}
                          </span>
                          <span className="text-white/40">/{t.max} cap ({pct}%)</span>
                        </div>
                      </div>
                      <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(pct, 100)}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          className={`h-full rounded-full ${
                            isOver
                              ? 'bg-gradient-to-r from-orange-500 to-rose-500'
                              : 'bg-gradient-to-r from-blue-600 to-cyan-400'
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </GlassCard>
          </div>

          {/* Bottom Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 3. Section Matrix Fill Ratios */}
            <GlassCard variant="compact" className="!p-6 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-400/10 border border-blue-400/30 flex items-center justify-center text-blue-400">
                  <Grid className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-white">Section Timetable Density</h3>
                  <div className="text-[11px] text-white/50">Scheduled instructional periods per student section</div>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                {data.sections.map((s) => (
                  <div key={s.name} className="space-y-1 text-xs">
                    <div className="flex items-center justify-between text-white/80">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">Section {s.name}</span>
                        <span className="text-[10px] text-white/40">Semester {s.semester}</span>
                      </div>
                      <div className="font-mono text-[11px]">
                        <span className="text-blue-400 font-semibold">{s.filled}</span>
                        <span className="text-white/40">/48 ({s.fill_pct}%)</span>
                      </div>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(s.fill_pct, 100)}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-400"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* 4. Faculty Gap Analysis */}
            <GlassCard variant="compact" className="!p-6 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-300">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-white">Faculty Idle Gap Analysis</h3>
                  <div className="text-[11px] text-white/50">Free periods between first and last lecture on teaching days</div>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                {data.gaps.map(([teacherName, stats]) => (
                  <div
                    key={teacherName}
                    className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-medium text-white">{teacherName}</div>
                      <div className="text-[10px] text-white/40">Teaches on {stats.busy_days} day(s) weekly</div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`font-mono font-semibold ${
                          stats.gaps > 4
                            ? 'text-amber-300'
                            : stats.gaps === 0
                            ? 'text-emerald-400'
                            : 'text-white/70'
                        }`}
                      >
                        {stats.gaps} idle period(s)
                      </div>
                      <div className="text-[10px] text-white/40">
                        {stats.gaps === 0 ? 'Compact schedule' : 'Fragmented schedule'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        </div>
      )}
    </div>
  );
}
