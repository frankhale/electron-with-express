import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";

interface API {
  getExpressAppUrl: () => Promise<string>;
}

interface IpcRendererBridge {
  on: (
    channel: string,
    listener: (event: IpcRendererEvent, ...args: unknown[]) => void
  ) => void;
}

const api: API = {
  getExpressAppUrl: () => ipcRenderer.invoke("get-express-app-url"),
};

const ipcRendererBridge: IpcRendererBridge = {
  on: (channel, listener) => ipcRenderer.on(channel, listener),
};

contextBridge.exposeInMainWorld("api", api);
contextBridge.exposeInMainWorld("ipcRenderer", ipcRendererBridge);
