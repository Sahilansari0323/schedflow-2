import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar,
  Clock,
  User,
  MapPin,
  BookOpen,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Send,
  Sparkles,
  Layers,
  X,
  Wand2,
  ShieldAlert,
} from 'lucide-react';
import api, { getErrorMessage } from '../../shared/api';
import GlassCard from '../../shared/components/GlassCard';
import AppleButton, { CTAButton, ReplyButton } from '../../shared/components/AppleButton';

interface Timetable {
  id: number;
  academic_year: string;
  semester_id: number;
  section_id: number;
  status: string;
  version: number;
  semester?: { number: number; academic_year: string };
  section?: { name: string };
}

interface TimetableEntry {
  id?: number;
  timetable_id: number;
  day_of_week: number;
  period: number;
  subject_id: number;
  teacher_id: number;
  room_id: number;
  subject?: { name: string; code: string; requires_lab?: boolean; elective_group?: string };
  teacher?: { name: string };
  room?: { name: string };
}

interface MasterData {
  subjects: Array<{ id: number; name: string; code: string; requires_lab: boolean; hours_per_week?: number; elective_group?: string }>;
  teachers: Array<{ id: number; name: string; max_weekly_load?: number }>;
  rooms: Array<{ id: number; name: string; capacity: number; room_type?: string }>;
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

export default function Builder() {
  const [searchParams] = useSearchParams();
  const urlId = searchParams.get('id');

  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [selectedTimetableId, setSelectedTimetableId] = useState<string>(urlId || '');
  const [currentTimetable, setCurrentTimetable] = useState<Timetable | null>(null);
  const [entries, setEntries] = useState<TimetableEntry[]>([]);

  const [master, setMaster] = useState<MasterData>({ subjects: [], teachers: [], rooms: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal State for slot assignment
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetSlot, setTargetSlot] = useState<{ day: number; period: number } | null>(null);
  const [modalForm, setModalForm] = useState({
    subject_id: '',
    teacher_id: '',
    room_id: '',
  });

  // Load master data and timetable list
  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const [subRes, teachRes, roomRes, ttRes] = await Promise.all([
          api.get('/subjects'),
          api.get('/teachers'),
          api.get('/rooms'),
          api.get('/timetables'),
        ]);
        setMaster({
          subjects: subRes.data,
          teachers: teachRes.data,
          rooms: roomRes.data,
        });
        setTimetables(ttRes.data);

        if (urlId) {
          setSelectedTimetableId(urlId);
        } else if (ttRes.data.length > 0) {
          setSelectedTimetableId(String(ttRes.data[0].id));
        }
      } catch (err: any) {
        setError(getErrorMessage(err, 'Failed to initialize builder data.'));
      }
    };
    fetchInitial();
  }, [urlId]);

  // Load selected timetable and its entries in parallel
  useEffect(() => {
    if (!selectedTimetableId) return;

    const fetchTimetableDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const [ttRes, entriesRes] = await Promise.all([
          api.get(`/timetables/${selectedTimetableId}`),
          api.get(`/timetables/${selectedTimetableId}/entries`),
        ]);
        setCurrentTimetable(ttRes.data);
        setEntries(entriesRes.data || []);
      } catch (err: any) {
        setError(getErrorMessage(err, 'Failed to load timetable entries.'));
      } finally {
        setLoading(false);
      }
    };
    fetchTimetableDetails();
  }, [selectedTimetableId]);

  const handleOpenSlotModal = (day: number, period: number) => {
    setTargetSlot({ day, period });
    setModalForm({
      subject_id: master.subjects[0]?.id ? String(master.subjects[0].id) : '',
      teacher_id: master.teachers[0]?.id ? String(master.teachers[0].id) : '',
      room_id: master.rooms[0]?.id ? String(master.rooms[0].id) : '',
    });
    setIsModalOpen(true);
  };

  const handleSaveSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetSlot || !selectedTimetableId) return;

    try {
      const payload = {
        day_of_week: Number(targetSlot.day),
        period: Number(targetSlot.period),
        subject_id: Number(modalForm.subject_id),
        teacher_id: Number(modalForm.teacher_id),
        room_id: Number(modalForm.room_id),
      };

      const res = await api.post(`/timetables/${selectedTimetableId}/entries`, payload);
      setEntries((prev) => [
        ...prev.filter(
          (item) =>
            !(
              Number(item.day_of_week) === Number(targetSlot.day) &&
              Number(item.period) === Number(targetSlot.period)
            )
        ),
        res.data,
      ]);
      setIsModalOpen(false);
    } catch (err: any) {
      alert(getErrorMessage(err, 'Slot assignment failed'));
    }
  };

  const handleDeleteSlot = async (entryId: number) => {
    if (!confirm('Are you sure you want to clear this period slot?')) return;
    try {
      await api.delete(`/timetables/entries/${entryId}`);
      setEntries((prev) => prev.filter((e) => e.id !== entryId));
    } catch (err: any) {
      alert(getErrorMessage(err, 'Failed to remove entry.'));
    }
  };

  const [generating, setGenerating] = useState(false);
  const [validating, setValidating] = useState(false);

  const handleGenerate = async () => {
    if (!selectedTimetableId) return;
    setGenerating(true);
    try {
      const res = await api.post(`/timetables/${selectedTimetableId}/generate`);
      const entriesRes = await api.get(`/timetables/${selectedTimetableId}/entries`);
      setEntries(entriesRes.data || []);
      const unplacedMsg = res.data.unplaced?.length ? `, ${res.data.unplaced.length} class(es) unplaced` : ' — fully placed';
      alert(`AI Generator drafted ${res.data.placed} class slots${unplacedMsg}.`);
    } catch (err: any) {
      alert(getErrorMessage(err, 'AI Solver generation failed.'));
    } finally {
      setGenerating(false);
    }
  };

  const handleValidate = async () => {
    if (!selectedTimetableId) return;
    setValidating(true);
    try {
      const res = await api.get(`/timetables/${selectedTimetableId}/validate`);
      if (res.data.length === 0) {
        alert('Verification Passed: 0 Hard or Soft Conflicts detected in this matrix! Safe to publish.');
      } else {
        alert(`Conflicts Radar: Found ${res.data.length} conflict(s). Please review conflict radar.`);
      }
    } catch (err: any) {
      alert(getErrorMessage(err, 'Validation failed.'));
    } finally {
      setValidating(false);
    }
  };

  const handlePublish = async () => {
    if (!selectedTimetableId) return;
    try {
      await api.post(`/timetables/${selectedTimetableId}/publish`);
      const ttRes = await api.get(`/timetables/${selectedTimetableId}`);
      setCurrentTimetable(ttRes.data);
      alert('Timetable successfully published to the live public portal!');
    } catch (err: any) {
      alert(getErrorMessage(err, 'Failed to publish timetable.'));
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-[rgba(16,20,32,0.65)] border border-white/10 backdrop-blur-3xl shadow-[0_14px_40px_rgba(0,0,0,0.5)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono tracking-widest text-[#74C947] uppercase font-bold">
              Deterministic Matrix Core
            </span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white">Timetable Builder</h2>
          <p className="text-xs text-white/60 mt-1 max-w-xl">
            Interactive multi-cohort scheduling grid with live collision safeguards, AI auto-draft generator, and publishing workflow.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Timetable Selector */}
          <select
            value={selectedTimetableId}
            onChange={(e) => setSelectedTimetableId(e.target.value)}
            className="px-4 py-2 rounded-2xl bg-white/[0.05] border border-white/15 text-white text-xs focus:outline-none focus:border-[#74C947] backdrop-blur-2xl transition shadow-sm font-medium"
          >
            {timetables.map((tt) => (
              <option key={tt.id} value={tt.id} className="bg-[#0e121e] text-white">
                Sem {tt.semester?.number || tt.semester_id} &middot; Sec {tt.section?.name || tt.section_id} ({tt.academic_year}) [{tt.status.toUpperCase()}]
              </option>
            ))}
          </select>

          <ReplyButton
            type="button"
            size="sm"
            onClick={handleGenerate}
            disabled={generating}
            className="!text-xs !py-1.5 !px-3 bg-white/[0.06] hover:bg-white/[0.12]"
          >
            <Wand2 className={`w-3.5 h-3.5 text-[#74C947] ${generating ? 'animate-spin' : ''}`} />
            <span>{generating ? 'Drafting…' : 'AI Auto-Draft'}</span>
          </ReplyButton>

          <ReplyButton
            type="button"
            size="sm"
            onClick={handleValidate}
            disabled={validating}
            className="!text-xs !py-1.5 !px-3 bg-white/[0.06] hover:bg-white/[0.12]"
          >
            <ShieldAlert className={`w-3.5 h-3.5 text-amber-400 ${validating ? 'animate-pulse' : ''}`} />
            <span>Check Conflicts</span>
          </ReplyButton>

          {currentTimetable?.status !== 'published' ? (
            <CTAButton size="sm" onClick={handlePublish} className="!text-xs !py-1.5 !px-3.5">
              <Send className="w-3.5 h-3.5" />
              <span>Publish Matrix</span>
            </CTAButton>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#74C947]/20 text-[#74C947] border border-[#74C947]/30 shadow-[0_0_12px_rgba(116,201,71,0.2)]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#74C947]" />
              <span>LIVE PUBLISHED</span>
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs text-center font-medium">
          {error}
        </div>
      )}

      {/* Grid Container */}
      <GlassCard variant="pro" className="!p-6 space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="text-xs text-white/60">
            Click any cell to assign an accredited faculty member, lecture hall, and curricular subject.
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-white/40">
            <span>6 Academic Days</span>
            <span>&middot;</span>
            <span>8 Periods Daily</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs min-w-[850px]">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                <th className="py-3 px-4 font-mono text-white/50 uppercase w-28">Day / Slot</th>
                {PERIODS.map((p) => (
                  <th key={p} className="py-3 px-4 font-mono text-white/50 uppercase text-center">
                    Period {p}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DAYS.map((day) => {
                const dayEntries = entries.filter((e) => Number(e.day_of_week) === Number(day.value));

                return (
                  <tr key={day.value} className="border-b border-white/5 hover:bg-white/[0.02] transition">
                    <td className="py-4 px-4 font-semibold text-white whitespace-nowrap bg-white/[0.01]">
                      {day.label}
                    </td>

                    {PERIODS.map((period) => {
                      const entry = dayEntries.find((e) => Number(e.period) === Number(period));

                      // Resolve metadata from master data
                      const subject = master.subjects.find((s) => s.id === entry?.subject_id) || entry?.subject;
                      const teacher = master.teachers.find((t) => t.id === entry?.teacher_id) || entry?.teacher;
                      const room = master.rooms.find((r) => r.id === entry?.room_id) || entry?.room;

                      return (
                        <td key={period} className="p-2 min-w-[135px] align-top">
                          {entry ? (
                            <div className="p-3 rounded-2xl bg-white/[0.05] border border-white/10 space-y-1 relative group hover:border-[#74C947]/40 backdrop-blur-2xl transition shadow-sm">
                              <button
                                onClick={() => entry.id && handleDeleteSlot(entry.id)}
                                title="Remove Assignment"
                                className="absolute right-2 top-2 p-1 rounded-lg text-white/30 hover:text-rose-400 hover:bg-rose-500/15 opacity-0 group-hover:opacity-100 transition cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>

                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-[10px] text-[#74C947] font-bold">
                                  {subject?.code || 'SUBJ'}
                                </span>
                                {subject?.requires_lab && (
                                  <span className="text-[8px] font-bold px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                    LAB
                                  </span>
                                )}
                                {subject?.elective_group && (
                                  <span className="text-[8px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                    {subject.elective_group}
                                  </span>
                                )}
                              </div>
                              <div className="font-semibold text-white text-xs truncate">
                                {subject?.name || 'Class'}
                              </div>
                              <div className="text-[11px] text-white/60 truncate flex items-center gap-1">
                                <User className="w-3 h-3 text-white/40" />
                                <span>{teacher?.name || 'Instructor'}</span>
                              </div>
                              <div className="text-[10px] text-[#74C947] flex items-center gap-1">
                                <MapPin className="w-2.5 h-2.5 text-[#74C947]" />
                                <span>{room?.name || 'Venue'}</span>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleOpenSlotModal(day.value, period)}
                              className="w-full h-full min-h-[75px] rounded-2xl border border-dashed border-white/10 hover:border-[#74C947]/40 hover:bg-[#74C947]/[0.04] flex flex-col items-center justify-center gap-1 text-white/30 hover:text-[#74C947] text-[10px] font-mono transition cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Assign</span>
                            </button>
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

      {/* Assignment Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-md w-full"
            >
              <GlassCard variant="pro" className="!p-6 space-y-5 bg-[#0e121e]/95 border-white/15">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#74C947]" />
                    <h3 className="font-bold text-white text-sm">
                      Assign Period Slot
                    </h3>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="p-1 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-xs text-[#74C947] font-mono">
                  {DAYS.find((d) => d.value === targetSlot?.day)?.label} &middot; Period {targetSlot?.period}
                </div>

                <form onSubmit={handleSaveSlot} className="space-y-4">
                  {/* Subject */}
                  <div>
                    <label className="block text-xs font-mono uppercase text-white/60 mb-1.5 font-medium">
                      Curricular Subject
                    </label>
                    <select
                      value={modalForm.subject_id}
                      onChange={(e) => setModalForm({ ...modalForm, subject_id: e.target.value })}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-white text-xs focus:outline-none focus:border-[#74C947] shadow-sm font-medium"
                    >
                      {master.subjects.map((s) => (
                        <option key={s.id} value={s.id} className="bg-[#0e121e] text-white">
                          {s.code} — {s.name} ({s.hours_per_week || 4}h/wk) {s.requires_lab ? '[LAB]' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Teacher */}
                  <div>
                    <label className="block text-xs font-mono uppercase text-white/60 mb-1.5 font-medium">
                      Teaching Faculty
                    </label>
                    <select
                      value={modalForm.teacher_id}
                      onChange={(e) => setModalForm({ ...modalForm, teacher_id: e.target.value })}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-white text-xs focus:outline-none focus:border-[#74C947] shadow-sm font-medium"
                    >
                      {master.teachers.map((t) => (
                        <option key={t.id} value={t.id} className="bg-[#0e121e] text-white">
                          {t.name} (Max {t.max_weekly_load || 20}h)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Room */}
                  <div>
                    <label className="block text-xs font-mono uppercase text-white/60 mb-1.5 font-medium">
                      Classroom / Laboratory
                    </label>
                    <select
                      value={modalForm.room_id}
                      onChange={(e) => setModalForm({ ...modalForm, room_id: e.target.value })}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-white text-xs focus:outline-none focus:border-[#74C947] shadow-sm font-medium"
                    >
                      {master.rooms.map((r) => (
                        <option key={r.id} value={r.id} className="bg-[#0e121e] text-white">
                          {r.name} ({r.room_type || 'Classroom'}, Cap: {r.capacity})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                    <ReplyButton
                      type="button"
                      size="sm"
                      onClick={() => setIsModalOpen(false)}
                      className="bg-white/[0.06] hover:bg-white/[0.12]"
                    >
                      Cancel
                    </ReplyButton>
                    <CTAButton type="submit" size="sm">
                      <span>Commit Slot</span>
                    </CTAButton>
                  </div>
                </form>
              </GlassCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
