const { app, globalShortcut, BrowserWindow } = require('electron');

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
    mainWindow.loadURL(`file://${__dirname}/server/index.html`);
    // mainWindow.webContents.openDevTools();
    mainWindow.on("close", () => {
        mainWindow.webContents.send("stop-server");
    });
    mainWindow.on("closed", () => {
        mainWindow = null;
    });
}

app.on("window-all-closed", function () {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.whenReady().then(() => {
    globalShortcut.register("CommandOrControl+L", () => {
        mainWindow.webContents.send("show-server-log");
    })
}).then(createWindow);