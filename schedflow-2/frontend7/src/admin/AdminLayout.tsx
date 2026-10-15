import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  Calendar,
  Layers,
  AlertTriangle,
  Zap,
  UserCheck,
  Clock,
  History,
  Users,
  Settings,
  LogOut,
  ExternalLink,
  Shield,
  BarChart3,
  CalendarDays,
  Megaphone,
  MessageSquareWarning,
  UploadCloud,
  Bell,
  Check,
  Sparkles,
} from 'lucide-react';
import api from '../shared/api';
import { useAuth } from '../shared/auth';
import AppleButton, { ReplyButton, SchedFlowMark } from '../shared/components/AppleButton';
import AIAssistantWidget from '../shared/components/AIAssistantWidget';
import ThreeBackground from '../components/ThreeBackground';

const NAV_ITEMS = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { to: '/admin/builder', icon: Calendar, label: 'Timetable Builder' },
  { to: '/admin/master-view', icon: CalendarDays, label: 'Master & Venue Views' },
  { to: '/admin/timetables', icon: Layers, label: 'Timetables' },
  { to: '/admin/topology', icon: Layers, label: 'Topology & AI Rooms' },
  { to: '/admin/conflicts', icon: AlertTriangle, label: 'Conflict Radar' },
  { to: '/admin/resolver', icon: Zap, label: 'AI Heuristic' },
  { to: '/admin/analytics', icon: BarChart3, label: 'Campus Analytics' },
  { to: '/admin/announcements', icon: Megaphone, label: 'Announcements' },
  { to: '/admin/feedback', icon: MessageSquareWarning, label: 'Student Feedback' },
  { to: '/admin/substitutions', icon: UserCheck, label: 'Substitutions' },
  { to: '/admin/schedules', icon: Clock, label: 'Faculty Schedules' },
  { to: '/admin/import', icon: UploadCloud, label: 'Bulk Data Import' },
  { to: '/admin/history', icon: History, label: 'Audit Trail' },
  { to: '/admin/users', icon: Users, label: 'User Directory' },
  { to: '/admin/settings', icon: Settings, label: 'Settings' },
];

const ROUTE_DESCRIPTIONS: Record<string, { heading: string; subheading: string }> = {
  '/admin/dashboard': {
    heading: 'Administrative Matrix Overview',
    subheading: 'Real-time telemetry on scheduling health, active constraints, and campus-wide timetable status.',
  },
  '/admin/builder': {
    heading: 'Deterministic Timetable Builder',
    subheading: 'Interactive multi-cohort scheduling grid with live collision safeguards, AI auto-draft generator, and publishing workflow.',
  },
  '/admin/master-view': {
    heading: 'Synchronized Cross-Section & Venue Views',
    subheading: 'Inspect all sections side-by-side on any day, or explore complete weekly schedules for individual physical venues.',
  },
  '/admin/timetables': {
    heading: 'Timetable Lifecycle & Publishing Desk',
    subheading: 'Manage draft and published schedules across all departments, semesters, and sections.',
  },
  '/admin/topology': {
    heading: 'Academic Topology & Campus Resources',
    subheading: 'Configure academic departments, faculties, physical venues, curricular subjects, and interactive AI Room Finder.',
  },
  '/admin/conflicts': {
    heading: 'Live Collision Radar & Validation',
    subheading: 'Continuous constraint verification detecting double-booked faculty, occupied venues, and cohort overlaps.',
  },
  '/admin/resolver': {
    heading: 'Autonomous AI Conflict Resolver',
    subheading: 'Heuristic solver evaluating multi-dimensional permutations to resolve scheduling bottlenecks.',
  },
  '/admin/analytics': {
    heading: 'Campus Scheduling Analytics',
    subheading: 'Deep-dive venue utilization rates, instructor workload distribution, and timetable gap analysis.',
  },
  '/admin/announcements': {
    heading: 'Campus Broadcasts & Announcements',
    subheading: 'Publish, manage, and pin real-time administrative notices to students and faculty.',
  },
  '/admin/feedback': {
    heading: 'Student Discrepancy Feedback Dispatch',
    subheading: 'Live triage desk for anonymous reports submitted by students regarding classroom changes or absent faculty.',
  },
  '/admin/substitutions': {
    heading: 'Faculty Substitution Dispatch',
    subheading: 'Manage temporary instructor replacements, leave reassignments, and emergency faculty coverages.',
  },
  '/admin/schedules': {
    heading: 'Faculty Schedule Directory',
    subheading: 'Explore weekly workloads, assigned periods, and individual availability for all instructors.',
  },
  '/admin/import': {
    heading: 'Institutional Bulk Ingestion Engine',
    subheading: 'Batch onboarding of teacher rosters and curriculum course catalogs via CSV ingestion.',
  },
  '/admin/history': {
    heading: 'Cryptographic Audit Ledger',
    subheading: 'Immutable record of all slot changes, timetable releases, user sessions, and administrative actions.',
  },
  '/admin/users': {
    heading: 'Access Control & User Directory',
    subheading: 'Manage institutional administrative credentials, coordinator roles, and linked faculty accounts.',
  },
  '/admin/settings': {
    heading: 'Matrix Engine System Preferences',
    subheading: 'Configure institutional parameters, display preferences, and account credentials.',
  },
};

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Notification Bell State
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unread || 0);
    } catch {
      // ignore offline
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 25000);
    return () => clearInterval(interval);
  }, []);

  // Close bell dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
        setBellOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      // ignore
    }
  };

  const markSingleRead = async (nid: number) => {
    try {
      await api.put(`/notifications/${nid}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === nid ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // ignore
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const currentInfo = ROUTE_DESCRIPTIONS[location.pathname] || {
    heading: 'Administrative Cockpit',
    subheading: 'Deterministic timetable matrix intelligence and resource management platform.',
  };

  return (
    <div className="relative min-h-screen text-white bg-[#000000] flex flex-col justify-between selection:bg-[#74C947] selection:text-[#081a05] overflow-x-hidden font-sans">
      {/* 3D Living Blocks Background with dark veil & blur for ultra-sharp UI contrast */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        <ThreeBackground />
        <div className="absolute inset-0 bg-black/75 backdrop-blur-[2px]" />
      </div>

      {/* Main Administrative Container */}
      <div className="max-w-[1700px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col lg:flex-row gap-8 relative z-10">
        {/* Navigation Sidebar */}
        <aside className="w-full lg:w-68 shrink-0 space-y-5">
          {/* Brand Card + Notification Bell */}
          <div className="p-4 rounded-3xl bg-[rgba(16,20,32,0.65)] border border-white/10 backdrop-blur-3xl shadow-[0_14px_40px_rgba(0,0,0,0.5)] flex items-center justify-between relative z-50">
            <Link to="/admin/dashboard" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-2xl bg-[#74C947]/15 border border-[#74C947]/30 flex items-center justify-center text-[#74C947] shadow-[0_0_16px_rgba(116,201,71,0.2)] group-hover:scale-105 transition-transform">
                <SchedFlowMark className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-sm tracking-tight text-white block group-hover:text-[#74C947] transition-colors">
                  SchedFlow Matrix
                </span>
                <span className="text-[10px] font-mono text-[#74C947] uppercase tracking-widest block font-bold">
                  Chrono Engine
                </span>
              </div>
            </Link>

            {/* Notification Bell Dropdown */}
            <div className="relative z-50" ref={bellRef}>
              <button
                type="button"
                onClick={() => setBellOpen(!bellOpen)}
                className="relative p-2.5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] text-white/80 hover:text-white transition-colors cursor-pointer border border-white/10"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#74C947] text-[#081a05] text-[9px] font-black flex items-center justify-center animate-pulse z-20 shadow-[0_0_8px_rgba(116,201,71,0.6)]">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {bellOpen && (
                <div className="absolute right-0 mt-3 w-80 sm:w-92 rounded-3xl bg-[#0e121e]/95 border border-white/15 shadow-[0_25px_60px_rgba(0,0,0,0.85)] z-[100] p-4 space-y-3 backdrop-blur-3xl">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-[#74C947]" />
                      <span className="font-bold text-xs text-white">Campus Alerts</span>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllRead}
                        className="text-[10px] text-[#74C947] hover:underline cursor-pointer font-medium"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-68 overflow-y-auto space-y-2 no-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-xs text-white/40">
                        No alerts at this time.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => !n.read && markSingleRead(n.id)}
                          className={`p-3 rounded-2xl border text-xs space-y-1.5 transition-all cursor-pointer ${
                            n.read
                              ? 'bg-white/[0.02] border-transparent text-white/50'
                              : 'bg-[#74C947]/10 border-[#74C947]/30 text-white shadow-[0_0_12px_rgba(116,201,71,0.1)]'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-[11px] truncate text-white">{n.title}</span>
                            {!n.read && (
                              <span className="w-1.5 h-1.5 rounded-full bg-[#74C947] shrink-0 shadow-[0_0_6px_#74C947]" />
                            )}
                          </div>
                          <div className="text-[10px] text-white/70 leading-relaxed">
                            {n.body}
                          </div>
                          <div className="text-[9px] text-white/30 font-mono">
                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3.5 rounded-3xl bg-[rgba(16,20,32,0.65)] border border-white/10 backdrop-blur-3xl shadow-[0_14px_40px_rgba(0,0,0,0.5)] space-y-1.5 max-h-[calc(100vh-230px)] overflow-y-auto no-scrollbar relative z-10">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                role="button"
                className={({ isActive }) =>
                  `group flex items-center gap-3.5 px-4 py-2.5 rounded-2xl text-[13px] font-semibold transition-all select-none border ${
                    isActive
                      ? 'bg-[#74C947] text-[#081a05] font-extrabold border-[#74C947] shadow-[0_4px_20px_rgba(116,201,71,0.35)]'
                      : 'bg-transparent text-white/70 border-transparent hover:bg-white/[0.06] hover:text-white hover:border-white/10'
                  }`
                }
              >
                <item.icon className="w-4.5 h-4.5 shrink-0 transition-transform duration-300 group-hover:scale-110" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            ))}

            <div className="pt-2 border-t border-white/10">
              <Link
                to="/timetable"
                target="_blank"
                role="button"
                className="group flex items-center justify-between px-4 py-2.5 rounded-2xl text-[13px] font-semibold text-white/70 border border-transparent hover:bg-white/[0.06] hover:text-white hover:border-white/10 transition-colors select-none"
              >
                <span className="flex items-center gap-2.5">
                  <ExternalLink className="w-4 h-4 text-[#74C947]" />
                  Public Broadcast
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#74C947]/20 text-[#74C947] font-bold border border-[#74C947]/30">
                  LIVE
                </span>
              </Link>
            </div>
          </nav>

          {/* User Session Info Card */}
          <div className="p-4 rounded-3xl bg-[rgba(16,20,32,0.65)] border border-white/10 backdrop-blur-3xl shadow-[0_14px_40px_rgba(0,0,0,0.5)] space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#74C947]/15 border border-[#74C947]/30 flex items-center justify-center text-[#74C947] text-xs font-bold">
                {user?.name?.[0] || 'A'}
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-semibold text-white block truncate">
                  {user?.name || 'Administrator'}
                </span>
                <span className="text-[10px] text-white/50 block truncate font-mono">
                  {user?.email || 'admin@schedflow.edu'}
                </span>
              </div>
            </div>

            <ReplyButton
              type="button"
              size="md"
              onClick={handleLogout}
              className="w-full !justify-center !text-xs !py-2 bg-white/[0.05] hover:bg-rose-500/20 hover:text-rose-400 hover:border-rose-500/30"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </ReplyButton>
          </div>
        </aside>

        {/* Dynamic Nested Route View */}
        <main className="flex-1 min-w-0 space-y-6">
          {/* Admin Cockpit Global Heading & Subheading Section */}
          <div className="p-6 sm:p-7 rounded-3xl bg-[rgba(16,20,32,0.65)] border border-white/10 backdrop-blur-3xl shadow-[0_14px_40px_rgba(0,0,0,0.5)] flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
            <div className="space-y-1.5 z-10">
              <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-[#74C947] font-bold">
                <Sparkles className="w-3.5 h-3.5 text-[#74C947]" />
                <span>ADMINISTRATIVE COCKPIT</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                {currentInfo.heading}
              </h1>
              <p className="text-xs text-white/60 max-w-2xl leading-relaxed">
                {currentInfo.subheading}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0 z-10">
              <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#74C947]/10 border border-[#74C947]/30 text-[#74C947] text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#74C947] animate-pulse shadow-[0_0_8px_#74C947]" />
                <span>Matrix Heuristic Active</span>
              </span>
              <span className="px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-white/60 text-xs font-mono">
                v2.6 Chrono
              </span>
            </div>
          </div>

          {/* Animated Section Route Transition */}
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* SchedFlow Fixed Chrono AI Assistant Widget */}
      <AIAssistantWidget />
    </div>
  );
}
