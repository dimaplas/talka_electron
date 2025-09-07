const { app, BrowserWindow, desktopCapturer, session, ipcMain } = require('electron');
const { GlobalKeyboardListener } = require('node-global-key-listener');
const path = require('path');

const v = new GlobalKeyboardListener();

let mainWindow;
let key;
let setKey = false;
let swith_micro = false;

let server_name;

// let DEBUG = false;
let DEBUG = true;

if (DEBUG) {
  server_name = 'http://localhost/app/';
  process.env.ELECTRON_ENABLE_LOGGING = '1';
  process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = '1';
} else {
  server_name = 'https://талька.рф/app/';
}


// Отправка данных в веб-страницу
// mainWindow.webContents.send
app.commandLine.appendSwitch('disable-http-cache');

v.addListener(function (e) {
  if (setKey) {
    setKey = false;
    key = e.scanCode;
    mainWindow.webContents.send('new-micro-key', { 'key': key });
  }

  if (key == e.scanCode) {
    if (e.state == 'DOWN') {
      swith_micro = true;
      mainWindow.webContents.send('micro-down', '');
    } else {
      swith_micro = false;
      mainWindow.webContents.send('micro-up', '');
    }
  }
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 700,
    minWidth: 1200,
    minHeight: 700,

    autoHideMenuBar: true,
    titleBarStyle: 'hiddenInset',
    resizable: true,

    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      enableRemoteModule: true,
      mediaDevices: true
    }
  });

  // Загрузка сайта
  mainWindow.loadURL(server_name);

  // Откройте DevTools (опционально)
  // mainWindow.webContents.openDevTools();

  session.defaultSession.setDisplayMediaRequestHandler((request, callback) => {
    desktopCapturer.getSources({ types: ['screen', 'window'] }).then((sources) => {
      callback({ video: sources[0], audio: 'loopback' })
    })
  }, { useSystemPicker: true })

}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  // Получение данных из веб-страницы
  ipcMain.on('set-micro-key', () => {
    setKey = true;
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
