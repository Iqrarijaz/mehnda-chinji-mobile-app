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
    google: require('@/assets/icons/google.webp'),
};

export const FALLBACK_VECTOR_ICONS: Record<string, string> = {
    emergency: 'warning-outline',
    education: 'school-outline',
    education_icon: 'school-outline',
    religious: 'moon-outline',
    health: 'medkit-outline',
    govt: 'business-outline',
    govt_office: 'business-outline',
    banks: 'card-outline',
    bank: 'card-outline',
    travel: 'airplane-outline',
    quran: 'book-outline',
    quran_icon: 'book-outline',
    prayers: 'time-outline',
    prayer_icon: 'time-outline',
    qibla: 'compass-outline',
    currency: 'cash-outline',
    metals: 'diamond-outline',
    gold_rate: 'diamond-outline',
    fuel: 'flame-outline',
    cricket: 'trophy-outline',
};

/**
 * Resolves an icon identifier into either an image source (require/URI object) or an Ionicons name string.
 */
export function resolveIcon(icon: any, fallbackKey?: string): any {
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
        if (FALLBACK_VECTOR_ICONS[trimmed]) {
            return FALLBACK_VECTOR_ICONS[trimmed];
        }
        return trimmed; // Treated as Ionicons name
    }
    if (fallbackKey && LOCAL_ICONS[fallbackKey]) {
        return LOCAL_ICONS[fallbackKey];
    }
    if (fallbackKey && FALLBACK_VECTOR_ICONS[fallbackKey]) {
        return FALLBACK_VECTOR_ICONS[fallbackKey];
    }
    return icon || 'apps-outline';
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

/**
 * Bundled home layout — the floor the screen renders before, or instead of,
 * the published HOME_PAGE_CONFIG document.
 */
export const CATEGORIES_CONFIG: CategoryInfo[] = [
    { id: 'emergency', label: 'Emergency', icon: 'warning-outline', route: '/listing/emergency', isActive: true, order: 1, appVersions: [] },
    { id: 'education', label: 'Education', icon: 'school-outline', route: '/listing/education', isActive: true, order: 2, appVersions: [] },
    { id: 'religious', label: 'Religious', icon: 'moon-outline', route: '/listing/religious', isActive: true, order: 3, appVersions: [] },
    { id: 'health', label: 'Health', icon: 'medkit-outline', route: '/listing/health', isActive: true, order: 4, appVersions: [] },
    { id: 'govt', label: 'Govt Offices', icon: 'business-outline', route: '/listing/govt', isActive: true, order: 5, appVersions: [] },
    { id: 'banks', label: 'Banks', icon: 'card-outline', route: '/listing/banks', isActive: true, order: 6, appVersions: [] },
    { id: 'travel', label: 'Travel', icon: 'airplane-outline', route: '/listing/travel', isActive: true, order: 7, appVersions: [] },
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
                icon: 'book-outline',
                route: '/quran',
                isActive: true,
                order: 1,
                appVersions: [],
            },
            {
                id: 'prayers',
                label: 'Prayers',
                icon: 'time-outline',
                route: '/prayerTimes',
                isActive: true,
                order: 2,
                appVersions: [],
            },
            {
                id: 'qibla',
                label: 'Qibla',
                icon: 'compass-outline',
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
                icon: 'cash-outline',
                route: '/currency',
                isActive: true,
                order: 1,
                appVersions: [],
            },
            {
                id: 'metals',
                label: 'Metals & Gold',
                icon: 'diamond-outline',
                route: '/metals',
                isActive: true,
                order: 2,
                appVersions: [],
            },
            {
                id: 'fuel',
                label: 'Fuel Prices',
                icon: 'flame-outline',
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
