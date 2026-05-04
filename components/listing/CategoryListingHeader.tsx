import { ThemedText } from '@/components/themedText';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
    Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Tooltip from 'react-native-walkthrough-tooltip';
import { useTheme } from '@/context/ThemeContext';
import { Layout } from '@/constants/layout';
import { Colors } from '@/constants/colors';

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
    children?: React.ReactNode;
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
    children,
}) => {
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();
    const colors = Colors[theme];

    return (
        <View style={[styles.headerContainer, { backgroundColor: headerColor, paddingTop: insets.top + (Platform.OS === 'android' ? 16 : 20) }]}>
            <View style={styles.headerContent}>
                <TouchableOpacity onPress={onBack} style={styles.iconButton}>
                    <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <ThemedText style={styles.headerTitle}>{categoryTitle}</ThemedText>
                
                <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                        onPress={() => setActiveTab(activeTab === 'all' ? 'requests' : 'all')}
                        style={[
                            styles.iconButton,
                            activeTab === 'requests' && { backgroundColor: '#FFFFFF' }
                        ]}
                    >
                        <Ionicons 
                            name={activeTab === 'requests' ? "list" : "list-outline"} 
                            size={22} 
                            color={activeTab === 'requests' ? headerColor : "#FFFFFF"} 
                        />
                    </TouchableOpacity>

                    <Tooltip
                        isVisible={showTooltip}
                        content={
                            <View style={[styles.tooltipPill, { backgroundColor: colors.card }]}>
                                <ThemedText style={[styles.tooltipText, { color: colors.textSecondary }]}>{tooltipMessage}</ThemedText>
                                <TouchableOpacity onPress={onCloseTooltip} style={styles.tooltipClose}>
                                    <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
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
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={[styles.searchBar, { backgroundColor: colors.card, marginBottom: 0 }]}>
                    <Ionicons name="search" size={20} color={colors.icon} />
                    <TextInput
                        style={[styles.searchInput, { color: colors.text }]}
                        placeholder="Search..."
                        placeholderTextColor={colors.icon}
                        value={search}
                        onChangeText={setSearch}
                    />
                    {search.length > 0 && (
                        <TouchableOpacity onPress={() => setSearch('')}>
                            <Ionicons name="close-circle" size={20} color={colors.icon} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {children}
        </View>
    );
};

export default React.memo(CategoryListingHeader);

const styles = StyleSheet.create({
    tooltipContent: {
        padding: 0,
        borderRadius: Layout.borderRadius,
        backgroundColor: 'transparent',
    },
    tooltipPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: Layout.borderRadius,
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
    headerContainer: {
        paddingBottom: Platform.OS === 'android' ? 10 : 6,
        paddingHorizontal: Platform.OS === 'android' ? 18 : 20,
        borderBottomLeftRadius: Layout.headerBorderRadius,
        borderBottomRightRadius: Layout.headerBorderRadius,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        zIndex: 10,
    },
    tooltipClose: {
        padding: 4,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
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
        paddingBottom: 8,
    },
    searchBar: {
        backgroundColor: '#FFFFFF',
        borderRadius: Layout.borderRadius,
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
        gap: 12,
    },
    filterChip: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: Layout.borderRadius,
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
