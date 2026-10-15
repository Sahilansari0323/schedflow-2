import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar,
  Plus,
  ArrowRight,
  Trash2,
  CheckCircle2,
  FileText,
  Clock,
  ExternalLink,
  X,
} from 'lucide-react';
import api, { getErrorMessage } from '../../api';
import GlassCard from '../../components/GlassCard';

interface TimetableItem {
  id: number;
  department_id: number;
  semester_id: number;
  section_id: number;
  academic_year: string;
  version: number;
  status: 'draft' | 'published';
  published_at?: string;
  department?: { id: number; name: string; code: string };
  semester?: { id: number; number: number };
  section?: { id: number; name: string };
}

const EMPTY = { department_id: '', semester_id: '', section_id: '', notes: '' };

export default function Timetables() {
  const navigate = useNavigate();
  const [timetables, setTimetables] = useState<TimetableItem[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => {
    api.get('/timetables').then((r) => setTimetables(r.data)).catch(() => {});
  };

  useEffect(() => {
    api.get('/departments').then((r) => setDepartments(r.data)).catch(() => {});
    api.get('/semesters').then((r) => setSemesters(r.data)).catch(() => {});
    api.get('/sections').then((r) => setSections(r.data)).catch(() => {});
    load();
  }, []);

  const formSemesters = semesters.filter(
    (s) => String(s.department_id) === String(form.department_id)
  );
  const formSections = sections.filter(
    (s) => String(s.semester_id) === String(form.semester_id)
  );

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await api.post('/timetables', {
        ...form,
        department_id: Number(form.department_id),
        semester_id: Number(form.semester_id),
        section_id: Number(form.section_id),
      });
      setCreating(false);
      load();
      navigate(`/admin/builder?id=${res.data.id}`);
    } catch (err: any) {
      setError(getErrorMessage(err, 'Could not instantiate timetable schema.'));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (tt: TimetableItem) => {
    if (!confirm(`Delete timetable #${tt.id} and all slot allocations?`)) return;
    try {
      await api.delete(`/timetables/${tt.id}`);
      load();
    } catch (err: any) {
      alert(getErrorMessage(err, 'Delete failed.'));
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Calendar className="w-3 h-3 text-cyan-300" />
              Scheduling Hub
            </span>
            <span className="text-xs text-white/40 tracking-wider uppercase font-mono">
              Matrix Releases
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
            Timetables
          </h1>
          <p className="text-sm text-white/60 mt-1 max-w-2xl">
            Manage section schedules, draft revisions, and public timetable publications. Click any
            timetable to launch the interactive weekly matrix builder.
          </p>
        </div>

        <button
          onClick={() => {
            setForm({
              department_id: departments[0]?.id || '',
              semester_id: semesters[0]?.id || '',
              section_id: sections[0]?.id || '',
              notes: '',
            });
            setError('');
            setCreating(true);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:brightness-110 transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          Create Timetable
        </button>
      </div>

      {/* Timetables Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {timetables.map((tt) => {
          const isPublished = tt.status === 'published';

          return (
            <GlassCard key={tt.id} className="p-6 flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-xs text-white/40 px-2 py-0.5 rounded bg-white/5 border border-white/10">
                    ID #{tt.id} • v{tt.version}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                      isPublished
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                    }`}
                  >
                    {tt.status}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-white group-hover:text-cyan-300 transition-colors">
                  {tt.department?.code || 'CSE'} — Sem {tt.semester?.number || '5'}{' '}
                  (Sec {tt.section?.name || 'A'})
                </h3>

                <p className="text-xs text-white/50 mt-1">
                  {tt.department?.name || 'Computer Science & Engineering'}
                </p>

                <div className="mt-4 pt-3 border-t border-white/5 space-y-1.5 text-xs text-white/60">
                  <div className="flex items-center justify-between">
                    <span className="text-white/40">Academic Cycle</span>
                    <span className="font-mono text-white/80">{tt.academic_year || '2026-27'}</span>
                  </div>
                  {tt.published_at && (
                    <div className="flex items-center justify-between">
                      <span className="text-white/40">Published On</span>
                      <span className="font-mono text-white/80">
                        {new Date(tt.published_at).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between gap-3">
                <Link
                  to={`/admin/builder?id=${tt.id}`}
                  className="flex-1 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition"
                >
                  <span>Open Matrix Builder</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <button
                  onClick={() => remove(tt)}
                  className="p-2 rounded-xl text-white/40 hover:text-rose-400 hover:bg-rose-500/10 border border-white/5 transition"
                  title="Delete timetable"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {creating && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCreating(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md rounded-2xl bg-slate-900/90 border border-white/20 p-6 shadow-2xl backdrop-blur-2xl z-10"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                <h3 className="text-base font-semibold text-white">Create New Timetable</h3>
                <button onClick={() => setCreating(false)} className="text-white/40 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {error && (
                <div className="p-3 mb-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
                  {error}
                </div>
              )}

              <form onSubmit={create} className="space-y-4 text-xs">
                <div>
                  <label className="block text-white/70 mb-1">Department</label>
                  <select
                    value={form.department_id}
                    onChange={(e) => setForm({ ...form, department_id: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500 [&>option]:bg-slate-900"
                  >
                    <option value="">Select department…</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-white/70 mb-1">Semester Cycle</label>
                  <select
                    value={form.semester_id}
                    onChange={(e) => setForm({ ...form, semester_id: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500 [&>option]:bg-slate-900"
                  >
                    <option value="">Select semester…</option>
                    {formSemesters.map((s) => (
                      <option key={s.id} value={s.id}>
                        Semester {s.number} ({s.academic_year})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-white/70 mb-1">Cohort Section</label>
                  <select
                    value={form.section_id}
                    onChange={(e) => setForm({ ...form, section_id: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500 [&>option]:bg-slate-900"
                  >
                    <option value="">Select section…</option>
                    {formSections.map((sec) => (
                      <option key={sec.id} value={sec.id}>
                        Section {sec.name} ({sec.strength} seats)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-white/70 mb-1">Release Memo / Notes (Optional)</label>
                  <input
                    type="text"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="e.g. Regular Autumn 2026 Batch"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setCreating(false)}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-white/60 hover:text-white transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={busy || !form.department_id || !form.semester_id || !form.section_id}
                    className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-[0_0_15px_rgba(59,130,246,0.4)] hover:brightness-110 transition disabled:opacity-50"
                  >
                    {busy ? 'Instantiating…' : 'Create & Open Matrix'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
