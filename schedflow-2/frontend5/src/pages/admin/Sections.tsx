import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Grid,
  Plus,
  Edit2,
  Trash2,
  Search,
  X,
} from 'lucide-react';
import api, { getErrorMessage } from '../../api';
import GlassCard from '../../components/GlassCard';

interface Section {
  id: number;
  name: string;
  strength: number;
  department_id: number;
  semester_id: number;
}

const EMPTY: Partial<Section> = {
  name: '',
  strength: 60,
  department_id: 1,
  semester_id: 1,
};

export default function Sections() {
  const [sections, setSections] = useState<Section[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [filterDept, setFilterDept] = useState('');
  const [editing, setEditing] = useState<'new' | Section | null>(null);
  const [form, setForm] = useState<any>(EMPTY);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => {
    const params = filterDept ? { department_id: filterDept } : {};
    api.get('/sections', { params }).then((r) => setSections(r.data)).catch(() => {});
  };

  useEffect(() => {
    api.get('/departments').then((r) => setDepartments(r.data)).catch(() => {});
    api.get('/semesters').then((r) => setSemesters(r.data)).catch(() => {});
  }, []);

  useEffect(load, [filterDept]);

  const deptSemesters = semesters.filter(
    (s) => String(s.department_id) === String(form.department_id)
  );

  const openNew = () => {
    setForm({
      ...EMPTY,
      department_id: filterDept || departments[0]?.id || 1,
      semester_id: semesters[0]?.id || 1,
    });
    setError('');
    setEditing('new');
  };

  const openEdit = (s: Section) => {
    setForm({ ...s, department_id: String(s.department_id), semester_id: String(s.semester_id) });
    setError('');
    setEditing(s);
  };

  const save = async () => {
    setBusy(true);
    setError('');
    const payload = {
      ...form,
      strength: Number(form.strength),
      department_id: Number(form.department_id),
      semester_id: Number(form.semester_id),
    };
    try {
      if (editing === 'new') await api.post('/sections', payload);
      else if (editing) await api.put(`/sections/${editing.id}`, payload);
      setEditing(null);
      load();
    } catch (err: any) {
      setError(getErrorMessage(err, 'Save failed.'));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (s: Section) => {
    if (!confirm(`Delete section "${s.name}"?`)) return;
    try {
      await api.delete(`/sections/${s.id}`);
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
              <Grid className="w-3 h-3 text-cyan-300" />
              Student Cohorts
            </span>
            <span className="text-xs text-white/40 tracking-wider uppercase font-mono">
              Class Divisions
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
            Sections
          </h1>
          <p className="text-sm text-white/60 mt-1 max-w-2xl">
            Cohort divisions and student strength caps mapped to academic semester schedules.
          </p>
        </div>

        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:brightness-110 transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Section
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
          <div className="col-span-4">Section Identifier</div>
          <div className="col-span-4">Semester & Department</div>
          <div className="col-span-2">Strength</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        <div className="divide-y divide-white/5">
          {sections.map((s) => (
            <div
              key={s.id}
              className="p-4 grid grid-cols-12 items-center hover:bg-white/[0.02] transition"
            >
              <div className="col-span-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center font-bold text-sm text-cyan-300">
                  {s.name}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">Section {s.name}</div>
                  <div className="text-xs text-white/50">Cohort division</div>
                </div>
              </div>

              <div className="col-span-4 text-xs text-white/80">
                <span>
                  {semesters.find((sem) => sem.id === s.semester_id)?.number
                    ? `Sem ${semesters.find((sem) => sem.id === s.semester_id)?.number}`
                    : 'Semester'}
                </span>
                <span className="text-white/40 mx-1.5">•</span>
                <span className="text-white/60">
                  {departments.find((d) => d.id === s.department_id)?.name || 'General'}
                </span>
              </div>

              <div className="col-span-2 text-xs font-mono text-white/90">
                {s.strength} seats
              </div>

              <div className="col-span-2 flex items-center justify-end gap-2">
                <button
                  onClick={() => openEdit(s)}
                  className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition"
                  title="Edit section"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => remove(s)}
                  className="p-2 rounded-lg text-white/40 hover:text-rose-400 hover:bg-rose-500/10 transition"
                  title="Delete section"
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
                  {editing === 'new' ? 'New Section' : `Edit Section ${form.name}`}
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
                  <label className="block text-white/70 mb-1">Section Identifier</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value.toUpperCase() })}
                    placeholder="A"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-white/70 mb-1">Student Strength (Capacity)</label>
                  <input
                    type="number"
                    value={form.strength}
                    onChange={(e) => setForm({ ...form, strength: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
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

                  <div>
                    <label className="block text-white/70 mb-1">Semester</label>
                    <select
                      value={form.semester_id}
                      onChange={(e) => setForm({ ...form, semester_id: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500 [&>option]:bg-slate-900"
                    >
                      {deptSemesters.map((s) => (
                        <option key={s.id} value={s.id}>
                          Sem {s.number} ({s.academic_year})
                        </option>
                      ))}
                    </select>
                  </div>
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
                  disabled={busy || !form.name}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-[0_0_15px_rgba(59,130,246,0.4)] hover:brightness-110 transition disabled:opacity-50"
                >
                  {busy ? 'Saving…' : 'Save Section'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
