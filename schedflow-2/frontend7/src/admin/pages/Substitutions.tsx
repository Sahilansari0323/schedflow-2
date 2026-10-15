import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  UserCheck,
  Calendar,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Clock,
  User,
  BookOpen,
  MapPin,
  FileText,
} from 'lucide-react';
import api, { getErrorMessage } from '../../shared/api';
import GlassCard from '../../shared/components/GlassCard';
import AppleButton from '../../shared/components/AppleButton';

interface Teacher {
  id: number;
  name: string;
  is_active: boolean;
}

interface SubResult {
  entry_id: number;
  slot: string;
  subject_code: string;
  section_name: string;
  room_name: string;
  status: 'assigned' | 'unresolved';
  substitute?: { id: number; name: string };
  reason?: string;
}

interface SubstitutionRecord {
  id: number;
  teacher_id: number;
  start_date: string;
  end_date: string;
  note?: string;
  status: 'active' | 'reverted';
  teacher: { id: number; name: string };
  assignments: Array<{
    id: number;
    substitute_teacher: { id: number; name: string };
  }>;
}

const todayStr = new Date().toISOString().slice(0, 10);
const sixDaysLater = new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10);

export default function Substitutions() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [teacherId, setTeacherId] = useState('');
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(sixDaysLater);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [lastResult, setLastResult] = useState<{
    substitution: SubstitutionRecord;
    results: SubResult[];
  } | null>(null);
  const [history, setHistory] = useState<SubstitutionRecord[]>([]);
  const [reverting, setReverting] = useState<number | null>(null);

  const loadHistory = () => {
    api
      .get('/substitutions')
      .then((r) => setHistory(r.data))
      .catch(() => {});
  };

  useEffect(() => {
    api
      .get('/teachers')
      .then((r) => setTeachers(r.data.filter((t: Teacher) => t.is_active)))
      .catch(() => {});
    loadHistory();
    const interval = setInterval(loadHistory, 15000);
    return () => clearInterval(interval);
  }, []);

  const daysCount = (() => {
    if (!startDate || !endDate || startDate > endDate) return 0;
    return Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000) + 1;
  })();

  const runSubstitute = async () => {
    if (!teacherId || daysCount <= 0) return;
    setBusy(true);
    setError('');
    setLastResult(null);
    try {
      const res = await api.post('/substitutions', {
        teacher_id: Number(teacherId),
        start_date: startDate,
        end_date: endDate,
        note,
      });
      setLastResult(res.data);
      loadHistory();
    } catch (err: any) {
      setError(getErrorMessage(err, 'Could not compute automated substitutions.'));
    } finally {
      setBusy(false);
    }
  };

  const doRevert = async (id: number) => {
    setReverting(id);
    try {
      await api.post(`/substitutions/${id}/revert`);
      setLastResult(null);
      loadHistory();
    } catch (err: any) {
      setError(getErrorMessage(err, 'Revert failed.'));
    } finally {
      setReverting(null);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-[rgba(16,20,32,0.65)] border border-white/10 backdrop-blur-3xl shadow-[0_14px_40px_rgba(0,0,0,0.5)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#74C947]/10 text-[#74C947] border border-[#74C947]/30">
              <UserCheck className="w-3 h-3 text-[#74C947]" />
              Dynamic Load Rebalance
            </span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white">Dynamic Substitutions</h2>
          <p className="text-xs text-white/60 mt-1 max-w-2xl">
            Automated peer workload balancing for planned or emergency faculty leaves without violating weekly load caps.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs text-center font-medium">
          {error}
        </div>
      )}

      {/* Generator Form Card */}
      <GlassCard variant="pro" className="!p-6 space-y-6">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#74C947]" />
          <span>Record Faculty Absence & Compute Coverage</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-mono uppercase text-white/60 mb-1.5 font-medium">
              Absent Faculty
            </label>
            <select
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-white text-xs focus:outline-none focus:border-[#74C947] shadow-sm font-medium"
            >
              <option value="" className="bg-[#0e121e] text-white">Select Instructor…</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id} className="bg-[#0e121e] text-white">
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-white/60 mb-1.5 font-medium">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-white text-xs focus:outline-none focus:border-[#74C947] shadow-sm font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-white/60 mb-1.5 font-medium">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-white text-xs focus:outline-none focus:border-[#74C947] shadow-sm font-medium"
            />
          </div>

          <div>
            <AppleButton
              variant="primary"
              size="md"
              className="w-full !py-2.5"
              onClick={runSubstitute}
              disabled={busy || !teacherId || daysCount <= 0}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{busy ? 'Solving Coverage…' : 'Compute Coverage'}</span>
            </AppleButton>
          </div>
        </div>
      </GlassCard>

      {/* Results from last run */}
      {lastResult && (
        <GlassCard variant="pro" className="!p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="font-bold text-sm text-white">Coverage Generation Outcome</div>
            <div className="text-xs font-mono text-[#74C947] font-semibold">
              {lastResult.results.filter((r) => r.status === 'assigned').length} Assigned &middot;{' '}
              {lastResult.results.filter((r) => r.status === 'unresolved').length} Unresolved
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {lastResult.results.map((r, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 shadow-sm space-y-1 text-xs"
              >
                <div className="flex items-center justify-between font-mono">
                  <span className="text-[#74C947] font-bold">{r.subject_code}</span>
                  <span className="text-white/40">{r.slot}</span>
                </div>
                <div className="text-white/60">
                  Venue: {r.room_name} &middot; Sec: {r.section_name}
                </div>
                <div className="pt-1 flex items-center justify-between">
                  <span className="text-white font-medium">
                    {r.substitute ? `Assigned to: ${r.substitute.name}` : 'No substitute found'}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                      r.status === 'assigned'
                        ? 'bg-[#74C947]/20 text-[#74C947] border border-[#74C947]/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {r.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* History Ledger */}
      <GlassCard variant="pro" className="!p-6 space-y-4">
        <h3 className="font-bold text-base text-white">Active & Past Substitution Dispatches</h3>
        <div className="space-y-3">
          {history.length === 0 ? (
            <div className="text-center py-10 text-xs text-white/40">
              No substitution records logged yet.
            </div>
          ) : (
            history.map((h) => (
              <div
                key={h.id}
                className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">{h.teacher?.name}</span>
                    <span
                      className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                        h.status === 'active'
                          ? 'bg-[#74C947]/20 text-[#74C947] border border-[#74C947]/30'
                          : 'bg-white/10 text-white/50 border-white/10'
                      }`}
                    >
                      {h.status}
                    </span>
                  </div>
                  <div className="text-white/60 font-mono text-[11px]">
                    Absence window: {h.start_date} &rarr; {h.end_date} &middot; {h.assignments?.length || 0} slots covered
                  </div>
                  {h.note && <div className="text-[11px] text-white/50 italic">"{h.note}"</div>}
                </div>

                {h.status === 'active' && (
                  <button
                    onClick={() => doRevert(h.id)}
                    disabled={reverting === h.id}
                    className="px-3 py-1.5 rounded-xl border border-white/10 text-white/70 hover:text-white hover:bg-white/10 text-xs flex items-center gap-1.5 cursor-pointer transition shrink-0"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${reverting === h.id ? 'animate-spin' : ''}`} />
                    <span>{reverting === h.id ? 'Reverting…' : 'Revert Coverage'}</span>
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </GlassCard>
    </div>
  );
}
