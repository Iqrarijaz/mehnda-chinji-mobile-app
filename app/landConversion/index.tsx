import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    StyleSheet,
    View,
    TouchableOpacity,
    ScrollView,
    Share,
    Clipboard,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';

// Components
import { ProfileSelector } from '@/components/landConversion/ProfileSelector';
import { UnitConverter } from '@/components/landConversion/UnitConverter';
import { ResultCard } from '@/components/landConversion/ResultCard';
import { PlotCalculator } from '@/components/landConversion/PlotCalculator';
import { HistoryFavorites } from '@/components/landConversion/HistoryFavorites';
import { MicroFeedback } from '@/components/feedback/MicroFeedback';

type ProfileType = 'standard' | 'lahore' | 'kp' | 'custom';
type UnitType = 'marla' | 'kanal' | 'acre' | 'sqft' | 'sqmeter' | 'gaj' | 'karam';
type CalcUnitType = 'feet' | 'meters' | 'karam';

interface HistoryItem {
    id: string;
    fromValue: string;
    fromUnit: UnitType;
    toValue: string;
    toUnit: UnitType;
    timestamp: number;
    profile: ProfileType;
}

interface FavoriteItem {
    id: string;
    fromUnit: UnitType;
    toUnit: UnitType;
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
        title: 'Land Conversion',
        subtitle: 'Zameen Calculator',
        converter: 'Converter',
        plotCalc: 'Plot Calc',
        saved: 'Saved',
        copied: 'Copied',
        copiedMsg: 'Result copied to clipboard!',
        plotCopiedMsg: 'Plot area details copied!',
    },
    ur: {
        title: 'زمین کی پیمائش',
        subtitle: 'زمین کیلکولیٹر',
        converter: 'کنورٹر',
        plotCalc: 'پلاٹ سائز',
        saved: 'محفوظ شدہ',
        copied: 'کاپی ہو گیا',
        copiedMsg: 'نتیجہ کلپ بورڈ پر کاپی ہو گیا ہے!',
        plotCopiedMsg: 'پلاٹ کی پیمائش کی تفصیلات کاپی ہو گئیں!',
    }
};

export default function LandConversionScreen() {
    const router = useRouter();
    const { theme } = useTheme();
    const colors = Colors[theme];
    const insets = useSafeAreaInsets();

    // ─── Settings / Preferences States ──────────────────────────────────────────
    const [lang, setLang] = useState<'en' | 'ur'>('en');
    const [profile, setProfile] = useState<ProfileType>('standard');
    const [customMarla, setCustomMarla] = useState<string>('272.25');
    const [activeTab, setActiveTab] = useState<'converter' | 'calculator' | 'saved'>('converter');

    // Tab 1: Unit Converter
    const [inputValue, setInputValue] = useState<string>('1');
    const [fromUnit, setFromUnit] = useState<UnitType>('marla');
    const [toUnit, setToUnit] = useState<UnitType>('sqft');

    // Tab 2: Plot Calculator
    const [plotLength, setPlotLength] = useState<string>('');
    const [plotWidth, setPlotWidth] = useState<string>('');
    const [plotUnit, setPlotUnit] = useState<CalcUnitType>('feet');

    // Tab 3: History & Favorites
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    const t = TRANSLATIONS[lang];
    const isUrdu = lang === 'ur';

    // ─── Load / Save State ───
    useEffect(() => {
        const loadPreferences = async () => {
            try {
                const savedLang = await AsyncStorage.getItem('LAND_LANG');
                const savedProfile = await AsyncStorage.getItem('LAND_PROFILE');
                const savedCustom = await AsyncStorage.getItem('LAND_CUSTOM_MARLA');
                const savedHistory = await AsyncStorage.getItem('LAND_HISTORY');
                const savedFavs = await AsyncStorage.getItem('LAND_FAVORITES');

                if (savedLang) setLang(savedLang as 'en' | 'ur');
                if (savedProfile) setProfile(savedProfile as ProfileType);
                if (savedCustom) setCustomMarla(savedCustom || '272.25');
                if (savedHistory) setHistory(JSON.parse(savedHistory));
                if (savedFavs) setFavorites(JSON.parse(savedFavs));
            } catch (e) {
                console.warn('Failed to load land converter preferences', e);
            } finally {
                setIsLoaded(true);
            }
        };
        loadPreferences();
    }, []);

    const toggleLanguage = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const nextLang = lang === 'en' ? 'ur' : 'en';
        setLang(nextLang);
        try {
            await AsyncStorage.setItem('LAND_LANG', nextLang);
        } catch (e) {
            console.warn(e);
        }
    };

    const handleSetProfile = useCallback((p: ProfileType) => {
        setProfile(p);
        AsyncStorage.setItem('LAND_PROFILE', p).catch(console.warn);
    }, []);

    const handleSetCustomMarla = useCallback((val: string) => {
        setCustomMarla(val);
        AsyncStorage.setItem('LAND_CUSTOM_MARLA', val).catch(console.warn);
    }, []);

    const saveHistory = async (updatedHistory: HistoryItem[]) => {
        try {
            await AsyncStorage.setItem('LAND_HISTORY', JSON.stringify(updatedHistory));
        } catch (e) {
            console.warn(e);
        }
    };

    const saveFavorites = async (updatedFavs: FavoriteItem[]) => {
        try {
            await AsyncStorage.setItem('LAND_FAVORITES', JSON.stringify(updatedFavs));
        } catch (e) {
            console.warn(e);
        }
    };

    // Calculate Marla size in Sq Ft
    const marlaSqFt = useMemo(() => {
        if (profile === 'standard') return 272.25;
        if (profile === 'lahore') return 225;
        if (profile === 'kp') return 250;
        const val = parseFloat(customMarla);
        return isNaN(val) || val <= 0 ? 272.25 : val;
    }, [profile, customMarla]);

    // ─── Conversion Math ───
    const convertUnits = useCallback((valStr: string, from: UnitType, to: UnitType): number => {
        const value = parseFloat(valStr);
        if (isNaN(value) || value <= 0) return 0;

        let sqft = 0;
        switch (from) {
            case 'sqft': sqft = value; break;
            case 'sqmeter': sqft = value * 10.76391; break;
            case 'gaj': sqft = value * 9; break;
            case 'karam': sqft = value * 30.25; break;
            case 'marla': sqft = value * marlaSqFt; break;
            case 'kanal': sqft = value * 20 * marlaSqFt; break;
            case 'acre': sqft = value * 160 * marlaSqFt; break;
        }

        let result = 0;
        switch (to) {
            case 'sqft': result = sqft; break;
            case 'sqmeter': result = sqft / 10.76391; break;
            case 'gaj': result = sqft / 9; break;
            case 'karam': result = sqft / 30.25; break;
            case 'marla': result = sqft / marlaSqFt; break;
            case 'kanal': result = sqft / (20 * marlaSqFt); break;
            case 'acre': result = sqft / (160 * marlaSqFt); break;
        }

        return parseFloat(result.toFixed(4));
    }, [marlaSqFt]);

    const activeResult = useMemo(() => {
        return convertUnits(inputValue, fromUnit, toUnit);
    }, [inputValue, fromUnit, toUnit, convertUnits]);

    // equivalents
    const equivalentsList = useMemo(() => {
        const val = parseFloat(inputValue);
        if (isNaN(val) || val <= 0) return [];
        const mainUnits: UnitType[] = ['sqft', 'gaj', 'marla', 'kanal', 'acre'];
        return mainUnits
            .filter(u => u !== toUnit && u !== fromUnit)
            .map(u => ({
                unit: u,
                label: UNIT_SHORT[lang][u],
                value: convertUnits(inputValue, fromUnit, u),
            }));
    }, [inputValue, fromUnit, toUnit, convertUnits, lang]);

    // physical visual scale
    const visualComparison = useMemo(() => {
        const val = parseFloat(inputValue);
        if (isNaN(val) || val <= 0) return '';
        const sqft = convertUnits(inputValue, fromUnit, 'sqft');

        const VISUAL_COMPARISONS_LANG = {
            en: {
                washroom: '≈ Size of a typical washroom / small storage pantry',
                shop: '≈ Size of a standard shop or bedroom',
                parking: '≈ 1 to 2 car parking spaces',
                micro: '≈ Micro-size urban house plot (2-3 Marla)',
                average: '≈ Average family home plot (5 Marla)',
                double: '≈ Double-story family residence (10 Marla)',
                mansion: '≈ Large estate / 1 Kanal mansion',
                orchard: '≈ Half an Acre / Large rural haveli / orchard',
                field: '≈ 1 Acre / Typical village crop field (Killa)',
                large: '≈ Large agricultural field / multi-acre crop land',
            },
            ur: {
                washroom: '≈ ایک عام باتھ روم یا چھوٹے اسٹور کے برابر سائز',
                shop: '≈ ایک عام دکان یا بیڈ روم کے برابر سائز',
                parking: '≈ 1 سے 2 گاڑیوں کی پارکنگ کی جگہ',
                micro: '≈ چھوٹا شہری گھر کا پلاٹ (2 سے 3 مرلہ)',
                average: '≈ متوسط فیملی کے گھر کا پلاٹ (5 مرلہ)',
                double: '≈ ڈبل اسٹوری فیملی کا گھر (10 مرلہ)',
                mansion: '≈ بڑی حویلی یا 1 کنال کا بنگلہ',
                orchard: '≈ آدھا ایکڑ / بڑا فارم ہاؤس یا باغ / ڈیرہ',
                field: '≈ 1 ایکڑ / گاؤں کا روایتی کلا (فصل کا کھیت)',
                large: '≈ بڑا زرعی رقبہ / کئی ایکڑ پر پھیلی فصل',
            }
        };

        const comp = VISUAL_COMPARISONS_LANG[lang];

        if (sqft < 100) return comp.washroom;
        if (sqft < 272) return comp.shop;
        if (sqft < 816) return comp.parking;
        if (sqft < 1361) return comp.micro;
        if (sqft < 2722) return comp.average;
        if (sqft < 5445) return comp.double;
        if (sqft < 10890) return comp.mansion;
        if (sqft < 21780) return comp.orchard;
        if (sqft < 43560) return comp.field;
        return comp.large;
    }, [inputValue, fromUnit, convertUnits, lang]);

    // Actions
    const handleSwap = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const temp = fromUnit;
        setFromUnit(toUnit);
        setToUnit(temp);
    }, [fromUnit, toUnit]);

    const handleCopy = useCallback(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const text = `${inputValue} ${UNIT_SHORT[lang][fromUnit]} = ${activeResult} ${UNIT_SHORT[lang][toUnit]} (Marla size: ${marlaSqFt} sq ft)`;
        Clipboard.setString(text);
        Alert.alert(t.copied, t.copiedMsg);
    }, [inputValue, fromUnit, activeResult, toUnit, marlaSqFt, lang, t]);

    const handleShare = useCallback(async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const text = `${inputValue} ${UNIT_SHORT[lang][fromUnit]} = ${activeResult} ${UNIT_SHORT[lang][toUnit]} (Calculated on Rahbar App)`;
        try {
            await Share.share({ message: text });
        } catch (e) {
            console.warn(e);
        }
    }, [inputValue, fromUnit, activeResult, toUnit, lang]);

    const handleSaveHistory = useCallback(() => {
        const val = parseFloat(inputValue);
        if (isNaN(val) || val <= 0) return;
        const newItem: HistoryItem = {
            id: Date.now().toString(),
            fromValue: inputValue,
            fromUnit,
            toValue: activeResult.toString(),
            toUnit,
            timestamp: Date.now(),
            profile,
        };
        const updated = [newItem, ...history.slice(0, 19)];
        setHistory(updated);
        saveHistory(updated);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, [inputValue, fromUnit, activeResult, toUnit, profile, history]);

    const isFavorite = useMemo(() => {
        return favorites.some(fav => fav.fromUnit === fromUnit && fav.toUnit === toUnit);
    }, [favorites, fromUnit, toUnit]);

    const toggleFavorite = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        let updated: FavoriteItem[];
        if (isFavorite) {
            updated = favorites.filter(fav => !(fav.fromUnit === fromUnit && fav.toUnit === toUnit));
        } else {
            updated = [...favorites, { id: Date.now().toString(), fromUnit, toUnit }];
        }
        setFavorites(updated);
        saveFavorites(updated);
    }, [favorites, fromUnit, toUnit, isFavorite]);

    const loadFavorite = useCallback((fav: FavoriteItem) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setFromUnit(fav.fromUnit);
        setToUnit(fav.toUnit);
        setActiveTab('converter');
    }, []);

    const deleteHistoryItem = useCallback((id: string) => {
        const updated = history.filter(h => h.id !== id);
        setHistory(updated);
        saveHistory(updated);
    }, [history]);

    // Plot Calculator
    const calculatedPlotArea = useMemo(() => {
        const len = parseFloat(plotLength);
        const wid = parseFloat(plotWidth);
        if (isNaN(len) || len <= 0 || isNaN(wid) || wid <= 0) return null;

        let totalSqFt = 0;
        if (plotUnit === 'feet') {
            totalSqFt = len * wid;
        } else if (plotUnit === 'meters') {
            totalSqFt = (len * wid) * 10.76391;
        } else if (plotUnit === 'karam') {
            totalSqFt = (len * wid) * 30.25;
        }

        return {
            sqft: parseFloat(totalSqFt.toFixed(2)),
            gaj: parseFloat((totalSqFt / 9).toFixed(2)),
            marla: parseFloat((totalSqFt / marlaSqFt).toFixed(3)),
            kanal: parseFloat((totalSqFt / (20 * marlaSqFt)).toFixed(3)),
            acre: parseFloat((totalSqFt / (160 * marlaSqFt)).toFixed(4)),
        };
    }, [plotLength, plotWidth, plotUnit, marlaSqFt]);

    const handleCopyPlot = useCallback(() => {
        if (!calculatedPlotArea) return;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const text = `Plot Size: ${plotLength}x${plotWidth} ${plotUnit}\nArea:\n- ${calculatedPlotArea.sqft} Sq Ft\n- ${calculatedPlotArea.marla} Marla\n- ${calculatedPlotArea.kanal} Kanal\n(Marla size: ${marlaSqFt} sq ft)`;
        Clipboard.setString(text);
        Alert.alert(t.copied, t.plotCopiedMsg);
    }, [calculatedPlotArea, plotLength, plotWidth, plotUnit, marlaSqFt, t]);

    // Urdu styled fonts helper
    const headerTitleStyle = {
        fontFamily: isUrdu ? 'NotoNastaliqUrdu-Regular' : undefined,
        lineHeight: isUrdu ? 28 : undefined,
        paddingBottom: isUrdu ? 4 : 0,
        textAlign: isUrdu ? 'right' as const : 'left' as const,
    };

    const headerSubStyle = {
        fontFamily: isUrdu ? 'NotoNastaliqUrdu-Regular' : undefined,
        lineHeight: isUrdu ? 20 : undefined,
        textAlign: isUrdu ? 'right' as const : 'left' as const,
    };

    const tabStyle = {
        fontFamily: isUrdu ? 'NotoNastaliqUrdu-Regular' : undefined,
        lineHeight: isUrdu ? 22 : undefined,
        paddingBottom: isUrdu ? 4 : 0,
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.root, { backgroundColor: colors.background }]}
        >
            <Stack.Screen options={{ headerShown: false }} />

            {/* ── Header ── */}
            <View style={[styles.header, { paddingTop: insets.top + 12, backgroundColor: colors.background, borderBottomColor: colors.border }, isUrdu && { flexDirection: 'row-reverse' }]}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={[styles.iconBtn, { backgroundColor: colors.card }]}
                >
                    <Ionicons name={isUrdu ? 'arrow-forward' : 'arrow-back'} size={20} color={colors.text} />
                </TouchableOpacity>
                <View style={[{ flex: 1, marginLeft: isUrdu ? 0 : 12, marginRight: isUrdu ? 12 : 0 }]}>
                    <ThemedText style={[styles.screenTitle, headerTitleStyle]}>{t.title}</ThemedText>
                    <ThemedText style={[styles.screenSub, { color: colors.textSecondary }, headerSubStyle]}>
                        {t.subtitle}
                    </ThemedText>
                </View>

                {/* Urdu / English Toggle */}
                <TouchableOpacity
                    onPress={toggleLanguage}
                    style={[
                        styles.langBtn,
                        {
                            backgroundColor: colors.primary + '15',
                            paddingVertical: isUrdu ? 7 : 5,
                            paddingHorizontal: isUrdu ? 14 : 12
                        }
                    ]}
                    activeOpacity={0.7}
                >
                    <ThemedText style={[styles.langBtnText, { color: colors.primary }]}>
                        {lang === 'en' ? 'اردو' : 'English'}
                    </ThemedText>
                </TouchableOpacity>
            </View>

            {!isLoaded ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={[
                        styles.scroll,
                        {
                            paddingBottom: insets.bottom + 24,
                            paddingTop: isUrdu ? 16 : 14
                        }
                    ]}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Profile Selector */}
                    <ProfileSelector
                        profile={profile}
                        setProfile={handleSetProfile}
                        customMarla={customMarla}
                        setCustomMarla={handleSetCustomMarla}
                        marlaSqFt={marlaSqFt}
                        lang={lang}
                        colors={colors}
                    />

                    {/* Segment Tabs Control */}
                    <View style={[styles.tabsContainer, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }, isUrdu && { flexDirection: 'row-reverse' }]}>
                        {(['converter', 'calculator', 'saved'] as const).map((tab) => {
                            const isActive = activeTab === tab;
                            return (
                                <TouchableOpacity
                                    key={tab}
                                    onPress={() => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        setActiveTab(tab);
                                    }}
                                    style={[
                                        styles.tabButton,
                                        { paddingVertical: isUrdu ? 12 : 10 },
                                        isActive && { backgroundColor: colors.primary }
                                    ]}
                                >
                                    <ThemedText style={[
                                        styles.tabButtonText,
                                        { color: isActive ? '#ffffff' : colors.textSecondary },
                                        isActive && { fontWeight: '700' },
                                        tabStyle
                                    ]}>
                                        {tab === 'converter' ? t.converter : tab === 'calculator' ? t.plotCalc : t.saved}
                                    </ThemedText>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Tab contents */}
                    {activeTab === 'converter' && (
                        <View style={styles.tabContent}>
                            <UnitConverter
                                inputValue={inputValue}
                                setInputValue={setInputValue}
                                fromUnit={fromUnit}
                                setFromUnit={setFromUnit}
                                toUnit={toUnit}
                                setToUnit={setToUnit}
                                handleSwap={handleSwap}
                                lang={lang}
                                colors={colors}
                            />
                            <ResultCard
                                inputValue={inputValue}
                                fromUnit={fromUnit}
                                toUnit={toUnit}
                                activeResult={activeResult}
                                equivalentsList={equivalentsList}
                                visualComparison={visualComparison}
                                lang={lang}
                                isFavorite={isFavorite}
                                toggleFavorite={toggleFavorite}
                                handleSaveHistory={handleSaveHistory}
                                handleCopy={handleCopy}
                                handleShare={handleShare}
                                colors={colors}
                            />
                        </View>
                    )}

                    {activeTab === 'calculator' && (
                        <PlotCalculator
                            plotLength={plotLength}
                            setPlotLength={setPlotLength}
                            plotWidth={plotWidth}
                            setPlotWidth={setPlotWidth}
                            plotUnit={plotUnit}
                            setPlotUnit={setPlotUnit}
                            calculatedPlotArea={calculatedPlotArea}
                            handleCopyPlot={handleCopyPlot}
                            lang={lang}
                            colors={colors}
                        />
                    )}

                    {activeTab === 'saved' && (
                        <HistoryFavorites
                            favorites={favorites}
                            history={history}
                            loadFavorite={loadFavorite}
                            deleteHistoryItem={deleteHistoryItem}
                            lang={lang}
                            colors={colors}
                        />
                    )}

                    {/* Feedback Widget */}
                    <MicroFeedback componentName="land_conversion" />
                </ScrollView>
            )}
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    iconBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        justifyContent: 'center',
        alignItems: 'center',
    },
    screenTitle: { fontSize: 18, fontWeight: '700' },
    screenSub: { fontSize: 11, marginTop: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scroll: { paddingHorizontal: 20, paddingTop: 14 },
    langBtn: {
        borderRadius: 16,
        paddingVertical: 5,
        paddingHorizontal: 12,
    },
    langBtnText: {
        fontSize: 12,
        fontWeight: '700',
    },
    tabsContainer: {
        flexDirection: 'row',
        borderRadius: 12,
        padding: 4,
        marginBottom: 16,
    },
    tabButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 10,
    },
    tabButtonText: {
        fontSize: 13,
        fontWeight: '500',
    },
    tabContent: {
        width: '100%',
    },
});
