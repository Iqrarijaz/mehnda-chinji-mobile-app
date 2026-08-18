import React from 'react';
import { View, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { StatusBadge } from '@/components/cricket/StatusBadge';
import { ActionMenu, ActionMenuItem } from '@/components/common/ActionMenu';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';
import { Tournament } from '@/types/cricket';

interface TournamentCardProps {
    tournament: Tournament;
    onPress: () => void;
    actions?: ActionMenuItem[];
}

export const TournamentCard = React.memo(function TournamentCard({ tournament, onPress, actions }: TournamentCardProps) {
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];

    return (
        <TouchableOpacity
            style={[
                styles.card,
                {
                    backgroundColor: colors.cardBg,
                    borderColor: colors.border
                }
            ]}
            onPress={onPress}
            activeOpacity={0.8}
        >
            {/* Banner Image */}
            <View style={styles.imageContainer}>
                {tournament.bannerImage ? (
                    <Image source={{ uri: tournament.bannerImage }} style={styles.bannerImage} resizeMode="cover" />
                ) : (
                    <View style={[styles.defaultBanner, { backgroundColor: `${colors.primary}1A` }]}>
                        <Ionicons name="trophy-outline" size={36} color={colors.primary} />
                    </View>
                )}

                {/* Status Badge Overlay */}
                <View style={[styles.statusOverlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.85)' }]}>
                    <StatusBadge status={tournament.status} />
                </View>

                {/* Format Pill */}
                <View style={[styles.formatBadge, { backgroundColor: colors.primary }]}>
                    <ThemedText style={styles.formatText}>
                        {tournament.format}
                    </ThemedText>
                </View>
            </View>

            {/* Card Content */}
            <View style={styles.content}>
                <View style={styles.titleRow}>
                    <ThemedText style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                        {tournament.name}
                    </ThemedText>
                </View>

                <View style={styles.infoRow}>
                    <Ionicons name="location-outline" size={13} color={colors.primary} />
                    <ThemedText style={[styles.infoText, { color: colors.textSecondary }]} numberOfLines={1}>
                        {tournament.venue} • {tournament.city}
                    </ThemedText>
                </View>

                {/* Prize, Teams & Horizontal Action Menu Row */}
                <View style={styles.quickInfoRow}>
                    <View style={styles.pillsGroup}>
                        {tournament.prizes?.winnerPrize ? (
                            <View style={styles.infoPill}>
                                <Ionicons name="ribbon-outline" size={12} color={colors.secondary} />
                                <ThemedText style={[styles.pillLabel, { color: colors.secondary }]} numberOfLines={1}>
                                    {tournament.prizes.winnerPrize}
                                </ThemedText>
                            </View>
                        ) : null}

                        <View style={styles.infoPill}>
                            <Ionicons name="people-outline" size={12} color={colors.primary} />
                            <ThemedText style={[styles.pillLabel, { color: colors.primary }]}>
                                {tournament.teams?.length || 0} Teams
                            </ThemedText>
                        </View>
                    </View>

                    {actions && actions.length > 0 && (
                        <View style={styles.actionMenuWrapper}>
                            <ActionMenu
                                actions={actions}
                                triggerIcon="ellipsis-horizontal"
                                triggerIconSize={18}
                                triggerIconColor={colors.textSecondary}
                            />
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
});

const styles = StyleSheet.create({
    card: {
        borderRadius: Layout.borderRadius,
        marginHorizontal: 2,
        marginBottom: 10,
        overflow: 'hidden',
        borderWidth: 1
    },
    imageContainer: {
        height: 105,
        width: '100%',
        position: 'relative'
    },
    bannerImage: {
        width: '100%',
        height: '100%'
    },
    defaultBanner: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center'
    },
    statusOverlay: {
        position: 'absolute',
        top: 8,
        left: 8,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12
    },
    formatBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12
    },
    formatText: {
        fontSize: 9,
        fontWeight: '800',
        color: '#FFFFFF'
    },
    content: {
        padding: 10,
        gap: 4
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    title: {
        fontSize: 14,
        fontWeight: '800',
        letterSpacing: -0.2,
        flex: 1
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4
    },
    infoText: {
        fontSize: 11,
        fontWeight: '500'
    },
    quickInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 4
    },
    pillsGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1
    },
    infoPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
        backgroundColor: 'transparent'
    },
    pillLabel: {
        fontSize: 10.5,
        fontWeight: '600'
    },
    actionMenuWrapper: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingLeft: 4
    }
});
