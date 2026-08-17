import { ThemedText } from '@/components/themedText';
import { AnalyticsEvents, analyticsService } from '@/analytics';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Layout } from '@/constants/layout';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Alert, Linking, StyleSheet, TouchableOpacity, View } from 'react-native';
import {
    Menu,
    MenuOptions,
    MenuOption,
    MenuTrigger,
} from 'react-native-popup-menu';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    FadeOut,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
    ZoomIn,
} from 'react-native-reanimated';
import { TintedCard } from '../ui/tintedCard';

interface DonorCardProps {
    donor: {
        _id: string;
        userId: {
            _id: string;
            name: string;
            phone: string;
            profileImage?: string;
        };
        bloodGroup: string;
        lastDonationDate?: string | null;
        createdAt?: string;
        city: string;
        address?: string;
        village?: string;
        available: boolean;
    };
    onReportPress?: (donorId: string) => void;
}

const DonorCard = React.memo(({ donor, onReportPress }: DonorCardProps) => {
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];
    const { user } = useAuth();
    const [showMenu, setShowMenu] = React.useState(false);

    const isAvailable = donor.available;
    const location = [donor.address || donor.village, donor.city].filter(Boolean).join(', ');

    const primaryColor = colors.primary;

    const handleCall = () => {
        if (donor.userId.phone) {
            analyticsService.trackEvent(AnalyticsEvents.DONOR_CARD_CLICKED, { donorId: donor._id });
            Linking.openURL(`tel:${donor.userId.phone}`);
        } else {
            Alert.alert("No Phone", "Phone number is not available.");
        }
    };

    const translateX = useSharedValue(0);
    const MAX_SWIPE = -80;
    const REPORT_THRESHOLD = -40;

    const pan = Gesture.Pan()
        .activeOffsetX([-10, 10])
        .onUpdate((e) => {
            if (e.translationX < 0) {
                translateX.value = Math.max(e.translationX, MAX_SWIPE);
            } else {
                translateX.value = Math.max(e.translationX * 0.2, 0); // Slight resistance for right swipe
            }
        })
        .onEnd((e) => {
            if (e.translationX < REPORT_THRESHOLD) {
                translateX.value = withTiming(MAX_SWIPE, { duration: 200 });
            } else {
                translateX.value = withTiming(0, { duration: 200 });
            }
        });

    const cardStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));

    const reportBgStyle = useAnimatedStyle(() => ({
        opacity: translateX.value < -10 ? 1 : 0,
        transform: [{ scale: Math.min(Math.abs(translateX.value) / 60, 1) }],
    }));

    return (
        <View style={styles.swipeContainer}>
            {/* Report Background (Revealed on Swipe) */}
            {onReportPress && (
                <Animated.View style={[styles.reportBg, reportBgStyle]}>
                    <TouchableOpacity
                        style={styles.reportAction}
                        onPress={() => {
                            translateX.value = withTiming(0);
                            onReportPress(donor._id);
                        }}
                    >
                        <Ionicons name="flag" size={20} color="#FFFFFF" />
                        <ThemedText style={styles.reportActionText}>Report</ThemedText>
                    </TouchableOpacity>
                </Animated.View>
            )}

            <GestureDetector gesture={pan}>
                <Animated.View style={cardStyle}>
                    <View style={{ flex: 1 }}>
                        <TintedCard tintColor={primaryColor} bgColor={colors.card} style={styles.cardWrapper}>
                            <View style={styles.cardMain}>
                                {/* Left: Blood Group */}
                                <View style={styles.bloodCircle}>
                                    <ThemedText style={styles.bloodText}>
                                        {donor.bloodGroup}
                                    </ThemedText>
                                </View>

                                {/* Center: Info */}
                                <View style={styles.contentContainer}>
                                    <View style={styles.nameRow}>
                                        <ThemedText style={[styles.name, { color: colors.text }]} numberOfLines={1}>
                                            {donor.userId.name}
                                        </ThemedText>
                                    </View>

                                    <View style={styles.locationRow}>
                                        <Ionicons name="location" size={12} color={colors.textSecondary} style={{ marginTop: 5 }} />
                                        <ThemedText style={[styles.locationText, { color: colors.textSecondary }]} numberOfLines={2}>
                                            {location}
                                        </ThemedText>
                                    </View>
                                </View>
                                <TouchableOpacity
                                    style={[styles.callBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : primaryColor + '10' }]}
                                    onPress={handleCall}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="call" size={14} color={isDark ? colors.text : primaryColor} />
                                </TouchableOpacity>
                            </View>

                            <View style={[styles.divider, { backgroundColor: primaryColor + '10' }]} />

                            <View style={styles.cardFooter}>
                                <View style={styles.footerLeft}>
                                    <Ionicons name="calendar-outline" size={12} color={colors.textSecondary} />
                                    <ThemedText style={[styles.dateText, { color: colors.textSecondary }]}>
                                        {new Date(donor.createdAt || donor.lastDonationDate || Date.now()).toLocaleDateString()}
                                    </ThemedText>
                                </View>

                                <View style={styles.footerRight}>


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
                                                    onSelect={() => {
                                                        setShowMenu(false);
                                                        if (onReportPress) onReportPress(donor._id);
                                                    }}
                                                    customStyles={{
                                                        optionWrapper: styles.menuItem,
                                                    }}
                                                >
                                                    <View style={[styles.menuIconBox, { backgroundColor: '#EF444415' }]}>
                                                        <Ionicons name="flag" size={16} color="#EF4444" />
                                                    </View>
                                                    <ThemedText style={[styles.menuItemText, { color: '#EF4444' }]}>Report</ThemedText>
                                                </MenuOption>
                                            </MenuOptions>
                                        </Menu>
                                    </View>
                                </View>
                            </View>
                        </TintedCard>
                    </View>
                </Animated.View>
            </GestureDetector>
        </View>
    );
});

export default DonorCard;

const styles = StyleSheet.create({
    swipeContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    cardWrapper: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    reportBg: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: 80,
        backgroundColor: '#EF4444',
        borderRadius: Layout.borderRadius,
        justifyContent: 'center',
        alignItems: 'center',
    },
    reportAction: {
        flex: 1,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 4,
    },
    reportActionText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '800',
    },
    cardMain: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    bloodCircle: {
        width: 30,
        height: 30,
        borderRadius: 12,
        backgroundColor: '#a91111ff',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        marginRight: 10,
    },
    bloodText: {
        fontSize: 14,
        fontWeight: '900',
        color: '#ffffffff',
    },
    contentContainer: {
        flex: 1,
        gap: 0,
    },
    nameRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    name: {
        fontSize: 16,
        fontWeight: '800',
        textTransform: 'capitalize',
        flex: 1,
        marginRight: 6,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 4,
    },
    locationText: {
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
        borderRadius: 4,
        gap: 4,
    },
    statusDot: {
        width: 5,
        height: 5,
        borderRadius: 0.5,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    divider: {
        height: 1,
        width: '100%',
        marginVertical: 8,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    footerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    footerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    dateText: {
        fontSize: 11,
        fontWeight: '600',
    },
    moreBtn: {
        padding: 4,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuPopover: {
        position: 'absolute',
        width: 170,
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
        paddingVertical: 10,
        paddingHorizontal: 8,
        borderRadius: Layout.borderRadius - 4,
        gap: 10,
    },
    menuIconBox: {
        width: 28,
        height: 28,
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuItemText: {
        fontSize: 14,
        fontWeight: '600',
    },
    callBtn: {
        width: 32,
        height: 32,
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
