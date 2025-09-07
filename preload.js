const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Отправка данных в main.js
  send: (channel, data) => {
    ipcRenderer.send(channel, data);
  },
  // Получение данных из main.js
  receive: (channel, listener) => {
    ipcRenderer.on(channel, (...args) => listener(...args));
  }
});

window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  for (const type of ['chrome', 'node', 'electron']) {
    replaceText(`${type}-version`, process.versions[type])
  }
});
