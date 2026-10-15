import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MessageSquareWarning,
  CheckCircle2,
  XCircle,
  Filter,
  Check,
  X,
  AlertTriangle,
  User,
  Clock,
  Sparkles,
  Building,
  RefreshCw,
} from 'lucide-react';
import api, { getErrorMessage } from '../../api';
import GlassCard from '../../components/GlassCard';

interface FeedbackReport {
  id: number;
  department_code: string;
  semester_number: number | null;
  section_name: string;
  reporter_name: string;
  category: 'wrong_room' | 'wrong_teacher' | 'absent_teacher' | 'other' | string;
  message: string;
  status: 'open' | 'resolved' | 'dismissed';
  admin_note: string;
  created_at: string;
}

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  wrong_room: { label: 'Wrong Room', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  wrong_teacher: { label: 'Wrong Teacher', color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' },
  absent_teacher: { label: 'Absent Faculty', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' },
  other: { label: 'General Issue', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
};

export default function Feedback() {
  const [reports, setReports] = useState<FeedbackReport[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('open');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Resolve/Dismiss modal state
  const [activeReport, setActiveReport] = useState<FeedbackReport | null>(null);
  const [actionType, setActionType] = useState<'resolve' | 'dismiss'>('resolve');
  const [adminNote, setAdminNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadReports = async () => {
    setLoading(true);
    setError('');
    try {
      const params = filterStatus ? { status: filterStatus } : {};
      const res = await api.get('/feedback', { params });
      setReports(res.data || []);
    } catch (err: any) {
      setError(getErrorMessage(err, 'Failed to load feedback reports.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [filterStatus]);

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReport) return;

    setSubmitting(true);
    try {
      const endpoint = `/feedback/${activeReport.id}/${actionType}`;
      await api.post(endpoint, null, {
        params: { note: adminNote.trim() },
      });
      setActiveReport(null);
      setAdminNote('');
      loadReports();
    } catch (err: any) {
      alert(getErrorMessage(err, `Failed to ${actionType} report.`));
    } finally {
      setSubmitting(false);
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
              <span>STUDENT REAL-TIME DISCREPANCY DISPATCH</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Student Feedback Queue</h1>
            <p className="text-xs text-white/60">
              Live reports submitted anonymously by students regarding absent instructors, classroom changes, or scheduling conflicts.
            </p>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-black/60 border border-white/10 shrink-0">
            {['open', 'resolved', 'dismissed', ''].map((st) => (
              <button
                key={st || 'all'}
                type="button"
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  filterStatus === st
                    ? 'bg-[#00d2ff] text-black shadow-md'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {st ? st.charAt(0).toUpperCase() + st.slice(1) : 'All Reports'}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {error && (
        <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Reports List */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#00d2ff] border-t-transparent animate-spin" />
          <div className="text-xs text-white/50 font-mono">Streaming student issue queue...</div>
        </div>
      ) : reports.length === 0 ? (
        <GlassCard variant="compact" className="text-center py-20 space-y-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-semibold text-white">Feedback Queue Clear</h3>
          <p className="text-white/50 text-xs max-w-md mx-auto">
            There are no {filterStatus || 'student'} reports awaiting administrative resolution at this time.
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => {
            const cat = CATEGORY_LABELS[r.category] || CATEGORY_LABELS.other;
            return (
              <GlassCard key={r.id} variant="compact" className="!p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono border font-medium ${cat.color}`}>
                      {cat.label}
                    </span>
                    <span className="font-semibold text-white">
                      {r.department_code || 'General'} • Sem {r.semester_number || '?'} Sec {r.section_name || '?'}
                    </span>
                    <span className="text-white/40">•</span>
                    <span className="text-white/60 flex items-center gap-1 text-[11px]">
                      <User className="w-3 h-3 text-[#00d2ff]" />
                      <span>{r.reporter_name || 'Student'}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-[10px] text-white/40 font-mono">
                      {new Date(r.created_at).toLocaleString()}
                    </span>
                    <span
                      className={`text-[9px] font-mono px-2 py-0.5 rounded-full border ${
                        r.status === 'open'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : r.status === 'resolved'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-white/5 text-white/40 border-white/10'
                      }`}
                    >
                      {r.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-white/90 leading-relaxed font-sans">{r.message}</div>

                {r.admin_note && (
                  <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-[11px] text-white/70">
                    <span className="text-[#00d2ff] font-semibold">Admin Resolution Note: </span>
                    <span>{r.admin_note}</span>
                  </div>
                )}

                {r.status === 'open' && (
                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveReport(r);
                        setActionType('dismiss');
                        setAdminNote('');
                      }}
                      className="px-3 py-1.5 rounded-xl border border-white/15 text-white/60 hover:text-white hover:bg-white/10 text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5 text-white/40" />
                      <span>Dismiss</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveReport(r);
                        setActionType('resolve');
                        setAdminNote('');
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-[#00d2ff]/20 text-[#00d2ff] border border-[#00d2ff]/40 hover:bg-[#00d2ff] hover:text-black text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark Resolved</span>
                    </button>
                  </div>
                )}
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Action Dialog Modal */}
      <AnimatePresence>
        {activeReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-3xl liquid-glass border border-white/20 bg-black/90 p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="font-bold text-white text-sm">
                  {actionType === 'resolve' ? 'Resolve Student Report' : 'Dismiss Student Report'}
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveReport(null)}
                  className="p-1 rounded-full text-white/60 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="text-xs text-white/70 italic border-l-2 border-[#00d2ff] pl-3 py-1">
                "{activeReport.message}"
              </div>

              <form onSubmit={handleActionSubmit} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="text-white/70 font-medium">Administrative Action Note (Optional)</label>
                  <input
                    type="text"
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="e.g. Swapped classroom in Builder, or faculty arrived late"
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white focus:outline-none focus:border-[#00d2ff]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveReport(null)}
                    className="px-4 py-2 rounded-xl text-white/60 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`px-4 py-2 rounded-xl font-semibold transition-all cursor-pointer ${
                      actionType === 'resolve'
                        ? 'bg-[#00d2ff] text-black hover:bg-[#3D81E3] hover:text-white'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    {submitting ? 'Updating...' : actionType === 'resolve' ? 'Confirm Resolved' : 'Confirm Dismiss'}
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
