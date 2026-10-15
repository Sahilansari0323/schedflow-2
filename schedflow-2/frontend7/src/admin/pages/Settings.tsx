import React, { useState } from 'react';
import { Settings as SettingsIcon, User, Lock, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import api, { getErrorMessage } from '../../shared/api';
import { useAuth } from '../../shared/auth';
import GlassCard from '../../shared/components/GlassCard';
import AppleButton from '../../shared/components/AppleButton';

export default function Settings() {
  const { user, setUser } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [profileMsg, setProfileMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [profileBusy, setProfileBusy] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwdMsg, setPwdMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [pwdBusy, setPwdBusy] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileBusy(true);
    setProfileMsg(null);
    try {
      const res = await api.put('/settings/profile', { name });
      setUser(res.data);
      setProfileMsg({ text: 'Profile display name updated successfully.', ok: true });
    } catch (err: any) {
      setProfileMsg({ text: getErrorMessage(err, 'Failed to update profile.'), ok: false });
    } finally {
      setProfileBusy(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdBusy(true);
    setPwdMsg(null);
    try {
      try {
        await api.put('/settings/password', {
          current_password: currentPassword,
          new_password: newPassword,
        });
      } catch {
        await api.post('/settings/change-password', {
          current_password: currentPassword,
          new_password: newPassword,
        });
      }
      setPwdMsg({ text: 'Password changed successfully.', ok: true });
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      setPwdMsg({ text: getErrorMessage(err, 'Failed to change password.'), ok: false });
    } finally {
      setPwdBusy(false);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-[rgba(16,20,32,0.65)] border border-white/10 backdrop-blur-3xl shadow-[0_14px_40px_rgba(0,0,0,0.5)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#74C947]/10 text-[#74C947] border border-[#74C947]/30">
              <SettingsIcon className="w-3 h-3 text-[#74C947]" />
              Institutional Preferences
            </span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white">System Settings</h2>
          <p className="text-xs text-white/60 mt-1 max-w-xl">
            Account identity, access keys, and security preferences.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Card */}
        <GlassCard variant="pro" className="!p-6 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-white/10">
            <User className="w-4 h-4 text-[#74C947]" />
            <h3 className="font-bold text-sm text-white">Operator Profile</h3>
          </div>

          {profileMsg && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold ${
                profileMsg.ok
                  ? 'bg-[#74C947]/20 text-[#74C947] border border-[#74C947]/30 shadow-[0_0_12px_rgba(116,201,71,0.15)]'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}
            >
              {profileMsg.text}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
            <div>
              <label className="block text-white/60 mb-1 font-mono uppercase font-medium">Email Address</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white/40 font-mono"
              />
            </div>

            <div>
              <label className="block text-white/60 mb-1 font-mono uppercase font-medium">Display Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-white focus:outline-none focus:border-[#74C947] backdrop-blur-2xl shadow-sm font-medium"
              />
            </div>

            <AppleButton variant="primary" size="sm" disabled={profileBusy}>
              <span>{profileBusy ? 'Saving…' : 'Update Profile'}</span>
            </AppleButton>
          </form>
        </GlassCard>

        {/* Password Card */}
        <GlassCard variant="pro" className="!p-6 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-white/10">
            <Lock className="w-4 h-4 text-[#74C947]" />
            <h3 className="font-bold text-sm text-white">Security & Key Rotation</h3>
          </div>

          {pwdMsg && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold ${
                pwdMsg.ok
                  ? 'bg-[#74C947]/20 text-[#74C947] border border-[#74C947]/30 shadow-[0_0_12px_rgba(116,201,71,0.15)]'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}
            >
              {pwdMsg.text}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
            <div>
              <label className="block text-white/60 mb-1 font-mono uppercase font-medium">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-white focus:outline-none focus:border-[#74C947] backdrop-blur-2xl shadow-sm"
              />
            </div>

            <div>
              <label className="block text-white/60 mb-1 font-mono uppercase font-medium">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-white focus:outline-none focus:border-[#74C947] backdrop-blur-2xl shadow-sm"
              />
            </div>

            <AppleButton variant="primary" size="sm" disabled={pwdBusy}>
              <span>{pwdBusy ? 'Updating Key…' : 'Rotate Password'}</span>
            </AppleButton>
          </form>
        </GlassCard>
      </div>
    </div>
  );
}
