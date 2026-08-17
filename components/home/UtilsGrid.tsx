import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { SlideInLeft } from 'react-native-reanimated';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { CategoryCard } from './CategoryCard';

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
            {
                id: 'qibla',
                label: 'Qibla',
                icon: 'compass-outline',
                route: '/qibla'
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
    {
        id: 'sports',
        title: 'Local Sports & Community',
        items: [
            {
                id: 'cricket',
                label: 'Cricket Hub',
                icon: 'trophy-outline',
                route: '/cricket'
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
                    {/* Same CategoryCard used by "Explore Categories" — same rounded
                        card, icon tile, and label treatment across the Home screen. */}
                    <View style={styles.grid}>
                        {category.items.map((util, index) => (
                            <Animated.View
                                key={util.id}
                                entering={SlideInLeft.delay(100 + index * 80).duration(400)}
                                style={styles.gridItem}
                            >
                                <CategoryCard
                                    label={util.label}
                                    icon={util.image ?? util.icon}
                                    onPress={() => router.push(util.route as any)}
                                />
                            </Animated.View>
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
        width: '33.33%'
    },
});
