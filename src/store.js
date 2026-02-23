import Store from 'electron-store';

let store;

export function getStore() {
  if (!store) {
    store = new Store({
      schema: {
        refreshInterval: {
          type: 'number',
          enum: [5, 10, 30],
          default: 10,
        },
        tempOrder: {
          type: 'string',
          enum: ['CF', 'FC'],
          default: 'CF',
        },
        manualCity: {
          type: 'string',
          default: '',
        },
        iconStyle: {
          type: 'string',
          enum: ['thermometer', 'sun-cloud', 'text-only', 'gauge'],
          default: 'thermometer',
        },
        showTomorrow: {
          type: 'boolean',
          default: false,
        },
        launchAtLogin: {
          type: 'boolean',
          default: false,
        },
        lastWeatherData: {
          type: 'object',
          default: {},
        },
      },
    });
  }
  return store;
}
