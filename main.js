const { app, globalShortcut, BrowserWindow } = require('electron');
const main = require('@electron/remote/main');
const { Console } = require('console');

let mainWindow;

function registerGlobalShortcuts() {
    globalShortcut.register("CommandOrControl+Shift+L", () => {
        mainWindow.webContents.send("show-server-log");
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
            enableRemoteModule: true,
            contextIsolation: false
        }
    });

    main.initialize();
    main.enable(mainWindow.webContents);

    mainWindow.loadURL(`file://${__dirname}/server/index.html`);
    // mainWindow.webContents.openDevTools();
    mainWindow.on("close", () => {
        mainWindow.webContents.send("stop-server");
    });
    mainWindow.on("closed", () => {
        mainWindow = null;
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
            createWindow()
        }
    });
});