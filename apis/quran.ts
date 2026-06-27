import apiClient from './client';

export interface QuranResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

export interface SurahListItem {
    number: number;
    name: string;
    englishName: string;
    englishNameTranslation: string;
    numberOfAyahs: number;
    revelationType: 'Meccan' | 'Medinan';
}

export interface Ayah {
    number: number;
    text: string;
    numberInSurah: number;
    juz: number;
    manzil: number;
    ruku: number;
    hizbQuarter: number;
    sajda: boolean;
}

export interface SurahDetail {
    number: number;
    name: string;
    englishName: string;
    englishNameTranslation: string;
    revelationType: string;
    numberOfAyahs: number;
    ayahs: Ayah[];
    edition?: {
        identifier: string;
        language: string;
        name: string;
        englishName: string;
        format: string;
        type: string;
        direction: string;
    };
}

export interface Edition {
    identifier: string;
    language: string;
    name: string;
    englishName: string;
    format: 'text' | 'audio';
    type: string;
    direction: 'ltr' | 'rtl' | null;
}

export const listSurahs = async (): Promise<QuranResponse<SurahListItem[]>> => {
    return apiClient.get('/api/user/v1/quran/surahs');
};

export const getSurah = async (
    surahNumber: number | string,
    options?: { edition?: string; offset?: number; limit?: number }
): Promise<QuranResponse<SurahDetail>> => {
    return apiClient.get(`/api/user/v1/quran/surah/${surahNumber}`, {
        params: options
    });
};

export const getEditions = async (): Promise<QuranResponse<Edition[]>> => {
    return apiClient.get('/api/user/v1/quran/editions');
};

export const getFullEdition = async (editionIdentifier: string): Promise<QuranResponse<any>> => {
    return apiClient.get(`/api/user/v1/quran/edition/${editionIdentifier}`);
};

export const getAyah = async (
    reference: string | number,
    edition?: string
): Promise<QuranResponse<any>> => {
    return apiClient.get(`/api/user/v1/quran/ayah/${reference}`, {
        params: { edition }
    });
};

export interface AsmaAlHusnaItem {
    name: string;
    transliteration: string;
    number: number;
    en: {
        meaning: string;
    };
}

export const getAsmaAlHusna = async (): Promise<QuranResponse<AsmaAlHusnaItem[]>> => {
    return apiClient.get('/api/user/v1/quran/asma-al-husna');
};

export interface HijriDate {
    date: string;
    format: string;
    day: string;
    weekday: {
        en: string;
        ar?: string;
    };
    month: {
        number: number;
        en: string;
        ar?: string;
    };
    year: string;
    designation: {
        abbreviated: string;
        expanded: string;
    };
}

export interface CalendarDay {
    gregorian: {
        date: string;
        day: string;
        weekday: {
            en: string;
        };
        month: {
            number: number;
            en: string;
        };
        year: string;
    };
    hijri: HijriDate;
}

export interface IslamicHoliday {
    date: string;
    event: string;
    hijriDate: {
        day: string;
        month: string;
        year: string;
    };
}

export const getHijriCalendar = async (month: number, year: number): Promise<QuranResponse<CalendarDay[]>> => {
    // Adding adjustment=-1 to align with Pakistan's moon sighting (typically 1 day behind Saudi Arabia)
    return apiClient.get(`/api/user/v1/quran/calendar/month/${month}/${year}`, {
        params: { adjustment: -1 }
    });
};
