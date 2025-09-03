/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow, shell, ipcMain, dialog } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import fs from "fs";
import { PriceList } from "@/lib/types";
import { defaultDoctors, defaultPriceList } from "@/contexts/app-context";
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';


class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

// Путь к конфигу, где сохраняем рабочую папку
const configPath = path.join(app.getPath("userData"), "config.json");

// Читаем или создаём дефолтный конфиг
function getConfig(): { dataDir: string } {
  if (!fs.existsSync(configPath)) {
    return { dataDir: "" };
  }
  return JSON.parse(fs.readFileSync(configPath, "utf-8"));
}

function saveConfig(config: { dataDir: string }) {
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
}

async function ensureDataDir() {
  const config = getConfig();

  if (!config.dataDir) {
    const result = await dialog.showOpenDialog({
      title: "Выберите папку для хранения данных",
      properties: ["openDirectory", "createDirectory"],
    });

    if (!result.canceled && result.filePaths.length > 0) {
      // eslint-disable-next-line prefer-destructuring
      config.dataDir = result.filePaths[0];
      saveConfig(config);

      // создаём файл pricelist.json с тестовыми данными
      const filePathPriceList = path.join(config.dataDir, "pricelist.json");
      if (!fs.existsSync(filePathPriceList)) {
        fs.writeFileSync(filePathPriceList, JSON.stringify(defaultPriceList, null, 2), "utf-8");
      }
      const filePathDoctors = path.join(config.dataDir, "doctors.json");
      if (!fs.existsSync(filePathDoctors)) {
        fs.writeFileSync(filePathDoctors, JSON.stringify(defaultDoctors, null, 2), "utf-8");
      }
      const filePathInvoicesList = path.join(config.dataDir, "invoices-list.json");
      if (!fs.existsSync(filePathInvoicesList)) {
        fs.writeFileSync(filePathInvoicesList,JSON.stringify([], null, 2), "utf-8");
      }
    }
  }
  return config.dataDir;
}

/* ---------- IPC методы ---------- */

// ipcMain.on('ipc-example', async (event, arg) => {
//   const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
//   console.log(msgTemplate(arg));
//   event.reply('ipc-example', msgTemplate('pong'));
// });

// const userDataPath = app.getPath("userData");

// ipcMain.handle("get-pricelist", async () => {
//   const filePath = path.join(userDataPath, "data/pricelist.json");
//   if (!fs.existsSync(filePath)) return null;
//   const priceList: PriceList = JSON.parse(fs.readFileSync(filePath, "utf-8"));
//   return priceList
// });
//
// ipcMain.handle("save-pricelist", async (_, data) => {
//   // путь к рабочей папке
//   const dataDir = path.join(userDataPath, "data");
//
//   // Создаём папку, если её нет
//   if (!fs.existsSync(dataDir)) {
//     fs.mkdirSync(dataDir, { recursive: true });
//     console.log("Created folder:", dataDir);
//   }
//
//   // путь к файлу
//   const filePath = path.join(dataDir, "pricelist.json");
//
//   // Записываем файл
//   fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
//   console.log("New pricelist saved at:", filePath);
// });
function sanitizeFilename(name: string) {
  // убираем / \ : * ? " < > | и пробелы в конце
  return name.replace(/[/\\:*?"<>|]/g, "_");
}

ipcMain.handle("save-invoice", async (_, data: { filename: string; bufferedInvoice: any }) => {
  try {
    const invoicesDir = path.join(getConfig().dataDir, "invoices");

    // создаём папку, если её нет
    if (!fs.existsSync(invoicesDir)) {
      await fs.mkdirSync(invoicesDir, { recursive: true });
    }

    const filePath = path.join(invoicesDir, sanitizeFilename(data.filename)); // добавляем расширение
    console.log(`FILEPATH: ${filePath}`);

    await fs.writeFileSync(filePath, data.bufferedInvoice);
    console.log("New invoice saved at:", filePath);
  } catch (err) {
    console.error("Failed to save invoice:", err);
    return { success: false, error: err };
  }
});

ipcMain.handle("open-invoice", async  (_, data: {filename:string}) => {
  const invoicesDir = path.join(getConfig().dataDir, "invoices");
  // создаём папку, если её нет
  if (!fs.existsSync(invoicesDir)) {
    fs.mkdirSync(invoicesDir, { recursive: true });
  }
  const filePath = path.join(invoicesDir, sanitizeFilename(data.filename));
  const result = await shell.openPath(filePath);

  if (result) {
    // если не пустая строка → ошибка
    throw new Error(`Failed to open file: ${result}`);
  }

  return true;
})

ipcMain.handle("get-doctors", async () => {
  const filePath = path.join(getConfig().dataDir, "doctors.json");
  if (!fs.existsSync(filePath)) return null;
  const doctors = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  return doctors
});

ipcMain.handle("save-doctors", async (_, data) => {
  const filePath = path.join(getConfig().dataDir, "doctors.json");
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  console.log("New doctors list saved at:", filePath);
});

ipcMain.handle("get-pricelist", async () => {
  const filePath = path.join(getConfig().dataDir, "pricelist.json");
  if (!fs.existsSync(filePath)) return null;
  const priceList: PriceList = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  return priceList;
});

ipcMain.handle("save-pricelist", async (_, data) => {
  const filePath = path.join(getConfig().dataDir, "pricelist.json");
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  console.log("New pricelist saved at:", filePath);
});

// Получение списка инвойсов
ipcMain.handle("get-invoices-list", async () => {
  const filePath = path.join(getConfig().dataDir, "invoices-list.json");
  if (!fs.existsSync(filePath)) return null;

  const invoicesList = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  return invoicesList;
});

// Сохранение списка инвойсов
ipcMain.handle("save-invoices-list", async (_, data) => {
  const filePath = path.join(getConfig().dataDir, "invoices-list.json");
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  console.log("New invoices list saved at:", filePath);
});

ipcMain.handle("delete-invoice", async (_, { id, filename }) => {
  const listPath = path.join(getConfig().dataDir, "invoices-list.json");
  const invoicesDir = path.join(getConfig().dataDir, "invoices");
  const filePath = path.join(invoicesDir, filename);

  try {
    // Удаляем файл, если он существует
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log("Deleted invoice file:", filePath);
    }

    // Читаем список
    let invoicesList: any[] = [];
    if (fs.existsSync(listPath)) {
      invoicesList = JSON.parse(fs.readFileSync(listPath, "utf-8"));
    }

    // Фильтруем по id
    const updatedList = invoicesList.filter((inv) => inv.id !== id);

    // Сохраняем новый список
    fs.writeFileSync(listPath, JSON.stringify(updatedList, null, 2), "utf-8");
    console.log("Updated invoices list after deletion:", listPath);

    return updatedList;
  } catch (error) {
    console.error("Error deleting invoice:", error);
    throw error;
  }
});

// Получить текущий путь
ipcMain.handle("get-data-dir", async () => {
  return getConfig().dataDir;
});

// Открыть папку в проводнике
ipcMain.handle("open-data-dir", async () => {
  const config = getConfig();
  if (config.dataDir && fs.existsSync(config.dataDir)) {
    shell.openPath(config.dataDir);
    return true;
  }
  return false;
});

// Сменить папку (например через настройки)
ipcMain.handle("change-data-dir", async () => {
  const result = await dialog.showOpenDialog({
    title: "Выберите новую папку",
    properties: ["openDirectory", "createDirectory"],
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const newDir = result.filePaths[0];
    saveConfig({ dataDir: newDir });
    const filePathPriceList = path.join(newDir, "pricelist.json");
    if (!fs.existsSync(filePathPriceList)) {
      fs.writeFileSync(filePathPriceList, JSON.stringify(defaultPriceList, null, 2), "utf-8");
    }
    const filePathDoctors = path.join(newDir, "doctors.json");
    if (!fs.existsSync(filePathDoctors)) {
      fs.writeFileSync(filePathDoctors, JSON.stringify(defaultDoctors, null, 2), "utf-8");
    }
    const filePathInvoicesList = path.join(newDir, "invoices-list.json");
    if (!fs.existsSync(filePathInvoicesList)) {
      fs.writeFileSync(filePathInvoicesList,JSON.stringify([], null, 2), "utf-8");
    }

    return newDir;
  }
  return null;
});

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug').default();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload,
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(async () => {
    // дождёмся выбора/создания dataDir перед созданием окна
    await ensureDataDir();
    await createWindow();
    app.on('activate', () => {
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
