import React, { useState, useMemo, useCallback } from 'react';
import { StyleSheet, View, ScrollView, TextInput, TouchableOpacity, Image } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { ZakatHeader } from '@/components/zakat/ZakatHeader';
import { MicroFeedback } from '@/components/feedback/MicroFeedback';
import { CategoryCard } from '@/components/home/CategoryCard';
import { analyticsService, AnalyticsEvents } from '@/analytics';

const ACCENT = '#059669';

type ZakatCategory = 'cash' | 'gold' | 'crop' | 'livestock' | null;

const CATEGORIES = [
    { id: 'cash', title: 'Cash / Savings', urdu: 'نقد / بچت', icon: require('@/assets/icons/ruppee.webp') },
    { id: 'gold', title: 'Gold & Silver', urdu: 'سونا اور چاندی', icon: require('@/assets/icons/gold.webp') },
    { id: 'crop', title: 'Crops (Ushr)', urdu: 'فصلیں (عشر)', icon: require('@/assets/icons/crop.webp') },
    { id: 'livestock', title: 'Livestock', urdu: 'مویشی', icon: require('@/assets/icons/live_stock.webp') },
];

const ZakatCalculatorScreenComponent = () => {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();
    const colors = Colors[theme];

    const [selectedCategory, setSelectedCategory] = useState<ZakatCategory>('cash');
    const [inputValue, setInputValue] = useState('');
    const [cropIrrigation, setCropIrrigation] = useState<'natural' | 'artificial'>('natural'); // For Ushr
    const [hasTracked, setHasTracked] = useState(false);
    const [isUrdu, setIsUrdu] = useState(true);

    const handleBack = useCallback(() => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/');
        }
    }, [router]);

    const handleReset = useCallback(() => {
        setInputValue('');
        setSelectedCategory(null);
    }, []);

    const parseVal = (val: string) => {
        const num = parseFloat(val);
        return isNaN(num) || num < 0 ? 0 : num;
    };

    const calculatedZakat = useMemo(() => {
        const val = parseVal(inputValue);
        
        if (val > 0 && !hasTracked) {
            analyticsService.trackEvent(AnalyticsEvents.ZAKAT_CALCULATOR_USED, { category: selectedCategory });
            setHasTracked(true);
        }

        if (val === 0) return 0;
        
        switch (selectedCategory) {
            case 'crop':
                return cropIrrigation === 'natural' ? val * 0.10 : val * 0.05;
            default:
                // 2.5% for cash, gold, livestock (simplified)
                return val * 0.025;
        }
    }, [inputValue, selectedCategory, cropIrrigation, hasTracked]);

    const formatCurrency = (val: number) => {
        return val.toLocaleString(undefined, { maximumFractionDigits: 0 });
    };

    const renderCategories = () => (
        <View style={styles.grid}>
            {CATEGORIES.map((cat) => (
                <View key={cat.id} style={styles.gridItem}>
                    <CategoryCard
                        label={isUrdu ? cat.urdu : cat.title}
                        icon={cat.icon}
                        onPress={() => setSelectedCategory(cat.id as ZakatCategory)}
                        isSelected={selectedCategory === cat.id}
                        compact
                    />
                </View>
            ))}
        </View>
    );

    const renderCalculation = () => {
        const categoryData = CATEGORIES.find(c => c.id === selectedCategory);
        if (!categoryData) return null;

        return (
            <View style={styles.calcContainer}>
                <View style={styles.calcHeader}>
                    <Image source={categoryData.icon} style={styles.calcIcon} resizeMode="contain" />
                    <View>
                        <ThemedText style={[styles.calcTitle, { color: colors.text }]}>{isUrdu ? `${categoryData.urdu} زکوٰۃ` : `${categoryData.title} Zakat`}</ThemedText>
                        <ThemedText style={[isUrdu ? styles.calcSub : styles.calcUrdu, { color: colors.textSecondary }]}>{isUrdu ? `${categoryData.title} Zakat` : `${categoryData.urdu} زکوٰۃ`}</ThemedText>
                    </View>
                </View>

                {selectedCategory === 'crop' && (
                    <View style={styles.toggleContainer}>
                        <TouchableOpacity
                            style={[styles.toggleBtn, cropIrrigation === 'natural' ? { backgroundColor: ACCENT } : { backgroundColor: colors.card }]}
                            onPress={() => setCropIrrigation('natural')}
                        >
                            <ThemedText style={[
                                styles.toggleText, 
                                { color: cropIrrigation === 'natural' ? '#FFF' : colors.text },
                                isUrdu && { fontFamily: 'NotoNastaliqUrdu-Regular', fontSize: 11 }
                            ]}>
                                {isUrdu ? 'بارانی / قدرتی (10٪)' : 'Natural Rain (10%)'}
                            </ThemedText>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.toggleBtn, cropIrrigation === 'artificial' ? { backgroundColor: ACCENT } : { backgroundColor: colors.card }]}
                            onPress={() => setCropIrrigation('artificial')}
                        >
                            <ThemedText style={[
                                styles.toggleText, 
                                { color: cropIrrigation === 'artificial' ? '#FFF' : colors.text },
                                isUrdu && { fontFamily: 'NotoNastaliqUrdu-Regular', fontSize: 11 }
                            ]}>
                                {isUrdu ? 'مصنوعی / نہری (5٪)' : 'Irrigated (5%)'}
                            </ThemedText>
                        </TouchableOpacity>
                    </View>
                )}

                <View style={[styles.inputContainer, { backgroundColor: colors.card }]}>
                    <ThemedText style={[
                        styles.inputLabel, 
                        { color: colors.textSecondary },
                        isUrdu && { fontFamily: 'NotoNastaliqUrdu-Regular', fontSize: 11, textAlign: 'right' }
                    ]}>
                        {isUrdu ? 'کل رقم/مالیت درج کریں (روپے)' : 'Enter Total Value (PKR)'}
                    </ThemedText>
                    <TextInput
                        style={[styles.input, { color: colors.text }, isUrdu && { textAlign: 'right' }]}
                        value={inputValue}
                        onChangeText={setInputValue}
                        keyboardType="numeric"
                        placeholder="0"
                        placeholderTextColor={colors.textSecondary}
                    />
                </View>

                <View style={[styles.resultCard, { backgroundColor: ACCENT }]}>
                    <ThemedText style={[
                        styles.resultLabel,
                        isUrdu && { fontFamily: 'NotoNastaliqUrdu-Regular', fontSize: 12 }
                    ]}>
                        {isUrdu ? 'قابلِ ادائیگی زکوٰۃ' : 'Zakat Payable'}
                    </ThemedText>
                    <ThemedText style={styles.resultValue}>
                        {isUrdu ? `روپے ${formatCurrency(calculatedZakat)}` : `Rs. ${formatCurrency(calculatedZakat)}`}
                    </ThemedText>

                    {selectedCategory !== 'crop' && (
                        <ThemedText style={[
                            styles.resultNote,
                            isUrdu && { fontFamily: 'NotoNastaliqUrdu-Regular', fontSize: 10 }
                        ]}>
                            {isUrdu ? '* حساب برائے مقررہ شرح 2.5 فیصد' : '* Calculated at standard 2.5%'}
                        </ThemedText>
                    )}
                </View>
            </View>
        );
    };

    return (
        <View style={[styles.root, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ headerShown: false }} />

            <ZakatHeader
                insetsTop={insets.top}
                colors={colors}
                onBack={handleBack}
                onReset={handleReset}
                isUrdu={isUrdu}
                onToggleLanguage={() => setIsUrdu(prev => !prev)}
            />

            <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}>
                {renderCategories()}

                {selectedCategory && (
                    <View style={{ marginTop: 16 }}>
                        {renderCalculation()}
                    </View>
                )}

                <View style={{ marginTop: 40 }}>
                    <MicroFeedback componentName="zakat_calculator" />
                </View>
            </ScrollView>
        </View>
    );
};

export default React.memo(ZakatCalculatorScreenComponent);

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
    scroll: {
        paddingHorizontal: 20,
        paddingTop: 24,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 16,
        textAlign: 'center',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    gridItem: {
        width: '50%',
    },
    calcContainer: {
        marginTop: 10,
    },
    calcHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    calcIcon: {
        width: 40,
        height: 40,
        marginRight: 12,
    },
    calcTitle: {
        fontSize: 22,
        fontWeight: '800',
    },
    calcUrdu: {
        fontSize: 14,
        fontFamily: 'NotoNastaliqUrdu-Regular',
        lineHeight: 24,
        textAlign: 'right',
        marginTop: 2,
    },
    calcSub: {
        fontSize: 13,
        fontWeight: '600',
        marginTop: 2,
    },
    toggleContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    toggleBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    toggleText: {
        fontSize: 13,
        fontWeight: '700',
    },
    inputContainer: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 8,
    },
    input: {
        fontSize: 24,
        fontWeight: '700',
    },
    resultCard: {
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
    },
    resultLabel: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
        opacity: 0.9,
        marginBottom: 4,
    },
    resultValue: {
        color: '#FFFFFF',
        fontSize: 28,
        fontWeight: '700',
    },
    resultNote: {
        color: '#FFFFFF',
        fontSize: 11,
        opacity: 0.7,
        marginTop: 8,
    },
});
