const { spawn } = require('child_process');

const electronBinaryPath = require('electron');
const env = { ...process.env };

if (Object.prototype.hasOwnProperty.call(env, 'ELECTRON_RUN_AS_NODE')) {
  delete env.ELECTRON_RUN_AS_NODE;
}

const child = spawn(electronBinaryPath, ['.'], {
  cwd: process.cwd(),
  stdio: 'inherit',
  env
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});

child.on('error', (error) => {
  console.error('[electron:serve] Failed to start Electron.', error);
  process.exit(1);
});
