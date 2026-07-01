import { Ionicons } from '@expo/vector-icons';
import { useCallback, useMemo } from 'react';
import {
    SectionList,
    Modal,
    StyleSheet,
    TouchableOpacity,
    View,
    ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { Layout } from '@/constants/layout';
import { ThemedText } from '@/components/ThemedText';
import { getAuthenticatedConfiguration, CONFIG_QUERY_KEYS } from '@/apis/configuration';

export interface CategorySelection {
    category: { en: string; ur: string };
    type: { en: string; ur: string };
}

export interface MarketplaceCategoryPickerProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (selection: CategorySelection) => void;
    currentCategory?: string;
    currentType?: string;
}

interface CategoryItem {
    key: string;
    name: { en: string; ur: string; };
}

interface CategoryConfig {
    key: string;
    title: { en: string; ur: string; };
    items?: CategoryItem[];
}

interface SectionData {
    title: CategoryConfig;
    data: CategoryItem[];
}

export function MarketplaceCategoryPicker({ visible, onClose, onSelect, currentCategory, currentType }: MarketplaceCategoryPickerProps) {
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];

    const { data: configData, isLoading } = useQuery({
        queryKey: CONFIG_QUERY_KEYS.marketplaceCategories,
        queryFn: () => getAuthenticatedConfiguration('MARKETPLACE_CATEGORIES'),
        staleTime: 1000 * 60 * 60 * 24, // 24 hours
    });

    // Extremely robust extraction, matches ProfessionPicker
    const categoriesList: CategoryConfig[] = Array.isArray(configData?.data?.data) ? configData.data.data :
        Array.isArray(configData?.data) ? configData.data :
        Array.isArray(configData) ? configData : [];

    // Group the categories and types into sections
    const sectionsList = useMemo(() => {
        const sections: SectionData[] = [];
        categoriesList.forEach(cat => {
            const items = cat.items && cat.items.length > 0 ? cat.items : [{ key: cat.key, name: cat.title }];
            sections.push({
                title: cat,
                data: items
            });
        });
        return sections;
    }, [categoriesList]);

    const renderItem = useCallback(({ item, section }: { item: CategoryItem, section: SectionData }) => {
        const isSelected = currentCategory === section.title.title.en && currentType === item.name.en;
        return (
            <TouchableOpacity
                style={[
                    styles.item,
                    isSelected && { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : colors.primary + '10' }
                ]}
                onPress={() => {
                    onSelect({
                        category: { en: section.title.title.en, ur: section.title.title.ur },
                        type: { en: item.name.en, ur: item.name.ur }
                    });
                    onClose();
                }}
            >
                <View style={styles.labelContainer}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <ThemedText style={[
                            styles.itemTextEng,
                            { color: colors.text, marginLeft: 12 },
                            isSelected && { color: colors.primary, fontWeight: '700' }
                        ]}>
                            {item.name.en}
                        </ThemedText>
                    </View>
                    <ThemedText style={[
                        styles.itemTextUr,
                        { color: colors.icon },
                        isSelected && { color: colors.primary, fontWeight: '700' }
                    ]}>
                        {item.name.ur}
                    </ThemedText>
                </View>
                {isSelected && (
                    <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                )}
            </TouchableOpacity>
        );
    }, [currentCategory, currentType, isDark, colors.primary, colors.text, colors.icon, onSelect, onClose]);

    const renderSectionHeader = useCallback(({ section }: { section: SectionData }) => {
        const isSelected = currentCategory === section.title.title.en && currentType === 'All';
        
        return (
            <TouchableOpacity 
                style={[styles.sectionHeader, { backgroundColor: colors.card, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}
                onPress={() => {
                    onSelect({
                        category: { en: section.title.title.en, ur: section.title.title.ur },
                        type: { en: 'All', ur: 'تمام' }
                    });
                    onClose();
                }}
            >
                <ThemedText style={[styles.sectionHeaderTextEng, { color: colors.textSecondary }]}>
                    {section.title.title.en}
                </ThemedText>
                <Ionicons 
                    name={isSelected ? "checkmark-circle" : "ellipse-outline"} 
                    size={20} 
                    color={isSelected ? colors.primary : colors.icon} 
                />
            </TouchableOpacity>
        );
    }, [colors.card, colors.textSecondary, colors.primary, colors.icon, currentCategory, currentType, onSelect, onClose]);

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                    <View style={styles.modalHeader}>
                        <ThemedText style={[styles.modalTitle, { color: colors.text }]}>Select Category</ThemedText>
                        {(currentCategory || currentType) && (
                            <TouchableOpacity
                                onPress={() => {
                                    onSelect({ category: { en: 'All', ur: 'تمام' }, type: { en: 'All', ur: 'تمام' } });
                                    onClose();
                                }}
                            >
                                <ThemedText style={{ color: colors.primary, fontWeight: '700', fontSize: 14 }}>Clear</ThemedText>
                            </TouchableOpacity>
                        )}
                    </View>

                    {isLoading ? (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                            <ActivityIndicator size="large" color={colors.primary} />
                        </View>
                    ) : (
                        <SectionList
                            sections={sectionsList}
                            keyExtractor={(item) => item.key}
                            renderItem={renderItem}
                            renderSectionHeader={renderSectionHeader}
                            contentContainerStyle={styles.listContent}
                            stickySectionHeadersEnabled={false}
                            ListEmptyComponent={() => (
                                <View style={{ padding: 20, alignItems: 'center' }}>
                                    <ThemedText style={{ color: colors.icon }}>No categories found.</ThemedText>
                                </View>
                            )}
                        />
                    )}

                    <View style={styles.footerContainer}>
                        <TouchableOpacity
                            style={[styles.closePill, { backgroundColor: colors.primary }]}
                            onPress={onClose}
                        >
                            <ThemedText style={styles.closePillText}>Close</ThemedText>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
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
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    listContent: {
        paddingBottom: 20,
    },
    sectionHeader: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        marginTop: 8,
    },
    sectionHeaderTextEng: {
        fontSize: 14,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginBottom: 4,
    },
    labelContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingRight: 16,
    },
    itemTextEng: {
        fontSize: 15,
        fontFamily: 'Inter-Medium',
    },
    itemTextUr: {
        fontSize: 15,
        fontFamily: 'Jameel-Noori-Nastaleeq',
    },
    footerContainer: {
        marginTop: 16,
        alignItems: 'center',
    },
    closePill: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 16,
    },
    closePillText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },
});