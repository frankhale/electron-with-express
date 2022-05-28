// Internal Dependencies
const { ipcRenderer } = require("electron");
const spawn = require("child_process").spawn;
const request = require("request");
const _ = require("lodash");

// Global Path
const expressAppUrl = "http://127.0.0.1:3000";
const nodePath = ".\\node_modules\\node\\bin\\node.exe";
const expressPath = "./express-app/bin/www";

// Elements ID
const serverLog = document.getElementById("serverLog");
const expressApp = document.getElementById("expressApp");
const loading = document.getElementById("loading");


// For electron-packager change cwd in spawn to app.getAppPath() and
// uncomment the app require below
//const app = require('@electron/remote').app;
const node = spawn(nodePath, [expressPath], {
    cwd: process.cwd(),
});


/**
 * ==============================
 *      GLOBAL EVENTS
 * ==============================
 */

ipcRenderer.on("stop-server", (event, data) => {
    process.on('SIGTERM', function onSigterm() {
        node.close(function onServerClosed(err) {
            if (err) {
                console.error(err)
                process.exit(1)
            }
            closeMyResources(function onResourcesClosed(err) {
                process.exit()
            })
        })
    });
});

ipcRenderer.on("show-server-log", (event, data) => {
    if (serverLog.style.display == "none") {
        serverLog.style.display = "block";
        expressApp.classList.add("expressAppHide");
    } else {
        expressApp.classList.remove("expressAppHide");
        serverLog.style.display = "none";
    }
});

/* XXXXXXXXXX END OF GLOBAL EVENTS XXXXXXXXXX */


/**
 * ========================================
 *              FUNCTIONS
 * ========================================
 */

function strip(s) {
    // regex from: http://stackoverflow.com/a/29497680/170217
    // REGEX to Remove all ANSI colors/styles from strings
    return s.replace(
        /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
        ""
    );
}

function redirectOutput(x) {
    let lineBuffer = "";
    x.on("data", function (data) {
        lineBuffer += data.toString();

        let lines = lineBuffer.split("\n");
        _.forEach(lines, (l) => {
            if (l !== "") {
                let infoSpan = document.createElement("span");
                infoSpan.textContent = strip(l);
                serverLog.append(infoSpan);
                serverLog.append(document.createElement("br"));
            }
        });
        lineBuffer = lines[lines.length - 1];
    });
}

/* XXXXXXXXXX END OF FUNCTIONS XXXXXXXXXXX */


redirectOutput(node.stdout);

redirectOutput(node.stderr);

let checkServerRunning = setInterval(() => {
    request(expressAppUrl, (error, response, body) => {
        if (!error && response.statusCode == 200) {
            expressApp.setAttribute("src", expressAppUrl);
            loading.style.display = "none";
            expressApp.style.display = "block";
            clearInterval(checkServerRunning);
        }
    });
}, 1000);