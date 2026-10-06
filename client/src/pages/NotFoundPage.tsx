import { LuArrowLeft } from 'react-icons/lu';
import { ButtonLink } from '@/components/ui/Button';
import { LogoMark } from '@/components/ui/Logo';

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <LogoMark className="h-12 w-12" />
      <p className="mt-6 font-mono text-sm text-brand-300">404</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-50">Nothing to see here</h1>
      <p className="mt-2 max-w-sm text-zinc-400">The page you’re looking for doesn’t exist or has moved.</p>
      <ButtonLink to="/" variant="secondary" className="mt-8" icon={<LuArrowLeft className="h-4 w-4" />}>
        Back to home
      </ButtonLink>
    </div>
  );
}
