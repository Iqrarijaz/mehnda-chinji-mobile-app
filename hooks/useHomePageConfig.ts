import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getConfiguration } from '@/apis/public';
import {
    CATEGORIES_CONFIG,
    MORE_CATEGORIES_CONFIG,
    DEFAULT_UTILITIES_CONFIG,
    CategoryInfo,
    UtilCategoryConfig,
    resolveIcon,
} from '@/constants/categories';
import { getCurrentAppVersion, isItemActiveAndSupported } from '@/utils/configVersionFilter';

/**
 * Sort key for an entry that carries no `order`.
 *
 * Zero would put it ahead of everything the admin numbered from 1, so a newly
 * added entry would jump to the front of the grid. Sorting it last is the
 * predictable half of the surprise.
 */
const UNORDERED = Number.MAX_SAFE_INTEGER;

export interface HomePageConfigData {
    categories: CategoryInfo[];
    moreCategories: CategoryInfo[];
    utilities: UtilCategoryConfig[];
    isLoading: boolean;
    isRefetching: boolean;
    refetch: () => void;
}

export function useHomePageConfig(): HomePageConfigData {
    const currentVersion = useMemo(() => getCurrentAppVersion(), []);

    const { data, isLoading, isRefetching, refetch } = useQuery({
        queryKey: ['configuration', 'HOME_PAGE_CONFIG'],
        queryFn: async () => {
            const res: any = await getConfiguration('HOME_PAGE_CONFIG');
            // Support both standard envelope and nested data structures
            return res?.data?.data || res?.data || res;
        },
        staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    });

    const parsedConfig = useMemo(() => {
        const remoteData = data?.data || data;

        // A section present as an array is what the admin published, empty
        // included — clearing a section has to survive the trip to the app.
        // Only a missing or malformed section falls back to what we bundle.
        // --- 1. Explore Categories ---
        let rawCategories: CategoryInfo[] = CATEGORIES_CONFIG;
        if (Array.isArray(remoteData?.categories)) {
            rawCategories = remoteData.categories.map((cat: any) => ({
                id: cat.id,
                label: cat.label || cat.name,
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
                label: cat.label || cat.name,
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
                title: group.title || group.name,
                isActive: group.isActive !== false,
                order: typeof group.order === 'number' ? group.order : UNORDERED,
                appVersions: group.appVersions || [],
                items: (group.items || []).map((item: any) => ({
                    id: item.id,
                    label: item.label || item.name,
                    icon: resolveIcon(item.icon || item.image, item.id),
                    image: resolveIcon(item.image || item.icon, item.id),
                    route: item.route,
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
        isRefetching,
        refetch,
    };
}
