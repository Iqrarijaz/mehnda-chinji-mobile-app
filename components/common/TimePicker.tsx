import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import {
    Modal,
    Platform,
    StyleSheet,
    TouchableOpacity,
    View } from 'react-native';
import { FlashList } from '@shopify/flash-list';

import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';
import { ThemedText } from '../ThemedText';

interface TimePickerProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (time: string) => void;
    title: string;
    currentValue?: string;
}

export const TimePicker = React.memo(function TimePicker({
    visible,
    onClose,
    onSelect,
    title,
    currentValue
}: TimePickerProps) {
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];

    const [hour, setHour] = useState('06');
    const [minute, setMinute] = useState('00');
    const [period, setPeriod] = useState('AM');

    useEffect(() => {
        if (currentValue && currentValue.includes(':')) {
            try {
                const [time, p] = currentValue.split(' ');
                const [h, m] = time.split(':');
                if (h && m && p) {
                    setHour(h);
                    setMinute(m);
                    setPeriod(p);
                }
            } catch (e) {
                console.log('Error parsing time:', e);
            }
        }
    }, [currentValue, visible]);

    const handleConfirm = () => {
        onSelect(`${hour}:${minute} ${period}`);
        onClose();
    };

    const renderColumn = (data: string[], value: string, setValue: (v: string) => void, flex: number) => (
        <View style={{ flex }}>
            <FlashList
                data={data}
                keyExtractor={(item) => item}
                showsVerticalScrollIndicator={false}
                snapToInterval={48}
                decelerationRate="fast"
                renderItem={({ item }) => {
                    const isSelected = value === item;
                    return (
                        <TouchableOpacity
                            onPress={() => setValue(item)}
                            activeOpacity={0.7}
                            style={[
                                styles.optionItem,
                                isSelected && {
                                    backgroundColor: '#0D9488' + '18',
                                    borderRadius: Layout.borderRadius }
                            ]}
                        >
                            <ThemedText style={[
                                styles.optionText,
                                { color: colors.textSecondary },
                                isSelected && { color: '#0D9488', fontWeight: '900', fontSize: 18.5 }
                            ]}>
                                {item}
                            </ThemedText>
                        </TouchableOpacity>
                    );
                }}
                contentContainerStyle={{ paddingVertical: 84 }}
            />
        </View>
    );

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <TouchableOpacity style={styles.backdropTap} onPress={onClose} activeOpacity={1} />

                <View style={[styles.sheet, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}>
                    {/* Drag handle */}
                    <View style={styles.handle} />

                    {/* Header row — title left, close right */}
                    <View style={styles.headerRow}>
                        <View style={{ flex: 1 }}>
                            <ThemedText style={[styles.sheetTitle, { color: colors.text }]}>{title}</ThemedText>
                            <ThemedText style={[styles.sheetSubtitle, { color: colors.textSecondary }]}>
                                Scroll to select time
                            </ThemedText>
                        </View>

                        <TouchableOpacity
                            onPress={onClose}
                            style={[styles.closeBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}
                        >
                            <Ionicons name="close" size={20} color={colors.text} />
                        </TouchableOpacity>
                    </View>


                    {/* Scroll columns */}
                    <View style={styles.pickerContainer}>
                        {renderColumn(hours, hour, setHour, 1)}

                        <View style={styles.separatorWrap}>
                            <ThemedText style={[styles.separator, { color: '#0D9488' }]}>:</ThemedText>
                        </View>

                        {renderColumn(minutes, minute, setMinute, 1)}

                        <View style={{ width: 16 }} />

                        {renderColumn(periods, period, setPeriod, 0.8)}
                    </View>


                    {/* Confirm button — same design as ThankYou modal */}
                    <View style={{ alignItems: 'center' }}>
                        <TouchableOpacity
                            style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
                            onPress={handleConfirm}
                            activeOpacity={0.85}
                        >
                            <ThemedText style={styles.confirmText}>Confirm</ThemedText>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.55)',
        justifyContent: 'flex-end' },
    backdropTap: {
        flex: 1 },

    // ── Bottom Sheet ──────────────────────────────────────────────────────
    sheet: {
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingHorizontal: 20,
        paddingBottom: Platform.OS === 'android' ? 28 : 40,
        paddingTop: 10 },
    handle: {
        width: 40,
        height: 4,
        borderRadius: Layout.borderRadius,
        backgroundColor: 'rgba(148,163,184,0.4)',
        alignSelf: 'center',
        marginBottom: 20 },

    // ── Header ────────────────────────────────────────────────────────────
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 4 },
    sheetTitle: {
        fontSize: 15.5,
        fontWeight: '800',
        letterSpacing: 0.2 },
    sheetSubtitle: {
        fontSize: 10,
        marginTop: 2,
        fontWeight: '500' },
    closeBtn: {
        width: 36,
        height: 36,
        borderRadius: Layout.borderRadius,
        justifyContent: 'center',
        alignItems: 'center' },
    accentRule: {
        height: 2,
        borderRadius: Layout.borderRadius,
        backgroundColor: '#0D9488',
        width: 36,
        marginBottom: 14 },

    // ── Preview badge (standalone, above scroll) ─────────────────────────
    previewRow: {
        alignItems: 'center',
        marginVertical: 10 },
    previewBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 7,
        borderRadius: Layout.borderRadius },
    previewText: {
        fontSize: 16.5,
        fontWeight: '800',
        color: '#0D9488',
        letterSpacing: 1 },

    // ── Scroll columns ────────────────────────────────────────────────────
    pickerContainer: {
        height: 300,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16 },
    optionItem: {
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 2 },
    optionText: {
        fontSize: 15.5,
        fontWeight: '600' },
    separatorWrap: {
        height: 48,
        justifyContent: 'center',
        paddingBottom: 2 },
    separator: {
        fontSize: 22,
        fontWeight: '800',
        marginHorizontal: 4 },

    // ── Confirm button (ThankYou modal style) ────────────────────────────
    confirmBtn: {
        width: 120,
        height: 40,
        borderRadius: Layout.borderRadius,
        justifyContent: 'center',
        alignItems: 'center' },
    confirmText: {
        color: '#FFFFFF',
        fontSize: 12.5,
        fontWeight: '600' } });
