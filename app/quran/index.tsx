import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, RefreshControl, ActivityIndicator, ImageBackground } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { listSurahs, SurahListItem } from '@/apis/quran';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { Layout } from '@/constants/layout';

// Import memoized components
import { SurahCard } from '@/components/quran/SurahCard';
import { QuranHeader } from '@/components/quran/QuranHeader';

const FAV_STORAGE_KEY = 'quran_favourites';
type TabType = 'all' | 'favourites';

export default function QuranListScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();
    const colors = Colors[theme];

    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<TabType>('all');
    const [favourites, setFavourites] = useState<Set<number>>(new Set());

    const saveFavourites = useCallback(async (next: Set<number>) => {
        try {
            await AsyncStorage.setItem(FAV_STORAGE_KEY, JSON.stringify([...next]));
        } catch { }
    }, []);

    // Load persisted favourites or set defaults
    useEffect(() => {
        AsyncStorage.getItem(FAV_STORAGE_KEY).then((raw) => {
            if (raw) {
                setFavourites(new Set(JSON.parse(raw)));
            } else {
                const defaultFavs = new Set([36, 55, 67]);
                setFavourites(defaultFavs);
                saveFavourites(defaultFavs);
            }
        }).catch(() => { });
    }, [saveFavourites]);

    const toggleFavourite = useCallback((number: number) => {
        setFavourites((prev) => {
            const next = new Set(prev);
            next.has(number) ? next.delete(number) : next.add(number);
            saveFavourites(next);
            return next;
        });
    }, [saveFavourites]);

    const { data: response, isLoading, isError, refetch, isRefetching } = useQuery({
        queryKey: ['quran-surahs'],
        queryFn: listSurahs,
    });

    const surahs = response?.data || [];

    const filteredSurahs = useMemo(() => {
        let list = surahs;

        if (activeTab === 'favourites') {
            list = list.filter((s) => favourites.has(s.number));
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase().trim();
            list = list.filter(
                (surah) =>
                    surah.englishName.toLowerCase().includes(query) ||
                    surah.englishNameTranslation.toLowerCase().includes(query) ||
                    surah.name.includes(query) ||
                    surah.number.toString() === query
            );
        }

        return list;
    }, [searchQuery, surahs, activeTab, favourites]);

    const renderSurahCard = useCallback(({ item }: { item: SurahListItem }) => {
        const isFav = favourites.has(item.number);
        return (
            <SurahCard
                item={item}
                isFav={isFav}
                primaryColor={colors.primary}
                textSecondaryColor={colors.textSecondary}
                cardColor={colors.card}
                textColor={colors.text}
                onPress={() => router.push(`/quran/${item.number}` as any)}
                onFavToggle={() => toggleFavourite(item.number)}
            />
        );
    }, [favourites, colors, router, toggleFavourite]);

    const handleBack = useCallback(() => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/(drawer)/(tabs)' as any);
        }
    }, [router]);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Custom Header using QuranHeader */}
            <QuranHeader
                title="The Holy Quran"
                subtitle="Read & listen to the verses"
                paddingTop={insets.top + 16}
                borderColor={colors.border}
                cardColor={colors.card}
                textColor={colors.text}
                textSecondaryColor={colors.textSecondary}
                onBack={handleBack}
                rightSlot={
                    // Render additional tab items right inside/below or we can put the tabs row here
                    null
                }
            />

            <View style={styles.headerAddon}>
                {/* Search Bar */}
                <View style={[styles.searchBarContainer, { backgroundColor: colors.card }]}>
                    <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
                    <TextInput
                        placeholder="Search Surah by name..."
                        placeholderTextColor={colors.textSecondary + '77'}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        style={[styles.searchInput, { color: colors.text }]}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Segmented Tabs Control */}
                <View style={[styles.segmentedContainer, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
                    {(['all', 'favourites'] as TabType[]).map((tab) => {
                        const isActive = activeTab === tab;
                        return (
                            <TouchableOpacity
                                key={tab}
                                onPress={() => setActiveTab(tab)}
                                style={[
                                    styles.segmentedTab,
                                    isActive && { backgroundColor: colors.primary }
                                ]}
                            >
                                {tab === 'favourites' && (
                                    <Ionicons
                                        name="heart"
                                        size={14}
                                        color={isActive ? '#ffffff' : colors.textSecondary}
                                        style={{ marginRight: 6 }}
                                    />
                                )}
                                <ThemedText style={[
                                    styles.segmentedTabText,
                                    { color: isActive ? '#ffffff' : colors.textSecondary },
                                    isActive && { fontWeight: '700' }
                                ]}>
                                    {tab === 'all' ? 'All Surahs' : 'Favourites'}
                                </ThemedText>
                                {tab === 'favourites' && favourites.size > 0 && (
                                    <View style={[
                                        styles.favBadge,
                                        { backgroundColor: isActive ? '#ffffff' : '#FF5A5F' }
                                    ]}>
                                        <ThemedText style={[
                                            styles.favBadgeText,
                                            { color: isActive ? colors.primary : '#ffffff' }
                                        ]}>
                                            {favourites.size}
                                        </ThemedText>
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            {/* Content List */}
            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <ThemedText style={styles.loadingText}>Loading Surahs...</ThemedText>
                </View>
            ) : isError ? (
                <View style={styles.errorContainer}>
                    <Ionicons name="warning-outline" size={48} color="#FF5A5F" />
                    <ThemedText style={styles.errorText}>Unable to load Surah list</ThemedText>
                    <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.primary }]} onPress={() => refetch()}>
                        <ThemedText style={{ color: '#fff', fontWeight: 'bold' }}>Retry</ThemedText>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={{ flex: 1 }}>
                    <FlashList
                        data={filteredSurahs}
                        keyExtractor={(item) => item.number.toString()}
                        renderItem={renderSurahCard}
                        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 32 }]}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl
                                refreshing={isRefetching}
                                onRefresh={refetch}
                                colors={[colors.primary]}
                                tintColor={colors.primary}
                            />
                        }
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Ionicons
                                    name={activeTab === 'favourites' ? 'heart-outline' : 'search-outline'}
                                    size={48}
                                    color={colors.textSecondary}
                                />
                                <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
                                    {activeTab === 'favourites'
                                        ? 'No favourites yet.\nTap ♥ on a Surah to save it here.'
                                        : `No Surahs match "${searchQuery}"`}
                                </ThemedText>
                            </View>
                        }
                    />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    backgroundImage: { flex: 1 },
    headerAddon: {
        paddingHorizontal: 20,
        paddingBottom: 0,
    },
    searchBarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: Layout.borderRadius,
        paddingHorizontal: 12,
        height: 42,
        marginTop: 16,
        marginBottom: 12,
    },
    searchIcon: { marginRight: 8 },
    searchInput: { flex: 1, fontSize: 14, paddingVertical: 8 },
    // Segmented Control
    segmentedContainer: {
        flexDirection: 'row',
        borderRadius: 12,
        padding: 4,
        marginBottom: 16,
    },
    segmentedTab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 10,
    },
    segmentedTabText: {
        fontSize: 13,
        fontWeight: '500',
    },
    favBadge: {
        marginLeft: 5,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    favBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#fff',
        lineHeight: 18,
        textAlignVertical: 'center',
        includeFontPadding: false,
    },
    // List
    listContent: {
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    // States
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 12, fontSize: 14 },
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
    errorText: { marginTop: 12, fontSize: 15, textAlign: 'center' },
    retryButton: { marginTop: 16, paddingVertical: 10, paddingHorizontal: 24, borderRadius: 20 },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
    emptyText: { marginTop: 12, fontSize: 14, textAlign: 'center', lineHeight: 22 },
});
