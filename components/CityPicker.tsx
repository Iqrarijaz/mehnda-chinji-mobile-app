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

import citiesData from '../data/cities.json';
import { ThemedText } from './themed-text';

interface CityPickerProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (city: string) => void;
    currentCity?: string;
}

export function CityPicker({ visible, onClose, onSelect, currentCity }: CityPickerProps) {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredCities = citiesData.filter(city =>
        city.toLowerCase().includes(searchQuery.toLowerCase())
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
                        <ThemedText style={styles.modalTitle}>Select City</ThemedText>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.searchBar}>
                        <Ionicons name="search" size={20} color="rgba(255, 255, 255, 0.4)" />
                        <TextInput
                            placeholder="Search city..."
                            placeholderTextColor="rgba(255, 255, 255, 0.4)"
                            style={styles.searchInput}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            autoFocus={false}
                        />
                    </View>

                    <FlatList
                        data={filteredCities}
                        keyExtractor={(item: string) => item}
                        renderItem={({ item }: { item: string }) => (
                            <TouchableOpacity
                                style={styles.cityItem}
                                onPress={() => {
                                    onSelect(item);
                                    setSearchQuery('');
                                    onClose();
                                }}
                            >
                                <ThemedText style={[
                                    styles.cityItemText,
                                    currentCity === item && styles.selectedCityText
                                ]}>
                                    {item}
                                </ThemedText>
                                {currentCity === item && (
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
    cityItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    cityItemText: {
        fontSize: 16,
        color: '#FFFFFF',
    },
    selectedCityText: {
        color: '#FF9B51',
        fontWeight: '700',
    },
});
