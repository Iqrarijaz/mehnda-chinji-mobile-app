import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Platform, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { ThemedText } from '@/components/ThemedText';
import { TournamentCard } from '@/components/cricket/TournamentCard';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useCricketAPI } from '@/hooks/useCricketAPI';
import { Tournament } from '@/types/cricket';

export default function CricketFeedScreen() {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const router = useRouter();
    const { user } = useAuth();

    // Check if user has administrative rights for cricket
    const isCricketAdmin = !!user?.user?.isCricketAdmin;

    const [searchQuery, setSearchQuery] = useState('');

    const { useTournamentsFeedQuery } = useCricketAPI();
    const { data, isLoading, isError, refetch, isRefetching } = useTournamentsFeedQuery({});

    let tournamentsList: Tournament[] = data?.data || [];

    // Filter tournaments based on search query
    if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        tournamentsList = tournamentsList.filter(t =>
            t.name.toLowerCase().includes(query) ||
            t.city.toLowerCase().includes(query) ||
            t.venue.toLowerCase().includes(query)
        );
    }

    const handleSelectTournament = useCallback((id: string) => {
        router.push(`/cricket/${id}` as any);
    }, [router]);

    const renderItem = useCallback(({ item, index }: { item: Tournament; index: number }) => (
        <Animated.View entering={FadeInDown.delay(index * 60).duration(350)}>
            <TournamentCard
                tournament={item}
                onPress={() => handleSelectTournament(item._id)}
            />
        </Animated.View>
    ), [handleSelectTournament]);

    return (
        <ErrorBoundary>
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                {/* Redesigned Header with Integrated Search */}
                <View style={[styles.header, { backgroundColor: colors.surface }]}>
                    <View style={styles.headerContent}>
                        <ThemedText style={[styles.headerTitle, { color: colors.text }]}>Tournaments</ThemedText>
                        <Ionicons name="trophy-outline" size={20} color={colors.primary} />
                    </View>

                    {/* Search Bar */}
                    <View style={[styles.searchContainer, { backgroundColor: colors.cardBg }]}>
                        <Ionicons name="search" size={18} color={colors.primary} />
                        <TextInput
                            style={[styles.searchInput, { color: colors.text }]}
                            placeholder="Search by name, city, venue..."
                            placeholderTextColor={colors.textSecondary}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            clearButtonMode="while-editing"
                        />
                        {searchQuery ? (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <Ionicons name="close-circle" size={18} color={colors.icon} />
                            </TouchableOpacity>
                        ) : null}
                    </View>
                </View>

                {/* Tournament List */}
                <FlatList
                    data={tournamentsList}
                    keyExtractor={(item) => item._id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
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
                        !isLoading ? (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="trophy-outline" size={48} color={colors.icon} />
                                <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>
                                    No Tournaments Found
                                </ThemedText>
                                <ThemedText style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                                    {searchQuery
                                        ? `No tournaments match "${searchQuery}". Try a different search.`
                                        : 'Check back soon for upcoming cricket tournaments!'}
                                </ThemedText>
                            </View>
                        ) : null
                    }
                />

                {/* Admin Floating Action Button (FAB) — Only visible if isCricketAdmin is true */}
                {isCricketAdmin && (
                    <TouchableOpacity
                        style={[styles.fab, { backgroundColor: colors.primary }]}
                        onPress={() => router.push('/cricket/create-tournament' as any)}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="add" size={24} color="#FFFFFF" />
                        <ThemedText style={styles.fabText}>Create Tournament</ThemedText>
                    </TouchableOpacity>
                )}
            </View>
        </ErrorBoundary>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    header: {
        paddingHorizontal: 14,
        paddingTop: 12,
        paddingBottom: 12,
        gap: 10
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        letterSpacing: -0.3
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 40,
        paddingHorizontal: 12,
        borderRadius: Layout.borderRadius - 2,
        gap: 8
    },
    searchInput: {
        flex: 1,
        fontSize: 13,
        padding: 0,
        height: '100%'
    },
    listContent: {
        padding: 10,
        paddingBottom: 90
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
        gap: 8
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '800'
    },
    emptySubtitle: {
        fontSize: 12,
        textAlign: 'center',
        lineHeight: 18
    },
    fab: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: Platform.OS === 'android' ? 48 : 52,
        paddingHorizontal: 16,
        borderRadius: 30,
        gap: 8
    },
    fabText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '800'
    }
});
