import { ThemedText } from '@/components/themedText';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Tooltip from 'react-native-walkthrough-tooltip';
import { useTheme } from '@/context/ThemeContext';

interface CategoryListingHeaderProps {
    categoryTitle: string;
    headerColor: string;
    search: string;
    setSearch: (text: string) => void;
    activeTab: 'all' | 'requests';
    setActiveTab: (tab: 'all' | 'requests') => void;
    onBack: () => void;
    onAdd: () => void;
    showTooltip?: boolean;
    onCloseTooltip?: () => void;
    tooltipMessage?: string;
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
    showTooltip = false,
    onCloseTooltip = () => { },
    tooltipMessage = 'نیا مقام شامل کرنے کے لیے یہاں ٹیپ کریں',
}) => {
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.headerContainer, { backgroundColor: headerColor, paddingTop: insets.top }]}>
            <View style={styles.headerContent}>
                <TouchableOpacity onPress={onBack} style={styles.iconButton}>
                    <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <ThemedText style={styles.headerTitle}>{categoryTitle}</ThemedText>
                <Tooltip
                    isVisible={showTooltip}
                    content={
                        <View style={styles.tooltipPill}>
                            <ThemedText style={styles.tooltipText}>{tooltipMessage}</ThemedText>
                            <TouchableOpacity onPress={onCloseTooltip} style={styles.tooltipClose}>
                                <Ionicons name="close-circle" size={18} color="#64748B" />
                            </TouchableOpacity>
                        </View>
                    }
                    placement="bottom"
                    onClose={onCloseTooltip}
                    contentStyle={styles.tooltipContent}
                    backgroundColor="rgba(0,0,0,0.2)"
                >
                    <TouchableOpacity
                        onPress={onAdd}
                        style={styles.iconButton}
                    >
                        <Ionicons name="add" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                </Tooltip>
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
                        All
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

export default React.memo(CategoryListingHeader);

const styles = StyleSheet.create({
    tooltipContent: {
        padding: 0,
        borderRadius: 40,
        backgroundColor: 'transparent',
    },
    tooltipPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 40,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
        gap: 12,
    },
    tooltipText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748B',
    },
    tooltipClose: {
        padding: 4,
    },
    headerContainer: {
        paddingBottom: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
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
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        height: 44,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
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
        paddingHorizontal: 12,
        paddingVertical: 4,
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
