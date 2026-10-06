import { env } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import { createApp } from './app.js';

async function main() {
  try {
    await connectDB();
  } catch (err) {
    console.error(`[db] Could not connect to MongoDB at ${env.mongoUri.replace(/\/\/[^@]*@/, '//***@')}`);
    console.error(`[db] ${err.message}`);
    process.exit(1);
  }

  const app = createApp();
  const server = app.listen(env.port, () => {
    console.info(`[api] RepoLens API listening on http://localhost:${env.port} (${env.nodeEnv})`);
    if (!env.githubToken) {
      console.warn('[api] GITHUB_TOKEN not set: GitHub allows only 60 API requests/hour (~15 analyses).');
    }
  });

  const shutdown = async (signal) => {
    console.info(`[api] ${signal} received, shutting down…`);
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main();
