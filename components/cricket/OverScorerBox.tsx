import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { FormInput } from '@/components/common/FormInput';
import { SubmitButton } from '@/components/common/SubmitButton';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';

interface OverScorerBoxProps {
    nextOverNumber: number;
    onSubmitOver: (data: {
        overNumber: number;
        bowlerName: string;
        runsScored: number;
        wickets: number;
        extras: { wides: number; noBalls: number; byesLegByes: number };
        commentary?: string;
    }) => void;
    isLoading?: boolean;
}

const RUN_PRESETS = [0, 1, 2, 3, 4, 6];

export const OverScorerBox = React.memo(function OverScorerBox({
    nextOverNumber,
    onSubmitOver,
    isLoading = false
}: OverScorerBoxProps) {
    const { theme } = useTheme();
    const colors = Colors[theme];

    const [bowlerName, setBowlerName] = useState('');
    const [runsScored, setRunsScored] = useState(0);
    const [wickets, setWickets] = useState(0);
    const [wides, setWides] = useState(0);
    const [noBalls, setNoBalls] = useState(0);
    const [commentary, setCommentary] = useState('');

    const handleSubmit = () => {
        if (!bowlerName.trim()) return;

        onSubmitOver({
            overNumber: nextOverNumber,
            bowlerName: bowlerName.trim(),
            runsScored,
            wickets,
            extras: { wides, noBalls, byesLegByes: 0 },
            commentary: commentary.trim() || undefined
        });

        // Reset form for next over
        setRunsScored(0);
        setWickets(0);
        setWides(0);
        setNoBalls(0);
        setCommentary('');
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <View style={styles.header}>
                <Ionicons name="create-outline" size={18} color={colors.primary} />
                <ThemedText style={[styles.headerTitle, { color: colors.text }]}>
                    Record Over #{nextOverNumber}
                </ThemedText>
            </View>

            {/* Bowler Name */}
            <FormInput
                label="BOWLER NAME"
                required
                icon="person-outline"
                placeholder="Enter bowler name"
                value={bowlerName}
                onChangeText={setBowlerName}
            />

            {/* Runs Scored in Over */}
            <View style={styles.section}>
                <ThemedText style={[styles.sectionLabel, { color: colors.text }]}>RUNS SCORED IN OVER</ThemedText>
                <View style={styles.presetsRow}>
                    {RUN_PRESETS.map((val) => (
                        <TouchableOpacity
                            key={val}
                            style={[
                                styles.presetBtn,
                                { backgroundColor: runsScored === val ? colors.primary : colors.surface }
                            ]}
                            onPress={() => setRunsScored(val)}
                        >
                            <ThemedText style={[styles.presetText, { color: runsScored === val ? '#FFFFFF' : colors.text }]}>
                                {val}
                            </ThemedText>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Wickets & Extras Steppers */}
            <View style={styles.steppersRow}>
                {/* Wickets */}
                <View style={[styles.stepperBox, { backgroundColor: colors.surface }]}>
                    <ThemedText style={[styles.stepperLabel, { color: colors.text }]}>Wickets</ThemedText>
                    <View style={styles.stepperControls}>
                        <TouchableOpacity style={styles.stepBtn} onPress={() => setWickets(Math.max(0, wickets - 1))}>
                            <Ionicons name="remove" size={16} color={colors.icon} />
                        </TouchableOpacity>
                        <ThemedText style={[styles.stepValue, { color: colors.danger }]}>{wickets}</ThemedText>
                        <TouchableOpacity style={styles.stepBtn} onPress={() => setWickets(wickets + 1)}>
                            <Ionicons name="add" size={16} color={colors.icon} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Wides */}
                <View style={[styles.stepperBox, { backgroundColor: colors.surface }]}>
                    <ThemedText style={[styles.stepperLabel, { color: colors.text }]}>Wides</ThemedText>
                    <View style={styles.stepperControls}>
                        <TouchableOpacity style={styles.stepBtn} onPress={() => setWides(Math.max(0, wides - 1))}>
                            <Ionicons name="remove" size={16} color={colors.icon} />
                        </TouchableOpacity>
                        <ThemedText style={[styles.stepValue, { color: colors.text }]}>{wides}</ThemedText>
                        <TouchableOpacity style={styles.stepBtn} onPress={() => setWides(wides + 1)}>
                            <Ionicons name="add" size={16} color={colors.icon} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* No-Balls */}
                <View style={[styles.stepperBox, { backgroundColor: colors.surface }]}>
                    <ThemedText style={[styles.stepperLabel, { color: colors.text }]}>No-Balls</ThemedText>
                    <View style={styles.stepperControls}>
                        <TouchableOpacity style={styles.stepBtn} onPress={() => setNoBalls(Math.max(0, noBalls - 1))}>
                            <Ionicons name="remove" size={16} color={colors.icon} />
                        </TouchableOpacity>
                        <ThemedText style={[styles.stepValue, { color: colors.text }]}>{noBalls}</ThemedText>
                        <TouchableOpacity style={styles.stepBtn} onPress={() => setNoBalls(noBalls + 1)}>
                            <Ionicons name="add" size={16} color={colors.icon} />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* Commentary string */}
            <FormInput
                label="OVER COMMENTARY (OPTIONAL)"
                icon="chatbox-outline"
                placeholder="e.g. 6 4 1 W 0 2"
                value={commentary}
                onChangeText={setCommentary}
            />

            {/* Submit Button */}
            <SubmitButton
                title={`Submit Over #${nextOverNumber}`}
                onPress={handleSubmit}
                isLoading={isLoading}
                disabled={!bowlerName.trim()}
            />
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        padding: 14,
        borderRadius: Layout.borderRadius,
        marginBottom: 16,
        gap: 12
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6
    },
    headerTitle: {
        fontSize: 15,
        fontWeight: '800'
    },
    section: {
        gap: 6
    },
    sectionLabel: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5
    },
    presetsRow: {
        flexDirection: 'row',
        gap: 8
    },
    presetBtn: {
        flex: 1,
        height: 38,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center'
    },
    presetText: {
        fontSize: 14,
        fontWeight: '800'
    },
    steppersRow: {
        flexDirection: 'row',
        gap: 8
    },
    stepperBox: {
        flex: 1,
        padding: 8,
        borderRadius: 8,
        alignItems: 'center',
        gap: 4
    },
    stepperLabel: {
        fontSize: 10,
        fontWeight: '700'
    },
    stepperControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    stepBtn: {
        padding: 4
    },
    stepValue: {
        fontSize: 15,
        fontWeight: '800'
    }
});
