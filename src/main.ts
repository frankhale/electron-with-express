import { app, globalShortcut, BrowserWindow, ipcMain, dialog } from "electron";
import { Readable } from "stream";
import { spawn, ChildProcess } from "child_process";
import path from "path";
import fs from "fs";
import { createServer } from "node:http";
import { Server as SocketIOServer } from "socket.io";
import { name } from "../package.json";
import {
  expressUrl,
  socketPort,
  window as windowConfig,
  healthCheck,
  shutdownTimeout,
} from "./config";

interface WindowState {
  width: number;
  height: number;
  x?: number;
  y?: number;
}

const windowStatePath = path.join(app.getPath("userData"), "window-state.json");

/**
 * Loads the saved window state from disk.
 * Returns default dimensions if no saved state exists.
 */
function getWindowState(): WindowState {
  try {
    if (fs.existsSync(windowStatePath)) {
      const data = fs.readFileSync(windowStatePath, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Failed to load window state:", err);
  }
  return {
    width: windowConfig.width,
    height: windowConfig.height,
  };
}

/**
 * Saves the current window state to disk.
 */
function saveWindowState(): void {
  if (!mainWindow) return;
  try {
    const bounds = mainWindow.getBounds();
    fs.writeFileSync(windowStatePath, JSON.stringify(bounds, null, 2));
  } catch (err) {
    console.error("Failed to save window state:", err);
  }
}

const appName = app.getPath("exe");
let mainWindow: BrowserWindow | null;
let serverRunningNotified = false;

const server = createServer();
const io = new SocketIOServer(server, {
  cors: { origin: "*" },
});

io.on("connection", (socket) => {
  console.log("client connected");
  socket.send("hello", "you connected");

  socket.on("hello", () => {
    console.log("Received hello message");
    socket.emit("hello", "hello,world!");
  });
});

server.listen(socketPort, () => {
  console.log(`socket.io server listening on port ${socketPort}`);
});

const expressPath =
  appName.endsWith(`${name}.exe`) || appName.endsWith(name)
    ? path.join(app.getAppPath(), "dist/src/express-app.js")
    : "./dist/src/express-app.js";

function stripAnsiColors(text: string): string {
  return text.replace(
    /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
    ""
  );
}

function redirectOutput(stream: Readable): void {
  stream.on("data", (data: Buffer) => {
    if (!mainWindow) return;
    data
      .toString()
      .split("\n")
      .forEach((line: string) => {
        if (line !== "") {
          mainWindow!.webContents.send(
            "server-log-entry",
            stripAnsiColors(line)
          );
        }
      });
  });
}

function registerGlobalShortcuts(): void {
  globalShortcut.register("CommandOrControl+Shift+L", () => {
    mainWindow!.webContents.send("show-server-log");
  });
  globalShortcut.register("CommandOrControl+Shift+I", () => {
    mainWindow!.webContents.openDevTools();
  });
}

function unregisterAllShortcuts(): void {
  globalShortcut.unregisterAll();
}

async function waitForServer(
  url: string,
  maxRetries = healthCheck.maxRetries,
  initialDelay = healthCheck.initialDelay
): Promise<boolean> {
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
    delay = Math.min(delay * 1.5, healthCheck.maxDelay);
  }

  return false;
}

function gracefulShutdown(
  process: ChildProcess,
  timeout = shutdownTimeout
): void {
  if (!process || process.killed) return;

  process.kill("SIGTERM");

  const timer = setTimeout(() => {
    if (process && !process.killed) {
      console.log("Force killing Express server after timeout");
      process.kill("SIGKILL");
    }
  }, timeout);

  process.once("exit", () => {
    clearTimeout(timer);
  });
}

function createWindow(): void {
  const expressAppProcess = spawn(appName, [expressPath], {
    env: { ELECTRON_RUN_AS_NODE: "1" },
  });

  expressAppProcess.on("error", (err) => {
    console.error("Failed to start Express server:", err);
    dialog.showErrorBox(
      "Server Error",
      `Failed to start Express server: ${err.message}`
    );
  });

  expressAppProcess.on("exit", (code, signal) => {
    if (code !== 0 && code !== null) {
      console.error(
        `Express server exited with code ${code}, signal ${signal}`
      );
    }
  });

  [expressAppProcess.stdout, expressAppProcess.stderr].forEach((stream) => {
    if (stream) redirectOutput(stream);
  });

  const windowState = getWindowState();

  mainWindow = new BrowserWindow({
    autoHideMenuBar: true,
    width: windowState.width,
    height: windowState.height,
    x: windowState.x,
    y: windowState.y,
    icon: path.join(__dirname, "..", "favicon.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  mainWindow.on("close", saveWindowState);

  mainWindow.on("closed", () => {
    gracefulShutdown(expressAppProcess);
    mainWindow = null;
  });

  mainWindow.on("focus", registerGlobalShortcuts);
  mainWindow.on("blur", unregisterAllShortcuts);

  mainWindow.webContents.on("did-finish-load", () => {
    // Only send on reload if server was already confirmed running
    if (serverRunningNotified) {
      mainWindow?.webContents.send("server-running");
    }
  });

  ipcMain.handle("get-express-app-url", () => expressUrl);

  mainWindow.loadURL(`file://${__dirname}/../index.html`);
}

app.on("window-all-closed", () => {
  app.quit();
});

app.whenReady().then(async () => {
  registerGlobalShortcuts();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  const serverReady = await waitForServer(expressUrl);
  if (serverReady) {
    serverRunningNotified = true;
    mainWindow?.webContents.send("server-running");
  } else {
    dialog.showErrorBox(
      "Server Error",
      "Express server failed to start within the expected time."
    );
  }
});
