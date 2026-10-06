import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { LuKeyRound, LuShieldAlert, LuUserRound } from 'react-icons/lu';
import { authApi, toApiError } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { PageHeader } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Card, CardHeader } from '@/components/ui/primitives';
import { formatDate } from '@/lib/format';
import { validatePassword } from './AuthPages';

function ProfileCard() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [name, setName] = useState(user?.name ?? '');
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) return setError('Name must be at least 2 characters');
    setError(undefined);
    setSaving(true);
    try {
      setUser(await authApi.updateProfile({ name: name.trim() }));
      toast.success('Profile updated');
    } catch (err) {
      setError(toApiError(err).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader title="Profile" description={`Member since ${formatDate(user?.createdAt)}`} icon={<LuUserRound className="h-4 w-4" />} />
      <form onSubmit={submit} noValidate className="space-y-4 p-5">
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} error={error} autoComplete="name" />
        <Input label="Email" value={user?.email ?? ''} disabled hint="Email changes are not supported yet." />
        <div className="flex justify-end">
          <Button type="submit" loading={saving} disabled={name.trim() === user?.name}>
            Save changes
          </Button>
        </div>
      </form>
    </Card>
  );
}

function PasswordCard() {
  const toast = useToast();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!current) errs.currentPassword = 'Enter your current password';
    const pw = validatePassword(next);
    if (pw) errs.newPassword = pw;
    if (next !== confirm) errs.confirm = 'Passwords do not match';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      await authApi.changePassword({ currentPassword: current, newPassword: next });
      toast.success('Password changed');
      setCurrent('');
      setNext('');
      setConfirm('');
    } catch (err) {
      const apiErr = toApiError(err);
      setErrors(apiErr.fields ?? { form: apiErr.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader title="Password" description="Use a strong password you don't use elsewhere" icon={<LuKeyRound className="h-4 w-4" />} />
      <form onSubmit={submit} noValidate className="space-y-4 p-5">
        {errors.form && <p role="alert" className="text-sm text-rose-400">{errors.form}</p>}
        <Input label="Current password" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} error={errors.currentPassword} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="New password" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} error={errors.newPassword} />
          <Input label="Confirm new password" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} error={errors.confirm} />
        </div>
        <div className="flex justify-end">
          <Button type="submit" loading={saving}>
            Update password
          </Button>
        </div>
      </form>
    </Card>
  );
}

function DangerZone() {
  const { setUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>();
  const [deleting, setDeleting] = useState(false);

  const close = () => {
    setOpen(false);
    setPassword('');
    setError(undefined);
  };

  const remove = async () => {
    if (!password) return setError('Enter your password to confirm');
    setDeleting(true);
    try {
      await authApi.deleteAccount({ password });
      setUser(null);
      toast.info('Account deleted', 'All your data has been removed.');
      navigate('/', { replace: true });
    } catch (err) {
      setError(toApiError(err).message);
      setDeleting(false);
    }
  };

  return (
    <Card className="border-rose-500/20">
      <CardHeader title="Danger zone" description="Irreversible account actions" icon={<LuShieldAlert className="h-4 w-4 text-rose-400" />} />
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-100">Delete account</p>
          <p className="mt-0.5 text-sm text-zinc-400">Permanently delete your account and every saved analysis.</p>
        </div>
        <Button variant="danger" onClick={() => setOpen(true)}>
          Delete account
        </Button>
      </div>
      <Modal
        open={open}
        onClose={close}
        title="Delete your account?"
        description="This permanently deletes your account and all analyses. Enter your password to confirm."
        footer={
          <>
            <Button variant="ghost" onClick={close} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => void remove()} loading={deleting}>
              Delete forever
            </Button>
          </>
        }
      >
        <Input label="Password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} error={error} />
      </Modal>
    </Card>
  );
}

export function SettingsPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Settings" description="Manage your profile, password and account." />
      <div className="space-y-6">
        <ProfileCard />
        <PasswordCard />
        <DangerZone />
      </div>
    </div>
  );
}
