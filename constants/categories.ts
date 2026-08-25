export const PLACE_CATEGORY_MAPPING: Record<string, string> = {
    education: 'Education',
    religious: 'Religious',
    health: 'Health',
    govt: 'Govt Offices',
    emergency: 'Emergency',
    banks: 'Banks',
    travel: 'Travel',
};

export const LOCAL_ICONS: Record<string, any> = {
    emergency: require('@/assets/icons/emergency.webp'),
    education: require('@/assets/icons/education_icon.webp'),
    education_icon: require('@/assets/icons/education_icon.webp'),
    religious: require('@/assets/icons/religious.webp'),
    health: require('@/assets/icons/health.webp'),
    govt: require('@/assets/icons/govt_office.webp'),
    govt_office: require('@/assets/icons/govt_office.webp'),
    banks: require('@/assets/icons/bank.webp'),
    bank: require('@/assets/icons/bank.webp'),
    travel: require('@/assets/icons/travel.webp'),
    quran: require('@/assets/icons/quran_icon.webp'),
    quran_icon: require('@/assets/icons/quran_icon.webp'),
    prayers: require('@/assets/icons/prayer_icon.webp'),
    prayer_icon: require('@/assets/icons/prayer_icon.webp'),
    qibla: require('@/assets/icons/qibla.webp'),
    currency: require('@/assets/icons/currency.webp'),
    metals: require('@/assets/icons/gold_rate.webp'),
    gold_rate: require('@/assets/icons/gold_rate.webp'),
    fuel: require('@/assets/icons/fuel.webp'),
    google: require('@/assets/icons/google.webp'),
};

/**
 * Resolves an icon identifier into either an image source (require/URI object) or an Ionicons name string.
 */
export function resolveIcon(icon: any, fallbackKey?: string): any {
    if (!icon && fallbackKey && LOCAL_ICONS[fallbackKey]) {
        return LOCAL_ICONS[fallbackKey];
    }
    if (typeof icon === 'number') {
        return icon;
    }
    if (icon && typeof icon === 'object' && typeof icon.uri === 'string') {
        return icon;
    }
    if (typeof icon === 'string') {
        const trimmed = icon.trim();
        if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
            return { uri: trimmed };
        }
        if (LOCAL_ICONS[trimmed]) {
            return LOCAL_ICONS[trimmed];
        }
        if (fallbackKey && LOCAL_ICONS[fallbackKey]) {
            return LOCAL_ICONS[fallbackKey];
        }
        return trimmed; // Treated as Ionicons name
    }
    if (fallbackKey && LOCAL_ICONS[fallbackKey]) {
        return LOCAL_ICONS[fallbackKey];
    }
    return icon;
}

export interface CategoryInfo {
    id: string;
    label: string;
    icon: any;
    route?: string;
    isActive?: boolean;
    order?: number;
    appVersions?: string[];
}

export const CATEGORIES_CONFIG: CategoryInfo[] = [
    { id: 'emergency', label: 'Emergency', icon: require('@/assets/icons/emergency.webp'), route: '/listing/emergency', isActive: true, order: 1, appVersions: [] },
    { id: 'education', label: 'Education', icon: require('@/assets/icons/education_icon.webp'), route: '/listing/education', isActive: true, order: 2, appVersions: [] },
    { id: 'religious', label: 'Religious', icon: require('@/assets/icons/religious.webp'), route: '/listing/religious', isActive: true, order: 3, appVersions: [] },
    { id: 'health', label: 'Health', icon: require('@/assets/icons/health.webp'), route: '/listing/health', isActive: true, order: 4, appVersions: [] },
    { id: 'govt', label: 'Govt Offices', icon: require('@/assets/icons/govt_office.webp'), route: '/listing/govt', isActive: true, order: 5, appVersions: [] },
    { id: 'banks', label: 'Banks', icon: require('@/assets/icons/bank.webp'), route: '/listing/banks', isActive: true, order: 6, appVersions: [] },
    { id: 'travel', label: 'Travel', icon: require('@/assets/icons/travel.webp'), route: '/listing/travel', isActive: true, order: 7, appVersions: [] },
];

export const MORE_CATEGORIES_CONFIG: CategoryInfo[] = [];

export interface UtilItemConfig {
    id: string;
    label: string;
    icon?: any;
    image?: any;
    route: string;
    isActive?: boolean;
    order?: number;
    appVersions?: string[];
}

export interface UtilCategoryConfig {
    id: string;
    title: string;
    isActive?: boolean;
    order?: number;
    appVersions?: string[];
    items: UtilItemConfig[];
}

export const DEFAULT_UTILITIES_CONFIG: UtilCategoryConfig[] = [
    {
        id: 'islamic',
        title: 'Islamic Utilities',
        isActive: true,
        order: 1,
        appVersions: [],
        items: [
            {
                id: 'quran',
                label: 'Quran',
                image: require('@/assets/icons/quran_icon.webp'),
                route: '/quran',
                isActive: true,
                order: 1,
                appVersions: [],
            },
            {
                id: 'prayers',
                label: 'Prayers',
                image: require('@/assets/icons/prayer_icon.webp'),
                route: '/prayerTimes',
                isActive: true,
                order: 2,
                appVersions: [],
            },
            {
                id: 'qibla',
                label: 'Qibla',
                image: require('@/assets/icons/qibla.webp'),
                route: '/qibla',
                isActive: true,
                order: 3,
                appVersions: [],
            },
        ],
    },
    {
        id: 'finance',
        title: 'Finance & Rates',
        isActive: true,
        order: 2,
        appVersions: [],
        items: [
            {
                id: 'currency',
                label: 'Currency',
                image: require('@/assets/icons/currency.webp'),
                route: '/currency',
                isActive: true,
                order: 1,
                appVersions: [],
            },
            {
                id: 'metals',
                label: 'Metals & Gold',
                image: require('@/assets/icons/gold_rate.webp'),
                route: '/metals',
                isActive: true,
                order: 2,
                appVersions: [],
            },
            {
                id: 'fuel',
                label: 'Fuel Prices',
                image: require('@/assets/icons/fuel.webp'),
                route: '/fuel',
                isActive: true,
                order: 3,
                appVersions: [],
            },
        ],
    },
    {
        id: 'sports',
        title: 'Local Sports & Community',
        isActive: true,
        order: 3,
        appVersions: ['2.0.8', '2.0.9'],
        items: [
            {
                id: 'cricket',
                label: 'Cricket Hub',
                icon: 'trophy-outline',
                route: '/cricket',
                isActive: true,
                order: 1,
                appVersions: ['2.0.8', '2.0.9'],
            },
        ],
    },
];

export const PLACE_CATEGORIES = CATEGORIES_CONFIG.map((cat) => ({
    key: cat.label,
    value: cat.id.toUpperCase(),
}));
