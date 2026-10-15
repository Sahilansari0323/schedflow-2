import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Megaphone,
  Plus,
  Pin,
  Trash2,
  Archive,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  Building,
  Eye,
  Calendar,
} from 'lucide-react';
import api, { getErrorMessage } from '../../api';
import GlassCard from '../../components/GlassCard';

interface Announcement {
  id: number;
  title: string;
  body: string;
  department_id: number | null;
  pinned: boolean;
  active: boolean;
  created_by: string;
  created_at: string;
}

export default function Announcements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [departmentId, setDepartmentId] = useState<string>('');
  const [pinned, setPinned] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [annRes, deptRes] = await Promise.all([
        api.get('/announcements'),
        api.get('/departments').catch(() => ({ data: [] })),
      ]);
      setAnnouncements(annRes.data || []);
      setDepartments(deptRes.data || []);
    } catch (err: any) {
      setError(getErrorMessage(err, 'Failed to fetch announcements.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    setError('');
    try {
      await api.post('/announcements', {
        title: title.trim(),
        body: body.trim(),
        department_id: departmentId ? Number(departmentId) : null,
        pinned,
      });
      setModalOpen(false);
      setTitle('');
      setBody('');
      setDepartmentId('');
      setPinned(false);
      loadData();
    } catch (err: any) {
      setError(getErrorMessage(err, 'Failed to create announcement.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (a: Announcement) => {
    try {
      await api.put(`/announcements/${a.id}/status?active=${!a.active}`);
      loadData();
    } catch (err: any) {
      alert(getErrorMessage(err, 'Failed to update announcement status.'));
    }
  };

  const handleDelete = async (a: Announcement) => {
    if (!confirm(`Delete announcement "${a.title}" permanently?`)) return;
    try {
      await api.delete(`/announcements/${a.id}`);
      loadData();
    } catch (err: any) {
      alert(getErrorMessage(err, 'Failed to delete announcement.'));
    }
  };

  return (
    <div className="space-y-8 select-none pb-12">
      {/* Header */}
      <GlassCard variant="compact" className="!p-8 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#00d2ff]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>CAMPUS COMMUNICATIONS</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Broadcast Announcements</h1>
            <p className="text-xs text-white/60">
              Publish global or department-specific notices displayed on student and faculty portals.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setModalOpen(true);
              setError('');
            }}
            className="px-5 py-3 rounded-full bg-[#00d2ff] text-black font-semibold text-xs hover:bg-[#3D81E3] hover:text-white transition-all shadow-[0_0_24px_rgba(0,210,255,0.35)] flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Publish Notice</span>
          </button>
        </div>
      </GlassCard>

      {error && (
        <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Announcements List */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#00d2ff] border-t-transparent animate-spin" />
          <div className="text-xs text-white/50 font-mono">Loading announcements...</div>
        </div>
      ) : announcements.length === 0 ? (
        <GlassCard variant="compact" className="text-center py-20 space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#00d2ff]/10 border border-[#00d2ff]/30 flex items-center justify-center text-[#00d2ff] mx-auto">
            <Megaphone className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-semibold text-white">No Announcements Published</h3>
          <p className="text-white/50 text-xs max-w-md mx-auto">
            Broadcast timetabling changes, exam suspensions, or institutional updates directly to students and staff.
          </p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {announcements.map((a) => {
            const dept = departments.find((d) => d.id === a.department_id);
            return (
              <GlassCard
                key={a.id}
                variant="compact"
                className={`!p-6 space-y-3 relative overflow-hidden transition-all duration-300 ${
                  a.pinned ? 'border-[#00d2ff]/50 shadow-[0_0_25px_rgba(0,210,255,0.15)]' : ''
                } ${!a.active ? 'opacity-50' : ''}`}
              >
                {a.pinned && (
                  <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
                    <div className="bg-[#00d2ff] text-black text-[9px] font-bold py-0.5 text-center transform rotate-45 translate-x-4 translate-y-2 w-20 shadow-md">
                      PINNED
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                      a.active
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-white/5 text-white/40 border-white/10'
                    }`}
                  >
                    {a.active ? 'ACTIVE' : 'ARCHIVED'}
                  </span>
                  <span className="text-[10px] text-white/50 flex items-center gap-1">
                    <Building className="w-3 h-3 text-[#00d2ff]" />
                    <span>{dept ? dept.name : 'All Departments (Global)'}</span>
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-semibold text-white tracking-tight">{a.title}</h3>
                  {a.body && <p className="text-xs text-white/70 mt-1 leading-relaxed whitespace-pre-wrap">{a.body}</p>}
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-white/40 font-mono">
                    By {a.created_by || 'Admin'} • {new Date(a.created_at).toLocaleDateString()}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(a)}
                      className="p-1.5 rounded-lg border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                      title={a.active ? 'Archive notice' : 'Activate notice'}
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(a)}
                      className="p-1.5 rounded-lg border border-white/10 text-white/60 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg rounded-3xl liquid-glass border border-white/20 bg-black/90 p-6 space-y-5 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#00d2ff]/10 border border-[#00d2ff]/30 flex items-center justify-center text-[#00d2ff]">
                    <Megaphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">New Announcement</h3>
                    <div className="text-[11px] text-white/50">Notify students and staff immediately</div>
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

              <form onSubmit={handleCreate} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="text-white/70 font-medium">Notice Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Schedule Revision: Midterm Week"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/15 text-white focus:outline-none focus:border-[#00d2ff]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-white/70 font-medium">Notice Body / Message</label>
                  <textarea
                    rows={4}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Provide details regarding affected branches, class reschedulings, or dates..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/15 text-white focus:outline-none focus:border-[#00d2ff] resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-white/70 font-medium">Target Audience / Department</label>
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/15 text-white focus:outline-none focus:border-[#00d2ff]"
                  >
                    <option value="">All Departments (Campus-Wide Public)</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id} className="bg-neutral-900">
                        {d.code} — {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="pinned-checkbox"
                    checked={pinned}
                    onChange={(e) => setPinned(e.target.checked)}
                    className="w-4 h-4 rounded accent-[#00d2ff] cursor-pointer"
                  />
                  <label htmlFor="pinned-checkbox" className="text-white/80 cursor-pointer flex items-center gap-1.5">
                    <Pin className="w-3 h-3 text-[#00d2ff]" />
                    <span>Pin notice to the top of boards</span>
                  </label>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !title.trim()}
                    className="px-5 py-2.5 rounded-xl bg-[#00d2ff] text-black font-semibold hover:bg-[#3D81E3] hover:text-white disabled:opacity-40 transition-all cursor-pointer shadow-[0_0_20px_rgba(0,210,255,0.3)]"
                  >
                    {submitting ? 'Publishing...' : 'Broadcast Now'}
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
