import React from 'react';
import { StyleSheet, View, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themedText';
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
                route: '/quran',
            },
            {
                id: 'tasbeeh',
                label: 'Tasbeeh',
                image: require('@/assets/icons/tasbeeh_icon.webp'),
                route: '/tasbeeh',
            },
            {
                id: 'prayers',
                label: 'Prayers',
                image: require('@/assets/icons/prayer_icon.webp'),
                route: '/prayerTimes',
            },
            {
                id: 'asmaAlHusna',
                label: '99 Names',
                image: require('@/assets/icons/allah_name.webp'),
                route: '/asmaAlHusna',
            },
            {
                id: 'islamicCalendar',
                label: 'Calendar',
                image: require('@/assets/icons/religious.webp'),
                route: '/islamicCalendar',
            },
            {
                id: 'zakat',
                label: 'Zakat',
                image: require('@/assets/icons/bank.webp'),
                route: '/zakat',
            },
        ],
    },
    {
        id: 'farmer',
        title: 'Farmer Utilities',
        items: [
            // {
            //     id: 'land-conversion',
            //     label: 'Land Calc',
            //     image: require('@/assets/icons/land_measure.webp'),
            //     route: '/landConversion',
            // },
        ],
    },
];

export function UtilsGrid() {
    const router = useRouter();
    const { theme } = useTheme();
    const colors = Colors[theme];

    // Only render categories that have items populated
    const activeCategories = CATEGORIES.filter(cat => cat.items.length > 0);

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
                                    <View style={[styles.card, { backgroundColor: colors.card }]}>
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
        paddingBottom: 8,
    },
    categoryContainer: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginLeft: 6,
        marginBottom: 12,
        opacity: 0.85,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    gridItem: {
        width: '25%',
    },
    touchable: {
        flex: 1,
        margin: 6,
    },
    card: {
        borderRadius: Layout.borderRadius,
        padding: 8,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 90,
    },
    icon: {
        width: 50,
        height: 50,
        marginBottom: 4,
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    label: {
        fontSize: 11,
        fontWeight: '600',
        textAlign: 'center',
        lineHeight: 14,
    },
});
