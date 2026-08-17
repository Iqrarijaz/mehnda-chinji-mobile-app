import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useMemo, useState } from 'react';
import {
    Alert,
    Linking,
    Platform,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import {
    Menu,
    MenuOptions,
    MenuOption,
    MenuTrigger,
} from 'react-native-popup-menu';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themedText';
import { AnalyticsEvents, analyticsService } from '@/analytics';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { TintedCard } from '../ui/tintedCard';
import { useRouter } from 'expo-router';

interface BusinessCardProps {
    business: any;
}

const isAndroid = Platform.OS === 'android';

const BusinessCard = React.memo(({ business }: BusinessCardProps) => {
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];
    const insets = useSafeAreaInsets();
    const { user } = useAuth();

    const router = useRouter();
    const [showMenu, setShowMenu] = useState(false);

    const cardFontColor = colors.text;

    const capitalize = (str?: string) =>
        str
            ? str
                .toLowerCase()
                .split(' ')
                .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                .join(' ')
            : '';

    const businessName = useMemo(() => capitalize(business?.name), [business?.name]);
    const ownerName = useMemo(() => capitalize(business?.userId?.name || 'Owner'), [business?.userId?.name]);
    const ownerImage = business?.userId?.profileImage;
    const address = capitalize(business?.address || business?.village || '');
    const category = capitalize(business?.categoryEn || '');
    const urduCategory = business?.categoryUr;

    const handleCall = () => {
        if (business?.phone) {
            analyticsService.trackEvent(AnalyticsEvents.BUSINESS_CARD_CLICKED, { businessId: business._id, action: 'call' });
            Linking.openURL(`tel:${business.phone}`);
        } else {
            Alert.alert('No Phone', 'Phone number not available.');
        }
    };

    const businessImage = business?.images?.[0];

    const avatarContent = businessImage ? (
        <Image
            source={{ uri: businessImage }}
            style={styles.avatarImage}
            contentFit="cover"
            transition={200}
        />
    ) : (
        <ThemedText style={[styles.avatarLetter, { color: isDark ? colors.text : '#94A3B8' }]}>
            {businessName?.charAt(0)?.toUpperCase()}
        </ThemedText>
    );

    return (
        <>
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => {
                    analyticsService.trackEvent(AnalyticsEvents.BUSINESS_CARD_CLICKED, { businessId: business._id, action: 'view' });
                    router.push({
                        pathname: '/business/[id]',
                        params: { 
                            id: business._id,
                            businessData: JSON.stringify(business)
                        }
                    });
                }}
                style={styles.cardWrapper}
            >
                <TintedCard
                    tintColor={colors.primary}
                    bgColor={colors.card}
                    style={[styles.card, { borderLeftColor: colors.primary }]}
                >
                    <View style={styles.topRow}>
                        {/* Business Image/Avatar */}
                        <View style={[styles.avatarContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : colors.primary + '10' }]}>
                            {avatarContent}
                        </View>
                        
                        <View style={styles.content}>
                            <View style={styles.titleRow}>
                                <ThemedText style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                                    {businessName}
                                </ThemedText>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <View style={[styles.badge, { backgroundColor: colors.primary + '15' }]}>
                                        <ThemedText style={[styles.badgeText, { color: colors.primary }]}>
                                            {category}
                                        </ThemedText>
                                    </View>

                                    <View style={{ position: 'relative', zIndex: 100 }}>
                                        <Menu opened={showMenu} onBackdropPress={() => setShowMenu(false)}>
                                            <MenuTrigger
                                                onPress={() => setShowMenu(true)}
                                                customStyles={{
                                                    triggerWrapper: styles.moreBtn,
                                                }}
                                            >
                                                <Ionicons name="ellipsis-horizontal" size={18} color={colors.textSecondary} />
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
                                                    onSelect={() => {
                                                        setShowMenu(false);
                                                        // Report logic
                                                        Alert.alert("Report", "Reporting functionality coming soon.");
                                                    }}
                                                    customStyles={{
                                                        optionWrapper: styles.menuItem,
                                                    }}
                                                >
                                                    <View style={[styles.menuIconBox, { backgroundColor: '#EF444415' }]}>
                                                        <Ionicons name="flag" size={14} color="#EF4444" />
                                                    </View>
                                                    <ThemedText style={[styles.menuItemText, { color: colors.text }]}>Report</ThemedText>
                                                </MenuOption>
                                            </MenuOptions>
                                        </Menu>
                                    </View>
                                </View>
                            </View>

                            {urduCategory ? (
                                <ThemedText style={[styles.urduText, { color: colors.textSecondary }]} numberOfLines={1}>
                                    {urduCategory}
                                </ThemedText>
                            ) : null}

                            <View style={styles.locationRow}>
                                <Ionicons name="location" size={12} color={colors.textSecondary} style={{ marginTop: 1 }} />
                                <ThemedText style={[styles.location, { color: colors.textSecondary }]} numberOfLines={1}>
                                    {address}
                                </ThemedText>
                            </View>
                        </View>
                    </View>

                    {business?.description ? (
                        <View style={styles.descriptionContainer}>
                            <View style={[styles.divider, { backgroundColor: colors.border }]} />
                            <ThemedText style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>
                                {business.description}
                            </ThemedText>
                        </View>
                    ) : null}

                    <View style={[styles.footer, { borderTopColor: colors.border + '30' }]}>
                        {business?.phone ? (
                            <TouchableOpacity
                                style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                                activeOpacity={0.7}
                                onPress={handleCall}
                            >
                                <Ionicons name="call" size={14} color="#FFFFFF" />
                                <ThemedText style={styles.actionBtnText}>Call Business</ThemedText>
                            </TouchableOpacity>
                        ) : null}
                        
                        <TouchableOpacity
                            style={[styles.viewBtn, { borderColor: colors.primary + '30' }]}
                            activeOpacity={0.7}
                            onPress={() => router.push({
                                pathname: '/business/[id]',
                                params: { 
                                    id: business._id,
                                    businessData: JSON.stringify(business)
                                }
                            })}
                        >
                            <ThemedText style={[styles.viewBtnText, { color: colors.primary }]}>View Details</ThemedText>
                            <Ionicons name="arrow-forward" size={14} color={colors.primary} />
                        </TouchableOpacity>
                    </View>
                </TintedCard>
            </TouchableOpacity>

        </>
    );
});

export default BusinessCard;

const styles = StyleSheet.create({
    cardWrapper: {
        marginBottom: isAndroid ? 12 : 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 3,
    },
    card: {
        borderRadius: Layout.borderRadius,
        borderLeftWidth: 4,
        padding: 14,
        overflow: 'hidden',
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        width: 52,
        height: 52,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    avatarLetter: {
        fontSize: 20,
        fontWeight: '800',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 2,
    },
    title: {
        fontSize: 16,
        fontWeight: '800',
        flex: 1,
        marginRight: 8,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    urduText: {
        fontSize: 13,
        fontWeight: '500',
        marginBottom: 4,
        opacity: 0.9,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    location: {
        fontSize: 12,
        fontWeight: '500',
    },
    descriptionContainer: {
        marginTop: 12,
    },
    divider: {
        height: 1,
        width: '100%',
        marginBottom: 10,
        opacity: 0.3,
    },
    description: {
        fontSize: 13,
        lineHeight: 18,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 14,
        gap: 10,
        borderTopWidth: 1,
        paddingTop: 12,
    },
    actionBtn: {
        flex: 1.2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 38,
        borderRadius: Layout.borderRadius - 4,
        gap: 6,
    },
    actionBtnText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '700',
    },
    viewBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 38,
        borderRadius: Layout.borderRadius - 4,
        gap: 6,
    },
    viewBtnText: {
        fontSize: 13,
        fontWeight: '700',
    },
    moreBtn: {
        padding: 4,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuPopover: {
        width: 150,
        borderRadius: Layout.borderRadius,
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
        paddingVertical: 8,
        paddingHorizontal: 8,
        borderRadius: Layout.borderRadius - 4,
        gap: 10,
    },
    menuIconBox: {
        width: 24,
        height: 24,
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuItemText: {
        fontSize: 13,
        fontWeight: '600',
    },
});
