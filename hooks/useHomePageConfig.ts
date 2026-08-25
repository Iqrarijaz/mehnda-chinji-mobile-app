import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getConfiguration } from '@/apis/public';
import {
    CATEGORIES_CONFIG,
    CategoryInfo,
    DEFAULT_UTILITIES_CONFIG,
    MORE_CATEGORIES_CONFIG,
    UtilCategoryConfig,
    resolveIcon,
} from '@/constants/categories';
import { getCurrentAppVersion, isItemActiveAndSupported } from '@/utils/configVersionFilter';

const CONFIG_TYPE = 'HOME_PAGE_CONFIG';

export const HOME_PAGE_CONFIG_QUERY_KEY = ['configuration', CONFIG_TYPE] as const;

/**
 * The layout changes when an admin publishes, not on a clock, so it is cached
 * hard: six hours before a mount will refetch, and kept for a day so a cold
 * start paints from disk instead of waiting on the network. Pull-to-refresh
 * still forces a fetch, and the app-open prefetch keeps it warm.
 */
/** Sort key for an entry with no `order` — zero would put it ahead of 1. */
const UNORDERED = Number.MAX_SAFE_INTEGER;

const SIX_HOURS = 1000 * 60 * 60 * 6;
const ONE_DAY = 1000 * 60 * 60 * 24;

async function fetchHomePageConfig() {
    const res: any = await getConfiguration(CONFIG_TYPE);
    // Tolerate the standard envelope, a bare Mongo document, and a bare payload.
    const doc = res?.data !== undefined ? res.data : res;
    const payload = doc?.data !== undefined ? doc.data : doc;

    // A missing document answers 200 with a null body. Returning that would
    // cache "no layout" for the whole staleTime and persist it to disk, so the
    // blank screen would survive restarts. Failing instead keeps the bundled
    // defaults on screen and lets retry and pull-to-refresh do their job.
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        throw new Error(`${CONFIG_TYPE} is missing or malformed`);
    }
    return payload;
}

/**
 * Shared by the hook and the app-open prefetch, so the two cannot drift onto
 * different keys and fetch the same document twice.
 */
export function homePageConfigQueryOptions() {
    return {
        queryKey: HOME_PAGE_CONFIG_QUERY_KEY,
        queryFn: fetchHomePageConfig,
        staleTime: SIX_HOURS,
        gcTime: ONE_DAY,
    };
}

export interface HomePageConfigData {
    categories: CategoryInfo[];
    moreCategories: CategoryInfo[];
    utilities: UtilCategoryConfig[];
    isLoading: boolean;
    isFetching: boolean;
    isError: boolean;
    error: any;
    isRefetching: boolean;
    refetch: () => void;
}

export function useHomePageConfig(): HomePageConfigData {
    const currentVersion = useMemo(() => getCurrentAppVersion(), []);

    const {
        data,
        isLoading,
        isFetching,
        isError,
        error,
        isRefetching,
        refetch,
    } = useQuery(homePageConfigQueryOptions());

    const parsedConfig = useMemo(() => {
        const remoteData = (data?.data !== undefined ? data.data : data) || {};

        // A published section wins, empty included — clearing a section in the
        // portal has to survive the trip here. Only a section the document does
        // not carry falls back to what the app ships, which is what keeps the
        // screen populated before the first response and during an outage.
        // --- 1. Explore Categories ---
        let rawCategories: CategoryInfo[] = CATEGORIES_CONFIG;
        if (Array.isArray(remoteData?.categories)) {
            rawCategories = remoteData.categories.map((cat: any) => ({
                id: cat.id,
                label: cat.label || cat.name || '',
                icon: resolveIcon(cat.icon, cat.id),
                route: cat.route || `/listing/${cat.id}`,
                isActive: cat.isActive !== false,
                order: typeof cat.order === 'number' ? cat.order : UNORDERED,
                appVersions: cat.appVersions || [],
            }));
        }

        const filteredCategories = rawCategories
            .filter((cat) => isItemActiveAndSupported(cat, currentVersion))
            .sort((a, b) => (a.order ?? UNORDERED) - (b.order ?? UNORDERED));

        // --- 2. More Categories ---
        let rawMoreCategories: CategoryInfo[] = MORE_CATEGORIES_CONFIG;
        if (Array.isArray(remoteData?.moreCategories)) {
            rawMoreCategories = remoteData.moreCategories.map((cat: any) => ({
                id: cat.id,
                label: cat.label || cat.name || '',
                icon: resolveIcon(cat.icon, cat.id),
                route: cat.route || `/listing/${cat.id}`,
                isActive: cat.isActive !== false,
                order: typeof cat.order === 'number' ? cat.order : UNORDERED,
                appVersions: cat.appVersions || [],
            }));
        }

        const filteredMoreCategories = rawMoreCategories
            .filter((cat) => isItemActiveAndSupported(cat, currentVersion))
            .sort((a, b) => (a.order ?? UNORDERED) - (b.order ?? UNORDERED));

        // --- 3. Utilities Sections ---
        let rawUtilities: UtilCategoryConfig[] = DEFAULT_UTILITIES_CONFIG;
        if (Array.isArray(remoteData?.utilities)) {
            rawUtilities = remoteData.utilities.map((group: any) => ({
                id: group.id,
                title: group.title || group.name || '',
                isActive: group.isActive !== false,
                order: typeof group.order === 'number' ? group.order : UNORDERED,
                appVersions: group.appVersions || [],
                items: (group.items || []).map((item: any) => ({
                    id: item.id,
                    label: item.label || item.name || '',
                    icon: resolveIcon(item.icon || item.image, item.id),
                    image: resolveIcon(item.image || item.icon, item.id),
                    route: item.route || '',
                    isActive: item.isActive !== false,
                    order: typeof item.order === 'number' ? item.order : UNORDERED,
                    appVersions: item.appVersions || [],
                })),
            }));
        }

        const filteredUtilities = rawUtilities
            .filter((group) => isItemActiveAndSupported(group, currentVersion))
            .sort((a, b) => (a.order ?? UNORDERED) - (b.order ?? UNORDERED))
            .map((group) => ({
                ...group,
                items: (group.items || [])
                    .filter((item) => isItemActiveAndSupported(item, currentVersion))
                    .sort((a, b) => (a.order ?? UNORDERED) - (b.order ?? UNORDERED)),
            }))
            .filter((group) => group.items.length > 0);

        return {
            categories: filteredCategories,
            moreCategories: filteredMoreCategories,
            utilities: filteredUtilities,
        };
    }, [data, currentVersion]);

    return {
        ...parsedConfig,
        isLoading,
        isFetching,
        isError,
        error,
        isRefetching,
        refetch,
    };
}
