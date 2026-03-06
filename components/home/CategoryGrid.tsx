import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { SlideInLeft } from 'react-native-reanimated';

import { ThemedText } from '@/components/themedText';
import { CATEGORIES_CONFIG } from '@/constants/categories';
import { CategoryCard } from './categoryCard';

export function CategoryGrid() {
    const router = useRouter();

    const handlePress = (categoryId: string) => {
        router.push(`/listing/${categoryId}` as any);
    };

    return (
        <View style={styles.container}>
            <ThemedText style={styles.sectionTitle}>Explore Categories</ThemedText>
            <View style={styles.grid}>
                {CATEGORIES_CONFIG.map((cat, index) => (
                    <Animated.View
                        key={cat.id}
                        entering={SlideInLeft.delay(100 + index * 80).duration(400)}
                        style={styles.gridItem}
                    >
                        <CategoryCard
                            label={cat.label}
                            icon={cat.icon}
                            color={cat.color}
                            onPress={() => handlePress(cat.id)}
                        />
                    </Animated.View>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 14,
        paddingBottom: 8,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '700',
        marginLeft: 6,
        marginBottom: 14,
        opacity: 0.85,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    gridItem: {
        width: '33.33%',
    },
});
