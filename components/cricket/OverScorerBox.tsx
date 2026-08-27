import React, { useState, useMemo, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { FormInput } from '@/components/common/FormInput';
import { SubmitButton } from '@/components/common/SubmitButton';
import { ModalPickerTrigger } from '@/components/common/ModalPickerTrigger';
import { SearchableDropdown } from '@/components/common/SearchableDropdown';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';
import { Player, BallRecord } from '@/types/cricket';

interface BallItem {
    id: string;
    ballNumber: number; // 1, 2, 3...
    isLegal: boolean; // false for Wide / No-Ball
    strikerName: string;
    nonStrikerName: string;
    bowlerName?: string;
    runs: number;
    isWicket: boolean;
    isWide: boolean;
    isNoBall: boolean;
    isBye: boolean;
    isLegBye: boolean;
    wicketType?: string;
    totalRuns: number;
    isScored: boolean;
}

interface OverScorerBoxProps {
    nextOverNumber: number;
    onSubmitOver: (data: {
        overNumber: number;
        bowlerName: string;
        strikerName?: string;
        nonStrikerName?: string;
        batsmanName?: string;
        runsScored: number;
        wickets: number;
        extras: { wides: number; noBalls: number; byesLegByes: number };
        balls: BallRecord[];
        commentary?: string;
    }) => void;
    isLoading?: boolean;
    /** Name of the team currently bowling — shown as the picker's context. */
    bowlingTeamName?: string;
    /** Full roster of the bowling side. */
    bowlerOptions?: Player[];
    /** Name of the team currently batting. */
    battingTeamName?: string;
    /** Full roster of the batting side for batsman pickers. */
    batsmanOptions?: Player[];
}

function createInitialBalls(): BallItem[] {
    return Array.from({ length: 6 }, (_, i) => ({
        id: `ball-${i + 1}-${Date.now()}`,
        ballNumber: i + 1,
        isLegal: true,
        strikerName: '',
        nonStrikerName: '',
        runs: 0,
        isWicket: false,
        isWide: false,
        isNoBall: false,
        isBye: false,
        isLegBye: false,
        totalRuns: 0,
        isScored: false
    }));
}

export const OverScorerBox = React.memo(function OverScorerBox({
    nextOverNumber,
    onSubmitOver,
    isLoading = false,
    bowlingTeamName,
    bowlerOptions = [],
    battingTeamName,
    batsmanOptions = []
}: OverScorerBoxProps) {
    const { theme } = useTheme();
    const colors = Colors[theme];

    // Batsmen state (atomic pair to prevent race condition on rapid swap)
    const [batsmen, setBatsmen] = useState<{ striker: string; nonStriker: string }>({ striker: '', nonStriker: '' });
    const strikerName = batsmen.striker;
    const nonStrikerName = batsmen.nonStriker;
    const setStrikerName = useCallback((name: string) => {
        setBatsmen((prev) => ({ ...prev, striker: name }));
    }, []);
    const setNonStrikerName = useCallback((name: string) => {
        setBatsmen((prev) => ({ ...prev, nonStriker: name }));
    }, []);

    const [strikerPickerVisible, setStrikerPickerVisible] = useState(false);
    const [nonStrikerPickerVisible, setNonStrikerPickerVisible] = useState(false);
    const [bowlerName, setBowlerName] = useState('');
    const [bowlerPickerVisible, setBowlerPickerVisible] = useState(false);

    // Ball-by-ball deliveries state
    const [balls, setBalls] = useState<BallItem[]>(createInitialBalls);
    const [selectedBallIndex, setSelectedBallIndex] = useState<number>(0);
    const [customCommentary, setCustomCommentary] = useState('');

    const activeBallIndex = Math.min(selectedBallIndex, Math.max(0, balls.length - 1));
    const activeBall = balls[activeBallIndex] || balls[0];

    // Swap Strike helper (atomic functional update)
    const handleSwapStrike = useCallback(() => {
        setBatsmen((prev) => ({
            striker: prev.nonStriker,
            nonStriker: prev.striker
        }));
    }, []);

    // Apply outcome to the selected ball
    const handleRecordBallOutcome = useCallback((options: {
        runs?: number;
        isWicket?: boolean;
        isWide?: boolean;
        isNoBall?: boolean;
        isBye?: boolean;
        isLegBye?: boolean;
    }) => {
        const runs = options.runs ?? 0;
        const isWicket = !!options.isWicket;
        const isWide = !!options.isWide;
        const isNoBall = !!options.isNoBall;
        const isBye = !!options.isBye;
        const isLegBye = !!options.isLegBye;
        const isLegal = !(isWide || isNoBall);
        const extraRun = (isWide || isNoBall) ? 1 : 0;
        const totalRuns = runs + extraRun;

        setBalls((prevBalls) => {
            const newBalls = [...prevBalls];
            const current = newBalls[activeBallIndex] || { ...prevBalls[0] };

            newBalls[activeBallIndex] = {
                ...current,
                isLegal,
                strikerName: strikerName.trim(),
                nonStrikerName: nonStrikerName.trim(),
                bowlerName: bowlerName.trim(),
                runs,
                isWicket,
                isWide,
                isNoBall,
                isBye,
                isLegBye,
                totalRuns,
                isScored: true
            };

            // If this was an illegal delivery (Wide / No-Ball) and there are no extra balls added yet
            const legalBallsScored = newBalls.filter(b => b.isScored && b.isLegal).length;
            const totalLegalBalls = newBalls.filter(b => b.isLegal).length;

            if (!isLegal && legalBallsScored < 6 && totalLegalBalls < 6 + (newBalls.length - 6)) {
                // Ensure there is at least one upcoming legal ball slot
                const hasUpcomingUnscored = newBalls.some((b, i) => i > activeBallIndex && !b.isScored);
                if (!hasUpcomingUnscored) {
                    newBalls.push({
                        id: `extra-ball-${newBalls.length + 1}-${Date.now()}`,
                        ballNumber: newBalls.length + 1,
                        isLegal: true,
                        strikerName: '',
                        nonStrikerName: '',
                        runs: 0,
                        isWicket: false,
                        isWide: false,
                        isNoBall: false,
                        isBye: false,
                        isLegBye: false,
                        totalRuns: 0,
                        isScored: false
                    });
                }
            }

            return newBalls;
        });

        // Auto-Rotate Strike on odd runs (1, 3, 5) if it wasn't a wide
        if (runs % 2 !== 0 && !isWide) {
            handleSwapStrike();
        }

        // Auto-advance to the next ball
        setSelectedBallIndex((prevIdx) => prevIdx + 1);
    }, [activeBallIndex, strikerName, nonStrikerName, bowlerName, handleSwapStrike]);

    // Computed totals from the balls array
    const scoredBalls = useMemo(() => balls.filter(b => b.isScored), [balls]);
    const legalBallsCount = useMemo(() => scoredBalls.filter(b => b.isLegal).length, [scoredBalls]);
    const totalRunsScored = useMemo(() => scoredBalls.reduce((sum, b) => sum + b.totalRuns, 0), [scoredBalls]);
    const totalWickets = useMemo(() => scoredBalls.filter(b => b.isWicket).length, [scoredBalls]);
    const totalWides = useMemo(() => scoredBalls.filter(b => b.isWide).length, [scoredBalls]);
    const totalNoBalls = useMemo(() => scoredBalls.filter(b => b.isNoBall).length, [scoredBalls]);
    const totalByesLegByes = useMemo(() => scoredBalls.filter(b => b.isBye || b.isLegBye).reduce((sum, b) => sum + b.runs, 0), [scoredBalls]);

    // Live Batsman stats in this over
    const strikerStats = useMemo(() => {
        const name = strikerName.trim();
        if (!name) return null;
        const bFaced = scoredBalls.filter(b => b.strikerName === name && b.isLegal).length;
        const runsScoredByBat = scoredBalls
            .filter(b => b.strikerName === name && !b.isWide)
            .reduce((sum, b) => sum + b.runs, 0);
        return { name, bFaced, runsScored: runsScoredByBat };
    }, [scoredBalls, strikerName]);

    const nonStrikerStats = useMemo(() => {
        const name = nonStrikerName.trim();
        if (!name) return null;
        const bFaced = scoredBalls.filter(b => b.strikerName === name && b.isLegal).length;
        const runsScoredByBat = scoredBalls
            .filter(b => b.strikerName === name && !b.isWide)
            .reduce((sum, b) => sum + b.runs, 0);
        return { name, bFaced, runsScored: runsScoredByBat };
    }, [scoredBalls, nonStrikerName]);

    // Auto-generated commentary string (e.g. "4 1 0 Wd 6 W 0")
    const autoCommentary = useMemo(() => {
        if (customCommentary.trim()) return customCommentary.trim();
        return scoredBalls.map((b) => {
            if (b.isWicket) return 'W';
            if (b.isWide) return b.runs > 0 ? `Wd+${b.runs}` : 'Wd';
            if (b.isNoBall) return b.runs > 0 ? `Nb+${b.runs}` : 'Nb';
            return String(b.runs);
        }).join(' ');
    }, [scoredBalls, customCommentary]);

    const isOverReadyToSubmit = legalBallsCount >= 6 || scoredBalls.length >= 6;

    const handleSubmit = () => {
        if (!bowlerName.trim()) return;

        const ballRecords: BallRecord[] = scoredBalls.map((b, idx) => ({
            ballNumber: idx + 1,
            strikerName: b.strikerName || strikerName.trim() || undefined,
            nonStrikerName: b.nonStrikerName || nonStrikerName.trim() || undefined,
            bowlerName: bowlerName.trim(),
            runs: b.runs,
            isWicket: b.isWicket,
            isWide: b.isWide,
            isNoBall: b.isNoBall,
            isBye: b.isBye,
            isLegBye: b.isLegBye,
            totalRuns: b.totalRuns,
            commentary: b.isWicket ? 'Wicket' : `${b.totalRuns} runs`
        }));

        onSubmitOver({
            overNumber: nextOverNumber,
            bowlerName: bowlerName.trim(),
            strikerName: strikerName.trim() || undefined,
            nonStrikerName: nonStrikerName.trim() || undefined,
            batsmanName: strikerName.trim() || undefined,
            runsScored: totalRunsScored,
            wickets: totalWickets,
            extras: { wides: totalWides, noBalls: totalNoBalls, byesLegByes: totalByesLegByes },
            balls: ballRecords,
            commentary: autoCommentary || undefined
        });

        // Reset deliveries for next over, keeping batsmen on pitch
        setBalls(createInitialBalls());
        setSelectedBallIndex(0);
        setCustomCommentary('');
    };

    // Helper to render Ball Chip in timeline
    const renderBallTimelineChip = (ball: BallItem, index: number) => {
        const isSelected = activeBallIndex === index;
        let badgeLabel = `#${index + 1}`;
        let badgeBg = colors.surface;
        let textColor = colors.text;

        if (ball.isScored) {
            if (ball.isWicket) {
                badgeLabel = 'W';
                badgeBg = colors.danger;
                textColor = '#FFFFFF';
            } else if (ball.isWide) {
                badgeLabel = ball.runs > 0 ? `Wd+${ball.runs}` : 'Wd';
                badgeBg = '#EAB308';
                textColor = '#000000';
            } else if (ball.isNoBall) {
                badgeLabel = ball.runs > 0 ? `Nb+${ball.runs}` : 'Nb';
                badgeBg = '#F97316';
                textColor = '#FFFFFF';
            } else if (ball.runs === 4) {
                badgeLabel = '4';
                badgeBg = '#3B82F6';
                textColor = '#FFFFFF';
            } else if (ball.runs === 6) {
                badgeLabel = '6';
                badgeBg = '#8B5CF6';
                textColor = '#FFFFFF';
            } else if (ball.runs === 0) {
                badgeLabel = '0';
                badgeBg = `${colors.primary}20`;
                textColor = colors.primary;
            } else {
                badgeLabel = String(ball.runs);
                badgeBg = `${colors.primary}30`;
                textColor = colors.text;
            }
        }

        return (
            <TouchableOpacity
                key={ball.id}
                style={[styles.ballChip, { backgroundColor: badgeBg }]}
                onPress={() => setSelectedBallIndex(index)}
                activeOpacity={0.8}
            >
                <ThemedText style={[styles.ballChipText, { color: textColor }]}>
                    {badgeLabel}
                </ThemedText>
                <ThemedText style={[styles.ballSubText, { color: isSelected ? colors.primary : colors.textSecondary }]}>
                    B{index + 1}
                </ThemedText>
                {/* Selection marker. An underline rather than a border: it reads
                    over both the neutral surface of an unscored ball and the
                    strong fills of a scored one, and leaves the chip box the
                    same size selected or not. */}
                {isSelected ? (
                    <View style={[styles.ballChipSelectedBar, { backgroundColor: colors.primary }]} />
                ) : null}
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.cardBg }]}>
            {/* Header with Over Progress */}
            <View style={styles.header}>
                <View style={styles.headerTitleRow}>
                    <Ionicons name="baseball-outline" size={20} color={colors.primary} />
                    <ThemedText style={[styles.headerTitle, { color: colors.text }]}>
                        Record Over #{nextOverNumber}
                    </ThemedText>
                </View>
                <View style={[styles.progressPill, { backgroundColor: `${colors.primary}1A` }]}>
                    <ThemedText style={[styles.progressPillText, { color: colors.primary }]}>
                        {legalBallsCount}/6 Balls • {totalRunsScored} Runs {totalWickets > 0 ? `• ${totalWickets} W` : ''}
                    </ThemedText>
                </View>
            </View>

            {/* Batsmen on Crease with Quick Strike Swap */}
            <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                    <ThemedText style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                        BATSMEN ON CREASE {battingTeamName ? `(${battingTeamName.toUpperCase()})` : ''}
                    </ThemedText>
                    <TouchableOpacity
                        style={[styles.swapStrikeBtn, { backgroundColor: `${colors.primary}15` }]}
                        onPress={handleSwapStrike}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="swap-horizontal" size={14} color={colors.primary} />
                        <ThemedText style={[styles.swapStrikeText, { color: colors.primary }]}>Swap Strike</ThemedText>
                    </TouchableOpacity>
                </View>

                <View style={styles.rowInputs}>
                    {/* Striker (Facing Delivery) */}
                    <View style={{ flex: 1 }}>
                        {batsmanOptions.length > 0 ? (
                            <ModalPickerTrigger
                                label="STRIKER (ON STRIKE)"
                                icon="person-outline"
                                value={strikerName ? `🏏 ${strikerName}` : ''}
                                placeholder="Select Striker"
                                onPress={() => setStrikerPickerVisible(true)}
                            />
                        ) : (
                            <FormInput
                                label="STRIKER (ON STRIKE)"
                                icon="person-outline"
                                placeholder="Striker name"
                                value={strikerName}
                                onChangeText={setStrikerName}
                            />
                        )}
                    </View>

                    {/* Non-Striker */}
                    <View style={{ flex: 1 }}>
                        {batsmanOptions.length > 0 ? (
                            <ModalPickerTrigger
                                label="NON-STRIKER"
                                icon="person-outline"
                                value={nonStrikerName}
                                placeholder="Non-Striker"
                                onPress={() => setNonStrikerPickerVisible(true)}
                            />
                        ) : (
                            <FormInput
                                label="NON-STRIKER"
                                icon="person-outline"
                                placeholder="Non-Striker"
                                value={nonStrikerName}
                                onChangeText={setNonStrikerName}
                            />
                        )}
                    </View>
                </View>

                {/* Live Batsman Stats in this Over */}
                {(strikerStats || nonStrikerStats) && (
                    <View style={[styles.batsmenStatsBox, { backgroundColor: colors.surface }]}>
                        <ThemedText style={[styles.statsTitle, { color: colors.textSecondary }]}>This Over Stats:</ThemedText>
                        <View style={styles.statsDetailsRow}>
                            {strikerStats && (
                                <ThemedText style={[styles.statItemText, { color: colors.text }]}>
                                    <ThemedText style={{ fontWeight: '800', color: colors.primary }}>{strikerStats.name}*</ThemedText>: {strikerStats.runsScored}r ({strikerStats.bFaced}b)
                                </ThemedText>
                            )}
                            {nonStrikerStats && (
                                <ThemedText style={[styles.statItemText, { color: colors.text }]}>
                                    <ThemedText style={{ fontWeight: '800' }}>{nonStrikerStats.name}</ThemedText>: {nonStrikerStats.runsScored}r ({nonStrikerStats.bFaced}b)
                                </ThemedText>
                            )}
                        </View>
                    </View>
                )}
            </View>

            {/* Bowler Selection */}
            {bowlerOptions.length > 0 ? (
                <ModalPickerTrigger
                    label={bowlingTeamName ? `BOWLER (${bowlingTeamName.toUpperCase()})` : 'BOWLER'}
                    required
                    icon="baseball-outline"
                    value={bowlerName}
                    placeholder="Select bowler"
                    onPress={() => setBowlerPickerVisible(true)}
                />
            ) : (
                <FormInput
                    label="BOWLER NAME"
                    required
                    icon="baseball-outline"
                    placeholder="Enter bowler name"
                    value={bowlerName}
                    onChangeText={setBowlerName}
                />
            )}

            {/* Ball Delivery Timeline & Active Ball Selector */}
            <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                    <ThemedText style={[styles.sectionLabel, { color: colors.text }]}>
                        BALL DELIVERY TIMELINE (TAP TO EDIT)
                    </ThemedText>
                    <ThemedText style={[styles.activeBallLabel, { color: colors.primary }]}>
                        Editing: Ball #{activeBallIndex + 1}
                    </ThemedText>
                </View>

                {/* Horizontal Ball Timeline Strip */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timelineScroll}>
                    {balls.map((b, idx) => renderBallTimelineChip(b, idx))}
                </ScrollView>
            </View>

            {/* Quick Ball Outcome Actions Panel */}
            <View style={[styles.ballActionPanel, { backgroundColor: colors.surface }]}>
                <View style={styles.ballActionHeader}>
                    <ThemedText style={[styles.ballActionTitle, { color: colors.text }]}>
                        Score Ball #{activeBallIndex + 1} {strikerName ? `(Facing: ${strikerName})` : ''}
                    </ThemedText>
                    {activeBall.isScored && (
                        <View style={[styles.scoredIndicator, { backgroundColor: `${colors.success}20` }]}>
                            <Ionicons name="checkmark-circle" size={13} color={colors.success} />
                            <ThemedText style={[styles.scoredIndicatorText, { color: colors.success }]}>
                                {activeBall.totalRuns}r {activeBall.isWicket ? '• Wicket' : ''}
                            </ThemedText>
                        </View>
                    )}
                </View>

                {/* Row 1: Bat Runs (0, 1, 2, 3, 4, 6) */}
                <View style={styles.outcomesRow}>
                    <TouchableOpacity
                        style={[styles.outcomeBtn, { backgroundColor: activeBall.runs === 0 && !activeBall.isWicket && !activeBall.isWide && activeBall.isScored ? colors.primary : colors.cardBg }]}
                        onPress={() => handleRecordBallOutcome({ runs: 0 })}
                    >
                        <ThemedText style={[styles.outcomeBtnText, { color: activeBall.runs === 0 && !activeBall.isWicket && !activeBall.isWide && activeBall.isScored ? '#FFF' : colors.text }]}>0 Dot</ThemedText>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.outcomeBtn, { backgroundColor: activeBall.runs === 1 && activeBall.isScored ? colors.primary : colors.cardBg }]}
                        onPress={() => handleRecordBallOutcome({ runs: 1 })}
                    >
                        <ThemedText style={[styles.outcomeBtnText, { color: activeBall.runs === 1 && activeBall.isScored ? '#FFF' : colors.text }]}>1 Run</ThemedText>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.outcomeBtn, { backgroundColor: activeBall.runs === 2 && activeBall.isScored ? colors.primary : colors.cardBg }]}
                        onPress={() => handleRecordBallOutcome({ runs: 2 })}
                    >
                        <ThemedText style={[styles.outcomeBtnText, { color: activeBall.runs === 2 && activeBall.isScored ? '#FFF' : colors.text }]}>2</ThemedText>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.outcomeBtn, { backgroundColor: activeBall.runs === 3 && activeBall.isScored ? colors.primary : colors.cardBg }]}
                        onPress={() => handleRecordBallOutcome({ runs: 3 })}
                    >
                        <ThemedText style={[styles.outcomeBtnText, { color: activeBall.runs === 3 && activeBall.isScored ? '#FFF' : colors.text }]}>3</ThemedText>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.outcomeBtn, { backgroundColor: activeBall.runs === 4 && activeBall.isScored ? '#3B82F6' : colors.cardBg }]}
                        onPress={() => handleRecordBallOutcome({ runs: 4 })}
                    >
                        <ThemedText style={[styles.outcomeBtnText, { color: activeBall.runs === 4 && activeBall.isScored ? '#FFF' : '#3B82F6', fontWeight: '900' }]}>4 Four</ThemedText>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.outcomeBtn, { backgroundColor: activeBall.runs === 6 && activeBall.isScored ? '#8B5CF6' : colors.cardBg }]}
                        onPress={() => handleRecordBallOutcome({ runs: 6 })}
                    >
                        <ThemedText style={[styles.outcomeBtnText, { color: activeBall.runs === 6 && activeBall.isScored ? '#FFF' : '#8B5CF6', fontWeight: '900' }]}>6 Six</ThemedText>
                    </TouchableOpacity>
                </View>

                {/* Row 2: Dismissal & Extras (Wicket, Wide, No-Ball, Bye) */}
                <View style={styles.extrasRow}>
                    <TouchableOpacity
                        style={[styles.extraBtn, { backgroundColor: activeBall.isWicket ? colors.danger : `${colors.danger}15` }]}
                        onPress={() => handleRecordBallOutcome({ isWicket: true, runs: 0 })}
                    >
                        <ThemedText style={[styles.extraBtnText, { color: activeBall.isWicket ? '#FFF' : colors.danger }]}>
                            🔴 Wicket (OUT)
                        </ThemedText>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.extraBtn, { backgroundColor: activeBall.isWide ? '#EAB308' : '#FEF9C3' }]}
                        onPress={() => handleRecordBallOutcome({ isWide: true, runs: 0 })}
                    >
                        <ThemedText style={[styles.extraBtnText, { color: activeBall.isWide ? '#000' : '#854D0E' }]}>
                            Wide (+1)
                        </ThemedText>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.extraBtn, { backgroundColor: activeBall.isNoBall ? '#F97316' : '#FFEDD5' }]}
                        onPress={() => handleRecordBallOutcome({ isNoBall: true, runs: 0 })}
                    >
                        <ThemedText style={[styles.extraBtnText, { color: activeBall.isNoBall ? '#FFF' : '#9A3412' }]}>
                            No-Ball (+1)
                        </ThemedText>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Commentary string */}
            <FormInput
                label="OVER COMMENTARY (AUTO-GENERATED • EDITABLE)"
                icon="chatbox-outline"
                placeholder="e.g. 4 1 0 Wd 6 W 0"
                value={customCommentary || autoCommentary}
                onChangeText={setCustomCommentary}
            />

            {/* Submit Button */}
            <SubmitButton
                title={`Submit Over #${nextOverNumber} (${totalRunsScored} Runs • ${totalWickets} Wkts)`}
                onPress={handleSubmit}
                isLoading={isLoading}
                disabled={!bowlerName.trim()}
            />

            {/* Striker Picker Modal */}
            <SearchableDropdown
                visible={strikerPickerVisible}
                onClose={() => setStrikerPickerVisible(false)}
                onSelect={(selected) => {
                    setStrikerName(selected);
                    setStrikerPickerVisible(false);
                }}
                currentValue={strikerName}
                options={batsmanOptions
                    .filter(p => p.name?.trim())
                    .map(p => ({ label: `${p.name} (${p.role.replace('_', ' ')})`, value: p.name }))}
                title={battingTeamName ? `Select Striker — ${battingTeamName}` : 'Select Striker'}
                placeholder="Search batsman..."
            />

            {/* Non-Striker Picker Modal */}
            <SearchableDropdown
                visible={nonStrikerPickerVisible}
                onClose={() => setNonStrikerPickerVisible(false)}
                onSelect={(selected) => {
                    setNonStrikerName(selected);
                    setNonStrikerPickerVisible(false);
                }}
                currentValue={nonStrikerName}
                options={batsmanOptions
                    .filter(p => p.name?.trim())
                    .map(p => ({ label: `${p.name} (${p.role.replace('_', ' ')})`, value: p.name }))}
                title={battingTeamName ? `Select Non-Striker — ${battingTeamName}` : 'Select Non-Striker'}
                placeholder="Search batsman..."
            />

            {/* Bowler Picker Modal */}
            <SearchableDropdown
                visible={bowlerPickerVisible}
                onClose={() => setBowlerPickerVisible(false)}
                onSelect={(selected) => {
                    setBowlerName(selected);
                    setBowlerPickerVisible(false);
                }}
                currentValue={bowlerName}
                options={bowlerOptions
                    .filter(p => p.name?.trim())
                    .map(p => ({ label: `${p.name} (${p.role.replace('_', ' ')})`, value: p.name }))}
                title={bowlingTeamName ? `Select Bowler — ${bowlingTeamName}` : 'Select Bowler'}
                placeholder="Search player..."
            />
        </View>
    );
});

OverScorerBox.displayName = 'OverScorerBox';

const styles = StyleSheet.create({
    container: {
        padding: 12,
        borderRadius: Layout.borderRadius - 2,
        marginBottom: 16,
        gap: 12
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 6
    },
    headerTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6
    },
    headerTitle: {
        fontSize: 15.5,
        fontWeight: '800'
    },
    progressPill: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12
    },
    progressPillText: {
        fontSize: 11,
        fontWeight: '800'
    },
    section: {
        gap: 8
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    sectionLabel: {
        fontSize: 10.5,
        fontWeight: '700',
        letterSpacing: 0.5
    },
    swapStrikeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        height: Layout.pillHeight,
        paddingHorizontal: 12,
        borderRadius: Layout.pillHeight / 2
    },
    swapStrikeText: {
        fontSize: 10.5,
        fontWeight: '700'
    },
    rowInputs: {
        flexDirection: 'row',
        gap: 8
    },
    batsmenStatsBox: {
        padding: 8,
        borderRadius: 8,
        gap: 4
    },
    statsTitle: {
        fontSize: 10,
        fontWeight: '700'
    },
    statsDetailsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12
    },
    statItemText: {
        fontSize: 11,
        fontWeight: '600'
    },
    activeBallLabel: {
        fontSize: 10.5,
        fontWeight: '800'
    },
    timelineScroll: {
        flexDirection: 'row',
        gap: 8,
        paddingVertical: 2
    },
    ballChip: {
        width: 48,
        height: 52,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2
    },
    ballChipSelectedBar: {
        position: 'absolute',
        left: 8,
        right: 8,
        bottom: 5,
        height: 3,
        borderRadius: 2
    },
    ballChipText: {
        fontSize: 14,
        fontWeight: '900'
    },
    ballSubText: {
        fontSize: 9.5,
        fontWeight: '700'
    },
    ballActionPanel: {
        padding: 10,
        borderRadius: 10,
        gap: 8
    },
    ballActionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    ballActionTitle: {
        fontSize: 12,
        fontWeight: '800'
    },
    scoredIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6
    },
    scoredIndicatorText: {
        fontSize: 10,
        fontWeight: '700'
    },
    outcomesRow: {
        flexDirection: 'row',
        gap: 6
    },
    outcomeBtn: {
        flex: 1,
        height: Layout.buttonHeight,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center'
    },
    outcomeBtnText: {
        fontSize: 12,
        fontWeight: '800'
    },
    extrasRow: {
        flexDirection: 'row',
        gap: 6
    },
    extraBtn: {
        flex: 1,
        height: Layout.buttonHeight,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center'
    },
    extraBtnText: {
        fontSize: 11,
        fontWeight: '800'
    }
});
