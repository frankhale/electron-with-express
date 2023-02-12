import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("api", {
	getExpressAppUrl: () => ipcRenderer.invoke("get-express-app-url")
});

contextBridge.exposeInMainWorld("ipcRenderer", {
	on: (channel: string, listener: (event: any, ...args: any[]) => void) => {
		ipcRenderer.on(channel, listener);
	}
});
