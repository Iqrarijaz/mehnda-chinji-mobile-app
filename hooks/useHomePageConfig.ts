import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import * as Application from 'expo-application';

import { getConfiguration } from '@/apis/public';
import {
    DEFAULT_HOME_PAGE_CONFIG,
    FALLBACK_ICON,
    LOCAL_ICONS,
    type ResolvedIcon,
} from '@/constants/homePageConfig';
import {
    classifyIcon,
    selectVisibleGroups,
    selectVisibleItems,
    type HomeConfigItem,
    type HomePageConfig,
} from '@/utils/homePageLayout';

export { isItemActiveAndSupported } from '@/utils/homePageLayout';

/**
 * The whole home screen from one request.
 *
 * Explore Categories, More Categories and every Daily Utilities group live in a
 * single HOME_PAGE_CONFIG document, so opening Home costs one call instead of
 * one per section. The layout is cached hard — it changes when an admin edits
 * it, not on a timer — and falls back to the bundled defaults while loading,
 * offline, or if the request fails, so the screen is never empty.
 */

const CONFIG_TYPE = 'HOME_PAGE_CONFIG';
const TWELVE_HOURS = 1000 * 60 * 60 * 12;

export const HOME_PAGE_CONFIG_QUERY_KEY = ['configuration', CONFIG_TYPE] as const;

/**
 * The version this build reports. Prefers the real native version and falls
 * back to the bundled env value, matching how the rest of the app resolves it.
 */
export function getCurrentAppVersion(): string {
    return Application.nativeApplicationVersion || process.env.EXPO_PUBLIC_APP_VERSION || '';
}

/**
 * Pick what the card should draw for an entry.
 *
 * A remote URL wins, then anything else non-empty is treated as an Ionicons
 * name, then the bundled asset for that id, and finally a neutral glyph. This
 * ordering is what lets the document ship `icon: null` and still render.
 */
export function resolveIcon(item: HomeConfigItem): ResolvedIcon {
    const classified = classifyIcon(item.icon);

    if (classified.kind === 'remote') return { uri: classified.uri };
    if (classified.kind === 'name') return classified.name as ResolvedIcon;
    return LOCAL_ICONS[item.id] ?? FALLBACK_ICON;
}

export function useHomePageConfig() {
    const { data, isLoading, refetch } = useQuery({
        queryKey: HOME_PAGE_CONFIG_QUERY_KEY,
        queryFn: () => getConfiguration(CONFIG_TYPE),
        staleTime: TWELVE_HOURS,
        gcTime: TWELVE_HOURS * 2,
        refetchOnWindowFocus: false,
    });

    const version = getCurrentAppVersion();

    const config = useMemo<HomePageConfig>(() => {
        const remote = (data as any)?.data?.data;
        // Only trust a payload that actually looks like a layout; a half-written
        // document should fall back rather than blank the home screen.
        if (remote && Array.isArray(remote.categories)) {
            return remote as HomePageConfig;
        }
        return DEFAULT_HOME_PAGE_CONFIG;
    }, [data]);

    const categories = useMemo(
        () => selectVisibleItems(config.categories, version),
        [config.categories, version]
    );

    const moreCategories = useMemo(
        () => selectVisibleItems(config.moreCategories, version),
        [config.moreCategories, version]
    );

    const utilities = useMemo(
        () => selectVisibleGroups(config.utilities, version),
        [config.utilities, version]
    );

    return { categories, moreCategories, utilities, isLoading, refetch };
}
