// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import { PriceList } from "@/lib/types";

export type Channels = 'ipc-example';

const electronHandler = {
  ipcRenderer: {
    sendMessage(channel: Channels, ...args: unknown[]) {
      ipcRenderer.send(channel, ...args);
    },
    on(channel: Channels, func: (...args: unknown[]) => void) {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
        func(...args);
      ipcRenderer.on(channel, subscription);

      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    },
    once(channel: Channels, func: (...args: unknown[]) => void) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    },
  },
  getPricelist: (): Promise<PriceList> => ipcRenderer.invoke("get-pricelist"),
  savePricelist: (data: PriceList): Promise<PriceList> => ipcRenderer.invoke("save-pricelist", data),
  getFilePath: () => ipcRenderer.invoke("get-data-dir"),
  openDataDir: () => ipcRenderer.invoke("open-data-dir"),
  changeDataDir: () => ipcRenderer.invoke("change-data-dir")
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
