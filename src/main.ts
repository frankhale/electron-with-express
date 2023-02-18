import { app, globalShortcut, BrowserWindow, ipcMain } from "electron";
import { Readable } from "stream";
import { spawn } from "child_process";
import path from "path";
import fetch from "node-fetch";
import { name } from "../package.json";

const appName = app.getPath("exe");
const expressAppUrl = "http://127.0.0.1:3000";
let mainWindow: BrowserWindow | null;
let expressPath = "./dist/src/express-app.js";

if (appName.endsWith(`${name}.exe`)) {
	expressPath = path.join("./resources/app.asar", expressPath);
}

function redirectOutput(x: Readable) {
	x.on("data", function (data: any) {
		data
			.toString()
			.split("\n")
			.forEach((line: string) => {
				if (line !== "") {
					// regex from: http://stackoverflow.com/a/29497680/170217
					// REGEX to Remove all ANSI colors/styles from strings
					let serverLogEntry = line.replace(
						/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
						""
					);
					mainWindow!.webContents.send("server-log-entry", serverLogEntry);
				}
			});
	});
}

function registerGlobalShortcuts() {
	globalShortcut.register("CommandOrControl+Shift+L", () => {
		mainWindow!.webContents.send("show-server-log");
	});
}

function createWindow() {
	const expressAppProcess = spawn(appName, [expressPath], {
		env: {
			ELECTRON_RUN_AS_NODE: "1",
		},
	});
	redirectOutput(expressAppProcess.stdout);
	redirectOutput(expressAppProcess.stderr);

	mainWindow = new BrowserWindow({
		autoHideMenuBar: true,
		width: 640,
		height: 480,
		icon: path.join(__dirname, path.join("..", "favicon.ico")),
		webPreferences: {
			preload: path.join(__dirname, "preload.js"),
		},
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

	ipcMain.handle("get-express-app-url", () => {
		return expressAppUrl;
	});

	//mainWindow.webContents.openDevTools();
	mainWindow.loadURL(`file://${__dirname}/../index.html`);
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
		fetch(expressAppUrl)
			.then((response: any) => {
				if (response.status === 200) {
					clearInterval(checkServerRunning);
					mainWindow!.webContents.send("server-running");
				}
			})
			.catch((err) => {
				// swallow exception
			});
	}, 1000);
});
