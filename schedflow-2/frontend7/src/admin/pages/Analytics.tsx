import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  BarChart3,
  TrendingUp,
  Users,
  DoorOpen,
  Calendar,
  AlertTriangle,
  RefreshCw,
  Clock,
  Sparkles,
} from 'lucide-react';
import api, { getErrorMessage } from '../../shared/api';
import GlassCard from '../../shared/components/GlassCard';
import { ReplyButton, CTAButton } from '../../shared/components/AppleButton';

interface AnalyticsData {
  room_utilization: Array<{
    room_id: number;
    room_name: string;
    capacity: number;
    assigned_slots: number;
    utilization_rate: number;
  }>;
  faculty_workload: Array<{
    teacher_id: number;
    teacher_name: string;
    max_weekly_load: number;
    assigned_hours: number;
    load_percentage: number;
  }>;
  schedule_gaps: {
    average_gap_periods: number;
    sections_with_fragmented_schedules: number;
  };
  section_density: Array<{
    section_id: number;
    section_name: string;
    semester_number: number;
    total_slots_filled: number;
  }>;
}

export default function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    setError(null);
    try {
      const res = await api.get('/analytics');
      const raw = res.data;
      if (!raw) return;

      const mappedData: AnalyticsData = {
        room_utilization: raw.room_utilization || (raw.rooms || []).map((r: any, idx: number) => ({
          room_id: r.id ?? idx,
          room_name: r.name,
          capacity: r.capacity ?? 60,
          assigned_slots: r.used ?? r.assigned_slots ?? 0,
          utilization_rate: r.utilization ?? r.utilization_rate ?? 0,
        })),
        faculty_workload: raw.faculty_workload || (raw.teachers || []).map((t: any, idx: number) => ({
          teacher_id: t.id ?? idx,
          teacher_name: t.name,
          max_weekly_load: t.max ?? t.max_weekly_load ?? 20,
          assigned_hours: t.assigned ?? t.assigned_hours ?? 0,
          load_percentage: t.max ? Math.round((t.assigned / t.max) * 100) : (t.load_percentage ?? 0),
        })),
        schedule_gaps: raw.schedule_gaps || {
          average_gap_periods: raw.gaps && Array.isArray(raw.gaps) && raw.gaps.length > 0
            ? Number((raw.gaps.reduce((acc: number, item: any) => acc + (item[1]?.gaps || 0), 0) / raw.gaps.length).toFixed(1))
            : 0,
          sections_with_fragmented_schedules: raw.gaps && Array.isArray(raw.gaps)
            ? raw.gaps.filter((item: any) => (item[1]?.gaps || 0) > 0).length
            : 0,
        },
        section_density: raw.section_density || (raw.sections || []).map((s: any, idx: number) => ({
          section_id: s.id ?? idx,
          section_name: s.name,
          semester_number: s.semester ?? 1,
          total_slots_filled: s.filled ?? s.total_slots_filled ?? 0,
        })),
      };

      setData(mappedData);
    } catch (err: any) {
      if (!isBackground) setError(getErrorMessage(err, 'Unable to load campus analytics data.'));
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(() => fetchAnalytics(true), 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#74C947]/10 text-[#74C947] border border-[#74C947]/30 font-mono">
              <BarChart3 className="w-3.5 h-3.5" />
              CAMPUS TELEMETRY
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Campus Analytics & Utilization
          </h1>
          <p className="text-xs sm:text-sm text-white/60 mt-1 max-w-2xl leading-relaxed">
            Real-time physical venue occupancy bounds, faculty workload distribution metrics, and student schedule continuity analysis.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ReplyButton size="sm" onClick={() => fetchAnalytics(false)} disabled={loading} className="bg-white/[0.06] hover:bg-white/[0.12]">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Refreshing…' : 'Refresh Telemetry'}</span>
          </ReplyButton>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard variant="pro" className="!p-5 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono text-white/50 uppercase">
            <span>Avg Venue Utilization</span>
            <DoorOpen className="w-4 h-4 text-[#74C947]" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">
            {data?.room_utilization?.length
              ? Math.round(
                  data.room_utilization.reduce((acc, r) => acc + (r.utilization_rate || 0), 0) /
                    data.room_utilization.length
                )
              : 0}
            %
          </div>
          <div className="text-[11px] text-white/50">Across all registered physical venues</div>
        </GlassCard>

        <GlassCard variant="pro" className="!p-5 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono text-white/50 uppercase">
            <span>Active Faculty</span>
            <Users className="w-4 h-4 text-[#74C947]" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">
            {data?.faculty_workload?.length || 0}
          </div>
          <div className="text-[11px] text-white/50">Assigned to academic teaching blocks</div>
        </GlassCard>

        <GlassCard variant="pro" className="!p-5 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono text-white/50 uppercase">
            <span>Schedule Continuity Gap</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">
            {data?.schedule_gaps?.average_gap_periods ?? 0.0}
            <span className="text-sm font-normal text-white/50 ml-1">periods</span>
          </div>
          <div className="text-[11px] text-white/50">
            {data?.schedule_gaps?.sections_with_fragmented_schedules || 0} sections with schedule gaps
          </div>
        </GlassCard>

        <GlassCard variant="pro" className="!p-5 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono text-white/50 uppercase">
            <span>Cohort Divisions</span>
            <Calendar className="w-4 h-4 text-[#74C947]" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">
            {data?.section_density?.length || 0}
          </div>
          <div className="text-[11px] text-white/50">Active academic section cohorts</div>
        </GlassCard>
      </div>

      {/* Two Columns: Room Utilization & Faculty Workload */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Room Utilization */}
        <GlassCard variant="pro" className="!p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div>
              <h3 className="text-base font-bold text-white">Room & Venue Utilization</h3>
              <p className="text-xs text-white/50">Assigned periods vs available weekly capacity</p>
            </div>
            <span className="text-xs font-mono text-[#74C947] font-semibold">
              {data?.room_utilization?.length || 0} Venues
            </span>
          </div>

          <div className="space-y-4 max-h-[460px] overflow-y-auto no-scrollbar pr-1">
            {data?.room_utilization?.map((r) => (
              <div key={r.room_id} className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="font-semibold text-white">{r.room_name}</div>
                  <div className="font-mono text-[#74C947] font-medium">
                    {r.assigned_slots} periods ({Math.round(r.utilization_rate)}%)
                  </div>
                </div>
                <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, r.utilization_rate)}%`,
                      backgroundColor:
                        r.utilization_rate > 85 ? '#f43f5e' : r.utilization_rate > 50 ? '#74C947' : '#22c55e',
                    }}
                  />
                </div>
                <div className="text-[10px] text-white/40 font-mono">
                  Seating Capacity: {r.capacity} seats
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Faculty Workload */}
        <GlassCard variant="pro" className="!p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div>
              <h3 className="text-base font-bold text-white">Faculty Workload Ceiling</h3>
              <p className="text-xs text-white/50">Current assigned hours vs maximum weekly threshold</p>
            </div>
            <span className="text-xs font-mono text-[#74C947] font-semibold">
              {data?.faculty_workload?.length || 0} Faculty
            </span>
          </div>

          <div className="space-y-4 max-h-[460px] overflow-y-auto no-scrollbar pr-1">
            {data?.faculty_workload?.map((f) => (
              <div key={f.teacher_id} className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="font-semibold text-white">{f.teacher_name}</div>
                  <div className="font-mono text-[#74C947] font-medium">
                    {f.assigned_hours} / {f.max_weekly_load} hrs ({Math.round(f.load_percentage)}%)
                  </div>
                </div>
                <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, f.load_percentage)}%`,
                      backgroundColor:
                        f.load_percentage > 95 ? '#f43f5e' : f.load_percentage > 60 ? '#74C947' : '#22c55e',
                    }}
                  />
                </div>
                <div className="text-[10px] text-white/40 font-mono">
                  {f.load_percentage >= 100
                    ? 'Maximum weekly teaching capacity reached'
                    : `${f.max_weekly_load - f.assigned_hours} hours available bandwidth`}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Section Schedule Saturation */}
      <GlassCard variant="pro" className="!p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div>
            <h3 className="text-base font-bold text-white">Section Timetable Saturation</h3>
            <p className="text-xs text-white/50">Curriculum slot filling across active divisions</p>
          </div>
          <span className="text-xs font-mono text-white/50">
            Total Sections: {data?.section_density?.length || 0}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.section_density?.map((sec) => (
            <div key={sec.section_id} className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 shadow-sm space-y-1">
              <div className="text-[11px] font-mono text-[#74C947] font-semibold">Semester {sec.semester_number}</div>
              <div className="font-bold text-sm text-white">Section {sec.section_name}</div>
              <div className="text-xs text-white/60 font-mono">
                {sec.total_slots_filled} / 40 periods scheduled ({Math.round((sec.total_slots_filled / 40) * 100)}%)
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
