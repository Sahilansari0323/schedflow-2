import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  Clock,
  User,
  Calendar,
  Layers,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import api, { getErrorMessage } from '../../shared/api';
import GlassCard from '../../shared/components/GlassCard';

interface TeacherItem {
  id: number;
  name: string;
  email: string;
  employee_code?: string;
  max_weekly_load: number;
}

interface ScheduleEntry {
  id?: number;
  day_of_week: number;
  period: number;
  subject_code: string;
  subject_name: string;
  section_name: string;
  room_name: string;
}

interface ScheduleData {
  teacher: TeacherItem;
  assigned_periods: number;
  entries: ScheduleEntry[];
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function Schedules() {
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [teacherId, setTeacherId] = useState('');
  const [data, setData] = useState<ScheduleData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/teachers')
      .then((r) => {
        setTeachers(r.data);
        if (r.data.length > 0) {
          setTeacherId(String(r.data[0].id));
          loadSchedule(r.data[0].id);
        }
      })
      .catch(() => {});
  }, []);

  const loadSchedule = (id: string | number) => {
    if (!id) return;
    setLoading(true);
    setError('');
    api
      .get(`/teachers/${id}/timetable`)
      .then((r) => setData(r.data))
      .catch((err) => setError(getErrorMessage(err, 'Could not fetch faculty timetable schedule.')))
      .finally(() => setLoading(false));
  };

  const handleTeacherChange = (id: string) => {
    setTeacherId(id);
    loadSchedule(id);
  };

  const loadPct = data
    ? Math.min(100, Math.round((data.assigned_periods / (data.teacher.max_weekly_load || 20)) * 100))
    : 0;
  const atCap = data && data.assigned_periods >= (data.teacher.max_weekly_load || 20);

  // Group entries by day and period
  const entryMap: Record<string, ScheduleEntry> = {};
  if (data?.entries) {
    data.entries.forEach((e) => {
      entryMap[`${e.day_of_week}-${e.period}`] = e;
    });
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-[rgba(16,20,32,0.65)] border border-white/10 backdrop-blur-3xl shadow-[0_14px_40px_rgba(0,0,0,0.5)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#74C947]/10 text-[#74C947] border border-[#74C947]/30">
              <Clock className="w-3 h-3 text-[#74C947]" />
              Faculty Commitment Central
            </span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white">Faculty Schedules</h2>
          <p className="text-xs text-white/60 mt-1 max-w-xl">
            Personal workload matrix, daily classroom commitments, and weekly load cap monitoring.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={teacherId}
            onChange={(e) => handleTeacherChange(e.target.value)}
            className="px-4 py-2.5 rounded-2xl bg-white/[0.06] border border-white/15 text-white text-xs focus:outline-none focus:border-[#74C947] backdrop-blur-2xl shadow-sm font-medium"
          >
            {teachers.map((t) => (
              <option key={t.id} value={t.id} className="bg-[#0e121e] text-white">
                {t.name} (Max {t.max_weekly_load || 20}h)
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs text-center font-medium">
          {error}
        </div>
      )}

      {/* Teaching Load Commitment Meter */}
      {data && (
        <GlassCard variant="pro" className="!p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs text-white/50 uppercase font-mono font-medium">Assigned Faculty</div>
              <div className="text-lg font-bold text-white">{data.teacher.name}</div>
            </div>

            <div className="w-full sm:w-72 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-white/60">Weekly Commitment</span>
                <span className={atCap ? 'text-rose-400 font-bold' : 'text-[#74C947] font-bold'}>
                  {data.assigned_periods} / {data.teacher.max_weekly_load || 20} hrs ({loadPct}%)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    atCap ? 'bg-rose-500' : loadPct > 75 ? 'bg-amber-400' : 'bg-[#74C947]'
                  }`}
                  style={{ width: `${loadPct}%` }}
                />
              </div>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Matrix Grid */}
      <GlassCard variant="pro" className="!p-6 space-y-4">
        <h3 className="font-bold text-sm text-white">Weekly Personal Timetable</h3>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs min-w-[750px]">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                <th className="py-3 px-4 font-mono text-white/50 uppercase w-24">Day</th>
                {PERIODS.map((p) => (
                  <th key={p} className="py-3 px-4 font-mono text-white/50 uppercase text-center">
                    Period {p}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DAYS.map((dayName, dayIndex) => {
                const dayNum = dayIndex + 1;

                return (
                  <tr key={dayName} className="border-b border-white/5 hover:bg-white/[0.02] transition">
                    <td className="py-4 px-4 font-semibold text-white whitespace-nowrap bg-white/[0.01]">
                      {dayName}
                    </td>

                    {PERIODS.map((periodNum) => {
                      const entry = entryMap[`${dayNum}-${periodNum}`];

                      return (
                        <td key={periodNum} className="p-2 min-w-[125px] align-top">
                          {entry ? (
                            <div className="p-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white space-y-1 shadow-sm">
                              <div className="font-mono text-[10px] text-[#74C947] font-bold">
                                {entry.subject_code}
                              </div>
                              <div className="font-semibold text-white text-xs truncate">
                                {entry.subject_name}
                              </div>
                              <div className="flex items-center justify-between text-[10px] text-white/60 pt-1 border-t border-white/10 font-mono">
                                <span>Sec {entry.section_name}</span>
                                <span>{entry.room_name}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="h-full min-h-[60px] rounded-xl border border-dashed border-white/10 flex items-center justify-center text-white/20 text-[10px] font-mono">
                              —
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
