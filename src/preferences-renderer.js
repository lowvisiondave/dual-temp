const form = document.getElementById('prefs-form');
const cancelBtn = document.getElementById('cancel-btn');

async function loadSettings() {
  const settings = await window.dualtemp.getSettings();

  // Refresh interval
  const intervalRadio = form.querySelector(
    `input[name="refreshInterval"][value="${settings.refreshInterval}"]`,
  );
  if (intervalRadio) intervalRadio.checked = true;

  // Temp order
  const orderRadio = form.querySelector(
    `input[name="tempOrder"][value="${settings.tempOrder}"]`,
  );
  if (orderRadio) orderRadio.checked = true;

  // Icon style
  const iconRadio = form.querySelector(
    `input[name="iconStyle"][value="${settings.iconStyle}"]`,
  );
  if (iconRadio) iconRadio.checked = true;

  // Manual city
  document.getElementById('manualCity').value = settings.manualCity || '';

  // Launch at login
  document.getElementById('launchAtLogin').checked = settings.launchAtLogin;

  // Show tomorrow's forecast
  document.getElementById('showTomorrow').checked = settings.showTomorrow;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = new FormData(form);
  await window.dualtemp.saveSettings({
    refreshInterval: Number(data.get('refreshInterval')),
    tempOrder: data.get('tempOrder'),
    iconStyle: data.get('iconStyle'),
    manualCity: data.get('manualCity').trim(),
    launchAtLogin: document.getElementById('launchAtLogin').checked,
    showTomorrow: document.getElementById('showTomorrow').checked,
  });
  window.close();
});

cancelBtn.addEventListener('click', () => {
  window.close();
});

loadSettings();
