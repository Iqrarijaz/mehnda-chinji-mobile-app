import axios from 'axios';
import moment from 'moment';

const BASE_URL = 'https://api.aladhan.com/v1';

export const getPrayerTimes = async (city: string, country: string = 'Pakistan') => {
    try {
        const cleanCity = city.split(',')[0].trim();
        const today = moment().format('DD-MM-YYYY');
        // method=1 is University of Islamic Sciences, Karachi
        const url = `${BASE_URL}/timingsByCity/${today}?city=${encodeURIComponent(cleanCity)}&country=${encodeURIComponent(country)}&method=1`;
        
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error('Error fetching prayer times:', error);
        throw error;
    }
};

export const getPrayerCalendar = async (city: string, country: string = 'Pakistan') => {
    try {
        const cleanCity = city.split(',')[0].trim();
        const month = moment().format('M');
        const year = moment().format('YYYY');
        const url = `${BASE_URL}/calendarByCity/${year}/${month}?city=${encodeURIComponent(cleanCity)}&country=${encodeURIComponent(country)}&method=1`;
        
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error('Error fetching prayer calendar:', error);
        throw error;
    }
};
