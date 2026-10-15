import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar,
  Download,
  ArrowLeft,
  Sparkles,
  Search,
  BookOpen,
  User,
  MapPin,
  CheckCircle2,
  Megaphone,
  Pin,
  MessageSquareWarning,
  X,
  Send,
  AlertCircle,
} from 'lucide-react';
import api, { getErrorMessage } from '../api';
import GlassCard from '../components/GlassCard';
import AppleButton, { SchedFlowMark } from '../components/AppleButton';

interface AnnouncementItem {
  id: number;
  title: string;
  body: string;
  pinned: boolean;
  created_at: string;
}

interface Department {
  id: number;
  name: string;
  code: string;
  semesters?: Semester[];
}

interface Semester {
  id: number;
  number: number;
  academic_year: string;
  sections?: Section[];
}

interface Section {
  id: number;
  name: string;
}

interface TimetableEntry {
  id?: number;
  day_of_week: number | string;
  period: number;
  subject_name: string;
  subject_code: string;
  teacher_name: string;
  room_name: string;
  is_lab?: boolean;
}

interface ScheduleResponse {
  department: { name: string; code: string };
  semester: { number: number; academic_year: string };
  section: { name: string };
  timetable: { id: number; version: number; academic_year?: string };
  entries: TimetableEntry[];
}

const DAYS = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function PublicTimetable() {
  const [structure, setStructure] = useState<Department[]>([]);
  const [selectedDeptCode, setSelectedDeptCode] = useState('');
  const [selectedSemNumber, setSelectedSemNumber] = useState('');
  const [selectedSecName, setSelectedSecName] = useState('');

  const [scheduleData, setScheduleData] = useState<ScheduleResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch departments structure
  useEffect(() => {
    api
      .get('/public/structure')
      .then((res) => {
        setStructure(res.data);
        if (res.data.length > 0) {
          const firstDept = res.data[0];
          setSelectedDeptCode(firstDept.code);
          if (firstDept.semesters?.length > 0) {
            const firstSem = firstDept.semesters[0];
            setSelectedSemNumber(String(firstSem.number));
            if (firstSem.sections?.length > 0) {
              setSelectedSecName(firstSem.sections[0].name);
            }
          }
        }
      })
      .catch((err) => {
        console.error('Failed to fetch public department structure', err);
      });
  }, []);

  const currentDept = structure.find((d) => d.code === selectedDeptCode);
  const availableSemesters = currentDept?.semesters || [];
  const currentSem = availableSemesters.find((s) => String(s.number) === selectedSemNumber);
  const availableSections = currentSem?.sections || [];

  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
  const [feedbackBusy, setFeedbackBusy] = useState(false);
  const [feedbackError, setFeedbackError] = useState('');
  const [feedbackForm, setFeedbackForm] = useState({
    reporter_name: 'Student',
    category: 'wrong_room',
    message: '',
  });

  useEffect(() => {
    const params = selectedDeptCode ? { department: selectedDeptCode } : {};
    api
      .get('/public/announcements', { params })
      .then((res) => setAnnouncements(res.data))
      .catch(() => {});
  }, [selectedDeptCode]);

  const submitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackForm.message.trim()) return;
    setFeedbackBusy(true);
    setFeedbackError('');
    try {
      await api.post('/public/feedback', {
        department_code: selectedDeptCode || 'GENERAL',
        semester_number: selectedSemNumber ? Number(selectedSemNumber) : null,
        section_name: selectedSecName || 'ALL',
        reporter_name: feedbackForm.reporter_name.trim() || 'Student',
        category: feedbackForm.category,
        message: feedbackForm.message.trim(),
      });
      setFeedbackSuccess(true);
      setTimeout(() => {
        setFeedbackOpen(false);
        setFeedbackSuccess(false);
        setFeedbackForm({
          reporter_name: 'Student',
          category: 'wrong_room',
          message: '',
        });
      }, 2000);
    } catch (err: any) {
      setFeedbackError(getErrorMessage(err, 'Failed to submit discrepancy report.'));
    } finally {
      setFeedbackBusy(false);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedDeptCode || !selectedSemNumber || !selectedSecName) return;

    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/public/timetable', {
        params: {
          department: selectedDeptCode,
          semester: Number(selectedSemNumber),
          section: selectedSecName,
        },
      });
      setScheduleData(res.data);
    } catch (err: any) {
      setScheduleData(null);
      setError(getErrorMessage(err, 'No published timetable found for this section.'));
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (!scheduleData || !scheduleData.entries) return;
    const headers = ['Day', 'Period', 'Course Code', 'Subject', 'Teacher', 'Room'];
    const rows = scheduleData.entries.map((e) => {
      const dayObj = DAYS.find((d) => Number(d.value) === Number(e.day_of_week));
      const dayLabel = dayObj ? dayObj.label : String(e.day_of_week);
      return [
        dayLabel,
        e.period,
        e.subject_code,
        `"${e.subject_name}"`,
        `"${e.teacher_name}"`,
        `"${e.room_name}"`,
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Schedule_${scheduleData.department?.code}_Sem${scheduleData.semester?.number}_Sec${scheduleData.section?.name}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="page-timetable relative min-h-screen text-white font-sans selection:bg-[#00d2ff]/30 py-8 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-3xl liquid-glass border border-white/10 backdrop-blur-2xl">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="p-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/15 text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#00d2ff]/20 border border-[#00d2ff]/40 flex items-center justify-center text-[#00d2ff]">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h1 className="font-semibold text-lg text-white">Public Schedule Matrix</h1>
                <div className="text-xs text-white/50">Zero-Authentication Instant Access</div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setFeedbackOpen(true)}
              className="px-3.5 py-2 rounded-full border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <MessageSquareWarning className="w-3.5 h-3.5" />
              <span>Report Issue</span>
            </button>
            <Link to="/login">
              <AppleButton label="Staff Portal" variant="glass" className="!py-2 !px-4 text-xs" />
            </Link>
          </div>
        </header>

        {/* Campus Announcements Banner */}
        {announcements.length > 0 && (
          <div className="rounded-3xl liquid-glass border border-cyan-500/20 bg-cyan-950/20 p-5 space-y-3 backdrop-blur-xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-300 font-mono uppercase tracking-wider">
              <Megaphone className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Campus Academic Notices ({announcements.length})</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {announcements.slice(0, 4).map((a) => (
                <div
                  key={a.id}
                  className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-cyan-500/30 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-semibold text-xs text-white flex items-center gap-1.5">
                      {a.pinned && <Pin className="w-3 h-3 text-amber-400 rotate-45 shrink-0" />}
                      {a.title}
                    </span>
                    <span className="text-[10px] text-white/40 font-mono shrink-0">
                      {new Date(a.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-white/70 line-clamp-2 leading-relaxed">{a.body}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filter Controls Card (Blurred Glass Structure) */}
        <GlassCard variant="compact">
          <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-xs uppercase tracking-wider text-white/60 mb-2 font-mono">
                01 Department
              </label>
              <select
                value={selectedDeptCode}
                onChange={(e) => {
                  setSelectedDeptCode(e.target.value);
                  setSelectedSemNumber('');
                  setSelectedSecName('');
                }}
                className="w-full h-11 px-4 rounded-2xl bg-black/60 border border-white/15 text-white text-sm focus:outline-none focus:border-[#00d2ff] transition-colors"
              >
                <option value="">Select Department...</option>
                {structure.map((d) => (
                  <option key={d.id} value={d.code} className="bg-neutral-900">
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-white/60 mb-2 font-mono">
                02 Semester
              </label>
              <select
                value={selectedSemNumber}
                onChange={(e) => {
                  setSelectedSemNumber(e.target.value);
                  setSelectedSecName('');
                }}
                disabled={availableSemesters.length === 0}
                className="w-full h-11 px-4 rounded-2xl bg-black/60 border border-white/15 text-white text-sm focus:outline-none focus:border-[#00d2ff] disabled:opacity-40 transition-colors"
              >
                <option value="">Select Semester...</option>
                {availableSemesters.map((s) => (
                  <option key={s.id} value={s.number} className="bg-neutral-900">
                    Semester {s.number} ({s.academic_year})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-white/60 mb-2 font-mono">
                03 Section
              </label>
              <select
                value={selectedSecName}
                onChange={(e) => setSelectedSecName(e.target.value)}
                disabled={availableSections.length === 0}
                className="w-full h-11 px-4 rounded-2xl bg-black/60 border border-white/15 text-white text-sm focus:outline-none focus:border-[#00d2ff] disabled:opacity-40 transition-colors"
              >
                <option value="">Select Section...</option>
                {availableSections.map((sec) => (
                  <option key={sec.id} value={sec.name} className="bg-neutral-900">
                    Section {sec.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <button
                type="submit"
                disabled={!selectedDeptCode || !selectedSemNumber || !selectedSecName || loading}
                className="w-full h-11 px-6 rounded-2xl bg-[#00d2ff] text-black font-semibold text-sm hover:bg-[#3D81E3] hover:text-white transition-all cursor-pointer disabled:opacity-40 flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(0,210,255,0.3)]"
              >
                <Search className="w-4 h-4" />
                <span>{loading ? 'Querying...' : 'Stream Matrix'}</span>
              </button>
            </div>
          </form>
        </GlassCard>

        {/* Schedule Display */}
        {scheduleData && (
          <GlassCard variant="pro" className="!p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <div className="text-xs uppercase font-mono text-[#00d2ff] tracking-wider mb-1">
                  PUBLISHED SCHEDULE ARCHITECTURE · VERSION {scheduleData.timetable?.version}
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  {scheduleData.department?.name} · Semester {scheduleData.semester?.number} · Section {scheduleData.section?.name}
                </h2>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={exportCSV}
                  className="px-4 py-2.5 rounded-full bg-white/[0.08] backdrop-blur-xl border border-white/20 text-xs font-semibold hover:bg-white/10 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-[#00d2ff]" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="py-3 px-4 font-mono text-white/50 uppercase">Day</th>
                    {PERIODS.map((p) => (
                      <th key={p} className="py-3 px-4 font-mono text-white/50 uppercase text-center">
                        Period {p}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DAYS.map((day) => {
                    const dayEntries =
                      scheduleData.entries?.filter(
                        (e) => Number(e.day_of_week) === Number(day.value)
                      ) || [];

                    return (
                      <tr key={day.value} className="border-b border-white/[0.06] hover:bg-white/[0.02]">
                        <td className="py-4 px-4 font-medium text-white/90 whitespace-nowrap">
                          {day.label}
                        </td>
                        {PERIODS.map((period) => {
                          const entry = dayEntries.find((e) => e.period === period);
                          return (
                            <td key={period} className="p-2 min-w-[140px] align-top">
                              {entry ? (
                                <div className="p-3 rounded-2xl liquid-glass border border-white/15 bg-black/40 space-y-1 hover:border-[#00d2ff]/60 transition-colors">
                                  <div className="font-mono text-[10px] text-[#00d2ff] font-semibold">
                                    {entry.subject_code}
                                  </div>
                                  <div className="font-medium text-white text-xs truncate">
                                    {entry.subject_name}
                                  </div>
                                  <div className="text-[11px] text-white/60 truncate flex items-center gap-1">
                                    <User className="w-3 h-3 text-white/40" />
                                    <span>{entry.teacher_name}</span>
                                  </div>
                                  <div className="text-[10px] text-cyan-300 flex items-center gap-1">
                                    <MapPin className="w-2.5 h-2.5 text-cyan-400" />
                                    <span>{entry.room_name}</span>
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

        {/* Empty State */}
        {!scheduleData && !error && (
          <GlassCard variant="compact" className="text-center py-20 space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#00d2ff]/10 border border-[#00d2ff]/30 flex items-center justify-center text-[#00d2ff] mx-auto">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold text-white">No Schedule Loaded</h3>
            <p className="text-white/50 text-xs max-w-md mx-auto">
              Select your academic Department, Semester, and Section division above to stream live published schedule data.
            </p>
          </GlassCard>
        )}

        {error && (
          <div className="p-6 rounded-3xl border border-red-500/40 bg-red-950/30 text-red-200 text-center text-sm">
            {error}
          </div>
        )}

        {/* Report Issue / Feedback Modal */}
        <AnimatePresence>
          {feedbackOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setFeedbackOpen(false)}
                className="absolute inset-0 bg-black/75 backdrop-blur-md"
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-lg rounded-3xl bg-neutral-950/90 border border-white/20 p-6 shadow-2xl backdrop-blur-2xl z-10 space-y-4"
              >
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                      <MessageSquareWarning className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-white">Report Schedule Discrepancy</h3>
                      <p className="text-[11px] text-white/50">Submit report directly to Academic Operations</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFeedbackOpen(false)}
                    className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {feedbackSuccess ? (
                  <div className="p-6 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-center space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                    <h4 className="text-sm font-semibold text-emerald-300">Report Transmitted</h4>
                    <p className="text-xs text-white/70">
                      Thank you! Your feedback has been placed into the Academic Coordination queue.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={submitFeedback} className="space-y-4 text-xs">
                    {feedbackError && (
                      <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{feedbackError}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-white/70 mb-1">Your Name / Handle</label>
                        <input
                          type="text"
                          value={feedbackForm.reporter_name}
                          onChange={(e) => setFeedbackForm({ ...feedbackForm, reporter_name: e.target.value })}
                          placeholder="e.g. Student / Class Rep"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white text-xs focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-white/70 mb-1">Problem Category</label>
                        <select
                          value={feedbackForm.category}
                          onChange={(e) => setFeedbackForm({ ...feedbackForm, category: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white text-xs focus:outline-none focus:border-amber-500 [&>option]:bg-slate-900"
                        >
                          <option value="wrong_room">Room Conflict / Wrong Venue</option>
                          <option value="wrong_teacher">Teacher Conflict / Wrong Faculty</option>
                          <option value="absent_teacher">Faculty Absenteeism</option>
                          <option value="other">Other Discrepancy</option>
                        </select>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-white/60">
                      Target Section: <strong className="text-white">{selectedDeptCode || 'General'}</strong> · Sem <strong className="text-white">{selectedSemNumber || '—'}</strong> · Section <strong className="text-white">{selectedSecName || '—'}</strong>
                    </div>

                    <div>
                      <label className="block text-white/70 mb-1">Discrepancy Details</label>
                      <textarea
                        required
                        rows={4}
                        value={feedbackForm.message}
                        onChange={(e) => setFeedbackForm({ ...feedbackForm, message: e.target.value })}
                        placeholder="Detail what is wrong with the timetable (e.g. Period 3 on Wednesday has two simultaneous lectures in Room 102)..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white text-xs focus:outline-none focus:border-amber-500 resize-none"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setFeedbackOpen(false)}
                        className="px-4 py-2 rounded-xl text-xs text-white/60 hover:text-white transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={feedbackBusy || !feedbackForm.message.trim()}
                        className="px-5 py-2 rounded-xl text-xs font-semibold text-black bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-110 transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(251,191,36,0.3)]"
                      >
                        <Send className="w-3 h-3" />
                        <span>{feedbackBusy ? 'Submitting…' : 'Submit Discrepancy'}</span>
                      </button>
                    </div>
                  </form>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
