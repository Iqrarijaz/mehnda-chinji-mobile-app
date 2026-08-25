import React, { useRef, useState } from 'react';
import { Modal, View, TouchableOpacity, StyleSheet, PanResponder, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { FONT_SIZE_MIN, FONT_SIZE_MAX } from '@/utils/quranPrefs';
import { Layout } from '@/constants/layout';

interface FontSliderProps {
    value: number;
    onChange: (v: number) => void;
    trackColor: string;
    fillColor: string;
}

/** Pure-JS slider (no native dependency) for the Arabic font size. */
const FontSlider = React.memo(({ value, onChange, trackColor, fillColor }: FontSliderProps) => {
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
            onPanResponderMove: (e) => onChangeRef.current(toValue(e.nativeEvent.locationX)) }),
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
                <View style={[styles.sliderThumb, { left: pct as any }]} />
            </View>
        </View>
    );
});

interface QuranSettingsModalProps {
    visible: boolean;
    onClose: () => void;
    fontSize: number;
    onFontSize: (v: number) => void;
}

export const QuranSettingsModal: React.FC<QuranSettingsModalProps> = React.memo(({
    visible,
    onClose,
    fontSize,
    onFontSize }: QuranSettingsModalProps) => {
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
                                <ThemedText style={[styles.stepText, { color: colors.primary, fontSize: 12.5 }]}>A</ThemedText>
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
                                <ThemedText style={[styles.stepText, { color: colors.primary, fontSize: 18.5 }]}>A</ThemedText>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
});

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'flex-end' },
    sheet: {
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingHorizontal: 16,
        paddingBottom: Platform.OS === 'ios' ? 34 : 20,
        paddingTop: 8 },
    handle: {
        alignSelf: 'center',
        width: 40,
        height: 4,
        borderRadius: Layout.borderRadius,
        backgroundColor: 'rgba(128,128,128,0.4)',
        marginBottom: 12 },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8 },
    title: { fontSize: 14.5, fontWeight: '800' },
    section: { paddingVertical: 11 },
    sectionLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12 },
    sectionLabel: { fontSize: 12.5, fontWeight: '700' },
    hint: { fontSize: 10.5, marginTop: 3 },
    valuePill: {
        fontSize: 10.5,
        fontWeight: '800',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: Layout.borderRadius,
        overflow: 'hidden' },
    preview: {
        textAlign: 'center',
        writingDirection: 'rtl',
        marginVertical: 14,
        fontWeight: '500' },
    sliderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12 },
    stepBtn: {
        width: 40,
        height: 40,
        borderRadius: Layout.borderRadius,
        alignItems: 'center',
        justifyContent: 'center' },
    stepText: { fontWeight: '800' },
    sliderHitArea: {
        flex: 1,
        height: 40,
        justifyContent: 'center' },
    sliderTrack: {
        height: 6,
        borderRadius: Layout.borderRadius,
        justifyContent: 'center' },
    sliderFill: {
        height: 6,
        borderRadius: Layout.borderRadius },
    sliderThumb: {
        position: 'absolute',
        width: 22,
        height: 22,
        borderRadius: Layout.borderRadius,
        backgroundColor: '#FFFFFF',
        marginLeft: -11,
        top: -8 } });
