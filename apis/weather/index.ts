import axios from 'axios';

const WEATHER_API_KEY = '5a7027b89c8e1abc39b876ee950ade1b';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

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

export const getWeather = async (city: string = 'talagang,pk') => {
    try {
        const response = await axios.get(`${BASE_URL}/weather`, {
            params: {
                q: city,
                APPID: WEATHER_API_KEY,
                units: 'metric',
            },
        });

        const data = response.data as WeatherResponse;
        console.log("API RESPONSE LOGS", data);
        return data;
    } catch (error: any) {
        throw error.response?.data || error.message;
    }
};

export const getForecast = async (city: string = 'talagang,pk') => {
    try {
        const response = await axios.get(`${BASE_URL}/forecast`, {
            params: {
                q: city,
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
