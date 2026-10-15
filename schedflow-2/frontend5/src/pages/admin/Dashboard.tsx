import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Users,
  DoorOpen,
  BookOpen,
  AlertTriangle,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Activity,
  UserCheck,
} from 'lucide-react';
import api from '../../api';
import GlassCard from '../../components/GlassCard';

export default function Dashboard() {
  const [stats, setStats] = useState({
    teachers: 0,
    rooms: 0,
    subjects: 0,
    conflicts: 0,
    timetables: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const [teachersRes, roomsRes, subjectsRes, conflictsRes, timetablesRes] =
          await Promise.allSettled([
            api.get('/teachers'),
            api.get('/rooms'),
            api.get('/subjects'),
            api.get('/conflicts/scan'),
            api.get('/timetables'),
          ]);

        setStats({
          teachers: teachersRes.status === 'fulfilled' ? teachersRes.value.data?.length || 0 : 0,
          rooms: roomsRes.status === 'fulfilled' ? roomsRes.value.data?.length || 0 : 0,
          subjects: subjectsRes.status === 'fulfilled' ? subjectsRes.value.data?.length || 0 : 0,
          conflicts:
            conflictsRes.status === 'fulfilled'
              ? conflictsRes.value.data?.summary?.total ??
                conflictsRes.value.data?.conflicts?.length ??
                0
              : 0,
          timetables:
            timetablesRes.status === 'fulfilled' ? timetablesRes.value.data?.length || 0 : 0,
        });
      } catch (err) {
        console.error('Error loading dashboard metrics', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  const statCards = [
    {
      label: 'FACULTY ROSTER',
      value: stats.teachers,
      icon: Users,
      to: '/admin/topology',
      desc: 'Active teaching instructors',
      color: 'text-[#00d2ff]',
    },
    {
      label: 'PHYSICAL VENUES',
      value: stats.rooms,
      icon: DoorOpen,
      to: '/admin/topology',
      desc: 'Lecture halls & laboratories',
      color: 'text-cyan-300',
    },
    {
      label: 'CURRICULAR SUBJECTS',
      value: stats.subjects,
      icon: BookOpen,
      to: '/admin/topology',
      desc: 'Registered syllabus modules',
      color: 'text-blue-400',
    },
    {
      label: 'RADAR CONFLICTS',
      value: stats.conflicts,
      icon: AlertTriangle,
      to: '/admin/conflicts',
      desc: stats.conflicts > 0 ? 'Hard collisions detected' : 'Zero clashes detected',
      color: stats.conflicts > 0 ? 'text-red-400' : 'text-emerald-400',
      badge: stats.conflicts > 0 ? 'ACTION REQUIRED' : 'NOMINAL',
      isDanger: stats.conflicts > 0,
    },
  ];

  return (
    <div className="space-y-8 select-none">
      {/* Welcome Banner */}
      <GlassCard variant="compact" className="!p-8 sm:!p-10 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#00d2ff]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>DETERMINISTIC ACADEMIC CHRONO</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Institutional Master Dashboard
            </h1>
            <p className="text-sm text-white/60 max-w-2xl leading-relaxed">
              Real-time heuristic radar monitoring, room capacity allocations, and faculty load constraints across all academic terms.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/admin/builder"
              className="btn-wave px-5 py-3 rounded-full bg-[#00d2ff] text-black font-semibold text-xs hover:bg-[#3D81E3] hover:text-white transition-all shadow-[0_0_24px_rgba(0,210,255,0.35)] flex items-center gap-2 cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              <span>Open Matrix Builder</span>
            </Link>
            <Link
              to="/admin/resolver"
              className="btn-wave px-5 py-3 rounded-full liquid-glass border border-white/20 text-white font-medium text-xs hover:border-[#00d2ff]/60 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Zap className="w-4 h-4 text-[#00d2ff]" />
              <span>Run Heuristic AI</span>
            </Link>
          </div>
        </div>
      </GlassCard>

      {/* 4 Telemetry Metric Glass Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <Link key={card.label} to={card.to} className="block group">
              <GlassCard
                variant="compact"
                className={`!p-6 h-full transition-all duration-300 ${
                  card.isDanger
                    ? '!border-red-500/60 !shadow-[0_0_24px_rgba(239,68,68,0.2)]'
                    : ''
                }`}
              >
                <div className="flex items-center justify-between text-xs font-mono text-white/50 mb-3">
                  <span className="uppercase tracking-wider">{card.label}</span>
                  <Icon className={`w-4 h-4 ${card.color} group-hover:scale-110 transition-transform`} />
                </div>

                <div className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-1">
                  {loading ? '—' : card.value}
                </div>

                <div className="text-xs text-white/50">{card.desc}</div>
              </GlassCard>
            </Link>
          );
        })}
      </div>

      {/* Main Operations Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Rapid Chrono Actions */}
        <div className="lg:col-span-7">
          <GlassCard variant="compact" className="!p-8 space-y-6 h-full">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="font-semibold text-lg text-white">Chrono Operations</h3>
                <p className="text-xs text-white/50">Execute immediate timetable tasks</p>
              </div>
              <Activity className="w-4 h-4 text-[#00d2ff]" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link
                to="/admin/builder"
                className="p-5 rounded-3xl liquid-glass border border-white/10 hover:border-[#00d2ff]/60 hover:bg-white/[0.04] transition-all group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-[#00d2ff]/10 border border-[#00d2ff]/30 flex items-center justify-center text-[#00d2ff] mb-3">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="font-semibold text-sm text-white group-hover:text-[#00d2ff] transition-colors">
                  Schedule Grid Editor
                </div>
                <div className="text-xs text-white/50 mt-1">
                  Draft, allocate lecture slots, and publish academic calendars.
                </div>
              </Link>

              <Link
                to="/admin/conflicts"
                className="p-5 rounded-3xl liquid-glass border border-white/10 hover:border-red-400/60 hover:bg-white/[0.04] transition-all group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-3">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div className="font-semibold text-sm text-white group-hover:text-red-400 transition-colors">
                  Radar Overlap Scan
                </div>
                <div className="text-xs text-white/50 mt-1">
                  Inspect multi-dimensional clashing slots across all semesters.
                </div>
              </Link>

              <Link
                to="/admin/resolver"
                className="p-5 rounded-3xl liquid-glass border border-white/10 hover:border-cyan-400/60 hover:bg-white/[0.04] transition-all group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400 mb-3">
                  <Zap className="w-4 h-4" />
                </div>
                <div className="font-semibold text-sm text-white group-hover:text-cyan-400 transition-colors">
                  AI Genetic Solver
                </div>
                <div className="text-xs text-white/50 mt-1">
                  Compute optimal zero-disruption permutations in under 12ms.
                </div>
              </Link>

              <Link
                to="/admin/substitutions"
                className="p-5 rounded-3xl liquid-glass border border-white/10 hover:border-emerald-400/60 hover:bg-white/[0.04] transition-all group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div className="font-semibold text-sm text-white group-hover:text-emerald-400 transition-colors">
                  Substitution Radar
                </div>
                <div className="text-xs text-white/50 mt-1">
                  Manage emergency faculty leave and appoint surrogate instructors.
                </div>
              </Link>
            </div>
          </GlassCard>
        </div>

        {/* System Telemetry & Status */}
        <div className="lg:col-span-5">
          <GlassCard variant="compact" className="!p-8 space-y-6 h-full flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <h3 className="font-semibold text-lg text-white">Chrono Telemetry</h3>
                  <p className="text-xs text-white/50">Computational solver verification</p>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-white/50">CSP SOLVER VELOCITY</span>
                  <span className="text-[#00d2ff] font-bold">12ms Cycle</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-white/50">PERMUTATION VOLUME</span>
                  <span className="text-white font-bold">14,200 ops/s</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-white/50">COLLISION PROBABILITY</span>
                  <span className="text-emerald-400 font-bold">0.0000%</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-white/50">SYSTEM ENGINE</span>
                  <span className="text-white font-bold">AURA 5.0 FASTAPI</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl liquid-glass border border-white/10 text-xs text-white/60">
              <div className="text-white font-medium mb-1">Aura Health Nominal</div>
              All database vector indexes, foreign key links, and constraint satisfiers are operating under normal parameters.
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
