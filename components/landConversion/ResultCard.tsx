import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';

type UnitType = 'marla' | 'kanal' | 'acre' | 'sqft' | 'sqmeter' | 'gaj' | 'karam';

interface ResultCardProps {
    inputValue: string;
    fromUnit: UnitType;
    toUnit: UnitType;
    activeResult: number;
    equivalentsList: Array<{ unit: UnitType; label: string; value: number }>;
    visualComparison: string;
    lang: 'en' | 'ur';
    isFavorite: boolean;
    toggleFavorite: () => void;
    handleSaveHistory: () => void;
    handleCopy: () => void;
    handleShare: () => void;
    colors: any;
}

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
        result: 'Result',
        physicalScale: 'Physical Scale',
        equivalentsTitle: 'Equivalents in Other Units',
    },
    ur: {
        result: 'نتیجہ',
        physicalScale: 'مادی پیمانہ (اندازہ)',
        equivalentsTitle: 'دوسرے یونٹس میں پیمائش',
    }
};

export const ResultCard = React.memo(function ResultCard({
    inputValue,
    fromUnit,
    toUnit,
    activeResult,
    equivalentsList,
    visualComparison,
    lang,
    isFavorite,
    toggleFavorite,
    handleSaveHistory,
    handleCopy,
    handleShare,
    colors
}: ResultCardProps) {
    const t = TRANSLATIONS[lang];
    const unitShort = UNIT_SHORT[lang];
    const isUrdu = lang === 'ur';

    const urduStyle = {
        fontFamily: isUrdu ? 'NotoNastaliqUrdu-Regular' : undefined,
        lineHeight: isUrdu ? 24 : undefined,
        textAlign: isUrdu ? 'right' as const : 'left' as const,
    };

    const urduPillStyle = {
        fontFamily: isUrdu ? 'NotoNastaliqUrdu-Regular' : undefined,
        lineHeight: isUrdu ? 22 : undefined,
        paddingBottom: isUrdu ? 4 : 0,
        textAlign: isUrdu ? 'right' as const : 'left' as const,
    };

    return (
        <View style={styles.container}>
            {/* Main Result Flat Card */}
            <View style={[
                styles.resultCard,
                { backgroundColor: colors.card, padding: isUrdu ? 18 : 16 }
            ]}>
                <View style={[styles.resultHeader, isUrdu && { flexDirection: 'row-reverse' }]}>
                    <ThemedText style={[styles.resultLabel, { color: colors.textSecondary, textAlign: isUrdu ? 'right' : 'left' }, urduStyle]}>
                        {t.result}
                    </ThemedText>
                    <View style={[styles.resultActions, isUrdu && { flexDirection: 'row-reverse' }]}>
                        <TouchableOpacity onPress={toggleFavorite} style={styles.resultActionBtn}>
                            <Ionicons name={isFavorite ? 'bookmark' : 'bookmark-outline'} size={18} color={isFavorite ? colors.primary : colors.textSecondary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleSaveHistory} style={styles.resultActionBtn}>
                            <Ionicons name="save-outline" size={18} color={colors.textSecondary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleCopy} style={styles.resultActionBtn}>
                            <Ionicons name="copy-outline" size={18} color={colors.textSecondary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleShare} style={styles.resultActionBtn}>
                            <Ionicons name="share-social-outline" size={18} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>
                </View>
                <ThemedText style={[styles.resultValue, { color: colors.primary, textAlign: isUrdu ? 'right' : 'left' }]}>
                    {isUrdu ? (
                        <>
                            <ThemedText style={[{ fontSize: 18, color: colors.text }, urduPillStyle]}>{unitShort[toUnit]}</ThemedText>
                            <ThemedText style={{ fontSize: 32, fontWeight: '800' }}> {activeResult}</ThemedText>
                        </>
                    ) : (
                        <>
                            <ThemedText style={{ fontSize: 32, fontWeight: '800' }}>{activeResult}</ThemedText>
                            <ThemedText style={[{ fontSize: 18, color: colors.text }]}> {unitShort[toUnit]}</ThemedText>
                        </>
                    )}
                </ThemedText>
                <ThemedText style={[styles.resultFormula, { color: colors.textSecondary, textAlign: isUrdu ? 'right' : 'left' }, urduStyle]}>
                    {inputValue} {unitShort[fromUnit]} = {activeResult} {unitShort[toUnit]}
                </ThemedText>
            </View>

            {/* Visual Comparison / Physical Scale description */}
            {visualComparison ? (
                <View style={[
                    styles.comparisonCard,
                    { backgroundColor: colors.primary + '07', padding: isUrdu ? 14 : 12 }
                ]}>
                    <View style={[styles.comparisonHeaderRow, isUrdu && { flexDirection: 'row-reverse' }]}>
                        <ThemedText style={[styles.comparisonHeader, { color: colors.primary, textAlign: isUrdu ? 'right' : 'left' }, urduStyle]}>
                            💡 {t.physicalScale}
                        </ThemedText>
                    </View>
                    <ThemedText style={[styles.comparisonText, { color: colors.text, textAlign: isUrdu ? 'right' : 'left' }, urduStyle]}>
                        {visualComparison}
                    </ThemedText>
                </View>
            ) : null}

            {/* Equivalents in other units */}
            {equivalentsList.length > 0 && (
                <View style={styles.equivalentsSection}>
                    <ThemedText style={[styles.sectionLabel, { color: colors.textSecondary, textAlign: isUrdu ? 'right' : 'left' }, urduStyle]}>
                        {t.equivalentsTitle}
                    </ThemedText>
                    <View style={[styles.equivalentsGrid, isUrdu && { flexDirection: 'row-reverse' }]}>
                        {equivalentsList.map((eq) => (
                            <View key={eq.unit} style={[
                                styles.eqCard,
                                {
                                    backgroundColor: colors.card,
                                    paddingVertical: isUrdu ? 10 : 8,
                                    paddingHorizontal: isUrdu ? 12 : 10
                                }
                            ]}>
                                <ThemedText style={[styles.eqValue, { color: colors.text }]}>
                                    {eq.value}
                                </ThemedText>
                                <ThemedText style={[styles.eqLabel, { color: colors.textSecondary }, urduPillStyle]}>
                                    {unitShort[eq.unit]}
                                </ThemedText>
                            </View>
                        ))}
                    </View>
                </View>
            )}
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    resultCard: {
        borderRadius: 16,
        marginBottom: 14,
    },
    resultHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    resultLabel: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    resultActions: {
        flexDirection: 'row',
        gap: 12,
    },
    resultActionBtn: {
        padding: 4,
    },
    resultValue: {
        fontSize: 32,
        fontWeight: '800',
        marginBottom: 4,
    },
    resultFormula: {
        fontSize: 12,
    },
    comparisonCard: {
        borderRadius: 12,
        marginBottom: 16,
    },
    comparisonHeaderRow: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    comparisonHeader: {
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    comparisonText: {
        fontSize: 13,
        lineHeight: 18,
        fontWeight: '500',
    },
    equivalentsSection: {
        marginTop: 4,
        marginBottom: 16,
    },
    sectionLabel: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.5,
        marginBottom: 10,
        textTransform: 'uppercase',
    },
    equivalentsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    eqCard: {
        flex: 1,
        minWidth: '28%',
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    eqValue: {
        fontSize: 14,
        fontWeight: '700',
        textAlign: 'center',
    },
    eqLabel: {
        fontSize: 10,
        marginTop: 2,
        textAlign: 'center',
    },
});
