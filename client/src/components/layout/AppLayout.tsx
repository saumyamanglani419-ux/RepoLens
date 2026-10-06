import { useEffect, useState, type ReactNode } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LuHistory, LuLayoutDashboard, LuLogOut, LuMenu, LuScanSearch, LuSettings, LuX } from 'react-icons/lu';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Logo } from '@/components/ui/Logo';
import { Avatar } from '@/components/ui/primitives';
import { cn } from '@/lib/format';

const NAV = [
  { to: '/app', label: 'Dashboard', icon: LuLayoutDashboard, end: true },
  { to: '/app/analyze', label: 'New analysis', icon: LuScanSearch, end: false },
  { to: '/app/history', label: 'History', icon: LuHistory, end: false },
  { to: '/app/settings', label: 'Settings', icon: LuSettings, end: false },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.info('Signed out', 'See you next time.');
    navigate('/', { replace: true });
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center px-5">
        <Logo to="/app" />
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Main">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive ? 'bg-zinc-800/80 text-zinc-50' : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-100',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={cn('h-4 w-4', isActive ? 'text-brand-300' : 'text-zinc-500 group-hover:text-zinc-300')} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-zinc-800/80 p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <Avatar name={user?.name ?? '?'} className="h-8 w-8 text-xs" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-zinc-100">{user?.name}</p>
            <p className="truncate text-xs text-zinc-500">{user?.email}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-md p-2 text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-200"
            aria-label="Sign out"
            title="Sign out"
          >
            <LuLogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  return (
    <div className="min-h-screen">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-zinc-800/80 bg-zinc-950/95 lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-zinc-800/80 bg-zinc-950/90 px-4 backdrop-blur lg:hidden">
        <Logo to="/app" />
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="rounded-md p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
          aria-label="Open navigation"
          aria-expanded={mobileOpen}
        >
          <LuMenu className="h-5 w-5" />
        </button>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <div className="absolute inset-0 animate-fade-in bg-black/70" onClick={() => setMobileOpen(false)} aria-hidden />
          <div className="absolute inset-y-0 left-0 w-72 animate-slide-up border-r border-zinc-800 bg-zinc-950">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 rounded-md p-1.5 text-zinc-400 hover:bg-zinc-800"
              aria-label="Close navigation"
            >
              <LuX className="h-5 w-5" />
            </button>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <main className="lg:pl-64">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">{title}</h1>
        {description && <p className="mt-1 text-sm text-zinc-400">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
