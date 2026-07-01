import React from 'react';
import { StyleSheet, View, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';

type CalcUnitType = 'feet' | 'meters' | 'karam';

interface PlotCalculatorProps {
    plotLength: string;
    setPlotLength: (val: string) => void;
    plotWidth: string;
    setPlotWidth: (val: string) => void;
    plotUnit: CalcUnitType;
    setPlotUnit: (unit: CalcUnitType) => void;
    calculatedPlotArea: {
        sqft: number;
        gaj: number;
        marla: number;
        kanal: number;
        acre: number;
    } | null;
    handleCopyPlot: () => void;
    lang: 'en' | 'ur';
    colors: any;
}

const TRANSLATIONS = {
    en: {
        findAreaTitle: 'Find Area from Dimensions',
        feet: 'Feet (فٹ)',
        meters: 'Meters (میٹر)',
        karam: 'Karam (کرم)',
        length: 'Length (لمبائی)',
        width: 'Width (چوڑائی)',
        calculatedArea: 'Calculated Area',
        marlas: 'Marlas',
        plotDimensions: 'Plot dimensions:',
        standardPakConversions: 'Standard Pakistani Conversions',
        kanal: 'Kanal:',
        acre: 'Acre / Killa:',
        sqft: 'Sq Feet:',
        sqgaj: 'Sq Gaj / Yards:',
        ref1Kanal: '1 Kanal',
        ref1KanalVal: '20 Marlas',
        ref1Acre: '1 Acre',
        ref1AcreVal: '8 Kanals / 160 Marlas',
        ref5Marla: '5 Marla',
        ref5MarlaVal: '1,361 Square Feet',
        ref1Karam: '1 Karam',
        ref1KaramVal: '5.5 Feet (30.25 Sq Ft)',
    },
    ur: {
        findAreaTitle: 'لمبائی چوڑائی سے رقبہ معلوم کریں',
        feet: 'فٹ',
        meters: 'میٹر',
        karam: 'کرم',
        length: 'لمبائی',
        width: 'چوڑائی',
        calculatedArea: 'حساب شدہ رقبہ',
        marlas: 'مرلے',
        plotDimensions: 'پلاٹ سائز:',
        standardPakConversions: 'معیاری پاکستانی پیمائشیں',
        kanal: 'کنال:',
        acre: 'ایکڑ / کلا:',
        sqft: 'مربع فٹ:',
        sqgaj: 'مربع گز:',
        ref1Kanal: '1 کنال',
        ref1KanalVal: '20 مرلے',
        ref1Acre: '1 ایکڑ',
        ref1AcreVal: '8 کنال / 160 مرلے',
        ref5Marla: '5 مرلہ',
        ref5MarlaVal: '1,361 مربع فٹ',
        ref1Karam: '1 کرم',
        ref1KaramVal: '5.5 فٹ (30.25 مربع فٹ)',
    }
};

export const PlotCalculator = React.memo(function PlotCalculator({
    plotLength,
    setPlotLength,
    plotWidth,
    setPlotWidth,
    plotUnit,
    setPlotUnit,
    calculatedPlotArea,
    handleCopyPlot,
    lang,
    colors
}: PlotCalculatorProps) {
    const t = TRANSLATIONS[lang];
    const isUrdu = lang === 'ur';

    const urduStyle = {
        fontFamily: isUrdu ? 'NotoNastaliqUrdu-Regular' : undefined,
        lineHeight: isUrdu ? 24 : undefined,
        textAlign: isUrdu ? 'right' as const : 'left' as const,
    };

    const urduPillStyle = {
        fontFamily: isUrdu ? 'NotoNastaliqUrdu-Regular' : undefined,
        lineHeight: isUrdu ? 20 : undefined,
        paddingBottom: isUrdu ? 4 : 0,
    };

    return (
        <View style={styles.container}>
            {/* Input card */}
            <View style={[
                styles.calculatorCard,
                { backgroundColor: colors.card, padding: isUrdu ? 18 : 16 }
            ]}>
                <ThemedText style={[styles.calcTitle, { color: colors.text, textAlign: isUrdu ? 'right' : 'left' }, urduStyle]}>
                    {t.findAreaTitle}
                </ThemedText>

                <View style={[styles.calcUnitRow, isUrdu && { flexDirection: 'row-reverse' }]}>
                    {(['feet', 'meters', 'karam'] as CalcUnitType[]).map((u) => (
                        <TouchableOpacity
                            key={u}
                            onPress={() => setPlotUnit(u)}
                            style={[
                                styles.calcUnitPill,
                                {
                                    backgroundColor: colors.background,
                                    paddingVertical: isUrdu ? 10 : 8
                                },
                                plotUnit === u && { backgroundColor: colors.primary }
                            ]}
                        >
                            <ThemedText style={[styles.calcUnitPillText, { color: colors.textSecondary }, plotUnit === u && { color: '#fff', fontWeight: 'bold' }, urduPillStyle]}>
                                {u === 'feet' ? t.feet : u === 'meters' ? t.meters : t.karam}
                            </ThemedText>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={[styles.calcInputRow, isUrdu && { flexDirection: 'row-reverse' }]}>
                    <View style={styles.calcInputCol}>
                        <ThemedText style={[styles.calcInputLabel, { color: colors.textSecondary, textAlign: isUrdu ? 'right' : 'left' }, urduStyle]}>
                            {t.length}
                        </ThemedText>
                        <TextInput
                            value={plotLength}
                            onChangeText={setPlotLength}
                            keyboardType="numeric"
                            placeholder={isUrdu ? 'لمبائی' : 'Length'}
                            placeholderTextColor={colors.textSecondary}
                            style={[
                                styles.calcInput,
                                {
                                    backgroundColor: colors.background,
                                    color: colors.text,
                                    textAlign: isUrdu ? 'right' : 'left',
                                    height: isUrdu ? 46 : 42,
                                    paddingHorizontal: isUrdu ? 14 : 12
                                }
                            ]}
                        />
                    </View>
                    <View style={styles.calcInputCol}>
                        <ThemedText style={[styles.calcInputLabel, { color: colors.textSecondary, textAlign: isUrdu ? 'right' : 'left' }, urduStyle]}>
                            {t.width}
                        </ThemedText>
                        <TextInput
                            value={plotWidth}
                            onChangeText={setPlotWidth}
                            keyboardType="numeric"
                            placeholder={isUrdu ? 'چوڑائی' : 'Width'}
                            placeholderTextColor={colors.textSecondary}
                            style={[
                                styles.calcInput,
                                {
                                    backgroundColor: colors.background,
                                    color: colors.text,
                                    textAlign: isUrdu ? 'right' : 'left',
                                    height: isUrdu ? 46 : 42,
                                    paddingHorizontal: isUrdu ? 14 : 12
                                }
                            ]}
                        />
                    </View>
                </View>
            </View>

            {/* Calculated Area Result Card */}
            {calculatedPlotArea ? (
                <View style={[
                    styles.resultCard,
                    { backgroundColor: colors.card, marginTop: 16, padding: isUrdu ? 18 : 16 }
                ]}>
                    <View style={[styles.resultHeader, isUrdu && { flexDirection: 'row-reverse' }]}>
                        <ThemedText style={[styles.resultLabel, { color: colors.textSecondary, textAlign: isUrdu ? 'right' : 'left' }, urduStyle]}>
                            {t.calculatedArea}
                        </ThemedText>
                        <TouchableOpacity onPress={handleCopyPlot} style={styles.resultActionBtn}>
                            <Ionicons name="copy-outline" size={18} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>
                    <ThemedText style={[styles.resultValue, { color: colors.primary, textAlign: isUrdu ? 'right' : 'left' }]}>
                        {isUrdu ? (
                            <>
                                <ThemedText style={[{ fontSize: 18, color: colors.text }, urduPillStyle]}>{t.marlas}</ThemedText>
                                <ThemedText style={{ fontSize: 32, fontWeight: '800' }}> {calculatedPlotArea.marla}</ThemedText>
                            </>
                        ) : (
                            <>
                                <ThemedText style={{ fontSize: 32, fontWeight: '800' }}>{calculatedPlotArea.marla}</ThemedText>
                                <ThemedText style={[{ fontSize: 18, color: colors.text }]}> {t.marlas}</ThemedText>
                            </>
                        )}
                    </ThemedText>
                    <ThemedText style={[styles.resultFormula, { color: colors.textSecondary, marginBottom: 16, textAlign: isUrdu ? 'right' : 'left' }, urduStyle]}>
                        {t.plotDimensions} {plotLength} x {plotWidth} {plotUnit}
                    </ThemedText>

                    <View style={[styles.divider, { backgroundColor: colors.border }]} />

                    <View style={styles.calcSummaryGrid}>
                        <View style={[styles.calcSummaryRow, isUrdu && { flexDirection: 'row-reverse' }]}>
                            <ThemedText style={[{ color: colors.textSecondary }, urduStyle]}>{t.kanal}</ThemedText>
                            <ThemedText style={{ color: colors.text, fontWeight: '600' }}>{calculatedPlotArea.kanal}</ThemedText>
                        </View>
                        <View style={[styles.calcSummaryRow, isUrdu && { flexDirection: 'row-reverse' }]}>
                            <ThemedText style={[{ color: colors.textSecondary }, urduStyle]}>{t.acre}</ThemedText>
                            <ThemedText style={{ color: colors.text, fontWeight: '600' }}>{calculatedPlotArea.acre}</ThemedText>
                        </View>
                        <View style={[styles.calcSummaryRow, isUrdu && { flexDirection: 'row-reverse' }]}>
                            <ThemedText style={[{ color: colors.textSecondary }, urduStyle]}>{t.sqft}</ThemedText>
                            <ThemedText style={{ color: colors.text, fontWeight: '600' }}>{calculatedPlotArea.sqft}</ThemedText>
                        </View>
                        <View style={[styles.calcSummaryRow, isUrdu && { flexDirection: 'row-reverse' }]}>
                            <ThemedText style={[{ color: colors.textSecondary }, urduStyle]}>{t.sqgaj}</ThemedText>
                            <ThemedText style={{ color: colors.text, fontWeight: '600' }}>{calculatedPlotArea.gaj}</ThemedText>
                        </View>
                    </View>
                </View>
            ) : null}

            {/* Quick Conversion Reference Cards */}
            <View style={styles.quickReference}>
                <ThemedText style={[styles.sectionLabel, { color: colors.textSecondary, textAlign: isUrdu ? 'right' : 'left' }, urduStyle]}>
                    {t.standardPakConversions}
                </ThemedText>
                <View style={[styles.referenceContainer, isUrdu && { flexDirection: 'row-reverse' }]}>
                    <View style={[
                        styles.referenceItem,
                        { backgroundColor: colors.card, padding: isUrdu ? 12 : 10 },
                        isUrdu && { alignItems: 'flex-end' }
                    ]}>
                        <ThemedText style={[styles.referenceTitle, { color: colors.primary }, urduStyle]}>{t.ref1Kanal}</ThemedText>
                        <ThemedText style={[styles.referenceSub, { color: colors.textSecondary }, urduStyle]}>{t.ref1KanalVal}</ThemedText>
                    </View>
                    <View style={[
                        styles.referenceItem,
                        { backgroundColor: colors.card, padding: isUrdu ? 12 : 10 },
                        isUrdu && { alignItems: 'flex-end' }
                    ]}>
                        <ThemedText style={[styles.referenceTitle, { color: colors.primary }, urduStyle]}>{t.ref1Acre}</ThemedText>
                        <ThemedText style={[styles.referenceSub, { color: colors.textSecondary }, urduStyle]}>{t.ref1AcreVal}</ThemedText>
                    </View>
                    <View style={[
                        styles.referenceItem,
                        { backgroundColor: colors.card, padding: isUrdu ? 12 : 10 },
                        isUrdu && { alignItems: 'flex-end' }
                    ]}>
                        <ThemedText style={[styles.referenceTitle, { color: colors.primary }, urduStyle]}>{t.ref5Marla}</ThemedText>
                        <ThemedText style={[styles.referenceSub, { color: colors.textSecondary }, urduStyle]}>{t.ref5MarlaVal}</ThemedText>
                    </View>
                    <View style={[
                        styles.referenceItem,
                        { backgroundColor: colors.card, padding: isUrdu ? 12 : 10 },
                        isUrdu && { alignItems: 'flex-end' }
                    ]}>
                        <ThemedText style={[styles.referenceTitle, { color: colors.primary }, urduStyle]}>{t.ref1Karam}</ThemedText>
                        <ThemedText style={[styles.referenceSub, { color: colors.textSecondary }, urduStyle]}>{t.ref1KaramVal}</ThemedText>
                    </View>
                </View>
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    calculatorCard: {
        borderRadius: 16,
    },
    calcTitle: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 12,
    },
    calcUnitRow: {
        flexDirection: 'row',
        gap: 6,
        marginBottom: 16,
    },
    calcUnitPill: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
    },
    calcUnitPillText: {
        fontSize: 11,
    },
    calcInputRow: {
        flexDirection: 'row',
        gap: 12,
    },
    calcInputCol: {
        flex: 1,
    },
    calcInputLabel: {
        fontSize: 11,
        fontWeight: '600',
        marginBottom: 4,
    },
    calcInput: {
        borderRadius: 10,
        fontSize: 14,
        fontWeight: '600',
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
    divider: {
        height: 1,
        marginVertical: 14,
    },
    calcSummaryGrid: {
        gap: 10,
    },
    calcSummaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    quickReference: {
        marginTop: 20,
    },
    sectionLabel: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.5,
        marginBottom: 10,
        textTransform: 'uppercase',
    },
    referenceContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    referenceItem: {
        width: '48%',
        borderRadius: 10,
    },
    referenceTitle: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 2,
    },
    referenceSub: {
        fontSize: 11,
    },
});
