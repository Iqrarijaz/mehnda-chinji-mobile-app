import React, { memo } from 'react';
import { StyleSheet, View, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { ThemedText } from '../ThemedText';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 48; // Beautiful width with padding around it

interface SmallAnnouncementCardProps {
    item: any;
    colors: any;
    onPress?: () => void;
}

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; icon?: any; ionicon: keyof typeof Ionicons.glyphMap }> = {
    emergency: {
        label: 'Emergency',
        color: '#EF4444',
        bg: 'rgba(239, 68, 68, 0.08)',
        icon: require('../../assets/icons/emergency.webp'),
        ionicon: 'alert-circle-outline'
    },
    health: {
        label: 'Health',
        color: '#10B981',
        bg: 'rgba(16, 185, 129, 0.08)',
        icon: require('../../assets/icons/health.webp'),
        ionicon: 'medical-outline'
    },
    education: {
        label: 'Education',
        color: '#8B5CF6',
        bg: 'rgba(139, 92, 246, 0.08)',
        icon: require('../../assets/icons/education_icon.webp'),
        ionicon: 'book-outline'
    },
    travel: {
        label: 'Travel',
        color: '#F59E0B',
        bg: 'rgba(245, 158, 11, 0.08)',
        icon: require('../../assets/icons/travel.webp'),
        ionicon: 'bus-outline'
    },
    religious: {
        label: 'Religious',
        color: '#06B6D4',
        bg: 'rgba(6, 182, 212, 0.08)',
        icon: require('../../assets/icons/religious.webp'),
        ionicon: 'moon-outline'
    },
    govt: {
        label: 'Govt Office',
        color: '#6B7280',
        bg: 'rgba(107, 114, 128, 0.08)',
        icon: require('../../assets/icons/govt_office.webp'),
        ionicon: 'business-outline'
    },
    banks: {
        label: 'Banks',
        color: '#3B82F6',
        bg: 'rgba(59, 130, 246, 0.08)',
        icon: require('../../assets/icons/bank.webp'),
        ionicon: 'cash-outline'
    },
    public: {
        label: 'Public',
        color: '#EC4899',
        bg: 'rgba(236, 72, 153, 0.08)',
        ionicon: 'megaphone-outline'
    },
    lost_found: {
        label: 'Lost & Found',
        color: '#14B8A6',
        bg: 'rgba(20, 184, 166, 0.08)',
        ionicon: 'search-outline'
    }
};

export const SmallAnnouncementCard = memo(({ item, colors, onPress }: SmallAnnouncementCardProps) => {
    const config = TYPE_CONFIG[item.type] || {
        label: (item.type || 'public').toUpperCase(),
        color: colors.primary,
        bg: 'rgba(0, 0, 0, 0.03)',
        ionicon: 'megaphone-outline'
    };

    return (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={onPress}
            style={styles.container}
        >
            <View
                style={[
                    styles.card,
                    { backgroundColor: colors.card }
                ]}
            >
                <View style={styles.contentRow}>
                    {/* Right Side Content */}
                    <View style={styles.textContainer}>
                        <ThemedText style={styles.title} numberOfLines={1}>
                            {item.title}
                        </ThemedText>
                    </View>
                    {config.icon ? (
                        <Image
                            source={config.icon}
                            style={styles.typeIcon}
                            resizeMode="contain"
                        />
                    ) : ""}
                </View>
            </View>
            <LottieView
                source={require('../../public/json/announcement.json')}
                autoPlay
                loop
                style={styles.lottieBadge}
                hardwareAccelerationAndroid
                renderMode="HARDWARE"
            />
        </TouchableOpacity>
    );
});

SmallAnnouncementCard.displayName = 'SmallAnnouncementCard';

const styles = StyleSheet.create({
    container: {
        width: CARD_WIDTH,
        paddingTop: 30,
        marginHorizontal: 4,
        position: 'relative',
    },
    card: {
        borderRadius: 12,
        paddingVertical: 12,
        paddingRight: 12,
        paddingLeft: 32, // Extra padding to clear the Lottie badge space
    },
    lottieBadge: {
        position: 'absolute',
        top: -20,
        left: -26,
        width: 100,
        height: 100,
        zIndex: 10,
        pointerEvents: 'none',
    },
    contentRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    typeIcon: {
        width: 24,
        height: 24,
    },
    textContainer: {
        flex: 1,
        marginRight: 8,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    badge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '800',
    },
    dateText: {
        fontSize: 10,
        fontWeight: '500',
    },
    title: {
        fontSize: 13,
        fontWeight: '700',
        lineHeight: 18,
        textAlign: 'right',
    },
});
