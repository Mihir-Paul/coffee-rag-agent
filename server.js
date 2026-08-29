/**
 * CoffeeMind AI Backend - Node.js Production Entrypoint for Render
 * 
 * Spawns and manages the Python FastAPI backend engine (server.py),
 * dynamically binding to process.env.PORT and process.env.HOST (0.0.0.0).
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const PORT = process.env.PORT || 8000;
const HOST = process.env.HOST || '0.0.0.0';

console.log('==================================================');
console.log(`CoffeeMind Backend Server Starting`);
console.log(`Host: ${HOST}`);
console.log(`Port: ${PORT}`);
console.log(`Environment: ${process.env.NODE_ENV || 'production'}`);
console.log('==================================================');

const isWin = process.platform === 'win32';
const serverPyPath = path.join(__dirname, 'server.py');

if (!fs.existsSync(serverPyPath)) {
  console.error(`Error: Server entry file not found at ${serverPyPath}`);
  process.exit(1);
}

const env = {
  ...process.env,
  PORT: String(PORT),
  HOST: String(HOST)
};

function startBackend(cmd) {
  console.log(`Spawning backend engine with '${cmd} server.py'...`);
  const proc = spawn(cmd, [serverPyPath], {
    env,
    stdio: 'inherit'
  });

  proc.on('error', (err) => {
    if (err.code === 'ENOENT' && cmd === 'python3') {
      console.warn("python3 binary not found. Retrying with 'python'...");
      startBackend('python');
      return;
    } else if (err.code === 'ENOENT' && cmd === 'python') {
      console.warn("python binary not found. Retrying with 'python3'...");
      startBackend('python3');
      return;
    }
    console.error('Fatal backend spawn error:', err);
    process.exit(1);
  });

  proc.on('exit', (code, signal) => {
    if (signal) {
      console.log(`Backend process terminated by signal: ${signal}`);
      process.exit(0);
    } else {
      console.log(`Backend process exited with code: ${code}`);
      process.exit(code || 0);
    }
  });

  // Handle graceful shutdowns from Render / Docker
  process.on('SIGTERM', () => {
    console.log('SIGTERM received. Forwarding to backend process...');
    proc.kill('SIGTERM');
  });

  process.on('SIGINT', () => {
    console.log('SIGINT received. Forwarding to backend process...');
    proc.kill('SIGINT');
  });
}

// Start with python3 on Linux/Render or python on Windows
const initialCmd = isWin ? 'python' : 'python3';
startBackend(initialCmd);
