const FETCH_TIMEOUT = 10_000;

const WMO_CODES = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Foggy',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  56: 'Light freezing drizzle',
  57: 'Dense freezing drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  66: 'Light freezing rain',
  67: 'Heavy freezing rain',
  71: 'Slight snow',
  73: 'Moderate snow',
  75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  85: 'Slight snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with slight hail',
  99: 'Thunderstorm with heavy hail',
};

function fetchWithTimeout(url, timeout = FETCH_TIMEOUT) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  return fetch(url, { signal: controller.signal }).finally(() =>
    clearTimeout(timer),
  );
}

export async function detectLocation() {
  const res = await fetchWithTimeout('http://ip-api.com/json/?fields=city,lat,lon');
  if (!res.ok) throw new Error(`ip-api responded ${res.status}`);
  const data = await res.json();
  return { city: data.city, lat: data.lat, lon: data.lon };
}

export async function geocodeCity(name) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1`;
  const res = await fetchWithTimeout(url);
  if (!res.ok) throw new Error(`Geocoding API responded ${res.status}`);
  const data = await res.json();
  if (!data.results || data.results.length === 0) {
    throw new Error(`City not found: ${name}`);
  }
  const result = data.results[0];
  return { city: result.name, lat: result.latitude, lon: result.longitude };
}

export async function fetchWeather(lat, lon) {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,apparent_temperature,weather_code` +
    `&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=2`;
  const res = await fetchWithTimeout(url);
  if (!res.ok) throw new Error(`Open-Meteo responded ${res.status}`);
  const data = await res.json();

  const current = data.current;
  const daily = data.daily;

  return {
    tempC: current.temperature_2m,
    feelsLikeC: current.apparent_temperature,
    condition: WMO_CODES[current.weather_code] || 'Unknown',
    highC: daily.temperature_2m_max[0],
    lowC: daily.temperature_2m_min[0],
    tomorrowHighC: daily.temperature_2m_max[1],
    tomorrowLowC: daily.temperature_2m_min[1],
  };
}
