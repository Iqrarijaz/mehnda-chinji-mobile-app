import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';

type UnitType = 'marla' | 'kanal' | 'acre' | 'sqft' | 'sqmeter' | 'gaj' | 'karam';
type ProfileType = 'standard' | 'lahore' | 'kp' | 'custom';

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

interface HistoryFavoritesProps {
    favorites: FavoriteItem[];
    history: HistoryItem[];
    loadFavorite: (fav: FavoriteItem) => void;
    deleteHistoryItem: (id: string) => void;
    lang: 'en' | 'ur';
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
        bookmarkedUnits: 'Bookmarked Units',
        noBookmarked: 'No bookmarked conversions. Save one in the Converter tab!',
        recentHistory: 'Recent Calculation History',
        noHistory: 'No conversion history. Calculations will appear here.',
        profile: 'Profile:',
    },
    ur: {
        bookmarkedUnits: 'پسندیدہ یونٹس',
        noBookmarked: 'کوئی پسندیدہ پیمائش محفوظ نہیں ہے۔ کنورٹر ٹیب میں محفوظ کریں!',
        recentHistory: 'حالیہ ہسٹری',
        noHistory: 'کوئی ہسٹری موجود نہیں ہے۔ حساب کتاب یہاں ظاہر ہوں گے۔',
        profile: 'پروفائل:',
    }
};

export const HistoryFavorites = React.memo(function HistoryFavorites({
    favorites,
    history,
    loadFavorite,
    deleteHistoryItem,
    lang,
    colors
}: HistoryFavoritesProps) {
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
        lineHeight: isUrdu ? 20 : undefined,
        paddingBottom: isUrdu ? 4 : 0,
    };

    return (
        <View style={styles.container}>
            {/* Bookmarks / Favorites */}
            <View style={styles.savedSection}>
                <View style={[styles.savedHeader, isUrdu && { flexDirection: 'row-reverse' }]}>
                    <Ionicons name="bookmark-outline" size={16} color={colors.primary} />
                    <ThemedText style={[styles.savedSectionTitle, { color: colors.text, marginLeft: isUrdu ? 0 : 6, marginRight: isUrdu ? 6 : 0 }, urduStyle]}>
                        {t.bookmarkedUnits}
                    </ThemedText>
                </View>
                {favorites.length === 0 ? (
                    <View style={[styles.emptySaved, { backgroundColor: colors.card, padding: isUrdu ? 18 : 16 }]}>
                        <ThemedText style={[{ color: colors.textSecondary, fontStyle: 'italic', fontSize: 13, textAlign: 'center' }, urduStyle]}>
                            {t.noBookmarked}
                        </ThemedText>
                    </View>
                ) : (
                    <View style={[styles.favGrid, isUrdu && { flexDirection: 'row-reverse' }]}>
                        {favorites.map((fav) => (
                            <TouchableOpacity
                                key={fav.id}
                                onPress={() => loadFavorite(fav)}
                                style={[
                                    styles.favItem,
                                    {
                                        backgroundColor: colors.card,
                                        paddingVertical: isUrdu ? 10 : 8,
                                        paddingHorizontal: isUrdu ? 14 : 12
                                    },
                                    isUrdu && { flexDirection: 'row-reverse' }
                                ]}
                            >
                                <ThemedText style={[styles.favText, { color: colors.text }, urduPillStyle]}>
                                    {unitShort[fav.fromUnit]} <Ionicons name={isUrdu ? 'arrow-back' : 'arrow-forward'} size={10} color={colors.primary} /> {unitShort[fav.toUnit]}
                                </ThemedText>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>

            {/* Calculation History */}
            <View style={styles.savedSection}>
                <View style={[styles.savedHeader, isUrdu && { flexDirection: 'row-reverse' }]}>
                    <Ionicons name="time-outline" size={16} color={colors.primary} />
                    <ThemedText style={[styles.savedSectionTitle, { color: colors.text, marginLeft: isUrdu ? 0 : 6, marginRight: isUrdu ? 6 : 0 }, urduStyle]}>
                        {t.recentHistory}
                    </ThemedText>
                </View>
                {history.length === 0 ? (
                    <View style={[styles.emptySaved, { backgroundColor: colors.card, padding: isUrdu ? 18 : 16 }]}>
                        <ThemedText style={[{ color: colors.textSecondary, fontStyle: 'italic', fontSize: 13, textAlign: 'center' }, urduStyle]}>
                            {t.noHistory}
                        </ThemedText>
                    </View>
                ) : (
                    <View style={styles.historyList}>
                        {history.map((item) => (
                            <View key={item.id} style={[
                                styles.historyCard,
                                {
                                    backgroundColor: colors.card,
                                    paddingVertical: isUrdu ? 12 : 10,
                                    paddingHorizontal: isUrdu ? 14 : 12
                                },
                                isUrdu && { flexDirection: 'row-reverse' }
                            ]}>
                                <View style={[styles.historyCardMain, isUrdu && { alignItems: 'flex-end' }]}>
                                    <ThemedText style={[styles.historyFormula, { color: colors.text }]}>
                                        {item.fromValue} {unitShort[item.fromUnit]} = {item.toValue} {unitShort[item.toUnit]}
                                    </ThemedText>
                                    <ThemedText style={[styles.historyMeta, { color: colors.textSecondary }, urduStyle]}>
                                        {t.profile} {item.profile === 'standard' ? 'Govt' : item.profile === 'lahore' ? 'Lahore' : item.profile === 'kp' ? 'KP' : 'Custom'}
                                    </ThemedText>
                                </View>
                                <TouchableOpacity
                                    onPress={() => deleteHistoryItem(item.id)}
                                    style={styles.historyDeleteBtn}
                                >
                                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                )}
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    savedSection: {
        marginBottom: 20,
    },
    savedHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    savedSectionTitle: {
        fontSize: 14,
        fontWeight: '700',
    },
    emptySaved: {
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    favGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    favItem: {
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    favText: {
        fontSize: 12,
        fontWeight: '600',
    },
    historyList: {
        gap: 8,
    },
    historyCard: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
    },
    historyCardMain: {
        flex: 1,
    },
    historyFormula: {
        fontSize: 13,
        fontWeight: '600',
    },
    historyMeta: {
        fontSize: 11,
        marginTop: 2,
    },
    historyDeleteBtn: {
        padding: 8,
    },
});
