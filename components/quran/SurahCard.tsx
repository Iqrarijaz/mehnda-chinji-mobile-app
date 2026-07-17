import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { Layout } from '@/constants/layout';
import type { SurahListItem } from '@/apis/quran';

interface SurahCardProps {
    item: SurahListItem;
    isFav: boolean;
    primaryColor: string;
    textSecondaryColor: string;
    cardColor: string;
    textColor: string;
    onPress: () => void;
    onFavToggle: () => void;
}

export const SurahCard = React.memo(({
    item,
    isFav,
    primaryColor,
    textSecondaryColor,
    cardColor,
    textColor,
    onPress,
    onFavToggle,
}: SurahCardProps) => (
    <TouchableOpacity
        activeOpacity={0.7}
        style={[styles.card, { backgroundColor: cardColor }]}
        onPress={onPress}
    >
        {/* Left: badge + metadata */}
        <View style={styles.cardLeft}>
            <View style={[styles.numberBadge, { backgroundColor: primaryColor + '12' }]}>
                <ThemedText style={[styles.numberText, { color: primaryColor }]}>
                    {item.number}
                </ThemedText>
            </View>
            <View style={styles.infoContainer}>
                <View style={styles.metadataRow}>
                    <ThemedText style={[styles.metadataText, { color: textSecondaryColor }]}>
                        {item.revelationType}
                    </ThemedText>
                    <View style={[styles.dot, { backgroundColor: textSecondaryColor }]} />
                    <ThemedText style={[styles.metadataText, { color: textSecondaryColor }]}>
                        {item.numberOfAyahs} Verses
                    </ThemedText>
                </View>
            </View>
        </View>

        {/* Centre-right: Arabic name */}
        <View style={styles.cardRight}>
            <ThemedText style={[styles.arabicName, { color: primaryColor }]}>
                {item.name}
            </ThemedText>
        </View>

        {/* Far right: heart */}
        <TouchableOpacity
            onPress={onFavToggle}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.favButton}
        >
            <Ionicons
                name={isFav ? 'heart' : 'heart-outline'}
                size={20}
                color={isFav ? '#FF5A5F' : textSecondaryColor}
            />
        </TouchableOpacity>
    </TouchableOpacity>
));

SurahCard.displayName = 'SurahCard';

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderRadius: Layout.borderRadius,
        paddingVertical: 16,
        paddingHorizontal: 10,
        marginBottom: 16,
    },
    cardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    numberBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    numberText: { fontSize: 11, fontWeight: 'bold' },
    infoContainer: { flex: 1 },
    metadataRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 3,
    },
    metadataText: { fontSize: 9 },
    dot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        marginHorizontal: 4,
        opacity: 0.5,
    },
    cardRight: {
        alignItems: 'flex-end',
        marginHorizontal: 8,
    },
    arabicName: {
        fontSize: 16,
        fontFamily: 'NotoNastaliqUrdu-Regular',
        fontWeight: 'bold',
        textAlign: 'right',
    },
    favButton: {
        padding: 4,
        marginLeft: 4,
    },
});
