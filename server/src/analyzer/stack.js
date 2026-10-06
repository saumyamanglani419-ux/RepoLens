/**
 * Rule-based technology detection.
 *
 * Each rule lists the signals that imply a technology:
 *   - package names per ecosystem (exact, case-insensitive; maven/gradle use substring on "group:artifact")
 *   - file path patterns (RegExp tested against every path in the repository tree)
 *   - GitHub language names
 */

const F = 'Frontend';
const M = 'Meta-framework';
const B = 'Backend';
const DB = 'Database';
const ORM = 'ORM / Data access';
const S = 'Styling & UI';
const ST = 'State & Data fetching';
const T = 'Testing';
const BLD = 'Build tooling';
const Q = 'Code quality';
const OPS = 'DevOps & CI/CD';
const HOST = 'Hosting & Deployment';
const MOB = 'Mobile & Desktop';
const AUTH = 'Auth & Security';
const API = 'API & Realtime';
const DATA = 'Data & ML';
const RT = 'Language & Runtime';
const MONO = 'Monorepo';
const DOCS = 'Documentation';

export const STACK_RULES = [
  // ── Languages / runtimes ──
  { name: 'TypeScript', category: RT, npm: ['typescript'], files: [/(^|\/)tsconfig(\.[\w-]+)?\.json$/], languages: ['TypeScript'] },
  { name: 'Node.js', category: RT, files: [/(^|\/)package\.json$/, /(^|\/)\.nvmrc$/] },
  { name: 'Deno', category: RT, files: [/(^|\/)deno\.jsonc?$/] },
  { name: 'Bun', category: RT, npm: ['bun-types', '@types/bun'], files: [/(^|\/)bun\.lockb?$/, /(^|\/)bunfig\.toml$/] },
  { name: 'Python', category: RT, languages: ['Python'], files: [/(^|\/)(requirements[^/]*\.txt|pyproject\.toml|Pipfile|setup\.py)$/] },
  { name: 'Go', category: RT, languages: ['Go'], files: [/(^|\/)go\.mod$/] },
  { name: 'Rust', category: RT, languages: ['Rust'], files: [/(^|\/)Cargo\.toml$/] },
  { name: 'Java', category: RT, languages: ['Java'] },
  { name: 'Kotlin', category: RT, languages: ['Kotlin'] },
  { name: 'Ruby', category: RT, languages: ['Ruby'], files: [/(^|\/)Gemfile$/] },
  { name: 'PHP', category: RT, languages: ['PHP'], files: [/(^|\/)composer\.json$/] },
  { name: '.NET', category: RT, languages: ['C#', 'F#'], files: [/\.(csproj|fsproj|sln)$/] },
  { name: 'Dart', category: RT, languages: ['Dart'], files: [/(^|\/)pubspec\.yaml$/] },
  { name: 'Swift', category: RT, languages: ['Swift'], files: [/(^|\/)Package\.swift$/] },
  { name: 'Elixir', category: RT, languages: ['Elixir'], files: [/(^|\/)mix\.exs$/] },
  { name: 'C / C++', category: RT, languages: ['C', 'C++'], files: [/(^|\/)CMakeLists\.txt$/] },

  // ── Frontend frameworks ──
  { name: 'React', category: F, npm: ['react', 'react-dom'] },
  { name: 'Vue', category: F, npm: ['vue'], files: [/\.vue$/] },
  { name: 'Angular', category: F, npm: ['@angular/core'], files: [/(^|\/)angular\.json$/] },
  { name: 'Svelte', category: F, npm: ['svelte'], files: [/\.svelte$/] },
  { name: 'SolidJS', category: F, npm: ['solid-js'] },
  { name: 'Preact', category: F, npm: ['preact'] },
  { name: 'Alpine.js', category: F, npm: ['alpinejs'] },
  { name: 'Lit', category: F, npm: ['lit'] },
  { name: 'jQuery', category: F, npm: ['jquery'] },
  { name: 'htmx', category: F, npm: ['htmx.org'] },

  // ── Meta-frameworks ──
  { name: 'Next.js', category: M, npm: ['next'], files: [/(^|\/)next\.config\.(js|mjs|cjs|ts)$/] },
  { name: 'Nuxt', category: M, npm: ['nuxt'], files: [/(^|\/)nuxt\.config\.(js|ts|mjs)$/] },
  { name: 'Remix', category: M, npm: ['@remix-run/react', '@remix-run/node'] },
  { name: 'React Router', category: F, npm: ['react-router', 'react-router-dom'] },
  { name: 'SvelteKit', category: M, npm: ['@sveltejs/kit'] },
  { name: 'Astro', category: M, npm: ['astro'], files: [/(^|\/)astro\.config\.(mjs|ts|js)$/] },
  { name: 'Gatsby', category: M, npm: ['gatsby'] },
  { name: 'Expo', category: MOB, npm: ['expo'] },

  // ── Backend frameworks ──
  { name: 'Express', category: B, npm: ['express'] },
  { name: 'Fastify', category: B, npm: ['fastify'] },
  { name: 'NestJS', category: B, npm: ['@nestjs/core'] },
  { name: 'Koa', category: B, npm: ['koa'] },
  { name: 'Hono', category: B, npm: ['hono'] },
  { name: 'Hapi', category: B, npm: ['@hapi/hapi'] },
  { name: 'Django', category: B, pypi: ['django'], files: [/(^|\/)manage\.py$/] },
  { name: 'Django REST Framework', category: API, pypi: ['djangorestframework'] },
  { name: 'Flask', category: B, pypi: ['flask'] },
  { name: 'FastAPI', category: B, pypi: ['fastapi'] },
  { name: 'Starlette', category: B, pypi: ['starlette'] },
  { name: 'Gin', category: B, go: ['github.com/gin-gonic/gin'] },
  { name: 'Echo', category: B, go: ['github.com/labstack/echo/v4', 'github.com/labstack/echo'] },
  { name: 'Fiber', category: B, go: ['github.com/gofiber/fiber/v2', 'github.com/gofiber/fiber/v3'] },
  { name: 'Chi', category: B, go: ['github.com/go-chi/chi/v5', 'github.com/go-chi/chi'] },
  { name: 'Gorilla Mux', category: B, go: ['github.com/gorilla/mux'] },
  { name: 'Actix Web', category: B, cargo: ['actix-web'] },
  { name: 'Axum', category: B, cargo: ['axum'] },
  { name: 'Rocket', category: B, cargo: ['rocket'] },
  { name: 'Tokio', category: RT, cargo: ['tokio'] },
  { name: 'Spring Boot', category: B, maven: ['spring-boot'], gradle: ['spring-boot'] },
  { name: 'Ktor', category: B, gradle: ['io.ktor:'] },
  { name: 'Ruby on Rails', category: B, rubygems: ['rails'], files: [/(^|\/)config\/routes\.rb$/] },
  { name: 'Sinatra', category: B, rubygems: ['sinatra'] },
  { name: 'Laravel', category: B, composer: ['laravel/framework'], files: [/(^|\/)artisan$/] },
  { name: 'Symfony', category: B, composer: ['symfony/framework-bundle'] },
  { name: 'ASP.NET Core', category: B, files: [/(^|\/)Program\.cs$/, /(^|\/)appsettings\.json$/] },
  { name: 'Phoenix', category: B, files: [/(^|\/)lib\/[\w]+_web\//] },

  // ── API & realtime ──
  { name: 'GraphQL', category: API, npm: ['graphql', '@apollo/server', 'apollo-server', 'graphql-yoga', '@apollo/client', 'urql'], pypi: ['graphene', 'strawberry-graphql'], files: [/\.(graphql|gql)$/] },
  { name: 'tRPC', category: API, npm: ['@trpc/server', '@trpc/client'] },
  { name: 'gRPC', category: API, npm: ['@grpc/grpc-js'], go: ['google.golang.org/grpc'], pypi: ['grpcio'], files: [/\.proto$/] },
  { name: 'Socket.IO', category: API, npm: ['socket.io', 'socket.io-client'], pypi: ['python-socketio'] },
  { name: 'WebSockets (ws)', category: API, npm: ['ws'] },
  { name: 'Axios', category: API, npm: ['axios'] },
  { name: 'OpenAPI / Swagger', category: API, npm: ['swagger-ui-express', '@nestjs/swagger', 'swagger-jsdoc'], files: [/(^|\/)(openapi|swagger)\.(ya?ml|json)$/] },

  // ── Databases ──
  { name: 'MongoDB', category: DB, npm: ['mongodb', 'mongoose'], pypi: ['pymongo', 'motor'], go: ['go.mongodb.org/mongo-driver'] },
  { name: 'PostgreSQL', category: DB, npm: ['pg', 'postgres', '@neondatabase/serverless'], pypi: ['psycopg2', 'psycopg2-binary', 'psycopg', 'asyncpg'], go: ['github.com/lib/pq', 'github.com/jackc/pgx/v5'], rubygems: ['pg'], maven: ['postgresql'], gradle: ['postgresql'] },
  { name: 'MySQL', category: DB, npm: ['mysql', 'mysql2'], pypi: ['mysqlclient', 'pymysql'], go: ['github.com/go-sql-driver/mysql'], rubygems: ['mysql2'], maven: ['mysql-connector'] },
  { name: 'SQLite', category: DB, npm: ['sqlite3', 'better-sqlite3'], rubygems: ['sqlite3'], go: ['github.com/mattn/go-sqlite3'] },
  { name: 'Redis', category: DB, npm: ['redis', 'ioredis', '@upstash/redis'], pypi: ['redis'], go: ['github.com/redis/go-redis/v9', 'github.com/go-redis/redis/v8'], rubygems: ['redis'] },
  { name: 'Firebase', category: DB, npm: ['firebase', 'firebase-admin'], pypi: ['firebase-admin'], files: [/(^|\/)firebase\.json$/] },
  { name: 'Supabase', category: DB, npm: ['@supabase/supabase-js'], pypi: ['supabase'], files: [/(^|\/)supabase\/config\.toml$/] },
  { name: 'Elasticsearch', category: DB, npm: ['@elastic/elasticsearch'], pypi: ['elasticsearch'] },
  { name: 'DynamoDB', category: DB, npm: ['@aws-sdk/client-dynamodb'] },

  // ── ORMs ──
  { name: 'Mongoose', category: ORM, npm: ['mongoose'] },
  { name: 'Prisma', category: ORM, npm: ['prisma', '@prisma/client'], files: [/(^|\/)schema\.prisma$/] },
  { name: 'Drizzle ORM', category: ORM, npm: ['drizzle-orm'], files: [/(^|\/)drizzle\.config\.(ts|js)$/] },
  { name: 'TypeORM', category: ORM, npm: ['typeorm'] },
  { name: 'Sequelize', category: ORM, npm: ['sequelize'] },
  { name: 'Knex', category: ORM, npm: ['knex'] },
  { name: 'SQLAlchemy', category: ORM, pypi: ['sqlalchemy', 'flask-sqlalchemy'] },
  { name: 'GORM', category: ORM, go: ['gorm.io/gorm'] },
  { name: 'Diesel', category: ORM, cargo: ['diesel'] },
  { name: 'Hibernate / JPA', category: ORM, maven: ['hibernate', 'spring-boot-starter-data-jpa'], gradle: ['hibernate', 'spring-boot-starter-data-jpa'] },
  { name: 'Eloquent', category: ORM, composer: ['laravel/framework'] },

  // ── Styling & UI ──
  { name: 'Tailwind CSS', category: S, npm: ['tailwindcss', '@tailwindcss/vite', '@tailwindcss/postcss'], files: [/(^|\/)tailwind\.config\.(js|cjs|mjs|ts)$/] },
  { name: 'Sass', category: S, npm: ['sass', 'node-sass'], files: [/\.scss$/] },
  { name: 'styled-components', category: S, npm: ['styled-components'] },
  { name: 'Emotion', category: S, npm: ['@emotion/react', '@emotion/styled'] },
  { name: 'Material UI', category: S, npm: ['@mui/material', '@material-ui/core'] },
  { name: 'Chakra UI', category: S, npm: ['@chakra-ui/react'] },
  { name: 'Ant Design', category: S, npm: ['antd'] },
  { name: 'Bootstrap', category: S, npm: ['bootstrap', 'react-bootstrap'] },
  { name: 'shadcn/ui', category: S, files: [/(^|\/)components\.json$/] },
  { name: 'Radix UI', category: S, npmPrefix: ['@radix-ui/'] },
  { name: 'Framer Motion', category: S, npm: ['framer-motion', 'motion'] },
  { name: 'Chart.js', category: S, npm: ['chart.js', 'react-chartjs-2'] },
  { name: 'Recharts', category: S, npm: ['recharts'] },
  { name: 'D3', category: S, npm: ['d3'] },
  { name: 'Three.js', category: S, npm: ['three', '@react-three/fiber'] },

  // ── State / data fetching ──
  { name: 'Redux', category: ST, npm: ['redux', '@reduxjs/toolkit', 'react-redux'] },
  { name: 'Zustand', category: ST, npm: ['zustand'] },
  { name: 'MobX', category: ST, npm: ['mobx'] },
  { name: 'Jotai', category: ST, npm: ['jotai'] },
  { name: 'Pinia', category: ST, npm: ['pinia'] },
  { name: 'TanStack Query', category: ST, npm: ['@tanstack/react-query', 'react-query', '@tanstack/vue-query'] },
  { name: 'SWR', category: ST, npm: ['swr'] },
  { name: 'Zod', category: ST, npm: ['zod'] },
  { name: 'Pydantic', category: ST, pypi: ['pydantic'] },

  // ── Auth & security ──
  { name: 'JWT', category: AUTH, npm: ['jsonwebtoken', 'jose', '@nestjs/jwt'], pypi: ['pyjwt', 'python-jose'], go: ['github.com/golang-jwt/jwt/v5', 'github.com/golang-jwt/jwt/v4'] },
  { name: 'bcrypt', category: AUTH, npm: ['bcrypt', 'bcryptjs'], pypi: ['bcrypt', 'passlib'] },
  { name: 'Passport.js', category: AUTH, npm: ['passport'] },
  { name: 'NextAuth / Auth.js', category: AUTH, npm: ['next-auth', '@auth/core'] },
  { name: 'Clerk', category: AUTH, npm: ['@clerk/nextjs', '@clerk/clerk-react', '@clerk/clerk-sdk-node'] },
  { name: 'Helmet', category: AUTH, npm: ['helmet'] },
  { name: 'Spring Security', category: AUTH, maven: ['spring-boot-starter-security'], gradle: ['spring-boot-starter-security'] },
  { name: 'Devise', category: AUTH, rubygems: ['devise'] },

  // ── Testing ──
  { name: 'Jest', category: T, npm: ['jest', 'ts-jest'], files: [/(^|\/)jest\.config\.(js|ts|mjs|cjs|json)$/] },
  { name: 'Vitest', category: T, npm: ['vitest'], files: [/(^|\/)vitest\.config\.(js|ts|mjs)$/] },
  { name: 'Mocha', category: T, npm: ['mocha'], files: [/(^|\/)\.mocharc/] },
  { name: 'Testing Library', category: T, npmPrefix: ['@testing-library/'] },
  { name: 'Cypress', category: T, npm: ['cypress'], files: [/(^|\/)cypress\.config\.(js|ts)$/] },
  { name: 'Playwright', category: T, npm: ['@playwright/test', 'playwright'], pypi: ['playwright', 'pytest-playwright'], files: [/(^|\/)playwright\.config\.(js|ts)$/] },
  { name: 'Supertest', category: T, npm: ['supertest'] },
  { name: 'Storybook', category: T, npmPrefix: ['@storybook/'], files: [/(^|\/)\.storybook\//] },
  { name: 'pytest', category: T, pypi: ['pytest'], files: [/(^|\/)(pytest\.ini|conftest\.py)$/] },
  { name: 'JUnit', category: T, maven: ['junit'], gradle: ['junit'] },
  { name: 'RSpec', category: T, rubygems: ['rspec', 'rspec-rails'], files: [/(^|\/)\.rspec$/] },
  { name: 'PHPUnit', category: T, composer: ['phpunit/phpunit'] },

  // ── Build tooling ──
  { name: 'Vite', category: BLD, npm: ['vite'], files: [/(^|\/)vite\.config\.(js|ts|mjs|cjs|mts)$/] },
  { name: 'Webpack', category: BLD, npm: ['webpack'], files: [/(^|\/)webpack\.config\.(js|ts|cjs)$/] },
  { name: 'Rollup', category: BLD, npm: ['rollup'], files: [/(^|\/)rollup\.config\.(js|ts|mjs)$/] },
  { name: 'esbuild', category: BLD, npm: ['esbuild'] },
  { name: 'Turbopack / SWC', category: BLD, npm: ['@swc/core'] },
  { name: 'Babel', category: BLD, npm: ['@babel/core'], files: [/(^|\/)(\.babelrc(\.json)?|babel\.config\.(js|json|cjs))$/] },
  { name: 'Parcel', category: BLD, npm: ['parcel'] },
  { name: 'tsup', category: BLD, npm: ['tsup'] },
  { name: 'Maven', category: BLD, files: [/(^|\/)pom\.xml$/] },
  { name: 'Gradle', category: BLD, files: [/(^|\/)build\.gradle(\.kts)?$/] },
  { name: 'Poetry', category: BLD, files: [/(^|\/)poetry\.lock$/] },
  { name: 'uv', category: BLD, files: [/(^|\/)uv\.lock$/] },
  { name: 'Make', category: BLD, files: [/(^|\/)Makefile$/] },

  // ── Monorepo ──
  { name: 'Turborepo', category: MONO, npm: ['turbo'], files: [/(^|\/)turbo\.json$/] },
  { name: 'Nx', category: MONO, npm: ['nx'], files: [/(^|\/)nx\.json$/] },
  { name: 'Lerna', category: MONO, npm: ['lerna'], files: [/(^|\/)lerna\.json$/] },
  { name: 'pnpm workspaces', category: MONO, files: [/^pnpm-workspace\.yaml$/] },

  // ── Code quality ──
  { name: 'ESLint', category: Q, npm: ['eslint'], files: [/(^|\/)(\.eslintrc(\.\w+)?|eslint\.config\.(js|mjs|cjs|ts))$/] },
  { name: 'Prettier', category: Q, npm: ['prettier'], files: [/(^|\/)(\.prettierrc(\.\w+)?|prettier\.config\.(js|cjs|mjs))$/] },
  { name: 'Biome', category: Q, npm: ['@biomejs/biome'], files: [/(^|\/)biome\.jsonc?$/] },
  { name: 'Husky', category: Q, npm: ['husky'], files: [/(^|\/)\.husky\//] },
  { name: 'lint-staged', category: Q, npm: ['lint-staged'] },
  { name: 'Ruff', category: Q, pypi: ['ruff'], files: [/(^|\/)ruff\.toml$/] },
  { name: 'Black', category: Q, pypi: ['black'] },
  { name: 'mypy', category: Q, pypi: ['mypy'], files: [/(^|\/)mypy\.ini$/] },
  { name: 'pre-commit', category: Q, files: [/(^|\/)\.pre-commit-config\.ya?ml$/] },
  { name: 'golangci-lint', category: Q, files: [/(^|\/)\.golangci\.ya?ml$/] },
  { name: 'RuboCop', category: Q, rubygems: ['rubocop'], files: [/(^|\/)\.rubocop\.yml$/] },
  { name: 'EditorConfig', category: Q, files: [/(^|\/)\.editorconfig$/] },

  // ── DevOps & CI ──
  { name: 'Docker', category: OPS, files: [/(^|\/)Dockerfile(\.[\w-]+)?$/, /(^|\/)\.dockerignore$/] },
  { name: 'Docker Compose', category: OPS, files: [/(^|\/)(docker-)?compose(\.[\w-]+)?\.ya?ml$/] },
  { name: 'GitHub Actions', category: OPS, files: [/^\.github\/workflows\/[^/]+\.ya?ml$/] },
  { name: 'GitLab CI', category: OPS, files: [/^\.gitlab-ci\.yml$/] },
  { name: 'CircleCI', category: OPS, files: [/^\.circleci\//] },
  { name: 'Travis CI', category: OPS, files: [/^\.travis\.yml$/] },
  { name: 'Jenkins', category: OPS, files: [/(^|\/)Jenkinsfile$/] },
  { name: 'Kubernetes', category: OPS, files: [/(^|\/)(k8s|kubernetes|helm|charts)\/[^/]+\.ya?ml$/, /(^|\/)Chart\.yaml$/] },
  { name: 'Terraform', category: OPS, files: [/\.tf$/] },
  { name: 'Dependabot', category: OPS, files: [/^\.github\/dependabot\.ya?ml$/] },
  { name: 'Renovate', category: OPS, files: [/(^|\/)renovate\.json5?$/, /^\.github\/renovate\.json5?$/] },

  // ── Hosting ──
  { name: 'Vercel', category: HOST, npm: ['@vercel/analytics', '@vercel/node'], files: [/(^|\/)vercel\.json$/] },
  { name: 'Netlify', category: HOST, files: [/(^|\/)netlify\.toml$/] },
  { name: 'Heroku', category: HOST, files: [/(^|\/)Procfile$/, /^app\.json$/] },
  { name: 'Fly.io', category: HOST, files: [/(^|\/)fly\.toml$/] },
  { name: 'Render', category: HOST, files: [/(^|\/)render\.ya?ml$/] },
  { name: 'Cloudflare Workers', category: HOST, npm: ['wrangler'], files: [/(^|\/)wrangler\.(toml|jsonc?)$/] },
  { name: 'Serverless Framework', category: HOST, npm: ['serverless'], files: [/(^|\/)serverless\.ya?ml$/] },
  { name: 'AWS SDK', category: HOST, npmPrefix: ['@aws-sdk/'], npm: ['aws-sdk'], pypi: ['boto3'] },

  // ── Mobile & desktop ──
  { name: 'React Native', category: MOB, npm: ['react-native'] },
  { name: 'Flutter', category: MOB, pub: ['flutter'] },
  { name: 'Electron', category: MOB, npm: ['electron'] },
  { name: 'Tauri', category: MOB, npm: ['@tauri-apps/api'], cargo: ['tauri'], files: [/(^|\/)tauri\.conf\.json$/] },
  { name: 'Android', category: MOB, files: [/(^|\/)AndroidManifest\.xml$/] },
  { name: 'iOS / Xcode', category: MOB, files: [/\.xcodeproj\//, /(^|\/)Podfile$/] },

  // ── Data & ML ──
  { name: 'NumPy', category: DATA, pypi: ['numpy'] },
  { name: 'pandas', category: DATA, pypi: ['pandas'] },
  { name: 'scikit-learn', category: DATA, pypi: ['scikit-learn', 'sklearn'] },
  { name: 'PyTorch', category: DATA, pypi: ['torch'] },
  { name: 'TensorFlow', category: DATA, pypi: ['tensorflow'], npm: ['@tensorflow/tfjs'] },
  { name: 'Jupyter', category: DATA, languages: ['Jupyter Notebook'], files: [/\.ipynb$/] },
  { name: 'Celery', category: DATA, pypi: ['celery'] },

  // ── Docs ──
  { name: 'Docusaurus', category: DOCS, npm: ['@docusaurus/core'] },
  { name: 'MkDocs', category: DOCS, pypi: ['mkdocs', 'mkdocs-material'], files: [/(^|\/)mkdocs\.ya?ml$/] },
  { name: 'Sphinx', category: DOCS, pypi: ['sphinx'], files: [/(^|\/)docs\/conf\.py$/] },
  { name: 'VitePress', category: DOCS, npm: ['vitepress'] },
];

export const CATEGORY_ORDER = [
  RT, F, M, B, API, DB, ORM, S, ST, AUTH, T, BLD, Q, MONO, OPS, HOST, MOB, DATA, DOCS,
];

const ECOSYSTEM_KEYS = ['npm', 'pypi', 'go', 'cargo', 'composer', 'rubygems', 'pub'];

/**
 * @param {object} p
 * @param {string[]} p.paths            every path in the repo
 * @param {Record<string, Map<string,string>>} p.deps   ecosystem → (lower-cased name → manifest path)
 * @param {Record<string, number>} p.languages          GitHub language bytes
 */
export function detectStack({ paths, deps, languages }) {
  const languageNames = Object.keys(languages || {});
  const totalBytes = Object.values(languages || {}).reduce((a, b) => a + b, 0) || 1;
  const found = [];

  for (const rule of STACK_RULES) {
    const evidence = [];

    for (const eco of ECOSYSTEM_KEYS) {
      const map = deps[eco];
      if (!map || !rule[eco]) continue;
      for (const name of rule[eco]) {
        const where = map.get(name.toLowerCase());
        if (where) evidence.push(`${name} in ${where}`);
      }
    }
    if (rule.npmPrefix && deps.npm) {
      for (const [name, where] of deps.npm) {
        if (rule.npmPrefix.some((p) => name.startsWith(p))) {
          evidence.push(`${name} in ${where}`);
          break;
        }
      }
    }
    for (const eco of ['maven', 'gradle']) {
      const map = deps[eco];
      if (!map || !rule[eco]) continue;
      for (const [name, where] of map) {
        if (rule[eco].some((needle) => name.includes(needle))) {
          evidence.push(`${name} in ${where}`);
          break;
        }
      }
    }

    const hasDependencyEvidence = evidence.length > 0;

    if (rule.files) {
      const hit = paths.find((p) => rule.files.some((re) => re.test(p)));
      if (hit) evidence.push(`${hit}`);
    }
    if (rule.languages) {
      for (const lang of rule.languages) {
        if (!languageNames.includes(lang)) continue;
        const pct = (languages[lang] / totalBytes) * 100;
        // Ignore trace amounts so a single helper script doesn't make a "Python project".
        if (pct >= 1.5 || hasDependencyEvidence) evidence.push(`${lang} source (${pct.toFixed(1)}%)`);
      }
    }

    if (evidence.length) {
      found.push({
        name: rule.name,
        category: rule.category,
        confidence: hasDependencyEvidence || evidence.length > 1 ? 'high' : 'medium',
        evidence: evidence.slice(0, 4),
      });
    }
  }

  const byCategory = {};
  for (const item of found) (byCategory[item.category] ||= []).push(item);

  const categories = CATEGORY_ORDER.filter((c) => byCategory[c]).map((c) => ({
    name: c,
    items: byCategory[c],
  }));

  return { items: found, categories };
}
