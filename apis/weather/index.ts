import axios from 'axios';
import apiClient from '../client';

const WEATHER_API_KEY = '5a7027b89c8e1abc39b876ee950ade1b';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// ── Saved cities (synced with the backend) ──────────────────────────────────

export interface SavedCity {
    name: string;
    latitude: number;
    longitude: number;
    isDefault?: boolean;
}

export const getSavedCities = async (): Promise<{ success: boolean; data: SavedCity[] }> => {
    const res: any = await apiClient.get('/api/user/v1/weather/saved-cities');
    return res;
};

export const saveSavedCities = async (cities: SavedCity[]): Promise<{ success: boolean; data: SavedCity[] }> => {
    const res: any = await apiClient.put('/api/user/v1/weather/saved-cities', { cities });
    return res;
};

// ── Air quality (free OpenWeather Air Pollution API) ────────────────────────

export const getAirQuality = async (lat: number, lon: number) => {
    try {
        const response = await axios.get(`${BASE_URL}/air_pollution`, {
            params: { lat, lon, appid: WEATHER_API_KEY },
        });
        return response.data?.list?.[0] ?? null; // { main: { aqi }, components: {...} }
    } catch {
        return null;
    }
};

// ── UV Index (free Open-Meteo — OpenWeather's free tier omits UV) ────────────

export const getUVIndex = async (lat: number, lon: number): Promise<number | null> => {
    try {
        const response = await axios.get('https://api.open-meteo.com/v1/forecast', {
            params: {
                latitude: lat,
                longitude: lon,
                current: 'uv_index',
                daily: 'uv_index_max',
                timezone: 'auto',
                forecast_days: 1,
            },
        });
        const uv = response.data?.current?.uv_index ?? response.data?.daily?.uv_index_max?.[0];
        return typeof uv === 'number' ? uv : null;
    } catch {
        return null;
    }
};

// ── Rain radar (free RainViewer public API — no key required) ───────────────
// https://www.rainviewer.com/api.html — a global list of available radar
// frame timestamps (recent past + short-term nowcast). Tile images for a
// given frame are fetched on-demand by the map itself via getRadarTileUrl.

export interface RadarFrame {
    time: number; // unix seconds
    path: string;
}

export interface RadarFramesResponse {
    host: string;
    past: RadarFrame[];
    nowcast: RadarFrame[];
}

export const getRadarFrames = async (): Promise<RadarFramesResponse | null> => {
    try {
        const response = await axios.get('https://api.rainviewer.com/public/weather-maps.json');
        const data = response.data;
        if (!data?.host || !data?.radar) return null;
        return {
            host: data.host,
            past: data.radar.past || [],
            nowcast: data.radar.nowcast || [],
        };
    } catch {
        return null;
    }
};

/**
 * Builds an XYZ tile URL template for a given radar frame.
 * size: 256 (matches the OSM base tiles); color: 4 = the classic
 * green→yellow→red "Original" RainViewer palette; "1_1" = smoothed +
 * snow-aware rendering.
 */
export const getRadarTileUrl = (host: string, path: string): string =>
    `${host}${path}/256/{z}/{x}/{y}/4/1_1.png`;

export interface WeatherResponse {
    coord: { lon: number; lat: number };
    weather: Array<{ id: number; main: string; description: string; icon: string }>;
    main: {
        temp: number;
        feels_like: number;
        temp_min: number;
        temp_max: number;
        pressure: number;
        humidity: number;
    };
    wind: { speed: number; deg: number };
    visibility?: number;
    name: string;
    dt: number;
    sys: { country: string; sunrise: number; sunset: number };
    rain?: { '1h'?: number; '3h'?: number };
    snow?: { '1h'?: number; '3h'?: number };
}

export interface ForecastResponse {
    list: Array<{
        dt: number;
        main?: {
            temp: number;
            temp_min: number;
            temp_max: number;
            humidity: number;
        };
        temp?: {
            day: number;
            min: number;
            max: number;
            night: number;
            eve: number;
            morn: number;
        };
        weather: Array<{ main: string; description: string; icon: string }>;
        pop: number;
        dt_txt?: string;
    }>;
    city: {
        name: string;
        sunrise: number;
        sunset: number;
    };
}

export interface WeatherCoords {
    lat: number;
    lon: number;
}

// Prefer precise coordinates (current location) when provided, else fall back
// to a city name query.
const buildLocationParams = (city: string, coords?: WeatherCoords | null) => {
    if (coords && Number.isFinite(coords.lat) && Number.isFinite(coords.lon)) {
        return { lat: coords.lat, lon: coords.lon };
    }
    return { q: city };
};

export const getWeather = async (city: string = 'talagang,pk', coords?: WeatherCoords | null) => {
    try {
        const response = await axios.get(`${BASE_URL}/weather`, {
            params: {
                ...buildLocationParams(city, coords),
                APPID: WEATHER_API_KEY,
                units: 'metric',
            },
        });

        const data = response.data as WeatherResponse;
        return data;
    } catch (error: any) {
        throw error.response?.data || error.message;
    }
};

export const getForecast = async (city: string = 'talagang,pk', coords?: WeatherCoords | null) => {
    try {
        const response = await axios.get(`${BASE_URL}/forecast`, {
            params: {
                ...buildLocationParams(city, coords),
                APPID: WEATHER_API_KEY,
                units: 'metric',
            },
        });

        const data = response.data as ForecastResponse;
        return data;
    } catch (error: any) {
        throw error.response?.data || error.message;
    }
};
