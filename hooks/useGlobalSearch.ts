import { useState, useEffect, useRef, useCallback } from 'react';
import { getBusinessesList } from '@/apis/business';
import { getDonorsList } from '@/apis/bloodDonation';
import { getEssentialsList } from '@/apis/essentials';

export type GlobalSearchResultType = 'business' | 'donor' | 'place';

export interface GlobalSearchResult {
    id: string;
    type: GlobalSearchResultType;
    title: string;
    subtitle?: string;
    image?: string;
    data: any;
}

export const useGlobalSearch = (query: string) => {
    const [results, setResults] = useState<GlobalSearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const cache = useRef<Record<string, GlobalSearchResult[]>>({});

    const performSearch = useCallback(async (searchQuery: string) => {
        if (!searchQuery || searchQuery.length < 2) {
            setResults([]);
            return;
        }

        const normalizedQuery = searchQuery.toLowerCase();
        if (cache.current[normalizedQuery]) {
            setResults(cache.current[normalizedQuery]);
            return;
        }

        setIsLoading(true);
        try {
            // Concurrent fetching from all sources
            const [businessRes, donorsRes, essentialsRes] = await Promise.all([
                getBusinessesList({ text: normalizedQuery, currentPage: 1 }).catch(() => null),
                getDonorsList({ name: normalizedQuery, currentPage: 1 }).catch(() => null),
                getEssentialsList({ search: normalizedQuery, limit: 5 }).catch(() => null),
            ]);

            const aggregated: GlobalSearchResult[] = [];

            // 1. Process Businesses
            if ((businessRes as any)?.data) {
                (businessRes as any).data.slice(0, 5).forEach((b: any) => {
                    aggregated.push({
                        id: b._id,
                        type: 'business',
                        title: b.businessName,
                        subtitle: b.categoryEn || 'Business',
                        image: b.businessImage,
                        data: b,
                    });
                });
            }
            // 2. Process Places (Essentials)
            if ((essentialsRes as any)?.data?.data || (essentialsRes as any)?.data) {
                const placesData = Array.isArray((essentialsRes as any).data) ? (essentialsRes as any).data : (essentialsRes as any).data?.data || [];
                placesData.slice(0, 5).forEach((p: any) => {
                    aggregated.push({
                        id: p._id,
                        type: 'place',
                        title: p.name || p.title,
                        subtitle: p.category || 'Place',
                        image: p.images?.[0] || '',
                        data: p,
                    });
                });
            }

            // 3. Process Donors
            if ((donorsRes as any)?.data) {
                (donorsRes as any).data.slice(0, 5).forEach((d: any) => {
                    aggregated.push({
                        id: d._id,
                        type: 'donor',
                        title: d.name,
                        subtitle: `Donor • ${d.bloodGroup}`,
                        image: d.profileImage,
                        data: d,
                    });
                });
            }

            cache.current[normalizedQuery] = aggregated;
            setResults(aggregated);
        } catch (error) {
            console.error('Global Search Error:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            performSearch(query);
        }, 500);

        return () => clearTimeout(timer);
    }, [query, performSearch]);

    return { results, isLoading };
};
