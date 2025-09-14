const iohook = require('@tkomde/iohook');
const { app, BrowserWindow, desktopCapturer, session, ipcMain } = require('electron');
const { GlobalKeyboardListener } = require('node-global-key-listener');
const path = require('path');

const v = new GlobalKeyboardListener();

let DEBUG = true;

let key;
let mainWindow;
let server_name;
let setKey = false;

DEBUG = false;

if (DEBUG) {
  server_name = 'http://localhost/app/';
  process.env.ELECTRON_ENABLE_LOGGING = '1';
  process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = '1';
} else {
  server_name = 'https://талька.рф/app/';
}


iohook.on('mousedown', e => keyListener(`m-${e.button}`, 'micro-down'));
iohook.on('mouseup', e => keyListener(`m-${e.button}`, 'micro-up'));

iohook.on('keydown', e => keyListener(`k-${e.keycode}`, 'micro-down'));
iohook.on('keyup', e => keyListener(`k-${e.keycode}`, 'micro-up'));

iohook.start();

// Отправка данных в веб-страницу
// mainWindow.webContents.send
app.commandLine.appendSwitch('disable-http-cache');

function keyListener(lkey, sendKey) {
  // console.log(lkey, sendKey);

  if (setKey) {
    setKey = false;
    key = lkey;
    mainWindow.webContents.send('new-micro-key', { 'key': key });
  }

  if (key == lkey) mainWindow.webContents.send(sendKey, '');
};

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
