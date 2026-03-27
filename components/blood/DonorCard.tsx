import { ThemedText } from '@/components/themedText';
import { AnalyticsEvents, analyticsService } from '@/analytics';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Alert, Linking, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
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
        city: string;
        address?: string;
        village?: string;
        available: boolean;
    };
    onReportPress?: (donorId: string) => void;
}

const DonorCard = React.memo(({ donor, onReportPress }: DonorCardProps) => {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const { user } = useAuth();

    const isAvailable = donor.available;
    const location = [donor.address || donor.village, donor.city].filter(Boolean).join(', ');

    const primaryColor = "#000000";

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
                    <TouchableOpacity activeOpacity={0.9} onPress={handleCall}>
                        <TintedCard tintColor={primaryColor} bgColor="#FFFFFF" style={styles.cardWrapper}>
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
                                        <ThemedText style={[styles.name, { color: primaryColor }]} numberOfLines={1}>
                                            {donor.userId.name}
                                        </ThemedText>
                                    </View>

                                    <View style={styles.locationRow}>
                                        <Ionicons name="location" size={14} color={primaryColor} style={{ marginTop: 4 }} />
                                        <ThemedText style={[styles.locationText, { color: primaryColor, opacity: 0.7 }]} numberOfLines={2}>
                                            {location.toLowerCase()}
                                        </ThemedText>
                                    </View>
                                </View>

                                {/* Right: Call ONLY */}
                                <View style={styles.rightActions}>
                                    <TouchableOpacity
                                        style={[styles.callBtn, { backgroundColor: primaryColor + '10' }]}
                                        onPress={handleCall}
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons name="call" size={14} color={primaryColor} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </TintedCard>
                    </TouchableOpacity>
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
        borderRadius: 16,
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
        borderRadius: 15,
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
        borderRadius: 6,
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
    rightActions: {
        marginLeft: 10,
    },
    callBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
