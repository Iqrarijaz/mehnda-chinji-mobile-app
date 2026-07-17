import React from 'react';
import { StyleSheet, View, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { PressableScale } from '@/components/ui/PressableScale';

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
                id: 'prayers',
                label: 'Prayers',
                image: require('@/assets/icons/prayer_icon.webp'),
                route: '/prayerTimes',
            },
        ],
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
                        {category.items.map((util, index) => (
                            <Animated.View
                                key={util.id}
                                entering={FadeInDown.delay(120 + index * 60).duration(300)}
                                style={styles.gridItem}
                            >
                                <PressableScale
                                    onPress={() => router.push(util.route as any)}
                                    pressedScale={0.97}
                                    style={styles.touchable}
                                >
                                    <View style={[styles.card, { backgroundColor: colors.card }]}>
                                        <View style={styles.iconContainer}>
                                            {util.image ? (
                                                <Image
                                                    source={util.image}
                                                    style={styles.icon}
                                                    resizeMode="contain"
                                                />
                                            ) : (
                                                <Ionicons
                                                    name={util.icon as any}
                                                    size={26}
                                                    color={colors.primary}
                                                />
                                            )}
                                        </View>
                                        <ThemedText
                                            style={[styles.label, { color: colors.text }]}
                                            numberOfLines={2}
                                            adjustsFontSizeToFit
                                            minimumFontScale={0.8}
                                        >
                                            {util.label}
                                        </ThemedText>
                                    </View>
                                </PressableScale>
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
        paddingBottom: 8,
    },
    categoryContainer: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '700',
        marginLeft: 6,
        marginBottom: 12,
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
        borderRadius: 22,
        paddingVertical: 14,
        paddingHorizontal: 8,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 96,
    },
    icon: {
        width: 44,
        height: 44,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        overflow: 'hidden',
    },
    label: {
        fontSize: 11,
        fontWeight: '600',
        textAlign: 'center',
        lineHeight: 14,
    },
});
