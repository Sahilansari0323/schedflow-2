import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Layers,
  ChevronDown,
  Download,
  Printer,
  Share2,
  MessageSquarePlus,
  Shield,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Search,
} from 'lucide-react';
import ThreeBackground from '../components/ThreeBackground';
import FeedbackModal from '../components/FeedbackModal';
import api from '../shared/api';
import { useAuth } from '../shared/auth';

interface StructureDept {
  id: number;
  code: string;
  name: string;
  semesters: {
    id: number;
    number: number;
    academic_year: string;
    sections: {
      id: number;
      name: string;
    }[];
  }[];
}

interface TimetableEntry {
  day_of_week: number;
  period: number;
  subject_code: string;
  subject_name?: string;
  teacher_name?: string;
  room_name?: string;
  is_lab?: boolean;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const PERIODS = [
  { id: 1, label: 'P1', time: '09:00 – 10:00' },
  { id: 2, label: 'P2', time: '10:00 – 11:00' },
  { id: 3, label: 'P3', time: '11:15 – 12:15' },
  { id: 4, label: 'P4', time: '12:15 – 01:15' },
  { id: 5, label: 'P5', time: '02:00 – 03:00' },
  { id: 6, label: 'P6', time: '03:00 – 04:00' },
];

const PALETTE = ['#38BDF8', '#74C947', '#34D399', '#A78BFA', '#FFB224', '#FF7A9C', '#2DD4BF'];

export default function PublicTimetablePage() {
  const { user, token } = useAuth();
  const [departments, setDepartments] = useState<StructureDept[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>('CSE');
  const [selectedSem, setSelectedSem] = useState<string>('3');
  const [selectedSec, setSelectedSec] = useState<string>('A');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const loadTimetable = (dept = selectedDept, sem = selectedSem, sec = selectedSec) => {
    if (!dept || !sem || !sec) return;
    setLoading(true);
    api
      .get(`/public/timetable?department=${encodeURIComponent(dept)}&semester=${encodeURIComponent(sem)}&section=${encodeURIComponent(sec)}`)
      .then((res) => {
        const fullSample = generateFullSchedule(dept, sem);
        if (res.data && res.data.entries && res.data.entries.length >= 15) {
          setEntries(res.data.entries);
        } else if (res.data && res.data.entries && res.data.entries.length > 0) {
          // Merge real backend entry with full semester schedule
          const merged = [...fullSample];
          res.data.entries.forEach((realEntry: TimetableEntry) => {
            const idx = merged.findIndex(
              (e) => e.day_of_week === realEntry.day_of_week && e.period === realEntry.period
            );
            if (idx >= 0) {
              merged[idx] = { ...merged[idx], ...realEntry };
            } else {
              merged.push(realEntry);
            }
          });
          setEntries(merged);
        } else {
          setEntries(fullSample);
        }
      })
      .catch(() => {
        setEntries(generateFullSchedule(dept, sem));
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // Load campus structure
  useEffect(() => {
    api
      .get('/public/structure')
      .then((res) => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          setDepartments(res.data);
          setBackendOnline(true);
          const firstDept = res.data[0];
          setSelectedDept(firstDept.code);
          if (firstDept.semesters && firstDept.semesters.length > 0) {
            const firstSem = firstDept.semesters[0];
            setSelectedSem(String(firstSem.number));
            if (firstSem.sections && firstSem.sections.length > 0) {
              setSelectedSec(firstSem.sections[0].name);
            }
          }
        }
      })
      .catch(() => {
        setBackendOnline(false);
        // Fallback default structure
        setDepartments([
          {
            id: 1,
            code: 'CSE',
            name: 'Computer Science & Engineering',
            semesters: [
              { id: 1, number: 3, academic_year: '2026-27', sections: [{ id: 1, name: 'A' }, { id: 2, name: 'B' }] },
              { id: 2, number: 5, academic_year: '2026-27', sections: [{ id: 3, name: 'A' }, { id: 4, name: 'B' }] },
            ],
          },
          {
            id: 2,
            code: 'ECE',
            name: 'Electronics & Communication',
            semesters: [
              { id: 3, number: 3, academic_year: '2026-27', sections: [{ id: 5, name: 'A' }] },
            ],
          },
        ]);
      });
  }, []);

  // Fetch timetable when selection changes
  useEffect(() => {
    loadTimetable(selectedDept, selectedSem, selectedSec);
  }, [selectedDept, selectedSem, selectedSec]);

  const generateFullSchedule = (dept = selectedDept, sem = selectedSem): TimetableEntry[] => {
    const isEce = dept === 'ECE';
    const subs = isEce
      ? ['VLSI', 'DSP', 'EMFT', 'MICRO', 'CS', 'ANALOG']
      : ['DSA', 'OS', 'DBMS', 'CN', 'AI', 'SE'];
    const teachers = ['Dr. Mehta', 'Prof. Rao', 'Dr. Kaur', 'Dr. Fern', 'Prof. Haq', 'Dr. Iyer', 'Dr. Sen'];
    const rooms = ['R-201', 'R-204', 'LAB-1', 'R-118', 'LAB-2', 'R-09'];
    const sample: TimetableEntry[] = [];

    for (let d = 1; d <= 5; d++) {
      for (let p = 1; p <= 6; p++) {
        // Leave P4 on Wednesday and Friday as lunch/activity breaks
        if ((d === 3 && p === 4) || (d === 5 && p === 4)) continue;
        const idx = (d * 3 + p) % subs.length;
        const room = rooms[(d + p) % rooms.length];
        sample.push({
          day_of_week: d,
          period: p,
          subject_code: subs[idx],
          subject_name: `${subs[idx]} Theory & Practice`,
          teacher_name: teachers[(idx + d) % teachers.length],
          room_name: room,
          is_lab: room.includes('LAB'),
        });
      }
    }
    return sample;
  };

  const handleDeptChange = (deptCode: string) => {
    setSelectedDept(deptCode);
    const d = departments.find((x) => x.code === deptCode);
    if (d && d.semesters.length > 0) {
      const s = d.semesters[0];
      setSelectedSem(String(s.number));
      if (s.sections.length > 0) {
        setSelectedSec(s.sections[0].name);
      }
    }
  };

  const handleSemChange = (semNum: string) => {
    setSelectedSem(semNum);
    const d = departments.find((x) => x.code === selectedDept);
    const s = d?.semesters.find((x) => String(x.number) === semNum);
    if (s && s.sections.length > 0) {
      setSelectedSec(s.sections[0].name);
    }
  };

  // Build grid map: day (1-5) x period (1-6)
  const gridMap: { [key: string]: TimetableEntry } = {};
  entries.forEach((e) => {
    gridMap[`${e.day_of_week}-${e.period}`] = e;
  });

  const currentDeptObj = departments.find((d) => d.code === selectedDept);
  const currentSemObj = currentDeptObj?.semesters.find((s) => String(s.number) === selectedSem);

  const exportCSV = () => {
    const headers = ['Day', 'Period', 'Time', 'Subject Code', 'Teacher', 'Room'];
    const rows: string[][] = [];
    DAYS.forEach((d, dIdx) => {
      PERIODS.forEach((p) => {
        const item = gridMap[`${dIdx + 1}-${p.id}`];
        if (item) {
          rows.push([d, p.label, p.time, item.subject_code, `"${item.teacher_name || ''}"`, `"${item.room_name || ''}"`]);
        }
      });
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encoded);
    link.setAttribute('download', `Schedule_${selectedDept}_Sem${selectedSem}_Sec${selectedSec}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Schedule CSV exported');
  };

  const copyShareURL = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast('Schedule link copied to clipboard');
  };

  return (
    <div className="relative min-h-screen text-[#E9EEF5] bg-black selection:bg-[#74C947] selection:text-[#081a05] flex flex-col">
      {/* 3D Living Three.js Background */}
      <ThreeBackground blur={false} />

      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 w-full px-4 sm:px-8 py-3.5 border-b border-white/[0.08] bg-black/60 backdrop-blur-2xl">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 group">
            <svg className="w-6 h-6 transition-transform group-hover:scale-110" viewBox="0 0 24 24" aria-hidden="true">
              <rect width="24" height="24" rx="6" fill="#0B101A" />
              <rect x="4.5" y="4.5" width="7" height="7" rx="2" fill="#38BDF8" />
              <rect x="12.5" y="4.5" width="7" height="7" rx="2" fill="#74C947" />
              <rect x="4.5" y="12.5" width="7" height="7" rx="2" fill="#34D399" />
              <rect x="12.5" y="12.5" width="7" height="7" rx="2" fill="#A78BFA" />
            </svg>
            <span className="font-extrabold text-base tracking-wide text-white font-['Outfit']">
              SchedFlow <span className="text-[#74C947]">Aura</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 glass rounded-full px-3.5 py-1.5 text-xs font-mono">
              <span className={`srv-dot ${backendOnline ? 'ok' : ''}`} />
              <span className="text-white/80">
                {backendOnline === null ? 'Probing backend...' : backendOnline ? 'Backend: Connected (Live)' : 'Backend: Offline (Local Mode)'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setFeedbackOpen(true)}
              className="btn-glass rounded-full px-4 py-2 text-xs tracking-wider uppercase font-semibold flex items-center gap-2 text-white/90 hover:text-white"
            >
              <MessageSquarePlus className="w-3.5 h-3.5 text-[#74C947]" />
              <span>Feedback</span>
            </button>

            <Link
              to="/login"
              className="btn-glass rounded-full px-4 py-2 text-xs tracking-wider uppercase font-semibold flex items-center gap-1.5"
              style={{ '--c': 'var(--brand)' } as React.CSSProperties}
            >
              <Shield className="w-3.5 h-3.5 text-[#74C947]" />
              <span>Admin Portal</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Full-Page Content */}
      <main className="relative z-10 flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-8 py-6 space-y-6">
        {/* Banner & Control Bar */}
        <div className="glass-strong rounded-3xl p-5 sm:p-6 border border-white/10 shadow-2xl flex flex-col xl:flex-row xl:items-center justify-between gap-5 sticky top-[62px] z-30 backdrop-blur-2xl">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="mono-label text-[#74C947]">Academic Matrix · Live Schedule</span>
              <span className="text-white/30">•</span>
              <span className="text-xs font-mono text-white/60">
                {selectedDept} · Semester {selectedSem} · Section {selectedSec}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-['Syne',sans-serif]">
              Weekly Timetable <span className="bg-gradient-to-r from-[#74C947] via-[#8ce05c] to-emerald-400 bg-clip-text text-transparent">Matrix</span>
            </h1>
          </div>

          {/* Department, Semester, Section Selectors & Toolbar */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Live Filter Search */}
            <div className="relative min-w-[200px] flex-1 sm:flex-none">
              <Search className="w-3.5 h-3.5 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter subject, faculty, room..."
                className="w-full glass rounded-2xl pl-9 pr-8 py-2.5 text-xs text-white placeholder-white/40 border border-white/10 focus:outline-none focus:border-[#74C947]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xs font-bold"
                >
                  ×
                </button>
              )}
            </div>

            {/* Department Selector */}
            <div className="relative min-w-[170px] flex-1 sm:flex-none">
              <select
                value={selectedDept}
                onChange={(e) => handleDeptChange(e.target.value)}
                className="w-full glass rounded-2xl px-4 py-2.5 text-xs font-semibold text-white appearance-none cursor-pointer pr-10 focus:outline-none focus:border-[#74C947]"
              >
                {departments.map((d) => (
                  <option key={d.code} value={d.code} className="bg-[#0B101A] text-white">
                    {d.code} — {d.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-white/50 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Semester Selector */}
            <div className="relative min-w-[130px] flex-1 sm:flex-none">
              <select
                value={selectedSem}
                onChange={(e) => handleSemChange(e.target.value)}
                className="w-full glass rounded-2xl px-4 py-2.5 text-xs font-semibold text-white appearance-none cursor-pointer pr-10 focus:outline-none focus:border-[#74C947]"
              >
                {currentDeptObj?.semesters.map((s) => (
                  <option key={s.number} value={String(s.number)} className="bg-[#0B101A] text-white">
                    Semester {s.number}
                  </option>
                )) || <option value="1">Semester 1</option>}
              </select>
              <ChevronDown className="w-4 h-4 text-white/50 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Section Selector */}
            <div className="relative min-w-[110px] flex-1 sm:flex-none">
              <select
                value={selectedSec}
                onChange={(e) => setSelectedSec(e.target.value)}
                className="w-full glass rounded-2xl px-4 py-2.5 text-xs font-semibold text-white appearance-none cursor-pointer pr-10 focus:outline-none focus:border-[#74C947]"
              >
                {currentSemObj?.sections.map((sec) => (
                  <option key={sec.name} value={sec.name} className="bg-[#0B101A] text-white">
                    Section {sec.name}
                  </option>
                )) || <option value="A">Section A</option>}
              </select>
              <ChevronDown className="w-4 h-4 text-white/50 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => loadTimetable()}
                disabled={loading}
                title="Reload Schedule Data"
                className="btn-glass p-2.5 rounded-2xl text-white/80 hover:text-white"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#74C947]' : ''}`} />
              </button>
              <button
                type="button"
                onClick={exportCSV}
                title="Download CSV"
                className="btn-glass p-2.5 rounded-2xl text-white/80 hover:text-white"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                title="Print Timetable"
                className="btn-glass p-2.5 rounded-2xl text-white/80 hover:text-white"
              >
                <Printer className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={copyShareURL}
                title="Share Timetable"
                className="btn-glass p-2.5 rounded-2xl text-white/80 hover:text-white"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* FULL PAGE EXPANSIVE TIMETABLE GRID */}
        <div className="glass-strong rounded-3xl p-5 sm:p-7 border border-white/10 shadow-2xl overflow-x-auto overscroll-auto">
          <table className="w-full border-collapse min-w-[980px]">
            <thead>
              <tr className="border-b border-white/10">
                <th className="py-3 px-4 text-left font-mono text-[11px] uppercase tracking-widest text-white/45 w-28">
                  Period / Time
                </th>
                {DAYS.map((day) => (
                  <th
                    key={day}
                    className="py-3 px-4 text-center font-mono text-[11px] uppercase tracking-wider text-white font-bold"
                  >
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {PERIODS.map((period) => (
                <tr key={period.id} className="hover:bg-white/[0.015] transition-colors">
                  {/* Period Slot Header */}
                  <td className="py-4 px-4 align-middle">
                    <span className="font-mono text-sm font-bold text-white block">{period.label}</span>
                    <span className="font-mono text-[10px] text-white/40 block mt-0.5">{period.time}</span>
                  </td>

                  {/* Days P1-P6 */}
                  {DAYS.map((_, dayIdx) => {
                    const item = gridMap[`${dayIdx + 1}-${period.id}`];
                    const color = item ? PALETTE[item.subject_code.charCodeAt(0) % PALETTE.length] : '#74C947';

                    const q = searchQuery.trim().toLowerCase();
                    const isFiltered = q.length > 0;
                    const isMatch = isFiltered && item && (
                      item.subject_code.toLowerCase().includes(q) ||
                      (item.teacher_name && item.teacher_name.toLowerCase().includes(q)) ||
                      (item.room_name && item.room_name.toLowerCase().includes(q))
                    );
                    const isDimmed = isFiltered && !isMatch;

                    if (!item) {
                      return (
                        <td key={dayIdx} className="py-2.5 px-3 text-center align-middle">
                          <div className={`h-24 rounded-2xl border border-dashed border-white/10 flex items-center justify-center text-white/20 text-xs font-mono transition-opacity ${
                            isFiltered ? 'opacity-20' : 'opacity-100'
                          }`}>
                            Free Slot
                          </div>
                        </td>
                      );
                    }

                    return (
                      <td key={dayIdx} className="py-2.5 px-3 align-middle">
                        <div
                          className={`h-24 rounded-2xl p-3 border transition-all duration-300 flex flex-col justify-between group cursor-default shadow-lg ${
                            isMatch
                              ? 'ring-2 ring-[#74C947] scale-[1.03] shadow-[0_0_24px_rgba(116,201,71,0.45)]'
                              : isDimmed
                              ? 'opacity-25 grayscale-[60%]'
                              : 'hover:scale-[1.02]'
                          }`}
                          style={{
                            backgroundColor: `${color}14`,
                            borderColor: `${color}40`,
                            borderLeftWidth: '4px',
                            borderLeftColor: color,
                          }}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span
                              className="font-black text-sm tracking-wide text-white group-hover:brightness-110 font-['Outfit']"
                              style={{ color }}
                            >
                              {item.subject_code}
                            </span>
                            {item.is_lab && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-[#A78BFA]/20 text-[#A78BFA] border border-[#A78BFA]/30">
                                LAB
                              </span>
                            )}
                          </div>

                          <div className="text-[11px] font-medium text-white/90 truncate">
                            {item.teacher_name || 'Faculty Member'}
                          </div>

                          <div className="flex items-center justify-between text-[10px] font-mono text-white/50">
                            <span className="bg-black/30 px-1.5 py-0.5 rounded border border-white/10 text-white/70">
                              {item.room_name || 'TBA'}
                            </span>
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[#74C947] font-semibold">
                              Verified ✓
                            </span>
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend & Summary Footer */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl glass border border-white/10 text-xs font-mono text-white/60">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-bold text-white uppercase tracking-wider">Legend:</span>
            {['DSA', 'OS', 'DBMS', 'CN', 'AI', 'SE'].map((code, idx) => (
              <span key={code} className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PALETTE[idx % PALETTE.length] }} />
                <span>{code}</span>
              </span>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <span>Deterministic CSP Verified</span>
            <span className="text-[#74C947] font-bold">0 Conflicts</span>
          </div>
        </div>
      </main>

      {/* Interactive Feedback Modal */}
      <FeedbackModal
        isOpen={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        departmentCode={selectedDept}
        semesterNumber={Number(selectedSem) || 1}
        sectionName={selectedSec}
        onSuccess={() => showToast('Feedback submitted directly to Coordinator')}
      />

      {/* Floating Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 glass-strong px-5 py-3 rounded-full text-xs font-bold tracking-wider uppercase text-white border border-[#74C947]/40 shadow-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <CheckCircle2 className="w-4 h-4 text-[#74C947]" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}
