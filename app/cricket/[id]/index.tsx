import React, { useState, useCallback } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    FlatList,
    RefreshControl
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ScreenHeader } from '@/components/common/ScreenHeader';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { ThemedText } from '@/components/ThemedText';
import { PrizePoolCard } from '@/components/cricket/PrizePoolCard';
import { OrganizerCard } from '@/components/cricket/OrganizerCard';
import { GuestCard } from '@/components/cricket/GuestCard';
import { PointsTableCard } from '@/components/cricket/PointsTableCard';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useCricketAPI } from '@/hooks/useCricketAPI';
import { CricketMatch, Team, canUserManageTournament } from '@/types/cricket';

type TabType = 'overview' | 'fixtures' | 'teams' | 'standings';

export default function TournamentHubScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { theme } = useTheme();
    const colors = Colors[theme];
    const router = useRouter();
    const { user } = useAuth();

    const [activeTab, setActiveTab] = useState<TabType>('overview');

    const { useTournamentDetailsQuery } = useCricketAPI();
    const { data, isLoading, isError, refetch, isRefetching } = useTournamentDetailsQuery(id || '');

    const tournament = data?.data;
    const matches: CricketMatch[] = data?.matches || [];

    const createdById = typeof tournament?.createdBy === 'object' ? tournament?.createdBy?._id : tournament?.createdBy;
    const canManage = canUserManageTournament(user, id, createdById, tournament?.admins);

    const handleOpenMatch = useCallback((matchId: string) => {
        router.push(`/cricket/match/${matchId}` as any);
    }, [router]);

    const renderMatchItem = useCallback(({ item }: { item: CricketMatch }) => (
        <TouchableOpacity
            style={[styles.matchCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
            onPress={() => handleOpenMatch(item._id)}
            activeOpacity={0.8}
        >
            <View style={styles.matchHeader}>
                <ThemedText style={[styles.stageText, { color: colors.primary }]}>{item.matchTitle}</ThemedText>
                <View style={[styles.statusBadge, { backgroundColor: item.status === 'LIVE' ? colors.danger : colors.surface }]}>
                    <ThemedText style={[styles.statusText, { color: item.status === 'LIVE' ? '#FFF' : colors.textSecondary }]}>
                        {item.status}
                    </ThemedText>
                </View>
            </View>

            <View style={styles.teamsRow}>
                <ThemedText style={[styles.teamName, { color: colors.text }]}>{item.teamA.name}</ThemedText>
                <ThemedText style={[styles.vsText, { color: colors.secondary }]}>VS</ThemedText>
                <ThemedText style={[styles.teamName, { color: colors.text }]}>{item.teamB.name}</ThemedText>
            </View>

            {item.result ? (
                <ThemedText style={[styles.resultText, { color: colors.success }]} numberOfLines={1}>
                    {item.result}
                </ThemedText>
            ) : (
                <ThemedText style={[styles.venueText, { color: colors.textSecondary }]}>
                    {item.venue} • Max {item.maxOvers} Overs
                </ThemedText>
            )}
        </TouchableOpacity>
    ), [colors, handleOpenMatch]);

    if (isLoading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <ScreenHeader hero={{ title: "Tournament Hub" }} showMenuIcon={false} />
                <View style={styles.centerContainer}>
                    <ThemedText style={{ color: colors.textSecondary }}>Loading tournament...</ThemedText>
                </View>
            </View>
        );
    }

    if (isError || !tournament) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <ScreenHeader hero={{ title: "Tournament Hub" }} showMenuIcon={false} />
                <View style={styles.centerContainer}>
                    <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
                    <ThemedText style={{ color: colors.text, fontWeight: '700', marginTop: 8 }}>
                        Tournament Not Found
                    </ThemedText>
                </View>
            </View>
        );
    }

    return (
        <ErrorBoundary>
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <ScreenHeader hero={{ title: tournament.name }} showMenuIcon={false} />

                {/* Segmented Tabs */}
                <View style={[styles.tabBar, { backgroundColor: colors.surface }]}>
                    {(['overview', 'fixtures', 'teams', 'standings'] as TabType[]).map((tab) => {
                        const isActive = activeTab === tab;
                        return (
                            <TouchableOpacity
                                key={tab}
                                style={[styles.tabItem, isActive && { backgroundColor: colors.primary }]}
                                onPress={() => setActiveTab(tab)}
                            >
                                <ThemedText style={[styles.tabText, { color: isActive ? '#FFFFFF' : colors.textSecondary }]}>
                                    {tab.toUpperCase()}
                                </ThemedText>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Tab Views */}
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[colors.primary]} tintColor={colors.primary} />}
                >
                    {activeTab === 'overview' && (
                        <Animated.View entering={FadeInDown.duration(300)} style={styles.tabContent}>
                            {/* Banner Hero */}
                            <View style={styles.heroBanner}>
                                {tournament.bannerImage ? (
                                    <Image source={{ uri: tournament.bannerImage }} style={styles.bannerImg} />
                                ) : (
                                    <View style={[styles.defaultHero, { backgroundColor: `${colors.primary}20` }]}>
                                        <Ionicons name="trophy-outline" size={50} color={colors.primary} />
                                    </View>
                                )}
                                <View style={styles.heroInfo}>
                                    <ThemedText style={styles.heroTitle}>{tournament.name}</ThemedText>
                                    <ThemedText style={styles.heroSub}>{tournament.venue}, {tournament.city}</ThemedText>
                                </View>
                            </View>

                            {/* Prizes Card */}
                            {tournament.prizes && <PrizePoolCard prizes={tournament.prizes} />}

                            {/* Organizers Section */}
                            {tournament.organizers && tournament.organizers.length > 0 && (
                                <View style={styles.section}>
                                    <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Organizers</ThemedText>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                        {tournament.organizers.map((org, idx) => (
                                            <OrganizerCard key={idx} organizer={org} />
                                        ))}
                                    </ScrollView>
                                </View>
                            )}

                            {/* Chief Guests Section */}
                            {tournament.guests && tournament.guests.length > 0 && (
                                <View style={styles.section}>
                                    <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Chief Guests</ThemedText>
                                    {tournament.guests.map((g, idx) => (
                                        <GuestCard key={idx} guest={g} />
                                    ))}
                                </View>
                            )}
                        </Animated.View>
                    )}

                    {activeTab === 'fixtures' && (
                        <Animated.View entering={FadeInDown.duration(300)} style={styles.tabContent}>
                            {canManage && (
                                <TouchableOpacity
                                    style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                                    onPress={() => router.push(`/cricket/${id}/schedule-match` as any)}
                                >
                                    <Ionicons name="add-circle-outline" size={18} color="#FFF" />
                                    <ThemedText style={styles.actionBtnText}>+ Schedule Match</ThemedText>
                                </TouchableOpacity>
                            )}

                            {matches.length > 0 ? (
                                <FlatList
                                    data={matches}
                                    keyExtractor={(item) => item._id}
                                    renderItem={renderMatchItem}
                                    scrollEnabled={false}
                                />
                            ) : (
                                <View style={styles.emptyBox}>
                                    <ThemedText style={{ color: colors.textSecondary }}>No matches scheduled yet.</ThemedText>
                                </View>
                            )}
                        </Animated.View>
                    )}

                    {activeTab === 'teams' && (
                        <Animated.View entering={FadeInDown.duration(300)} style={styles.tabContent}>
                            {canManage && (
                                <TouchableOpacity
                                    style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                                    onPress={() => router.push(`/cricket/${id}/add-team` as any)}
                                >
                                    <Ionicons name="add-circle-outline" size={18} color="#FFF" />
                                    <ThemedText style={styles.actionBtnText}>+ Register Team</ThemedText>
                                </TouchableOpacity>
                            )}

                            {tournament.teams && tournament.teams.length > 0 ? (
                                tournament.teams.map((t: Team, idx: number) => (
                                    <View key={t._id || idx} style={[styles.teamTile, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                                        <View style={[styles.logoCircle, { backgroundColor: `${colors.primary}20` }]}>
                                            <ThemedText style={[styles.logoText, { color: colors.primary }]}>{t.shortName}</ThemedText>
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <ThemedText style={[styles.teamTileName, { color: colors.text }]}>{t.name}</ThemedText>
                                            <ThemedText style={[styles.teamTileSub, { color: colors.textSecondary }]}>
                                                Captain: {t.captainName || 'N/A'} • {t.players?.length || 0} Players
                                            </ThemedText>
                                        </View>
                                    </View>
                                ))
                            ) : (
                                <View style={styles.emptyBox}>
                                    <ThemedText style={{ color: colors.textSecondary }}>No teams registered yet.</ThemedText>
                                </View>
                            )}
                        </Animated.View>
                    )}

                    {activeTab === 'standings' && (
                        <Animated.View entering={FadeInDown.duration(300)} style={styles.tabContent}>
                            <PointsTableCard teams={tournament.teams || []} />
                        </Animated.View>
                    )}
                </ScrollView>
            </View>
        </ErrorBoundary>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    tabBar: { flexDirection: 'row', padding: 4, gap: 3 },
    tabItem: { flex: 1, paddingVertical: 6, borderRadius: Layout.borderRadius - 6, alignItems: 'center' },
    tabText: { fontSize: 10, fontWeight: '800' },
    scrollContent: { padding: 10, paddingBottom: 40 },
    tabContent: { gap: 10 },
    heroBanner: { height: 120, borderRadius: Layout.borderRadius, overflow: 'hidden', position: 'relative', marginBottom: 4 },
    bannerImg: { width: '100%', height: '100%' },
    defaultHero: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
    heroInfo: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.6)', padding: 8 },
    heroTitle: { color: '#FFF', fontSize: 15, fontWeight: '800' },
    heroSub: { color: 'rgba(255,255,255,0.8)', fontSize: 11 },
    section: { gap: 6 },
    sectionTitle: { fontSize: 13, fontWeight: '700' },
    actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: Layout.borderRadius - 4, gap: 6, marginBottom: 6 },
    actionBtnText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
    matchCard: { padding: 10, borderRadius: Layout.borderRadius - 4, marginBottom: 8, gap: 6 },
    matchHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    stageText: { fontSize: 11, fontWeight: '700' },
    statusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    statusText: { fontSize: 9, fontWeight: '700' },
    teamsRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    teamName: { fontSize: 13, fontWeight: '600', flex: 1 },
    vsText: { fontSize: 11, fontWeight: '700' },
    resultText: { fontSize: 11, fontWeight: '600' },
    venueText: { fontSize: 10.5 },
    teamTile: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: Layout.borderRadius - 4, marginBottom: 6, gap: 8 },
    logoCircle: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
    logoText: { fontSize: 12, fontWeight: '700' },
    teamTileName: { fontSize: 13, fontWeight: '600' },
    teamTileSub: { fontSize: 11 },
    emptyBox: { padding: 20, alignItems: 'center' }
});
