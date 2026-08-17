import React, { useState, useEffect, useCallback } from 'react';
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
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import Toast from 'react-native-toast-message';

import { ScreenHeader } from '@/components/common/ScreenHeader';
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
import { Player } from '@/types/cricket';

export default function AddTeamScreen() {
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
                text2: 'Only Cricket Admins can register teams.'
            });
            router.replace('/cricket' as any);
        }
    }, [isCricketAdmin, router]);

    const { registerTeamMutation } = useCricketAPI();

    // Team State
    const [teamName, setTeamName] = useState('');
    const [shortName, setShortName] = useState('');

    // Roster State (Default 2 empty players)
    const [players, setPlayers] = useState<Player[]>([
        { name: '', role: 'BATSMAN', isCaptain: true },
        { name: '', role: 'BOWLER', isCaptain: false }
    ]);

    // Handle captain selection - only one captain allowed
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
            next[index] = updated;
            return next;
        });
    }, []);

    const handleRemovePlayer = useCallback((index: number) => {
        setPlayers(prev => prev.filter((_, i) => i !== index));
    }, []);

    const handlePickPlayerImage = useCallback(async (index: number) => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: 'images',
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            const manipResult = await ImageManipulator.manipulateAsync(
                result.assets[0].uri,
                [{ resize: { width: 300 } }],
                { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
            );

            setPlayers(prev => {
                const next = [...prev];
                next[index] = { ...next[index], image: manipResult.uri };
                return next;
            });
        }
    }, []);

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

        const payload = {
            name: teamName.trim(),
            shortName: shortName.trim().toUpperCase(),
            players: validPlayers
        };

        registerTeamMutation.mutate({ tournamentId: tournamentId || '', payload }, {
            onSuccess: () => {
                router.back();
            }
        });
    };

    if (!isCricketAdmin) return null;

    return (
        <ErrorBoundary>
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <ScreenHeader hero={{ title: "Register Team" }} showMenuIcon={false} />

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        {/* Team Basic Details */}
                        <FormInput label="TEAM NAME" required icon="shield-outline" placeholder="e.g. Lahore Lions" value={teamName} onChangeText={setTeamName} />
                        <FormInput label="SHORT CODE (MAX 5 CHARS)" required icon="text-outline" placeholder="e.g. LHR" maxLength={5} value={shortName} onChangeText={setShortName} />

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
                                onUpdate={(index, updated) => {
                                    handleUpdatePlayer(index, updated);
                                    // If captain checkbox is toggled, ensure only one captain
                                    if (updated.isCaptain && !p.isCaptain) {
                                        handleSetCaptain(index);
                                    }
                                }}
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
                            <SubmitButton title="Register Team" onPress={handleSubmit} isLoading={registerTeamMutation.isPending} />
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </View>
        </ErrorBoundary>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { padding: 14, gap: 8, paddingBottom: 40 },
    rowTwo: { flexDirection: 'row', gap: 10 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
    sectionTitle: { fontSize: 13, fontWeight: '700' },
    addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: Platform.OS === 'android' ? 48 : 52, borderRadius: Layout.borderRadius - 4, gap: 6, marginBottom: 8, marginTop: 2 },
    addBtnText: { fontSize: 12, fontWeight: '700' }
});
