import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyzeRepository } from '../src/analyzer/index.js';
import { parseRepoUrl } from '../src/utils/parseRepoUrl.js';
import {
  parseGoMod,
  parseRequirements,
  parsePyproject,
  parseCargo,
  parsePom,
  parseGemfile,
} from '../src/analyzer/dependencies.js';
import { detectEndpoints } from '../src/analyzer/endpoints.js';
import { createLocalClient } from './helpers/localClient.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const fixture = path.join(here, 'fixtures/sample-repo');

test('parseRepoUrl understands common GitHub URL formats', () => {
  const expected = { owner: 'facebook', repo: 'react' };
  assert.deepEqual(parseRepoUrl('https://github.com/facebook/react'), expected);
  assert.deepEqual(parseRepoUrl('github.com/facebook/react/tree/main/packages'), expected);
  assert.deepEqual(parseRepoUrl('https://github.com/facebook/react.git'), expected);
  assert.deepEqual(parseRepoUrl('git@github.com:facebook/react.git'), expected);
  assert.deepEqual(parseRepoUrl('facebook/react'), expected);
  assert.equal(parseRepoUrl('https://gitlab.com/facebook/react'), null);
  assert.equal(parseRepoUrl('https://github.com/facebook'), null);
  assert.equal(parseRepoUrl('not a url'), null);
});

test('dependency parsers handle each ecosystem', () => {
  assert.deepEqual(
    parseRequirements('flask==3.0.0\nrequests>=2  # http\n-r other.txt\nuvicorn[standard]\n').production.map((d) => d.name),
    ['flask', 'requests', 'uvicorn'],
  );
  const go = parseGoMod('module example.com/x\n\ngo 1.22\n\nrequire (\n\tgithub.com/gin-gonic/gin v1.9.1\n\tgolang.org/x/net v0.1.0 // indirect\n)\n');
  assert.equal(go.production[0].name, 'github.com/gin-gonic/gin');
  assert.equal(go.development[0].name, 'golang.org/x/net');
  const py = parsePyproject('[project]\nname = "x"\ndependencies = ["fastapi>=0.1", "pydantic"]\n[project.optional-dependencies]\ndev = ["pytest"]\n');
  assert.deepEqual(py.production.map((d) => d.name), ['fastapi', 'pydantic']);
  assert.deepEqual(py.development.map((d) => d.name), ['pytest']);
  const cargo = parseCargo('[package]\nname = "x"\n[dependencies]\naxum = "0.7"\ntokio = { version = "1", features = ["full"] }\n');
  assert.deepEqual(cargo.production.map((d) => `${d.name}@${d.version}`), ['axum@0.7', 'tokio@1']);
  const pom = parsePom('<project><dependencies><dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-web</artifactId></dependency><dependency><groupId>junit</groupId><artifactId>junit</artifactId><version>4</version><scope>test</scope></dependency></dependencies></project>');
  assert.equal(pom.production[0].name, 'org.springframework.boot:spring-boot-starter-web');
  assert.equal(pom.development[0].name, 'junit:junit');
  const gem = parseGemfile("gem 'rails', '~> 7.1'\ngroup :development, :test do\n  gem 'rspec-rails'\nend\n");
  assert.equal(gem.production[0].name, 'rails');
  assert.equal(gem.development[0].name, 'rspec-rails');
});

test('endpoint detection covers several frameworks', () => {
  const files = [
    { path: 'app/api/users/[id]/route.ts', content: 'export async function GET() {}\nexport async function DELETE() {}' },
    { path: 'src/users.controller.ts', content: "@Controller('users')\nclass C {\n @Get(':id')\n find() {}\n @Post()\n create() {}\n}" },
    { path: 'main.go', content: 'import "github.com/gin-gonic/gin"\nr := gin.Default()\nv1 := r.Group("/api/v1")\nv1.GET("/items", h)\nhttp.Get("https://example.com")' },
    { path: 'src/main/java/x/ItemController.java', content: '@RestController\n@RequestMapping("/api/items")\npublic class ItemController {\n @GetMapping("/{id}")\n public Item get() {}\n @PostMapping\n public Item create() {}\n}' },
    { path: 'config/routes.rb', content: "Rails.application.routes.draw do\n  namespace :api do\n    resources :posts, only: [:index, :show]\n  end\n  get '/about', to: 'pages#about'\nend\n" },
    { path: 'routes/api.php', content: "<?php\nRoute::get('/users', [UserController::class, 'index']);" },
    { path: 'blog/urls.py', content: "urlpatterns = [\n  path('posts/<int:pk>/', views.detail),\n  path('api/', include('api.urls')),\n]" },
  ];
  const { endpoints } = detectEndpoints(files, files.map((f) => f.path));
  const list = endpoints.map((e) => `${e.method} ${e.path}`);
  for (const expected of [
    'GET /api/users/:id',
    'DELETE /api/users/:id',
    'GET /users/:id',
    'POST /users',
    'GET /api/v1/items',
    'GET /api/items/{id}',
    'POST /api/items',
    'GET /api/posts',
    'GET /api/posts/:id',
    'GET /about',
    'GET /api/users',
    'ANY /posts/:pk',
  ]) {
    assert.ok(list.includes(expected), `expected ${expected} in ${JSON.stringify(list)}`);
  }
  assert.ok(!list.some((e) => e.includes('example.com')), 'client HTTP calls must not be reported');
});

test('analyzeRepository produces a complete report for the fixture repo', async () => {
  const report = await analyzeRepository('acme', 'sample-repo', { client: createLocalClient(fixture) });

  // Repository info
  assert.equal(report.repo.fullName, 'acme/sample-repo');
  assert.equal(report.repo.stars, 42);

  // Languages fall back to file extensions when GitHub has no data
  assert.ok(report.languages.some((l) => l.name === 'JavaScript'));
  assert.ok(report.languages.some((l) => l.name === 'Python'));

  // Stack
  const stack = report.stack.items.map((s) => s.name);
  for (const t of ['Express', 'React', 'MongoDB', 'Mongoose', 'FastAPI', 'Vite', 'Tailwind CSS', 'Jest', 'GitHub Actions', 'JWT']) {
    assert.ok(stack.includes(t), `expected ${t} in stack: ${stack.join(', ')}`);
  }

  // Dependencies
  assert.equal(report.dependencies.manifests.length, 3);
  assert.ok(report.dependencies.ecosystems.includes('npm'));
  assert.ok(report.dependencies.ecosystems.includes('PyPI'));

  // Endpoints: router mount prefix is resolved, client axios calls are ignored
  const eps = report.endpoints.endpoints.map((e) => `${e.method} ${e.path}`);
  for (const e of ['GET /api/users', 'POST /api/users', 'GET /api/users/:id', 'PUT /api/users/:id/avatar', 'DELETE /api/users/:id/avatar', 'GET /health', 'GET /items', 'POST /items/{item_id}', 'GET /ping']) {
    assert.ok(eps.includes(e), `expected ${e} in ${JSON.stringify(eps)}`);
  }
  assert.ok(!report.endpoints.endpoints.some((e) => e.file.startsWith('client/')));

  // Structure, config files, metrics
  assert.ok(report.structure.tree.children.some((c) => c.name === 'src' && c.type === 'dir'));
  assert.ok(report.configFiles.files.some((f) => f.path === '.github/workflows/ci.yml'));
  assert.ok(report.metrics.totalFiles >= 14);
  assert.equal(report.metrics.testFiles, 1);

  // Insights
  assert.equal(report.project.type, 'Full-stack web app');
  assert.ok(report.insights.healthScore > 50);
  assert.ok(report.insights.warnings.some((w) => w.level === 'danger' && w.message.includes('.env')));
  assert.equal(report.readme.exists, true);
  assert.ok(report.readme.sections.installation);
  assert.ok(report.scripts.some((s) => s.name === 'start'));
  assert.ok(report.entryPoints.some((e) => e.path === 'src/app.js'));
});
