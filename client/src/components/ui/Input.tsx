import { forwardRef, useId, useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { LuEye, LuEyeOff } from 'react-icons/lu';
import { cn } from '@/lib/format';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
}

export const inputClasses =
  'block w-full rounded-lg border bg-zinc-900/80 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 transition focus:outline-none focus:ring-2 disabled:opacity-60';

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, icon, className, id, type = 'text', ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const [reveal, setReveal] = useState(false);
  const isPassword = type === 'password';
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

  return (
    <div className={className}>
      {label && (
        <label htmlFor={inputId} className="label">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-zinc-500">{icon}</span>
        )}
        <input
          ref={ref}
          id={inputId}
          type={isPassword && reveal ? 'text' : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            inputClasses,
            icon ? 'pl-10' : '',
            isPassword ? 'pr-10' : '',
            error
              ? 'border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/20'
              : 'border-zinc-700/80 focus:border-brand-400 focus:ring-brand-400/20',
          )}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setReveal((v) => !v)}
            className="absolute inset-y-0 right-0 flex items-center rounded-r-lg px-3 text-zinc-500 hover:text-zinc-300"
            aria-label={reveal ? 'Hide password' : 'Show password'}
          >
            {reveal ? <LuEyeOff className="h-4 w-4" /> : <LuEye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {error ? (
        <p id={`${inputId}-error`} className="mt-1.5 text-xs text-rose-400">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="mt-1.5 text-xs text-zinc-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
});
