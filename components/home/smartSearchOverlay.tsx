import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Platform,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { getPlacesList } from '@/apis/places';
import { ThemedText } from '@/components/themedText';
import { GlassCard } from '@/components/ui/glassCard';
import { Colors } from '@/constants/colors';
import {
    SEARCH_CATEGORIES_CONFIG,
    SEARCH_NAV_ITEMS,
    SearchCategoryResult,
    SearchNavResult
} from '@/constants/search-config';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { clientStorage } from '@/utils/storage';

interface SmartSearchOverlayProps {
    searchQuery: string;
    onClose: () => void;
    onSearchChange: (query: string) => void;
}

const RECENT_SEARCHES_KEY = '@mehnda_chinji_recent_searches';

type SearchResult =
    | { type: 'nav'; data: SearchNavResult }
    | { type: 'category'; data: SearchCategoryResult }
    | { type: 'place'; data: any };

export const SmartSearchOverlay = React.memo(({ searchQuery, onClose, onSearchChange }: SmartSearchOverlayProps) => {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const isDark = theme === 'dark';
    const router = useRouter();

    const [recents, setRecents] = useState<SearchResult[]>([]);
    const [apiResults, setApiResults] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // In-memory cache for API results
    const cache = useRef<Record<string, any[]>>({});

    // Load recents on mount
    useEffect(() => {
        const loadRecents = async () => {
            try {
                const stored = await clientStorage.getItem(RECENT_SEARCHES_KEY);
                if (stored) setRecents(JSON.parse(stored));
            } catch (e) {
                console.error('Failed to load recents', e);
            }
        };
        loadRecents();
    }, []);

    // Save selection to recents
    const saveToRecents = useCallback(async (item: SearchResult) => {
        try {
            const current = await clientStorage.getItem(RECENT_SEARCHES_KEY);
            let list: SearchResult[] = current ? JSON.parse(current) : [];

            // Remove if already exists (deduplicate)
            list = list.filter(i => {
                if (i.type !== item.type) return true;
                if (i.type === 'nav') return (i.data as SearchNavResult).id !== (item.data as SearchNavResult).id;
                if (i.type === 'category') return (i.data as SearchCategoryResult).id !== (item.data as SearchCategoryResult).id;
                if (i.type === 'place') return (i.data as any)._id !== (item.data as any)._id;
                return true;
            });

            // Add to top and limit to 3
            list = [item, ...list].slice(0, 3);

            setRecents(list);
            await clientStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(list));
        } catch (e) {
            console.error('Failed to save recent', e);
        }
    }, []);

    // Filter Navigation & Categories locally
    const filteredNav = useMemo(() => {
        if (!searchQuery) return [];
        return SEARCH_NAV_ITEMS.filter(item =>
            item.label.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery]);

    const filteredCategories = useMemo(() => {
        if (!searchQuery) return [];
        const q = searchQuery.toLowerCase();
        return SEARCH_CATEGORIES_CONFIG.filter(cat =>
            cat.label.toLowerCase().includes(q) ||
            cat.keywords.some(k => k.includes(q))
        );
    }, [searchQuery]);

    // API Search with debouncing
    useEffect(() => {
        if (!searchQuery || searchQuery.length < 2) {
            setApiResults([]);
            return;
        }

        const query = searchQuery.toLowerCase();

        if (cache.current[query]) {
            setApiResults(cache.current[query]);
            return;
        }

        const timer = setTimeout(async () => {
            setIsLoading(true);
            try {
                const res = await getPlacesList({ search: query, limit: 5 });
                const places = (res as any)?.places || [];
                cache.current[query] = places;
                setApiResults(places);
            } catch (e) {
                console.error('Search API error', e);
            } finally {
                setIsLoading(false);
            }
        }, 400);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleSelect = useCallback((item: SearchResult) => {
        if (item.type === 'nav') {
            router.push((item.data as SearchNavResult).route as any);
        } else if (item.type === 'category') {
            const catId = (item.data as SearchCategoryResult).id.toLowerCase();
            router.push(`/listing/${catId}` as any);
        } else if (item.type === 'place') {
            const catId = (item.data as any).categoryEn?.toLowerCase() || 'health';
            router.push(`/listing/${catId}` as any);
        }

        saveToRecents(item);
        // Delay closing slightly to ensure navigation is handled
        setTimeout(onClose, 100);
    }, [onClose, router, saveToRecents]);

    const renderHeader = (title: string) => (
        <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
    );

    const renderItemContent = (item: SearchResult) => {
        let label = '';
        let icon: any = 'search';
        let color = colors.text;

        if (item.type === 'nav') {
            label = item.data.label;
            icon = item.data.icon;
        } else if (item.type === 'category') {
            label = item.data.label;
            icon = item.data.icon;
            color = item.data.color;
        } else if (item.type === 'place') {
            label = (item.data as any).name;
            icon = 'location';
        }

        return (
            <View
                style={[styles.resultItem, { borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}
            >
                <View style={[styles.iconBox, { backgroundColor: item.type === 'category' ? `${color}15` : 'rgba(128,128,128,0.1)' }]}>
                    <Ionicons name={icon} size={18} color={item.type === 'category' ? color : colors.text} />
                </View>
                <ThemedText style={styles.resultLabel}>{label}</ThemedText>
                <Ionicons name="chevron-forward" size={14} color={colors.text} style={{ opacity: 0.3 }} />
            </View>
        );
    };

    const getItemLabel = (item: SearchResult) => {
        if (item.type === 'nav') return (item.data as SearchNavResult).label;
        if (item.type === 'category') return (item.data as SearchCategoryResult).label;
        if (item.type === 'place') return (item.data as any).name;
        return '';
    };

    const hasQuery = searchQuery.length > 0;

    return (
        <Animated.View
            entering={FadeIn.duration(300)}
            exiting={FadeOut.duration(200)}
            style={[styles.overlay, {
                marginHorizontal: 16,
                marginTop: -14,
                marginBottom: Platform.OS === 'ios' ? 40 : 20,
            }]}
        >
            <BlurView
                intensity={80}
                tint={isDark ? 'dark' : 'light'}
                style={StyleSheet.absoluteFill}
            />
            <GlassCard
                style={[
                    styles.content,
                    {
                        backgroundColor: 'transparent',
                        borderColor: 'transparent', // GlassCard handles its own border
                        marginTop: 0,
                        flex: 1,
                    }
                ]}
            >
                <View style={styles.overlayHeader}>
                    <ThemedText style={[styles.sectionTitle, { marginBottom: 0 }]}>
                        {hasQuery ? 'Search Results' : (recents.length > 0 ? 'Recent Searches' : 'Search')}
                    </ThemedText>
                    <TouchableOpacity
                        onPress={onClose}
                        style={styles.closeButton}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="close" size={24} color={colors.text} />
                    </TouchableOpacity>
                </View>

                <FlatList
                    contentContainerStyle={styles.listContent}
                    data={hasQuery ? [
                        ...filteredNav.map(n => ({ type: 'nav', data: n } as SearchResult)),
                        ...filteredCategories.map(c => ({ type: 'category', data: c } as SearchResult)),
                        ...apiResults.map(p => ({ type: 'place', data: p } as SearchResult))
                    ].map(item => ({ ...item, isMainResult: true })) : []}
                    keyExtractor={(item, index) => `${item.type}-${index}`}
                    renderItem={({ item }: { item: any }) => (
                        <TouchableOpacity
                            onPress={() => handleSelect(item)}
                            activeOpacity={0.7}
                        >
                            {renderItemContent(item)}
                        </TouchableOpacity>
                    )}
                    ListHeaderComponent={() => (
                        <>
                            {!hasQuery && (
                                <>
                                    {recents.length > 0 && (
                                        <View style={styles.section}>
                                            {recents.map((item, idx) => (
                                                <TouchableOpacity
                                                    key={idx}
                                                    onPress={() => onSearchChange(getItemLabel(item))}
                                                    activeOpacity={0.7}
                                                >
                                                    {renderItemContent(item)}
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    )}

                                    {/* <View style={styles.section}>
                                        {renderHeader('Popular Searches')}
                                        <View style={styles.popularGrid}>
                                            {POPULAR_SEARCHES.map((word, idx) => (
                                                <TouchableOpacity
                                                    key={idx}
                                                    style={[styles.popularChip, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
                                                    onPress={() => {
                                                        onSearchChange(word);
                                                    }}
                                                >
                                                    <ThemedText style={styles.popularText}>{word}</ThemedText>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View> */}
                                </>
                            )}
                            {hasQuery && isLoading && (
                                <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 20 }} />
                            )}
                            {hasQuery && !isLoading && filteredNav.length === 0 && filteredCategories.length === 0 && apiResults.length === 0 && (
                                <View style={styles.emptyContainer}>
                                    <ThemedText style={styles.emptyText}>No matches found for "{searchQuery}"</ThemedText>
                                </View>
                            )}
                        </>
                    )}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                />
            </GlassCard>
        </Animated.View>
    );
});

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 5,
        top: 0,
        overflow: 'hidden',
        borderRadius: 24,
    },
    content: {
        flex: 1,
        borderRadius: 24,
        borderWidth: 1,
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
    },
    listContent: {
        paddingTop: 10,
        paddingHorizontal: 16,
    },
    overlayHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 4,
    },
    closeButton: {
        padding: 4,
        borderRadius: 20,
        backgroundColor: 'rgba(128,128,128,0.1)',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        opacity: 0.5,
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    resultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    resultLabel: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
    },
    popularGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    popularChip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
    },
    popularText: {
        fontSize: 13,
        fontWeight: '600',
    },
    emptyContainer: {
        paddingVertical: 40,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 14,
        opacity: 0.6,
        fontStyle: 'italic',
    }
});
