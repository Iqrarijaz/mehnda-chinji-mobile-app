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

import { ScreenHeader } from '@/components/common/ScreenHeader';
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
    const { id: tournamentId } = useLocalSearchParams<{ id: string }>();
    const { theme } = useTheme();
    const colors = Colors[theme];
    const router = useRouter();
    const { user } = useAuth();
    const isCricketAdmin = !!user?.user?.isCricketAdmin;

    // Permission Guard
    useEffect(() => {
        if (!isCricketAdmin) {
            Toast.show({
                type: 'error',
                text1: 'Access Denied',
                text2: 'Only Cricket Admins can schedule matches.'
            });
            router.replace('/cricket' as any);
        }
    }, [isCricketAdmin, router]);

    const { useTournamentDetailsQuery, scheduleMatchMutation } = useCricketAPI();
    const { data } = useTournamentDetailsQuery(tournamentId || '');
    const tournament = data?.data;
    const teams: Team[] = tournament?.teams || [];

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

    useEffect(() => {
        if (tournament) {
            if (tournament.venue) setVenue(tournament.venue);
            if (tournament.defaultMaxOvers) setMaxOvers(String(tournament.defaultMaxOvers));
        }
    }, [tournament]);

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

        scheduleMatchMutation.mutate({ tournamentId: tournamentId || '', payload }, {
            onSuccess: () => {
                router.back();
            }
        });
    };

    if (!isCricketAdmin) return null;

    return (
        <ErrorBoundary>
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <ScreenHeader hero={{ title: "Schedule Match" }} showMenuIcon={false} />

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        {/* Match Title & Stage */}
                        <FormInput label="MATCH TITLE" required icon="pricetag-outline" placeholder="e.g. Group A - Match #3" value={matchTitle} onChangeText={setMatchTitle} />

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
                            <SubmitButton title="Schedule Match Fixture" onPress={handleSubmit} isLoading={scheduleMatchMutation.isPending} />
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
                    options={teams.map(t => ({ label: `${t.name} (${t.shortName})`, value: t._id }))}
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
                    options={teams.map(t => ({ label: `${t.name} (${t.shortName})`, value: t._id }))}
                    title="Select Team B"
                    currentValue={teamBId}
                />
            </View>
        </ErrorBoundary>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { padding: 16, gap: 12, paddingBottom: 40 },
    section: { gap: 6 },
    label: { fontSize: 10.5, fontWeight: '700', letterSpacing: 0.5 },
    pillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    pill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: Layout.borderRadius - 6 },
    pillText: { fontSize: 11, fontWeight: '700' },
    teamsList: { gap: 6 },
    teamItem: { padding: 10, borderRadius: Layout.borderRadius - 6, borderWidth: 1 },
    teamItemText: { fontSize: 12.5, fontWeight: '700' },
    rowTwo: { flexDirection: 'row', gap: 10 }
});
