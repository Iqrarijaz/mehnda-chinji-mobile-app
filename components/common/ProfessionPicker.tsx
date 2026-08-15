import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback, useMemo } from 'react';
import {
    Modal,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
    ActivityIndicator } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';

import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { Layout } from '@/constants/layout';
import { ThemedText } from '../ThemedText';
import { getAuthenticatedConfiguration, CONFIG_QUERY_KEYS } from '@/apis/configuration';

interface Profession {
    name_eng: string;
    name_ur: string;
    icon?: string;
}

interface ProfessionPickerProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (profession: Profession) => void;
    currentProfession?: string;
}

export const ProfessionPicker = React.memo(function ProfessionPicker({ visible, onClose, onSelect, currentProfession }: ProfessionPickerProps) {
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];
    const [searchQuery, setSearchQuery] = useState('');

    const { data: configData, isLoading } = useQuery({
        queryKey: CONFIG_QUERY_KEYS.professions,
        queryFn: () => getAuthenticatedConfiguration('PROFESSIONS'),
        staleTime: 1000 * 60 * 60 * 24, // 24 hours
    });

    const professionsList: Profession[] = configData?.data?.data || [];

    const filteredProfessions = useMemo(() => {
        if (!searchQuery) return professionsList;
        const q = searchQuery.toLowerCase();
        return professionsList.filter(
            p => p.name_eng?.toLowerCase().includes(q) || p.name_ur?.includes(q)
        );
    }, [searchQuery, professionsList]);

    const handleSelect = useCallback((item: Profession) => {
        onSelect(item);
        onClose();
    }, [onSelect, onClose]);

    const renderItem = useCallback(({ item }: { item: Profession }) => {
        const isSelected = currentProfession === item.name_eng;
        return (
            <TouchableOpacity
                style={[
                    styles.item,
                    { borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9' },
                    isSelected && { backgroundColor: `${colors.primary}15` }
                ]}
                onPress={() => handleSelect(item)}
            >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    {item.icon ? (
                        <Image
                            source={{ uri: item.icon }}
                            style={{ width: 24, height: 24 }}
                            contentFit="contain"
                        />
                    ) : (
                        <Ionicons name="briefcase-outline" size={20} color={colors.primary} />
                    )}
                    <ThemedText style={[styles.itemEngText, { color: colors.text }]}>{item.name_eng}</ThemedText>
                    {item.name_ur ? (
                        <ThemedText style={[styles.itemUrText, { color: colors.textSecondary }]}>({item.name_ur})</ThemedText>
                    ) : null}
                </View>
                {isSelected && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
            </TouchableOpacity>
        );
    }, [currentProfession, isDark, colors, handleSelect]);

    const keyExtractor = useCallback((item: Profession) => item.name_eng, []);

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                    <View style={styles.header}>
                        <ThemedText style={[styles.title, { color: colors.text }]}>Select Profession</ThemedText>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={colors.icon} />
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.searchContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9' }]}>
                        <Ionicons name="search" size={20} color={colors.icon} style={styles.searchIcon} />
                        <TextInput
                            style={[styles.searchInput, { color: colors.text }]}
                            placeholder="Search profession..."
                            placeholderTextColor={colors.placeholder}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            clearButtonMode="while-editing"
                        />
                    </View>

                    {isLoading ? (
                        <View style={{ padding: 20, alignItems: 'center' }}>
                            <ActivityIndicator size="small" color={colors.primary} />
                        </View>
                    ) : (
                        <View style={{ flex: 1, width: '100%' }}>
                            <FlashList
                                data={filteredProfessions}
                                keyExtractor={keyExtractor}
                                renderItem={renderItem}
                                estimatedItemSize={50}
                            />
                        </View>
                    )}
                </View>
            </View>
        </Modal >
    );
});

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16 },
    modalContent: {
        width: '90%',
        height: '60%',
        backgroundColor: '#FFFFFF',
        borderRadius: Layout.borderRadius,
        padding: 16,
        overflow: 'hidden' },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16 },
    modalTitle: {
        fontSize: 15.5,
        fontWeight: '800',
        letterSpacing: -0.5 },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 42,
        borderRadius: Layout.borderRadius,
        paddingHorizontal: 10,
        marginBottom: 16 },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 12.5,
        paddingVertical: 7 },
    listContent: {
        paddingBottom: 7 },
    item: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 10,
        marginVertical: 4,
        borderRadius: Layout.borderRadius },
    labelContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        flex: 1,
        marginRight: 15 },
    itemTextEng: {
        fontSize: 11.5,
        fontWeight: '600',
        textTransform: 'capitalize' },
    itemTextUr: {
        fontSize: 10.5,
        fontWeight: '500' },
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
        fontSize: 11.5,
        fontWeight: '600' } });
