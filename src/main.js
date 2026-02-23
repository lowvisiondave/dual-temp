import { join } from 'node:path';
import { app, BrowserWindow, ipcMain } from 'electron';
import { getStore } from './store.js';
import { createTray, updateTrayMenu, updateTrayIcon } from './tray.js';
import { detectLocation, geocodeCity, fetchWeather } from './weather.js';

let tray;
let prefsWindow = null;
let pollTimer = null;
let isOnline = false;
let weatherData = null;

async function refreshWeather() {
  const store = getStore();
  try {
    let location;
    const manualCity = store.get('manualCity');
    if (manualCity) {
      location = await geocodeCity(manualCity);
    } else {
      location = await detectLocation();
    }

    const weather = await fetchWeather(location.lat, location.lon);
    weatherData = {
      ...weather,
      city: location.city,
      updatedAt: Date.now(),
    };
    isOnline = true;
    store.set('lastWeatherData', weatherData);
  } catch (err) {
    console.error('Weather fetch failed:', err.message);
    const cached = store.get('lastWeatherData');
    if (cached && cached.tempC != null) {
      weatherData = cached;
    }
    isOnline = false;
  }

  updateTrayMenu(tray, weatherData, isOnline);
}

function startPolling() {
  if (pollTimer) clearInterval(pollTimer);
  const minutes = getStore().get('refreshInterval');
  pollTimer = setInterval(refreshWeather, minutes * 60 * 1000);
}

function openPreferences() {
  if (prefsWindow) {
    prefsWindow.focus();
    return;
  }

  prefsWindow = new BrowserWindow({
    width: 380,
    height: 560,
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    title: 'DualTemp Preferences',
    webPreferences: {
      preload: join(import.meta.dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  prefsWindow.loadFile(join(import.meta.dirname, 'preferences.html'));

  prefsWindow.on('closed', () => {
    prefsWindow = null;
  });
}

// IPC handlers
ipcMain.handle('get-settings', () => {
  const store = getStore();
  return {
    refreshInterval: store.get('refreshInterval'),
    tempOrder: store.get('tempOrder'),
    manualCity: store.get('manualCity'),
    launchAtLogin: store.get('launchAtLogin'),
    iconStyle: store.get('iconStyle'),
    showTomorrow: store.get('showTomorrow'),
  };
});

ipcMain.handle('save-settings', (_event, settings) => {
  const store = getStore();
  store.set('refreshInterval', settings.refreshInterval);
  store.set('tempOrder', settings.tempOrder);
  store.set('manualCity', settings.manualCity);
  store.set('launchAtLogin', settings.launchAtLogin);
  store.set('iconStyle', settings.iconStyle);
  store.set('showTomorrow', settings.showTomorrow);

  app.setLoginItemSettings({ openAtLogin: settings.launchAtLogin });
  updateTrayIcon();

  // Restart polling with new interval and refresh immediately
  startPolling();
  refreshWeather();
});

app.on('ready', () => {
  // Hide dock icon — menu bar app only
  if (app.dock) app.dock.hide();

  tray = createTray({
    refresh: refreshWeather,
    openPreferences,
    quit: () => app.quit(),
  });

  // Show placeholder immediately, then fetch async
  updateTrayMenu(tray, null, false);
  refreshWeather();
  startPolling();
});

// Prevent app from quitting when all windows are closed
app.on('window-all-closed', (e) => {
  e.preventDefault();
});
