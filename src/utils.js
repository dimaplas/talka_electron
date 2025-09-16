import { fileURLToPath } from 'url';
import { dirname } from 'path';
import persist from 'node-persist';

// Получаем корректный путь к директории
const __dirname = dirname(fileURLToPath(import.meta.url));

// Инициализируем хранилище асинхронно
async function initStorage() {
    console.log('initStorage');
    try {
        await persist.init({
            cwd: __dirname,
            async: false
        });
    } catch (error) {
        console.error('Ошибка при инициализации хранилища:', error);
    }
}

// Вызываем инициализацию при загрузке модуля
initStorage();

// Добавляем async/await в функции работы с хранилищем
export async function gVal(key, defaultValue) {
    const value = await persist.get(key);
    console.log('Получено значение:', key, ' >> ', value);
    try {
        return value !== undefined ? value : defaultValue;
    } catch (error) {
        console.error('Ошибка при получении значения:', error);
        return defaultValue;
    }
}

export async function sVal(key, value) {
    try {
        await persist.set(key, value);
        console.log('Значение сохраненно:', key, ' >> ', value);
    } catch (error) {
        console.error('Ошибка при сохранении значения:', error);
    }
}
