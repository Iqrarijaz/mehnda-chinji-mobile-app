import React, { useState } from 'react';
import { Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';

const PRESETS = [
    { label: '30 days', days: 30 },
    { label: '60 days', days: 60 },
    { label: '90 days', days: 90 },
    { label: '1 year', days: 365 },
];

interface QuranGoalModalProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (days: number) => void;
    onClearGoal?: () => void;
    hasActiveGoal?: boolean;
}

/** Simple preset picker for "Complete the Quran in X days". */
export function QuranGoalModal({ visible, onClose, onSelect, onClearGoal, hasActiveGoal }: QuranGoalModalProps) {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const [selected, setSelected] = useState<number | null>(null);

    const handleConfirm = () => {
        if (selected == null) return;
        onSelect(selected);
        setSelected(null);
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={[styles.sheet, { backgroundColor: colors.card }]}>
                    <View style={styles.headerRow}>
                        <ThemedText style={[styles.title, { color: colors.text }]}>Set a Reading Goal</ThemedText>
                        <TouchableOpacity onPress={onClose} hitSlop={10}>
                            <Ionicons name="close" size={22} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>
                    <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
                        How many days do you want to complete the Quran in?
                    </ThemedText>

                    <View style={styles.grid}>
                        {PRESETS.map((p) => {
                            const isActive = selected === p.days;
                            return (
                                <TouchableOpacity
                                    key={p.days}
                                    onPress={() => setSelected(p.days)}
                                    style={[
                                        styles.preset,
                                        { backgroundColor: isActive ? colors.primary : colors.cardBg },
                                    ]}
                                >
                                    <ThemedText style={[styles.presetText, { color: isActive ? '#FFFFFF' : colors.text }]}>
                                        {p.label}
                                    </ThemedText>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    <TouchableOpacity
                        style={[styles.confirmBtn, { backgroundColor: selected != null ? colors.primary : colors.border }]}
                        onPress={handleConfirm}
                        disabled={selected == null}
                    >
                        <ThemedText style={styles.confirmBtnText}>Start Goal</ThemedText>
                    </TouchableOpacity>

                    {hasActiveGoal && onClearGoal && (
                        <TouchableOpacity style={styles.clearBtn} onPress={onClearGoal}>
                            <ThemedText style={[styles.clearBtnText, { color: '#EF4444' }]}>Remove current goal</ThemedText>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    sheet: {
        borderTopLeftRadius: Layout.headerBorderRadius,
        borderTopRightRadius: Layout.headerBorderRadius,
        padding: 20,
        paddingBottom: 32,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    title: { fontSize: 16.5, fontWeight: '800' },
    subtitle: { fontSize: 12.5, lineHeight: 19, marginBottom: 20 },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 20,
    },
    preset: {
        flexBasis: '47%',
        flexGrow: 1,
        paddingVertical: 14,
        borderRadius: Layout.borderRadius,
        alignItems: 'center',
    },
    presetText: { fontSize: 13.5, fontWeight: '700' },
    confirmBtn: {
        height: 50,
        borderRadius: Layout.borderRadius,
        alignItems: 'center',
        justifyContent: 'center',
    },
    confirmBtnText: { color: '#FFFFFF', fontSize: 13.5, fontWeight: '700' },
    clearBtn: { alignItems: 'center', marginTop: 16, padding: 6 },
    clearBtnText: { fontSize: 12, fontWeight: '700' },
});
