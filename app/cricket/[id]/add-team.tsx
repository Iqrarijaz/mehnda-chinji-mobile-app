import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Platform,
    KeyboardAvoidingView
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FormInput } from '@/components/common/FormInput';
import { SubmitButton } from '@/components/common/SubmitButton';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { ThemedText } from '@/components/ThemedText';
import { PlayerRow } from '@/components/cricket/PlayerRow';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useCricketAPI } from '@/hooks/useCricketAPI';
import { Player, Team } from '@/types/cricket';

export default function AddTeamScreen() {
    const { id: tournamentId, teamId } = useLocalSearchParams<{ id: string; teamId?: string }>();
    const isEditing = !!teamId;
    const { theme } = useTheme();
    const colors = Colors[theme];
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const isCricketAdmin = !!user?.user?.isCricketAdmin;

    // Permission Guard
    useEffect(() => {
        if (!isCricketAdmin) {
            Toast.show({
                type: 'error',
                text1: 'Access Denied',
                text2: 'Only Cricket Admins can register teams.'
            });
            router.replace('/cricket' as any);
        }
    }, [isCricketAdmin, router]);

    const { registerTeamMutation, updateTeamMutation, useTournamentDetailsQuery } = useCricketAPI();
    const { data: tournamentData } = useTournamentDetailsQuery(isEditing ? (tournamentId || '') : '');

    // Team State
    const [teamName, setTeamName] = useState('');
    const [shortName, setShortName] = useState('');
    const [logo, setLogo] = useState<string | null>(null);

    // Roster State (Default 2 empty players)
    const [players, setPlayers] = useState<Player[]>([
        { name: '', role: 'BATSMAN', isCaptain: true },
        { name: '', role: 'BOWLER', isCaptain: false }
    ]);

    // Pre-fill when editing an existing team
    useEffect(() => {
        if (!isEditing || !tournamentData?.data?.teams) return;
        const existing = (tournamentData.data.teams as Team[]).find(t => t._id === teamId);
        if (!existing) return;
        setTeamName(existing.name || '');
        setShortName(existing.shortName || '');
        setLogo(existing.logo || null);
        if (existing.players?.length) {
            setPlayers(existing.players);
        }
    }, [isEditing, tournamentData, teamId]);

    // Only one player can be captain at a time.
    const handleSetCaptain = useCallback((index: number) => {
        setPlayers(prev => prev.map((p, i) => ({
            ...p,
            isCaptain: i === index
        })));
    }, []);

    const handleAddPlayer = () => {
        setPlayers(prev => [...prev, { name: '', role: 'ALL_ROUNDER', isCaptain: false }]);
    };

    const handleUpdatePlayer = useCallback((index: number, updated: Player) => {
        setPlayers(prev => {
            const next = [...prev];
            // Checking the captain box on one player clears it on every other,
            // so the roster can never carry two captains.
            if (updated.isCaptain && !prev[index].isCaptain) {
                return prev.map((p, i) => (i === index ? updated : { ...p, isCaptain: false }));
            }
            next[index] = updated;
            return next;
        });
    }, []);

    const handleRemovePlayer = useCallback((index: number) => {
        setPlayers(prev => prev.filter((_, i) => i !== index));
    }, []);

    const pickAndCompressImage = useCallback(async (aspect: [number, number], width: number) => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: 'images',
            allowsEditing: true,
            aspect,
            quality: 0.7
        });

        if (result.canceled || !result.assets?.length) return null;

        const manipResult = await ImageManipulator.manipulateAsync(
            result.assets[0].uri,
            [{ resize: { width } }],
            { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );
        return manipResult.uri;
    }, []);

    const handlePickLogo = useCallback(async () => {
        const uri = await pickAndCompressImage([1, 1], 400);
        if (uri) setLogo(uri);
    }, [pickAndCompressImage]);

    const handlePickPlayerImage = useCallback(async (index: number) => {
        const uri = await pickAndCompressImage([1, 1], 300);
        if (!uri) return;
        setPlayers(prev => {
            const next = [...prev];
            next[index] = { ...next[index], image: uri };
            return next;
        });
    }, [pickAndCompressImage]);

    const handleSubmit = () => {
        if (!teamName.trim() || !shortName.trim()) {
            Toast.show({
                type: 'error',
                text1: 'Required Fields',
                text2: 'Team name and short name are required.'
            });
            return;
        }

        const validPlayers = players.filter(p => p.name.trim());
        if (validPlayers.length === 0) {
            Toast.show({
                type: 'error',
                text1: 'Empty Roster',
                text2: 'Please add at least 1 player name.'
            });
            return;
        }

        // Send the captain's name alongside the roster so the team record shows
        // a captain even if the backend doesn't derive it from the isCaptain flag.
        const captain = validPlayers.find(p => p.isCaptain);

        const payload = {
            name: teamName.trim(),
            shortName: shortName.trim().toUpperCase(),
            logo: logo || null,
            captainName: captain?.name?.trim() || null,
            captainPhone: captain?.phone || null,
            players: validPlayers
        };

        if (isEditing && teamId) {
            updateTeamMutation.mutate({ tournamentId: tournamentId || '', teamId, payload }, {
                onSuccess: () => router.back()
            });
        } else {
            registerTeamMutation.mutate({ tournamentId: tournamentId || '', payload }, {
                onSuccess: () => router.back()
            });
        }
    };

    if (!isCricketAdmin) return null;

    const isSaving = isEditing ? updateTeamMutation.isPending : registerTeamMutation.isPending;

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

                        <ThemedText style={styles.headerTitle}>
                            {isEditing ? 'Edit Team' : 'Register Team'}
                        </ThemedText>

                        <View style={{ width: 36 }} />
                    </View>
                </View>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        {/* Team Logo Picker */}
                        <View style={styles.logoSection}>
                            <TouchableOpacity
                                style={[styles.logoPicker, { backgroundColor: colors.cardBg }]}
                                onPress={handlePickLogo}
                                activeOpacity={0.8}
                            >
                                {logo ? (
                                    <Image source={{ uri: logo }} style={styles.logoImage} />
                                ) : (
                                    <View style={styles.logoPlaceholder}>
                                        <Ionicons name="shield-outline" size={26} color={colors.primary} />
                                    </View>
                                )}
                                <View style={[styles.logoCameraBadge, { backgroundColor: colors.primary }]}>
                                    <Ionicons name="camera" size={12} color="#FFFFFF" />
                                </View>
                            </TouchableOpacity>
                            <ThemedText style={[styles.logoHint, { color: colors.textSecondary }]}>
                                Team Logo (Optional)
                            </ThemedText>
                        </View>

                        {/* Team Basic Details */}
                        <FormInput label="TEAM NAME" required icon="shield-outline" placeholder="e.g. Lahore Lions" value={teamName} onChangeText={setTeamName} autoCapitalize="words" />
                        <FormInput label="SHORT CODE (MAX 5 CHARS)" required icon="text-outline" placeholder="e.g. LHR" maxLength={5} value={shortName} onChangeText={setShortName} autoCapitalize="characters" />

                        {/* Player Roster Section */}
                        <View style={styles.sectionHeader}>
                            <Ionicons name="people-outline" size={18} color={colors.primary} />
                            <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Player Roster ({players.length})</ThemedText>
                        </View>

                        {players.map((p, idx) => (
                            <PlayerRow
                                key={idx}
                                index={idx}
                                player={p}
                                onUpdate={handleUpdatePlayer}
                                onRemove={handleRemovePlayer}
                                onPickImage={handlePickPlayerImage}
                            />
                        ))}

                        <TouchableOpacity style={[styles.addBtn, { backgroundColor: `${colors.primary}15` }]} onPress={handleAddPlayer}>
                            <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
                            <ThemedText style={[styles.addBtnText, { color: colors.primary }]}>+ Add Player to Roster</ThemedText>
                        </TouchableOpacity>

                        {/* Submit Action */}
                        <View style={{ marginTop: 10 }}>
                            <SubmitButton
                                title={isEditing ? 'Update Team' : 'Register Team'}
                                onPress={handleSubmit}
                                isLoading={isSaving}
                            />
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
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
    scrollContent: { padding: 14, gap: 8, paddingBottom: 40 },
    logoSection: { alignItems: 'center', gap: 6, marginBottom: 4 },
    logoPicker: {
        width: 84,
        height: 84,
        borderRadius: 42,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative'
    },
    logoImage: { width: '100%', height: '100%', borderRadius: 42 },
    logoPlaceholder: { justifyContent: 'center', alignItems: 'center' },
    logoCameraBadge: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center'
    },
    logoHint: { fontSize: 11, fontWeight: '600' },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
    sectionTitle: { fontSize: 13, fontWeight: '700' },
    addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: Platform.OS === 'android' ? 46 : 50, borderRadius: Layout.borderRadius - 6, gap: 6, marginBottom: 8, marginTop: 2 },
    addBtnText: { fontSize: 12, fontWeight: '700' }
});
