import React, { useState, useCallback } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    FlatList,
    RefreshControl,
    Platform
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { ThemedText } from '@/components/ThemedText';
import { PointsTableCard } from '@/components/cricket/PointsTableCard';
import { StatusBadge } from '@/components/cricket/StatusBadge';
import { ActionMenu, ActionMenuItem } from '@/components/common/ActionMenu';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useCricketAPI } from '@/hooks/useCricketAPI';
import { CricketMatch, Team, canUserManageTournament } from '@/types/cricket';

type TabType = 'fixtures' | 'teams' | 'standings';

export default function TournamentHubScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { theme } = useTheme();
    const colors = Colors[theme];
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user } = useAuth();

    const [activeTab, setActiveTab] = useState<TabType>('fixtures');

    const { useTournamentDetailsQuery } = useCricketAPI();
    const { data, isLoading, isError, refetch, isRefetching } = useTournamentDetailsQuery(id || '');

    const tournament = data?.data;
    const matches: CricketMatch[] = data?.matches || [];

    const createdById = typeof tournament?.createdBy === 'object' ? tournament?.createdBy?._id : tournament?.createdBy;
    const canManage = canUserManageTournament(user, id, createdById, tournament?.admins);

    const handleOpenMatch = useCallback((matchId: string) => {
        router.push(`/cricket/match/${matchId}` as any);
    }, [router]);

    const buildMatchActions = useCallback((match: CricketMatch): ActionMenuItem[] => [
        {
            label: 'Score / Manage Match',
            icon: 'stats-chart-outline',
            onPress: () => router.push(`/cricket/match/${match._id}/scorer` as any)
        },
        {
            label: 'View Match Details',
            icon: 'eye-outline',
            onPress: () => handleOpenMatch(match._id)
        }
    ], [router, handleOpenMatch]);

    const renderMatchItem = useCallback(({ item }: { item: CricketMatch }) => (
        <TouchableOpacity
            style={[styles.matchCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
            onPress={() => handleOpenMatch(item._id)}
            activeOpacity={0.8}
        >
            <View style={styles.matchHeader}>
                <ThemedText style={[styles.stageText, { color: colors.primary }]} numberOfLines={1}>{item.matchTitle}</ThemedText>
                <StatusBadge status={item.status} />
                {canManage && (
                    <View style={styles.matchActionMenu}>
                        <ActionMenu
                            actions={buildMatchActions(item)}
                            triggerIcon="ellipsis-horizontal"
                            triggerIconSize={16}
                            triggerIconColor={colors.textSecondary}
                        />
                    </View>
                )}
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
    ), [colors, handleOpenMatch, canManage, buildMatchActions]);

    if (isLoading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={[styles.compactHeader, { backgroundColor: colors.primary, paddingTop: insets.top + (Platform.OS === 'android' ? 8 : 12) }]}>
                    <View style={styles.topBarContent}>
                        <TouchableOpacity style={styles.headerIconBtn} onPress={() => router.back()}>
                            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                        <ThemedText style={styles.headerTitle}>Tournament Details</ThemedText>
                        <View style={{ width: 36 }} />
                    </View>
                </View>
                <View style={styles.centerContainer}>
                    <ThemedText style={{ color: colors.textSecondary }}>Loading tournament...</ThemedText>
                </View>
            </View>
        );
    }

    if (isError || !tournament) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={[styles.compactHeader, { backgroundColor: colors.primary, paddingTop: insets.top + (Platform.OS === 'android' ? 8 : 12) }]}>
                    <View style={styles.topBarContent}>
                        <TouchableOpacity style={styles.headerIconBtn} onPress={() => router.back()}>
                            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                        <ThemedText style={styles.headerTitle}>Tournament Details</ThemedText>
                        <View style={{ width: 36 }} />
                    </View>
                </View>
                <View style={styles.centerContainer}>
                    <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
                    <ThemedText style={{ color: colors.text, fontWeight: '700', marginTop: 8 }}>
                        Tournament Not Found
                    </ThemedText>
                </View>
            </View>
        );
    }

    const tabLabels: Record<TabType, string> = {
        fixtures: 'Fixtures',
        teams: 'Teams',
        standings: 'Standings'
    };

    return (
        <ErrorBoundary>
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                {/* Straight Compact Header */}
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
                        <TouchableOpacity
                            style={styles.headerIconBtn}
                            onPress={() => router.back()}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                        </TouchableOpacity>

                        <ThemedText style={styles.headerTitle} numberOfLines={1}>
                            {tournament.name}
                        </ThemedText>

                        <View style={{ width: 36 }} />
                    </View>
                </View>

                {/* Rounded Pills Tab Bar (No Borders, Same Height) */}
                <View style={styles.tabPillsWrapper}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.tabPillsContainer}
                    >
                        {(['fixtures', 'teams', 'standings'] as TabType[]).map((tab) => {
                            const isActive = activeTab === tab;
                            return (
                                <TouchableOpacity
                                    key={tab}
                                    style={[
                                        styles.tabPill,
                                        {
                                            backgroundColor: isActive ? colors.primary : colors.cardBg
                                        }
                                    ]}
                                    onPress={() => setActiveTab(tab)}
                                    activeOpacity={0.8}
                                >
                                    <ThemedText
                                        style={[
                                            styles.tabPillText,
                                            { color: isActive ? '#FFFFFF' : colors.textSecondary }
                                        ]}
                                    >
                                        {tabLabels[tab]}
                                    </ThemedText>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* Tab Views */}
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[colors.primary]} tintColor={colors.primary} />}
                >
                    {activeTab === 'fixtures' && (
                        <View style={styles.tabContent}>
                            {canManage && (
                                <TouchableOpacity
                                    style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                                    onPress={() => router.push(`/cricket/${id}/schedule-match` as any)}
                                    activeOpacity={0.8}
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
                        </View>
                    )}

                    {activeTab === 'teams' && (
                        <View style={styles.tabContent}>
                            {canManage && (
                                <TouchableOpacity
                                    style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                                    onPress={() => router.push(`/cricket/${id}/add-team` as any)}
                                    activeOpacity={0.8}
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
                        </View>
                    )}

                    {activeTab === 'standings' && (
                        <View style={styles.tabContent}>
                            <PointsTableCard teams={tournament.teams || []} />
                        </View>
                    )}
                </ScrollView>
            </View>
        </ErrorBoundary>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    compactHeader: {
        paddingHorizontal: 12,
        paddingBottom: 10,
        borderRadius: 0
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
        letterSpacing: 0.2,
        flex: 1,
        textAlign: 'center'
    },
    tabPillsWrapper: {
        paddingTop: 10,
        paddingBottom: 6
    },
    tabPillsContainer: {
        paddingHorizontal: 10,
        gap: 8
    },
    tabPill: {
        height: 36,
        paddingHorizontal: 16,
        borderRadius: 18,
        borderWidth: 0,
        justifyContent: 'center',
        alignItems: 'center'
    },
    tabPillText: {
        fontSize: 12,
        fontWeight: '700'
    },
    scrollContent: { padding: 10, paddingBottom: 40 },
    tabContent: { gap: 10 },
    sectionTitle: { fontSize: 13, fontWeight: '700' },
    actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: Platform.OS === 'android' ? 46 : 50, borderRadius: Layout.borderRadius - 4, gap: 6, marginBottom: 6 },
    actionBtnText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
    matchCard: { padding: 10, borderRadius: Layout.borderRadius - 4, marginBottom: 8, gap: 6, borderWidth: 1 },
    matchHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
    matchActionMenu: { justifyContent: 'center', alignItems: 'center' },
    stageText: { fontSize: 11, fontWeight: '700', flex: 1 },
    teamsRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    teamName: { fontSize: 13, fontWeight: '600', flex: 1 },
    vsText: { fontSize: 11, fontWeight: '700' },
    resultText: { fontSize: 11, fontWeight: '600' },
    venueText: { fontSize: 10.5 },
    teamTile: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: Layout.borderRadius - 4, marginBottom: 6, gap: 8, borderWidth: 1 },
    logoCircle: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
    logoText: { fontSize: 12, fontWeight: '700' },
    teamTileName: { fontSize: 13, fontWeight: '600' },
    teamTileSub: { fontSize: 11 },
    emptyBox: { padding: 20, alignItems: 'center' }
});
