// Keep release validation separate from a running development server.
const { spawnSync } = require('node:child_process');
const result = spawnSync(process.execPath, [require.resolve('next/dist/bin/next'), 'build'], {
  cwd: require('node:path').resolve(__dirname, '..'),
  env: { ...process.env, NEXT_DIST_DIR: '.next-check' },
  stdio: 'inherit',
});
process.exit(result.status ?? 1);
