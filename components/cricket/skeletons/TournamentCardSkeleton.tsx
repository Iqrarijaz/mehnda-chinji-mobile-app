import React from 'react';
import { View, StyleSheet } from 'react-native';
import Skeleton from '@/components/common/Skeleton';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';

export const TournamentCardSkeleton = React.memo(function TournamentCardSkeleton() {
    const { theme } = useTheme();
    const colors = Colors[theme];

    return (
        <View style={[styles.card, { backgroundColor: colors.cardBg }]}>
            {/* Banner Image Placeholder */}
            <View style={styles.imageContainer}>
                <Skeleton width="100%" height={110} borderRadius={Layout.borderRadius} />
            </View>

            {/* Content Details */}
            <View style={styles.content}>
                {/* Title */}
                <Skeleton width="65%" height={16} borderRadius={4} style={{ marginBottom: 6 }} />

                {/* Location / Venue */}
                <Skeleton width="45%" height={12} borderRadius={4} style={{ marginBottom: 8 }} />

                {/* Meta Row (Teams & Prize Badges) */}
                <View style={styles.metaRow}>
                    <View style={styles.metaGroup}>
                        <Skeleton width={70} height={20} borderRadius={6} />
                        <Skeleton width={80} height={20} borderRadius={6} />
                    </View>
                    <Skeleton width={24} height={24} borderRadius={12} />
                </View>
            </View>
        </View>
    );
});

TournamentCardSkeleton.displayName = 'TournamentCardSkeleton';

const styles = StyleSheet.create({
    card: {
        borderRadius: Layout.borderRadius,
        marginBottom: 12,
        overflow: 'hidden'
    },
    imageContainer: {
        width: '100%',
        height: 110,
        overflow: 'hidden'
    },
    content: {
        padding: 12
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 2
    },
    metaGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6
    }
});
