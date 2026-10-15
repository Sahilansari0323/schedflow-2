import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar,
  Plus,
  Save,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Share2,
  Clock,
  Layers,
  X,
  Sparkles,
  MapPin,
  User,
  Zap,
} from 'lucide-react';
import api, { getErrorMessage } from '../../api';
import GlassCard from '../../components/GlassCard';

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
  const urlTimetableId = searchParams.get('id');

  const [timetables, setTimetables] = useState<any[]>([]);
  const [selectedTimetableId, setSelectedTimetableId] = useState<string | number>('');
  const [activeTimetable, setActiveTimetable] = useState<any | null>(null);

  const [teachers, setTeachers] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [genModalData, setGenModalData] = useState<any | null>(null);

  // Edit Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSlot, setModalSlot] = useState<{ day: number; dayLabel: string; period: number } | null>(null);
  const [editingEntry, setEditingEntry] = useState<any | null>(null);

  const [formSubjectId, setFormSubjectId] = useState('');
  const [formTeacherId, setFormTeacherId] = useState('');
  const [formRoomId, setFormRoomId] = useState('');

  useEffect(() => {
    loadMasterData();
  }, []);

  const loadMasterData = async () => {
    setLoading(true);
    try {
      const [ttRes, tRes, rRes, sRes, dRes, semRes, secRes] = await Promise.all([
        api.get('/timetables'),
        api.get('/teachers'),
        api.get('/rooms'),
        api.get('/subjects'),
        api.get('/departments').catch(() => ({ data: [] })),
        api.get('/semesters').catch(() => ({ data: [] })),
        api.get('/sections').catch(() => ({ data: [] })),
      ]);

      const tts = ttRes.data || [];
      setTimetables(tts);
      setTeachers(tRes.data || []);
      setRooms(rRes.data || []);
      setSubjects(sRes.data || []);
      setDepartments(dRes.data || []);
      setSemesters(semRes.data || []);
      setSections(secRes.data || []);

      if (tts.length > 0) {
        const targetId = urlTimetableId && tts.some((t: any) => String(t.id) === String(urlTimetableId))
          ? urlTimetableId
          : tts[0].id;
        setSelectedTimetableId(targetId);
        fetchTimetableDetails(targetId);
      }
    } catch (err) {
      console.error('Error loading builder master data', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTimetableDetails = async (id: string | number) => {
    try {
      const [metaRes, entriesRes] = await Promise.all([
        api.get(`/timetables/${id}`),
        api.get(`/timetables/${id}/entries`),
      ]);
      setActiveTimetable({
        ...metaRes.data,
        entries: entriesRes.data || [],
      });
    } catch (err) {
      console.error('Failed to load timetable details', err);
    }
  };

  const handleSelectTimetable = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedTimetableId(id);
    if (id) {
      fetchTimetableDetails(id);
    } else {
      setActiveTimetable(null);
    }
  };

  const handlePublishToggle = async () => {
    if (!activeTimetable) return;
    setSaving(true);
    setStatusMessage(null);
    try {
      const res = await api.post(`/timetables/${activeTimetable.id}/publish`);
      setActiveTimetable((prev: any) => ({
        ...prev,
        status: res.data.status,
        version: res.data.version,
        published_at: res.data.published_at,
      }));
      setStatusMessage(`Published timetable #${activeTimetable.id} (v${res.data.version}) to students.`);
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      const msg = getErrorMessage(err, 'Failed to publish timetable.');
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleAIGenerate = async () => {
    if (!activeTimetable) return;
    if (
      !confirm(
        `Run AI CSP Solver on timetable #${activeTimetable.id}?\n\nThis will auto-generate all core lecture allocations adhering to room types, teacher availability, and max weekly workloads.`
      )
    ) {
      return;
    }

    setGenerating(true);
    setStatusMessage(null);
    try {
      const res = await api.post(`/timetables/${activeTimetable.id}/generate`);
      setGenModalData(res.data);
      await fetchTimetableDetails(activeTimetable.id);
      setStatusMessage(`AI Generator drafted ${res.data.placed}/${res.data.total} classes (${res.data.solver})`);
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (err: any) {
      alert(getErrorMessage(err, 'AI Solver generation failed.'));
    } finally {
      setGenerating(false);
    }
  };

  const openSlotEditor = (dayValue: number, dayLabel: string, periodNumber: number, existingEntry: any = null) => {
    setModalSlot({ day: dayValue, dayLabel, period: periodNumber });
    setEditingEntry(existingEntry);

    if (existingEntry) {
      setFormSubjectId(String(existingEntry.subject_id));
      setFormTeacherId(String(existingEntry.teacher_id));
      setFormRoomId(String(existingEntry.room_id));
    } else {
      setFormSubjectId('');
      setFormTeacherId('');
      setFormRoomId('');
    }
    setModalOpen(true);
  };

  const handleSaveSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTimetable || !modalSlot || !formSubjectId || !formTeacherId || !formRoomId) return;

    setSaving(true);
    const payload = {
      day_of_week: Number(modalSlot.day),
      period: Number(modalSlot.period),
      subject_id: Number(formSubjectId),
      teacher_id: Number(formTeacherId),
      room_id: Number(formRoomId),
    };

    try {
      if (editingEntry) {
        await api.put(`/timetables/${activeTimetable.id}/entries/${editingEntry.id}`, payload);
      } else {
        await api.post(`/timetables/${activeTimetable.id}/entries`, payload);
      }
      setModalOpen(false);
      await fetchTimetableDetails(activeTimetable.id);
      setStatusMessage('Slot allocated successfully without constraint collisions.');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      const msg = getErrorMessage(err, 'Constraint collision detected while allocating slot.');
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSlot = async () => {
    if (!activeTimetable || !editingEntry) return;
    if (!confirm('Are you sure you want to de-allocate this lecture slot?')) return;

    setSaving(true);
    try {
      await api.delete(`/timetables/${activeTimetable.id}/entries/${editingEntry.id}`);
      setModalOpen(false);
      await fetchTimetableDetails(activeTimetable.id);
      setStatusMessage('Slot cleared successfully.');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      const msg = getErrorMessage(err, 'Failed to clear slot.');
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  const filteredSubjects = activeTimetable
    ? subjects.filter((s) => s.department_id === activeTimetable.department_id)
    : subjects;
  const filteredTeachers = activeTimetable
    ? teachers.filter((t) => t.department_id === activeTimetable.department_id && t.is_active)
    : teachers;
  const filteredRooms = activeTimetable
    ? rooms.filter((r) => r.department_id === activeTimetable.department_id)
    : rooms;

  const isPublished = activeTimetable?.status === 'published';

  return (
    <div className="space-y-6 select-none pb-12">
      {/* Top Header & Selector */}
      <GlassCard variant="compact" className="!p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-[#00d2ff]/10 border border-[#00d2ff]/30 flex items-center justify-center text-[#00d2ff] shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Matrix Schedule Builder</h2>
            <div className="text-xs text-white/50">Configure week schedule allocations & room bindings</div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedTimetableId}
            onChange={handleSelectTimetable}
            className="h-10 px-4 rounded-xl bg-black/60 border border-white/20 text-white text-xs font-medium focus:outline-none focus:border-[#00d2ff]"
          >
            <option value="">Select Timetable Matrix...</option>
            {timetables.map((t) => {
              const dept = departments.find((d) => d.id === t.department_id);
              const sec = sections.find((s) => s.id === t.section_id);
              const sem = semesters.find((s) => s.id === t.semester_id);
              return (
                <option key={t.id} value={t.id} className="bg-neutral-900">
                  {dept?.code || 'CSE'} — Sem {sem?.number || t.semester_id} (Sec {sec?.name || t.section_id}) • #{t.id} [v{t.version}]
                </option>
              );
            })}
          </select>

          {activeTimetable && (
            <>
              {/* AI Auto-Draft Solver Button */}
              <button
                type="button"
                onClick={handleAIGenerate}
                disabled={generating || saving}
                className="h-10 px-4 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer bg-gradient-to-r from-purple-500/20 to-[#00d2ff]/20 text-[#00d2ff] border border-[#00d2ff]/40 hover:border-[#00d2ff] hover:bg-[#00d2ff]/30 transition-all shadow-[0_0_15px_rgba(0,210,255,0.2)] disabled:opacity-50"
              >
                <Sparkles className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
                <span>{generating ? 'CSP Solving...' : 'AI Auto-Draft'}</span>
              </button>

              {/* Publish Toggle Button */}
              <button
                type="button"
                onClick={handlePublishToggle}
                disabled={saving || generating}
                className={`h-10 px-5 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all ${
                  isPublished
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                    : 'bg-[#00d2ff] text-black hover:bg-[#3D81E3] hover:text-white shadow-[0_0_20px_rgba(0,210,255,0.3)]'
                }`}
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{isPublished ? 'Published (Click to Re-publish)' : 'Publish Matrix'}</span>
              </button>
            </>
          )}
        </div>
      </GlassCard>

      {/* Notification Toast */}
      {statusMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-[#00d2ff]/10 border border-[#00d2ff]/30 text-white text-xs flex items-center gap-2 font-mono"
        >
          <CheckCircle2 className="w-4 h-4 text-[#00d2ff]" />
          <span>{statusMessage}</span>
        </motion.div>
      )}

      {/* Main Grid View */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#00d2ff] border-t-transparent animate-spin" />
          <div className="text-xs text-white/50 font-mono">Loading matrix schedule grid...</div>
        </div>
      ) : activeTimetable ? (
        <GlassCard variant="compact" className="!p-0 overflow-hidden">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.04]">
                <th className="py-3.5 px-4 font-mono text-white/70 uppercase text-xs sticky left-0 bg-neutral-950 z-20 min-w-[120px]">
                  Day
                </th>
                {PERIODS.map((p) => (
                  <th key={p} className="py-3 px-3 font-mono text-white/50 uppercase text-center min-w-[130px]">
                    Period {p}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DAYS.map((day) => {
                const dayEntries =
                  activeTimetable.entries?.filter((e: any) => Number(e.day_of_week) === Number(day.value)) || [];

                return (
                  <tr key={day.value} className="border-b border-white/[0.06] hover:bg-white/[0.02]">
                    <td className="py-4 px-4 font-semibold text-white whitespace-nowrap sticky left-0 bg-neutral-950/90 backdrop-blur-md z-10 border-r border-white/10">
                      {day.label}
                    </td>

                    {PERIODS.map((period) => {
                      const matchingEntries = dayEntries.filter((e: any) => Number(e.period) === Number(period));

                      return (
                        <td key={period} className="p-2 min-w-[130px] align-top">
                          {matchingEntries.length > 0 ? (
                            <div className="space-y-1.5">
                              {matchingEntries.map((entry: any) => {
                                const subj = subjects.find((s) => s.id === entry.subject_id);
                                const teach = teachers.find((t) => t.id === entry.teacher_id);
                                const rm = rooms.find((r) => r.id === entry.room_id);
                                const isElective = subj?.elective_group || entry.elective_group_id;

                                return (
                                  <div
                                    key={entry.id}
                                    onClick={() => openSlotEditor(day.value, day.label, period, entry)}
                                    className="p-2.5 rounded-2xl liquid-glass border border-white/20 bg-black/50 hover:border-[#00d2ff] hover:bg-white/[0.05] transition-all cursor-pointer space-y-1 shadow-[0_4px_16px_rgba(0,0,0,0.5)] group"
                                  >
                                    <div className="font-mono text-[10px] text-[#00d2ff] font-semibold flex items-center justify-between">
                                      <span>{subj?.code || 'COURSE'}</span>
                                      <div className="flex items-center gap-1">
                                        {isElective && (
                                          <span className="text-[8px] px-1 py-0.2 rounded bg-purple-500/20 text-purple-300 font-mono">
                                            ELECTIVE
                                          </span>
                                        )}
                                        {subj?.requires_lab && (
                                          <span className="text-[8px] px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono">
                                            LAB
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="font-medium text-white text-xs truncate" title={subj?.name}>
                                      {subj?.name || 'Subject'}
                                    </div>
                                    <div className="text-[10px] text-white/60 truncate flex items-center gap-1">
                                      <User className="w-3 h-3 text-white/40 shrink-0" />
                                      <span className="truncate">{teach?.name || 'Faculty'}</span>
                                    </div>
                                    <div className="text-[10px] text-cyan-300 font-mono flex items-center gap-1">
                                      <MapPin className="w-2.5 h-2.5 text-cyan-400 shrink-0" />
                                      <span>{rm?.name || 'TBD'}</span>
                                    </div>
                                  </div>
                                );
                              })}

                              {/* If slot contains electives, permit adding co-existing elective option */}
                              {matchingEntries.some((e: any) => e.elective_group_id || subjects.find((s) => s.id === e.subject_id)?.elective_group) && (
                                <button
                                  type="button"
                                  onClick={() => openSlotEditor(day.value, day.label, period)}
                                  className="w-full py-1 rounded-xl border border-dashed border-purple-500/30 text-[9px] text-purple-300 hover:bg-purple-500/10 flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  <Plus className="w-2.5 h-2.5" />
                                  <span>+ Elective Option</span>
                                </button>
                              )}
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openSlotEditor(day.value, day.label, period)}
                              className="w-full h-full min-h-[85px] rounded-2xl border border-dashed border-white/10 hover:border-[#00d2ff]/60 hover:bg-white/[0.03] transition-all flex flex-col items-center justify-center text-white/30 hover:text-white/80 text-[11px] gap-1 cursor-pointer group"
                            >
                              <Plus className="w-3.5 h-3.5 text-white/30 group-hover:text-[#00d2ff] transition-colors" />
                              <span className="text-[10px]">Assign</span>
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
        </GlassCard>
      ) : (
        <GlassCard variant="compact" className="text-center py-20 space-y-3">
          <Calendar className="w-10 h-10 text-white/30 mx-auto" />
          <h3 className="text-lg font-semibold text-white">No Timetable Selected</h3>
          <p className="text-xs text-white/50 max-w-sm mx-auto">
            Select a timetable matrix from the dropdown above or generate a new term schedule to begin allocating slots.
          </p>
        </GlassCard>
      )}

      {/* AI Generator Result Modal */}
      <AnimatePresence>
        {genModalData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md"
            >
              <GlassCard variant="pro" className="!p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#00d2ff]" />
                    <h3 className="font-bold text-white text-base">AI Generation Summary</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setGenModalData(null)}
                    className="p-1 rounded-full text-white/60 hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] border border-white/5 font-mono">
                    <span className="text-white/60">Solver Status:</span>
                    <span className="text-emerald-400 font-bold uppercase">{genModalData.solver}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] border border-white/5 font-mono">
                    <span className="text-white/60">Lectures Placed:</span>
                    <span className="text-[#00d2ff] font-bold">
                      {genModalData.placed} / {genModalData.total}
                    </span>
                  </div>

                  {genModalData.unplaced?.length > 0 && (
                    <div className="space-y-1.5 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300">
                      <div className="font-semibold text-rose-200">Unplaced Subject Hours:</div>
                      <ul className="space-y-1 font-mono text-[11px]">
                        {genModalData.unplaced.map((u: string, idx: number) => (
                          <li key={idx}>• {u}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="pt-2 text-right">
                  <button
                    type="button"
                    onClick={() => setGenModalData(null)}
                    className="px-5 py-2 rounded-xl bg-[#00d2ff] text-black font-semibold text-xs hover:bg-[#3D81E3] hover:text-white transition-all cursor-pointer"
                  >
                    Got It
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Slot Allocation Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md"
            >
              <GlassCard variant="pro" className="!p-8 !min-h-0 space-y-5">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {editingEntry ? 'Edit Lecture Slot' : 'Assign Lecture Slot'}
                    </h3>
                    <div className="text-xs text-white/50">
                      {modalSlot?.dayLabel} · Period {modalSlot?.period}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveSlot} className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono uppercase text-white/60 mb-1.5">
                      Subject / Course
                    </label>
                    <select
                      value={formSubjectId}
                      onChange={(e) => setFormSubjectId(e.target.value)}
                      required
                      className="w-full h-10 px-3 rounded-xl bg-black/70 border border-white/20 text-white text-xs focus:outline-none focus:border-[#00d2ff]"
                    >
                      <option value="">Select Curricular Subject...</option>
                      {filteredSubjects.map((s) => (
                        <option key={s.id} value={s.id} className="bg-neutral-900">
                          {s.code} - {s.name} ({s.hours_per_week} hrs/wk{s.requires_lab ? ' • Lab' : ''}
                          {s.elective_group ? ` • Elective: ${s.elective_group}` : ''})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-white/60 mb-1.5">
                      Instructor / Teacher
                    </label>
                    <select
                      value={formTeacherId}
                      onChange={(e) => setFormTeacherId(e.target.value)}
                      required
                      className="w-full h-10 px-3 rounded-xl bg-black/70 border border-white/20 text-white text-xs focus:outline-none focus:border-[#00d2ff]"
                    >
                      <option value="">Select Instructor...</option>
                      {filteredTeachers.map((t) => (
                        <option key={t.id} value={t.id} className="bg-neutral-900">
                          {t.name} (Max {t.max_weekly_load}h/wk)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-white/60 mb-1.5">
                      Venue / Room
                    </label>
                    <select
                      value={formRoomId}
                      onChange={(e) => setFormRoomId(e.target.value)}
                      required
                      className="w-full h-10 px-3 rounded-xl bg-black/70 border border-white/20 text-white text-xs focus:outline-none focus:border-[#00d2ff]"
                    >
                      <option value="">Select Room / Lab...</option>
                      {filteredRooms.map((r) => (
                        <option key={r.id} value={r.id} className="bg-neutral-900">
                          {r.name} ({r.room_type}, Cap: {r.capacity})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                    {editingEntry ? (
                      <button
                        type="button"
                        onClick={handleDeleteSlot}
                        disabled={saving}
                        className="px-4 py-2 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-medium cursor-pointer transition-colors"
                      >
                        Clear Slot
                      </button>
                    ) : (
                      <div />
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setModalOpen(false)}
                        className="px-4 py-2 rounded-xl text-xs text-white/60 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={saving}
                        className="px-5 py-2 rounded-xl bg-[#00d2ff] text-black font-semibold text-xs hover:bg-[#3D81E3] hover:text-white transition-all shadow-[0_0_20px_rgba(0,210,255,0.3)] cursor-pointer"
                      >
                        {saving ? 'Validating Constraints...' : 'Confirm Allocation'}
                      </button>
                    </div>
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
