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

export function ProfessionPicker({ visible, onClose, onSelect, currentProfession }: ProfessionPickerProps) {
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
        return professionsList.filter(prof =>
            prof.name_eng?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            prof.name_ur?.includes(searchQuery)
        );
    }, [professionsList, searchQuery]);

    const keyExtractor = useCallback((item: Profession) => item.name_eng, []);

    const renderItem = useCallback(({ item }: { item: Profession }) => {
        const isSelected = currentProfession === item.name_eng;
        return (
            <TouchableOpacity
                style={[
                    styles.item,
                    isSelected && { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : colors.primary + '10' }
                ]}
                onPress={() => {
                    onSelect(item);
                    setSearchQuery('');
                    onClose();
                }}
            >
                <View style={styles.labelContainer}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        {item.icon ? (
                            <Image
                                source={{ uri: item.icon }}
                                style={{ width: 28, height: 28, marginRight: 12, borderRadius: Layout.borderRadius }}
                                contentFit="contain"
                            />
                        ) : (
                            <View style={{ width: 28, height: 28, marginRight: 12, borderRadius: Layout.borderRadius, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9', justifyContent: 'center', alignItems: 'center' }}>
                                <Ionicons name="briefcase-outline" size={16} color={colors.icon} />
                            </View>
                        )}
                        <ThemedText style={[
                            styles.itemTextEng,
                            { color: colors.text },
                            isSelected && { color: colors.primary, fontWeight: '700' }
                        ]}>
                            {item.name_eng}
                        </ThemedText>
                    </View>
                    <ThemedText style={[
                        styles.itemTextUr,
                        { color: colors.icon },
                        isSelected && { color: colors.primary, fontWeight: '700' }
                    ]}>
                        {item.name_ur}
                    </ThemedText>
                </View>
                {isSelected && (
                    <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                )}
            </TouchableOpacity>
        );
    }, [currentProfession, isDark, colors.primary, colors.text, colors.icon, onSelect, onClose]);

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
                        <ThemedText style={[styles.modalTitle, { color: colors.text }]}>Select Profession</ThemedText>
                        {currentProfession && currentProfession !== 'All' && (
                            <TouchableOpacity
                                onPress={() => {
                                    onSelect({ name_eng: 'All', name_ur: 'تمام' });
                                    onClose();
                                }}
                            >
                                <ThemedText style={{ color: colors.primary, fontWeight: '700', fontSize: 12.5 }}>Clear</ThemedText>
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={[styles.searchBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.035)' }]}>
                        <Ionicons name="search" size={18} color={colors.icon} />
                        <TextInput
                            placeholder="Search profession..."
                            placeholderTextColor={colors.icon}
                            style={[styles.searchInput, { color: colors.text }]}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            autoFocus={false}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                <Ionicons name="close-circle" size={18} color={colors.icon} />
                            </TouchableOpacity>
                        )}
                    </View>

                    {isLoading ? (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                            <ActivityIndicator size="large" color={colors.primary} />
                        </View>
                    ) : (
                        <View style={{ flex: 1, width: '100%' }}>
                            <FlashList
                                data={filteredProfessions}
                                keyExtractor={keyExtractor}
                                renderItem={renderItem}
                                contentContainerStyle={styles.listContent}
                                ListEmptyComponent={() => (
                                    <View style={{ padding: 16, alignItems: 'center' }}>
                                        <ThemedText style={{ color: colors.icon }}>No professions found.</ThemedText>
                                    </View>
                                )}
                            />
                        </View>
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
        </Modal >
    );
}

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
