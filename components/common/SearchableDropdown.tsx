import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Modal,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View } from 'react-native';
import { FlashList } from '@shopify/flash-list';

import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';
import { ThemedText } from '../ThemedText';

interface Option {
    label: string;
    value: string;
}

interface SearchableDropdownProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (value: string) => void;
    options: string[] | Option[]; // Can accept array of strings or objects
    title: string;
    placeholder?: string;
    currentValue?: string;
}

export const SearchableDropdown = React.memo(function SearchableDropdown({
    visible,
    onClose,
    onSelect,
    options,
    title,
    placeholder = "Search...",
    currentValue
}: SearchableDropdownProps) {
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];
    const [searchQuery, setSearchQuery] = useState('');

    const formattedOptions: Option[] = React.useMemo(() => {
        if (!options || options.length === 0) return [];
        const first = options[0];
        if (typeof first === 'string') {
            return (options as string[]).map(opt => ({ label: opt, value: opt }));
        }
        // If the API returned objects, map them using label/value or name fields
        return (options as any[]).map(opt => ({
            label: opt.label ?? opt.name ?? opt.name_eng ?? String(opt),
            value: opt.value ?? opt.name ?? opt.name_eng ?? String(opt) }));
    }, [options]);

    const filteredOptions = formattedOptions.filter(opt =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
                        <ThemedText style={[styles.modalTitle, { color: colors.text }]}>{title}</ThemedText>
                        {currentValue ? (
                            <TouchableOpacity onPress={() => { onSelect(''); onClose(); }}>
                                <ThemedText style={{ color: colors.primary, fontWeight: '700', fontSize: 12.5 }}>Clear</ThemedText>
                            </TouchableOpacity>
                        ) : null}
                    </View>

                    <View style={[styles.searchBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.035)' }]}>
                        <Ionicons name="search" size={18} color={colors.icon} />
                        <TextInput
                            placeholder={placeholder}
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

                    <View style={{ flex: 1, width: '100%' }}>
                        <FlashList
                            data={filteredOptions}
                            keyExtractor={(item) => item.value}
                            renderItem={({ item }) => {
                                const isSelected = currentValue === item.value;
                                return (
                                    <TouchableOpacity
                                        style={[
                                            styles.item,
                                            isSelected && { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : colors.primary + '10' }
                                        ]}
                                        onPress={() => {
                                            onSelect(item.value);
                                            setSearchQuery('');
                                            onClose();
                                        }}
                                    >
                                        <View style={styles.labelContainer}>
                                            <ThemedText style={[
                                                styles.itemText,
                                                { color: colors.text },
                                                isSelected && { color: colors.primary, fontWeight: '700' }
                                            ]}>
                                                {item.label}
                                            </ThemedText>
                                        </View>
                                        {isSelected && (
                                            <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                                        )}
                                    </TouchableOpacity>
                                );
                            }}
                            contentContainerStyle={styles.listContent}
                            ListEmptyComponent={
                                <View style={styles.emptyContainer}>
                                    {searchQuery.length > 0 ? (
                                        <View style={styles.addOptionContainer}>
                                            <ThemedText style={[styles.emptyText, { color: colors.icon, marginBottom: 12 }]}>No options found for "{searchQuery}"</ThemedText>
                                            <TouchableOpacity
                                                style={[styles.addButton, { backgroundColor: colors.primary + '15' }]}
                                                onPress={() => {
                                                    onSelect(searchQuery);
                                                    setSearchQuery('');
                                                    onClose();
                                                }}
                                            >
                                                <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                                                <ThemedText style={[styles.addButtonText, { color: colors.primary }]}>Add "{searchQuery}"</ThemedText>
                                            </TouchableOpacity>
                                        </View>
                                    ) : (
                                        <ThemedText style={[styles.emptyText, { color: colors.icon }]}>No options found</ThemedText>
                                    )}
                                </View>
                            }
                        />
                    </View>

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
        fontWeight: 'bold' },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: Layout.borderRadius - 2,
        paddingHorizontal: 10,
        marginBottom: 16 },
    searchInput: {
        flex: 1,
        height: 38,
        marginLeft: 8,
        fontFamily: 'Inter-Regular' },
    listContent: {
        paddingBottom: 16 },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderRadius: Layout.borderRadius,
        marginBottom: 4 },
    labelContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingRight: 13 },
    itemText: {
        fontSize: 12.5,
        fontFamily: 'Inter-Medium' },
    emptyContainer: {
        padding: 16,
        alignItems: 'center' },
    emptyText: {
        fontSize: 12.5,
        textAlign: 'center' },
    addOptionContainer: {
        width: '100%',
        alignItems: 'center',
        paddingVertical: 8 },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: Layout.borderRadius,
        borderStyle: 'dashed',
        width: '100%',
        gap: 8 },
    addButtonText: {
        fontSize: 12.5,
        fontWeight: '700' },
    footerContainer: {
        marginTop: 16,
        alignItems: 'center' },
    closePill: {
        paddingHorizontal: 13,
        paddingVertical: 5,
        borderRadius: Layout.borderRadius },
    closePillText: {
        color: '#FFFFFF',
        fontSize: 10.5,
        fontWeight: '600' } });
