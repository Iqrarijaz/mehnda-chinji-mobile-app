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

import professionsData from '../data/professions.json';
import { ThemedText } from './themed-text';

interface Profession {
    name_eng: string;
    name_ur: string;
}

interface ProfessionPickerProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (profession: Profession) => void;
    currentProfession?: string;
}

export function ProfessionPicker({ visible, onClose, onSelect, currentProfession }: ProfessionPickerProps) {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredProfessions = professionsData.filter(prof =>
        prof.name_eng.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prof.name_ur.includes(searchQuery)
    );

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <LinearGradient
                        colors={['#1e293b', '#0F172A']}
                        style={StyleSheet.absoluteFill}
                    />

                    <View style={styles.modalHeader}>
                        <ThemedText style={styles.modalTitle}>Select Profession</ThemedText>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.searchBar}>
                        <Ionicons name="search" size={20} color="rgba(255, 255, 255, 0.4)" />
                        <TextInput
                            placeholder="Search profession (English or Urdu)..."
                            placeholderTextColor="rgba(255, 255, 255, 0.4)"
                            style={styles.searchInput}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            autoFocus={false}
                        />
                    </View>

                    <FlatList
                        data={filteredProfessions}
                        keyExtractor={(item: Profession) => item.name_eng}
                        renderItem={({ item }: { item: Profession }) => (
                            <TouchableOpacity
                                style={styles.item}
                                onPress={() => {
                                    onSelect(item);
                                    setSearchQuery('');
                                    onClose();
                                }}
                            >
                                <View style={styles.labelContainer}>
                                    <ThemedText style={[
                                        styles.itemTextEng,
                                        currentProfession === item.name_eng && styles.selectedText
                                    ]}>
                                        {item.name_eng}
                                    </ThemedText>
                                    <ThemedText style={[
                                        styles.itemTextUr,
                                        currentProfession === item.name_eng && styles.selectedText
                                    ]}>
                                        {item.name_ur}
                                    </ThemedText>
                                </View>
                                {currentProfession === item.name_eng && (
                                    <Ionicons name="checkmark" size={20} color="#FF9B51" />
                                )}
                            </TouchableOpacity>
                        )}
                        contentContainerStyle={styles.listContent}
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
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
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
        fontSize: 20,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        height: 52,
        borderRadius: 16,
        paddingHorizontal: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        zIndex: 1,
    },
    searchInput: {
        flex: 1,
        marginLeft: 12,
        fontSize: 16,
        color: '#FFFFFF',
    },
    listContent: {
        paddingBottom: 40,
    },
    item: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    labelContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        flex: 1,
        marginRight: 15,
    },
    itemTextEng: {
        fontSize: 16,
        color: '#FFFFFF',
        fontWeight: '600',
        paddingVertical: 2,
    },
    itemTextUr: {
        fontSize: 18,
        paddingVertical: 8,
        paddingRight: 16,
        lineHeight: 28,
        color: 'rgba(255, 255, 255, 0.7)',
        fontWeight: '500',
    },
    selectedText: {
        color: '#FF9B51',
        fontWeight: '700',
    },
});
