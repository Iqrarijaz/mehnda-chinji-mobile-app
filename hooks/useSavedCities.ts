import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { getSavedCities, saveSavedCities, SavedCity } from '@/apis/weather';

export const SAVED_CITIES_KEY = ['savedCities'];

const sameCity = (a: SavedCity, b: SavedCity) =>
    Math.abs(a.latitude - b.latitude) < 0.01 && Math.abs(a.longitude - b.longitude) < 0.01;

const ensureOneDefault = (list: SavedCity[]): SavedCity[] => {
    if (!list.length) return list;
    const hasDefault = list.some((c) => c.isDefault);
    return list.map((c, i) => ({ ...c, isDefault: hasDefault ? c.isDefault : i === 0 }));
};

/**
 * Saved-cities state, synced with the backend and cached offline via React
 * Query's persister. All edits go through a single replace-the-list mutation
 * (optimistic) so add / remove / reorder / set-default stay atomic and consistent.
 */
export function useSavedCities() {
    const qc = useQueryClient();

    const query = useQuery<SavedCity[]>({
        queryKey: SAVED_CITIES_KEY,
        queryFn: async () => {
            const res = await getSavedCities();
            return res?.data ?? [];
        },
        staleTime: 1000 * 60 * 30,
    });

    const cities = query.data ?? [];

    const mutation = useMutation({
        mutationFn: (list: SavedCity[]) => saveSavedCities(list),
        onMutate: async (list) => {
            await qc.cancelQueries({ queryKey: SAVED_CITIES_KEY });
            const prev = qc.getQueryData<SavedCity[]>(SAVED_CITIES_KEY);
            qc.setQueryData(SAVED_CITIES_KEY, list);
            return { prev };
        },
        onError: (_e, _list, ctx) => {
            if (ctx?.prev) qc.setQueryData(SAVED_CITIES_KEY, ctx.prev);
        },
        onSuccess: (res) => {
            qc.setQueryData(SAVED_CITIES_KEY, res?.data ?? []);
        },
    });

    const save = useCallback((list: SavedCity[]) => mutation.mutate(ensureOneDefault(list.slice(0, 10))), [mutation]);

    const addCity = useCallback((city: SavedCity) => {
        if (cities.some((c) => sameCity(c, city))) return;
        save([...cities, { ...city, isDefault: cities.length === 0 }]);
    }, [cities, save]);

    const removeCity = useCallback((index: number) => {
        save(cities.filter((_, i) => i !== index));
    }, [cities, save]);

    const reorderCity = useCallback((from: number, to: number) => {
        if (from === to) return;
        const next = [...cities];
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        save(next);
    }, [cities, save]);

    const setDefaultCity = useCallback((index: number) => {
        save(cities.map((c, i) => ({ ...c, isDefault: i === index })));
    }, [cities, save]);

    const defaultCity = cities.find((c) => c.isDefault) ?? cities[0] ?? null;

    return {
        cities,
        defaultCity,
        isLoading: query.isLoading,
        isSaving: mutation.isPending,
        refetch: query.refetch,
        addCity,
        removeCity,
        reorderCity,
        setDefaultCity,
    };
}
