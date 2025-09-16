const { app, BrowserWindow, desktopCapturer, session, dialog, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');

const path = require('path');
const iohook = require('@tkomde/iohook');

let DEBUG = true;

let mainWindow;
let loadingWindow;

let key;
let server_name;
let setKey = false;

const isDev = process.defaultApp || process.mas || 
process.env.NODE_ENV === 'development' || 
process.env.ELECTRON_START_URL;

DEBUG = false;

process.env.ELECTRON_ENABLE_LOGGING = '1';
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = '1';

if (DEBUG) {
  server_name = 'http://localhost/app/';
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

function createLoadingWindow() {
  loadingWindow = new BrowserWindow({
    width: 250,
    height: 250,
    // resizable: false,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    }
  });

  loadingWindow.loadFile(path.join(__dirname, 'template/loading.html'));
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1600,
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

  // session.defaultSession.setDisplayMediaRequestHandler((request, callback) => {
  //   desktopCapturer.getSources({ types: ['screen', 'window'] }).then((sources) => {
  //     callback({ video: sources[0], audio: 'loopback' })
  //   })
  // }, { useSystemPicker: true })

  // Создаем обработчик для запроса медиа
  session.defaultSession.setDisplayMediaRequestHandler(async (request, callback) => {
    try {
      var is_callbacked = false;
      // Получаем список доступных источников
      const sources = await desktopCapturer.getSources({
        types: ['window', 'screen'],
        thumbnailSize: {
          width: 200,
          height: 100
        }
      });

      // Создаем окно выбора источника
      const shareWindow = new BrowserWindow({
        width: 740,
        height: 600,
        title: 'Выберите источник экрана',
        parent: mainWindow,
        frame: false,
        fullscreenable: false,
        resizable: false,
        webPreferences: {
          nodeIntegration: true,
          contextIsolation: false,
          enableRemoteModule: true
        }
      });

      // Загружаем HTML для выбора источника
      shareWindow.loadFile(path.join(__dirname, 'template/share.html'));

      // Отправляем источники в окно
      sources.forEach(source => {
        shareWindow.webContents.send('source-item', source);
      });

      // Обработчик выбора источника
      ipcMain.once('source-selected', (event, sourceId) => {
        // Находим выбранный источник
        const selectedSource = sources.find(source => source.id === sourceId);
        
        if (selectedSource) {
          // Вызываем callback с выбранным источником
          callback({
            video: selectedSource,
            audio: 'loopback'
          });
        } else {
          callback({ video: null }); // Отменяем, если источник не найден
        }
        is_callbacked = true;        
        shareWindow.close();
      });

      // Закрываем окно при потере фокуса
      shareWindow.webContents.on('blur', () => {
        shareWindow.close();
        if (!is_callbacked) { callback({ video: null })}; // Отменяем выбор
      });

    } catch (error) {
      console.error('Ошибка получения источников:', error);
      callback({ video: null }); // Отменяем при ошибке
    }
  }, { useSystemPicker: true });

  // Проверка обновлений при запуске
  autoUpdater.checkForUpdatesAndNotify();
}

app.whenReady().then(() => {
  createLoadingWindow();
  // Проверка режима разработки
  if (isDev) {
    console.log('Режим разработки активен');
    // startApp();
  } else {
    // Автообновление
    // Обработка событий обновления
    console.log('autoUpdater => checkForUpdatesAndNotify');
    autoUpdater.checkForUpdatesAndNotify();
    
    autoUpdater.on('update-available', () => {
      console.log('autoUpdater => update-available');
      loadingWindow.webContents.send('update-available');
    });
    
    autoUpdater.on('update-not-available', () => {
      console.log('autoUpdater => update-not-available');
      startApp();
    });
    
    autoUpdater.on('download-progress', (progressObj) => {
      const speed = Math.round(progressObj.speed / 1024)
      const percent = Math.round(progressObj.percent)

      console.log('autoUpdater => download-progress >>>>', speed, percent);
      loadingWindow.webContents.send('download-progress', percent);

      // loadingWindow.webContents.send('download-progress', {
      //   percent: percent,
      //   transferred: progressObj.transferred,
      //   total: progressObj.total,
      //   speed: speed
      // })
    })
    
    autoUpdater.on('update-downloaded', () => {
      console.log('autoUpdater => update-downloaded');
      autoUpdater.quitAndInstall();
    });
    
    autoUpdater.on('error', (err) => {
      console.error('Ошибка обновления:', err);
      startApp();
    });
  }
});


function startApp() {
  loadingWindow.close();
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
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
