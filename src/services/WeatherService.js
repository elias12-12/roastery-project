import dotenv from 'dotenv';

dotenv.config();

const DEFAULT_CITY = 'Beirut, LB';
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

export class WeatherService {
  constructor() {
    this.apiKey = process.env.WEATHER_API_KEY;
  }

  async fetchCurrentWeather(city = DEFAULT_CITY) {
    if (!this.apiKey) {
      return { data: null, error: 'WEATHER_API_KEY is not configured. Add it to your .env file.' };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const query = encodeURIComponent(city.trim() || DEFAULT_CITY);
      const url = `${BASE_URL}?q=${query}&units=metric&appid=${this.apiKey}`;

      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        const message = body?.message || `Weather request failed with status ${response.status}`;
        return { data: null, error: message };
      }

      const payload = await response.json();
      const normalized = {
        city: payload.name,
        country: payload.sys?.country,
        description: payload.weather?.[0]?.description,
        icon: payload.weather?.[0]?.icon,
        temperature: Math.round(payload.main?.temp ?? 0),
        feelsLike: Math.round(payload.main?.feels_like ?? 0),
        humidity: payload.main?.humidity,
        tempMin: Math.round(payload.main?.temp_min ?? 0),
        tempMax: Math.round(payload.main?.temp_max ?? 0),
        windSpeed: payload.wind?.speed,
        updatedAt: payload.dt ? new Date(payload.dt * 1000) : new Date()
      };

      return { data: normalized, error: null };
    } catch (error) {
      const message = error.name === 'AbortError' ? 'Weather request timed out. Please try again.' : error.message;
      return { data: null, error: message };
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
