import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Switch,
    TouchableOpacity,
    View,
} from 'react-native';
import {
    Menu,
    MenuOptions,
    MenuOption,
    MenuTrigger,
} from 'react-native-popup-menu';

import { ThemedText } from '@/components/themedText';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { Layout } from '@/constants/layout';
import { TintedCard } from '../ui/tintedCard';

interface MyBloodDonorRegistrationCardProps {
    user: any;
    donorData: any;
    isAvailable: boolean;
    onToggleAvailability: () => void;
    onDelete: () => void;
    isProcessing: boolean;
}

const MyBloodDonorRegistrationCard = React.memo(({
    user,
    donorData,
    isAvailable,
    onToggleAvailability,
    onDelete,
    isProcessing
}: MyBloodDonorRegistrationCardProps) => {
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];
    const [showMenu, setShowMenu] = React.useState(false);

    const primaryColor = colors.primary;

    const address = (
        donorData.address
            ? `${donorData.address}, ${donorData.city || ''}`
            : donorData.city || 'N/A'
    ).toLowerCase().trim();

    return (
        <TintedCard
            tintColor={primaryColor}
            bgColor={colors.card}
            style={styles.card}
        >
            <View style={styles.cardHeader}>
                <View style={styles.headerLeft}>
                    <View style={styles.avatarWrapper}>
                        {user?.user?.profileImage ? (
                            <Image
                                source={{ uri: user.user.profileImage }}
                                style={styles.avatarImage}
                                contentFit="cover"
                                transition={200}
                            />
                        ) : (
                            <View style={[styles.avatarInitial, { backgroundColor: primaryColor + '10' }]}>
                                <ThemedText style={[styles.avatarInitialText, { color: primaryColor }]}>
                                    {(user?.user?.name || 'U').charAt(0).toUpperCase()}
                                </ThemedText>
                            </View>
                        )}
                    </View>
                    <View style={styles.nameContainer}>
                        <View style={styles.nameRow}>
                            <ThemedText style={[styles.bizName, { color: colors.text }]} numberOfLines={1}>
                                {user?.user?.name || "My Donor Profile"}
                            </ThemedText>
                            <View style={[
                                styles.statusBadge,
                                { backgroundColor: isAvailable ? (isDark ? 'rgba(74, 222, 128, 0.15)' : '#DCFCE7') : (isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2') }
                            ]}>
                                <View style={[
                                    styles.statusDot,
                                    { backgroundColor: isAvailable ? '#16A34A' : '#DC2626' }
                                ]} />
                                <ThemedText style={[
                                    styles.statusText,
                                    { color: isAvailable ? (isDark ? '#4ADE80' : '#166534') : (isDark ? '#F87171' : '#991B1B') }
                                ]}>
                                    {donorData.bloodGroup}
                                </ThemedText>
                            </View>
                        </View>
                        <View style={styles.addressRow}>
                            <Ionicons name="location" size={12} color={colors.textSecondary} style={{ paddingTop: 2 }} />
                            <ThemedText style={[styles.addressText, { color: colors.textSecondary }]} numberOfLines={2}>
                                {address}
                            </ThemedText>
                        </View>
                    </View>
                </View>
            </View>

            <View style={[styles.divider, { backgroundColor: primaryColor + '10', marginVertical: 8 }]} />

            <View style={styles.cardFooter}>
                <View style={styles.dateContainer}>
                    <Ionicons name="calendar-outline" size={12} color={colors.textSecondary} />
                    <ThemedText style={[styles.dateText, { color: colors.textSecondary }]}>
                        {new Date(donorData.createdAt || donorData.lastDonationDate || Date.now()).toLocaleDateString()}
                    </ThemedText>
                </View>

                <View style={styles.actionButtons}>
                    <View style={styles.toggleRow}>
                        <ThemedText style={[styles.statusToggleText, { color: isAvailable ? '#16A34A' : colors.textSecondary }]}>
                            {isAvailable ? 'Available' : 'Busy'}
                        </ThemedText>
                        <Switch
                            value={isAvailable}
                            onValueChange={onToggleAvailability}
                            trackColor={{ false: '#E2E8F0', true: '#DCFCE7' }}
                            thumbColor={isAvailable ? '#10B981' : '#94A3B8'}
                            ios_backgroundColor="#E2E8F0"
                            style={{ transform: [{ scaleX: 0.7 }, { scaleY: 0.7 }] }}
                        />
                    </View>

                    <View style={{ position: 'relative', zIndex: 100 }}>
                        <Menu opened={showMenu} onBackdropPress={() => setShowMenu(false)}>
                            <MenuTrigger
                                onPress={() => setShowMenu(true)}
                                customStyles={{
                                    triggerWrapper: styles.moreBtn,
                                }}
                            >
                                <Ionicons name="ellipsis-horizontal" size={20} color={colors.textSecondary} />
                            </MenuTrigger>

                            <MenuOptions
                                customStyles={{
                                    optionsContainer: [
                                        styles.menuPopover,
                                        {
                                            backgroundColor: colors.background,
                                            borderColor: colors.border,
                                        }
                                    ],
                                }}
                            >
                                <MenuOption
                                    onSelect={() => { setShowMenu(false); onDelete(); }}
                                    disabled={isProcessing}
                                    customStyles={{
                                        optionWrapper: styles.menuItem,
                                    }}
                                >
                                    <View style={[styles.menuIconBox, { backgroundColor: '#EF444415' }]}>
                                        <Ionicons name="trash" size={16} color="#EF4444" />
                                    </View>
                                    <ThemedText style={[styles.menuItemText, { color: '#EF4444' }]}>Delete</ThemedText>
                                </MenuOption>

                                <MenuOption
                                    onSelect={() => { setShowMenu(false); /* report logic if any */ }}
                                    customStyles={{
                                        optionWrapper: styles.menuItem,
                                    }}
                                >
                                    <View style={[styles.menuIconBox, { backgroundColor: '#F59E0B15' }]}>
                                        <Ionicons name="flag" size={16} color="#F59E0B" />
                                    </View>
                                    <ThemedText style={[styles.menuItemText, { color: colors.text }]}>Report</ThemedText>
                                </MenuOption>
                            </MenuOptions>
                        </Menu>
                    </View>
                </View>
            </View>
        </TintedCard>
    );
});

export default MyBloodDonorRegistrationCard;

const styles = StyleSheet.create({
    card: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 16,
    },
    cardHeader: {
        marginBottom: 4,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    avatarWrapper: {
        width: 44,
        height: 44,
        borderRadius: 22,
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    avatarInitial: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitialText: {
        fontSize: 18,
        fontWeight: '800',
    },
    nameContainer: {
        flex: 1,
    },
    nameRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    bizName: {
        fontSize: 16,
        fontWeight: '800',
        textTransform: 'capitalize',
        flex: 1,
        marginRight: 6,
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 4,
        marginTop: 2,
    },
    addressText: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'capitalize',
        flex: 1,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: Layout.borderRadius,
        gap: 4,
    },
    statusDot: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    divider: {
        height: 1,
        width: '100%',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    dateText: {
        fontSize: 11,
        fontWeight: '600',
    },
    actionButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statusToggleText: {
        fontSize: 10,
        fontWeight: '700',
    },
    moreBtn: {
        padding: 4,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuPopover: {
        width: 170,
        borderRadius: Layout.borderRadius,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 8,
        zIndex: 100,
        paddingHorizontal: 8,
        paddingVertical: 8,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 8,
        borderRadius: Layout.borderRadius - 4,
        gap: 10,
    },
    menuIconBox: {
        width: 28,
        height: 28,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuItemText: {
        fontSize: 14,
        fontWeight: '600',
    },
});
