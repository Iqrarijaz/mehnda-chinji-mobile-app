import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
    FlatList,
    Modal,
    Pressable,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

import { GET_DONORS_LIST } from '@/apis/bloodDonation';
import BloodRegistration from '@/components/BloodRegistration';
import DonorCard from '@/components/DonorCard';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { LiquidGlassLoader } from '@/components/ui/LiquidGlassLoader';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function BloodScreen() {
    const { user } = useAuth();
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];

    const [activeTab, setActiveTab] = useState<'find' | 'portal'>('find');
    const [donors, setDonors] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
    const [groupModalVisible, setGroupModalVisible] = useState(false);

    useEffect(() => {
        if (activeTab === 'find') {
            fetchDonors();
        }
    }, [activeTab, selectedGroup]);

    const fetchDonors = async (nameOverride?: string) => {
        try {
            setLoading(true);
            const response = await GET_DONORS_LIST({
                bloodGroup: selectedGroup || undefined,
                name: nameOverride || searchQuery || undefined,
            });
            if (response.success) {
                setDonors(response.data);
            }
        } catch (error) {
            console.error("Error fetching donors:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        fetchDonors();
    };

    return (
        <ThemedView style={styles.container}>
            {/* Tab Switcher - Redesigned with Glass UI */}
            <View style={styles.tabOuterContainer}>
                <LinearGradient
                    colors={isDark
                        ? ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.03)']
                        : ['rgba(15, 23, 42, 0.08)', 'rgba(15, 23, 42, 0.03)']}
                    style={styles.tabGlassContainer}
                >
                    <TouchableOpacity
                        style={[styles.tab]}
                        onPress={() => setActiveTab('find')}
                        activeOpacity={0.8}
                    >
                        {activeTab === 'find' && (
                            <LinearGradient
                                colors={[Colors[theme].secondary, '#FF8E3D']}
                                style={styles.activeTabIndicator}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            />
                        )}
                        <Ionicons
                            name="search"
                            size={16}
                            color={activeTab === 'find' ? '#FFFFFF' : isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'}
                            style={{ marginRight: 6 }}
                        />
                        <ThemedText style={[
                            styles.tabText,
                            activeTab === 'find' && { color: '#FFFFFF', fontWeight: '800' }
                        ]}>
                            Find Donors
                        </ThemedText>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.tab]}
                        onPress={() => setActiveTab('portal')}
                        activeOpacity={0.8}
                    >
                        {activeTab === 'portal' && (
                            <LinearGradient
                                colors={[Colors[theme].secondary, '#FF8E3D']}
                                style={styles.activeTabIndicator}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            />
                        )}
                        <Ionicons
                            name="water"
                            size={16}
                            color={activeTab === 'portal' ? '#FFFFFF' : isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'}
                            style={{ marginRight: 6 }}
                        />
                        <ThemedText style={[
                            styles.tabText,
                            activeTab === 'portal' && { color: '#FFFFFF', fontWeight: '800' }
                        ]}>
                            Donor Portal
                        </ThemedText>
                    </TouchableOpacity>
                </LinearGradient>
            </View>

            <View style={[styles.content, { display: activeTab === 'find' ? 'flex' : 'none' }]}>
                {/* Liquid Glass Search & Filter Header */}
                <View style={[styles.searchSection, { backgroundColor: isDark ? '#1e293b' : '#0F172A' }]}>
                    <ThemedText style={styles.searchTitle}>Find Donors</ThemedText>

                    <View style={styles.searchRow}>
                        {/* Search Bar */}
                        <View style={[styles.glassSearchInput, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)' }]}>
                            <Ionicons name="search" size={18} color="#94a3b8" />
                            <TextInput
                                placeholder="Search name or area..."
                                placeholderTextColor="#94a3b8"
                                style={styles.searchInput}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                onSubmitEditing={handleSearch}
                            />
                        </View>

                        {/* Group Selector Dropdown */}
                        <TouchableOpacity
                            style={[styles.groupDropdown, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)' }]}
                            onPress={() => setGroupModalVisible(true)}
                        >
                            <ThemedText style={[styles.groupTag, !selectedGroup && { opacity: 0.6 }]}>
                                {selectedGroup || 'Any'}
                            </ThemedText>
                            <Ionicons name="water" size={14} color="#ef4444" style={{ marginLeft: 4 }} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Donors List */}
                {loading && donors.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <LiquidGlassLoader />
                    </View>
                ) : (
                    <FlatList
                        data={donors}
                        renderItem={({ item }) => <DonorCard donor={item} />}
                        keyExtractor={item => item._id}
                        contentContainerStyle={styles.listContent}
                        onRefresh={fetchDonors}
                        refreshing={loading}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Ionicons name="search-outline" size={64} color="#94a3b8" />
                                <ThemedText style={styles.emptyText}>No donors found matching your search.</ThemedText>
                            </View>
                        }
                    />
                )}
            </View>

            <View style={{ flex: 1, display: activeTab === 'portal' ? 'flex' : 'none' }}>
                <BloodRegistration />
            </View>

            {/* Blood Group Modal */}
            <Modal
                visible={groupModalVisible}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setGroupModalVisible(false)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setGroupModalVisible(false)}
                >
                    <View style={styles.dropdownModalContent}>
                        <LinearGradient
                            colors={['#1e293b', '#0F172A']}
                            style={StyleSheet.absoluteFill}
                        />
                        <View style={styles.modalHeader}>
                            <ThemedText style={styles.modalTitle}>Filter by Group</ThemedText>
                        </View>

                        <TouchableOpacity
                            style={styles.groupItem}
                            onPress={() => {
                                setSelectedGroup(null);
                                setGroupModalVisible(false);
                            }}
                        >
                            <ThemedText style={[
                                styles.itemText,
                                !selectedGroup && styles.selectedItemText
                            ]}>
                                All Groups
                            </ThemedText>
                            {!selectedGroup && (
                                <Ionicons name="checkmark" size={20} color="#FF9B51" />
                            )}
                        </TouchableOpacity>

                        {BLOOD_GROUPS.map((group) => (
                            <TouchableOpacity
                                key={group}
                                style={styles.groupItem}
                                onPress={() => {
                                    setSelectedGroup(group);
                                    setGroupModalVisible(false);
                                }}
                            >
                                <ThemedText style={[
                                    styles.itemText,
                                    selectedGroup === group && styles.selectedItemText
                                ]}>
                                    {group}
                                </ThemedText>
                                {selectedGroup === group && (
                                    <Ionicons name="checkmark" size={20} color="#FF9B51" />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </Pressable>
            </Modal>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    tabOuterContainer: {
        paddingHorizontal: 20,
        marginVertical: 16,
    },
    tabGlassContainer: {
        flexDirection: 'row',
        height: 52,
        borderRadius: 16,
        padding: 5,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        overflow: 'hidden',
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
        position: 'relative',
    },
    activeTabIndicator: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 11,
    },
    tabText: {
        fontSize: 13,
        fontWeight: '600',
    },
    content: {
        flex: 1,
    },
    searchSection: {
        paddingTop: 10,
        paddingHorizontal: 20,
        paddingBottom: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        marginBottom: 8,
    },
    searchTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 12,
    },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    glassSearchInput: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        height: 48,
        borderRadius: 16,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    groupDropdown: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 48,
        paddingHorizontal: 14,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        minWidth: 70,
    },
    groupTag: {
        fontSize: 14,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        marginTop: 16,
        color: '#94a3b8',
        fontSize: 16,
        textAlign: 'center',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dropdownModalContent: {
        width: '85%',
        maxHeight: '70%',
        borderRadius: 24,
        padding: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    modalHeader: {
        marginBottom: 16,
        zIndex: 1,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#FFFFFF',
        textAlign: 'center',
    },
    groupItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    itemText: {
        fontSize: 16,
        color: '#FFFFFF',
    },
    selectedItemText: {
        color: '#FF9B51',
        fontWeight: '700',
    },
});
