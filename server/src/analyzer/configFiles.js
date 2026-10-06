import { basename, isVendored } from './files.js';

/**
 * Catalogue of notable configuration files.
 * `re` is tested against the full path; most are anchored to the basename.
 */
const CATALOG = [
  // Package & dependency manifests
  { re: /(^|\/)package\.json$/, category: 'Package manifest', description: 'Node.js package manifest: dependencies, scripts and metadata' },
  { re: /(^|\/)(package-lock\.json|yarn\.lock|pnpm-lock\.yaml|bun\.lockb?)$/, category: 'Lockfile', description: 'Locks exact JavaScript dependency versions for reproducible installs' },
  { re: /(^|\/)requirements[^/]*\.txt$/, category: 'Package manifest', description: 'Python dependency list for pip' },
  { re: /(^|\/)pyproject\.toml$/, category: 'Package manifest', description: 'Python project metadata, dependencies and tool configuration' },
  { re: /(^|\/)(Pipfile|setup\.py|setup\.cfg)$/, category: 'Package manifest', description: 'Python packaging configuration' },
  { re: /(^|\/)(poetry\.lock|Pipfile\.lock|uv\.lock)$/, category: 'Lockfile', description: 'Locks exact Python dependency versions' },
  { re: /(^|\/)go\.mod$/, category: 'Package manifest', description: 'Go module definition and dependencies' },
  { re: /(^|\/)go\.sum$/, category: 'Lockfile', description: 'Go dependency checksums' },
  { re: /(^|\/)Cargo\.toml$/, category: 'Package manifest', description: 'Rust crate manifest' },
  { re: /(^|\/)Cargo\.lock$/, category: 'Lockfile', description: 'Locks exact Rust crate versions' },
  { re: /(^|\/)composer\.json$/, category: 'Package manifest', description: 'PHP Composer dependencies' },
  { re: /(^|\/)Gemfile$/, category: 'Package manifest', description: 'Ruby gem dependencies (Bundler)' },
  { re: /(^|\/)Gemfile\.lock$/, category: 'Lockfile', description: 'Locks exact Ruby gem versions' },
  { re: /(^|\/)pom\.xml$/, category: 'Package manifest', description: 'Maven project object model (Java build & dependencies)' },
  { re: /(^|\/)(build|settings)\.gradle(\.kts)?$/, category: 'Package manifest', description: 'Gradle build script' },
  { re: /(^|\/)pubspec\.yaml$/, category: 'Package manifest', description: 'Dart / Flutter package manifest' },
  { re: /\.(csproj|sln)$/, category: 'Package manifest', description: '.NET project / solution file' },

  // Language & compiler
  { re: /(^|\/)tsconfig(\.[\w-]+)?\.json$/, category: 'Language', description: 'TypeScript compiler options' },
  { re: /(^|\/)jsconfig\.json$/, category: 'Language', description: 'JavaScript project & path alias settings' },
  { re: /(^|\/)(\.babelrc(\.json)?|babel\.config\.(js|json|cjs))$/, category: 'Build', description: 'Babel transpiler configuration' },
  { re: /(^|\/)\.(nvmrc|node-version|python-version|ruby-version|tool-versions)$/, category: 'Language', description: 'Pins the runtime version used for development' },

  // Build & bundling
  { re: /(^|\/)vite\.config\.(js|ts|mjs|cjs|mts)$/, category: 'Build', description: 'Vite dev server & bundler configuration' },
  { re: /(^|\/)webpack\.config\.(js|ts|cjs)$/, category: 'Build', description: 'Webpack bundler configuration' },
  { re: /(^|\/)rollup\.config\.(js|ts|mjs)$/, category: 'Build', description: 'Rollup bundler configuration' },
  { re: /(^|\/)next\.config\.(js|mjs|cjs|ts)$/, category: 'Framework', description: 'Next.js framework configuration' },
  { re: /(^|\/)nuxt\.config\.(js|ts|mjs)$/, category: 'Framework', description: 'Nuxt framework configuration' },
  { re: /(^|\/)svelte\.config\.(js|mjs|ts)$/, category: 'Framework', description: 'Svelte / SvelteKit configuration' },
  { re: /(^|\/)astro\.config\.(mjs|ts|js)$/, category: 'Framework', description: 'Astro site configuration' },
  { re: /(^|\/)angular\.json$/, category: 'Framework', description: 'Angular workspace configuration' },
  { re: /(^|\/)Makefile$/, category: 'Build', description: 'Make targets for common development tasks' },
  { re: /(^|\/)CMakeLists\.txt$/, category: 'Build', description: 'CMake build configuration' },
  { re: /(^|\/)(turbo|nx|lerna)\.json$/, category: 'Monorepo', description: 'Monorepo task runner configuration' },
  { re: /^pnpm-workspace\.yaml$/, category: 'Monorepo', description: 'pnpm workspace package globs' },

  // Styling
  { re: /(^|\/)tailwind\.config\.(js|cjs|mjs|ts)$/, category: 'Styling', description: 'Tailwind CSS theme & content configuration' },
  { re: /(^|\/)postcss\.config\.(js|cjs|mjs|json)$/, category: 'Styling', description: 'PostCSS plugin pipeline' },
  { re: /(^|\/)components\.json$/, category: 'Styling', description: 'shadcn/ui component registry settings' },

  // Code quality
  { re: /(^|\/)(\.eslintrc(\.\w+)?|eslint\.config\.(js|mjs|cjs|ts))$/, category: 'Code quality', description: 'ESLint linting rules' },
  { re: /(^|\/)(\.prettierrc(\.\w+)?|prettier\.config\.(js|cjs|mjs))$/, category: 'Code quality', description: 'Prettier formatting rules' },
  { re: /(^|\/)biome\.jsonc?$/, category: 'Code quality', description: 'Biome linter & formatter configuration' },
  { re: /(^|\/)\.editorconfig$/, category: 'Code quality', description: 'Editor-agnostic whitespace & encoding rules' },
  { re: /(^|\/)\.pre-commit-config\.ya?ml$/, category: 'Code quality', description: 'pre-commit git hook definitions' },
  { re: /(^|\/)(ruff\.toml|\.flake8|mypy\.ini|\.pylintrc|tox\.ini)$/, category: 'Code quality', description: 'Python linting / type-checking configuration' },
  { re: /(^|\/)\.golangci\.ya?ml$/, category: 'Code quality', description: 'golangci-lint configuration' },
  { re: /(^|\/)\.rubocop\.yml$/, category: 'Code quality', description: 'RuboCop Ruby style rules' },
  { re: /^\.husky\/[^/]+$/, category: 'Code quality', description: 'Husky git hook' },

  // Testing
  { re: /(^|\/)jest\.config\.(js|ts|mjs|cjs|json)$/, category: 'Testing', description: 'Jest test runner configuration' },
  { re: /(^|\/)vitest\.config\.(js|ts|mjs)$/, category: 'Testing', description: 'Vitest test runner configuration' },
  { re: /(^|\/)playwright\.config\.(js|ts)$/, category: 'Testing', description: 'Playwright end-to-end test configuration' },
  { re: /(^|\/)cypress\.config\.(js|ts)$/, category: 'Testing', description: 'Cypress end-to-end test configuration' },
  { re: /(^|\/)(pytest\.ini|conftest\.py)$/, category: 'Testing', description: 'pytest configuration / shared fixtures' },
  { re: /(^|\/)\.mocharc(\.\w+)?$/, category: 'Testing', description: 'Mocha test runner configuration' },

  // Containers & CI/CD
  { re: /(^|\/)Dockerfile(\.[\w-]+)?$/, category: 'Containers', description: 'Docker image build instructions' },
  { re: /(^|\/)(docker-)?compose(\.[\w-]+)?\.ya?ml$/, category: 'Containers', description: 'Docker Compose multi-container setup' },
  { re: /(^|\/)\.dockerignore$/, category: 'Containers', description: 'Files excluded from the Docker build context' },
  { re: /^\.github\/workflows\/[^/]+\.ya?ml$/, category: 'CI/CD', description: 'GitHub Actions workflow' },
  { re: /^\.gitlab-ci\.yml$/, category: 'CI/CD', description: 'GitLab CI pipeline' },
  { re: /^\.circleci\/config\.yml$/, category: 'CI/CD', description: 'CircleCI pipeline' },
  { re: /^\.travis\.yml$/, category: 'CI/CD', description: 'Travis CI pipeline' },
  { re: /(^|\/)Jenkinsfile$/, category: 'CI/CD', description: 'Jenkins pipeline' },
  { re: /^\.github\/dependabot\.ya?ml$/, category: 'CI/CD', description: 'Dependabot automated dependency updates' },
  { re: /(^|\/)renovate\.json5?$/, category: 'CI/CD', description: 'Renovate automated dependency updates' },

  // Deployment
  { re: /(^|\/)vercel\.json$/, category: 'Deployment', description: 'Vercel deployment settings' },
  { re: /(^|\/)netlify\.toml$/, category: 'Deployment', description: 'Netlify build & deploy settings' },
  { re: /(^|\/)Procfile$/, category: 'Deployment', description: 'Process types for Heroku-style platforms' },
  { re: /(^|\/)fly\.toml$/, category: 'Deployment', description: 'Fly.io app configuration' },
  { re: /(^|\/)render\.ya?ml$/, category: 'Deployment', description: 'Render blueprint' },
  { re: /(^|\/)wrangler\.(toml|jsonc?)$/, category: 'Deployment', description: 'Cloudflare Workers configuration' },
  { re: /(^|\/)serverless\.ya?ml$/, category: 'Deployment', description: 'Serverless Framework service definition' },
  { re: /(^|\/)firebase\.json$/, category: 'Deployment', description: 'Firebase hosting / functions configuration' },
  { re: /\.tf$/, category: 'Infrastructure', description: 'Terraform infrastructure-as-code' },

  // Database
  { re: /(^|\/)schema\.prisma$/, category: 'Database', description: 'Prisma data model & datasource' },
  { re: /(^|\/)drizzle\.config\.(ts|js)$/, category: 'Database', description: 'Drizzle ORM migration configuration' },
  { re: /(^|\/)(ormconfig\.(json|js|ts)|knexfile\.(js|ts)|\.sequelizerc)$/, category: 'Database', description: 'ORM / query builder configuration' },
  { re: /(^|\/)alembic\.ini$/, category: 'Database', description: 'Alembic database migration configuration' },

  // Environment & repository
  { re: /(^|\/)\.env\.(example|sample|template|dist)$/, category: 'Environment', description: 'Template of required environment variables' },
  { re: /(^|\/)\.env(\.local|\.development|\.production)?$/, category: 'Environment', description: 'Environment variables file committed to the repository' },
  { re: /^\.gitignore$/, category: 'Repository', description: 'Files Git should ignore' },
  { re: /^\.gitattributes$/, category: 'Repository', description: 'Git path attributes (line endings, LFS, linguist)' },
  { re: /^(\.github\/)?CODEOWNERS$/, category: 'Repository', description: 'Code review ownership rules' },
  { re: /^\.github\/(ISSUE_TEMPLATE\/[^/]+|PULL_REQUEST_TEMPLATE\.md|pull_request_template\.md)$/, category: 'Repository', description: 'Issue / pull request template' },
  { re: /^\.vscode\/(settings|extensions|launch)\.json$/, category: 'Editor', description: 'Shared VS Code workspace settings' },
  { re: /^\.devcontainer\/devcontainer\.json$/, category: 'Editor', description: 'Dev Container definition' },
];

/** Returns every notable configuration file (max 150) with its category and purpose. */
export function detectConfigFiles(paths) {
  const results = [];
  for (const path of paths) {
    if (isVendored(path)) continue;
    const entry = CATALOG.find((c) => c.re.test(path));
    if (entry) {
      results.push({ path, name: basename(path), category: entry.category, description: entry.description });
    }
  }
  results.sort((a, b) => a.path.split('/').length - b.path.split('/').length || a.path.localeCompare(b.path));

  const byCategory = {};
  for (const r of results) byCategory[r.category] = (byCategory[r.category] || 0) + 1;

  return { files: results.slice(0, 150), total: results.length, byCategory };
}
