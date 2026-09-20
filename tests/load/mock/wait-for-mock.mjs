import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverPath = path.join(__dirname, 'mock-api-server.mjs');
const PORT = process.env.MOCK_API_PORT || 3000;
const baseUrl = `http://localhost:${PORT}`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function probe() {
  try {
    const res = await fetch(`${baseUrl}/users?limit=1`);
    return res.ok;
  } catch {
    return false;
  }
}

async function waitReady(timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await probe()) return true;
    await sleep(250);
  }
  return false;
}

async function main() {
  // Probe briefly (~3s) in case a server is already answering on the port.
  if (await waitReady(3000)) {
    console.log(`[wait-for-mock] mock API already answering at ${baseUrl}`);
    process.exit(0);
  }

  // Nothing answered: spawn a fresh server (detached so the step can exit).
  const child = spawn('node', [serverPath, String(PORT)], {
    stdio: 'inherit',
    detached: true,
  });
  child.unref();
  child.on('error', () => {}); // e.g. EADDRINUSE race — the probe below decides

  if (await waitReady(15000)) {
    console.log(`[wait-for-mock] mock API ready at ${baseUrl} (pid ${child.pid})`);
    process.exit(0);
  }
  console.error('[wait-for-mock] mock API did not become ready in 15s');
  process.exit(1);
}

main();
