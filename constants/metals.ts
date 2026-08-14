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
