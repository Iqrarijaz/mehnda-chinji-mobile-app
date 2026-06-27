import { NotificationIcon } from '@/components/common/NotificationIcon';
import { ThemedText } from '@/components/ThemedText';
import Avatar from '@/components/ui/avatar';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';
import React, { useRef } from 'react';
import {
    Platform,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Tooltip from 'react-native-walkthrough-tooltip';

interface BloodDonorHeaderProps {
    navigation: any;
    user: any;
    activeTab: 'find' | 'portal';
    setActiveTab: (tab: 'find' | 'portal') => void;
    searchQuery: string;
    setSearchQuery: (q: string) => void;
    selectedGroup: string | null;
    onOpenGroupModal: () => void;
    showTooltip?: boolean;
    onCloseTooltip?: () => void;
}

export const BloodDonorHeader: React.FC<BloodDonorHeaderProps> = React.memo(({
    navigation,
    user,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    selectedGroup,
    onOpenGroupModal,
    showTooltip = false,
    onCloseTooltip = () => { },
}) => {
    const inputRef = useRef<TextInput>(null);
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];
    const insets = useSafeAreaInsets();

    return (
        <View style={[
            styles.headerContainer,
            {
                backgroundColor: colors.primary,
                paddingTop: insets.top + (Platform.OS === 'android' ? 16 : 20),
            }
        ]}>
            {/* Top Row: Menu & Profile */}
            <View style={styles.headerContent}>
                <TouchableOpacity
                    onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
                    style={styles.iconButton}
                >
                    <Ionicons name="grid-outline" size={20} color={colors.white} />
                </TouchableOpacity>


                <View style={styles.rightActions}>
                    <NotificationIcon
                        containerStyle={{ marginRight: 12 }}
                        badgeStyle={{ borderColor: colors.primary }}
                    />
                    <TouchableOpacity
                        onPress={() => navigation.navigate('profile' as never)}
                        style={styles.profileButton}
                    >
                        <Avatar
                            uri={user?.user?.profileImage}
                            name={user?.user?.name}
                            size={34}
                        />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Search Row — only when on Find tab */}
            {activeTab === 'find' && (
                <View style={styles.searchSection}>
                    <View style={styles.searchRow}>
                        <TouchableOpacity
                            activeOpacity={1}
                            onPress={() => inputRef.current?.focus()}
                            style={[styles.searchInputContainer, { backgroundColor: colors.card, borderColor: colors.border, flex: 1 }]}
                        >
                            <Ionicons name="search" size={20} color="#94A3B8" style={{ marginRight: 10 }} />
                            <TextInput
                                ref={inputRef}
                                style={[styles.searchInput, { color: colors.text }]}
                                placeholder="Search donors..."
                                placeholderTextColor="#94A3B8"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                returnKeyType="search"
                                clearButtonMode="while-editing"
                            />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.bloodGroupButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                            onPress={onOpenGroupModal}
                        >
                            <Ionicons name="water" size={16} color={isDark ? '#FFFFFF' : colors.primary} />
                            <ThemedText style={[styles.bloodGroupText, { color: isDark ? '#FFFFFF' : colors.primary }]}>
                                {selectedGroup || 'Any'}
                            </ThemedText>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Tab Toggle Chips — same layout as Directory tabs */}
            <View style={styles.mainToggleContainer}>
                <TouchableOpacity
                    style={[styles.mainToggleBtn, activeTab === 'find' && styles.mainToggleBtnActive, activeTab !== 'find' && { backgroundColor: 'rgba(255,255,255,0.2)' }]}
                    onPress={() => setActiveTab('find')}
                >
                    <ThemedText style={[styles.mainToggleText, activeTab === 'find' ? [styles.mainToggleTextActive, { color: colors.primary }] : { color: '#FFFFFF' }]}>
                        Find Donors
                    </ThemedText>
                </TouchableOpacity>
                <Tooltip
                    isVisible={showTooltip}
                    content={
                        <View style={styles.tooltipPill}>
                            <ThemedText style={[styles.tooltipText, { color: colors.textSecondary }]}>بطور عطیہ دہندہ رجسٹر کرنے کے لیے یہاں ٹیپ کریں</ThemedText>
                            <TouchableOpacity onPress={onCloseTooltip} style={styles.tooltipClose}>
                                <Ionicons name="close-circle" size={18} color="#64748B" />
                            </TouchableOpacity>
                        </View>
                    }
                    placement="bottom"
                    onClose={onCloseTooltip}
                    contentStyle={styles.tooltipContent}
                    backgroundColor="rgba(0,0,0,0.2)"
                    displayInsets={{ top: 0, bottom: 0, left: 16, right: 16 }}
                    childrenWrapperStyle={{ flex: 1 }}
                >
                    <TouchableOpacity
                        style={[styles.mainToggleBtn, activeTab === 'portal' && styles.mainToggleBtnActive, activeTab !== 'portal' && { backgroundColor: 'rgba(255,255,255,0.2)' }, { width: '100%' }]}
                        onPress={() => setActiveTab('portal')}
                    >
                        <ThemedText style={[styles.mainToggleText, activeTab === 'portal' ? [styles.mainToggleTextActive, { color: colors.primary }] : { color: '#FFFFFF' }]}>
                            Register
                        </ThemedText>
                    </TouchableOpacity>
                </Tooltip>
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    headerContainer: {
        paddingBottom: Platform.OS === 'android' ? 8 : 10,
        borderBottomLeftRadius: Layout.headerBorderRadius,
        borderBottomRightRadius: Layout.headerBorderRadius,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        zIndex: 10,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Platform.OS === 'android' ? 18 : 20,
        marginBottom: Platform.OS === 'android' ? 18 : 20,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    iconButton: {
        width: 38,
        height: 38,
        borderRadius: Layout.borderRadius,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    rightActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    profileButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    searchSection: {
        paddingHorizontal: Platform.OS === 'android' ? 18 : 20,
        paddingBottom: Platform.OS === 'android' ? 14 : 16,
    },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    searchInputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: Layout.borderRadius,
        paddingHorizontal: Platform.OS === 'android' ? 14 : 16,
        height: Platform.OS === 'android' ? 42 : 48,
        borderWidth: 1,
    },
    searchInput: {
        flex: 1,
        fontSize: Platform.OS === 'android' ? 13 : 15,
        height: '100%',
        color: '#0F172A',
    },
    bloodGroupButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: Layout.borderRadius,
        paddingHorizontal: Platform.OS === 'android' ? 14 : 16,
        height: Platform.OS === 'android' ? 42 : 48,
        gap: 6,
        borderWidth: 1,
    },
    bloodGroupText: {
        fontSize: Platform.OS === 'android' ? 12 : 14,
        fontWeight: '700',
    },
    mainToggleContainer: {
        flexDirection: 'row',
        paddingHorizontal: Platform.OS === 'android' ? 14 : 16,
        marginBottom: Platform.OS === 'android' ? 14 : 16,
        gap: Platform.OS === 'android' ? 6 : 8,
    },
    mainToggleBtn: {
        flex: 1,
        paddingVertical: Platform.OS === 'android' ? 6 : 8,
        paddingHorizontal: Platform.OS === 'android' ? 12 : 14,
        borderRadius: Layout.borderRadius,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    mainToggleBtnActive: {
        backgroundColor: '#FFFFFF',
    },
    mainToggleText: {
        fontSize: Platform.OS === 'android' ? 12 : 14,
        fontWeight: '600',
    },
    mainToggleTextActive: {
        fontWeight: '700',
    },
    tooltipContent: {
        padding: 0,
        borderRadius: Layout.borderRadius,
        backgroundColor: 'transparent',
    },
    tooltipPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
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
    tooltipClose: {
        padding: 4,
    },
});
