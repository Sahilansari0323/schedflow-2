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
import api from '../../shared/api';
import GlassCard from '../../shared/components/GlassCard';
import AppleButton from '../../shared/components/AppleButton';

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
    const interval = setInterval(fetchDashboardStats, 12000);
    return () => clearInterval(interval);
  }, []);

  const statCards = [
    {
      label: 'FACULTY ROSTER',
      value: stats.teachers,
      icon: Users,
      to: '/admin/topology',
      desc: 'Active teaching instructors',
      color: 'text-[#74C947]',
    },
    {
      label: 'PHYSICAL VENUES',
      value: stats.rooms,
      icon: DoorOpen,
      to: '/admin/topology',
      desc: 'Lecture halls & laboratories',
      color: 'text-[#74C947]',
    },
    {
      label: 'CURRICULAR SUBJECTS',
      value: stats.subjects,
      icon: BookOpen,
      to: '/admin/topology',
      desc: 'Registered syllabus modules',
      color: 'text-[#74C947]',
    },
    {
      label: 'RADAR CONFLICTS',
      value: stats.conflicts,
      icon: AlertTriangle,
      to: '/admin/conflicts',
      desc: stats.conflicts > 0 ? 'Hard collisions detected' : 'Zero clashes detected',
      color: stats.conflicts > 0 ? 'text-rose-400' : 'text-[#74C947]',
      badge: stats.conflicts > 0 ? 'ACTION REQUIRED' : 'NOMINAL',
      isDanger: stats.conflicts > 0,
    },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Header telemetry banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-[rgba(16,20,32,0.65)] border border-white/10 backdrop-blur-3xl shadow-[0_14px_40px_rgba(0,0,0,0.5)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#74C947] animate-pulse shadow-[0_0_8px_#74C947]" />
            <span className="text-[10px] font-mono tracking-widest text-[#74C947] uppercase font-bold">
              Chrono Telemetry Online
            </span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white">Institutional Overview</h2>
          <p className="text-xs text-white/60 mt-1 max-w-xl">
            Live constraint verification status, active teaching commitments, and radar diagnostics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/admin/builder">
            <AppleButton variant="primary" size="md">
              <Calendar className="w-4 h-4" />
              <span>Launch Timetable Builder</span>
            </AppleButton>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Link key={card.label} to={card.to}>
            <GlassCard variant="pro" className="!p-5 space-y-3" hoverEffect>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono tracking-wider text-white/50 uppercase font-medium">
                  {card.label}
                </span>
                <card.icon className={`w-4 h-4 ${card.color}`} />
              </div>
              <div className="text-3xl font-extrabold text-white tracking-tight">
                {loading ? '…' : card.value}
              </div>
              <div className="flex items-center justify-between text-xs text-white/60 pt-2 border-t border-white/10">
                <span>{card.desc}</span>
                {card.badge && (
                  <span
                    className={`text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full ${
                      card.isDanger
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-[#74C947]/20 text-[#74C947] border border-[#74C947]/30'
                    }`}
                  >
                    {card.badge}
                  </span>
                )}
              </div>
            </GlassCard>
          </Link>
        ))}
      </div>

      {/* Cockpit Quick Launchpad & Radar Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard variant="pro" className="lg:col-span-2 !p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#74C947]" />
              <span>Matrix Operational Cockpit</span>
            </h3>
            <span className="text-[10px] font-mono text-white/40">Autonomous CSP Engine</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link to="/admin/builder" className="group">
              <div className="p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 hover:border-[#74C947]/40 transition-all space-y-2">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-[#74C947]/15 text-[#74C947]">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-white/30 group-hover:text-[#74C947] group-hover:translate-x-1 transition" />
                </div>
                <div className="font-semibold text-sm text-white">Timetable Builder</div>
                <p className="text-xs text-white/60">
                  Interactive multi-cohort 6-day x 8-period slot matrix assignment with instant publish.
                </p>
              </div>
            </Link>

            <Link to="/admin/conflicts" className="group">
              <div className="p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 hover:border-rose-500/40 transition-all space-y-2">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-rose-500/15 text-rose-400">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-white/30 group-hover:text-rose-400 group-hover:translate-x-1 transition" />
                </div>
                <div className="font-semibold text-sm text-white">Conflict Radar Scan</div>
                <p className="text-xs text-white/60">
                  Real-time deterministic sweep detecting teacher collisions, room overlaps, and capacity limits.
                </p>
              </div>
            </Link>

            <Link to="/admin/resolver" className="group">
              <div className="p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 hover:border-purple-400/40 transition-all space-y-2">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-purple-500/15 text-purple-300">
                    <Zap className="w-4 h-4" />
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-white/30 group-hover:text-purple-400 group-hover:translate-x-1 transition" />
                </div>
                <div className="font-semibold text-sm text-white">AI Heuristic Resolver</div>
                <p className="text-xs text-white/60">
                  Ranked, constraint-satisfaction repair paths with automated 1-click slot and room swaps.
                </p>
              </div>
            </Link>

            <Link to="/admin/substitutions" className="group">
              <div className="p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 hover:border-[#74C947]/40 transition-all space-y-2">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-[#74C947]/15 text-[#74C947]">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-white/30 group-hover:text-[#74C947] group-hover:translate-x-1 transition" />
                </div>
                <div className="font-semibold text-sm text-white">Dynamic Substitutions</div>
                <p className="text-xs text-white/60">
                  Automated peer workload balancing for planned or emergency faculty leaves.
                </p>
              </div>
            </Link>
          </div>
        </GlassCard>

        {/* Engine System Status */}
        <GlassCard variant="pro" className="!p-6 space-y-4">
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#74C947]" />
            <span>Invariant Engine Status</span>
          </h3>

          <div className="space-y-3">
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
              <span className="text-xs text-white/70">Continuous Radar</span>
              <span className="text-xs font-mono text-[#74C947] font-semibold">Active (0.2s)</span>
            </div>
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
              <span className="text-xs text-white/70">Weekly Load Enforcer</span>
              <span className="text-xs font-mono text-[#74C947] font-semibold">Enforced</span>
            </div>
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
              <span className="text-xs text-white/70">Lab Venues Matching</span>
              <span className="text-xs font-mono text-[#74C947] font-semibold">Hardware Bound</span>
            </div>
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
              <span className="text-xs text-white/70">Audit Ledger Trail</span>
              <span className="text-xs font-mono text-purple-300 font-semibold">Cryptographic</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#74C947]/10 border border-[#74C947]/20 space-y-2">
            <div className="text-xs font-semibold text-[#74C947]">Public Live Stream</div>
            <p className="text-[11px] text-white/70">
              Approved and published timetable versions are streamed directly to students and faculty.
            </p>
            <Link to="/timetable" target="_blank" className="inline-flex items-center gap-1.5 text-xs text-[#74C947] font-semibold hover:underline">
              <span>Open Public Timetable Portal</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
