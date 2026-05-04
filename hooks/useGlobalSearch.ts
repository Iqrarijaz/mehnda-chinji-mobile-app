import { useState, useEffect, useRef, useCallback } from 'react';
import { getBusinessesList } from '@/apis/business';
import { getPostsList } from '@/apis/posts';
import { getDonorsList } from '@/apis/bloodDonation';

export type GlobalSearchResultType = 'business' | 'post' | 'donor' | 'place';

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
            const [businessRes, postsRes, donorsRes] = await Promise.all([
                getBusinessesList({ search: normalizedQuery, currentPage: 1 }).catch(() => null),
                getPostsList({ search: normalizedQuery, page: 1 }).catch(() => null),
                getDonorsList({ name: normalizedQuery, currentPage: 1 }).catch(() => null),
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

            // 2. Process Posts
            if ((postsRes as any)?.data) {
                (postsRes as any).data.slice(0, 5).forEach((p: any) => {
                    aggregated.push({
                        id: p._id,
                        type: 'post',
                        title: p.content?.substring(0, 50) + (p.content?.length > 50 ? '...' : ''),
                        subtitle: `Feed • ${p.createdBy?.name}`,
                        image: p.images?.[0],
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
