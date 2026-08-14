import React from 'react';
import { StyleSheet, View, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { Layout } from '@/constants/layout';

interface UtilItem {
    id: string;
    label: string;
    image?: any;
    icon?: React.ComponentProps<typeof Ionicons>['name'];
    route: string;
}

interface UtilCategory {
    id: string;
    title: string;
    items: UtilItem[];
}

const CATEGORIES: UtilCategory[] = [
    {
        id: 'islamic',
        title: 'Islamic Utilities',
        items: [
            {
                id: 'quran',
                label: 'Quran',
                image: require('@/assets/icons/quran_icon.webp'),
                route: '/quran'
            },
            {
                id: 'prayers',
                label: 'Prayers',
                image: require('@/assets/icons/prayer_icon.webp'),
                route: '/prayerTimes'
            },
        ]
    },
    {
        id: 'finance',
        title: 'Finance & Rates',
        items: [
            {
                id: 'currency',
                label: 'Currency',
                image: require('@/assets/icons/currency.webp'),
                route: '/currency'
            },
            {
                id: 'metals',
                label: 'Metals & Gold',
                image: require('@/assets/icons/gold_rate.webp'),
                route: '/metals'
            },
            {
                id: 'fuel',
                label: 'Fuel Prices',
                image: require('@/assets/icons/fuel.webp'),
                route: '/fuel'
            },
        ]
    },
];

export function UtilsGrid() {
    const router = useRouter();
    const { theme } = useTheme();
    const colors = Colors[theme];

    // Only render categories that have items populated
    const activeCategories = React.useMemo(() => CATEGORIES.filter(cat => cat.items.length > 0), []);

    return (
        <View style={styles.container}>
            {activeCategories.map((category) => (
                <View key={category.id} style={styles.categoryContainer}>
                    <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                        {category.title}
                    </ThemedText>
                    <View style={styles.grid}>
                        {category.items.map((util) => (
                            <View key={util.id} style={styles.gridItem}>
                                <TouchableOpacity
                                    onPress={() => router.push(util.route as any)}
                                    activeOpacity={0.7}
                                    style={styles.touchable}
                                >
                                    <View style={[styles.card, { backgroundColor: colors.cardBg }]}>
                                        {util.image ? (
                                            <Image
                                                source={util.image}
                                                style={styles.icon}
                                                resizeMode="contain"
                                            />
                                        ) : (
                                            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '12' }]}>
                                                <Ionicons
                                                    name={util.icon as any}
                                                    size={28}
                                                    color={colors.primary}
                                                />
                                            </View>
                                        )}
                                        <ThemedText
                                            style={[styles.label, { color: colors.text }]}
                                            numberOfLines={2}
                                            adjustsFontSizeToFit
                                            minimumFontScale={0.8}
                                        >
                                            {util.label}
                                        </ThemedText>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                </View>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 14,
        paddingTop: 8,
        paddingBottom: 8
    },
    categoryContainer: {
        marginBottom: 16
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginLeft: 6,
        marginBottom: 12,
        opacity: 0.85
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap'
    },
    gridItem: {
        width: '25%'
    },
    touchable: {
        flex: 1,
        margin: 6
    },
    card: {
        borderRadius: Layout.borderRadius - 4,
        padding: 8,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 90
    },
    icon: {
        width: 50,
        height: 50,
        marginBottom: 4
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: Layout.borderRadius - 4,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4
    },
    label: {
        fontSize: 11,
        fontWeight: '600',
        textAlign: 'center',
        lineHeight: 14
    }
});
