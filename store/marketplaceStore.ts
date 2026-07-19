import { create } from 'zustand';

/**
 * Global cache of the most recently browsed Marketplace listings. The list
 * tab feeds it, and the details screen derives "Similar Items" from it — so
 * navigating item → item keeps showing related products without relying on
 * navigation params.
 */
interface MarketplaceState {
    items: any[];
    setItems: (items: any[]) => void;
    /** Similar items for a given id: same category first, current item excluded. */
    getSimilarItems: (currentId: string, category?: string, limit?: number) => any[];
}

export const useMarketplaceStore = create<MarketplaceState>((set, get) => ({
    items: [],
    setItems: (items) => set({ items: Array.isArray(items) ? items : [] }),
    getSimilarItems: (currentId, category, limit = 10) => {
        const all = get().items.filter((i) => i && i._id !== currentId);
        if (!all.length) return [];

        const catOf = (i: any) => {
            const c = i?.category;
            return (typeof c === 'object' ? (c?.en || c?.ur) : c) || '';
        };
        const target = (category || '').toLowerCase();

        if (target) {
            const sameCat = all.filter((i) => catOf(i).toLowerCase() === target);
            const others = all.filter((i) => catOf(i).toLowerCase() !== target);
            return [...sameCat, ...others].slice(0, limit);
        }
        return all.slice(0, limit);
    },
}));
