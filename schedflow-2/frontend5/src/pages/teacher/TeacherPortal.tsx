import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  Calendar,
  Clock,
  BookOpen,
  MapPin,
  Users,
  LogOut,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import api, { getErrorMessage } from '../../api';
import { useAuth } from '../../auth';
import GlassCard from '../../components/GlassCard';
import { SchedFlowMark } from '../../components/AppleButton';

const DAYS = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function TeacherPortal() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [teacherProfile, setTeacherProfile] = useState<any | null>(null);
  const [schedule, setSchedule] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPortalData();
  }, []);

  const loadPortalData = async () => {
    setLoading(true);
    try {
      const [meRes, schedRes] = await Promise.all([
        api.get('/teacher/me'),
        api.get('/teacher/me/schedule'),
      ]);
      setTeacherProfile(meRes.data);
      setSchedule(schedRes.data);
    } catch (err: any) {
      setError(getErrorMessage(err, 'Failed to fetch personal faculty schedule.'));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="page-admin relative min-h-screen text-white font-sans overflow-x-hidden select-none">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-black/60 backdrop-blur-2xl px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white group-hover:scale-105 transition-transform">
              <SchedFlowMark className="w-5 h-5 text-[#00d2ff]" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm tracking-tight text-white">SchedFlow Aura</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#00d2ff]/20 text-[#00d2ff] font-medium border border-[#00d2ff]/30">
                FACULTY PORTAL
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full liquid-glass border border-white/10 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white/90 font-medium">
              {teacherProfile?.teacher?.name || user?.name || 'Faculty Member'}
            </span>
            <span className="text-white/40 text-[10px] font-mono">
              ({teacherProfile?.teacher?.designation || 'Instructor'})
            </span>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="p-2 rounded-full border border-white/10 bg-white/5 hover:bg-red-500/20 hover:border-red-500/40 text-white/70 hover:text-red-400 transition-colors cursor-pointer"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Welcome Banner */}
        <GlassCard variant="compact" className="!p-8 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#00d2ff]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>PERSONAL LECTURE DISPATCH</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-white">
                {teacherProfile?.teacher?.name ? `Welcome, ${teacherProfile.teacher.name}` : 'Faculty Timetable'}
              </h1>
              <p className="text-xs text-white/60">
                Synchronized live weekly lecture obligations, assigned classrooms, and designated laboratory sessions.
              </p>
            </div>

            {/* Quick Workload Meter */}
            {schedule && (
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1.5 min-w-[200px] shrink-0">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/60">Teaching Load</span>
                  <span className="font-mono text-[#00d2ff] font-bold">
                    {schedule.assigned_periods} / {schedule.max_weekly_load}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#00d2ff] to-[#3D81E3]"
                    style={{
                      width: `${Math.min(
                        Math.round((schedule.assigned_periods / (schedule.max_weekly_load || 20)) * 100),
                        100
                      )}%`,
                    }}
                  />
                </div>
                <div className="text-[10px] text-white/40 text-right font-mono">
                  {Math.round((schedule.assigned_periods / (schedule.max_weekly_load || 20)) * 100)}% of weekly capacity
                </div>
              </div>
            )}
          </div>
        </GlassCard>

        {error && (
          <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs">
            {error}
          </div>
        )}

        {/* Schedule Grid */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-[#00d2ff] border-t-transparent animate-spin" />
            <div className="text-xs text-white/50 font-mono">Streaming personal lecture allocations...</div>
          </div>
        ) : (
          <GlassCard variant="compact" className="!p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.04]">
                    <th className="py-3.5 px-4 font-mono text-white/70 uppercase text-xs sticky left-0 bg-neutral-950 z-20 min-w-[120px]">
                      Day
                    </th>
                    {PERIODS.map((p) => (
                      <th key={p} className="py-3 px-3 font-mono text-white/50 uppercase text-center min-w-[140px]">
                        Period {p}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DAYS.map((day) => {
                    const dayEntries = schedule?.entries?.filter((e: any) => e.day_of_week === day.value) || [];
                    return (
                      <tr key={day.value} className="border-b border-white/[0.06] hover:bg-white/[0.02]">
                        <td className="py-4 px-4 font-semibold text-white whitespace-nowrap sticky left-0 bg-neutral-950/90 backdrop-blur-md z-10 border-r border-white/10">
                          {day.label}
                        </td>
                        {PERIODS.map((period) => {
                          const entry = dayEntries.find((e: any) => e.period === period);
                          return (
                            <td key={period} className="p-2 align-top">
                              {entry ? (
                                <div className="p-3 rounded-2xl liquid-glass border border-white/15 bg-black/40 space-y-1 hover:border-[#00d2ff]/60 transition-all">
                                  <div className="font-mono text-[10px] text-[#00d2ff] font-bold">
                                    {entry.subject_code}
                                  </div>
                                  <div className="text-white text-xs font-medium truncate">
                                    {entry.subject_name}
                                  </div>
                                  <div className="text-[10px] text-white/60">
                                    Sec {entry.section_name} (Sem {entry.semester_number})
                                  </div>
                                  <div className="text-[10px] text-cyan-300 flex items-center gap-1">
                                    <MapPin className="w-2.5 h-2.5 text-cyan-400" />
                                    <span>{entry.room_name}</span>
                                    {entry.is_lab && (
                                      <span className="text-[9px] px-1 rounded bg-purple-500/20 text-purple-300 ml-1">
                                        LAB
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className="h-full min-h-[70px] rounded-2xl border border-dashed border-white/5 flex items-center justify-center text-white/20 text-[10px]">
                                  Free
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
        )}
      </div>
    </div>
  );
}
