const { spawnSync } = require('node:child_process');

const databaseUrl = process.env.DATABASE_URL;

if (databaseUrl && !/^postgres(ql)?:\/\//i.test(databaseUrl)) {
  console.warn('[prisma-generate-safe] Ignoring invalid DATABASE_URL during generate.');
  console.warn('[prisma-generate-safe] Current value does not start with postgres:// or postgresql://');
  delete process.env.DATABASE_URL;
}

const result = spawnSync('npx', ['prisma', 'generate'], {
  stdio: 'inherit',
  env: process.env,
  shell: process.platform === 'win32',
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
