import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ScreenHeader } from '@/components/common/ScreenHeader';
import { SearchableDropdown } from '@/components/common/SearchableDropdown';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { ThemedText } from '@/components/ThemedText';
import { TournamentCard } from '@/components/cricket/TournamentCard';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useCricketAPI } from '@/hooks/useCricketAPI';
import citiesDataFallback from '@/data/cities.json';
import { Tournament } from '@/types/cricket';

export default function CricketFeedScreen() {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const router = useRouter();
    const { user } = useAuth();

    // Check if user has administrative rights for cricket
    const isCricketAdmin = !!user?.user?.isCricketAdmin;

    const [selectedCity, setSelectedCity] = useState('');
    const [cityPickerVisible, setCityPickerVisible] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState<string>('');

    const { useTournamentsFeedQuery } = useCricketAPI();
    const { data, isLoading, isError, refetch, isRefetching } = useTournamentsFeedQuery({
        city: selectedCity || undefined,
        status: (selectedStatus as any) || undefined
    });

    const tournamentsList: Tournament[] = data?.data || [];

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
                <ScreenHeader hero={{ title: "Cricket Tournaments" }} showMenuIcon={!router.canGoBack()} />

                {/* Filter Bar */}
                <View style={[styles.filterBar, { backgroundColor: colors.surface }]}>
                    <TouchableOpacity
                        style={[styles.cityChip, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
                        onPress={() => setCityPickerVisible(true)}
                    >
                        <Ionicons name="location-outline" size={14} color={colors.primary} />
                        <ThemedText style={[styles.filterText, { color: colors.text }]} numberOfLines={1}>
                            {selectedCity || 'All Cities'}
                        </ThemedText>
                        <Ionicons name="chevron-down" size={14} color={colors.icon} />
                    </TouchableOpacity>

                    {/* Status Pill Filters */}
                    <View style={styles.statusPills}>
                        {['', 'LIVE', 'UPCOMING', 'COMPLETED'].map((st) => {
                            const isSelected = selectedStatus === st;
                            return (
                                <TouchableOpacity
                                    key={st}
                                    style={[
                                        styles.statusPill,
                                        { backgroundColor: isSelected ? colors.primary : colors.cardBg }
                                    ]}
                                    onPress={() => setSelectedStatus(st)}
                                >
                                    <ThemedText
                                        style={[
                                            styles.pillText,
                                            { color: isSelected ? '#FFFFFF' : colors.textSecondary }
                                        ]}
                                    >
                                        {st || 'All'}
                                    </ThemedText>
                                </TouchableOpacity>
                            );
                        })}
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
                                    {selectedCity
                                        ? `No active tournaments in ${selectedCity}. Try resetting your filter.`
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

                {/* City Picker Dropdown */}
                <SearchableDropdown
                    visible={cityPickerVisible}
                    onClose={() => setCityPickerVisible(false)}
                    onSelect={(city) => {
                        setSelectedCity(city);
                        setCityPickerVisible(false);
                    }}
                    currentValue={selectedCity}
                    options={citiesDataFallback}
                    title="Select City"
                    placeholder="Search city..."
                />
            </View>
        </ErrorBoundary>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    filterBar: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        gap: 8
    },
    cityChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: Layout.borderRadius - 4,
        borderWidth: 1,
        gap: 6
    },
    filterText: {
        fontSize: 12,
        fontWeight: '600',
        flex: 1
    },
    statusPills: {
        flexDirection: 'row',
        gap: 6
    },
    statusPill: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6
    },
    pillText: {
        fontSize: 11,
        fontWeight: '700'
    },
    listContent: {
        padding: 14,
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
