import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, View, Modal, TouchableOpacity, ScrollView } from 'react-native';
import Animated, { SlideInLeft } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themedText';
import { AnalyticsEvents, analyticsService } from '@/analytics';
import { CATEGORIES_CONFIG, MORE_CATEGORIES_CONFIG } from '@/constants/categories';
import { CategoryCard } from './categoryCard';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/colors';

export function CategoryGrid() {
    const router = useRouter();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];

    const handlePress = (categoryId: string) => {
        analyticsService.trackEvent(AnalyticsEvents.CATEGORY_CLICKED, { categoryId });
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

                <Animated.View
                    entering={SlideInLeft.delay(100 + CATEGORIES_CONFIG.length * 80).duration(400)}
                    style={styles.gridItem}
                >
                    <CategoryCard
                        label="More"
                        icon="ellipsis-horizontal"
                        color="#8B5CF6"
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
                    <View style={[styles.modalCard, { backgroundColor: colors.background }]}>
                        <View style={styles.modalHeader}>
                            <ThemedText style={styles.modalTitle}>More Categories</ThemedText>
                            <TouchableOpacity onPress={() => setIsModalVisible(false)} style={[styles.closeButton, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#F3F4F6' }]}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView contentContainerStyle={styles.modalGrid}>
                            {MORE_CATEGORIES_CONFIG.map((cat, index) => (
                                <Animated.View
                                    key={cat.id}
                                    entering={SlideInLeft.delay(index * 50).duration(300)}
                                    style={styles.gridItem}
                                >
                                    <CategoryCard
                                        label={cat.label}
                                        icon={cat.icon}
                                        color={cat.color}
                                        onPress={() => {
                                            setIsModalVisible(false);
                                            handlePress(cat.id);
                                        }}
                                    />
                                </Animated.View>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalCard: {
        width: '95%',
        height: '50%',
        borderRadius: 24,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 6,
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    closeButton: {
        padding: 8,
        backgroundColor: '#F3F4F6',
        borderRadius: 20,
    },
    modalGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingBottom: 20,
    },
});
