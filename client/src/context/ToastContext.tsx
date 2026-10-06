import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { LuCircleAlert, LuCircleCheck, LuInfo, LuX } from 'react-icons/lu';
import { cn } from '@/lib/format';

type ToastKind = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  kind: ToastKind;
  title: string;
  description?: string;
}

interface ToastApi {
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const ICONS = {
  success: <LuCircleCheck className="h-5 w-5 text-emerald-400" aria-hidden />,
  error: <LuCircleAlert className="h-5 w-5 text-rose-400" aria-hidden />,
  info: <LuInfo className="h-5 w-5 text-sky-400" aria-hidden />,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (kind: ToastKind, title: string, description?: string) => {
      const id = nextId.current++;
      setToasts((list) => [...list.slice(-3), { id, kind, title, description }]);
      window.setTimeout(() => dismiss(id), kind === 'error' ? 6500 : 4000);
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(
    () => ({
      success: (t, d) => push('success', t, d),
      error: (t, d) => push('error', t, d),
      info: (t, d) => push('info', t, d),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 p-4 sm:items-end sm:p-6"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.kind === 'error' ? 'alert' : 'status'}
            className={cn(
              'pointer-events-auto flex w-full max-w-sm animate-slide-up items-start gap-3 rounded-xl border bg-zinc-900/95 p-4 shadow-2xl shadow-black/40 backdrop-blur',
              t.kind === 'error' ? 'border-rose-500/30' : t.kind === 'success' ? 'border-emerald-500/30' : 'border-zinc-700',
            )}
          >
            <div className="mt-0.5 shrink-0">{ICONS[t.kind]}</div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-zinc-100">{t.title}</p>
              {t.description && <p className="mt-1 text-sm text-zinc-400">{t.description}</p>}
            </div>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="rounded-md p-1 text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-200"
              aria-label="Dismiss notification"
            >
              <LuX className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
