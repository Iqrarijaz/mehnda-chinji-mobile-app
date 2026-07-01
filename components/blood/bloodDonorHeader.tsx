import { NotificationIcon } from '@/components/common/NotificationIcon';
import { ThemedText } from '@/components/ThemedText';
import Avatar from '@/components/ui/avatar';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';
import React, { useRef, useState, useEffect } from 'react';
import {
    Platform,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
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
    const router = useRouter();

    const [localQuery, setLocalQuery] = useState(searchQuery);

    useEffect(() => {
        setLocalQuery(searchQuery);
    }, [searchQuery]);

    useEffect(() => {
        const handler = setTimeout(() => {
            if (localQuery !== searchQuery) {
                setSearchQuery(localQuery);
            }
        }, 500);
        return () => clearTimeout(handler);
    }, [localQuery, searchQuery, setSearchQuery]);

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
                    onPress={() => {
                        if (router.canGoBack()) {
                            router.back();
                        } else {
                            router.replace('/(drawer)/(tabs)');
                        }
                    }}
                    style={styles.iconButton}
                >
                    <Ionicons name="arrow-back" size={20} color={colors.white} />
                </TouchableOpacity>


                <View style={styles.rightActions}>
                    <NotificationIcon
                        containerStyle={{ marginRight: 12 }}
                        badgeStyle={{ borderColor: colors.primary }}
                    />
                    <TouchableOpacity
                        onPress={() => router.push('/(drawer)/(tabs)/chat')}
                        style={[styles.iconButton, { marginRight: 12 }]}
                    >
                        <Ionicons name="chatbubbles" size={20} color={colors.white} />
                    </TouchableOpacity>
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

            {/* Search Row */}
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
                            value={localQuery}
                            onChangeText={setLocalQuery}
                            returnKeyType="search"
                            clearButtonMode="while-editing"
                        />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.filterButton, { backgroundColor: selectedGroup ? '#10B981' : 'rgba(255, 255, 255, 0.2)' }]}
                        onPress={onOpenGroupModal}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="funnel-outline" size={20} color="#FFFFFF" />
                        {selectedGroup && (
                            <View style={styles.filterBadge}>
                                <ThemedText style={styles.filterBadgeText}>1</ThemedText>
                            </View>
                        )}
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
                    >
                        <TouchableOpacity
                            style={[styles.listingIconButton, { backgroundColor: activeTab === 'portal' ? '#10B981' : 'rgba(255, 255, 255, 0.2)' }]}
                            onPress={() => setActiveTab(activeTab === 'portal' ? 'find' : 'portal')}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="list-outline" size={20} color="#FFFFFF" />
                        </TouchableOpacity>
                    </Tooltip>
                </View>
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
        paddingBottom: 8,
    },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    searchInputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: Layout.borderRadius,
        paddingHorizontal: Platform.OS === 'android' ? 14 : 16,
        height: 42,
        borderWidth: 1,
    },
    searchInput: {
        flex: 1,
        fontSize: Platform.OS === 'android' ? 13 : 15,
        height: '100%',
        color: '#0F172A',
    },
    filterButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    filterBadge: {
        position: 'absolute',
        top: -2,
        right: -2,
        backgroundColor: '#EF4444',
        borderRadius: 9,
        width: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#FFFFFF',
    },
    filterBadgeText: {
        color: '#FFFFFF',
        fontSize: 8,
        fontWeight: 'bold',
    },
    listingIconButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        justifyContent: 'center',
        alignItems: 'center',
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
