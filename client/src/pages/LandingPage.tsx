import { useNavigate } from 'react-router-dom';
import {
  LuActivity,
  LuArrowRight,
  LuBraces,
  LuGithub,
  LuHistory,
  LuLayers,
  LuListTree,
  LuLock,
  LuRoute,
  LuScanSearch,
  LuZap,
} from 'react-icons/lu';
import { useAuth } from '@/context/AuthContext';
import { AnalyzeForm } from '@/components/analysis/AnalyzeForm';
import { HealthRing, LanguageBar } from '@/components/analysis/charts';
import { MethodBadge } from '@/components/analysis/EndpointsTab';
import { ButtonLink } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';

const FEATURES = [
  { icon: LuLayers, title: 'Tech stack detection', text: 'Frameworks, databases, ORMs, testing, CI/CD and hosting, each with the evidence that gave it away.' },
  { icon: LuBraces, title: 'Dependency insight', text: 'Production and dev dependencies from 11 manifest formats across 9 ecosystems, linked to their registries.' },
  { icon: LuRoute, title: 'API endpoint mapping', text: 'Static route discovery for Express, NestJS, Next.js, FastAPI, Flask, Django, Spring, Gin, Rails and more.' },
  { icon: LuListTree, title: 'Structure explorer', text: 'Searchable file tree, folder roles, config files and entry points so you know where to start reading.' },
  { icon: LuActivity, title: 'Health score', text: 'Weighted checks for tests, CI, docs, licensing, linting, lockfiles, committed secrets and activity.' },
  { icon: LuHistory, title: 'Analysis history', text: 'Every report is saved. Re-analyze anytime and see how the health score moved since the last run.' },
];

const STEPS = [
  { n: '01', title: 'Paste a URL', text: 'Any public GitHub repository, in any common format.' },
  { n: '02', title: 'We read the repo', text: 'Metadata, the full git tree and key files via the GitHub API. Nothing is cloned or executed.' },
  { n: '03', title: 'Get the map', text: 'A structured report you can explore, share as JSON and revisit later.' },
];

const ECOSYSTEMS = ['JavaScript', 'TypeScript', 'Python', 'Go', 'Rust', 'Java', 'Kotlin', 'Ruby', 'PHP', 'C#', 'Dart'];

const PREVIEW_LANGS = [
  { name: 'TypeScript', percent: 71.4, color: '#3178c6' },
  { name: 'JavaScript', percent: 17.2, color: '#f1e05a' },
  { name: 'CSS', percent: 8.9, color: '#663399' },
  { name: 'Shell', percent: 2.5, color: '#89e051' },
];

function ProductPreview() {
  return (
    <div className="relative mx-auto mt-16 max-w-5xl" aria-hidden>
      <div className="absolute -inset-x-10 -top-10 bottom-0 rounded-[2rem] bg-gradient-to-b from-brand-500/20 via-accent-400/5 to-transparent blur-2xl" />
      <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/90 shadow-2xl shadow-black/60">
        <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
          <span className="ml-3 truncate rounded-md bg-zinc-900 px-3 py-1 font-mono text-xs text-zinc-500">repolens.app/analyses/acme/storefront</span>
        </div>
        <div className="grid gap-4 p-4 sm:p-6 md:grid-cols-3">
          <div className="card flex flex-col items-center p-5">
            <HealthRing score={88} grade="A" size={116} />
            <p className="mt-3 text-sm text-zinc-400">Repository health</p>
          </div>
          <div className="card p-5 md:col-span-2">
            <p className="mb-4 text-sm font-medium text-zinc-200">Languages</p>
            <LanguageBar languages={PREVIEW_LANGS} />
            <div className="mt-5 flex flex-wrap gap-2">
              {['Next.js', 'React', 'PostgreSQL', 'Prisma', 'Tailwind CSS', 'Vitest', 'GitHub Actions'].map((t) => (
                <span key={t} className="rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-zinc-300">
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div className="card p-5 md:col-span-3">
            <p className="mb-3 text-sm font-medium text-zinc-200">API endpoints</p>
            <ul className="space-y-2 font-mono text-[13px]">
              {[
                ['GET', '/api/products', 'app/api/products/route.ts'],
                ['POST', '/api/checkout', 'app/api/checkout/route.ts'],
                ['PATCH', '/api/cart/:id', 'app/api/cart/[id]/route.ts'],
                ['DELETE', '/api/cart/:id', 'app/api/cart/[id]/route.ts'],
              ].map(([m, p, f]) => (
                <li key={m + p} className="flex items-center gap-3">
                  <MethodBadge method={m} />
                  <span className="text-zinc-200">{p}</span>
                  <span className="ml-auto hidden truncate text-xs text-zinc-600 sm:block">{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const start = (url: string) => {
    const target = `/app/analyze?url=${encodeURIComponent(url)}`;
    if (user) navigate(target);
    else navigate('/register', { state: { from: target } });
  };

  return (
    <div className="relative overflow-x-hidden">
      <header className="sticky top-0 z-40 border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <nav className="flex items-center gap-2" aria-label="Account">
            {user ? (
              <ButtonLink to="/app" size="sm">
                Open dashboard <LuArrowRight className="h-4 w-4" />
              </ButtonLink>
            ) : (
              <>
                <ButtonLink to="/login" variant="ghost" size="sm">
                  Sign in
                </ButtonLink>
                <ButtonLink to="/register" size="sm">
                  Get started
                </ButtonLink>
              </>
            )}
          </nav>
        </div>
      </header>

      <main>
        <section className="relative px-4 pb-20 pt-16 sm:px-6 sm:pt-24">
          <div className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_70%)]" aria-hidden />
          <div className="pointer-events-none absolute left-1/2 top-0 h-80 w-[48rem] -translate-x-1/2 rounded-full bg-brand-500/20 blur-3xl" aria-hidden />
          <div className="relative mx-auto max-w-3xl text-center">
            <a
              href="#features"
              className="inline-flex animate-fade-in items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/80 px-3 py-1 text-xs text-zinc-300 hover:border-zinc-700"
            >
              <LuZap className="h-3.5 w-3.5 text-amber-300" /> Rule-based analysis · no AI guesswork
            </a>
            <h1 className="mt-6 animate-slide-up text-4xl font-bold tracking-tight text-zinc-50 sm:text-6xl">
              Understand any codebase <span className="text-gradient">at a glance.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl animate-slide-up text-base text-zinc-400 [animation-delay:80ms] sm:text-lg">
              RepoLens maps a GitHub repository’s languages, tech stack, dependencies, structure and API endpoints into one clear
              report, so you can onboard, review or evaluate a project in minutes instead of hours.
            </p>
            <div className="mx-auto mt-8 max-w-2xl animate-slide-up text-left [animation-delay:160ms]">
              <AnalyzeForm onSubmit={start} size="lg" submitLabel="Analyze free" />
            </div>
            <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-zinc-500">
              <LuLock className="h-3.5 w-3.5" /> Public repositories only · read-only GitHub API access
            </p>
          </div>
          <ProductPreview />
        </section>

        <section id="features" className="border-t border-zinc-800/60 px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl">
              <p className="text-sm font-medium text-brand-300">Everything in one report</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-50">The questions you ask on day one, answered.</h2>
              <p className="mt-3 text-zinc-400">What is it built with? Where does it start? What does the API look like? Is it well maintained?</p>
            </div>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, text }) => (
                <div key={title} className="card group p-6 transition hover:border-zinc-700">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/10 text-brand-300 ring-1 ring-brand-500/20 transition group-hover:bg-brand-500/20">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-semibold text-zinc-100">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-zinc-800/60 px-4 py-20 sm:px-6">
          <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-sm font-medium text-brand-300">How it works</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-50">From URL to insight in three steps</h2>
              <ol className="mt-8 space-y-6">
                {STEPS.map((s) => (
                  <li key={s.n} className="flex gap-4">
                    <span className="font-mono text-sm text-brand-300">{s.n}</span>
                    <div>
                      <p className="font-medium text-zinc-100">{s.title}</p>
                      <p className="mt-1 text-sm text-zinc-400">{s.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <div className="card p-6">
              <p className="text-sm font-medium text-zinc-200">Understands projects written in</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {ECOSYSTEMS.map((e) => (
                  <span key={e} className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 font-mono text-sm text-zinc-300">
                    {e}
                  </span>
                ))}
              </div>
              <p className="mt-6 text-sm text-zinc-400">
                Reads <code className="kbd">package.json</code> <code className="kbd">requirements.txt</code>{' '}
                <code className="kbd">pyproject.toml</code> <code className="kbd">go.mod</code> <code className="kbd">Cargo.toml</code>{' '}
                <code className="kbd">pom.xml</code> <code className="kbd">build.gradle</code> <code className="kbd">Gemfile</code>{' '}
                <code className="kbd">composer.json</code> and more.
              </p>
            </div>
          </div>
        </section>

        <section className="px-4 pb-24 sm:px-6">
          <div className="relative mx-auto max-w-4xl overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-br from-brand-600/20 via-zinc-900 to-zinc-900 p-10 text-center">
            <div className="pointer-events-none absolute -bottom-24 left-1/2 h-48 w-96 -translate-x-1/2 rounded-full bg-accent-400/10 blur-3xl" aria-hidden />
            <LuScanSearch className="mx-auto h-8 w-8 text-brand-300" />
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">Stop reading code blind.</h2>
            <p className="mx-auto mt-3 max-w-xl text-zinc-400">Create a free account and analyze your first repository in under a minute.</p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <ButtonLink to={user ? '/app/analyze' : '/register'} size="lg">
                {user ? 'Analyze a repository' : 'Create free account'} <LuArrowRight className="h-4 w-4" />
              </ButtonLink>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-800/60 px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-zinc-500 sm:flex-row">
          <Logo />
          <p>Built with React, Express, MongoDB and the GitHub REST API.</p>
          <a href="https://docs.github.com/en/rest" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-zinc-300">
            <LuGithub className="h-4 w-4" /> GitHub API
          </a>
        </div>
      </footer>
    </div>
  );
}
