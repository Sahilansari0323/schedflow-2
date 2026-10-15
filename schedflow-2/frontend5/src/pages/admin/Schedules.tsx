import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
import api, { getErrorMessage } from '../../api';
import GlassCard from '../../components/GlassCard';

interface TeacherItem {
  id: number;
  name: string;
  email: string;
  employee_code?: string;
  max_weekly_load: number;
}

interface ScheduleEntry {
  id: number;
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Clock className="w-3 h-3 text-cyan-300" />
              Faculty Central
            </span>
            <span className="text-xs text-white/40 tracking-wider uppercase font-mono">
              Individual Roster
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
            Teacher Schedules
          </h1>
          <p className="text-sm text-white/60 mt-1 max-w-2xl">
            A comprehensive weekly view of an individual faculty member's teaching commitments across
            all departments, student cohorts, and campus facilities.
          </p>
        </div>

        {/* Teacher Selector */}
        <div className="w-full sm:w-72 shrink-0">
          <select
            value={teacherId}
            onChange={(e) => handleTeacherChange(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500 [&>option]:bg-slate-900"
          >
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.employee_code || `ID-${t.id}`})
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm">
          {error}
        </div>
      )}

      {/* Teacher Workload Telemetry Card */}
      {data && (
        <GlassCard className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30 flex items-center justify-center font-bold text-base text-cyan-300 uppercase">
                {data.teacher.name.slice(0, 2)}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">{data.teacher.name}</h3>
                <p className="text-xs text-white/50">{data.teacher.email}</p>
              </div>
            </div>

            <div className="w-full sm:w-64 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/60">Weekly Teaching Commitment</span>
                <span className={`font-mono font-semibold ${atCap ? 'text-rose-400' : 'text-cyan-300'}`}>
                  {data.assigned_periods} / {data.teacher.max_weekly_load || 20} hrs ({loadPct}%)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    atCap ? 'bg-rose-500' : loadPct > 75 ? 'bg-amber-400' : 'bg-cyan-400'
                  }`}
                  style={{ width: `${loadPct}%` }}
                />
              </div>
              {atCap && (
                <div className="text-[10px] text-rose-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Maximum weekly load ceiling reached</span>
                </div>
              )}
            </div>
          </div>
        </GlassCard>
      )}

      {/* Weekly Schedule Grid */}
      <GlassCard className="p-6 overflow-hidden">
        <h3 className="text-base font-semibold text-white mb-4 flex items-center justify-between">
          <span>Weekly Time Allocations</span>
          <span className="font-mono text-xs text-white/40 font-normal">
            6 Days • 8 Period Slots
          </span>
        </h3>

        {loading ? (
          <div className="py-20 text-center text-xs text-white/40 flex items-center justify-center gap-2">
            <Clock className="w-4 h-4 animate-spin text-blue-400" />
            Loading faculty timetable matrix…
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs min-w-[700px]">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02]">
                  <th className="p-3 font-mono uppercase text-white/40 font-semibold w-24">Day</th>
                  {PERIODS.map((p) => (
                    <th key={p} className="p-3 font-mono text-white/60 font-medium text-center">
                      P{p}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {DAYS.map((dayName, dayIndex) => {
                  const dayNum = dayIndex + 1;

                  return (
                    <tr key={dayName} className="hover:bg-white/[0.01]">
                      <td className="p-3 font-semibold text-white/90 bg-white/[0.01]">{dayName}</td>
                      {PERIODS.map((periodNum) => {
                        const entry = entryMap[`${dayNum}-${periodNum}`];

                        return (
                          <td key={periodNum} className="p-2 border border-white/5 h-20 align-top">
                            {entry ? (
                              <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-white h-full flex flex-col justify-between shadow-sm">
                                <div>
                                  <div className="font-semibold text-cyan-300 text-[11px] leading-tight">
                                    {entry.subject_code}
                                  </div>
                                  <div className="text-[10px] text-white/70 line-clamp-1 mt-0.5">
                                    {entry.subject_name}
                                  </div>
                                </div>
                                <div className="flex items-center justify-between text-[9px] text-white/50 pt-1 border-t border-white/5 font-mono">
                                  <span>Sec {entry.section_name}</span>
                                  <span>{entry.room_name}</span>
                                </div>
                              </div>
                            ) : (
                              <div className="h-full flex items-center justify-center text-white/15 text-[10px] font-mono">
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
        )}
      </GlassCard>
    </div>
  );
}
