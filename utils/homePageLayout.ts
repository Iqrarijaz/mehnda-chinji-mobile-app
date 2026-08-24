/**
 * Pure selection rules for the dynamic home-screen layout.
 *
 * Deliberately dependency-free — no React, no assets, no network — so the
 * filtering and ordering that decide what a given build actually shows can be
 * reasoned about and tested on its own, away from the query hook that feeds it.
 */

export interface HomeConfigItem {
    id: string;
    label: string;
    /** Remote URL, Ionicons name, or empty to fall back to the bundled asset. */
    icon?: string | null;
    route: string;
    isActive?: boolean;
    order?: number;
    appVersions?: string[];
}

export interface HomeUtilityGroup {
    id: string;
    title: string;
    isActive?: boolean;
    order?: number;
    appVersions?: string[];
    items: HomeConfigItem[];
}

export interface HomePageConfig {
    categories: HomeConfigItem[];
    moreCategories: HomeConfigItem[];
    utilities: HomeUtilityGroup[];
}

/**
 * An entry shows when it is active and either targets no versions or names this
 * one. Empty or missing appVersions means "every version", so untargeted
 * entries keep working on builds nobody thought to list.
 */
export function isItemActiveAndSupported(
    item: { isActive?: boolean; appVersions?: string[] },
    currentVersion: string
): boolean {
    if (item.isActive === false) return false;
    if (!item.appVersions || item.appVersions.length === 0) return true;
    return item.appVersions.includes(currentVersion);
}

/** Orders on `order`, leaving entries without one at the end in sequence. */
function byOrder<T extends { order?: number }>(a: T, b: T): number {
    return (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER);
}

/** Entries this build should show, in order. Malformed entries are skipped. */
export function selectVisibleItems(
    items: HomeConfigItem[] | undefined,
    currentVersion: string
): HomeConfigItem[] {
    if (!Array.isArray(items)) return [];
    return items
        .filter((item) => item && item.id && isItemActiveAndSupported(item, currentVersion))
        .sort(byOrder);
}

/**
 * Groups this build should show, in order, each already reduced to its visible
 * items. A group is dropped when it is hidden, unsupported, or has nothing left
 * to show — an empty heading is just noise on the home screen.
 */
export function selectVisibleGroups(
    groups: HomeUtilityGroup[] | undefined,
    currentVersion: string
): HomeUtilityGroup[] {
    if (!Array.isArray(groups)) return [];
    return groups
        .filter((group) => group && group.id && isItemActiveAndSupported(group, currentVersion))
        .map((group) => ({ ...group, items: selectVisibleItems(group.items, currentVersion) }))
        .filter((group) => group.items.length > 0)
        .sort(byOrder);
}

/**
 * What kind of icon a configured value is, so the caller can decide how to draw
 * it without repeating the string sniffing.
 */
export type IconKind =
    | { kind: 'remote'; uri: string }
    | { kind: 'name'; name: string }
    | { kind: 'none' };

export function classifyIcon(icon?: string | null): IconKind {
    const value = typeof icon === 'string' ? icon.trim() : '';
    if (value.startsWith('http://') || value.startsWith('https://')) {
        return { kind: 'remote', uri: value };
    }
    if (value.length > 0) {
        return { kind: 'name', name: value };
    }
    return { kind: 'none' };
}
