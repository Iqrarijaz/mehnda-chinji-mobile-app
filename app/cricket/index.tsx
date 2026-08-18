import React, { useState, useCallback, useMemo } from 'react';
import {
    View,
    StyleSheet,
    FlatList,
    RefreshControl,
    TouchableOpacity,
    ScrollView,
    Modal,
    Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DrawerActions } from '@react-navigation/native';
import { useNavigation } from 'expo-router';

import { SearchBar } from '@/components/common/SearchBar';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { ThemedText } from '@/components/ThemedText';
import { TournamentCard } from '@/components/cricket/TournamentCard';
import { CricketMatchCard } from '@/components/cricket/CricketMatchCard';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useCricketAPI } from '@/hooks/useCricketAPI';
import { Tournament, CricketMatch, canUserManageTournament } from '@/types/cricket';

interface QuickActionCircle {
    id: string;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    badge?: string;
    onPress: () => void;
}

export default function CricketFeedScreen() {
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];
    const router = useRouter();
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const { user } = useAuth();

    // Check if user has administrative rights for cricket
    const isCricketAdmin = !!user?.user?.isCricketAdmin;

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
    const [actionModalTournament, setActionModalTournament] = useState<Tournament | null>(null);

    const { useTournamentsFeedQuery } = useCricketAPI();
    const { data, isLoading, isError, refetch, isRefetching } = useTournamentsFeedQuery({});

    const tournamentsList: Tournament[] = data?.data || [];

    // Extract all matches across tournaments for the match carousel
    const allMatches = useMemo(() => {
        const matches: CricketMatch[] = [];
        tournamentsList.forEach((t: any) => {
            if (Array.isArray(t.matches)) {
                matches.push(...t.matches);
            }
        });
        return matches;
    }, [tournamentsList]);

    // Filter tournaments based on search query and status pill
    const filteredTournaments = useMemo(() => {
        let list = tournamentsList;

        if (selectedFilter !== 'ALL') {
            list = list.filter(t => t.status === selectedFilter);
        }

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            list = list.filter(t =>
                t.name.toLowerCase().includes(query) ||
                t.city.toLowerCase().includes(query) ||
                t.venue.toLowerCase().includes(query)
            );
        }

        return list;
    }, [tournamentsList, selectedFilter, searchQuery]);

    const handleOpenDrawer = useCallback(() => {
        let currentNav: any = navigation;
        let drawerNav: any = null;

        while (currentNav) {
            try {
                const state = currentNav.getState?.();
                if (state?.type === 'drawer' || typeof currentNav.openDrawer === 'function') {
                    drawerNav = currentNav;
                    break;
                }
            } catch (e) {
                // Ignore state inspection errors
            }
            currentNav = currentNav.getParent ? currentNav.getParent() : null;
        }

        if (drawerNav) {
            try {
                if (typeof drawerNav.openDrawer === 'function') {
                    drawerNav.openDrawer();
                } else {
                    drawerNav.dispatch(DrawerActions.openDrawer());
                }
            } catch (err) {
                router.push('/(drawer)/(tabs)' as any);
            }
        } else {
            if (router.canGoBack()) {
                router.back();
            } else {
                router.replace('/(drawer)/(tabs)' as any);
            }
        }
    }, [navigation, router]);

    const handleSelectTournament = useCallback((id: string) => {
        router.push(`/cricket/${id}` as any);
    }, [router]);

    const handleSelectMatch = useCallback((matchId: string) => {
        router.push(`/cricket/match/${matchId}` as any);
    }, [router]);

    const handleOpenActionMenu = useCallback((tournament: Tournament) => {
        setActionModalTournament(tournament);
    }, []);

    // Quick Action Highlight Circles mapped directly to filter states
    const quickCircles = useMemo(() => [
        {
            id: 'ALL',
            label: 'Tournaments',
            icon: 'trophy-outline' as keyof typeof Ionicons.glyphMap,
            filterKey: 'ALL'
        },
        {
            id: 'LIVE',
            label: 'Live Matches',
            icon: 'flame-outline' as keyof typeof Ionicons.glyphMap,
            filterKey: 'LIVE'
        },
        {
            id: 'UPCOMING',
            label: 'Upcoming',
            icon: 'calendar-outline' as keyof typeof Ionicons.glyphMap,
            filterKey: 'UPCOMING'
        },
        {
            id: 'COMPLETED',
            label: 'Results',
            icon: 'checkmark-done-circle-outline' as keyof typeof Ionicons.glyphMap,
            filterKey: 'COMPLETED'
        }
    ], []);

    const renderTournamentCard = useCallback(({ item }: { item: Tournament }) => {
        const createdById = typeof item.createdBy === 'object' ? item.createdBy?._id : item.createdBy;
        const canManage = canUserManageTournament(user, item._id, createdById, item.admins);

        return (
            <TournamentCard
                tournament={item}
                onPress={() => handleSelectTournament(item._id)}
                onEdit={canManage ? () => handleOpenActionMenu(item) : undefined}
            />
        );
    }, [user, handleSelectTournament, handleOpenActionMenu]);

    const ListHeader = useMemo(() => (
        <View style={styles.headerFeedContainer}>
            {/* Match Cards Carousel (Horizontal) */}
            {allMatches.length > 0 ? (
                <View style={styles.carouselSection}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.carouselContainer}
                    >
                        {allMatches.map((match) => (
                            <CricketMatchCard
                                key={match._id}
                                match={match}
                                onPress={() => handleSelectMatch(match._id)}
                            />
                        ))}
                    </ScrollView>
                </View>
            ) : null}

            {/* Quick Action Highlight Circles */}
            <View style={styles.circlesSection}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.circlesContainer}
                >
                    {quickCircles.map((circle) => {
                        const isActive = selectedFilter === circle.filterKey;
                        return (
                            <TouchableOpacity
                                key={circle.id}
                                style={styles.circleItem}
                                onPress={() => setSelectedFilter(circle.filterKey)}
                                activeOpacity={0.8}
                            >
                                <View style={[styles.circleRing, { borderColor: isActive ? colors.primary : `${colors.primary}40` }]}>
                                    <View style={[styles.circleInner, { backgroundColor: isActive ? colors.primary : `${colors.primary}1A` }]}>
                                        <Ionicons name={circle.icon} size={22} color={isActive ? '#FFFFFF' : colors.primary} />
                                    </View>
                                </View>
                                <ThemedText
                                    style={[
                                        styles.circleLabel,
                                        { color: isActive ? colors.primary : colors.text },
                                        isActive && { fontWeight: '700' }
                                    ]}
                                    numberOfLines={1}
                                >
                                    {circle.label}
                                </ThemedText>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {/* Search Input Bar with Card Background */}
            <View style={styles.searchSection}>
                <SearchBar
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Search tournaments by name, city..."
                    style={{
                        backgroundColor: colors.cardBg,
                        borderWidth: 1,
                        borderColor: colors.border,
                        borderRadius: Layout.borderRadius
                    }}
                />
            </View>

            {/* Section Header */}
            <View style={styles.sectionHeaderRow}>
                <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                    Featured Tournaments
                </ThemedText>
                <ThemedText style={[styles.sectionCount, { color: colors.textSecondary }]}>
                    {filteredTournaments.length} available
                </ThemedText>
            </View>
        </View>
    ), [
        colors,
        selectedFilter,
        allMatches,
        tournamentsList.length,
        quickCircles,
        searchQuery,
        filteredTournaments.length,
        handleSelectMatch
    ]);

    return (
        <ErrorBoundary>
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                {/* Standard Compact Header Bar */}
                <View
                    style={[
                        styles.compactHeader,
                        {
                            backgroundColor: colors.primary,
                            paddingTop: insets.top + (Platform.OS === 'android' ? 8 : 12)
                        }
                    ]}
                >
                    <View style={styles.topBarContent}>
                        {/* Action Menu Icon */}
                        <TouchableOpacity
                            style={styles.headerIconBtn}
                            onPress={handleOpenDrawer}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name="menu-outline" size={24} color="#FFFFFF" />
                        </TouchableOpacity>

                        {/* Clean Standard Title */}
                        <ThemedText style={styles.headerTitle}>Cricket Hub</ThemedText>

                        {/* Right Actions */}
                        <View style={styles.headerRightActions}>
                            <TouchableOpacity
                                style={styles.headerIconBtn}
                                onPress={() => router.push('/notifications' as any)}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Ionicons name="notifications-outline" size={22} color="#FFFFFF" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.headerIconBtn}
                                onPress={() => router.push('/settings' as any)}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Ionicons name="settings-outline" size={22} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Main Cricket Feed */}
                <FlatList
                    data={filteredTournaments}
                    keyExtractor={(item) => item._id}
                    renderItem={renderTournamentCard}
                    ListHeaderComponent={ListHeader}
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
                                <Ionicons name="trophy-outline" size={44} color={colors.icon} />
                                <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>
                                    No Tournaments Found
                                </ThemedText>
                                <ThemedText style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                                    {searchQuery
                                        ? `No tournaments match "${searchQuery}".`
                                        : 'Check back soon for upcoming cricket tournaments!'}
                                </ThemedText>
                            </View>
                        ) : null
                    }
                />

                {/* Admin Floating Action Button */}
                {isCricketAdmin && (
                    <TouchableOpacity
                        style={[styles.fab, { backgroundColor: colors.primary }]}
                        onPress={() => router.push('/cricket/create-tournament' as any)}
                        activeOpacity={0.8}
                        accessibilityLabel="Create Tournament"
                    >
                        <Ionicons name="add" size={26} color="#FFFFFF" />
                    </TouchableOpacity>
                )}

                {/* Admin Action Menu Modal */}
                <Modal
                    visible={!!actionModalTournament}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setActionModalTournament(null)}
                >
                    <TouchableOpacity
                        style={styles.modalOverlay}
                        activeOpacity={1}
                        onPress={() => setActionModalTournament(null)}
                    >
                        <View style={[styles.actionCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                            <View style={styles.actionCardHeader}>
                                <ThemedText style={[styles.actionModalTitle, { color: colors.text }]} numberOfLines={1}>
                                    {actionModalTournament?.name}
                                </ThemedText>
                                <TouchableOpacity onPress={() => setActionModalTournament(null)}>
                                    <Ionicons name="close" size={20} color={colors.textSecondary} />
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                                style={styles.actionRowBtn}
                                onPress={() => {
                                    const tourneyId = actionModalTournament?._id;
                                    setActionModalTournament(null);
                                    if (tourneyId) router.push(`/cricket/${tourneyId}` as any);
                                }}
                            >
                                <Ionicons name="create-outline" size={18} color={colors.primary} />
                                <ThemedText style={[styles.actionRowText, { color: colors.text }]}>
                                    Manage & Edit Details
                                </ThemedText>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.actionRowBtn}
                                onPress={() => {
                                    const tourneyId = actionModalTournament?._id;
                                    setActionModalTournament(null);
                                    if (tourneyId) router.push(`/cricket/${tourneyId}/schedule-match` as any);
                                }}
                            >
                                <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                                <ThemedText style={[styles.actionRowText, { color: colors.text }]}>
                                    Schedule Match
                                </ThemedText>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.actionRowBtn}
                                onPress={() => {
                                    const tourneyId = actionModalTournament?._id;
                                    setActionModalTournament(null);
                                    if (tourneyId) router.push(`/cricket/${tourneyId}/add-team` as any);
                                }}
                            >
                                <Ionicons name="people-outline" size={18} color={colors.primary} />
                                <ThemedText style={[styles.actionRowText, { color: colors.text }]}>
                                    Register Team
                                </ThemedText>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </Modal>
            </View>
        </ErrorBoundary>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    compactHeader: {
        paddingHorizontal: 12,
        paddingBottom: 8
    },
    topBarContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 38
    },
    headerIconBtn: {
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center'
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 0.2
    },
    headerRightActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4
    },
    headerFeedContainer: {
        paddingTop: 8
    },
    carouselSection: {
        marginBottom: 10
    },
    carouselContainer: {
        paddingHorizontal: 10
    },
    circlesSection: {
        marginBottom: 10
    },
    circlesContainer: {
        paddingHorizontal: 10,
        gap: 12
    },
    circleItem: {
        alignItems: 'center',
        width: 64
    },
    circleRing: {
        width: 54,
        height: 54,
        borderRadius: 27,
        borderWidth: 2,
        padding: 2,
        justifyContent: 'center',
        alignItems: 'center'
    },
    circleInner: {
        width: '100%',
        height: '100%',
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center'
    },
    circleLabel: {
        fontSize: 10,
        fontWeight: '600',
        marginTop: 4,
        textAlign: 'center'
    },
    searchSection: {
        paddingHorizontal: 10,
        marginBottom: 8
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
        marginBottom: 8
    },
    sectionTitle: {
        fontSize: 15.5,
        fontWeight: '800'
    },
    sectionCount: {
        fontSize: 11,
        fontWeight: '500'
    },
    listContent: {
        paddingHorizontal: 10,
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
        alignItems: 'center',
        justifyContent: 'center',
        height: Platform.OS === 'android' ? 48 : 52,
        width: Platform.OS === 'android' ? 48 : 52,
        borderRadius: (Platform.OS === 'android' ? 48 : 52) / 2
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    actionCard: {
        width: '100%',
        borderRadius: Layout.borderRadius,
        borderWidth: 1,
        padding: 16,
        gap: 12
    },
    actionCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: 8,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(150,150,150,0.3)'
    },
    actionModalTitle: {
        fontSize: 15,
        fontWeight: '800',
        flex: 1,
        marginRight: 8
    },
    actionRowBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 8
    },
    actionRowText: {
        fontSize: 13,
        fontWeight: '600'
    }
});
