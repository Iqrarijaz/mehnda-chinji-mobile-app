import { MaterialCommunityIcons } from '@expo/vector-icons';

/**
 * Display metadata for the Metals & Gold screen. Keys match the primary
 * fields the backend's `/api/public/v1/metals/latest` endpoint surfaces.
 */
export type MetalKey = 'gold' | 'silver' | 'platinum' | 'palladium';

export interface MetalMeta {
    key: MetalKey;
    label: string;
    /** Dual-tone gradient used for the icon badge and card accents. */
    gradient: [string, string];
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
}

export const METALS_META: Record<MetalKey, MetalMeta> = {
    gold: {
        key: 'gold',
        label: 'Gold',
        gradient: ['#F5C451', '#B8860B'],
        icon: 'gold',
    },
    silver: {
        key: 'silver',
        label: 'Silver',
        gradient: ['#E2E8F0', '#94A3B8'],
        icon: 'circle-slice-8',
    },
    platinum: {
        key: 'platinum',
        label: 'Platinum',
        gradient: ['#CBD5E1', '#64748B'],
        icon: 'ring',
    },
    palladium: {
        key: 'palladium',
        label: 'Palladium',
        gradient: ['#D9D4C7', '#8A8375'],
        icon: 'atom-variant',
    },
};

export const METALS_ORDER: MetalKey[] = ['gold', 'silver', 'platinum', 'palladium'];

export const GOLD_KARAT_LABELS: Record<string, string> = {
    k24: '24K',
    k22: '22K',
    k21: '21K',
    k18: '18K',
};

/**
 * Base (industrial) metals — surfaced from the backend's `raw` field so the
 * search bar on the Metals & Gold screen has more than 4 items to filter.
 */
export type BaseMetalKey = 'copper' | 'aluminum' | 'lead' | 'nickel' | 'zinc';

export interface BaseMetalMeta {
    key: BaseMetalKey;
    label: string;
    gradient: [string, string];
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
}

export const BASE_METALS_META: Record<BaseMetalKey, BaseMetalMeta> = {
    copper: { key: 'copper', label: 'Copper', gradient: ['#E8956B', '#B85C38'], icon: 'pipe' },
    aluminum: { key: 'aluminum', label: 'Aluminum', gradient: ['#D8DEE4', '#9CA8B4'], icon: 'cube-outline' },
    lead: { key: 'lead', label: 'Lead', gradient: ['#8B8D93', '#54565C'], icon: 'weight' },
    nickel: { key: 'nickel', label: 'Nickel', gradient: ['#DCD6C8', '#A69F8C'], icon: 'hexagon-outline' },
    zinc: { key: 'zinc', label: 'Zinc', gradient: ['#B8C4CC', '#75838C'], icon: 'molecule' },
};

export const BASE_METALS_ORDER: BaseMetalKey[] = ['copper', 'aluminum', 'lead', 'nickel', 'zinc'];
