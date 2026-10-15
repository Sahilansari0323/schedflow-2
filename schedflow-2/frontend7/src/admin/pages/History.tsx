import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  History as HistoryIcon,
  Filter,
  CheckCircle2,
  Calendar,
  Layers,
  FileText,
  User,
  Clock,
  Sparkles,
} from 'lucide-react';
import api, { getErrorMessage } from '../../shared/api';
import GlassCard from '../../shared/components/GlassCard';

interface AuditLog {
  id: number;
  action: string;
  entity?: string;
  entity_type?: string;
  entity_id?: number;
  detail?: any;
  details?: any;
  user?: string;
  user_id?: number;
  user_email?: string;
  created_at: string;
}

const ACTIONS = [
  { key: '', label: 'All Operations' },
  { key: 'created', label: 'Allocations Created' },
  { key: 'updated', label: 'Modifications' },
  { key: 'deleted', label: 'Deletions' },
  { key: 'published', label: 'Live Releases' },
  { key: 'resolved', label: 'AI Repairs' },
];

const ACTION_STYLE: Record<string, { dot: string; badge: string }> = {
  created: {
    dot: 'bg-[#74C947]',
    badge: 'bg-[#74C947]/20 text-[#74C947] border-[#74C947]/30',
  },
  updated: {
    dot: 'bg-sky-500',
    badge: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
  },
  deleted: {
    dot: 'bg-rose-500',
    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  },
  published: {
    dot: 'bg-purple-500',
    badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  },
  resolved: {
    dot: 'bg-emerald-400',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  },
};

function formatRelativeTime(isoStr: string) {
  try {
    const diff = (Date.now() - new Date(isoStr).getTime()) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(isoStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return isoStr;
  }
}

export default function VersionHistory() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    api
      .get('/audit', { params: filter ? { action: filter } : {} })
      .then((r) => setLogs(r.data))
      .catch((err) => setError(getErrorMessage(err, 'Could not fetch audit history logs.')))
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div className="space-y-8 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-[rgba(16,20,32,0.65)] border border-white/10 backdrop-blur-3xl shadow-[0_14px_40px_rgba(0,0,0,0.5)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#74C947]/10 text-[#74C947] border border-[#74C947]/30">
              <HistoryIcon className="w-3 h-3 text-[#74C947]" />
              Cryptographic Audit Trail
            </span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white">Historical Ledger</h2>
          <p className="text-xs text-white/60 mt-1 max-w-2xl">
            Immutable timeline tracking every slot assignment, timetable release, faculty substitution, and entity deletion.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-3xl overflow-x-auto shadow-sm">
        {ACTIONS.map((a) => (
          <button
            key={a.key}
            onClick={() => setFilter(a.key)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
              filter === a.key
                ? 'bg-[#74C947] text-[#081a05] shadow-[0_0_12px_rgba(116,201,71,0.3)]'
                : 'text-white/60 hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            {a.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs text-center font-medium">
          {error}
        </div>
      )}

      {/* Timeline Stream */}
      <GlassCard variant="pro" className="!p-6">
        {loading ? (
          <div className="py-16 text-center text-xs text-white/50 flex items-center justify-center gap-2">
            <Clock className="w-4 h-4 animate-spin text-[#74C947]" />
            Loading historical ledger…
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-xs text-white/40">
            No audit records matching this filter criteria.
          </div>
        ) : (
          <div className="relative border-l border-white/15 ml-4 space-y-6 pl-6 my-2">
            {logs.map((item, i) => {
              const style = ACTION_STYLE[item.action] || {
                dot: 'bg-white/40',
                badge: 'bg-white/10 text-white border-white/15',
              };

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.3) }}
                  className="relative group"
                >
                  {/* Timeline dot */}
                  <span
                    className={`absolute -left-[31px] top-1.5 w-2.5 h-2.5 rounded-full ${style.dot} transition group-hover:scale-125 shadow-[0_0_8px_currentColor]`}
                  />

                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 shadow-sm hover:border-white/20 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${style.badge}`}
                        >
                          {item.action}
                        </span>
                        <span className="text-xs font-semibold text-white">
                          {item.entity || item.entity_type || 'System'}{' '}
                          {item.entity_id ? `#${item.entity_id}` : ''}
                        </span>
                        {(item.user || item.user_email) && (
                          <span className="text-xs text-white/40 font-mono">
                            by {item.user || item.user_email}
                          </span>
                        )}
                      </div>

                      {/* Details preview */}
                      <p className="text-xs text-white/70 font-mono mt-1">
                        {typeof (item.detail ?? item.details) === 'object'
                          ? JSON.stringify(item.detail ?? item.details).replace(/[{"}]/g, ' ')
                          : String(item.detail ?? item.details ?? 'System event committed.')}
                      </p>
                    </div>

                    <div className="text-right shrink-0 text-xs text-white/40 font-mono">
                      <div>{formatRelativeTime(item.created_at)}</div>
                      <div className="text-[10px] text-white/30">
                        {new Date(item.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
