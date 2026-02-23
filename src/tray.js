import { join } from 'node:path';
import { Tray, Menu, nativeImage } from 'electron';
import { getStore } from './store.js';

let tray;
let callbacks;

function cToF(c) {
  return c * 9 / 5 + 32;
}

function formatTemp(c) {
  const f = cToF(c);
  const cStr = `${Math.round(c)}°C`;
  const fStr = `${Math.round(f)}°F`;
  const order = getStore().get('tempOrder');
  return order === 'FC' ? `${fStr} / ${cStr}` : `${cStr} / ${fStr}`;
}

export function formatTrayTitle(data, isOnline) {
  if (!data || data.tempC == null) {
    return '--°C / --°F';
  }
  return formatTemp(data.tempC);
}

function getIconPath() {
  const style = getStore().get('iconStyle') || 'thermometer';
  return join(import.meta.dirname, '..', 'assets', 'icons', style, 'iconTemplate.png');
}

export function createTray(cbs) {
  callbacks = cbs;
  const icon = nativeImage.createFromPath(getIconPath());
  icon.setTemplateImage(true);
  tray = new Tray(icon);
  tray.setTitle(formatTrayTitle(null, false));
  return tray;
}

export function updateTrayIcon() {
  if (!tray) return;
  const icon = nativeImage.createFromPath(getIconPath());
  icon.setTemplateImage(true);
  tray.setImage(icon);
}

export function updateTrayMenu(trayRef, data, isOnline) {
  const t = trayRef || tray;
  t.setTitle(formatTrayTitle(data, isOnline));

  const items = [];

  if (data && data.city) {
    items.push({ label: data.city, enabled: false });
  }

  if (data && data.condition) {
    items.push({ label: data.condition, enabled: false });
  }

  if (items.length > 0) {
    items.push({ type: 'separator' });
  }

  if (data && data.feelsLikeC != null) {
    items.push({ label: `Feels like ${formatTemp(data.feelsLikeC)}`, enabled: false });
  }

  if (data && data.highC != null && data.lowC != null) {
    items.push({
      label: `↑ High   ${formatTemp(data.highC)}`,
      enabled: false,
    });
    items.push({
      label: `↓ Low    ${formatTemp(data.lowC)}`,
      enabled: false,
    });
  }

  const showTomorrow = getStore().get('showTomorrow');
  if (showTomorrow && data && data.tomorrowHighC != null && data.tomorrowLowC != null) {
    items.push({ type: 'separator' });
    items.push({ label: 'Tomorrow', enabled: false });
    items.push({
      label: `↑ High   ${formatTemp(data.tomorrowHighC)}`,
      enabled: false,
    });
    items.push({
      label: `↓ Low    ${formatTemp(data.tomorrowLowC)}`,
      enabled: false,
    });
  }

  if (data && (data.feelsLikeC != null || data.highC != null)) {
    items.push({ type: 'separator' });
  }

  if (data && data.updatedAt) {
    const time = new Date(data.updatedAt).toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    });
    const suffix = isOnline ? '' : ' (Offline)';
    items.push({ label: `Updated: ${time}${suffix}`, enabled: false });
  } else if (!data || data.tempC == null) {
    items.push({ label: 'No weather data available', enabled: false });
  }

  items.push({ type: 'separator' });
  items.push({ label: 'Refresh Now', click: () => callbacks?.refresh() });
  items.push({ label: 'Preferences...', click: () => callbacks?.openPreferences() });
  items.push({ type: 'separator' });
  items.push({ label: 'Quit', click: () => callbacks?.quit() });

  t.setContextMenu(Menu.buildFromTemplate(items));
}
