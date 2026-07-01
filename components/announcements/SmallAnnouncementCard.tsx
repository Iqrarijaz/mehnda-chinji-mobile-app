import React, { memo } from 'react';
import { StyleSheet, View, Image, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { ThemedText } from '../ThemedText';
import { ANNOUNCEMENT_TYPE_CONFIG, DEFAULT_TYPE_CONFIG } from '@/constants/announcementTypes';
import { AnnouncementData } from '@/apis/announcements';

interface SmallAnnouncementCardProps {
    item: AnnouncementData;
    colors: any;
    onPress?: () => void;
}

export const SmallAnnouncementCard = memo(({ item, colors, onPress }: SmallAnnouncementCardProps) => {
    const { width } = useWindowDimensions();
    const cardWidth = width - 48;
    const config = ANNOUNCEMENT_TYPE_CONFIG[item.type] || DEFAULT_TYPE_CONFIG(colors.primary);

    return (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={onPress}
            style={[styles.container, { width: cardWidth }]}
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
                loop={false}
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
