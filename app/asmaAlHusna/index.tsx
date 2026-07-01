import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { StyleSheet, View, FlatList, TextInput, TouchableOpacity, RefreshControl, ActivityIndicator, Image } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getAsmaAlHusna, AsmaAlHusnaItem } from '@/apis/quran';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { analyticsService, AnalyticsEvents } from '@/analytics';

const ACCENT = '#059669'; // Emerald green

const NameCard = React.memo(({
    item,
    primaryColor,
    cardColor,
    textColor,
    textSecondaryColor
}: {
    item: AsmaAlHusnaItem;
    primaryColor: string;
    cardColor: string;
    textColor: string;
    textSecondaryColor: string;
}) => (
    <View style={[styles.card, { backgroundColor: cardColor }]}>
        <View style={styles.cardHeader}>
            <View style={[styles.badge, { backgroundColor: primaryColor + '15' }]}>
                <ThemedText style={[styles.badgeText, { color: primaryColor }]}>
                    #{item.number}
                </ThemedText>
            </View>
        </View>
        <ThemedText style={[styles.arabicText, { color: primaryColor }]}>
            {item.name}
        </ThemedText>
        <ThemedText style={[styles.transliteration, { color: textColor }]}>
            {item.transliteration}
        </ThemedText>
        <ThemedText style={[styles.meaning, { color: textSecondaryColor }]}>
            {item.en.meaning}
        </ThemedText>
    </View>
));

NameCard.displayName = 'NameCard';

export default function AsmaAlHusnaScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();
    const colors = Colors[theme];

    const [searchQuery, setSearchQuery] = useState('');

    const { data: response, isLoading, isError, refetch, isRefetching } = useQuery({
        queryKey: ['asma-al-husna'],
        queryFn: getAsmaAlHusna,
        staleTime: 1000 * 60 * 60 * 24, // 24 hours
    });

    useEffect(() => {
        analyticsService.trackEvent(AnalyticsEvents.ASMA_AL_HUSNA_VIEWED);
    }, []);

    const filteredNames = useMemo(() => {
        const list = response?.data || [];
        if (!searchQuery) return list;

        const query = searchQuery.toLowerCase().trim();
        return list.filter(
            (item) =>
                item.transliteration.toLowerCase().includes(query) ||
                item.en.meaning.toLowerCase().includes(query) ||
                item.name.includes(query) ||
                item.number.toString() === query
        );
    }, [searchQuery, response]);

    const renderCard = useCallback(({ item }: { item: AsmaAlHusnaItem }) => (
        <NameCard
            item={item}
            primaryColor={ACCENT}
            cardColor={colors.card}
            textColor={colors.text}
            textSecondaryColor={colors.textSecondary}
        />
    ), [colors]);

    const handleBack = useCallback(() => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/');
        }
    }, [router]);

    return (
        <View style={[styles.root, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 12, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={handleBack} style={[styles.iconBtn, { backgroundColor: colors.card }]}>
                    <Ionicons name="arrow-back" size={22} color={colors.text} />
                </TouchableOpacity>
                <Image
                    source={require('@/assets/icons/allah_name.webp')}
                    style={{ width: 26, height: 26, marginLeft: 10 }}
                    resizeMode="contain"
                />
                <View style={{ flex: 1, marginLeft: 10 }}>
                    <ThemedText style={styles.screenTitle}>99 Names</ThemedText>
                    <ThemedText style={[styles.screenSub, { color: colors.textSecondary }]}>Asma-ul-Husna</ThemedText>
                </View>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
                    <TextInput
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholder="Search name, meaning or number..."
                        placeholderTextColor={colors.textSecondary}
                        style={[styles.searchInput, { color: colors.text }]}
                        clearButtonMode="while-editing"
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Content States */}
            {isLoading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={ACCENT} />
                </View>
            ) : isError ? (
                <View style={styles.centered}>
                    <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
                    <ThemedText style={{ marginTop: 12, fontSize: 16, fontWeight: '600' }}>Failed to load names</ThemedText>
                    <ThemedText style={{ marginTop: 4, fontSize: 13, color: colors.textSecondary, textAlign: 'center' }}>
                        Please check your connection and try again.
                    </ThemedText>
                    <TouchableOpacity onPress={() => refetch()} style={[styles.retryBtn, { backgroundColor: ACCENT }]}>
                        <ThemedText style={styles.retryText}>Retry</ThemedText>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={filteredNames}
                    keyExtractor={(item) => item.number.toString()}
                    renderItem={renderCard}
                    numColumns={2}
                    columnWrapperStyle={styles.columnWrapper}
                    contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 20 }]}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefetching}
                            onRefresh={refetch}
                            colors={[ACCENT]}
                            tintColor={ACCENT}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.centered}>
                            <Ionicons name="search-outline" size={40} color={colors.textSecondary} />
                            <ThemedText style={{ marginTop: 10, color: colors.textSecondary }}>No names match your search.</ThemedText>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    iconBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        justifyContent: 'center',
        alignItems: 'center',
    },
    screenTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    screenSub: {
        fontSize: 11,
        marginTop: 1,
    },
    searchContainer: {
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 42,
        borderRadius: 12,
        paddingHorizontal: 12,
        borderWidth: 1,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 14,
    },
    columnWrapper: {
        flexDirection: 'row-reverse',
    },
    list: {
        paddingHorizontal: 10,
        paddingTop: 8,
    },
    card: {
        flex: 1,
        margin: 6,
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 12,
        alignItems: 'center',
    },
    cardHeader: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginBottom: 2,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '700',
    },
    arabicText: {
        fontSize: 20,
        fontFamily: 'NotoNastaliqUrdu-Regular',
        textAlign: 'center',
        paddingVertical: 10,
        paddingHorizontal: 4,
        lineHeight: 52,
    },
    transliteration: {
        fontSize: 14,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 2,
    },
    meaning: {
        fontSize: 11,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    retryBtn: {
        marginTop: 14,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 10,
    },
    retryText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
});
