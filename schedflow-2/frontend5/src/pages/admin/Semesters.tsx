import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CalendarDays,
  Plus,
  Edit2,
  Trash2,
  Search,
  X,
} from 'lucide-react';
import api, { getErrorMessage } from '../../api';
import GlassCard from '../../components/GlassCard';

interface Semester {
  id: number;
  number: number;
  academic_year: string;
  department_id: number;
}

const EMPTY: Partial<Semester> = {
  number: 1,
  academic_year: '2026-27',
  department_id: 1,
};

export default function Semesters() {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [filterDept, setFilterDept] = useState('');
  const [editing, setEditing] = useState<'new' | Semester | null>(null);
  const [form, setForm] = useState<any>(EMPTY);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => {
    const params = filterDept ? { department_id: filterDept } : {};
    api.get('/semesters', { params }).then((r) => setSemesters(r.data)).catch(() => {});
  };

  useEffect(() => {
    api.get('/departments').then((r) => setDepartments(r.data)).catch(() => {});
  }, []);

  useEffect(load, [filterDept]);

  const openNew = () => {
    setForm({ ...EMPTY, department_id: filterDept || departments[0]?.id || 1 });
    setError('');
    setEditing('new');
  };

  const openEdit = (s: Semester) => {
    setForm({ ...s, department_id: String(s.department_id) });
    setError('');
    setEditing(s);
  };

  const save = async () => {
    setBusy(true);
    setError('');
    const payload = {
      ...form,
      number: Number(form.number),
      department_id: Number(form.department_id),
    };
    try {
      if (editing === 'new') await api.post('/semesters', payload);
      else if (editing) await api.put(`/semesters/${editing.id}`, payload);
      setEditing(null);
      load();
    } catch (err: any) {
      setError(getErrorMessage(err, 'Save failed.'));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (s: Semester) => {
    if (!confirm(`Delete semester ${s.number} (${s.academic_year})?`)) return;
    try {
      await api.delete(`/semesters/${s.id}`);
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
              <CalendarDays className="w-3 h-3 text-cyan-300" />
              Academic Terms
            </span>
            <span className="text-xs text-white/40 tracking-wider uppercase font-mono">
              Curriculum Calendars
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
            Semesters
          </h1>
          <p className="text-sm text-white/60 mt-1 max-w-2xl">
            Configure academic terms, cycle numbers, and department curriculum calendars.
          </p>
        </div>

        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:brightness-110 transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Semester
        </button>
      </div>

      {/* Filter */}
      <div className="flex items-center justify-end">
        <select
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
          className="px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white/80 focus:outline-none focus:border-blue-500 [&>option]:bg-slate-900"
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      {/* Directory Table */}
      <GlassCard className="overflow-hidden">
        <div className="p-4 bg-white/[0.02] grid grid-cols-12 text-xs font-mono uppercase text-white/40 font-semibold border-b border-white/5">
          <div className="col-span-5">Semester Cycle</div>
          <div className="col-span-4">Department</div>
          <div className="col-span-3 text-right">Actions</div>
        </div>

        <div className="divide-y divide-white/5">
          {semesters.map((s) => (
            <div
              key={s.id}
              className="p-4 grid grid-cols-12 items-center hover:bg-white/[0.02] transition"
            >
              <div className="col-span-5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center font-bold text-sm text-cyan-300">
                  {s.number}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">Semester {s.number}</div>
                  <div className="text-xs text-white/50 font-mono">Academic Year {s.academic_year}</div>
                </div>
              </div>

              <div className="col-span-4 text-xs text-white/70">
                {departments.find((d) => d.id === s.department_id)?.name || 'General Dept'}
              </div>

              <div className="col-span-3 flex items-center justify-end gap-2">
                <button
                  onClick={() => openEdit(s)}
                  className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition"
                  title="Edit semester"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => remove(s)}
                  className="p-2 rounded-lg text-white/40 hover:text-rose-400 hover:bg-rose-500/10 transition"
                  title="Delete semester"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Modal */}
      <AnimatePresence>
        {editing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditing(null)}
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md rounded-2xl bg-slate-900/90 border border-white/20 p-6 shadow-2xl backdrop-blur-2xl z-10"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                <h3 className="text-base font-semibold text-white">
                  {editing === 'new' ? 'New Semester' : `Edit Semester ${form.number}`}
                </h3>
                <button onClick={() => setEditing(null)} className="text-white/40 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {error && (
                <div className="p-3 mb-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
                  {error}
                </div>
              )}

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-white/70 mb-1">Semester Number</label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={form.number}
                    onChange={(e) => setForm({ ...form, number: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-white/70 mb-1">Academic Year</label>
                  <input
                    type="text"
                    value={form.academic_year}
                    onChange={(e) => setForm({ ...form, academic_year: e.target.value })}
                    placeholder="2026-27"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-white/70 mb-1">Department</label>
                  <select
                    value={form.department_id}
                    onChange={(e) => setForm({ ...form, department_id: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500 [&>option]:bg-slate-900"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-white/60 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={save}
                  disabled={busy || !form.number || !form.academic_year}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-[0_0_15px_rgba(59,130,246,0.4)] hover:brightness-110 transition disabled:opacity-50"
                >
                  {busy ? 'Saving…' : 'Save Semester'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
