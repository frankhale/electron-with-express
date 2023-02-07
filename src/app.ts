const serverLog = document.getElementById("serverLog");
const expressApp = document.getElementById("expressApp");
const loading = document.getElementById("loading");

(async () => {
	// @ts-expect-error
	const expressAppURL = await api.getExpressAppUrl();
	// @ts-expect-error
	ipcRenderer.on("server-running", (_event, _data) => {
		expressApp!.setAttribute("src", expressAppURL);
		loading!.style.display = "none";
		expressApp!.style.display = "block";
	});
})();

// @ts-expect-error
ipcRenderer.on("server-log-entry", (_event, data) => {
	let infoSpan = document.createElement("span");
	infoSpan.textContent = data;
	serverLog!.append(infoSpan);
	serverLog!.append(document.createElement("br"));
});

// @ts-expect-error
ipcRenderer.on("show-server-log", (_event, _data) => {
	if (serverLog!.style.display === "none" || serverLog!.style.display === "") {
		serverLog!.style.display = "block";
		expressApp!.classList.add("expressAppHide");
	} else {
		expressApp!.classList.remove("expressAppHide");
		serverLog!.style.display = "none";
	}
});
