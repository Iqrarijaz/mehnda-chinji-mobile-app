import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { Linking, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themedText';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';

const capitalize = (str?: string) =>
    str
        ? str.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
        : '';

interface EventCardProps {
    event: {
        _id?: string;
        name: string;
        description?: string;
        date?: string;
        type?: string;
        images?: string[];
        externalLink?: string;
    };
    primaryColor?: string;
}

const EventCard = React.memo(({ event, primaryColor = '#3B82F6' }: EventCardProps) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const colors = Colors[theme];

    const handlePress = () => {
        if (event.externalLink) {
            Linking.openURL(event.externalLink);
        }
    };

    const content = (
        <View style={styles.container}>
            {/* Header row */}
            <View style={styles.headerRow}>
                <View style={styles.headerLeft}>
                    {event.type ? (
                        <View style={[styles.typeBadge, { backgroundColor: primaryColor + '12' }]}>
                            <ThemedText style={[styles.typeBadgeText, { color: primaryColor }]}>
                                {event.type}
                            </ThemedText>
                        </View>
                    ) : null}
                    {event.date ? (
                        <View style={styles.dateRow}>
                            <Ionicons name="calendar-outline" size={12} color={colors.textSecondary} />
                            <ThemedText style={[styles.dateText, { color: colors.textSecondary }]}>
                                {event.date}
                            </ThemedText>
                        </View>
                    ) : null}
                </View>
                {event.externalLink && (
                    <Ionicons name="open-outline" size={16} color={primaryColor} style={styles.linkIcon} />
                )}
            </View>

            {/* Event name */}
            <ThemedText style={[styles.name, { color: colors.text }]}>
                {capitalize(event.name)}
            </ThemedText>

            {/* Description */}
            {event.description ? (
                <ThemedText
                    style={[styles.desc, { color: colors.textSecondary }]}
                    numberOfLines={3}
                >
                    {event.description}
                </ThemedText>
            ) : null}

            {/* Images preview gallery */}
            {event.images && event.images.length > 0 && (
                <View style={styles.galleryContainer}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.imagesScrollContent}
                    >
                        {event.images.map((img: string, imgIdx: number) => (
                            <View key={imgIdx} style={styles.imageWrap}>
                                <Image
                                    source={{ uri: img }}
                                    style={styles.imageThumb}
                                    contentFit="cover"
                                    transition={300}
                                />
                                {imgIdx === 2 && event.images!.length > 3 && (
                                    <View style={styles.imageCountOverlay}>
                                        <ThemedText style={styles.imageCountText}>
                                            +{event.images!.length - 3}
                                        </ThemedText>
                                    </View>
                                )}
                            </View>
                        ))}
                    </ScrollView>
                </View>
            )}
        </View>
    );

    if (event.externalLink) {
        return (
            <TouchableOpacity onPress={handlePress} activeOpacity={0.6}>
                {content}
            </TouchableOpacity>
        );
    }

    return content;
});

export default EventCard;

const styles = StyleSheet.create({
    container: {
        paddingVertical: 14,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    typeBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    typeBadgeText: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    dateText: {
        fontSize: 11,
        fontWeight: '600',
    },
    linkIcon: {
        opacity: 0.8,
    },
    name: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 4,
    },
    desc: {
        fontSize: 13,
        lineHeight: 18,
        marginBottom: 12,
        opacity: 0.8,
    },
    galleryContainer: {
        marginHorizontal: -4,
        marginBottom: 2,
    },
    imagesScrollContent: {
        paddingHorizontal: 4,
        gap: 8,
    },
    imageWrap: {
        position: 'relative',
    },
    imageThumb: {
        width: 120,
        height: 80,
        borderRadius: 10,
        backgroundColor: '#f0f0f0',
    },
    imageCountOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageCountText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '800',
    },
});
