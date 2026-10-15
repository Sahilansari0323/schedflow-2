import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  Calendar,
  AlertTriangle,
  Zap,
  UserCheck,
  Users,
  History,
  Settings,
  LogOut,
  Clock,
  Sparkles,
  ExternalLink,
  Menu,
  X,
  BookOpen,
  CalendarDays,
  Grid,
  MapPin,
  UserPlus,
  BarChart3,
  Megaphone,
  MessageSquareWarning,
  DoorOpen,
  Upload,
  Bell,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../auth';
import { SchedFlowMark } from './AppleButton';
import api from '../api';
import AIAssistantWidget from './AIAssistantWidget';

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  label: string;
  path: string;
  icon: any;
  end?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
      { label: 'Campus Analytics', path: '/admin/analytics', icon: BarChart3 },
    ],
  },
  {
    label: 'Manage',
    items: [
      { label: 'Teachers', path: '/admin/teachers', icon: Users },
      { label: 'Subjects', path: '/admin/subjects', icon: BookOpen },
      { label: 'Semesters', path: '/admin/semesters', icon: CalendarDays },
      { label: 'Sections', path: '/admin/sections', icon: Grid },
      { label: 'Rooms & Labs', path: '/admin/rooms', icon: MapPin },
      { label: 'Bulk Import', path: '/admin/import', icon: Upload },
    ],
  },
  {
    label: 'Scheduling',
    items: [
      { label: 'Timetables', path: '/admin/timetables', icon: Calendar },
      { label: 'Matrix Builder', path: '/admin/builder', icon: Clock },
      { label: 'Master & Venue Grids', path: '/admin/master-view', icon: DoorOpen },
      { label: 'Substitution', path: '/admin/substitutions', icon: UserCheck },
    ],
  },
  {
    label: 'Diagnostics',
    items: [
      { label: 'Conflict Radar', path: '/admin/conflicts', icon: AlertTriangle },
      { label: 'AI Resolver', path: '/admin/resolver', icon: Zap },
    ],
  },
  {
    label: 'Campus & Student',
    items: [
      { label: 'Announcements', path: '/admin/announcements', icon: Megaphone },
      { label: 'Student Feedback', path: '/admin/feedback', icon: MessageSquareWarning },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'User Directory', path: '/admin/users', icon: UserPlus },
      { label: 'Version History', path: '/admin/history', icon: History },
      { label: 'Settings', path: '/admin/settings', icon: Settings },
    ],
  },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState('');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Notification center state
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data?.items || []);
      setUnreadCount(res.data?.unread || 0);
    } catch {
      // Ignored if user not logged in
    }
  };

  useEffect(() => {
    fetchNotifications();
    const poll = setInterval(fetchNotifications, 20000);
    return () => clearInterval(poll);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteNotif = async (nid: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${nid}`);
      setNotifications((prev) => prev.filter((n) => n.id !== nid));
    } catch (err) {
      console.error(err);
    }
  };

  // Close notification popover on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isItemActive = (path: string) => {
    if (path === '/admin/dashboard' && (location.pathname === '/admin' || location.pathname === '/admin/dashboard')) {
      return true;
    }
    if (path === '/admin/timetables' && location.pathname === '/admin/timetables') {
      return true;
    }
    return location.pathname === path;
  };

  return (
    <div className="page-admin relative min-h-screen text-white font-sans overflow-x-hidden">
      {/* -------------------------------------------------------------------- */}
      {/* Top Application Header Bar                                           */}
      {/* -------------------------------------------------------------------- */}
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-black/60 backdrop-blur-2xl px-4 sm:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white group-hover:scale-105 transition-transform">
              <SchedFlowMark className="w-5 h-5 text-[#00d2ff]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm tracking-tight text-white">SchedFlow Aura</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#00d2ff]/20 text-[#00d2ff] font-medium border border-[#00d2ff]/30">
                  ADMIN v5.0
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* Center: Quick navigation links */}
        <div className="hidden md:flex items-center gap-6 text-xs text-white/50">
          <Link to="/" className="hover:text-white transition-colors">
            Landing View
          </Link>
          <Link to="/timetable" className="hover:text-[#00d2ff] flex items-center gap-1 transition-colors">
            <span>Public Timetable</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
          <span className="text-white/20">|</span>
          <div className="flex items-center gap-1.5 text-white/70">
            <Clock className="w-3.5 h-3.5 text-[#00d2ff]" />
            <span className="font-mono text-xs">{currentTime}</span>
          </div>
        </div>

        {/* Right: Notifications, Profile, & Actions */}
        <div className="flex items-center gap-3">
          {/* Notification Center Popover */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => {
                setNotifOpen(!notifOpen);
                fetchNotifications();
              }}
              title="Notifications"
              className="relative p-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#00d2ff] text-black font-bold text-[9px] flex items-center justify-center shadow-[0_0_10px_rgba(0,210,255,0.6)]">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-3 w-80 sm:w-96 rounded-3xl liquid-glass border border-white/20 bg-black/90 backdrop-blur-3xl shadow-2xl p-4 z-50 space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-[#00d2ff]" />
                      <span className="font-semibold text-xs text-white">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#00d2ff]/20 text-[#00d2ff] font-mono">
                          {unreadCount} unread
                        </span>
                      )}
                    </div>

                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllRead}
                        className="text-[10px] text-[#00d2ff] hover:underline cursor-pointer"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto space-y-2 text-xs">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-white/40 text-xs">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-3 rounded-2xl border transition-colors flex items-start justify-between gap-2 ${
                            n.read
                              ? 'bg-white/[0.02] border-white/5 text-white/60'
                              : 'bg-white/[0.06] border-[#00d2ff]/30 text-white shadow-sm'
                          }`}
                        >
                          <div className="space-y-0.5 min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 font-medium text-xs">
                              {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-[#00d2ff]" />}
                              <span className="truncate">{n.title}</span>
                            </div>
                            <p className="text-[11px] text-white/60 line-clamp-2 leading-relaxed">
                              {n.body}
                            </p>
                            <div className="text-[9px] text-white/30 font-mono">
                              {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => handleDeleteNotif(n.id, e)}
                            className="p-1 rounded-lg text-white/30 hover:text-red-400 hover:bg-white/10 transition-colors shrink-0"
                            title="Delete notification"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full liquid-glass border border-white/10 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white/80 font-medium">{user?.name || 'Administrator'}</span>
            <span className="text-white/40 uppercase text-[10px]">({user?.role || 'ADMIN'})</span>
          </div>

          <button
            onClick={handleLogout}
            title="Log out"
            className="p-2 rounded-full border border-white/10 bg-white/5 hover:bg-red-500/20 hover:border-red-500/40 text-white/70 hover:text-red-400 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="md:hidden p-2 rounded-full border border-white/10 bg-white/5 text-white hover:bg-white/10"
          >
            {mobileNavOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* -------------------------------------------------------------------- */}
      {/* Mobile Navigation Drawer                                             */}
      {/* -------------------------------------------------------------------- */}
      <AnimatePresence>
        {mobileNavOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden fixed inset-x-0 top-14 z-30 bg-black/95 backdrop-blur-2xl border-b border-white/10 p-6 space-y-4 max-h-[85vh] overflow-y-auto admin-sidebar no-wave"
            data-no-wave="true"
          >
            {NAV_GROUPS.map((group) => (
              <div key={group.label} className="space-y-1">
                <div className="px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-cyan-400/80 font-semibold">
                  {group.label}
                </div>
                {group.items.map((item) => {
                  const active = isItemActive(item.path);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileNavOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all no-wave ${
                        active
                          ? 'bg-gradient-to-r from-[#00d2ff]/20 to-[#3D81E3]/20 border border-[#00d2ff]/50 text-white'
                          : 'text-white/70 hover:bg-white/5 hover:text-white'
                      }`}
                      data-no-wave="true"
                    >
                      <Icon className={`w-4 h-4 ${active ? 'text-[#00d2ff]' : 'text-white/60'}`} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* -------------------------------------------------------------------- */}
      {/* Main Administrative Layout Grid                                      */}
      {/* -------------------------------------------------------------------- */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-8 flex gap-8">
        {/* Floating Liquid Glass Sidebar with Sections & Headings */}
        <aside className="hidden md:flex flex-col w-64 shrink-0 space-y-2 admin-sidebar no-wave" data-no-wave="true">
          <div className="p-3 rounded-3xl liquid-glass border border-white/10 backdrop-blur-2xl space-y-4 shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
            {NAV_GROUPS.map((group) => (
              <div key={group.label} className="space-y-1">
                <div className="px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-cyan-400/70 font-semibold">
                  {group.label}
                </div>

                {group.items.map((item) => {
                  const active = isItemActive(item.path);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className="relative block rounded-xl overflow-hidden group select-none no-wave"
                      data-no-wave="true"
                    >
                      {active && (
                        <motion.div
                          layoutId="active-admin-pill"
                          className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#00d2ff]/25 via-[#3D81E3]/20 to-white/10 border border-[#00d2ff]/60 shadow-[0_0_20px_rgba(0,210,255,0.2)]"
                          transition={{ type: 'spring', stiffness: 350, damping: 32 }}
                        />
                      )}

                      <div className="relative z-10 px-3 py-2 flex items-center justify-between text-xs transition-colors">
                        <div className="flex items-center gap-2.5">
                          <Icon
                            className={`w-3.5 h-3.5 transition-colors ${
                              active
                                ? 'text-[#00d2ff]'
                                : 'text-white/60 group-hover:text-white'
                            }`}
                          />
                          <span
                            className={`font-medium ${
                              active ? 'text-white' : 'text-white/70 group-hover:text-white'
                            }`}
                          >
                            {item.label}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ))}

            {/* Quick Status Pill */}
            <div className="pt-2 border-t border-white/5">
              <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 text-[11px] text-white/50 space-y-1">
                <div className="flex items-center justify-between">
                  <span>Engine Solver</span>
                  <span className="text-emerald-400 font-mono font-medium">100% ONLINE</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Constraint Radar</span>
                  <span className="text-cyan-300 font-mono font-medium">ACTIVE</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Dynamic Page Workspace */}
        <main className="flex-1 min-w-0">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* Admin Assistant Floating Widget */}
      <AIAssistantWidget />
    </div>
  );
}
