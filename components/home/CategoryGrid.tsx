import React, { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { AnalyticsEvents, analyticsService } from '@/analytics';
import { ThemedText } from '@/components/ThemedText';
import { PLACE_CATEGORY_MAPPING, CategoryInfo } from '@/constants/categories';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';
import { useHomePageConfig } from '@/hooks/useHomePageConfig';
import { CategoryCard } from './CategoryCard';

export const CategoryGrid = React.memo(function CategoryGrid() {
    const router = useRouter();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const { theme } = useTheme();
    const colors = (Colors as any)[theme];

    // Shared with UtilsGrid — one single HOME_PAGE_CONFIG request feeds both.
    const { categories, moreCategories } = useHomePageConfig();

    const handlePress = useCallback((category: CategoryInfo) => {
        const categoryLabel = PLACE_CATEGORY_MAPPING[category.id] || category.label || category.id;
        analyticsService.trackEvent(AnalyticsEvents.CATEGORY_CLICKED, {
            category: category.id,
            categoryLabel
        });
        // Honour the route the layout configures; fall back to the listing
        // convention so an entry added without one still navigates.
        router.push((category.route || `/listing/${category.id}`) as any);
    }, [router]);

    return (
        <View style={styles.container}>
            <ThemedText style={styles.sectionTitle}>Explore Categories</ThemedText>
            <View style={styles.grid}>
                {categories.map((cat) => (
                    <View
                        key={cat.id}
                        style={styles.gridItem}
                    >
                        <CategoryCard
                            label={cat.label}
                            icon={cat.icon}
                            onPress={() => handlePress(cat)}
                        />
                    </View>
                ))}

                {moreCategories.length > 0 && (
                    <View
                        style={styles.gridItem}
                    >
                        <CategoryCard
                            label="More"
                            icon="ellipsis-horizontal"
                            onPress={() => setIsModalVisible(true)}
                        />
                    </View>
                )}
            </View>

            <Modal
                visible={isModalVisible}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setIsModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalCard, { backgroundColor: colors.cardBg }]}>
                        <View style={styles.modalHeader}>
                            <ThemedText style={[styles.modalTitle, { color: colors.text }]}>More Categories</ThemedText>
                        </View>
                        <ScrollView contentContainerStyle={styles.modalGrid} showsVerticalScrollIndicator={false}>
                            {moreCategories.map((cat) => (
                                <View
                                    key={cat.id}
                                    style={styles.gridItem}
                                >
                                    <CategoryCard
                                        label={cat.label}
                                        icon={cat.icon}
                                        onPress={() => {
                                             setIsModalVisible(false);
                                             handlePress(cat);
                                        }}
                                    />
                                </View>
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
        paddingBottom: 8 },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '700',
        marginLeft: 6,
        marginTop: 10,
        marginBottom: 14,
        opacity: 0.85 },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap' },
    gridItem: {
        width: '33.33%' },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center' },
    modalCard: {
        width: '90%',
        height: '60%',
        borderRadius: Layout.borderRadius,
        padding: 20,
        overflow: 'hidden' },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingHorizontal: 6 },
    modalTitle: {
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: -0.5 },
    modalGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingBottom: 8 },
    footerContainer: {
        marginTop: 16,
        alignItems: 'center',
        justifyContent: 'center' },
    closePill: {
        width: 90,
        height: 34,
        borderRadius: Layout.borderRadius,
        justifyContent: 'center',
        alignItems: 'center' },
    closePillText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '600' } });
