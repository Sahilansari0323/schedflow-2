import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users as UsersIcon,
  Shield,
  Mail,
  Calendar,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  X,
  UserCheck,
  Building,
} from 'lucide-react';
import api, { getErrorMessage } from '../../shared/api';
import GlassCard from '../../shared/components/GlassCard';
import AppleButton, { CTAButton, ReplyButton } from '../../shared/components/AppleButton';

interface UserItem {
  id: number;
  email: string;
  name: string;
  role: string;
  is_active: boolean;
  department_id?: number | null;
  teacher_id?: number | null;
  created_at?: string;
}

export default function Users() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'coordinator',
    department_id: '',
    teacher_id: '',
  });
  const [busy, setBusy] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      // Try /settings/users first, fallback to /users
      try {
        const res = await api.get('/settings/users');
        setUsers(res.data);
      } catch {
        const res = await api.get('/users');
        setUsers(res.data);
      }
    } catch (err: any) {
      setError(getErrorMessage(err, 'Failed to fetch user directory.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    api.get('/departments').then((r) => setDepartments(r.data || [])).catch(() => {});
    api.get('/teachers').then((r) => setTeachers(r.data || [])).catch(() => {});
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return;
    setBusy(true);
    setError('');

    try {
      const payload: any = {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        department_id: form.department_id ? Number(form.department_id) : null,
        teacher_id: form.teacher_id ? Number(form.teacher_id) : null,
      };

      await api.post('/settings/users', payload);
      setModalOpen(false);
      setForm({
        name: '',
        email: '',
        password: '',
        role: 'coordinator',
        department_id: '',
        teacher_id: '',
      });
      loadUsers();
    } catch (err: any) {
      alert(getErrorMessage(err, 'Failed to create institutional user.'));
    } finally {
      setBusy(false);
    }
  };

  const handleToggleStatus = async (user: UserItem) => {
    try {
      await api.put(`/settings/users/${user.id}/status`, {
        is_active: !user.is_active,
      });
      loadUsers();
    } catch (err: any) {
      alert(getErrorMessage(err, 'Failed to change user status.'));
    }
  };

  const handleDeleteUser = async (user: UserItem) => {
    if (!confirm(`Are you sure you want to remove user "${user.name}" (${user.email})?`)) return;
    try {
      await api.delete(`/settings/users/${user.id}`);
      loadUsers();
    } catch (err: any) {
      alert(getErrorMessage(err, 'Failed to remove user.'));
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-[rgba(16,20,32,0.65)] border border-white/10 backdrop-blur-3xl shadow-[0_14px_40px_rgba(0,0,0,0.5)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#74C947]/10 text-[#74C947] border border-[#74C947]/30">
              <UsersIcon className="w-3 h-3 text-[#74C947]" />
              RBAC Directory
            </span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white">Institutional Users & Access Control</h2>
          <p className="text-xs text-white/60 mt-1 max-w-xl">
            Administrative operators, academic deans, and department coordinators authorized to govern timetables.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <AppleButton variant="primary" size="md" onClick={() => setModalOpen(true)}>
            <Plus className="w-4 h-4" />
            <span>Add User</span>
          </AppleButton>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs text-center font-medium">
          {error}
        </div>
      )}

      {/* Directory Grid */}
      <GlassCard variant="pro" className="!p-0 overflow-hidden">
        <div className="p-4 bg-white/[0.02] grid grid-cols-12 text-xs font-mono uppercase text-white/50 font-semibold border-b border-white/10">
          <div className="col-span-4">Operator Name</div>
          <div className="col-span-3">Email Address</div>
          <div className="col-span-3">Role & Scope</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        <div className="divide-y divide-white/5">
          {loading ? (
            <div className="p-12 text-center text-xs text-white/40">Loading directory…</div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center text-xs text-white/40">No user records found.</div>
          ) : (
            users.map((u) => {
              const dept = departments.find((d) => d.id === u.department_id);

              return (
                <div
                  key={u.id}
                  className="p-4 grid grid-cols-12 items-center hover:bg-white/[0.02] transition text-xs"
                >
                  <div className="col-span-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#74C947]/15 border border-[#74C947]/30 flex items-center justify-center text-[#74C947] font-bold">
                      {u.name ? u.name.slice(0, 2).toUpperCase() : 'US'}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white flex items-center gap-2">
                        <span>{u.name}</span>
                        {!u.is_active && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                            DISABLED
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-white/40 font-mono">UID #{u.id}</div>
                    </div>
                  </div>

                  <div className="col-span-3 text-white/70 font-mono truncate">{u.email}</div>

                  <div className="col-span-3 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                          u.role === 'admin'
                            ? 'bg-[#74C947]/20 text-[#74C947] border border-[#74C947]/30'
                            : u.role === 'coordinator'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                        }`}
                      >
                        {u.role}
                      </span>
                    </div>
                    {dept && (
                      <div className="text-[10px] text-white/50 font-mono">
                        Dept: {dept.code}
                      </div>
                    )}
                  </div>

                  <div className="col-span-2 flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleToggleStatus(u)}
                      title={u.is_active ? 'Deactivate user' : 'Activate user'}
                      className={`p-1.5 rounded-xl border transition cursor-pointer ${
                        u.is_active
                          ? 'border-white/10 text-white/60 hover:text-amber-400 hover:bg-amber-500/10'
                          : 'border-[#74C947]/30 text-[#74C947] hover:bg-[#74C947]/10'
                      }`}
                    >
                      {u.is_active ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => handleDeleteUser(u)}
                      title="Delete user"
                      className="p-1.5 rounded-xl border border-white/10 text-white/40 hover:text-rose-400 hover:bg-rose-500/15 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </GlassCard>

      {/* Create User Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-md w-full"
            >
              <GlassCard variant="pro" className="!p-6 space-y-5 bg-[#0e121e]/95 border-white/15">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <UsersIcon className="w-4 h-4 text-[#74C947]" />
                    <h3 className="font-bold text-white text-sm">Add Institutional User</h3>
                  </div>
                  <button
                    onClick={() => setModalOpen(false)}
                    className="p-1 rounded-xl text-white/40 hover:text-white transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-white/60 mb-1 font-medium font-mono uppercase">Full Name</label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g. Dr. Jane Doe"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-white text-xs focus:border-[#74C947]"
                    />
                  </div>

                  <div>
                    <label className="block text-white/60 mb-1 font-medium font-mono uppercase">Email Address</label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="jane.doe@university.edu"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-white text-xs focus:border-[#74C947]"
                    />
                  </div>

                  <div>
                    <label className="block text-white/60 mb-1 font-medium font-mono uppercase">Temporary Password</label>
                    <input
                      type="password"
                      required
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder="Minimum 6 characters"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-white text-xs focus:border-[#74C947]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-white/60 mb-1 font-medium font-mono uppercase">Role & Access</label>
                      <select
                        value={form.role}
                        onChange={(e) => setForm({ ...form, role: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-white text-xs focus:border-[#74C947]"
                      >
                        <option value="admin" className="bg-[#0e121e] text-white">Administrator</option>
                        <option value="coordinator" className="bg-[#0e121e] text-white">Dept Coordinator</option>
                        <option value="viewer" className="bg-[#0e121e] text-white">Viewer</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-white/60 mb-1 font-medium font-mono uppercase">Department</label>
                      <select
                        value={form.department_id}
                        onChange={(e) => setForm({ ...form, department_id: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-white text-xs focus:border-[#74C947]"
                      >
                        <option value="" className="bg-[#0e121e] text-white">All (Campus Wide)</option>
                        {departments.map((d) => (
                          <option key={d.id} value={d.id} className="bg-[#0e121e] text-white">
                            {d.name} ({d.code})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-white/60 mb-1 font-medium font-mono uppercase">Link to Faculty (Optional)</label>
                    <select
                      value={form.teacher_id}
                      onChange={(e) => setForm({ ...form, teacher_id: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-white text-xs focus:border-[#74C947]"
                    >
                      <option value="" className="bg-[#0e121e] text-white">None (Standard Staff)</option>
                      {teachers.map((t) => (
                        <option key={t.id} value={t.id} className="bg-[#0e121e] text-white">
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs text-white/60 hover:text-white transition font-medium cursor-pointer"
                    >
                      Cancel
                    </button>
                    <AppleButton variant="primary" size="sm" disabled={busy}>
                      <span>{busy ? 'Creating…' : 'Create User'}</span>
                    </AppleButton>
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
