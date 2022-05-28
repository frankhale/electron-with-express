const { app, globalShortcut, BrowserWindow } = require('electron');
const main = require('@electron/remote/main');
const { Console } = require('console');

let mainWindow;

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
        globalShortcut.register("CommandOrControl+l", () => {
            console.log('CommandOrControl+l is pressed');
            mainWindow.webContents.send("show-server-log");
        });
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

app.whenReady().then(createWindow);