import { app, globalShortcut, BrowserWindow, ipcMain } from "electron";
import { Readable } from "stream";
import { spawn } from "child_process";
import path from "path";
import fetch from "node-fetch";
import { name } from "../package.json";
import {Socket} from "socket.io";
//import fs from "fs";

const appName = app.getPath("exe");
const expressAppUrl = "http://127.0.0.1:3000";
let mainWindow: BrowserWindow | null;

const server = require('http').createServer();
const io = require('socket.io')(server, {
  cors: {origin: "*"},
  methods: ['GET', 'POST']
});

io.on('connection', (socket: Socket) => {
  console.log('client connected');
  socket.send('hello', 'you connected');

  socket.on('hello', () => {
    console.log('Received hello message');
    socket.emit('hello', 'hello,world!');
  });
});

server.listen(3001, () => {
  console.log('socket.io server listening on port 3001');
});

// const logPath = path.join(app.getPath("home"), ".express-app-log");
// const logStream = fs.createWriteStream(logPath, { flags: "a" });

const expressPath =
  appName.endsWith(`${name}.exe`) || appName.endsWith(name)
    ? path.join(app.getAppPath(), "dist/src/express-app.js")
    : "./dist/src/express-app.js";

// logStream.write(`App name: ${appName}\n`);
// logStream.write(`App path: ${app.getAppPath()}\n`);
// logStream.write(`Starting express app with path: ${expressPath}\n`);
// logStream.close();

function stripAnsiColors(text: string): string {
  return text.replace(
    /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
    ""
  );
}

function redirectOutput(stream: Readable) {
  stream.on("data", (data: any) => {
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

function registerGlobalShortcuts() {
  globalShortcut.register("CommandOrControl+Shift+L", () => {
    mainWindow!.webContents.send("show-server-log");
  });
  globalShortcut.register("CommandOrControl+Shift+I", () => {
    mainWindow!.webContents.openDevTools();
  });
}

function unregisterAllShortcuts() {
  globalShortcut.unregisterAll();
}

function createWindow() {
  const expressAppProcess = spawn(appName, [expressPath], {
    env: { ELECTRON_RUN_AS_NODE: "1" },
  });

  [expressAppProcess.stdout, expressAppProcess.stderr].forEach(redirectOutput);

  mainWindow = new BrowserWindow({
    autoHideMenuBar: true,
    width: 640,
    height: 480,
    icon: path.join(__dirname, "..", "favicon.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
    expressAppProcess.kill();
  });

  mainWindow.on("focus", registerGlobalShortcuts);
  mainWindow.on("blur", unregisterAllShortcuts);

  ipcMain.handle("get-express-app-url", () => expressAppUrl);

  mainWindow.loadURL(`file://${__dirname}/../index.html`);
}

app.on("window-all-closed", () => {
  //if (process.platform !== "darwin") app.quit();
  app.quit();
});

app.whenReady().then(() => {
  registerGlobalShortcuts();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  const checkServerRunning = setInterval(() => {
    fetch(expressAppUrl)
      .then((response) => {
        if (response.status === 200) {
          clearInterval(checkServerRunning);
          mainWindow!.webContents.send("server-running");
        }
      })
      .catch(() => {}); // swallow exception
  }, 1000);
});
