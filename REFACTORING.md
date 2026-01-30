# Refactoring Recommendations

This document outlines suggestions for improving the code quality, efficiency, and maintainability of the electron-with-express project.

---

## Critical Issues

### 1. Memory Leak in Server Logs

**File:** `src/app.ts:24-29`

**Problem:** Log entries are appended to the DOM indefinitely without any cleanup mechanism. Over time, this will cause memory exhaustion.

**Solution:** Implement a circular buffer or size limit.

```typescript
const MAX_LOG_ENTRIES = 1000;

ipcRenderer.on("server-log-entry", (_event: unknown, arg: string) => {
  const logEntry = document.createElement("span");
  logEntry.textContent = arg;
  serverLog.append(logEntry);

  // Remove oldest entries when limit exceeded
  while (serverLog.childNodes.length > MAX_LOG_ENTRIES) {
    serverLog.removeChild(serverLog.firstChild!);
  }
});
```

### 2. No Error Handling for Child Process Spawn

**File:** `src/main.ts:73-79`

**Problem:** If the Express process fails to spawn, there's no error handling. The application will silently fail.

**Solution:** Add error event listeners.

```typescript
expressProcess = spawn(nodePath, [expressApp], options);

expressProcess.on("error", (err) => {
  console.error("Failed to start Express server:", err);
  dialog.showErrorBox("Server Error", `Failed to start Express server: ${err.message}`);
});

expressProcess.on("exit", (code, signal) => {
  if (code !== 0 && code !== null) {
    console.error(`Express server exited with code ${code}`);
  }
});
```

### 3. No Graceful Shutdown Timeout

**File:** `src/main.ts:108-116`

**Problem:** `expressProcess.kill()` sends SIGTERM but doesn't wait or fallback to SIGKILL if the process doesn't terminate.

**Solution:** Implement a timeout-based fallback.

```typescript
mainWindow.on("closed", () => {
  if (expressProcess) {
    expressProcess.kill("SIGTERM");

    // Force kill if still running after 5 seconds
    setTimeout(() => {
      if (expressProcess && !expressProcess.killed) {
        expressProcess.kill("SIGKILL");
      }
    }, 5000);
  }
  mainWindow = null;
});
```

---

## Type Safety Improvements

### 4. Remove @ts-expect-error Suppressions

**File:** `src/app.ts:3-6`

**Problem:** Multiple `@ts-expect-error` comments indicate missing type definitions.

**Solution:** Create proper type declarations in a `types.d.ts` file.

```typescript
// src/types.d.ts
interface ElectronAPI {
  getExpressAppUrl: () => Promise<string>;
}

interface IpcRenderer {
  on: (channel: string, listener: (event: unknown, ...args: unknown[]) => void) => void;
}

declare global {
  interface Window {
    api: ElectronAPI;
    ipcRenderer: IpcRenderer;
  }
}

export {};
```

Then update `app.ts`:

```typescript
// No more @ts-expect-error needed
const { getExpressAppUrl } = window.api;
const { ipcRenderer } = window;
```

### 5. Add Type Annotations to Preload Bridge

**File:** `src/preload.ts`

**Problem:** The exposed API lacks explicit type annotations.

**Solution:** Define interfaces for the API.

```typescript
import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";

interface API {
  getExpressAppUrl: () => Promise<string>;
}

interface IpcRendererBridge {
  on: (channel: string, listener: (event: IpcRendererEvent, ...args: unknown[]) => void) => void;
}

const api: API = {
  getExpressAppUrl: () => ipcRenderer.invoke("get-express-app-url"),
};

const ipcRendererBridge: IpcRendererBridge = {
  on: (channel, listener) => ipcRenderer.on(channel, listener),
};

contextBridge.exposeInMainWorld("api", api);
contextBridge.exposeInMainWorld("ipcRenderer", ipcRendererBridge);
```

---

## Code Quality Improvements

### 6. Standardize Import Style

**File:** `src/main.ts:1-10`

**Problem:** Mixed CommonJS `require()` and ES6 `import` statements.

**Solution:** Use ES6 imports consistently.

```typescript
// Before (mixed)
import { app, BrowserWindow, globalShortcut, ipcMain } from "electron";
const path = require("node:path");
const { spawn } = require("node:child_process");

// After (consistent ES6)
import { app, BrowserWindow, globalShortcut, ipcMain } from "electron";
import path from "node:path";
import { spawn, ChildProcess } from "node:child_process";
import { Server as SocketIOServer } from "socket.io";
import { createServer } from "node:http";
```

### 7. Extract Configuration to a Separate Module

**Files:** `src/main.ts`, `src/express-app.ts`

**Problem:** Configuration values (ports, origins) are scattered and hardcoded.

**Solution:** Create a centralized config module.

```typescript
// src/config.ts
export const config = {
  expressPort: parseInt(process.env.EXPRESS_PORT || "3000", 10),
  socketPort: parseInt(process.env.SOCKET_PORT || "3001", 10),
  get expressUrl() {
    return `http://127.0.0.1:${this.expressPort}`;
  },
  get corsOrigin() {
    return process.env.CORS_ORIGIN || this.expressUrl;
  },
  window: {
    width: 640,
    height: 480,
  },
};
```

### 8. Simplify Route Registration

**File:** `src/express-app.ts:22-38`

**Problem:** Routes are registered with repetitive code.

**Solution:** Use a more declarative approach.

```typescript
// Define routes as data
const routes = [
  { path: "/", view: "index", title: "Home" },
  { path: "/pageTwo", view: "pageTwo", title: "Page 2" },
  { path: "/pageThree", view: "pageThree", title: "Page 3" },
  { path: "/pageFour", view: "pageFour", title: "Page 4" },
] as const;

// Register all routes
routes.forEach(({ path, view, title }) => {
  router.get(path, (_req, res) => res.render(view, { title }));
});
```

---

## Security Improvements

### 9. Environment-Based CORS Configuration

**File:** `src/express-app.ts:45`

**Problem:** CORS origin is hardcoded, inflexible for different environments.

**Solution:** Use environment variables.

```typescript
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://127.0.0.1:3000",
  })
);
```

### 10. Hide Error Stack in Production

**File:** `src/express-app.ts:61-69`

**Problem:** Full stack traces are exposed in error responses.

**Solution:** Conditionally hide stack based on environment.

```typescript
app.use(
  (
    err: HttpError,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    const isDev = app.get("env") === "development";
    res.locals.message = err.message;
    res.locals.error = isDev ? err : {};
    res.status(err.status || 500);
    res.render("error");
  }
);
```

### 11. Add Content Security Policy

**File:** `src/express-app.ts`

**Problem:** No Content Security Policy headers are set.

**Solution:** Add helmet middleware or manual CSP headers.

```typescript
import helmet from "helmet";

// Add near the top of middleware stack
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Needed for Socket.io
      styleSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", "ws://localhost:3001"],
    },
  },
}));
```

---

## Architecture Improvements

### 12. Add Process Manager Abstraction

**File:** `src/main.ts`

**Problem:** Express process management is tightly coupled to the main process code.

**Solution:** Extract to a dedicated class.

```typescript
// src/process-manager.ts
import { spawn, ChildProcess } from "node:child_process";
import { EventEmitter } from "node:events";

export class ProcessManager extends EventEmitter {
  private process: ChildProcess | null = null;

  start(command: string, args: string[], options: object): void {
    this.process = spawn(command, args, options);

    this.process.on("error", (err) => this.emit("error", err));
    this.process.on("exit", (code) => this.emit("exit", code));

    if (this.process.stdout) {
      this.process.stdout.on("data", (data) => this.emit("stdout", data.toString()));
    }
    if (this.process.stderr) {
      this.process.stderr.on("data", (data) => this.emit("stderr", data.toString()));
    }
  }

  async stop(timeout = 5000): Promise<void> {
    if (!this.process) return;

    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        this.process?.kill("SIGKILL");
        resolve();
      }, timeout);

      this.process.once("exit", () => {
        clearTimeout(timer);
        resolve();
      });

      this.process.kill("SIGTERM");
    });
  }

  restart(command: string, args: string[], options: object): Promise<void> {
    return this.stop().then(() => this.start(command, args, options));
  }
}
```

### 13. Add Server Health Check with Retry Logic

**File:** `src/main.ts:82-100`

**Problem:** Server health check uses a simple interval without max retries or exponential backoff.

**Solution:** Implement proper retry logic.

```typescript
async function waitForServer(url: string, maxRetries = 30, initialDelay = 100): Promise<boolean> {
  let delay = initialDelay;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url);
      if (response.status === 200) {
        return true;
      }
    } catch {
      // Server not ready yet
    }

    await new Promise((resolve) => setTimeout(resolve, delay));
    delay = Math.min(delay * 1.5, 2000); // Exponential backoff, max 2 seconds
  }

  return false;
}

// Usage
const serverReady = await waitForServer(expressAppUrl);
if (serverReady) {
  mainWindow.webContents.send("server-running");
} else {
  dialog.showErrorBox("Server Error", "Express server failed to start");
}
```

---

## Performance Optimizations

### 14. Debounce Log Updates

**File:** `src/app.ts:24-29`

**Problem:** Each log entry triggers a DOM update, which can be expensive with high-frequency logging.

**Solution:** Batch log updates.

```typescript
let logBuffer: string[] = [];
let updateScheduled = false;

function flushLogs(): void {
  if (logBuffer.length === 0) return;

  const fragment = document.createDocumentFragment();
  for (const line of logBuffer) {
    const span = document.createElement("span");
    span.textContent = line;
    fragment.appendChild(span);
  }
  serverLog.appendChild(fragment);
  logBuffer = [];
  updateScheduled = false;

  // Trim old entries
  while (serverLog.childNodes.length > MAX_LOG_ENTRIES) {
    serverLog.removeChild(serverLog.firstChild!);
  }
}

ipcRenderer.on("server-log-entry", (_event: unknown, arg: string) => {
  logBuffer.push(arg);
  if (!updateScheduled) {
    updateScheduled = true;
    requestAnimationFrame(flushLogs);
  }
});
```

### 15. Use Virtual Scrolling for Large Logs

**File:** `dist/index.html`, `src/app.ts`

**Problem:** Rendering thousands of DOM nodes for log entries is inefficient.

**Solution:** Consider implementing virtual scrolling for the log viewer, rendering only visible entries. Libraries like `virtual-scroller` or a custom implementation can help.

---

## Testing Recommendations

### 16. Add Unit Tests

**Problem:** No test files exist in the project.

**Solution:** Add a testing framework and write tests.

```bash
pnpm add -D vitest @testing-library/dom jsdom
```

Example test for `stripAnsiColors`:

```typescript
// src/main.test.ts
import { describe, it, expect } from "vitest";
import { stripAnsiColors } from "./main";

describe("stripAnsiColors", () => {
  it("removes ANSI color codes", () => {
    const input = "\x1b[32mGreen text\x1b[0m";
    expect(stripAnsiColors(input)).toBe("Green text");
  });

  it("handles text without ANSI codes", () => {
    expect(stripAnsiColors("Plain text")).toBe("Plain text");
  });
});
```

### 17. Add Integration Tests for Express Routes

```typescript
// src/express-app.test.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "./express-app";

describe("Express Routes", () => {
  it("GET / returns 200", async () => {
    const response = await request(app).get("/");
    expect(response.status).toBe(200);
  });

  it("GET /pageTwo returns 200", async () => {
    const response = await request(app).get("/pageTwo");
    expect(response.status).toBe(200);
  });

  it("GET /unknown returns 404", async () => {
    const response = await request(app).get("/unknown");
    expect(response.status).toBe(404);
  });
});
```

---

## Documentation Improvements

### 18. Add JSDoc Comments for Key Functions

**File:** `src/main.ts`

```typescript
/**
 * Removes ANSI color/formatting codes from terminal output.
 * Used to clean up Express server logs before displaying in the UI.
 *
 * @param input - String potentially containing ANSI escape sequences
 * @returns Clean string with all ANSI codes removed
 */
function stripAnsiColors(input: string): string {
  return input.replace(/\x1b\[[0-9;]*m/g, "");
}

/**
 * Redirects stdout/stderr from a child process to the renderer via IPC.
 * Each line is cleaned of ANSI codes and sent as a separate message.
 *
 * @param stream - The readable stream (stdout or stderr) to redirect
 * @param channel - The IPC channel name to send messages on
 */
function redirectOutput(
  stream: NodeJS.ReadableStream | null,
  channel: string
): void {
  // ...
}
```

---

## Summary of Priority

| Priority | Issue | Impact |
|----------|-------|--------|
| **High** | Memory leak in logs | Application crash over time |
| **High** | No spawn error handling | Silent failures |
| **High** | Type safety issues | Development experience, bugs |
| **Medium** | Hardcoded configuration | Deployment flexibility |
| **Medium** | CORS hardcoded | Security, flexibility |
| **Medium** | No tests | Code reliability |
| **Low** | Import style consistency | Code quality |
| **Low** | Documentation | Maintainability |

---

## Quick Wins

These changes provide immediate value with minimal effort:

1. Add `MAX_LOG_ENTRIES` constant and cleanup logic (5 min)
2. Add error listener to spawn call (2 min)
3. Create `types.d.ts` for window API (10 min)
4. Extract ports to environment variables (5 min)
5. Add JSDoc comments to key functions (15 min)
