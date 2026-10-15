import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  UserPlus,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Lock,
  Mail,
  UserCheck,
  X,
  Sparkles,
} from 'lucide-react';
import api, { getErrorMessage } from '../../api';
import { useAuth } from '../../auth';
import GlassCard from '../../components/GlassCard';

interface UserItem {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at?: string;
}

export default function UserDirectory() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'admin' });
  const [modalOpen, setModalOpen] = useState(false);
  const [msg, setMsg] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const loadUsers = () => {
    api
      .get('/settings/users')
      .then((r) => setUsers(r.data))
      .catch(() => {});
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setBusy(true);
    try {
      await api.post('/settings/users', form);
      setForm({ name: '', email: '', password: '', role: 'admin' });
      setMsg({ tone: 'ok', text: 'New institutional account provisioned successfully.' });
      setModalOpen(false);
      loadUsers();
    } catch (err: any) {
      setMsg({
        tone: 'err',
        text: getErrorMessage(err, 'Could not provision new user account.'),
      });
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (u: UserItem) => {
    setMsg(null);
    try {
      await api.put(`/settings/users/${u.id}/status`, { is_active: !u.is_active });
      loadUsers();
    } catch (err: any) {
      setMsg({ tone: 'err', text: getErrorMessage(err, 'Status modification failed.') });
    }
  };

  const removeUser = async (u: UserItem) => {
    if (!confirm(`Are you sure you want to permanently revoke credentials for "${u.name}" (${u.email})?`))
      return;
    setMsg(null);
    try {
      await api.delete(`/settings/users/${u.id}`);
      loadUsers();
    } catch (err: any) {
      setMsg({ tone: 'err', text: getErrorMessage(err, 'Could not delete user.') });
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Users className="w-3 h-3 text-cyan-300" />
              Access Control & RBAC
            </span>
            <span className="text-xs text-white/40 tracking-wider uppercase font-mono">
              Identity Management
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
            User Directory
          </h1>
          <p className="text-sm text-white/60 mt-1 max-w-2xl">
            Authorize Dean, Department Chairs (HODs), and Academic Timetable Coordinators with
            role-based administrative access and cryptographic session validation.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:brightness-110 transition shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          Provision Operator
        </button>
      </div>

      {/* Notifications */}
      {msg && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center justify-between shadow-xl ${
            msg.tone === 'ok'
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
          }`}
        >
          <span>{msg.text}</span>
          <button onClick={() => setMsg(null)} className="text-white/40 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* User Table Card */}
      <GlassCard className="overflow-hidden">
        <div className="p-4 bg-white/[0.02] grid grid-cols-12 text-xs font-mono uppercase text-white/40 font-semibold border-b border-white/5">
          <div className="col-span-5">Identity Profile</div>
          <div className="col-span-3">Role Authority</div>
          <div className="col-span-2">Account State</div>
          <div className="col-span-2 text-right">Permissions</div>
        </div>

        <div className="divide-y divide-white/5">
          {users.map((u) => {
            const isSelf = u.id === currentUser?.id;

            return (
              <div
                key={u.id}
                className="p-4 grid grid-cols-12 items-center hover:bg-white/[0.02] transition"
              >
                {/* Profile */}
                <div className="col-span-5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30 flex items-center justify-center text-sm font-bold text-blue-300 uppercase">
                    {(u.name || u.email).slice(0, 2)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">{u.name || 'Operator'}</span>
                      {isSelf && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          Active Session
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-white/50">{u.email}</div>
                  </div>
                </div>

                {/* Role */}
                <div className="col-span-3">
                  <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-white/80 font-mono capitalize">
                    {u.role}
                  </span>
                </div>

                {/* Status */}
                <div className="col-span-2 flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      u.is_active ? 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-400'
                    }`}
                  />
                  <span className="text-xs text-white/70">
                    {u.is_active ? 'Authorized' : 'Suspended'}
                  </span>
                </div>

                {/* Actions */}
                <div className="col-span-2 flex items-center justify-end gap-3">
                  {!isSelf && (
                    <>
                      <button
                        onClick={() => toggleActive(u)}
                        className="text-xs text-white/60 hover:text-white transition underline underline-offset-4"
                      >
                        {u.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => removeUser(u)}
                        className="p-1.5 rounded-lg text-white/40 hover:text-rose-400 hover:bg-rose-500/10 transition"
                        title="Revoke operator credentials"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* Provision User Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalOpen(false)}
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
                  Provision Portal Operator
                </h3>
                <button
                  onClick={() => setModalOpen(false)}
                  className="text-white/40 hover:text-white transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddUser} className="space-y-4 text-xs">
                <div>
                  <label className="block text-white/70 mb-1">Operator Full Name</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Prof. Evelyn Vance"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-white/70 mb-1">Academic Email</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="evance@schedflow.edu"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-white/70 mb-1">Temporary Sign-in Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Minimum 6 characters"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-white/70 mb-1">Administrative Role</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500 [&>option]:bg-slate-900"
                  >
                    <option value="admin">Administrator / Department Chair (HOD)</option>
                    <option value="coordinator">Academic Timetable Coordinator</option>
                  </select>
                </div>

                <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-white/60 hover:text-white transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={busy || !form.name || !form.email || form.password.length < 6}
                    className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-[0_0_15px_rgba(59,130,246,0.4)] hover:brightness-110 transition disabled:opacity-50"
                  >
                    {busy ? 'Provisioning…' : 'Issue Credentials'}
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
