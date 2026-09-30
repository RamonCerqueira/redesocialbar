const { spawnSync } = require('node:child_process');
const path = require('node:path');
const cli = path.join(path.dirname(require.resolve('eslint/package.json')), 'bin/eslint.js');
const result = spawnSync(process.execPath, [cli, 'src'], {
  cwd: require('node:path').resolve(__dirname, '..'),
  env: { ...process.env, ESLINT_USE_FLAT_CONFIG: 'false' },
  stdio: 'inherit',
});
process.exit(result.status ?? 1);
