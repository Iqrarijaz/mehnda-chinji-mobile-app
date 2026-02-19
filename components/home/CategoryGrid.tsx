import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { CategoryCard } from './CategoryCard';

const CATEGORIES = [
    { id: 'education', label: 'Education', icon: 'school', color: '#3B82F6' },
    { id: 'religious', label: 'Religious', icon: 'book', color: '#10B981' }, // book for Quran/Mosque/Religious
    { id: 'health', label: 'Health', icon: 'medkit', color: '#EF4444' },
    { id: 'govt', label: 'Govt Offices', icon: 'business', color: '#6366F1' },
    { id: 'shops', label: 'Shops', icon: 'cart', color: '#F59E0B' },
    // { id: 'playgrounds', label: 'Playgrounds', icon: 'football', color: '#8B5CF6' },
    // { id: 'food', label: 'Food', icon: 'restaurant', color: '#EC4899' },
    // { id: 'services', label: 'Services', icon: 'construct', color: '#64748B' },
];

export function CategoryGrid() {
    const router = useRouter();

    const handlePress = (categoryId: string) => {
        router.push(`/listing/${categoryId}` as any);
    };

    return (
        <View style={styles.container}>
            <ThemedText style={styles.sectionTitle}>Explore Categories</ThemedText>
            <View style={styles.grid}>
                {CATEGORIES.map((cat) => (
                    <View key={cat.id} style={styles.gridItem}>
                        <CategoryCard
                            label={cat.label}
                            icon={cat.icon}
                            color={cat.color}
                            onPress={() => handlePress(cat.id)}
                        />
                    </View>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 14, // slightly less to account for card margins
        paddingTop: 20,
        paddingBottom: 40,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginLeft: 6,
        marginBottom: 16,
        opacity: 0.9,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    gridItem: {
        width: '33.33%', // 3 columns
    }
});
