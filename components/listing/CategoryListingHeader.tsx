import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface CategoryListingHeaderProps {
    categoryTitle: string;
    headerColor: string;
    search: string;
    setSearch: (text: string) => void;
    activeTab: 'all' | 'requests';
    setActiveTab: (tab: 'all' | 'requests') => void;
    onBack: () => void;
    onAdd: () => void;
}

const CategoryListingHeader: React.FC<CategoryListingHeaderProps> = ({
    categoryTitle,
    headerColor,
    search,
    setSearch,
    activeTab,
    setActiveTab,
    onBack,
    onAdd,
}) => {
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.headerContainer, { backgroundColor: headerColor, paddingTop: insets.top }]}>
            <View style={styles.headerContent}>
                <TouchableOpacity onPress={onBack} style={styles.iconButton}>
                    <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <ThemedText style={styles.headerTitle}>{categoryTitle}</ThemedText>
                <TouchableOpacity onPress={onAdd} style={styles.iconButton}>
                    <Ionicons name="add" size={24} color="#FFFFFF" />
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <Ionicons name="search" size={20} color="#94A3B8" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search..."
                        placeholderTextColor="#94A3B8"
                        value={search}
                        onChangeText={setSearch}
                    />
                    {search.length > 0 && (
                        <TouchableOpacity onPress={() => setSearch('')}>
                            <Ionicons name="close-circle" size={20} color="#94A3B8" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Filter Chips */}
            <View style={styles.filterContainer}>
                <TouchableOpacity
                    style={[styles.filterChip, activeTab === 'all' && styles.activeFilterChip]}
                    onPress={() => setActiveTab('all')}
                >
                    <ThemedText style={[
                        styles.filterText,
                        activeTab === 'all' && [styles.activeFilterText, { color: headerColor }]
                    ]}>
                        All Places
                    </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterChip, activeTab === 'requests' && styles.activeFilterChip]}
                    onPress={() => setActiveTab('requests')}
                >
                    <ThemedText style={[
                        styles.filterText,
                        activeTab === 'requests' && [styles.activeFilterText, { color: headerColor }]
                    ]}>
                        My Requests
                    </ThemedText>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default CategoryListingHeader;

const styles = StyleSheet.create({
    headerContainer: {
        paddingBottom: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
        zIndex: 10,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 10,
        marginBottom: 16,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    searchContainer: {
        paddingHorizontal: 20,
        paddingBottom: 16,
    },
    searchBar: {
        backgroundColor: '#FFFFFF', // Search bar is always white in this design
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        height: 44,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 15,
        color: '#0F172A',
    },
    filterContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 12,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    activeFilterChip: {
        backgroundColor: '#FFFFFF',
        borderColor: '#FFFFFF',
    },
    filterText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '600',
    },
    activeFilterText: {
        fontWeight: '700',
    },
});
