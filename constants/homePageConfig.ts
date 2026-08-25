import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';

/**
 * Bundled home-screen layout.
 *
 * The live layout comes from the HOME_PAGE_CONFIG document fetched from backend.
 * These defaults act as a resilient floor before the document lands.
 */

export type {
    HomeConfigItem,
    HomePageConfig,
    HomeUtilityGroup,
} from '@/utils/homePageLayout';

import type { HomePageConfig } from '@/utils/homePageLayout';

/** Anything the card can draw: a remote URL, a bundled asset number, or an icon name. */
export type ResolvedIcon = number | { uri: string } | ComponentProps<typeof Ionicons>['name'];

/**
 * Fallback vector icon per id when backend does not provide a custom remote icon URL.
 */
export const LOCAL_ICONS: Record<string, ComponentProps<typeof Ionicons>['name']> = {
    emergency: 'warning-outline',
    education: 'school-outline',
    religious: 'moon-outline',
    health: 'medkit-outline',
    govt: 'business-outline',
    banks: 'card-outline',
    travel: 'airplane-outline',
    quran: 'book-outline',
    prayers: 'time-outline',
    qibla: 'compass-outline',
    currency: 'cash-outline',
    metals: 'diamond-outline',
    fuel: 'flame-outline',
    cricket: 'trophy-outline',
};

/** Used when an id has neither a remote icon nor a predefined vector icon. */
export const FALLBACK_ICON: ComponentProps<typeof Ionicons>['name'] = 'apps-outline';

export const DEFAULT_HOME_PAGE_CONFIG: HomePageConfig = {
    categories: [
        { id: 'emergency', label: 'Emergency', route: '/listing/emergency', isActive: true, order: 1, appVersions: [] },
        { id: 'education', label: 'Education', route: '/listing/education', isActive: true, order: 2, appVersions: [] },
        { id: 'religious', label: 'Religious', route: '/listing/religious', isActive: true, order: 3, appVersions: [] },
        { id: 'health', label: 'Health', route: '/listing/health', isActive: true, order: 4, appVersions: [] },
        { id: 'govt', label: 'Govt Offices', route: '/listing/govt', isActive: true, order: 5, appVersions: [] },
        { id: 'banks', label: 'Banks', route: '/listing/banks', isActive: true, order: 6, appVersions: [] },
        { id: 'travel', label: 'Travel', route: '/listing/travel', isActive: true, order: 7, appVersions: [] },
    ],
    moreCategories: [],
    utilities: [
        {
            id: 'islamic',
            title: 'Islamic Utilities',
            isActive: true,
            order: 1,
            appVersions: [],
            items: [
                { id: 'quran', label: 'Quran', route: '/quran', isActive: true, order: 1, appVersions: [] },
                { id: 'prayers', label: 'Prayers', route: '/prayerTimes', isActive: true, order: 2, appVersions: [] },
                { id: 'qibla', label: 'Qibla', route: '/qibla', isActive: true, order: 3, appVersions: [] },
            ],
        },
        {
            id: 'finance',
            title: 'Finance & Rates',
            isActive: true,
            order: 2,
            appVersions: [],
            items: [
                { id: 'currency', label: 'Currency', route: '/currency', isActive: true, order: 1, appVersions: [] },
                { id: 'metals', label: 'Metals & Gold', route: '/metals', isActive: true, order: 2, appVersions: [] },
                { id: 'fuel', label: 'Fuel Prices', route: '/fuel', isActive: true, order: 3, appVersions: [] },
            ],
        },
    ],
};
