import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Lock, ShieldCheck, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiErrorMessage } from '../services/api';
import { useSeo } from '../hooks/useSeo';
import { Logo } from '../components/Logo';

export function AdminLoginPage() {
  const { admin, loading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useSeo({
    title: 'Administrator sign in',
    description: 'Secure administrator access to the FREE2WATCH dashboard.',
  });

  useEffect(() => {
    const robots = document.createElement('meta');
    robots.name = 'robots';
    robots.content = 'noindex, nofollow';
    document.head.appendChild(robots);
    return () => {
      robots.remove();
    };
  }, []);

  const from = (location.state as { from?: string } | null)?.from ?? '/admin';

  if (!loading && admin) {
    return <Navigate to="/admin" replace />;
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(username.trim(), password);
      navigate(from.startsWith('/admin') ? from : '/admin', { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err, 'Sign in failed. Check your credentials.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink-950 px-4 py-10">
      <div className="absolute inset-0">
        <div className="absolute -left-40 top-0 h-[520px] w-[520px] rounded-full bg-brand-500/10 blur-[120px]" />
        <div className="absolute -right-32 bottom-0 h-[460px] w-[460px] rounded-full bg-gold/[0.06] blur-[120px]" />
      </div>

      <div className="relative grid w-full max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-ink-900/80 shadow-panel backdrop-blur-xl lg:grid-cols-[1.05fr_1fr]">
        {/* Visual side */}
        <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-ink-800 via-ink-900 to-ink-950 p-9 lg:flex">
          <img
            src="/assets/logo-mark.png"
            alt=""
            aria-hidden="true"
            className="absolute -bottom-10 -right-10 w-64 opacity-[0.06]"
          />
          <Logo size="md" />
          <div className="relative">
            <span className="eyebrow">Control room</span>
            <h1 className="mt-3 font-display text-3xl font-extrabold leading-tight text-white">
              Manage the entire catalogue from one calm place.
            </h1>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-zinc-400">
              Movies, series, TV shows, anime, seasons, episodes, categories and genres — all stored
              in SQLite and served through the FREE2WATCH API.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 text-[11px] text-zinc-500">
              <span className="chip">Single administrator</span>
              <span className="chip">Secure session</span>
              <span className="chip">Live statistics</span>
            </div>
          </div>
          <div className="relative flex items-center gap-2 text-[11px] text-zinc-600">
            <ShieldCheck size={14} className="text-brand-500" />
            Authorized staff access only
          </div>
        </div>

        {/* Form side */}
        <div className="p-7 sm:p-10">
          <div className="mb-8 flex items-center justify-between gap-4">
            <div className="lg:hidden">
              <Logo size="sm" />
            </div>
            <Link
              to="/"
              className="ml-auto text-[11px] font-semibold text-zinc-500 transition hover:text-white"
            >
              ← Back to website
            </Link>
          </div>

          <h2 className="font-display text-2xl font-bold text-white">Administrator sign in</h2>
          <p className="mt-1.5 text-sm text-zinc-500">
            There is no public registration. Only the FREE2WATCH administrator can sign in.
          </p>

          <form onSubmit={submit} className="mt-7 space-y-4">
            <div>
              <label htmlFor="username" className="label">Username</label>
              <div className="relative">
                <User size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  id="username"
                  name="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  autoComplete="username"
                  className="input pl-10"
                  placeholder="admin"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="label">Password</label>
              <div className="relative">
                <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  className="input px-10"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-zinc-500 transition hover:text-white"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-brand-500/30 bg-brand-500/10 px-3.5 py-2.5 text-xs font-medium text-brand-200" role="alert">
                {error}
              </div>
            )}

            <button type="submit" disabled={submitting} className="btn-primary w-full py-3">
              {submitting ? <Loader2 size={17} className="animate-spin" /> : <Lock size={16} />}
              {submitting ? 'Signing in…' : 'Sign in to dashboard'}
            </button>
          </form>

          <p className="mt-6 text-[11px] leading-relaxed text-zinc-600">
            Default development credentials are documented in the project README. Change them before
            deploying to a public server.
          </p>
        </div>
      </div>
    </div>
  );
}
