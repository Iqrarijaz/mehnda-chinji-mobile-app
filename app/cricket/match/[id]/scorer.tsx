import React, { useEffect, useCallback } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    Platform,
    KeyboardAvoidingView
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

import { ScreenHeader } from '@/components/common/ScreenHeader';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { ThemedText } from '@/components/ThemedText';
import { LiveScorecardCard } from '@/components/cricket/LiveScorecardCard';
import { OverScorerBox } from '@/components/cricket/OverScorerBox';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useCricketAPI } from '@/hooks/useCricketAPI';
import { canUserManageTournament } from '@/types/cricket';

export default function OverScorerPanelScreen() {
    const { id: matchId } = useLocalSearchParams<{ id: string }>();
    const { theme } = useTheme();
    const colors = Colors[theme];
    const router = useRouter();
    const { user } = useAuth();

    const { useMatchDetailsQuery, postOverMutation } = useCricketAPI();
    const { data, isLoading, isError } = useMatchDetailsQuery(matchId || '');

    const match = data?.data;
    const canManage = canUserManageTournament(user, match?.tournamentId);

    // Permission Guard: Non-admin protection
    useEffect(() => {
        if (!isLoading && match && !canManage) {
            Toast.show({
                type: 'error',
                text1: 'Access Denied',
                text2: 'You do not have permission to score this match.'
            });
            router.replace(`/cricket/match/${matchId}` as any);
        }
    }, [canManage, isLoading, match, matchId, router]);

    const handleSubmitOver = useCallback((overData: any) => {
        if (!matchId) return;

        postOverMutation.mutate({ matchId, payload: overData }, {
            onSuccess: (res) => {
                if (res.data?.status === 'COMPLETED') {
                    Toast.show({
                        type: 'success',
                        text1: 'Match Completed!',
                        text2: res.data.result || 'Match finalized successfully.'
                    });
                    router.replace(`/cricket/match/${matchId}` as any);
                }
            }
        });
    }, [matchId, postOverMutation, router]);

    if (!canManage) return null;

    if (isLoading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <ScreenHeader hero={{ title: "Live Scorer Panel" }} showMenuIcon={false} />
                <View style={styles.centerContainer}>
                    <ThemedText style={{ color: colors.textSecondary }}>Loading scorer panel...</ThemedText>
                </View>
            </View>
        );
    }

    if (isError || !match) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <ScreenHeader hero={{ title: "Live Scorer Panel" }} showMenuIcon={false} />
                <View style={styles.centerContainer}>
                    <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
                    <ThemedText style={{ color: colors.text, fontWeight: '700', marginTop: 8 }}>
                        Match Not Found
                    </ThemedText>
                </View>
            </View>
        );
    }

    const currentInning = match.currentInnings === 1 ? match.innings1 : match.innings2;
    const nextOverNumber = (currentInning?.totalOvers || 0) + 1;

    return (
        <ErrorBoundary>
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <ScreenHeader hero={{ title: `Scorer — ${match.matchTitle}` }} showMenuIcon={false} />

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        {/* Live Summary Header */}
                        <LiveScorecardCard match={match} />

                        {/* Over Scorer Input Panel */}
                        {match.status !== 'COMPLETED' ? (
                            <OverScorerBox
                                nextOverNumber={nextOverNumber}
                                onSubmitOver={handleSubmitOver}
                                isLoading={postOverMutation.isPending}
                            />
                        ) : (
                            <View style={styles.completedBox}>
                                <Ionicons name="checkmark-circle-outline" size={48} color={colors.success} />
                                <ThemedText style={[styles.completedTitle, { color: colors.text }]}>
                                    Match Complete
                                </ThemedText>
                                <ThemedText style={[styles.completedSub, { color: colors.textSecondary }]}>
                                    {match.result}
                                </ThemedText>
                            </View>
                        )}
                    </ScrollView>
                </KeyboardAvoidingView>
            </View>
        </ErrorBoundary>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollContent: { padding: 14, gap: 12, paddingBottom: 40 },
    completedBox: { padding: 30, alignItems: 'center', gap: 6 },
    completedTitle: { fontSize: 18, fontWeight: '800' },
    completedSub: { fontSize: 13 }
});
