import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';

type UnitType = 'marla' | 'kanal' | 'acre' | 'sqft' | 'sqmeter' | 'gaj' | 'karam';

interface UnitConverterProps {
    inputValue: string;
    setInputValue: (val: string) => void;
    fromUnit: UnitType;
    setFromUnit: (unit: UnitType) => void;
    toUnit: UnitType;
    setToUnit: (unit: UnitType) => void;
    handleSwap: () => void;
    lang: 'en' | 'ur';
    colors: any;
}

const UNIT_LABELS = {
    en: {
        marla: 'Marla (مرلہ)',
        kanal: 'Kanal (کنال)',
        acre: 'Acre / Killa (ایکڑ)',
        sqft: 'Square Feet (فٹ)',
        sqmeter: 'Square Meter (میٹر)',
        gaj: 'Gaj / Gaz (گز)',
        karam: 'Karam (کرم)',
    },
    ur: {
        marla: 'مرلہ (Marla)',
        kanal: 'کنال (Kanal)',
        acre: 'ایکڑ / کلا (Acre)',
        sqft: 'مربع فٹ (Sq Ft)',
        sqmeter: 'مربع میٹر (Sq Meter)',
        gaj: 'گز (Gaj)',
        karam: 'کرم (Karam)',
    }
};

const UNIT_SHORT = {
    en: {
        marla: 'Marla',
        kanal: 'Kanal',
        acre: 'Acre',
        sqft: 'Sq Ft',
        sqmeter: 'Sq M',
        gaj: 'Gaj',
        karam: 'Karam',
    },
    ur: {
        marla: 'مرلہ',
        kanal: 'کنال',
        acre: 'ایکڑ',
        sqft: 'فٹ',
        sqmeter: 'میٹر',
        gaj: 'گز',
        karam: 'کرم',
    }
};

const TRANSLATIONS = {
    en: {
        enterValue: 'Enter Value:',
        fromUnit: 'From Unit',
        toUnit: 'To Unit',
        selectFromUnit: 'Select From Unit:',
        selectToUnit: 'Select To Unit:',
    },
    ur: {
        enterValue: 'قیمت درج کریں:',
        fromUnit: 'اس یونٹ سے',
        toUnit: 'اس یونٹ میں',
        selectFromUnit: 'پہلا یونٹ منتخب کریں:',
        selectToUnit: 'دوسرا یونٹ منتخب کریں:',
    }
};

export const UnitConverter = React.memo(function UnitConverter({
    inputValue,
    setInputValue,
    fromUnit,
    setFromUnit,
    toUnit,
    setToUnit,
    handleSwap,
    lang,
    colors
}: UnitConverterProps) {
    const t = TRANSLATIONS[lang];
    const unitLabels = UNIT_LABELS[lang];
    const unitShort = UNIT_SHORT[lang];
    const isUrdu = lang === 'ur';

    const [showFromPicker, setShowFromPicker] = useState(false);
    const [showToPicker, setShowToPicker] = useState(false);

    const urduStyle = {
        fontFamily: isUrdu ? 'NotoNastaliqUrdu-Regular' : undefined,
        lineHeight: isUrdu ? 24 : undefined,
        textAlign: isUrdu ? 'right' as const : 'left' as const,
    };

    const urduPillStyle = {
        fontFamily: isUrdu ? 'NotoNastaliqUrdu-Regular' : undefined,
        lineHeight: isUrdu ? 22 : undefined,
        paddingBottom: isUrdu ? 4 : 0,
    };

    return (
        <View style={styles.container}>
            {/* Input value */}
            <View style={[
                styles.inputGroup,
                {
                    backgroundColor: colors.card,
                    paddingVertical: isUrdu ? 12 : 10,
                    paddingHorizontal: isUrdu ? 18 : 16
                }
            ]}>
                <ThemedText style={[styles.inputLabel, { color: colors.textSecondary, textAlign: isUrdu ? 'right' : 'left' }, urduStyle]}>
                    {t.enterValue}
                </ThemedText>
                <TextInput
                    style={[styles.mainInput, { color: colors.text, textAlign: isUrdu ? 'right' : 'left' }]}
                    value={inputValue}
                    onChangeText={setInputValue}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={colors.textSecondary}
                />
            </View>

            {/* Dropdown pickers layout */}
            <View style={[styles.pickersRow, isUrdu && { flexDirection: 'row-reverse' }]}>
                <TouchableOpacity
                    onPress={() => {
                        setShowFromPicker(!showFromPicker);
                        setShowToPicker(false);
                    }}
                    style={[
                        styles.pickerBox,
                        {
                            backgroundColor: colors.card,
                            paddingVertical: isUrdu ? 12 : 10,
                            paddingHorizontal: isUrdu ? 14 : 12
                        }
                    ]}
                >
                    <ThemedText style={[styles.pickerSub, { color: colors.textSecondary, textAlign: isUrdu ? 'right' : 'left' }, urduStyle]}>
                        {t.fromUnit}
                    </ThemedText>
                    <View style={[styles.pickerInner, isUrdu && { flexDirection: 'row-reverse' }]}>
                        <ThemedText style={[styles.pickerValue, { color: colors.text }, urduPillStyle]}>
                            {unitShort[fromUnit]}
                        </ThemedText>
                        <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
                    </View>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={handleSwap}
                    style={[styles.swapButton, { backgroundColor: colors.primary + '12' }]}
                >
                    <Ionicons name="swap-horizontal" size={20} color={colors.primary} />
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => {
                        setShowToPicker(!showToPicker);
                        setShowFromPicker(false);
                    }}
                    style={[
                        styles.pickerBox,
                        {
                            backgroundColor: colors.card,
                            paddingVertical: isUrdu ? 12 : 10,
                            paddingHorizontal: isUrdu ? 14 : 12
                        }
                    ]}
                >
                    <ThemedText style={[styles.pickerSub, { color: colors.textSecondary, textAlign: isUrdu ? 'right' : 'left' }, urduStyle]}>
                        {t.toUnit}
                    </ThemedText>
                    <View style={[styles.pickerInner, isUrdu && { flexDirection: 'row-reverse' }]}>
                        <ThemedText style={[styles.pickerValue, { color: colors.text }, urduPillStyle]}>
                            {unitShort[toUnit]}
                        </ThemedText>
                        <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
                    </View>
                </TouchableOpacity>
            </View>

            {/* Picker lists */}
            {showFromPicker && (
                <View style={[styles.pickerList, { backgroundColor: colors.card, padding: isUrdu ? 16 : 14 }]}>
                    <ThemedText style={[styles.pickerListTitle, { textAlign: isUrdu ? 'right' : 'left' }, urduStyle]}>
                        {t.selectFromUnit}
                    </ThemedText>
                    {Object.keys(unitLabels).map((unitKey) => (
                        <TouchableOpacity
                            key={unitKey}
                            style={[
                                styles.pickerItem,
                                isUrdu && { alignItems: 'flex-end' },
                                { paddingVertical: isUrdu ? 14 : 12 }
                            ]}
                            onPress={() => {
                                setFromUnit(unitKey as UnitType);
                                setShowFromPicker(false);
                            }}
                        >
                            <ThemedText style={[{ color: fromUnit === unitKey ? colors.primary : colors.text, fontWeight: fromUnit === unitKey ? '700' : 'normal' }, urduPillStyle]}>
                                {unitLabels[unitKey as UnitType]}
                            </ThemedText>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {showToPicker && (
                <View style={[styles.pickerList, { backgroundColor: colors.card, padding: isUrdu ? 16 : 14 }]}>
                    <ThemedText style={[styles.pickerListTitle, { textAlign: isUrdu ? 'right' : 'left' }, urduStyle]}>
                        {t.selectToUnit}
                    </ThemedText>
                    {Object.keys(unitLabels).map((unitKey) => (
                        <TouchableOpacity
                            key={unitKey}
                            style={[
                                styles.pickerItem,
                                isUrdu && { alignItems: 'flex-end' },
                                { paddingVertical: isUrdu ? 14 : 12 }
                            ]}
                            onPress={() => {
                                setToUnit(unitKey as UnitType);
                                setShowToPicker(false);
                            }}
                        >
                            <ThemedText style={[{ color: toUnit === unitKey ? colors.primary : colors.text, fontWeight: toUnit === unitKey ? '700' : 'normal' }, urduPillStyle]}>
                                {unitLabels[unitKey as UnitType]}
                            </ThemedText>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    inputGroup: {
        borderRadius: 16,
        marginBottom: 14,
    },
    inputLabel: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    mainInput: {
        fontSize: 26,
        fontWeight: '700',
        padding: 0,
    },
    pickersRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
    },
    pickerBox: {
        flex: 1,
        borderRadius: 14,
    },
    pickerSub: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    pickerInner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    pickerValue: {
        fontSize: 15,
        fontWeight: '600',
    },
    swapButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 8,
    },
    pickerList: {
        borderRadius: 14,
        marginBottom: 14,
    },
    pickerListTitle: {
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 8,
        opacity: 0.85,
    },
    pickerItem: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
});
