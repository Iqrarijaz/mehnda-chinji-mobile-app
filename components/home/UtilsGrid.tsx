import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { useHomePageConfig } from '@/hooks/useHomePageConfig';
import { CategoryCard } from './CategoryCard';

/**
 * Daily Utilities.
 *
 * The groups and their items come from the single HOME_PAGE_CONFIG document that
 * feeds Explore Categories, allowing administrators to reorder them, retitle them,
 * toggle icons, or gate items/groups to specific app versions.
 */

export const UtilsGrid = React.memo(function UtilsGrid() {
    const router = useRouter();
    const { theme } = useTheme();
    const colors = Colors[theme];

    // Already filtered to what this build should show, and ordered — a group
    // left with no visible items is dropped rather than rendered as a bare
    // heading.
    const { utilities } = useHomePageConfig();

    return (
        <View style={styles.container}>
            {utilities.map((group) => (
                <View key={group.id} style={styles.categoryContainer}>
                    <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                        {group.title}
                    </ThemedText>
                    {/* Same CategoryCard used by "Explore Categories" — same rounded
                        card, icon tile, and label treatment across the Home screen. */}
                    <View style={styles.grid}>
                        {group.items.map((util) => (
                            <View
                                key={util.id}
                                style={styles.gridItem}
                            >
                                <CategoryCard
                                    label={util.label}
                                    icon={util.icon ?? util.image}
                                    onPress={() => router.push(util.route as any)}
                                />
                            </View>
                        ))}
                    </View>
                </View>
            ))}
        </View>
    );
});

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
