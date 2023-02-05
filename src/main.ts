import { app, globalShortcut, BrowserWindow } from "electron";
import { spawn } from "child_process";
import fetch from "node-fetch";

let mainWindow: BrowserWindow | null;

const expressAppUrl = "http://127.0.0.1:3000";
const expressPath = "./express-app/bin/www";

const expressAppProcess = spawn(app.getPath("exe"), [expressPath], {
    cwd: process.cwd(),
    env: {
        ELECTRON_RUN_AS_NODE: "1",
    }
});

function registerGlobalShortcuts() {
    globalShortcut.register("CommandOrControl+Shift+L", () => {
        mainWindow?.webContents.send("show-server-log");
    });
}

function createWindow() {
    mainWindow = new BrowserWindow({
        autoHideMenuBar: true,
        width: 640,
        height: 480,
        icon: "favicon.ico",
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    //mainWindow.webContents.openDevTools();
    mainWindow.loadURL(`file://${__dirname}/../index.html`);

    mainWindow.on("close", () => {
        mainWindow?.webContents.send("stop-server");
    });
    mainWindow.on("closed", () => {
        mainWindow = null;
        expressAppProcess.kill();
    });
    mainWindow.on("focus", () => {
        registerGlobalShortcuts();
    });
    mainWindow.on("blur", () => {
        globalShortcut.unregisterAll();
    });
}

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.whenReady().then(() => {
    registerGlobalShortcuts();
    createWindow();

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });

    let checkServerRunning = setInterval(() => {
        (async () => {
            fetch(expressAppUrl)
                .then((response: any) => {
                    if (response.status === 200) {
                        clearInterval(checkServerRunning);
                        mainWindow?.webContents.send("server-running");
                    }
                });
        })();
    }, 1000);
});

function strip(s: string) {
    // regex from: http://stackoverflow.com/a/29497680/170217
    // REGEX to Remove all ANSI colors/styles from strings
    return s.replace(
        /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
        ""
    );
}

function redirectOutput(x: any) {
    let lineBuffer = "";
    x.on("data", function (data: any) {
        lineBuffer += data.toString();

        let lines = lineBuffer.split("\n");

        lines.forEach((l) => {
            if (l !== "") {
                mainWindow?.webContents.send("server-log-entry", strip(l));
            }
        });
        lineBuffer = lines[lines.length - 1];
    });
}

redirectOutput(expressAppProcess.stdout);
redirectOutput(expressAppProcess.stderr);