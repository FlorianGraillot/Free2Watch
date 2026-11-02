import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  Cookie,
  Database,
  DollarSign,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Save,
  ShieldCheck,
  TriangleAlert,
  User,
} from 'lucide-react';
import { authService } from '../services/catalog.service';
import { apiErrorMessage } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useSeo } from '../hooks/useSeo';
import { Button } from '../components/Button';
import { Field } from '../components/Field';
import { cn } from '../utils/format';

export function AdminSettingsPage() {
  const { admin, setAdmin } = useAuth();
  const { notify } = useToast();

  const [username, setUsername] = useState(admin?.username ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useSeo({
    title: 'Settings',
    description: 'Manage the FREE2WATCH administrator credentials and review platform security.',
  });

  useEffect(() => {
    if (admin?.username) setUsername(admin.username);
  }, [admin?.username]);

  const passwordChecks = useMemo(
    () => [
      { label: 'At least 8 characters', met: newPassword.length >= 8 },
      { label: 'Contains a number', met: /\d/.test(newPassword) },
      { label: 'Contains a letter', met: /[a-zA-Z]/.test(newPassword) },
      { label: 'Matches confirmation', met: newPassword.length > 0 && newPassword === confirmPassword },
    ],
    [newPassword, confirmPassword]
  );

  const changeSummary = useMemo(() => {
    const changes: string[] = [];
    if (admin && username.trim() && username.trim().toLowerCase() !== admin.username.toLowerCase()) {
      changes.push('username');
    }
    if (newPassword) changes.push('password');
    return changes;
  }, [admin, username, newPassword]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!currentPassword) {
      setError('Enter your current password to confirm this change.');
      return;
    }
    if (newPassword && newPassword.length < 6) {
      setError('The new password must be at least 6 characters.');
      return;
    }
    if (newPassword && newPassword !== confirmPassword) {
      setError('The new password and its confirmation do not match.');
      return;
    }
    if (!changeSummary.length) {
      setError('Nothing to update. Choose a new username or a new password.');
      return;
    }

    setSaving(true);
    try {
      const updated = await authService.updateCredentials({
        current_password: currentPassword,
        username: username.trim() || undefined,
        password: newPassword || undefined,
      });
      setAdmin(updated);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccess('Credentials updated. Your session has been refreshed automatically.');
      notify('Administrator credentials updated', 'success');
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not update the administrator credentials.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <span className="eyebrow">System</span>
        <h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-white">Settings</h2>
        <p className="mt-1 max-w-2xl text-xs leading-relaxed text-zinc-500">
          FREE2WATCH has a single administrator account. There is no public registration, so these are
          the only credentials that can access the dashboard.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        {/* Credentials form */}
        <form onSubmit={submit} className="panel p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/15 text-brand-300 ring-1 ring-brand-500/25">
              <KeyRound size={18} />
            </span>
            <div>
              <h3 className="font-display text-base font-bold text-white">Administrator credentials</h3>
              <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-500">
                Updating your credentials signs you back in with a fresh secure session cookie.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <Field
              label="Current password"
              htmlFor="current-password"
              required
              hint="Required for every credentials change."
            >
              <div className="relative">
                <Lock size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  id="current-password"
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  className="input px-10"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((value) => !value)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-zinc-500 transition hover:text-white"
                  aria-label={showCurrent ? 'Hide current password' : 'Show current password'}
                >
                  {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </Field>

            <div className="h-px bg-white/[0.07]" />

            <Field
              label="Username"
              htmlFor="admin-username"
              hint="3–40 characters. Used together with the password to sign in."
            >
              <div className="relative">
                <User size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  id="admin-username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="input pl-10"
                  placeholder="admin"
                  autoComplete="username"
                  maxLength={40}
                />
              </div>
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="New password" htmlFor="new-password" hint="Leave empty to keep the current one.">
                <div className="relative">
                  <Lock size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    id="new-password"
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    className="input px-10"
                    placeholder="New password"
                    autoComplete="new-password"
                    maxLength={200}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((value) => !value)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-zinc-500 transition hover:text-white"
                    aria-label={showNew ? 'Hide new password' : 'Show new password'}
                  >
                    {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </Field>

              <Field label="Confirm new password" htmlFor="confirm-password">
                <div className="relative">
                  <ShieldCheck size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    id="confirm-password"
                    type={showNew ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="input pl-10"
                    placeholder="Repeat password"
                    autoComplete="new-password"
                    maxLength={200}
                  />
                </div>
              </Field>
            </div>

            {newPassword && (
              <div className="grid gap-1.5 rounded-xl border border-white/10 bg-white/[0.02] p-3 sm:grid-cols-2">
                {passwordChecks.map((check) => (
                  <span
                    key={check.label}
                    className={cn(
                      'inline-flex items-center gap-2 text-[11px]',
                      check.met ? 'text-emerald-300' : 'text-zinc-500'
                    )}
                  >
                    <CheckCircle2 size={13} className={check.met ? 'text-emerald-400' : 'text-zinc-600'} />
                    {check.label}
                  </span>
                ))}
              </div>
            )}

            {error && (
              <p
                className="flex items-start gap-2 rounded-xl border border-brand-500/30 bg-brand-500/10 px-3.5 py-2.5 text-xs font-medium text-brand-200"
                role="alert"
              >
                <TriangleAlert size={14} className="mt-0.5 shrink-0" />
                {error}
              </p>
            )}

            {success && (
              <p
                className="flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 text-xs font-medium text-emerald-200"
                role="status"
              >
                <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
                {success}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <p className="text-[11px] text-zinc-600">
                {changeSummary.length
                  ? `Pending change: ${changeSummary.join(' and ')}`
                  : 'No credential changes selected yet.'}
              </p>
              <Button
                type="submit"
                loading={saving}
                icon={<Save size={15} />}
                disabled={!currentPassword || !changeSummary.length}
              >
                {saving ? 'Saving…' : 'Save credentials'}
              </Button>
            </div>
          </div>
        </form>

        {/* Security + system info */}
        <div className="space-y-4">
          <section className="panel p-5">
            <div className="flex items-center gap-2.5">
              <ShieldCheck size={17} className="text-brand-400" />
              <h3 className="font-display text-sm font-bold text-white">Security checklist</h3>
            </div>
            <ul className="mt-4 space-y-3">
              {[
                'Change the default admin/admin password before exposing the site.',
                'Use a unique password with at least 8 characters and a number.',
                'Sessions use an HTTP-only cookie and a signed JWT — never stored in localStorage.',
                'Login attempts are rate-limited by the API to slow down brute force.',
                'The dashboard is noindex and never linked from the public navigation.',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-[11px] leading-relaxed text-zinc-400">
                  <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-emerald-400/80" />
                  {item}
                </li>
              ))}
            </ul>

            {admin?.username?.toLowerCase() === 'admin' && (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-500/25 bg-amber-500/[0.07] p-3 text-[11px] leading-relaxed text-amber-200/85">
                <TriangleAlert size={14} className="mt-0.5 shrink-0" />
                This dashboard is still using the default <strong className="font-semibold">admin</strong>{' '}
                username. Consider changing both the username and password.
              </div>
            )}
          </section>

          <section className="panel p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <DollarSign size={17} className="text-brand-400" />
                <h3 className="font-display text-sm font-bold text-white">Monetization</h3>
              </div>
              <span className="badge bg-brand-500/10 text-brand-300 ring-1 ring-brand-500/20 text-[10px]">
                AdSense
              </span>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-zinc-400">
              Configure Google AdSense publisher credentials, ad slots (header, in-feed, watch page), and automated ads.txt.
            </p>
            <div className="mt-4">
              <Link
                to="/admin/adsense"
                className="btn-secondary w-full justify-between text-xs"
              >
                <span>Manage Google AdSense</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </section>

          <section className="panel p-5">
            <div className="flex items-center gap-2.5">
              <Database size={17} className="text-brand-400" />
              <h3 className="font-display text-sm font-bold text-white">Environment</h3>
            </div>
            <dl className="mt-4 divide-y divide-white/[0.06] text-[11px]">
              {[
                { label: 'Signed in as', value: admin?.username ?? '—' },
                { label: 'Role', value: 'Administrator' },
                { label: 'API base', value: '/api (proxied to port 5000)' },
                { label: 'Database', value: 'SQLite · server/database/free2watch.db' },
                { label: 'Session', value: 'JWT · HTTP-only cookie · 7 days' },
              ].map((row) => (
                <div key={row.label} className="flex items-start justify-between gap-4 py-2.5">
                  <dt className="text-zinc-500">{row.label}</dt>
                  <dd className="text-right font-medium text-zinc-300">{row.value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 flex items-center gap-1.5 text-[10px] text-zinc-600">
              <Cookie size={12} /> Credentials are hashed with bcrypt before being stored.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
