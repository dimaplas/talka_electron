const { app, BrowserWindow, desktopCapturer, ipcMain, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');

let mainWindow;

app.whenReady().then(() => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    }
  });

  mainWindow.loadFile('index.html');
});

// Обработчик запроса на открытие окна выбора источника
ipcMain.handle('open-screen-share', async () => {
  try {
    const sources = await desktopCapturer.getSources({
      types: ['window', 'screen'], // Исправляем синтаксис
      thumbnailSize: {
        width: 200,    // ширина миниатюры
        height: 100    // высота миниатюры
      }
    });

    const shareWindow = new BrowserWindow({
      width: 400,
      height: 300,
      title: 'Выберите источник экрана',
      parent: mainWindow,
      modal: true,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    });

    console.log(sources);

    shareWindow.loadFile('share.html');

    // Передаем список источников в окно
    shareWindow.webContents.on('dom-ready', () => {
      shareWindow.webContents.executeJavaScript(`load_source(${JSON.stringify(sources)})`);
    });
  } catch (error) {
    console.error('Ошибка получения источников:', error);
  }
});

// Обработка выбора источника
ipcMain.on('source-selected', (event, sourceId) => {
  console.log('Выбран источник:', sourceId);
});



// if (!isDev) {
//   autoUpdater.setFeedURL({
//     url: 'https://update.electronjs.org/ваш-аккаунт/ваш-репозиторий'
//   });

//   autoUpdater.on('update-available', () => {
//     dialog.showMessageBox({
//       type: 'info',
//       message: 'Доступно обновление',
//       detail: 'Хотите установить?'
//     }, (response) => {
//       if (response === 0) {
//         autoUpdater.downloadUpdate();
//       }
//     });
//   });

//   autoUpdater.on('update-downloaded', () => {
//     dialog.showMessageBox({
//       type: 'info',
//       message: 'Обновление готово',
//       detail: 'Перезапустить приложение?'
//     }, () => {
//       autoUpdater.quitAndInstall();
//     });
//   });

//   setInterval(() => {
//     autoUpdater.checkForUpdates();
//   }, 60000); // Проверка каждые 60 секунд
// }


// Автообновление
autoUpdater.on('update-available', () => {
  dialog.showMessageBox({
    type: 'info',
    message: 'Доступно обновление',
    detail: 'Хотите установить?'
  }, (response) => {
    if (response === 0) {
      autoUpdater.downloadUpdate();
    }
  });
});

autoUpdater.on('update-downloaded', () => {
  dialog.showMessageBox({
    type: 'info',
    message: 'Обновление готово',
    detail: 'Перезапустить приложение?'
  }, () => {
    autoUpdater.quitAndInstall();
  });
});
autoUpdater.on('update-not-available', () => {
  console.log('Обновлений нет');
});

autoUpdater.setFeedURL({
  provider: 'github',
  owner: 'dimaplas',
  repo: 'talka_electron',
  private: false
});


// autoUpdater.on('update-downloaded', () => {
//   dialog.showMessageBox({
//     type: 'info',
//     message: 'Обновление готово',
//     detail: 'Перезапустить приложение?'
//   }, () => {
//     autoUpdater.quitAndInstall();
//   });
// });

autoUpdater.checkForUpdates();