/// <reference path="./types.d.ts" />

const serverLog = document.getElementById("serverLog");
const expressApp = document.getElementById("expressApp");
const loading = document.getElementById("loading");

const MAX_LOG_ENTRIES = 1000;

let logBuffer: string[] = [];
let updateScheduled = false;

function flushLogs(): void {
  if (logBuffer.length === 0) return;

  const fragment = document.createDocumentFragment();
  for (const line of logBuffer) {
    const span = document.createElement("span");
    span.textContent = line;
    fragment.appendChild(span);
    fragment.appendChild(document.createElement("br"));
  }
  serverLog!.appendChild(fragment);
  logBuffer = [];
  updateScheduled = false;

  while (serverLog!.childNodes.length > MAX_LOG_ENTRIES * 2) {
    serverLog!.removeChild(serverLog!.firstChild!);
  }
}

(async () => {
  const expressAppURL = await window.api.getExpressAppUrl();

  window.ipcRenderer.on("server-running", () => {
    expressApp!.setAttribute("src", expressAppURL);
    loading!.style.display = "none";
    expressApp!.style.display = "block";
  });
})();

window.ipcRenderer.on("server-log-entry", (_event, data) => {
  logBuffer.push(data as string);
  if (!updateScheduled) {
    updateScheduled = true;
    requestAnimationFrame(flushLogs);
  }
});

window.ipcRenderer.on("show-server-log", () => {
  if (serverLog!.style.display === "none" || serverLog!.style.display === "") {
    serverLog!.style.display = "block";
    expressApp!.classList.add("expressAppHide");
  } else {
    expressApp!.classList.remove("expressAppHide");
    serverLog!.style.display = "none";
  }
});
