import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Platform,
    KeyboardAvoidingView
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FormInput } from '@/components/common/FormInput';
import { SubmitButton } from '@/components/common/SubmitButton';
import { ModalPickerTrigger } from '@/components/common/ModalPickerTrigger';
import { SearchableDropdown } from '@/components/common/SearchableDropdown';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useCricketAPI } from '@/hooks/useCricketAPI';
import { Team, MatchStage } from '@/types/cricket';

const STAGES: MatchStage[] = ['GROUP', 'QUARTER_FINAL', 'SEMI_FINAL', 'FINAL'];

export default function ScheduleMatchScreen() {
    const { id: tournamentId, matchId } = useLocalSearchParams<{ id: string; matchId?: string }>();
    const isEditing = !!matchId;
    const { theme } = useTheme();
    const colors = Colors[theme];
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user, isCricketAdmin } = useAuth();

    // Permission Guard
    useEffect(() => {
        if (!isCricketAdmin) {
            Toast.show({
                type: 'error',
                text1: 'Access Denied',
                text2: 'Only Cricket Admins can manage matches.'
            });
            router.replace('/cricket' as any);
        }
    }, [isCricketAdmin, router]);

    const { useTournamentDetailsQuery, scheduleMatchMutation, updateMatchMutation } = useCricketAPI();
    const { data } = useTournamentDetailsQuery(tournamentId || '');
    const tournament = data?.data;
    const teams: Team[] = tournament?.teams || [];
    const matches = data?.matches || [];

    // Form State
    const [matchTitle, setMatchTitle] = useState('Group Match');
    const [stage, setStage] = useState<MatchStage>('GROUP');
    const [teamAId, setTeamAId] = useState('');
    const [teamBId, setTeamBId] = useState('');
    const [teamAPickerVisible, setTeamAPickerVisible] = useState(false);
    const [teamBPickerVisible, setTeamBPickerVisible] = useState(false);
    const [venue, setVenue] = useState('');
    const [maxOvers, setMaxOvers] = useState('10');
    const [scheduledAt, setScheduledAt] = useState(new Date().toISOString().split('T')[0]);
    const [titleTouched, setTitleTouched] = useState(false);
    const [matchStatus, setMatchStatus] = useState<string>('UPCOMING');

    // Defaults for a brand-new fixture come from the tournament itself.
    useEffect(() => {
        if (isEditing || !tournament) return;
        if (tournament.venue) setVenue(tournament.venue);
        if (tournament.defaultMaxOvers) setMaxOvers(String(tournament.defaultMaxOvers));
    }, [tournament, isEditing]);

    // Editing an existing fixture: load its current values.
    useEffect(() => {
        if (!isEditing || !matches.length) return;
        const existing = matches.find((m: any) => m._id === matchId);
        if (!existing) return;
        setMatchTitle(existing.matchTitle || '');
        setStage(existing.stage || 'GROUP');
        setTeamAId(existing.teamA?.id || '');
        setTeamBId(existing.teamB?.id || '');
        setVenue(existing.venue || '');
        setMaxOvers(String(existing.maxOvers || 10));
        if (existing.scheduledAt) setScheduledAt(String(existing.scheduledAt).split('T')[0]);
        setMatchStatus(existing.status || 'UPCOMING');
    }, [isEditing, matches, matchId]);

    // The title is just a human label for the fixture ("Group A - Match #3")
    // shown on cards and the scorecard — the stage is the structural field.
    // Keep it filled in automatically from the picked teams so nobody has to
    // invent one, while still allowing a custom label.
    useEffect(() => {
        if (isEditing || titleTouched) return;
        const a = teams.find(t => t._id === teamAId);
        const b = teams.find(t => t._id === teamBId);
        if (a && b) {
            setMatchTitle(`${a.shortName} vs ${b.shortName}`);
        } else {
            setMatchTitle(stage.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()) + ' Match');
        }
    }, [teamAId, teamBId, stage, teams, isEditing, titleTouched]);

    const handleSubmit = () => {
        if (!matchTitle.trim() || !teamAId || !teamBId) {
            Toast.show({
                type: 'error',
                text1: 'Required Fields',
                text2: 'Match title, Team A, and Team B are required.'
            });
            return;
        }

        if (teamAId === teamBId) {
            Toast.show({
                type: 'error',
                text1: 'Invalid Selection',
                text2: 'Team A and Team B cannot be the same.'
            });
            return;
        }

        const payload = {
            matchTitle: matchTitle.trim(),
            stage,
            teamAId,
            teamBId,
            venue: venue.trim() || tournament?.venue || 'Ground 1',
            scheduledAt,
            maxOvers: parseInt(maxOvers) || tournament?.defaultMaxOvers || 10
        };

        if (isEditing && matchId) {
            // Teams and overs are locked server-side once a match is under way,
            // so only send them while it's still UPCOMING.
            const { teamAId: a, teamBId: b, maxOvers: o, ...rest } = payload;
            const editPayload = matchStatus === 'UPCOMING' ? payload : rest;
            updateMatchMutation.mutate({ matchId, payload: editPayload }, {
                onSuccess: () => router.back()
            });
        } else {
            scheduleMatchMutation.mutate({ tournamentId: tournamentId || '', payload }, {
                onSuccess: () => router.back()
            });
        }
    };

    if (!isCricketAdmin) return null;

    return (
        <ErrorBoundary>
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                {/* Straight Compact Header — matches Create Tournament */}
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

                        <ThemedText style={styles.headerTitle}>{isEditing ? 'Edit Match' : 'Schedule Match'}</ThemedText>

                        <View style={{ width: 36 }} />
                    </View>
                </View>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        {/* Match Title & Stage */}
                        <FormInput
                            label="MATCH TITLE"
                            required
                            icon="pricetag-outline"
                            placeholder="e.g. Group A - Match #3"
                            value={matchTitle}
                            onChangeText={(val) => { setTitleTouched(true); setMatchTitle(val); }}
                        />

                        {/* Stage Selector */}
                        <View style={styles.section}>
                            <ThemedText style={[styles.label, { color: colors.textSecondary }]}>STAGE</ThemedText>
                            <View style={styles.pillsRow}>
                                {STAGES.map((s) => {
                                    const isSelected = stage === s;
                                    return (
                                        <TouchableOpacity
                                            key={s}
                                            style={[styles.pill, { backgroundColor: isSelected ? colors.primary : colors.cardBg }]}
                                            onPress={() => setStage(s)}
                                        >
                                            <ThemedText style={[styles.pillText, { color: isSelected ? '#FFF' : colors.text }]}>
                                                {s.replace('_', ' ')}
                                            </ThemedText>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>

                        {/* Select Team A */}
                        <ModalPickerTrigger
                            label="SELECT TEAM A"
                            required
                            icon="shield-outline"
                            value={teams.find(t => t._id === teamAId)?.name}
                            placeholder="Select Team A"
                            onPress={() => setTeamAPickerVisible(true)}
                        />

                        {/* Select Team B */}
                        <ModalPickerTrigger
                            label="SELECT TEAM B"
                            required
                            icon="shield-outline"
                            value={teams.find(t => t._id === teamBId)?.name}
                            placeholder="Select Team B"
                            onPress={() => setTeamBPickerVisible(true)}
                        />

                        {/* Max Overs Override */}
                        <View style={styles.rowTwo}>
                            <View style={{ flex: 1 }}>
                                <FormInput label="MATCH MAX OVERS" required icon="options-outline" keyboardType="numeric" placeholder="10" value={maxOvers} onChangeText={setMaxOvers} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <FormInput label="SCHEDULED DATE" required icon="calendar-outline" placeholder="YYYY-MM-DD" value={scheduledAt} onChangeText={setScheduledAt} />
                            </View>
                        </View>

                        <FormInput label="VENUE / GROUND" icon="business-outline" placeholder="Venue name" value={venue} onChangeText={setVenue} />

                        {/* Submit Action */}
                        <View style={{ marginTop: 10 }}>
                            <SubmitButton
                                title={isEditing ? 'Update Match' : 'Schedule Match Fixture'}
                                onPress={handleSubmit}
                                isLoading={isEditing ? updateMatchMutation.isPending : scheduleMatchMutation.isPending}
                            />
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>

                {/* Team A Dropdown */}
                <SearchableDropdown
                    visible={teamAPickerVisible}
                    onClose={() => setTeamAPickerVisible(false)}
                    onSelect={(selectedVal) => {
                        const matchedTeam = teams.find(t => t._id === selectedVal || t.name === selectedVal);
                        if (matchedTeam) setTeamAId(matchedTeam._id);
                        setTeamAPickerVisible(false);
                    }}
                    options={teams.filter(t => t._id !== teamBId).map(t => ({ label: `${t.name} (${t.shortName})`, value: t._id }))}
                    title="Select Team A"
                    currentValue={teamAId}
                />

                {/* Team B Dropdown */}
                <SearchableDropdown
                    visible={teamBPickerVisible}
                    onClose={() => setTeamBPickerVisible(false)}
                    onSelect={(selectedVal) => {
                        const matchedTeam = teams.find(t => t._id === selectedVal || t.name === selectedVal);
                        if (matchedTeam) setTeamBId(matchedTeam._id);
                        setTeamBPickerVisible(false);
                    }}
                    options={teams.filter(t => t._id !== teamAId).map(t => ({ label: `${t.name} (${t.shortName})`, value: t._id }))}
                    title="Select Team B"
                    currentValue={teamBId}
                />
            </View>
        </ErrorBoundary>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
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
        width: Layout.iconButtonSize,
        height: Layout.iconButtonSize,
        alignItems: 'center',
        justifyContent: 'center'
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 0.2
    },
    scrollContent: { padding: 14, gap: 10, paddingBottom: 40 },
    section: { gap: 4 },
    label: { fontSize: 10, fontWeight: '600', letterSpacing: 0.3 },
    pillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
    pill: { paddingHorizontal: 14, height: 30, justifyContent: 'center', borderRadius: 15 },
    pillText: { fontSize: 10.5, fontWeight: '600' },
    teamsList: { gap: 5 },
    teamItem: { padding: 9, borderRadius: Layout.borderRadius - 6 },
    teamItemText: { fontSize: 12, fontWeight: '600' },
    rowTwo: { flexDirection: 'row', gap: 10 }
});
