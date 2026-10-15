import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  Settings as SettingsIcon,
  User,
  Key,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Server,
  Lock,
  Cpu,
  Sparkles,
} from 'lucide-react';
import api, { getErrorMessage } from '../../api';
import { useAuth } from '../../auth';
import GlassCard from '../../components/GlassCard';

export default function Settings() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState('');
  const [profileMsg, setProfileMsg] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null);

  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null);
  const [pwBusy, setPwBusy] = useState(false);

  useEffect(() => {
    api
      .get('/settings/profile')
      .then((r) => setName(r.data.name || ''))
      .catch(() => {});
  }, []);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    try {
      const r = await api.put('/settings/profile', { name });
      if (user) setUser({ ...user, name: r.data.name });
      setProfileMsg({ tone: 'ok', text: 'Operator profile display name updated successfully.' });
    } catch (err: any) {
      setProfileMsg({
        tone: 'err',
        text: getErrorMessage(err, 'Could not update profile.'),
      });
    }
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    if (pw.next !== pw.confirm) {
      setPwMsg({ tone: 'err', text: 'New password confirmation does not match.' });
      return;
    }
    setPwBusy(true);
    try {
      await api.put('/settings/password', {
        current_password: pw.current,
        new_password: pw.next,
      });
      setPw({ current: '', next: '', confirm: '' });
      setPwMsg({
        tone: 'ok',
        text: 'Master password modified. Active JWT session remains valid until renewal.',
      });
    } catch (err: any) {
      setPwMsg({
        tone: 'err',
        text: getErrorMessage(err, 'Password update rejected.'),
      });
    } finally {
      setPwBusy(false);
    }
  };

  const isPwValid =
    pw.current.length > 0 &&
    pw.next.length >= 6 &&
    pw.next === pw.confirm &&
    pw.next !== pw.current;

  return (
    <div className="space-y-8 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <SettingsIcon className="w-3 h-3 text-cyan-300" />
              Administrative Governance
            </span>
            <span className="text-xs text-white/40 tracking-wider uppercase font-mono">
              Identity & Security
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
            System Settings
          </h1>
          <p className="text-sm text-white/60 mt-1 max-w-2xl">
            Configure administrative profile credentials, password authentication schemes, and
            cryptographic parameters for the SchedFlow deployment.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Card */}
        <GlassCard className="p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Operator Profile</h3>
              <p className="text-xs text-white/50">Your active display identity across audit logs</p>
            </div>
          </div>

          {profileMsg && (
            <div
              className={`p-3 rounded-xl border text-xs ${
                profileMsg.tone === 'ok'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
              }`}
            >
              {profileMsg.text}
            </div>
          )}

          <form onSubmit={saveProfile} className="space-y-4 text-xs">
            <div>
              <label className="block text-white/70 mb-1">Sign-in Email (Fixed ID)</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-white/50 text-sm cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-white/70 mb-1">Display Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Institutional Administrator"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={!name.trim()}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-[0_0_15px_rgba(59,130,246,0.4)] hover:brightness-110 transition disabled:opacity-40"
            >
              Save Profile
            </button>
          </form>
        </GlassCard>

        {/* Password Security Card */}
        <GlassCard className="p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Password Authentication</h3>
              <p className="text-xs text-white/50">Update master administrative password</p>
            </div>
          </div>

          {pwMsg && (
            <div
              className={`p-3 rounded-xl border text-xs ${
                pwMsg.tone === 'ok'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
              }`}
            >
              {pwMsg.text}
            </div>
          )}

          <form onSubmit={savePassword} className="space-y-4 text-xs">
            <div>
              <label className="block text-white/70 mb-1">Current Password</label>
              <input
                type="password"
                required
                value={pw.current}
                onChange={(e) => setPw({ ...pw, current: e.target.value })}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-white/70 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={pw.next}
                  onChange={(e) => setPw({ ...pw, next: e.target.value })}
                  placeholder="min 6 chars"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-white/70 mb-1">Confirm Password</label>
                <input
                  type="password"
                  required
                  value={pw.confirm}
                  onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
                  placeholder="re-enter"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!isPwValid || pwBusy}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-white/10 hover:bg-white/15 border border-white/15 transition disabled:opacity-40"
            >
              {pwBusy ? 'Updating Password…' : 'Change Password'}
            </button>
          </form>
        </GlassCard>

        {/* Security Checklist Card */}
        <GlassCard className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Security Architecture</h3>
              <p className="text-xs text-white/50">Core defenses protecting the timetable schema</p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {[
              'Cryptographic Bcrypt password hashing with high salt rounds.',
              'Stateless JWT session bearer tokens valid for 12 hours.',
              'Isolated zero-auth student read API with no mutating endpoints.',
              'Granular RBAC distinguishing Chairs (Admins) and Coordinators.',
              'Immutable audit log recording every allocation transaction.',
            ].map((text, i) => (
              <div key={i} className="flex items-start gap-3 text-xs text-white/70">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Server & Engine Telemetry */}
        <GlassCard className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Infrastructure Pipeline</h3>
              <p className="text-xs text-white/50">Engine and runtime environment status</p>
            </div>
          </div>

          <div className="space-y-3 pt-2 font-mono text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
              <span className="text-white/50">Frontend UI Runtime</span>
              <span className="text-blue-300 font-semibold">Vite 8 • React 19 • Tailwind v4</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
              <span className="text-white/50">Backend Gateway</span>
              <span className="text-emerald-400 font-semibold">FastAPI • Python 3.12 (Port 8000)</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
              <span className="text-white/50">Constraint Engine</span>
              <span className="text-cyan-300 font-semibold">Genetic CSP Solver (Deterministic)</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
              <span className="text-white/50">Aura Rendering</span>
              <span className="text-purple-300 font-semibold">Persistent 60fps Ambient Canvas/Video</span>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
