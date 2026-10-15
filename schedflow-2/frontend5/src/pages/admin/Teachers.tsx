import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Search,
  Filter,
  X,
  Clock,
  Sparkles,
  Check,
} from 'lucide-react';
import api, { getErrorMessage } from '../../api';
import GlassCard from '../../components/GlassCard';

interface Teacher {
  id: number;
  name: string;
  email: string;
  employee_code: string;
  designation: string;
  department_id: number;
  max_weekly_load: number;
  unavailable_slots: string[];
  is_active: boolean;
}

const EMPTY: Partial<Teacher> = {
  name: '',
  email: '',
  employee_code: '',
  designation: 'Assistant Professor',
  department_id: 1,
  max_weekly_load: 20,
  unavailable_slots: [],
  is_active: true,
};

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7];

export default function Teachers() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [workload, setWorkload] = useState<Record<number, any>>({});
  const [departments, setDepartments] = useState<any[]>([]);
  const [filterDept, setFilterDept] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [editing, setEditing] = useState<'new' | Teacher | null>(null);
  const [form, setForm] = useState<any>(EMPTY);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => {
    const params = filterDept ? { department_id: filterDept } : {};
    api.get('/teachers', { params }).then((r) => setTeachers(r.data)).catch(() => {});
    api
      .get('/teachers-workload', { params })
      .then((r) => {
        const map: Record<number, any> = {};
        r.data.forEach((w: any) => {
          map[w.id] = w;
        });
        setWorkload(map);
      })
      .catch(() => {});
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

  const openEdit = (t: Teacher) => {
    setForm({ ...t });
    setError('');
    setEditing(t);
  };

  const toggleSlot = (day: number, period: number) => {
    const code = `${day}-${period}`;
    const cur = form.unavailable_slots || [];
    const next = cur.includes(code) ? cur.filter((s: string) => s !== code) : [...cur, code];
    setForm({ ...form, unavailable_slots: next });
  };

  const save = async () => {
    setBusy(true);
    setError('');
    const payload = {
      ...form,
      department_id: Number(form.department_id),
      max_weekly_load: Number(form.max_weekly_load),
    };
    try {
      if (editing === 'new') await api.post('/teachers', payload);
      else if (editing) await api.put(`/teachers/${editing.id}`, payload);
      setEditing(null);
      load();
    } catch (err: any) {
      setError(getErrorMessage(err, 'Could not save faculty profile.'));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (t: Teacher) => {
    if (!confirm(`Delete faculty member "${t.name}"?`)) return;
    try {
      await api.delete(`/teachers/${t.id}`);
      load();
    } catch (err: any) {
      alert(getErrorMessage(err, 'Delete failed.'));
    }
  };

  const filteredTeachers = teachers.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.employee_code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Users className="w-3 h-3 text-cyan-300" />
              Faculty Management
            </span>
            <span className="text-xs text-white/40 tracking-wider uppercase font-mono">
              Academic Roster
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
            Teachers
          </h1>
          <p className="text-sm text-white/60 mt-1 max-w-2xl">
            Configure faculty profiles, maximum weekly load ceilings, and slot unavailability
            constraints for automated collision avoidance.
          </p>
        </div>

        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:brightness-110 transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Teacher
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search teacher by name or code…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-white/40 focus:outline-none focus:border-blue-500 w-56 sm:w-72"
          />
        </div>

        <div className="flex items-center gap-3">
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
      </div>

      {/* Teachers Directory Table */}
      <GlassCard className="overflow-hidden">
        <div className="p-4 bg-white/[0.02] grid grid-cols-12 text-xs font-mono uppercase text-white/40 font-semibold border-b border-white/5">
          <div className="col-span-4">Faculty Member</div>
          <div className="col-span-3">Department & Designation</div>
          <div className="col-span-3">Weekly Load Cap</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        <div className="divide-y divide-white/5">
          {filteredTeachers.map((t) => {
            const wl = workload[t.id];
            const currentLoad = wl?.current_load ?? 0;
            const maxLoad = t.max_weekly_load || 20;
            const loadRatio = Math.min(100, Math.round((currentLoad / maxLoad) * 100));

            return (
              <div
                key={t.id}
                className="p-4 grid grid-cols-12 items-center hover:bg-white/[0.02] transition"
              >
                <div className="col-span-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-xs font-bold text-blue-300 uppercase">
                    {t.name.slice(0, 2)}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{t.name}</div>
                    <div className="text-xs text-white/50">{t.email || 'No email registered'}</div>
                  </div>
                </div>

                <div className="col-span-3">
                  <div className="text-xs font-medium text-white/90">
                    {departments.find((d) => d.id === t.department_id)?.name || 'General'}
                  </div>
                  <div className="text-[11px] text-white/40 font-mono">
                    {t.employee_code || 'EMP-UNSET'} • {t.designation || 'Lecturer'}
                  </div>
                </div>

                <div className="col-span-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-white/70">
                      {currentLoad} / {maxLoad} hrs
                    </span>
                    <span
                      className={`font-mono text-[11px] ${
                        loadRatio > 90
                          ? 'text-rose-400'
                          : loadRatio > 70
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {loadRatio}%
                    </span>
                  </div>
                  <div className="w-36 h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        loadRatio > 90
                          ? 'bg-rose-500'
                          : loadRatio > 70
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${loadRatio}%` }}
                    />
                  </div>
                </div>

                <div className="col-span-2 flex items-center justify-end gap-2">
                  <button
                    onClick={() => openEdit(t)}
                    className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition"
                    title="Edit profile"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => remove(t)}
                    className="p-2 rounded-lg text-white/40 hover:text-rose-400 hover:bg-rose-500/10 transition"
                    title="Delete teacher"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
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
              className="relative w-full max-w-lg rounded-2xl bg-slate-900/90 border border-white/20 p-6 shadow-2xl backdrop-blur-2xl z-10 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                <h3 className="text-base font-semibold text-white">
                  {editing === 'new' ? 'Add Teacher' : `Edit Teacher — ${form.name}`}
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
                  <label className="block text-white/70 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={form.name || ''}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500"
                    placeholder="Dr. Alan Turing"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-white/70 mb-1">Email</label>
                    <input
                      type="email"
                      value={form.email || ''}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500"
                      placeholder="turing@schedflow.edu"
                    />
                  </div>
                  <div>
                    <label className="block text-white/70 mb-1">Employee Code</label>
                    <input
                      type="text"
                      value={form.employee_code || ''}
                      onChange={(e) => setForm({ ...form, employee_code: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500"
                      placeholder="CS-101"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-white/70 mb-1">Department</label>
                    <select
                      value={form.department_id || ''}
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
                    <label className="block text-white/70 mb-1">Designation</label>
                    <input
                      type="text"
                      value={form.designation || ''}
                      onChange={(e) => setForm({ ...form, designation: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500"
                      placeholder="Professor"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white/70 mb-1">Max Weekly Hours</label>
                  <input
                    type="number"
                    value={form.max_weekly_load || 20}
                    onChange={(e) => setForm({ ...form, max_weekly_load: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Unavailable slots grid */}
                <div>
                  <label className="block text-white/70 mb-1.5">
                    Unavailable Slots Matrix (Click to mark unavailable)
                  </label>
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10 overflow-x-auto">
                    <div className="grid grid-cols-8 gap-1 text-[10px] text-center font-mono">
                      <div className="text-white/40">Slot</div>
                      {PERIODS.map((p) => (
                        <div key={p} className="text-white/60">
                          P{p}
                        </div>
                      ))}
                      {DAYS.map((d, dIdx) => (
                        <>
                          <div key={d} className="font-semibold text-white/80 py-1">
                            {d}
                          </div>
                          {PERIODS.map((p) => {
                            const code = `${dIdx + 1}-${p}`;
                            const blocked = (form.unavailable_slots || []).includes(code);
                            return (
                              <button
                                type="button"
                                key={code}
                                onClick={() => toggleSlot(dIdx + 1, p)}
                                className={`h-6 rounded transition ${
                                  blocked
                                    ? 'bg-rose-500/40 text-rose-200 border border-rose-500/50'
                                    : 'bg-white/5 hover:bg-white/15 text-white/40'
                                }`}
                              >
                                {blocked ? '✕' : ''}
                              </button>
                            );
                          })}
                        </>
                      ))}
                    </div>
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
                  {busy ? 'Saving…' : 'Save Teacher'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
