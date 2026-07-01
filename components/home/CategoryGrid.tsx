import React, { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { SlideInLeft } from 'react-native-reanimated';

import { AnalyticsEvents, analyticsService } from '@/analytics';
import { ThemedText } from '@/components/ThemedText';
import { CATEGORIES_CONFIG, MORE_CATEGORIES_CONFIG, PLACE_CATEGORY_MAPPING } from '@/constants/categories';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';
import { CategoryCard } from './CategoryCard';

export const CategoryGrid = React.memo(function CategoryGrid() {
    const router = useRouter();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const { theme } = useTheme();
    const colors = (Colors as any)[theme];

    const handlePress = useCallback((category: string) => {
        const categoryLabel = PLACE_CATEGORY_MAPPING[category] || category;
        analyticsService.trackEvent(AnalyticsEvents.CATEGORY_CLICKED, {
            category,
            categoryLabel
        });
        router.push(`/listing/${category}` as any);
    }, [router]);

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
                            onPress={() => handlePress(cat.id)}
                        />
                    </Animated.View>
                ))}

                <Animated.View
                    entering={SlideInLeft.delay(100 + CATEGORIES_CONFIG.length * 80).duration(400)}
                    style={styles.gridItem}
                >
                    <CategoryCard
                        label="More"
                        icon="ellipsis-horizontal"
                        onPress={() => setIsModalVisible(true)}
                    />
                </Animated.View>
            </View>

            <Modal
                visible={isModalVisible}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setIsModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
                        <View style={styles.modalHeader}>
                            <ThemedText style={[styles.modalTitle, { color: colors.text }]}>More Categories</ThemedText>
                        </View>
                        <ScrollView contentContainerStyle={styles.modalGrid} showsVerticalScrollIndicator={false}>
                            {MORE_CATEGORIES_CONFIG.map((cat, index) => (
                                <Animated.View
                                    key={cat.id}
                                    entering={SlideInLeft.delay(index * 50).duration(300)}
                                    style={styles.gridItem}
                                >
                                    <CategoryCard
                                        label={cat.label}
                                        icon={cat.icon}
                                        onPress={() => {
                                            setIsModalVisible(false);
                                            handlePress(cat.id);
                                        }}
                                    />
                                </Animated.View>
                            ))}
                        </ScrollView>

                        <View style={styles.footerContainer}>
                            <TouchableOpacity
                                style={[styles.closePill, { backgroundColor: colors.primary }]}
                                onPress={() => setIsModalVisible(false)}
                            >
                                <ThemedText style={styles.closePillText}>Close</ThemedText>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
});

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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalCard: {
        width: '90%',
        maxHeight: '70%',
        borderRadius: Layout.borderRadius,
        padding: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingHorizontal: 6,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    modalGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingBottom: 8,
    },
    footerContainer: {
        marginTop: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    closePill: {
        width: 90,
        height: 34,
        borderRadius: 17,
        justifyContent: 'center',
        alignItems: 'center',
    },
    closePillText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '600',
    },
});
