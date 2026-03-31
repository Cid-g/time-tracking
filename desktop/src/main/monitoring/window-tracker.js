import { spawn } from 'child_process';
import log from 'electron-log';

/**
 * Tracks active window/application usage via a persistent background PowerShell process.
 *
 * Strategy: A single PowerShell process starts once, compiles the C# P/Invoke type once,
 * then loops forever reading stdin commands and writing the foreground window info to stdout.
 * This avoids:
 *  - Spawning a new process every 5 seconds (which steals focus and shows "powershell")
 *  - Recompiling Add-Type every call
 *  - Any native Node.js addon ABI issues
 */

let isTracking = false;
let pollInterval = null;
let windowLog = [];
let currentWindow = null;
let currentAppName = '';

// Persistent PowerShell process
let psProcess = null;
let psReady = false;
let pendingResolve = null;
let outputBuffer = '';

// PowerShell script that:
// 1. Compiles the Win32 API type ONCE at startup
// 2. Enters a loop: reads "POLL" from stdin, writes "ProcessName|||WindowTitle" to stdout
const PS_WORKER_SCRIPT = `
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::InputEncoding = [System.Text.Encoding]::UTF8

Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;
public class FGWin {
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint pid);
  [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);
}
"@

Write-Output "READY"

while ($true) {
  $cmd = [Console]::In.ReadLine()
  if ($cmd -eq $null -or $cmd -eq "EXIT") { break }
  if ($cmd -eq "POLL") {
    try {
      $h = [FGWin]::GetForegroundWindow()
      $pid2 = [uint32]0
      [void][FGWin]::GetWindowThreadProcessId($h, [ref]$pid2)
      $sb = New-Object System.Text.StringBuilder 512
      [void][FGWin]::GetWindowText($h, $sb, 512)
      $title = $sb.ToString()
      try { $pname = (Get-Process -Id $pid2 -ErrorAction Stop).ProcessName } catch { $pname = "Unknown" }
      Write-Output "WIN|||$pname|||$title"
    } catch {
      Write-Output "WIN|||Unknown|||"
    }
  }
}
`;

function startPsWorker() {
  return new Promise((resolve) => {
    psProcess = spawn('powershell.exe', [
      '-NoProfile', '-NonInteractive', '-NoLogo', '-Command', '-',
    ], {
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
    });

    outputBuffer = '';

    psProcess.stdout.on('data', (data) => {
      outputBuffer += data.toString();

      // Process complete lines
      const lines = outputBuffer.split('\n');
      outputBuffer = lines.pop(); // Keep incomplete line in buffer

      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) continue;

        if (line === 'READY') {
          psReady = true;
          log.info('Window tracker: PowerShell worker ready');
          resolve(true);
          continue;
        }

        if (line.startsWith('WIN|||') && pendingResolve) {
          const parts = line.substring(6).split('|||');
          const processName = parts[0] || 'Unknown';
          const windowTitle = parts.slice(1).join('|||');
          pendingResolve({ appName: processName, windowTitle });
          pendingResolve = null;
        }
      }
    });

    psProcess.stderr.on('data', (data) => {
      const msg = data.toString().trim();
      if (msg) log.warn('Window tracker PS stderr:', msg);
    });

    psProcess.on('error', (err) => {
      log.error('Window tracker: PowerShell process error:', err.message);
      psReady = false;
      resolve(false);
    });

    psProcess.on('exit', (code) => {
      log.info(`Window tracker: PowerShell process exited (code ${code})`);
      psReady = false;
      psProcess = null;
      if (pendingResolve) {
        pendingResolve(null);
        pendingResolve = null;
      }
    });

    // Send the script via stdin
    psProcess.stdin.write(PS_WORKER_SCRIPT + '\n');

    // Timeout — if READY doesn't arrive in 10 seconds, give up
    setTimeout(() => {
      if (!psReady) {
        log.warn('Window tracker: PowerShell worker startup timeout');
        resolve(false);
      }
    }, 10000);
  });
}

function stopPsWorker() {
  if (psProcess) {
    try {
      psProcess.stdin.write('EXIT\n');
      // Give it a moment to exit gracefully, then force kill
      setTimeout(() => {
        if (psProcess) {
          psProcess.kill();
          psProcess = null;
        }
      }, 2000);
    } catch {
      psProcess?.kill();
      psProcess = null;
    }
  }
  psReady = false;
  pendingResolve = null;
  outputBuffer = '';
}

function getActiveWindow() {
  return new Promise((resolve) => {
    if (!psReady || !psProcess) {
      resolve(null);
      return;
    }

    // If there's already a pending request, skip this poll
    if (pendingResolve) {
      resolve(null);
      return;
    }

    pendingResolve = resolve;

    try {
      psProcess.stdin.write('POLL\n');
    } catch {
      pendingResolve = null;
      resolve(null);
    }

    // Timeout for individual poll — 3 seconds
    setTimeout(() => {
      if (pendingResolve === resolve) {
        pendingResolve = null;
        resolve(null);
      }
    }, 3000);
  });
}

function closeCurrentWindow() {
  if (currentWindow) {
    const now = new Date();
    const duration = Math.floor((now - currentWindow.startedAt) / 1000);
    if (duration > 0) {
      windowLog.push({
        appName: currentWindow.appName,
        windowTitle: currentWindow.windowTitle,
        startedAt: currentWindow.startedAt.toISOString(),
        endedAt: now.toISOString(),
        duration,
      });
    }
    currentWindow = null;
  }
}

async function pollActiveWindowFn() {
  const win = await getActiveWindow();
  if (!win || win.appName === 'Unknown') return;

  // Filter out our own PowerShell worker process
  if (win.appName.toLowerCase() === 'powershell') return;

  currentAppName = win.appName;

  // Same window — keep tracking
  if (currentWindow && currentWindow.appName === win.appName && currentWindow.windowTitle === win.windowTitle) {
    return;
  }

  // Window changed — close old, start new
  closeCurrentWindow();
  currentWindow = {
    appName: win.appName,
    windowTitle: win.windowTitle,
    startedAt: new Date(),
  };
}

export const windowTracker = {
  async start() {
    if (isTracking) return;
    isTracking = true;
    windowLog = [];
    currentWindow = null;
    currentAppName = '';

    // Start the persistent PowerShell worker
    const ready = await startPsWorker();
    if (!ready) {
      log.error('Window tracker: Failed to start PowerShell worker');
    }

    // Poll every 5 seconds
    pollInterval = setInterval(pollActiveWindowFn, 5000);
    // Immediate first poll (with small delay to let PS settle)
    setTimeout(pollActiveWindowFn, 1000);

    log.info('Window tracker started');
  },

  stop() {
    if (!isTracking) return;
    isTracking = false;
    clearInterval(pollInterval);
    pollInterval = null;
    closeCurrentWindow();
    currentAppName = '';
    stopPsWorker();
    log.info('Window tracker stopped');
  },

  collectAndReset() {
    closeCurrentWindow();

    const collected = [...windowLog];
    windowLog = [];

    if (isTracking) {
      pollActiveWindowFn();
    }

    return collected;
  },

  getCurrentAppName() {
    return currentAppName;
  },

  isActive() {
    return isTracking;
  },
};
