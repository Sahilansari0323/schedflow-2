import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MapPin,
  Plus,
  Edit2,
  Trash2,
  Search,
  X,
  Tv,
} from 'lucide-react';
import api, { getErrorMessage } from '../../api';
import GlassCard from '../../components/GlassCard';

interface Room {
  id: number;
  name: string;
  room_type: 'classroom' | 'lab' | 'lecture_hall';
  capacity: number;
  department_id: number;
  has_projector?: boolean;
}

const EMPTY: Partial<Room> = {
  name: '',
  room_type: 'classroom',
  capacity: 60,
  department_id: 1,
  has_projector: false,
};

export default function Rooms() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [filterDept, setFilterDept] = useState('');
  const [editing, setEditing] = useState<'new' | Room | null>(null);
  const [form, setForm] = useState<any>(EMPTY);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => {
    const params = filterDept ? { department_id: filterDept } : {};
    api.get('/rooms', { params }).then((r) => setRooms(r.data)).catch(() => {});
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

  const openEdit = (r: Room) => {
    setForm({ ...r, department_id: String(r.department_id) });
    setError('');
    setEditing(r);
  };

  const save = async () => {
    setBusy(true);
    setError('');
    const payload = {
      ...form,
      capacity: Number(form.capacity),
      department_id: Number(form.department_id),
      has_projector: Boolean(form.has_projector),
    };
    try {
      if (editing === 'new') await api.post('/rooms', payload);
      else if (editing) await api.put(`/rooms/${editing.id}`, payload);
      setEditing(null);
      load();
    } catch (err: any) {
      setError(getErrorMessage(err, 'Save failed.'));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (r: Room) => {
    if (!confirm(`Delete room "${r.name}"?`)) return;
    try {
      await api.delete(`/rooms/${r.id}`);
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
              <MapPin className="w-3 h-3 text-cyan-300" />
              Physical Infrastructure
            </span>
            <span className="text-xs text-white/40 tracking-wider uppercase font-mono">
              Venues & Labs
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
            Rooms & Labs
          </h1>
          <p className="text-sm text-white/60 mt-1 max-w-2xl">
            Lecture halls, laboratory venues, and seminar rooms configured with seating bounds and
            hardware provisions.
          </p>
        </div>

        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:brightness-110 transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Room
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
          <div className="col-span-4">Venue Identifier</div>
          <div className="col-span-3">Room Type</div>
          <div className="col-span-3">Seating Capacity</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        <div className="divide-y divide-white/5">
          {rooms.map((r) => (
            <div
              key={r.id}
              className="p-4 grid grid-cols-12 items-center hover:bg-white/[0.02] transition"
            >
              <div className="col-span-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-300">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{r.name}</div>
                  <div className="text-xs text-white/50">
                    {departments.find((d) => d.id === r.department_id)?.name || 'General Hall'}
                  </div>
                </div>
              </div>

              <div className="col-span-3 flex items-center flex-wrap gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-white/80 font-mono uppercase tracking-wider text-[10px]">
                  {r.room_type}
                </span>
                {r.has_projector && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    <Tv className="w-2.5 h-2.5" />
                    Projector
                  </span>
                )}
              </div>

              <div className="col-span-3 text-xs font-mono text-white/80">
                {r.capacity} seats
              </div>

              <div className="col-span-2 flex items-center justify-end gap-2">
                <button
                  onClick={() => openEdit(r)}
                  className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition"
                  title="Edit venue"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => remove(r)}
                  className="p-2 rounded-lg text-white/40 hover:text-rose-400 hover:bg-rose-500/10 transition"
                  title="Delete venue"
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
                  {editing === 'new' ? 'New Venue' : `Edit Room ${form.name}`}
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
                  <label className="block text-white/70 mb-1">Room Name / Venue Code</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="LH-301"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-white/70 mb-1">Room Type</label>
                    <select
                      value={form.room_type}
                      onChange={(e) => setForm({ ...form, room_type: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500 [&>option]:bg-slate-900"
                    >
                      <option value="classroom">Classroom</option>
                      <option value="lab">Computer / Hardware Lab</option>
                      <option value="lecture_hall">Auditorium / Lecture Hall</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-white/70 mb-1">Seating Capacity</label>
                    <input
                      type="number"
                      value={form.capacity}
                      onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
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

                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={!!form.has_projector}
                      onChange={(e) => setForm({ ...form, has_projector: e.target.checked })}
                      className="rounded bg-white/10 border-white/20 text-blue-500 focus:ring-0"
                    />
                    <span className="text-white/80">Has Projector / AV Display Hardware</span>
                  </label>
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
                  {busy ? 'Saving…' : 'Save Room'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
