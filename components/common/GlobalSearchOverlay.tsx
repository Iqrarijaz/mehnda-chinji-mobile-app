import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Platform,
    StyleSheet,
    TouchableOpacity,
    View,
    TextInput
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { Layout } from '@/constants/layout';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { useGlobalSearch, GlobalSearchResult } from '@/hooks/useGlobalSearch';
import { clientStorage } from '@/utils/storage';
import { SEARCH_CATEGORIES_CONFIG, SEARCH_NAV_ITEMS, SearchCategoryResult, SearchNavResult } from '@/constants/search-config';

interface GlobalSearchOverlayProps {
    searchQuery: string;
    onClose: () => void;
    onSearchChange: (query: string) => void;
    onAction?: (action: string) => void;
    topPadding?: number; // override default insets.top when rendered below a header
}

const RECENT_SEARCHES_KEY = '@rehbar_global_recent_searches';

export const GlobalSearchOverlay = React.memo(({ searchQuery, onClose, onSearchChange, onAction, topPadding }: GlobalSearchOverlayProps) => {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const isDark = theme === 'dark';
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [recents, setRecents] = useState<GlobalSearchResult[]>([]);
    const { results: apiResults, isLoading } = useGlobalSearch(searchQuery);

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
    const saveToRecents = useCallback(async (item: GlobalSearchResult) => {
        try {
            const current = await clientStorage.getItem(RECENT_SEARCHES_KEY);
            let list: GlobalSearchResult[] = current ? JSON.parse(current) : [];

            // Remove if already exists (deduplicate)
            list = list.filter(i => i.id !== item.id || i.type !== item.type);

            // Add to top and limit to 5
            list = [item, ...list].slice(0, 5);

            setRecents(list);
            await clientStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(list));
        } catch (e) {
            console.error('Failed to save recent', e);
        }
    }, []);

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

    const handleSelect = useCallback((item: any) => {
        if (item.type === 'nav') {
            if (item.data.action) {
                // Special action (e.g., open a modal)
                setTimeout(() => onAction?.(item.data.action), 150);
            } else if (item.data.route) {
                router.push(item.data.route as any);
            }
        } else if (item.type === 'category') {
            const catId = item.data.id.toLowerCase();
            router.push(`/listing/${catId}` as any);
        } else if (item.type === 'business') {
            router.push(`/business/${item.id}` as any);
        } else if (item.type === 'donor') {
            router.push('/(tabs)/blood' as any);
        } else if (item.type === 'place') {
            router.push(`/place/${item.id}` as any);
        }

        if (item.id) {
            saveToRecents(item as GlobalSearchResult);
        }

        setTimeout(onClose, 100);
    }, [onClose, onAction, router, saveToRecents]);

    const renderResultItem = (item: any) => {
        let label = item.title || item.label || '';
        let subtitle = item.subtitle || '';
        let icon: any = 'search';
        let color = colors.text;

        if (item.type === 'nav') {
            icon = item.data.icon;
            color = item.data.color || colors.primary;
            subtitle = item.data.subtitle || '';
        } else if (item.type === 'category') {
            icon = item.data.icon;
            color = item.data.color;
        } else if (item.type === 'business') {
            icon = 'business';
            color = '#3B82F6';
        } else if (item.type === 'donor') {
            icon = 'water';
            color = '#EF4444';
        } else if (item.type === 'place') {
            icon = 'location';
            color = '#10B981';
        }

        return (
            <View style={[styles.resultItem, { borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
                <View style={[styles.iconBox, { backgroundColor: `${color}15` }]}>
                    <Ionicons name={icon} size={18} color={color} />
                </View>
                <View style={styles.textContainer}>
                    <ThemedText style={styles.resultLabel}>{label}</ThemedText>
                    {subtitle ? <ThemedText style={styles.resultSubtitle}>{subtitle}</ThemedText> : null}
                </View>
                <Ionicons name="chevron-forward" size={14} color={colors.text} style={{ opacity: 0.3 }} />
            </View>
        );
    };

    const hasQuery = searchQuery.length > 0;

    return (
        <Animated.View
            entering={FadeIn.duration(300)}
            exiting={FadeOut.duration(200)}
            style={[
                styles.overlay,
                {
                    paddingTop: topPadding !== undefined ? topPadding : insets.top,
                    backgroundColor: Platform.OS === 'android' ? colors.background : 'transparent'
                }
            ]}
        >
            <BlurView intensity={90} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />

            <View style={styles.header}>
                <View style={[styles.searchBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                    <Ionicons name="search" size={20} color={colors.text} style={{ opacity: 0.5 }} />
                    <TextInput
                        autoFocus
                        placeholder="Search everything..."
                        placeholderTextColor={isDark ? 'rgba(255,255,255,0.4)' : '#94A3B8'}
                        value={searchQuery}
                        onChangeText={onSearchChange}
                        style={[styles.input, { color: colors.text }]}
                    />
                    {hasQuery && (
                        <TouchableOpacity onPress={() => onSearchChange('')}>
                            <Ionicons name="close-circle" size={20} color={colors.text} style={{ opacity: 0.5 }} />
                        </TouchableOpacity>
                    )}
                </View>
                <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
                    <ThemedText style={{ color: colors.primary, fontWeight: '600' }}>Cancel</ThemedText>
                </TouchableOpacity>
            </View>

            <FlatList
                contentContainerStyle={styles.listContent}
                data={hasQuery ? [
                    ...filteredNav.map(n => ({ type: 'nav', data: n, title: n.label, id: n.id })),
                    ...filteredCategories.map(c => ({ type: 'category', data: c, title: c.label, id: c.id })),
                    ...apiResults
                ] : recents}
                keyExtractor={(item, index) => `${item.type}-${item.id || index}`}
                renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => handleSelect(item)} activeOpacity={0.7}>
                        {renderResultItem(item)}
                    </TouchableOpacity>
                )}
                ListHeaderComponent={() => (
                    <ThemedText style={styles.sectionTitle}>
                        {hasQuery ? 'Results' : (recents.length > 0 ? 'Recent Searches' : 'Suggestions')}
                    </ThemedText>
                )}
                ListEmptyComponent={() => (
                    hasQuery && !isLoading ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="search-outline" size={48} color={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} />
                            <ThemedText style={styles.emptyText}>No results found for "{searchQuery}"</ThemedText>
                        </View>
                    ) : null
                )}
                ListFooterComponent={() => (
                    isLoading ? <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 20 }} /> : null
                )}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            />
        </Animated.View>
    );
});

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'transparent',
        zIndex: 1000,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12,
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        height: 48,
        borderRadius: Layout.borderRadius,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    input: {
        flex: 1,
        marginLeft: 10,
        fontSize: Platform.OS === 'android' ? 13 : 15,
        fontWeight: '500',
    },
    cancelButton: {
        paddingHorizontal: 4,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 40,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        opacity: 0.5,
        marginTop: 20,
        marginBottom: 10,
        textTransform: 'uppercase',
        letterSpacing: 1.2,
    },
    resultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    textContainer: {
        flex: 1,
    },
    resultLabel: {
        fontSize: 16,
        fontWeight: '600',
    },
    resultSubtitle: {
        fontSize: 12,
        opacity: 0.5,
        marginTop: 2,
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 60,
        gap: 12,
    },
    emptyText: {
        fontSize: 14,
        opacity: 0.5,
    }
});
