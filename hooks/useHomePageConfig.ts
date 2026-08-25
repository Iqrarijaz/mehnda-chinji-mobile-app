import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getConfiguration } from '@/apis/public';
import {
    CategoryInfo,
    UtilCategoryConfig,
    resolveIcon,
} from '@/constants/categories';
import { getCurrentAppVersion, isItemActiveAndSupported } from '@/utils/configVersionFilter';

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
    } = useQuery({
        queryKey: ['configuration', 'HOME_PAGE_CONFIG'],
        queryFn: async () => {
            const res: any = await getConfiguration('HOME_PAGE_CONFIG');
            // Support direct response, standard envelope, and Mongo document shapes
            const doc = res?.data !== undefined ? res.data : res;
            const payload = doc?.data !== undefined ? doc.data : doc;
            return payload;
        },
        staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    });

    const parsedConfig = useMemo(() => {
        const remoteData = (data?.data !== undefined ? data.data : data) || {};

        // --- 1. Explore Categories ---
        let rawCategories: CategoryInfo[] = [];
        if (remoteData?.categories && Array.isArray(remoteData.categories)) {
            rawCategories = remoteData.categories.map((cat: any) => ({
                id: cat.id,
                label: cat.label || cat.name || '',
                icon: resolveIcon(cat.icon, cat.id),
                route: cat.route || `/listing/${cat.id}`,
                isActive: cat.isActive !== false,
                order: typeof cat.order === 'number' ? cat.order : 0,
                appVersions: cat.appVersions || [],
            }));
        }

        const filteredCategories = rawCategories
            .filter((cat) => isItemActiveAndSupported(cat, currentVersion))
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

        // --- 2. More Categories ---
        let rawMoreCategories: CategoryInfo[] = [];
        if (remoteData?.moreCategories && Array.isArray(remoteData.moreCategories)) {
            rawMoreCategories = remoteData.moreCategories.map((cat: any) => ({
                id: cat.id,
                label: cat.label || cat.name || '',
                icon: resolveIcon(cat.icon, cat.id),
                route: cat.route || `/listing/${cat.id}`,
                isActive: cat.isActive !== false,
                order: typeof cat.order === 'number' ? cat.order : 0,
                appVersions: cat.appVersions || [],
            }));
        }

        const filteredMoreCategories = rawMoreCategories
            .filter((cat) => isItemActiveAndSupported(cat, currentVersion))
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

        // --- 3. Utilities Sections ---
        let rawUtilities: UtilCategoryConfig[] = [];
        if (remoteData?.utilities && Array.isArray(remoteData.utilities)) {
            rawUtilities = remoteData.utilities.map((group: any) => ({
                id: group.id,
                title: group.title || group.name || '',
                isActive: group.isActive !== false,
                order: typeof group.order === 'number' ? group.order : 0,
                appVersions: group.appVersions || [],
                items: (group.items || []).map((item: any) => ({
                    id: item.id,
                    label: item.label || item.name || '',
                    icon: resolveIcon(item.icon || item.image, item.id),
                    image: resolveIcon(item.image || item.icon, item.id),
                    route: item.route || '',
                    isActive: item.isActive !== false,
                    order: typeof item.order === 'number' ? item.order : 0,
                    appVersions: item.appVersions || [],
                })),
            }));
        }

        const filteredUtilities = rawUtilities
            .filter((group) => isItemActiveAndSupported(group, currentVersion))
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            .map((group) => ({
                ...group,
                items: (group.items || [])
                    .filter((item) => isItemActiveAndSupported(item, currentVersion))
                    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
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
