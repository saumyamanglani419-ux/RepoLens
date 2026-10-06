import 'dotenv/config';

const required = (name, fallback) => {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

const nodeEnv = process.env.NODE_ENV || 'development';
const isProd = nodeEnv === 'production';

const jwtSecret = required('JWT_SECRET', isProd ? undefined : 'dev-only-insecure-secret-change-me');
if (isProd && (jwtSecret.length < 32 || jwtSecret.startsWith('replace-me'))) {
  throw new Error('JWT_SECRET must be a random string of at least 32 characters in production.');
}

export const env = Object.freeze({
  nodeEnv,
  isProd,
  port: Number(process.env.PORT) || 5000,
  clientUrls: (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  mongoUri: required('MONGODB_URI', 'mongodb://127.0.0.1:27017/repolens'),
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  githubToken: process.env.GITHUB_TOKEN || '',
  githubApiUrl: (process.env.GITHUB_API_URL || 'https://api.github.com').replace(/\/$/, ''),
  githubRawUrl: (process.env.GITHUB_RAW_URL || 'https://raw.githubusercontent.com').replace(/\/$/, ''),
});
