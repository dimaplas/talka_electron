const path = require('path');
const { readFileSync } = require('fs');

// Функция для чтения токена из файла
const getTextFromFile = (filePath) => {
  try {
    return readFileSync(filePath, 'utf-8').trim();
  } catch (error) {
    console.error('Ошибка чтения токена:', error);
    return null;
  }
};

module.exports = {
  // Основные настройки приложения
  appId: 'com.vizordino.talka_rf',
  productName: 'Talka_RF',

  // Публикация релиза в репозиторий
  publish: {
    provider: 'github',
    owner: 'dimaplas',
    repo: 'talka_electron',
    // Приоритет получения токена:
    // 1. Переменная окружения
    // 2. Файл с токеном
    token: 
      process.env.GH_TOKEN || 
      getTextFromFile(path.join(__dirname, 'cert', 'git.token')),
    releaseType: 'release'
  },

  // Файлы для включения в сборку
  files: [
    'src/**/*',
    'node_modules/**/*',
    '!**/__tests__/*',
    '!node_modules/**/*.map',
    '!node_modules/**/*.ts'
  ],

  // Директории
  directories: {
    output: path.join(__dirname, 'release_builds')
  },

  // Настройки для Windows
  win: {
    target: 'nsis',
    signAndEditExecutable: true,
    // cscLink: path.join(__dirname, 'cert', 'certificate.pfx'),
    // cscKeyPassword: getTextFromFile(path.join(__dirname, 'cert', 'password')),
    artifactName: 'Talka_RF-Setup-${version}.${ext}',
  },

  // Настройки для Linux
  linux: {
    category: 'Utility',
  },

  // Общие настройки сборки
  compression: 'maximum',
  asar: true,
};