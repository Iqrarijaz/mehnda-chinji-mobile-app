import React from 'react';
import { Modal, View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { Layout } from '@/constants/layout';

interface AyahActionsModalProps {
    visible: boolean;
    onClose: () => void;
    verseLabel: string;        // e.g. "Al-Fatiha · Verse 2"
    arabicPreview: string;
    isBookmarked: boolean;
    onToggleBookmark: () => void;
    onShareText: () => void;
    onShareImage: () => void;
}

export function AyahActionsModal({
    visible,
    onClose,
    verseLabel,
    arabicPreview,
    isBookmarked,
    onToggleBookmark,
    onShareText,
    onShareImage }: AyahActionsModalProps) {
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];

    const Row = ({ icon, label, color, onPress }: { icon: any; label: string; color?: string; onPress: () => void }) => (
        <TouchableOpacity
            style={[styles.row, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}
            onPress={() => { onPress(); onClose(); }}
            activeOpacity={0.7}
        >
            <Ionicons name={icon} size={20} color={color || colors.primary} style={{ marginRight: 14 }} />
            <ThemedText style={[styles.rowText, { color: colors.text }]}>{label}</ThemedText>
        </TouchableOpacity>
    );

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
                <TouchableOpacity activeOpacity={1} style={[styles.sheet, { backgroundColor: colors.background }]}>
                    <View style={styles.handle} />

                    <ThemedText style={[styles.label, { color: colors.textSecondary }]} numberOfLines={1}>{verseLabel}</ThemedText>
                    <ThemedText style={[styles.arabic, { color: colors.text }]} numberOfLines={2}>{arabicPreview}</ThemedText>

                    <View style={{ gap: 8, marginTop: 12 }}>
                        <Row
                            icon={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                            label={isBookmarked ? 'Remove Bookmark' : 'Bookmark this Ayah'}
                            color={isBookmarked ? colors.secondary : colors.primary}
                            onPress={onToggleBookmark}
                        />
                        <Row icon="text-outline" label="Share as Text" onPress={onShareText} />
                        <Row icon="image-outline" label="Share as Image" onPress={onShareImage} />
                    </View>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'flex-end' },
    sheet: {
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingHorizontal: 20,
        paddingBottom: Platform.OS === 'ios' ? 34 : 20,
        paddingTop: 10 },
    handle: {
        alignSelf: 'center',
        width: 40,
        height: 4,
        borderRadius: Layout.borderRadius,
        backgroundColor: 'rgba(128,128,128,0.4)',
        marginBottom: 14 },
    label: { fontSize: 12, fontWeight: '700', marginBottom: 6 },
    arabic: {
        fontSize: 20,
        lineHeight: 38,
        textAlign: 'right',
        writingDirection: 'rtl',
        fontWeight: '500' },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: Layout.borderRadius },
    rowText: { fontSize: 15, fontWeight: '600' } });
