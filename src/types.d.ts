/**
 * Type definitions for the Electron preload bridge API.
 */

interface ElectronAPI {
  getExpressAppUrl: () => Promise<string>;
}

interface IpcRenderer {
  on: (
    channel: string,
    listener: (event: unknown, ...args: unknown[]) => void
  ) => void;
}

declare global {
  interface Window {
    api: ElectronAPI;
    ipcRenderer: IpcRenderer;
  }
}

export { };
