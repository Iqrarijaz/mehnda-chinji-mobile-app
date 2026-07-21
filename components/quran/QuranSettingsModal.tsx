import React, { useRef, useState } from 'react';
import { Modal, View, TouchableOpacity, StyleSheet, PanResponder, Switch, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { FONT_SIZE_MIN, FONT_SIZE_MAX } from '@/utils/quranPrefs';
import { TAJWEED_LEGEND } from '@/utils/tajweed';

interface FontSliderProps {
    value: number;
    onChange: (v: number) => void;
    trackColor: string;
    fillColor: string;
}

/** Pure-JS slider (no native dependency) for the Arabic font size. */
function FontSlider({ value, onChange, trackColor, fillColor }: FontSliderProps) {
    const widthRef = useRef(0);
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    const toValue = (x: number) => {
        const w = widthRef.current || 1;
        const ratio = Math.max(0, Math.min(1, x / w));
        return Math.round(FONT_SIZE_MIN + ratio * (FONT_SIZE_MAX - FONT_SIZE_MIN));
    };

    const pan = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: (e) => onChangeRef.current(toValue(e.nativeEvent.locationX)),
            onPanResponderMove: (e) => onChangeRef.current(toValue(e.nativeEvent.locationX)),
        }),
    ).current;

    const ratio = (value - FONT_SIZE_MIN) / (FONT_SIZE_MAX - FONT_SIZE_MIN);
    const pct = `${Math.max(0, Math.min(1, ratio)) * 100}%`;

    return (
        <View
            style={styles.sliderHitArea}
            onLayout={(e) => (widthRef.current = e.nativeEvent.layout.width)}
            {...pan.panHandlers}
        >
            <View style={[styles.sliderTrack, { backgroundColor: trackColor }]}>
                <View style={[styles.sliderFill, { width: pct as any, backgroundColor: fillColor }]} />
                <View style={[styles.sliderThumb, { left: pct as any, borderColor: fillColor }]} />
            </View>
        </View>
    );
}

interface QuranSettingsModalProps {
    visible: boolean;
    onClose: () => void;
    fontSize: number;
    onFontSize: (v: number) => void;
    tajweedEnabled: boolean;
    onTajweed: (v: boolean) => void;
}

export function QuranSettingsModal({
    visible,
    onClose,
    fontSize,
    onFontSize,
    tajweedEnabled,
    onTajweed,
}: QuranSettingsModalProps) {
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];
    const [preview] = useState('إِنَّ ٱللَّهَ مَعَ ٱلصَّٰبِرِينَ');

    const clamp = (v: number) => Math.min(FONT_SIZE_MAX, Math.max(FONT_SIZE_MIN, v));

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
                <TouchableOpacity activeOpacity={1} style={[styles.sheet, { backgroundColor: colors.background }]}>
                    <View style={styles.handle} />
                    <View style={styles.headerRow}>
                        <ThemedText style={[styles.title, { color: colors.text }]}>Reading Settings</ThemedText>
                        <TouchableOpacity onPress={onClose} hitSlop={8}>
                            <Ionicons name="close" size={22} color={colors.icon} />
                        </TouchableOpacity>
                    </View>

                    {/* Font size */}
                    <View style={styles.section}>
                        <View style={styles.sectionLabelRow}>
                            <ThemedText style={[styles.sectionLabel, { color: colors.text }]}>Arabic Font Size</ThemedText>
                            <ThemedText style={[styles.valuePill, { color: colors.primary, backgroundColor: `${colors.primary}14` }]}>
                                {fontSize}px
                            </ThemedText>
                        </View>

                        <ThemedText
                            style={[styles.preview, { color: colors.text, fontSize, lineHeight: fontSize * 1.9 }]}
                            numberOfLines={1}
                        >
                            {preview}
                        </ThemedText>

                        <View style={styles.sliderRow}>
                            <TouchableOpacity
                                onPress={() => onFontSize(clamp(fontSize - 2))}
                                style={[styles.stepBtn, { backgroundColor: `${colors.primary}14` }]}
                            >
                                <ThemedText style={[styles.stepText, { color: colors.primary, fontSize: 14 }]}>A</ThemedText>
                            </TouchableOpacity>

                            <FontSlider
                                value={fontSize}
                                onChange={(v) => onFontSize(clamp(v))}
                                trackColor={isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'}
                                fillColor={colors.primary}
                            />

                            <TouchableOpacity
                                onPress={() => onFontSize(clamp(fontSize + 2))}
                                style={[styles.stepBtn, { backgroundColor: `${colors.primary}14` }]}
                            >
                                <ThemedText style={[styles.stepText, { color: colors.primary, fontSize: 22 }]}>A</ThemedText>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Tajweed */}
                    <View style={[styles.section, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, paddingTop: 18 }]}>
                        <View style={styles.sectionLabelRow}>
                            <View style={{ flex: 1 }}>
                                <ThemedText style={[styles.sectionLabel, { color: colors.text }]}>Tajweed Highlighting</ThemedText>
                                <ThemedText style={[styles.hint, { color: colors.icon }]}>
                                    Colour-codes ghunnah, qalqalah and madd.
                                </ThemedText>
                            </View>
                            <Switch
                                value={tajweedEnabled}
                                onValueChange={onTajweed}
                                trackColor={{ false: isDark ? '#3A3A3C' : '#E5E7EB', true: colors.primary }}
                                thumbColor={Platform.OS === 'android' ? (tajweedEnabled ? '#FFFFFF' : '#FFFFFF') : undefined}
                            />
                        </View>

                        {tajweedEnabled && (
                            <View style={styles.legendRow}>
                                {TAJWEED_LEGEND.map((l) => (
                                    <View key={l.label} style={styles.legendItem}>
                                        <View style={[styles.legendDot, { backgroundColor: l.color }]} />
                                        <ThemedText style={[styles.legendText, { color: colors.textSecondary }]}>{l.label}</ThemedText>
                                    </View>
                                ))}
                            </View>
                        )}
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
        justifyContent: 'flex-end',
    },
    sheet: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 20,
        paddingBottom: Platform.OS === 'ios' ? 34 : 20,
        paddingTop: 10,
    },
    handle: {
        alignSelf: 'center',
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(128,128,128,0.4)',
        marginBottom: 12,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    title: { fontSize: 17, fontWeight: '800' },
    section: { paddingVertical: 14 },
    sectionLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
    },
    sectionLabel: { fontSize: 14, fontWeight: '700' },
    hint: { fontSize: 12, marginTop: 3 },
    valuePill: {
        fontSize: 12,
        fontWeight: '800',
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 999,
        overflow: 'hidden',
    },
    preview: {
        textAlign: 'center',
        writingDirection: 'rtl',
        marginVertical: 14,
        fontWeight: '500',
    },
    sliderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    stepBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepText: { fontWeight: '800' },
    sliderHitArea: {
        flex: 1,
        height: 40,
        justifyContent: 'center',
    },
    sliderTrack: {
        height: 6,
        borderRadius: 3,
        justifyContent: 'center',
    },
    sliderFill: {
        height: 6,
        borderRadius: 3,
    },
    sliderThumb: {
        position: 'absolute',
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: '#FFFFFF',
        borderWidth: 3,
        marginLeft: -11,
        top: -8,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
    },
});
