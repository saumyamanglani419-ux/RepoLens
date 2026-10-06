import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { LogoMark } from '@/components/ui/Logo';
import { Spinner } from '@/components/ui/Spinner';

function FullScreenLoader() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4" role="status" aria-label="Loading">
      <LogoMark className="h-10 w-10" />
      <Spinner className="h-5 w-5 text-zinc-500" />
    </div>
  );
}

/** Only signed-in users; others are sent to /login and come back afterwards. */
export function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <FullScreenLoader />;
  if (!user) return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  return <Outlet />;
}

/** Only signed-out users (login / register). */
export function GuestRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <FullScreenLoader />;
  if (user) return <Navigate to={(location.state as { from?: string } | null)?.from || '/app'} replace />;
  return <Outlet />;
}
