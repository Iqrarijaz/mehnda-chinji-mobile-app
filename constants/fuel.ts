import { MaterialCommunityIcons } from '@expo/vector-icons';

export interface FuelProductMeta {
    label: string;
    unitLabel: string;
    gradient: [string, string];
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
}

/**
 * Metadata for PSO's national (non-city-specific) products. `octane_plus`
 * is handled separately (see app/fuel.tsx) since PSO prices it per city.
 */
export const FUEL_PRODUCTS_META: Record<string, FuelProductMeta> = {
    petrol: {
        label: 'Petrol',
        unitLabel: 'Per litre',
        gradient: ['#F97316', '#EA580C'],
        icon: 'gas-station',
    },
    hsd: {
        label: 'Diesel (HSD)',
        unitLabel: 'Per litre',
        gradient: ['#64748B', '#334155'],
        icon: 'fuel',
    },
    lpg: {
        label: 'LPG',
        unitLabel: 'Per kg',
        gradient: ['#0EA5E9', '#0284C7'],
        icon: 'propane-tank-outline',
    },
    kerosene: {
        label: 'Kerosene',
        unitLabel: 'Per litre',
        gradient: ['#EAB308', '#CA8A04'],
        icon: 'oil-lamp',
    },
};

export const FUEL_PRODUCTS_ORDER = ['petrol', 'hsd', 'lpg', 'kerosene'];

/** Fallback metadata for a PSO product this app doesn't recognize yet. */
export const FUEL_PRODUCT_FALLBACK_META: FuelProductMeta = {
    label: 'Fuel',
    unitLabel: 'Per litre',
    gradient: ['#94A3B8', '#64748B'],
    icon: 'barrel',
};

export const OCTANE_PLUS_KEY = 'octane_plus';

export const OCTANE_PLUS_META: FuelProductMeta = {
    label: 'Octane Plus (95)',
    unitLabel: 'Per litre',
    gradient: ['#8B5CF6', '#7C3AED'],
    icon: 'gas-station-outline',
};

export function getFuelProductMeta(key: string): FuelProductMeta {
    return FUEL_PRODUCTS_META[key] ?? { ...FUEL_PRODUCT_FALLBACK_META, label: key.charAt(0).toUpperCase() + key.slice(1) };
}
