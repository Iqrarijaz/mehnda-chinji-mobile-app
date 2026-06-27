import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
    FlatList,
    Modal,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

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

export function SearchableDropdown({
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
        if (options.length === 0) return [];
        if (typeof options[0] === 'string') {
            return (options as string[]).map(opt => ({ label: opt, value: opt }));
        }
        return options as Option[];
    }, [options]);

    const filteredOptions = formattedOptions.filter(opt =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    {isDark && (
                        <LinearGradient
                            colors={['rgba(255,255,255,0.02)', 'rgba(255,255,255,0.05)']}
                            style={StyleSheet.absoluteFill}
                        />
                    )}

                    <View style={styles.modalHeader}>
                        <ThemedText style={[styles.modalTitle, { color: colors.text }]}>{title}</ThemedText>
                        <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.searchBar, {
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9',
                        borderColor: colors.border
                    }]}>
                        <Ionicons name="search" size={20} color={colors.icon} />
                        <TextInput
                            placeholder={placeholder}
                            placeholderTextColor={colors.icon}
                            style={[styles.searchInput, { color: colors.text }]}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            autoFocus={false}
                        />
                    </View>

                    <FlatList
                        data={filteredOptions}
                        keyExtractor={(item) => item.value}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[styles.optionItem, { borderBottomColor: colors.border }]}
                                onPress={() => {
                                    onSelect(item.value);
                                    setSearchQuery('');
                                    onClose();
                                }}
                            >
                                <ThemedText style={[
                                    styles.optionText,
                                    { color: colors.text },
                                    currentValue === item.value && { color: colors.primary, fontWeight: '700' }
                                ]}>
                                    {item.label}
                                </ThemedText>
                                {currentValue === item.value && (
                                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                                )}
                            </TouchableOpacity>
                        )}
                        contentContainerStyle={styles.listContent}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                {searchQuery.length > 0 ? (
                                    <View style={styles.addOptionContainer}>
                                        <ThemedText style={[styles.emptyText, { color: colors.icon, marginBottom: 12 }]}>No options found for "{searchQuery}"</ThemedText>
                                        <TouchableOpacity
                                            style={[styles.addButton, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}
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
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        height: '80%',
        borderTopLeftRadius: Layout.borderRadius,
        borderTopRightRadius: Layout.borderRadius,
        padding: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        zIndex: 1,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        height: 52,
        borderRadius: Layout.borderRadius,
        paddingHorizontal: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        zIndex: 1,
    },
    searchInput: {
        flex: 1,
        marginLeft: 12,
        fontSize: 12,
        color: '#FFFFFF',
    },
    listContent: {
        paddingBottom: 40,
    },
    optionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    optionText: {
        fontSize: 12,
        color: '#FFFFFF',
    },
    selectedOptionText: {
        color: '#FF9B51',
        fontWeight: '700',
    },
    emptyContainer: {
        padding: 20,
        alignItems: 'center',
    },
    emptyText: {
        color: 'rgba(255, 255, 255, 0.4)',
        fontSize: 14,
        textAlign: 'center',
    },
    addOptionContainer: {
        width: '100%',
        alignItems: 'center',
        paddingVertical: 10,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: Layout.borderRadius,
        borderWidth: 1,
        borderStyle: 'dashed',
        width: '100%',
        gap: 8,
    },
    addButtonText: {
        fontSize: 15,
        fontWeight: '700',
    }
});
