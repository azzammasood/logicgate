/**
 * Stop any process on the dev port, then start LogicGate (Next.js + API routes).
 *
 * Usage:
 *   npm run restart
 *   npm run dev:stop    # stop only
 */
import { spawn, execSync } from "node:child_process";
import { platform } from "node:os";
import { fileURLToPath } from "node:url";
import path from "node:path";

const PORT = Number(process.env.PORT) || 3000;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const stopOnly = process.argv.includes("--stop");

function killPort(port) {
  let killed = 0;

  if (platform() === "win32") {
    try {
      const out = execSync(`netstat -ano | findstr :${port}`, {
        encoding: "utf8",
        stdio: ["pipe", "pipe", "ignore"],
      });
      const pids = new Set();
      for (const line of out.split(/\r?\n/)) {
        if (!line.includes("LISTENING")) continue;
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && /^\d+$/.test(pid) && pid !== "0") pids.add(pid);
      }
      for (const pid of pids) {
        try {
          execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
          console.log(`Stopped process ${pid} on port ${port}`);
          killed++;
        } catch {
          /* already exited */
        }
      }
    } catch {
      /* nothing listening */
    }
    return killed;
  }

  try {
    const pids = execSync(`lsof -ti tcp:${port}`, { encoding: "utf8" }).trim();
    if (!pids) return 0;
    for (const pid of pids.split(/\s+/)) {
      try {
        process.kill(Number(pid), "SIGTERM");
        console.log(`Stopped process ${pid} on port ${port}`);
        killed++;
      } catch {
        /* ignore */
      }
    }
  } catch {
    /* nothing listening */
  }
  return killed;
}

function startDev() {
  console.log(`\nStarting LogicGate at http://localhost:${PORT}\n`);
  console.log("(Frontend + API run together in one Next.js dev server.)\n");

  const child = spawn("npm", ["run", "dev"], {
    cwd: root,
    stdio: "inherit",
    shell: true,
    env: { ...process.env, PORT: String(PORT) },
  });

  child.on("exit", (code) => process.exit(code ?? 0));
}

console.log(`LogicGate — ${stopOnly ? "stopping" : "restarting"} dev server (port ${PORT})…\n`);

const stopped = killPort(PORT);
if (stopped === 0) {
  console.log(`No process was listening on port ${PORT}.`);
} else {
  console.log(`Freed port ${PORT}.`);
}

if (stopOnly) {
  console.log("\nDev server stopped.");
  process.exit(0);
}

// Brief pause so the OS releases the port (especially on Windows).
setTimeout(startDev, stopped > 0 ? 800 : 0);
