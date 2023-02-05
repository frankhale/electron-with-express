import { ipcRenderer } from "electron";

const expressAppUrl = "http://127.0.0.1:3000";

const serverLog = document.getElementById("serverLog");
const expressApp = document.getElementById("expressApp");
const loading = document.getElementById("loading");

ipcRenderer.on("server-running", (_event, _data) => {
  expressApp!.setAttribute("src", expressAppUrl);
  loading!.style.display = "none";
  expressApp!.style.display = "block";
});

ipcRenderer.on("server-log-entry", (_event, data) => {
  let infoSpan = document.createElement("span");
  infoSpan.textContent = data;
  serverLog!.append(infoSpan);
  serverLog!.append(document.createElement("br"));
});

ipcRenderer.on("show-server-log", (_event, _data) => {
  if (serverLog!.style.display === "none" || serverLog!.style.display === "") {
    serverLog!.style.display = "block";
    expressApp!.classList.add("expressAppHide");
  } else {
    expressApp!.classList.remove("expressAppHide");
    serverLog!.style.display = "none";
  }
});
