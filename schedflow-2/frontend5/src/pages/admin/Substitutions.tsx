import { useEffect, useState } from 'react';
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
import api, { getErrorMessage } from '../../api';
import GlassCard from '../../components/GlassCard';

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

  const assignedCount = lastResult?.results.filter((r) => r.status === 'assigned').length ?? 0;
  const unresolvedCount = lastResult?.results.filter((r) => r.status === 'unresolved').length ?? 0;

  return (
    <div className="space-y-8 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <UserCheck className="w-3 h-3 text-cyan-300" />
              Dynamic Load Rebalance
            </span>
            <span className="text-xs text-white/40 tracking-wider uppercase font-mono">
              Faculty Contingency
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
            Substitution Engine
          </h1>
          <p className="text-sm text-white/60 mt-1 max-w-2xl">
            Automated emergency coverage generator. When a faculty member takes sudden or scheduled
            leave, the engine scans eligible peers free during those specific slots within load caps.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Leave Configuration Form (2 cols) */}
        <div className="lg:col-span-2">
          <GlassCard className="p-6">
            <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              Report Faculty Absence
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-white/70 mb-1.5">
                  Faculty Member on Leave
                </label>
                <select
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500 transition [&>option]:bg-slate-900 [&>option]:text-white"
                >
                  <option value="">Select faculty member…</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1.5">From Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500 transition [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1.5">To Date</label>
                  <input
                    type="date"
                    value={endDate}
                    min={startDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500 transition [color-scheme:dark]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-white/70 mb-1.5">
                  Leave Reason / Memo (Optional)
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Conference Keynote, Medical, Duty Leave"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm placeholder-white/30 focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-white/60">
                Window Span:{' '}
                <span className="font-semibold text-white">
                  {daysCount} day{daysCount !== 1 ? 's' : ''}
                </span>
                {teacherId && (
                  <>
                    {' '}
                    — covering all classes for{' '}
                    <span className="text-blue-300 font-semibold">
                      {teachers.find((t) => t.id === Number(teacherId))?.name}
                    </span>
                  </>
                )}
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                  {error}
                </div>
              )}

              <button
                onClick={runSubstitute}
                disabled={busy || !teacherId || daysCount <= 0}
                className="w-full py-3 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:brightness-110 transition disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {busy ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin text-cyan-300" />
                    Calculating Best Matches…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-cyan-300" />
                    Auto-Assign Substitutes
                  </>
                )}
              </button>
            </div>
          </GlassCard>
        </div>

        {/* Results & History (3 cols) */}
        <div className="lg:col-span-3 space-y-6">
          {/* Latest Generated Result */}
          <AnimatePresence>
            {lastResult && (
              <motion.div
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
              >
                <GlassCard className="overflow-hidden border border-blue-500/30">
                  <div className="p-5 border-b border-white/10 bg-blue-500/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-300">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white">
                          {assignedCount} class{assignedCount !== 1 ? 'es' : ''} successfully
                          covered
                        </h4>
                        <p className="text-xs text-white/50">
                          {lastResult.substitution.teacher?.name} •{' '}
                          {lastResult.substitution.start_date} → {lastResult.substitution.end_date}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                        unresolvedCount === 0
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                      }`}
                    >
                      {unresolvedCount === 0
                        ? '100% Resolved'
                        : `${unresolvedCount} need manual slot`}
                    </span>
                  </div>

                  <div className="divide-y divide-white/5">
                    {lastResult.results.map((r, i) => (
                      <div
                        key={r.entry_id || i}
                        className="p-4 flex flex-wrap items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              r.status === 'assigned' ? 'bg-emerald-400' : 'bg-amber-400'
                            }`}
                          />
                          <span className="font-semibold text-white">{r.slot}</span>
                          <span className="text-white/30">•</span>
                          <span className="text-white/80">{r.subject_code}</span>
                          <span className="text-white/30">•</span>
                          <span className="text-white/50">
                            Sec {r.section_name} ({r.room_name})
                          </span>
                        </div>

                        <div>
                          {r.status === 'assigned' && r.substitute ? (
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-medium">
                              Sub: {r.substitute.name}
                            </span>
                          ) : (
                            <span className="text-amber-300 text-[11px]">{r.reason}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Past History Log */}
          <GlassCard className="p-6">
            <h3 className="text-base font-semibold text-white mb-4 flex items-center justify-between">
              <span>Substitution Audit Log</span>
              <span className="text-xs text-white/40 font-mono font-normal">
                {history.length} records
              </span>
            </h3>

            {history.length === 0 ? (
              <div className="py-12 text-center text-xs text-white/40">
                No leave allocations recorded yet. Use the form to trigger automated contingency.
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((s) => (
                  <div
                    key={s.id}
                    className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition flex flex-wrap items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">{s.teacher?.name}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            s.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                              : 'bg-white/5 text-white/40 border border-white/10'
                          }`}
                        >
                          {s.status}
                        </span>
                      </div>
                      <p className="text-xs text-white/50">
                        {s.start_date} → {s.end_date} • {s.assignments?.length || 0} class
                        {s.assignments?.length !== 1 ? 'es' : ''} covered
                        {s.note && <span className="text-white/40"> — {s.note}</span>}
                      </p>
                    </div>

                    {s.status === 'active' && (
                      <button
                        onClick={() => doRevert(s.id)}
                        disabled={reverting === s.id}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <RotateCcw
                          className={`w-3.5 h-3.5 ${reverting === s.id ? 'animate-spin' : ''}`}
                        />
                        {reverting === s.id ? 'Reverting…' : 'Revert Original'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
