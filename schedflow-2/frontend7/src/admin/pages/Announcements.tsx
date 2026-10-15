import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Megaphone,
  Plus,
  Pin,
  Trash2,
  Edit2,
  Calendar,
  X,
  Send,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import api, { getErrorMessage } from '../../shared/api';
import GlassCard from '../../shared/components/GlassCard';
import { ReplyButton, CTAButton } from '../../shared/components/AppleButton';

interface Announcement {
  id: number;
  title: string;
  body: string;
  department_id: number | null;
  pinned: boolean;
  active: boolean;
  created_at: string;
}

export default function Announcements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterDept, setFilterDept] = useState('');
  const [editing, setEditing] = useState<'new' | Announcement | null>(null);
  const [form, setForm] = useState({
    title: '',
    body: '',
    department_id: '',
    pinned: false,
    active: true,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = (isBackground = false) => {
    if (!isBackground) setLoading(true);
    const params = filterDept ? { department_id: filterDept } : {};
    api
      .get('/announcements', { params })
      .then((r) => setAnnouncements(r.data))
      .catch((err) => {
        if (!isBackground) setError(getErrorMessage(err, 'Failed to load notices.'));
      })
      .finally(() => {
        if (!isBackground) setLoading(false);
      });
  };

  useEffect(() => {
    api.get('/departments').then((r) => setDepartments(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(() => load(true), 15000);
    return () => clearInterval(interval);
  }, [filterDept]);

  const openNew = () => {
    setForm({
      title: '',
      body: '',
      department_id: filterDept || '',
      pinned: false,
      active: true,
    });
    setError('');
    setEditing('new');
  };

  const openEdit = (a: Announcement) => {
    setForm({
      title: a.title,
      body: a.body,
      department_id: a.department_id ? String(a.department_id) : '',
      pinned: a.pinned,
      active: a.active,
    });
    setError('');
    setEditing(a);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) return;
    setBusy(true);
    setError('');
    const payload = {
      title: form.title.trim(),
      body: form.body.trim(),
      department_id: form.department_id ? Number(form.department_id) : null,
      pinned: form.pinned,
      active: form.active,
    };
    try {
      if (editing === 'new') {
        await api.post('/announcements', payload);
      } else if (editing) {
        await api.put(`/announcements/${editing.id}`, payload);
      }
      setEditing(null);
      load();
    } catch (err: any) {
      setError(getErrorMessage(err, 'Failed to save announcement.'));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: number) => {
    if (!confirm('Are you sure you want to delete this campus notice?')) return;
    try {
      await api.delete(`/announcements/${id}`);
      load();
    } catch (err: any) {
      alert(getErrorMessage(err, 'Failed to delete announcement.'));
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#74C947]/10 text-[#74C947] border border-[#74C947]/30 font-mono">
              <Megaphone className="w-3.5 h-3.5" />
              CAMPUS NOTICES
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Academic Announcements
          </h1>
          <p className="text-xs sm:text-sm text-white/60 mt-1 max-w-2xl leading-relaxed">
            Broadcast timetable revisions, exam venue relocations, and faculty substitutions university-wide or to targeted departments.
          </p>
        </div>

        <CTAButton size="md" onClick={openNew}>
          <Plus className="w-4 h-4" />
          <span>New Notice</span>
        </CTAButton>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between gap-4">
        <select
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
          className="px-4 py-2.5 rounded-2xl bg-white/[0.05] border border-white/10 text-xs text-white focus:outline-none focus:border-[#74C947]"
        >
          <option value="" className="bg-[#0e121e] text-white">All Departments & Global</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id} className="bg-[#0e121e] text-white">
              {d.name} ({d.code})
            </option>
          ))}
        </select>
        <span className="text-xs font-mono text-white/40">
          {announcements.length} Notices Published
        </span>
      </div>

      {/* Announcements List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {announcements.map((a) => (
          <GlassCard key={a.id} variant="pro" className="!p-5 space-y-3 relative overflow-hidden" hoverEffect>
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {a.pinned && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                      <Pin className="w-2.5 h-2.5 rotate-45" />
                      PINNED
                    </span>
                  )}
                  <span className="text-[11px] font-mono text-[#74C947] font-semibold">
                    {a.department_id
                      ? departments.find((d) => d.id === a.department_id)?.name || 'Department'
                      : 'Global Campus Notice'}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white">{a.title}</h3>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => openEdit(a)}
                  className="p-1.5 rounded-xl hover:bg-white/10 text-white/50 hover:text-white transition-colors cursor-pointer"
                  title="Edit notice"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => remove(a.id)}
                  className="p-1.5 rounded-xl hover:bg-rose-500/15 text-white/50 hover:text-rose-400 transition-colors cursor-pointer"
                  title="Delete notice"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <p className="text-xs text-white/70 leading-relaxed whitespace-pre-wrap">{a.body}</p>

            <div className="flex items-center justify-between text-[10px] font-mono text-white/40 pt-2 border-t border-white/10">
              <span>{new Date(a.created_at).toLocaleDateString()}</span>
              <span>{a.active ? 'Status: Active Broadcast' : 'Archived'}</span>
            </div>
          </GlassCard>
        ))}

        {announcements.length === 0 && !loading && (
          <div className="col-span-full py-16 text-center">
            <Megaphone className="w-10 h-10 text-white/20 mx-auto mb-3" />
            <h4 className="text-base font-semibold text-white">No Active Notices</h4>
            <p className="text-xs text-white/40 mt-1">
              Publish a campus announcement to display across student viewports.
            </p>
          </div>
        )}
      </div>

      {/* Edit / Create Modal */}
      <AnimatePresence>
        {editing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-lg w-full"
            >
              <GlassCard variant="pro" className="!p-6 space-y-4 bg-[#0e121e]/95 border-white/15">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <h3 className="font-bold text-white text-base">
                    {editing === 'new' ? 'Create Campus Notice' : 'Edit Notice'}
                  </h3>
                  <button
                    onClick={() => setEditing(null)}
                    className="p-1 rounded-xl text-white/40 hover:text-white transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
                    {error}
                  </div>
                )}

                <form onSubmit={save} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-white/70 mb-1 font-medium">Notice Title</label>
                    <input
                      type="text"
                      required
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder="e.g. Schedule Revision for Mid-Term Exams"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-white text-xs focus:outline-none focus:border-[#74C947]"
                    />
                  </div>

                  <div>
                    <label className="block text-white/70 mb-1 font-medium">Department (Optional)</label>
                    <select
                      value={form.department_id}
                      onChange={(e) => setForm({ ...form, department_id: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-white text-xs focus:outline-none focus:border-[#74C947]"
                    >
                      <option value="" className="bg-[#0e121e] text-white">Global University Notice (All)</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id} className="bg-[#0e121e] text-white">
                          {d.name} ({d.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-white/70 mb-1 font-medium">Notice Content</label>
                    <textarea
                      required
                      rows={5}
                      value={form.body}
                      onChange={(e) => setForm({ ...form, body: e.target.value })}
                      placeholder="Specify important dates, affected cohort sections, and rescheduled periods..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-white text-xs focus:outline-none focus:border-[#74C947] resize-none"
                    />
                  </div>

                  <div className="flex items-center gap-6 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.pinned}
                        onChange={(e) => setForm({ ...form, pinned: e.target.checked })}
                        className="rounded border-white/20 text-[#74C947] accent-[#74C947]"
                      />
                      <span className="text-white/80">Pin to top of public portal</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.active}
                        onChange={(e) => setForm({ ...form, active: e.target.checked })}
                        className="rounded border-white/20 text-[#74C947] accent-[#74C947]"
                      />
                      <span className="text-white/80">Active Broadcast</span>
                    </label>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                    <ReplyButton type="button" size="sm" onClick={() => setEditing(null)} className="bg-white/[0.06]">
                      Cancel
                    </ReplyButton>
                    <CTAButton type="submit" size="sm" disabled={busy}>
                      <span>{busy ? 'Publishing…' : 'Publish Broadcast'}</span>
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
