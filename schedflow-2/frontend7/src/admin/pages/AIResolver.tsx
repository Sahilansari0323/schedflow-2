import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  Zap,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  Check,
} from 'lucide-react';
import api, { getErrorMessage } from '../../shared/api';
import GlassCard from '../../shared/components/GlassCard';
import AppleButton from '../../shared/components/AppleButton';

const TYPE_LABEL: Record<string, string> = {
  teacher: 'Teacher Clash',
  room: 'Room Double-Booking',
  section: 'Section Clash',
  availability: 'Availability Violation',
  lab: 'Lab Mismatch',
  workload: 'Workload Overrun',
};

const ACTION_ICON: Record<string, string> = {
  move_slot: '🗓',
  change_room: '🏫',
  change_teacher: '👤',
};

interface Suggestion {
  entry_id: number;
  action: string;
  to_day?: number;
  to_period?: number;
  room_id?: number;
  teacher_id?: number;
  label: string;
  detail: string;
}

interface ConflictEntry {
  entry_id: number;
  timetable_id: number;
  day: number;
  period: number;
  subject_code: string;
  teacher_name: string;
  room_name: string;
  section_name: string;
}

interface ConflictItem {
  id: string;
  type: string;
  severity: string;
  message: string;
  entries: ConflictEntry[];
  suggestions?: Suggestion[];
}

interface ScanData {
  summary: {
    total: number;
    high: number;
    medium: number;
    low: number;
  };
  conflicts: ConflictItem[];
}

export default function AIResolver() {
  const [phase, setPhase] = useState<'loading' | 'ready'>('loading');
  const [data, setData] = useState<ScanData | null>(null);
  const [error, setError] = useState('');
  const [applying, setApplying] = useState<string | null>(null);
  const [toast, setToast] = useState<{ tone: 'ok' | 'warn' | 'err'; text: string } | null>(null);

  const load = () => {
    setPhase('loading');
    api
      .get('/conflicts/scan')
      .then((r) => {
        setData(r.data);
        setPhase('ready');
      })
      .catch((err) => {
        setError(getErrorMessage(err, 'Could not load timetable conflicts.'));
        setPhase('ready');
      });
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(t);
  }, [toast]);

  const apply = async (conflict: ConflictItem, opt: Suggestion, key: string) => {
    setApplying(key);
    setError('');
    try {
      const res = await api.post('/conflicts/apply', {
        entry_id: opt.entry_id,
        action: opt.action,
        to_day: opt.to_day,
        to_period: opt.to_period,
        room_id: opt.room_id,
        teacher_id: opt.teacher_id,
      });
      const remaining = res.data.remaining_conflicts?.length ?? 0;
      if (remaining === 0) {
        confetti({
          particleCount: 140,
          spread: 85,
          origin: { y: 0.6 },
          colors: ['#74C947', '#ffffff', '#4ade80', '#16a34a'],
        });
      }
      setToast({
        tone: remaining ? 'warn' : 'ok',
        text: remaining
          ? `Applied: ${opt.label}. ${remaining} conflict(s) still remain on this slot.`
          : `Applied: ${opt.label}. Matrix slot is now 100% conflict-free!`,
      });
      load();
    } catch (err: any) {
      setToast({
        tone: 'err',
        text: getErrorMessage(err, 'Could not apply automatic heuristic fix.'),
      });
    } finally {
      setApplying(null);
    }
  };

  const conflicts = data?.conflicts ?? [];
  const resolvable = conflicts.filter((c) => (c.suggestions?.length ?? 0) > 0);

  return (
    <div className="space-y-8 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-[rgba(16,20,32,0.65)] border border-white/10 backdrop-blur-3xl shadow-[0_14px_40px_rgba(0,0,0,0.5)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#74C947]/10 text-[#74C947] border border-[#74C947]/30">
              <Zap className="w-3 h-3 text-[#74C947]" />
              Heuristic Engine
            </span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white">AI Heuristic Resolver</h2>
          <p className="text-xs text-white/60 mt-1 max-w-2xl">
            Ranked, constraint-satisfaction repair paths for detected collisions with sub-second CSP solver evaluation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <AppleButton variant="glass" size="md" onClick={load} disabled={phase === 'loading'} className="bg-white/[0.06] hover:bg-white/[0.12]">
            <RefreshCw className={`w-4 h-4 ${phase === 'loading' ? 'animate-spin text-[#74C947]' : ''}`} />
            <span>Re-evaluate</span>
          </AppleButton>
        </div>
      </div>

      {toast && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold border text-center transition-all ${
            toast.tone === 'ok'
              ? 'bg-[#74C947]/20 text-[#74C947] border-[#74C947]/40 shadow-[0_0_15px_rgba(116,201,71,0.2)]'
              : toast.tone === 'warn'
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
          }`}
        >
          {toast.text}
        </div>
      )}

      {/* Main List */}
      <GlassCard variant="pro" className="!p-6 space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="text-xs text-white/60 font-medium">
            Detected {conflicts.length} conflict(s) &middot; {resolvable.length} with deterministic auto-repair paths
          </div>
          <div className="text-xs font-mono text-[#74C947] font-semibold">CSP Invariants Active</div>
        </div>

        {conflicts.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <div className="w-14 h-14 rounded-full bg-[#74C947]/15 border border-[#74C947]/30 flex items-center justify-center text-[#74C947] mx-auto shadow-[0_0_24px_rgba(116,201,71,0.25)]">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-extrabold text-white">All Academic Matrices Conflict-Free</h3>
            <p className="text-xs text-white/60 max-w-md mx-auto">
              Every faculty allocation, lecture hall booking, and weekly workload requirement complies 100% with institutional invariants.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {conflicts.map((c) => (
              <div
                key={c.id}
                className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">
                      {TYPE_LABEL[c.type] || c.type}
                    </span>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold">
                      {c.severity}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-white/70">{c.message}</p>

                {/* Suggestions List */}
                {c.suggestions && c.suggestions.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-white/10">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#74C947] block font-bold">
                      Ranked Heuristic Solutions
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {c.suggestions.map((s, sIdx) => {
                        const key = `${c.id}-${sIdx}`;
                        const isBusy = applying === key;

                        return (
                          <div
                            key={sIdx}
                            className="p-3 rounded-xl bg-white/[0.03] border border-white/10 hover:border-[#74C947]/40 flex items-center justify-between gap-3 transition"
                          >
                            <div className="space-y-0.5 min-w-0">
                              <div className="text-xs font-semibold text-white flex items-center gap-1.5 truncate">
                                <span>{ACTION_ICON[s.action] || '✨'}</span>
                                <span>{s.label}</span>
                              </div>
                              <div className="text-[10px] text-white/50 truncate font-mono">{s.detail}</div>
                            </div>

                            <AppleButton
                              variant="primary"
                              size="sm"
                              disabled={isBusy || applying !== null}
                              onClick={() => apply(c, s, key)}
                              className="!px-3 !py-1 text-xs shrink-0"
                            >
                              <span>{isBusy ? 'Applying…' : 'Apply'}</span>
                            </AppleButton>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
