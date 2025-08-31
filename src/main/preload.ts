// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import { Doctor, InvoiceListItem, PriceList } from '@/lib/types';

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
  getDoctors: (): Promise<Doctor[]> => ipcRenderer.invoke("get-doctors"),
  saveDoctors: (data: Doctor[]): Promise<Doctor[]> => ipcRenderer.invoke("save-doctors", data),
  getFilePath: () => ipcRenderer.invoke("get-data-dir"),
  openDataDir: () => ipcRenderer.invoke("open-data-dir"),
  changeDataDir: () => ipcRenderer.invoke("change-data-dir"),
  saveInvoice: (data: {filename: string, bufferedInvoice: any}) => ipcRenderer.invoke("save-invoice", data),
  openInvoice: (data: {filename: string}) => ipcRenderer.invoke("open-invoice", data),
  getInvoicesList: (): Promise<InvoiceListItem[]> => ipcRenderer.invoke("get-invoices-list"),
  saveInvoicesList: (data: InvoiceListItem[]): Promise<InvoiceListItem[]> => ipcRenderer.invoke("save-invoices-list", data),
  deleteInvoice: (id: string, filename: string): Promise<InvoiceListItem[]> => ipcRenderer.invoke("delete-invoice", { id, filename }),
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
