import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';

/**
 * Bundled home-screen layout.
 *
 * The live layout comes from the HOME_PAGE_CONFIG document, but the app must
 * render a correct home screen before that request lands — on first launch, on
 * a cold start offline, and if the request fails outright. These defaults are
 * that floor, and they mirror the seeded document.
 *
 * They also supply the icons. Every id here owns a bundled asset, so the remote
 * document can leave `icon` empty and still render; a remote URL or an Ionicons
 * name simply takes precedence when one is set.
 */

export type {
    HomeConfigItem,
    HomePageConfig,
    HomeUtilityGroup,
} from '@/utils/homePageLayout';

import type { HomePageConfig } from '@/utils/homePageLayout';

/** Anything the card can draw: a bundled asset, a remote URL, or an icon name. */
export type ResolvedIcon = number | { uri: string } | ComponentProps<typeof Ionicons>['name'];

/**
 * Bundled asset per id. `require` has to be a literal, so this map is the only
 * place local icons can be looked up by a string coming from the API.
 */
export const LOCAL_ICONS: Record<string, number> = {
    emergency: require('@/assets/icons/emergency.webp'),
    education: require('@/assets/icons/education_icon.webp'),
    religious: require('@/assets/icons/religious.webp'),
    health: require('@/assets/icons/health.webp'),
    govt: require('@/assets/icons/govt_office.webp'),
    banks: require('@/assets/icons/bank.webp'),
    travel: require('@/assets/icons/travel.webp'),
    quran: require('@/assets/icons/quran_icon.webp'),
    prayers: require('@/assets/icons/prayer_icon.webp'),
    qibla: require('@/assets/icons/qibla.webp'),
    currency: require('@/assets/icons/currency.webp'),
    metals: require('@/assets/icons/gold_rate.webp'),
    fuel: require('@/assets/icons/fuel.webp'),
};

/** Used when an id has neither a remote icon nor a bundled asset. */
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
