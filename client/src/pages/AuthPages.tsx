import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LuLock, LuMail, LuUser } from 'react-icons/lu';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { toApiError } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Logo } from '@/components/ui/Logo';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validatePassword(pw: string): string | undefined {
  if (pw.length < 8) return 'Use at least 8 characters';
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return 'Include at least one letter and one number';
  return undefined;
}

function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer: ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12">
      <div className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" aria-hidden />
      <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-brand-500/15 blur-3xl" aria-hidden />
      <div className="relative w-full max-w-sm animate-slide-up">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="card p-6 sm:p-7">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-50">{title}</h1>
          <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
        <p className="mt-6 text-center text-sm text-zinc-400">{footer}</p>
      </div>
    </div>
  );
}

type Errors = Partial<Record<'name' | 'email' | 'password' | 'confirm', string>>;

export function LoginPage() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from || '/app';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next: Errors = {};
    if (!EMAIL_RE.test(email.trim())) next.email = 'Enter a valid email address';
    if (!password) next.password = 'Password is required';
    setErrors(next);
    setFormError(null);
    if (Object.keys(next).length) return;

    setLoading(true);
    try {
      const user = await login(email.trim(), password);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      navigate(from, { replace: true });
    } catch (err) {
      const apiErr = toApiError(err);
      setFormError(apiErr.message);
      if (apiErr.fields) setErrors(apiErr.fields as Errors);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Sign in"
      subtitle="Welcome back. Pick up where you left off."
      footer={
        <>
          New to RepoLens?{' '}
          <Link to="/register" className="font-medium text-brand-300 hover:text-brand-200">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="space-y-4">
        {formError && (
          <div role="alert" className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
            {formError}
          </div>
        )}
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          icon={<LuMail className="h-4 w-4" />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          placeholder="you@example.com"
          autoFocus
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          icon={<LuLock className="h-4 w-4" />}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          placeholder="••••••••"
        />
        <Button type="submit" className="w-full" loading={loading}>
          Sign in
        </Button>
      </form>
    </AuthShell>
  );
}

export function RegisterPage() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from || '/app/analyze';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const strength = [password.length >= 8, /[A-Za-z]/.test(password) && /\d/.test(password), password.length >= 12, /[^A-Za-z0-9]/.test(password)].filter(Boolean).length;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next: Errors = {};
    if (name.trim().length < 2) next.name = 'Enter your name (at least 2 characters)';
    if (!EMAIL_RE.test(email.trim())) next.email = 'Enter a valid email address';
    const pwError = validatePassword(password);
    if (pwError) next.password = pwError;
    if (confirm !== password) next.confirm = 'Passwords do not match';
    setErrors(next);
    setFormError(null);
    if (Object.keys(next).length) return;

    setLoading(true);
    try {
      await register(name.trim(), email.trim(), password);
      toast.success('Account created', 'Paste a GitHub URL to run your first analysis.');
      navigate(from, { replace: true });
    } catch (err) {
      const apiErr = toApiError(err);
      setFormError(apiErr.message);
      if (apiErr.fields) setErrors(apiErr.fields as Errors);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Free forever for public repositories."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-brand-300 hover:text-brand-200">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="space-y-4">
        {formError && (
          <div role="alert" className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
            {formError}
          </div>
        )}
        <Input label="Name" autoComplete="name" icon={<LuUser className="h-4 w-4" />} value={name} onChange={(e) => setName(e.target.value)} error={errors.name} placeholder="Ada Lovelace" autoFocus />
        <Input label="Email" type="email" autoComplete="email" icon={<LuMail className="h-4 w-4" />} value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} placeholder="you@example.com" />
        <div>
          <Input
            label="Password"
            type="password"
            autoComplete="new-password"
            icon={<LuLock className="h-4 w-4" />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            hint="At least 8 characters with a letter and a number"
            placeholder="••••••••"
          />
          {password && (
            <div className="mt-2 flex gap-1" aria-label={`Password strength ${strength} of 4`}>
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full ${i < strength ? (strength <= 1 ? 'bg-rose-500' : strength === 2 ? 'bg-amber-400' : 'bg-emerald-400') : 'bg-zinc-800'}`}
                />
              ))}
            </div>
          )}
        </div>
        <Input label="Confirm password" type="password" autoComplete="new-password" icon={<LuLock className="h-4 w-4" />} value={confirm} onChange={(e) => setConfirm(e.target.value)} error={errors.confirm} placeholder="••••••••" />
        <Button type="submit" className="w-full" loading={loading}>
          Create account
        </Button>
      </form>
    </AuthShell>
  );
}
