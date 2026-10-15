import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Calendar,
  AlertTriangle,
  Zap,
  Check,
  ChevronRight,
  ShieldCheck,
  Clock,
  ArrowUpRight,
  Layers,
  Wand2,
  CheckCircle2,
  RefreshCw,
  Search,
  Menu,
  X,
} from 'lucide-react';
import AppleButton, { AppleLogo, SchedFlowMark } from '../components/AppleButton';
import GlassCard from '../components/GlassCard';

const gradientStyle: React.CSSProperties = {
  backgroundImage:
    'linear-gradient(to right, #091020 0%, #0B2551 12.5%, #A4F4FD 32.5%, #00d2ff 50%, #0B2551 67.5%, #091020 87.5%, #091020 100%)',
  backgroundSize: '200% auto',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
  WebkitTextFillColor: 'transparent',
  filter: 'url(#c3-noise)',
};

interface ScheduleSlot {
  id: string;
  day: string;
  time: string;
  code: string;
  title: string;
  teacher: string;
  room: string;
  hasConflict?: boolean;
}

const INITIAL_SCHEDULE: ScheduleSlot[] = [
  { id: '1', day: 'Mon', time: '09:00 AM', code: 'CS-401', title: 'Distributed Systems', teacher: 'Dr. Vance', room: 'Lab 3B' },
  { id: '2', day: 'Mon', time: '11:00 AM', code: 'CS-302', title: 'Neural Computing', teacher: 'Prof. Sato', room: 'Hall 2' },
  { id: '3', day: 'Tue', time: '10:00 AM', code: 'MATH-201', title: 'Linear Optimization', teacher: 'Dr. Sharma', room: 'Hall 1' },
  { id: '4', day: 'Wed', time: '02:00 PM', code: 'PHYS-105', title: 'Quantum Information', teacher: 'Prof. Rossi', room: 'Audit-A' },
  { id: '5', day: 'Thu', time: '09:00 AM', code: 'ENG-310', title: 'Compiler Engineering', teacher: 'Dr. Chen', room: 'Lab 1A' },
  { id: '6', day: 'Fri', time: '03:00 PM', code: 'DS-204', title: 'Statistical Inference', teacher: 'Prof. Novak', room: 'Sem-4' },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [schedule, setSchedule] = useState<ScheduleSlot[]>(INITIAL_SCHEDULE);
  const [hasConflict, setHasConflict] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<ScheduleSlot>(INITIAL_SCHEDULE[0]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [yearly, setYearly] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleInjectConflict = () => {
    setHasConflict(true);
    setSchedule((prev) =>
      prev.map((s) =>
        s.id === '2'
          ? {
              ...s,
              title: 'COLLISION: Neural Computing',
              teacher: 'Dr. Vance [DUAL ALLOCATION]',
              room: 'Lab 3B [OVERLAPPED]',
              hasConflict: true,
            }
          : s
      )
    );
    showToast('Simulated Conflict: Dr. Vance assigned to two rooms concurrently');
  };

  const handleResolveConflict = () => {
    setResolving(true);
    setTimeout(() => {
      setHasConflict(false);
      setResolving(false);
      setSchedule(INITIAL_SCHEDULE);
      showToast('AI CSP Solver: Evaluated 14,200 permutations and repaired schedule in 11ms');
    }, 600);
  };

  const navLinks = [
    { label: 'Architecture', href: '#features' },
    { label: 'Matrix Sandbox', href: '#sandbox' },
    { label: 'Deployment Tiers', href: '#pricing' },
    { label: 'Public Timetable', href: '/timetable' },
  ];

  return (
    <div className="page-landing relative min-h-screen text-white font-sans selection:bg-[#00d2ff]/30">
      {/* Interactive Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 liquid-glass rounded-full px-5 py-3 border border-white/20 text-white text-xs font-medium shadow-2xl flex items-center gap-2.5 backdrop-blur-xl bg-black/85"
          >
            <span className="w-2 h-2 rounded-full bg-[#00d2ff] animate-pulse" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================================================================== */}
      {/* 1. Header / Navbar                                                  */}
      {/* ==================================================================== */}
      <header className="pt-6 pb-2 relative z-20">
        <motion.nav
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-[1380px] w-full mx-auto px-6 sm:px-8 flex items-center justify-between gap-6"
        >
          {/* Brand LogoMark */}
          <Link to="/" className="flex items-center gap-3 group shrink-0">
            <div className="w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white group-hover:scale-105 transition-transform shadow-[0_0_20px_rgba(0,210,255,0.3)]">
              <SchedFlowMark className="w-6 h-6 text-[#00d2ff]" />
            </div>
            <span className="font-semibold text-lg tracking-tight text-white hidden sm:inline">
              SchedFlow <span className="text-[#00d2ff] font-mono text-xs">Aura</span>
            </span>
          </Link>

          {/* Desktop Links - Fluid iPhone Liquid Glass Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            {navLinks.map((link) => {
              const isInternal = link.href.startsWith('/');
              const btnClass =
                "iphone-liquid-glass px-4.5 py-2 rounded-full text-xs font-semibold text-white/85 hover:text-white transition-all cursor-pointer whitespace-nowrap shrink-0";
              return isInternal ? (
                <Link key={link.label} to={link.href} className={btnClass}>
                  <span className="flex items-center gap-2 whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00d2ff] shadow-[0_0_6px_#00d2ff] shrink-0" />
                    {link.label}
                  </span>
                </Link>
              ) : (
                <a key={link.label} href={link.href} className={btnClass}>
                  <span className="flex items-center gap-2 whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00d2ff] shadow-[0_0_6px_#00d2ff] shrink-0" />
                    {link.label}
                  </span>
                </a>
              );
            })}
          </div>

          {/* Right Desktop Actions */}
          <div className="hidden lg:flex items-center gap-3 shrink-0">
            <Link to="/timetable">
              <AppleButton
                label="Public Schedule"
                variant="glass"
                className="!py-2 !px-4.5 text-xs whitespace-nowrap"
                icon={<Calendar className="w-3.5 h-3.5 text-[#00d2ff] shrink-0" />}
              />
            </Link>
            <Link to="/login">
              <AppleButton
                label="Launch Portal"
                variant="white"
                className="!py-2 !px-4.5 text-xs whitespace-nowrap"
              />
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-10 h-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-white"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </motion.nav>

        {/* Mobile Dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden px-6 pt-4 overflow-hidden"
            >
              <div className="liquid-glass rounded-3xl p-6 flex flex-col gap-4 border border-white/10 bg-black/90 backdrop-blur-2xl">
                {navLinks.map((link) => {
                  const isInternal = link.href.startsWith('/');
                  const btnClass =
                    "iphone-liquid-glass w-full px-4 py-3 rounded-2xl text-xs font-semibold text-white/90 hover:text-white transition-all flex items-center gap-2.5";
                  return isInternal ? (
                    <Link
                      key={link.label}
                      to={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={btnClass}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00d2ff] shadow-[0_0_6px_#00d2ff]" />
                      {link.label}
                    </Link>
                  ) : (
                    <a
                      key={link.label}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={btnClass}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00d2ff] shadow-[0_0_6px_#00d2ff]" />
                      {link.label}
                    </a>
                  );
                })}
                <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
                  <Link to="/timetable" onClick={() => setMobileMenuOpen(false)}>
                    <AppleButton label="Public Timetable" full variant="glass" />
                  </Link>
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                    <AppleButton label="Launch Admin Portal" full variant="white" />
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ==================================================================== */}
      {/* 2. Hero Section                                                     */}
      {/* ==================================================================== */}
      <section className="pt-20 md:pt-32 pb-20 text-center flex flex-col items-center px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full liquid-glass border border-white/15 text-xs text-white/80 mb-8 backdrop-blur-xl"
        >
          <span className="w-2 h-2 rounded-full bg-[#00d2ff] animate-pulse" />
          <span className="uppercase tracking-widest font-semibold text-[11px] text-[#00d2ff]">
            AURA v5.0 DETERMINISTIC INTELLIGENCE
          </span>
        </motion.div>

        {/* Shining Revitalized Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-5xl sm:text-7xl md:text-8xl font-semibold tracking-tight leading-[0.95] max-w-4xl"
        >
          <span className="block text-white">Your timetable.</span>
          <span className="block animate-shiny mt-2 md:mt-3" style={gradientStyle}>
            Revitalized
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.7 }}
          className="text-white/70 text-base md:text-lg max-w-2xl mt-8 leading-relaxed font-normal"
        >
          SchedFlow Aura is the premier academic schedule platform for the modern era.
          It leverages deterministic constraint satisfaction solvers to organize, synchronize,
          and refine campus timetables into total clarity.
        </motion.p>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="flex flex-col sm:flex-row items-center gap-4 mt-10"
        >
          <Link to="/login">
            <AppleButton
              label="Launch App Portal"
              variant="white"
              onClick={() => showToast('Opening SchedFlow Aura Administrative Gateway...')}
            />
          </Link>
          <Link to="/timetable">
            <AppleButton
              label="Public Timetable Matrix"
              variant="glass"
              icon={<Calendar className="w-4 h-4 text-[#00d2ff] shrink-0" />}
            />
          </Link>
        </motion.div>

        <span className="text-white/40 text-xs mt-4">Zero Authentication Required for Public Queries</span>

        {/* Hero Interactive Feature Cards */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-5xl mt-12 text-left"
        >
          {[
            {
              tag: 'ENGINE CORE',
              title: 'Architecture',
              subtitle: 'Deterministic CSP Graph',
              desc: 'Sub-12ms heuristic solver computing 14,000+ permutations across teacher load and venue caps.',
              icon: Zap,
              href: '#features',
              accent: 'text-cyan-400',
              borderHover: 'hover:border-cyan-400/50',
            },
            {
              tag: 'INTERACTIVE',
              title: 'Matrix Sandbox',
              subtitle: 'Live Timetable Grid',
              desc: 'Direct weekly simulation. Click slots, inject double-bookings, and watch instant repairs.',
              icon: Calendar,
              href: '#sandbox',
              accent: 'text-blue-400',
              borderHover: 'hover:border-blue-400/50',
            },
            {
              tag: 'DIAGNOSTICS',
              title: 'Conflict Radar',
              subtitle: 'Zero-Overlap Scan',
              desc: 'Continuous background constraint validation eliminating room clashes and teacher collisions.',
              icon: AlertTriangle,
              href: '/admin/conflicts',
              accent: 'text-amber-400',
              borderHover: 'hover:border-amber-400/50',
            },
            {
              tag: 'STUDENT ACCESS',
              title: 'Public Portal',
              subtitle: 'Zero-Auth Delivery',
              desc: 'Instant student schedule queries filtered by department, semester, and section with CSV export.',
              icon: Layers,
              href: '/timetable',
              accent: 'text-emerald-400',
              borderHover: 'hover:border-emerald-400/50',
            },
          ].map((card, idx) => {
            const Icon = card.icon;
            const isInternal = card.href.startsWith('/');
            const CardWrapper = ({ children }: { children: React.ReactNode }) =>
              isInternal ? (
                <Link to={card.href} className="block group select-none">
                  {children}
                </Link>
              ) : (
                <a href={card.href} className="block group select-none">
                  {children}
                </a>
              );

            return (
              <CardWrapper key={card.title}>
                <div
                  className={`p-5 rounded-3xl liquid-glass border border-white/10 backdrop-blur-xl transition-all duration-300 group-hover:-translate-y-1.5 group-hover:bg-white/[0.04] ${card.borderHover} shadow-[0_8px_32px_rgba(0,0,0,0.5)] h-full flex flex-col justify-between`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-white/50 px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                        {card.tag}
                      </span>
                      <Icon className={`w-4 h-4 ${card.accent} transition-transform group-hover:scale-110`} />
                    </div>
                    <div className="text-base font-semibold text-white group-hover:text-cyan-300 transition-colors">
                      {card.title}
                    </div>
                    <div className="text-xs text-white/70 font-medium mt-0.5">
                      {card.subtitle}
                    </div>
                    <p className="text-[11px] text-white/45 mt-2 leading-relaxed">
                      {card.desc}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center text-[11px] font-medium text-white/60 group-hover:text-white transition-colors">
                    <span>Explore module</span>
                    <ChevronRight className="w-3 h-3 ml-1 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </CardWrapper>
            );
          })}
        </motion.div>
      </section>

      {/* ==================================================================== */}
      {/* 3. Quantum Engine Telemetry HUD Bar                                 */}
      {/* ==================================================================== */}
      <div className="max-w-5xl mx-auto px-6 mb-8 relative z-10">
        <div className="rounded-full bg-white/[0.04] border border-cyan-400/25 px-6 sm:px-8 py-3 flex items-center justify-center gap-6 sm:gap-10 text-xs backdrop-blur-2xl shadow-[0_4px_30px_rgba(0,180,255,0.08)] overflow-hidden">
          {/* Engine Status Beacon */}
          <div className="flex items-center gap-3 shrink-0">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00d2ff] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00d2ff] shadow-[0_0_8px_#00d2ff]" />
            </span>
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-white flex items-center gap-2 whitespace-nowrap">
              <span>AURA SOLVER NODE</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-[#00d2ff] font-semibold">
                ONLINE • v5.2
              </span>
            </span>
          </div>

          <div className="hidden sm:block w-[1px] h-4 bg-white/15 shrink-0" />

          {/* Real-Time Telemetry Metrics */}
          <div className="flex items-center gap-6 text-white/75 font-mono text-[11px] shrink-0">
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <Sparkles className="w-3.5 h-3.5 text-[#00d2ff]" />
              <span>Velocity:</span>
              <span className="text-white font-semibold">12ms Resolution</span>
            </div>
            <div className="hidden md:flex items-center gap-1.5 whitespace-nowrap">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Integrity:</span>
              <span className="text-emerald-300 font-semibold">100% Conflict-Free</span>
            </div>
            <div className="hidden lg:flex items-center gap-1.5 whitespace-nowrap">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Throughput:</span>
              <span className="text-white font-semibold">14.2k Permutations/sec</span>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 4. Interactive Timetable Matrix Mockup Sandbox                     */}
      {/* ==================================================================== */}
      <section id="sandbox" className="max-w-6xl mx-auto px-6 py-12 md:py-20 relative z-10">
        <GlassCard variant="pro" className="!p-8 sm:!p-12 !min-h-0 !rounded-[40px]">
          {/* Header Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6 mb-8">
            <div>
              <div className="flex items-center gap-2 text-[#00d2ff] text-xs font-mono uppercase tracking-wider mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>INTERACTIVE HEURISTIC MATRIX SANDBOX</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
                Live Timetable Optimization Engine
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleInjectConflict}
                disabled={hasConflict}
                className="px-4 py-2 rounded-full text-xs font-medium border border-red-500/40 bg-red-950/20 text-red-300 hover:bg-red-900/30 transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                <span>{hasConflict ? 'Collision Active' : 'Simulate Conflict'}</span>
              </button>

              <button
                type="button"
                onClick={handleResolveConflict}
                disabled={!hasConflict || resolving}
                className="px-4 py-2 rounded-full text-xs font-medium bg-[#00d2ff] text-black hover:bg-[#3D81E3] hover:text-white transition-all cursor-pointer flex items-center gap-2 disabled:opacity-40 shadow-[0_0_20px_rgba(0,210,255,0.4)]"
              >
                <Wand2 className={`w-3.5 h-3.5 ${resolving ? 'animate-spin' : ''}`} />
                <span>{resolving ? 'Calculating...' : 'Run AI Resolver'}</span>
              </button>
            </div>
          </div>

          {/* Status Bar */}
          <AnimatePresence>
            {hasConflict && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 p-4 rounded-2xl border border-red-500/50 bg-red-950/30 text-xs text-red-200 flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>
                    <strong>OVERLAP DETECTED:</strong> Dr. Vance scheduled simultaneously in Lab 3B for CS-401 & CS-302.
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-red-500/20 text-red-300 font-mono text-[10px] font-semibold border border-red-500/30">
                  CSP VIOLATION
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Timetable Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {schedule.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedSlot(item)}
                className={`p-5 rounded-3xl transition-all duration-300 cursor-pointer ${
                  item.hasConflict
                    ? 'border-2 border-red-500 bg-red-950/40 shadow-[0_0_25px_rgba(239,68,68,0.3)]'
                    : selectedSlot.id === item.id
                    ? 'liquid-glass border-2 border-[#00d2ff] shadow-[0_0_24px_rgba(0,210,255,0.25)]'
                    : 'liquid-glass border border-white/10 hover:border-white/25 hover:bg-white/[0.03]'
                }`}
              >
                <div className="flex items-center justify-between font-mono text-[11px] text-white/50 mb-2">
                  <span>{item.day} · {item.time}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full font-semibold ${
                      item.hasConflict
                        ? 'bg-red-500/30 text-red-300'
                        : 'bg-[#00d2ff]/20 text-[#00d2ff]'
                    }`}
                  >
                    {item.code}
                  </span>
                </div>

                <div className="font-semibold text-white text-base truncate mb-1">
                  {item.title}
                </div>

                <div className="flex items-center justify-between text-xs text-white/60 pt-3 border-t border-white/10 mt-3">
                  <span>{item.teacher}</span>
                  <span className="text-[#00d2ff] font-medium">{item.room}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center text-xs text-white/40">
            Click any lecture module to inspect constraint attributes · Real-time CSP Genetic Matrix
          </div>
        </GlassCard>
      </section>

      {/* ==================================================================== */}
      {/* 5. Architectural Pillars                                            */}
      {/* ==================================================================== */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-20 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#00d2ff]">
            <Layers className="w-3.5 h-3.5" />
            <span>ARCHITECTURAL PILLARS</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight text-white">
            Engineered without friction.
          </h2>
          <p className="text-white/60 text-sm sm:text-base leading-relaxed">
            Every lecture slot, room capacity vector, and instructor load limit is mathematically verified before persisting.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GlassCard variant="compact" className="space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-[#00d2ff]/10 border border-[#00d2ff]/30 flex items-center justify-center text-[#00d2ff]">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-semibold text-white tracking-tight">
              Genetic CSP Solver
            </h3>
            <p className="text-white/60 text-sm leading-relaxed">
              Evaluates 12,000 timetable permutations per second, resolving hard teacher overlaps and classroom acoustic limits with zero manual spreadsheet fatigue.
            </p>
          </GlassCard>

          <GlassCard variant="compact" className="space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400">
              <RefreshCw className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-semibold text-white tracking-tight">
              Substitution Radar
            </h3>
            <p className="text-white/60 text-sm leading-relaxed">
              When instructors take sudden emergency leave, the radar scans teacher rankings and qualifications, appointing surrogate faculty in 15 milliseconds.
            </p>
          </GlassCard>

          <GlassCard variant="compact" className="space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-blue-400/10 border border-blue-400/30 flex items-center justify-center text-blue-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-semibold text-white tracking-tight">
              Zero-Auth Student Access
            </h3>
            <p className="text-white/60 text-sm leading-relaxed">
              Students view published cohort schedules with zero login walls, instantaneous filtering by semester and section, and one-click telemetry CSV export.
            </p>
          </GlassCard>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 6. Testimonials                                                      */}
      {/* ==================================================================== */}
      <section className="max-w-6xl mx-auto px-6 py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GlassCard variant="compact">
            <p className="text-white/80 text-sm leading-relaxed italic mb-6">
              "SchedFlow Aura gave our academic registrar four full weeks back during annual term scheduling. It calculates clashes before human error can even occur."
            </p>
            <div className="text-xs">
              <div className="font-semibold text-white">Dr. Sarah Sterling</div>
              <div className="text-white/40">Dean of Engineering · Stanford</div>
            </div>
          </GlassCard>

          <GlassCard variant="compact">
            <p className="text-white/80 text-sm leading-relaxed italic mb-6">
              "The emergency substitution finder alone resolved 40 faculty absences last semester with zero cancelled lectures or student confusion."
            </p>
            <div className="text-xs">
              <div className="font-semibold text-white">Marcus Vance</div>
              <div className="text-white/40">Academic Operations Director · Oxford</div>
            </div>
          </GlassCard>

          <GlassCard variant="compact">
            <p className="text-white/80 text-sm leading-relaxed italic mb-6">
              "Zero auth lookup for students reduced administrative inquiries by 92%. The glassmorphic interface makes schedule browsing effortless."
            </p>
            <div className="text-xs">
              <div className="font-semibold text-white">Elena Rostova</div>
              <div className="text-white/40">Registrar Lead · Cambridge</div>
            </div>
          </GlassCard>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 8. Deployment Pricing Tiers (Exact Match to Image 2)                 */}
      {/* ==================================================================== */}
      <section className="c3-pricing-section relative z-10" id="pricing">
        <div className="text-center max-w-3xl mx-auto mb-6 space-y-3">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#00d2ff]">
            <span>INSTITUTIONAL DEPLOYMENT TIERS</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight text-white">
            Predictable academic licensing.
          </h2>
          <p className="text-white/60 text-sm sm:text-base">
            Select the tier aligned with your campus department scale and computational solver volume.
          </p>
        </div>

        {/* Toggle Billing */}
        <div className="c3-toggle-wrap">
          <span className={`text-xs font-medium ${!yearly ? 'text-white' : 'text-white/40'}`}>
            Monthly Billing
          </span>
          <button
            type="button"
            className={`c3-toggle ${yearly ? 'active' : ''}`}
            onClick={() => setYearly(!yearly)}
            aria-label="Toggle annual billing"
          >
            <span className="c3-toggle-knob" />
          </button>
          <span className={`text-xs font-medium ${yearly ? 'text-white' : 'text-white/40'}`}>
            Annual Billing <span className="text-[#00d2ff] font-semibold">(20% off)</span>
          </span>
        </div>

        {/* 3-Column Glassmorphism Grid Matching Image 2 */}
        <div className="c3-grid">
          {/* Card 1: Free / Community */}
          <GlassCard>
            <div className="c3-tier-small">Campus Core</div>
            <div className="c3-tier-large">Free</div>
            <p className="c3-desc">
              For academic departments taking their first steps with automated constraint scheduling.
            </p>

            <ul className="c3-list">
              <li>
                <span className="c3-check">
                  <Check className="w-4 h-4 text-white" />
                </span>
                <span>Up to 3 departmental cohorts in the cloud</span>
              </li>
              <li>
                <span className="c3-check">
                  <Check className="w-4 h-4 text-white" />
                </span>
                <span>Timetable export up to 1080p & CSV</span>
              </li>
              <li>
                <span className="c3-check">
                  <Check className="w-4 h-4 text-white" />
                </span>
                <span>Standard heuristic conflict detection</span>
              </li>
              <li>
                <span className="c3-check">
                  <Check className="w-4 h-4 text-white" />
                </span>
                <span>Room capacity & workload templates</span>
              </li>
              <li>
                <span className="c3-check">
                  <Check className="w-4 h-4 text-white" />
                </span>
                <span>Access via web portal and mobile responsive UI</span>
              </li>
            </ul>

            <button
              type="button"
              onClick={() => showToast('Campus Core initialized with 3 free cohort slots')}
              className="c3-btn"
            >
              Get Started
            </button>
          </GlassCard>

          {/* Card 2: Standard */}
          <GlassCard>
            <div className="c3-tier-small">University Standard</div>
            <div className="c3-tier-large">
              {yearly ? '$7.99' : '$9.99'}
              <span className="text-lg font-normal text-white/50">/m</span>
            </div>
            <p className="c3-desc">
              For faculty coordinators and academic councils requiring high-velocity genetic resolution.
            </p>

            <ul className="c3-list">
              <li>
                <span className="c3-check">
                  <Check className="w-4 h-4 text-white" />
                </span>
                <span>Up to 50 departments & 500 faculty rosters</span>
              </li>
              <li>
                <span className="c3-check">
                  <Check className="w-4 h-4 text-white" />
                </span>
                <span>Instant 4K export & student portal synchronization</span>
              </li>
              <li>
                <span className="c3-check">
                  <Check className="w-4 h-4 text-white" />
                </span>
                <span>Advanced AI CSP constraint satisfaction toolkit</span>
              </li>
              <li>
                <span className="c3-check">
                  <Check className="w-4 h-4 text-white" />
                </span>
                <span>Emergency faculty substitution radar</span>
              </li>
              <li>
                <span className="c3-check">
                  <Check className="w-4 h-4 text-white" />
                </span>
                <span>Team collaboration (up to 15 registrar operators)</span>
              </li>
            </ul>

            <button
              type="button"
              onClick={() => showToast('University Standard selected. Connecting to Stripe gateway...')}
              className="c3-btn"
            >
              Start Free Trial
            </button>
          </GlassCard>

          {/* Card 3: Pro / Enterprise */}
          <GlassCard variant="pro">
            <div className="c3-tier-small">Enterprise Sovereign</div>
            <div className="c3-tier-large">
              {yearly ? '$15.99' : '$19.99'}
              <span className="text-lg font-normal text-white/50">/m</span>
            </div>
            <p className="c3-desc">
              For entire multi-campus universities needing dedicated solver clusters and institutional SSO.
            </p>

            <ul className="c3-list">
              <li>
                <span className="c3-check">
                  <Check className="w-4 h-4 text-white" />
                </span>
                <span>Unlimited campus faculties & student cohorts</span>
              </li>
              <li>
                <span className="c3-check">
                  <Check className="w-4 h-4 text-white" />
                </span>
                <span>Export up to 8K prints + realtime ICS calendar feeds</span>
              </li>
              <li>
                <span className="c3-check">
                  <Check className="w-4 h-4 text-white" />
                </span>
                <span>Autonomous heuristic solver with dedicated computing node</span>
              </li>
              <li>
                <span className="c3-check">
                  <Check className="w-4 h-4 text-white" />
                </span>
                <span>SAML 2.0 / Okta Institutional SSO & Audit Trail</span>
              </li>
              <li>
                <span className="c3-check">
                  <Check className="w-4 h-4 text-white" />
                </span>
                <span>24/7 dedicated academic engineering concierge</span>
              </li>
            </ul>

            <button
              type="button"
              onClick={() => showToast('Contacting Enterprise Engineering representative...')}
              className="c3-btn"
            >
              Contact University Sales
            </button>
          </GlassCard>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 9. Final CTA & Footer                                                */}
      {/* ==================================================================== */}
      <section className="max-w-6xl mx-auto px-6 py-20 md:py-28 relative z-10 text-center">
        <GlassCard variant="pro" className="!p-12 sm:!p-16 !min-h-0 !rounded-[44px] space-y-6">
          <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight text-white max-w-2xl mx-auto">
            Experience deterministic scheduling clarity.
          </h2>
          <p className="text-white/60 text-base max-w-xl mx-auto leading-relaxed">
            Eliminate professor double-bookings, classroom capacity conflicts, and administrative stress today.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/login">
              <AppleButton label="Launch Admin Portal" variant="white" />
            </Link>
            <Link to="/timetable">
              <AppleButton
                label="View Public Schedules"
                variant="glass"
                icon={<Calendar className="w-4 h-4 text-[#00d2ff] shrink-0" />}
              />
            </Link>
          </div>
        </GlassCard>

        {/* Footer */}
        <footer className="mt-20 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/50">
          <div className="flex items-center gap-2">
            <SchedFlowMark className="w-4 h-4 text-[#00d2ff]" />
            <span className="text-white/80 font-medium">SchedFlow Aura v5.0</span>
            <span>· Academic Intelligence</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="#features" className="hover:text-white transition-colors">Architecture</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <Link to="/timetable" className="hover:text-[#00d2ff] transition-colors">Public Portal</Link>
            <Link to="/login" className="hover:text-white transition-colors">Staff Login</Link>
          </div>

          <div className="text-[11px] text-white/40">
            © 2026 SchedFlow by ZCode · All Rights Reserved
          </div>
        </footer>
      </section>
    </div>
  );
}
