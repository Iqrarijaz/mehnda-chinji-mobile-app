import React from 'react';
import { StyleSheet, View, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInUp, useAnimatedStyle, useSharedValue, withRepeat, withTiming, interpolateColor } from 'react-native-reanimated';

import { ThemedText } from '../ThemedText';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';
import { usePosts, useLikePost } from '@/hooks/usePosts';
import Avatar from '../ui/avatar';

export const FeaturedPrideCard = React.memo(() => {
    const router = useRouter();
    const { theme } = useTheme();
    const colors = Colors[theme];
    const borderPulse = useSharedValue(0);

    // Fetch live village pride posts
    const { data, isLoading } = usePosts({ category: 'PRIDE' });

    // Animate glowing border on mount
    React.useEffect(() => {
        borderPulse.value = withRepeat(
            withTiming(1, { duration: 1500 }),
            -1, // Infinite loops
            true // Alternate direction
        );
    }, []);

    const animatedBorderStyle = useAnimatedStyle(() => {
        const borderColor = interpolateColor(
            borderPulse.value,
            [0, 1],
            [colors.primary + '30', theme === 'dark' ? '#FF9B5180' : colors.primary + 'CC']
        );
        return {
            borderColor,
        };
    });

    // Try to get the latest post of type VILLAGE_PRIDE
    const pages = data?.pages;
    const livePosts = pages?.flatMap(page => page.data) || [];

    if (isLoading || livePosts.length === 0) {
        return null;
    }

    const featuredHero = livePosts[0];

    const { metadata } = featuredHero;
    const subType = featuredHero.type || metadata?.subType || 'LIVING_LEGEND';
    const fullName = metadata?.fullName || featuredHero.content?.slice(0, 30);
    const title = metadata?.title || 'Community Pillar';

    const likeMutation = useLikePost();

    // Get subcategory styling details
    const getSubCategoryDetails = () => {
        switch (subType) {
            case 'YOUTH_PRIDE':
                return {
                    label: '🏆 Youth Pride',
                    accentColor: '#10B981', // Emerald green
                    tributeIcon: 'star',
                    tributeLabelActive: 'Saluted! 👏',
                    tributeLabelInactive: 'Offer Salute 👏'
                };
            case 'DECEASED':
                return {
                    label: '🌹 In Memoriam',
                    accentColor: theme === 'dark' ? '#94A3B8' : '#64748B', // Slate gray
                    tributeIcon: 'praying-hands',
                    tributeLabelActive: 'Dua Offered! 🤲',
                    tributeLabelInactive: 'Offer Dua 🤲'
                };
            case 'LIVING_LEGEND':
            default:
                return {
                    label: '🌟 Living Legend',
                    accentColor: '#FF9B51', // Saffron gold
                    tributeIcon: 'ribbon',
                    tributeLabelActive: 'Respected! 💖',
                    tributeLabelInactive: 'Offer Respect 💖'
                };
        }
    };

    const details = getSubCategoryDetails();

    const handleTribute = (e: any) => {
        e.stopPropagation(); // Prevents navigating to the details screen!
        likeMutation.mutate(featuredHero._id);
    };

    const handlePress = () => {
        // Navigate to full details view
        if (!featuredHero?._id) return;
        router.push({ pathname: '/pride/[id]', params: { id: featuredHero._id } } as any);
    };

    return (
        <Animated.View
            entering={FadeInUp.delay(300).duration(500)}
            style={styles.container}
        >
            <TouchableOpacity
                onPress={handlePress}
                activeOpacity={0.9}
                style={[
                    styles.card,
                    {
                        backgroundColor: theme === 'dark' ? colors.card : '#FFFFFF',
                        shadowColor: colors.primary,
                    }
                ]}
            >
                {/* Header Spotlight Header banner */}
                <View style={styles.header}>
                    <View style={[styles.badge, { backgroundColor: details.accentColor + '15' }]}>
                        <ThemedText style={[styles.badgeText, { color: details.accentColor }]}>
                            {details.label}
                        </ThemedText>
                    </View>
                    <View style={styles.spotlightBadge}>
                        <Ionicons name="sparkles" size={14} color="#FF9B51" />
                        <ThemedText style={styles.spotlightText}>SPOTLIGHT HERO</ThemedText>
                    </View>
                </View>

                {/* Hero Info Rows */}
                <View style={styles.heroRow}>
                    <Animated.View style={[styles.avatarContainer, animatedBorderStyle]}>
                        <Avatar
                            uri={metadata?.profileImage || featuredHero.images?.[0]}
                            name={fullName}
                            size={64}
                        />
                    </Animated.View>

                    <View style={styles.textContainer}>
                        <ThemedText style={styles.heroName} numberOfLines={1}>
                            {fullName}
                        </ThemedText>
                        <ThemedText style={[styles.heroTitle, { color: colors.textSecondary }]} numberOfLines={1}>
                            {title}
                        </ThemedText>
                    </View>
                </View>

                {/* Short excerpt description */}
                <ThemedText style={[styles.excerpt, { color: colors.text }]} numberOfLines={2}>
                    {featuredHero.content}
                </ThemedText>

                {/* Footer Tribute row */}
                <View style={[styles.footer, { borderTopColor: theme === 'dark' ? '#27272A' : '#F1F5F9' }]}>
                    <TouchableOpacity
                        onPress={handleTribute}
                        activeOpacity={0.8}
                        style={[
                            styles.statsButton,
                            {
                                backgroundColor: featuredHero.isLiked ? details.accentColor + '20' : 'transparent',
                                borderColor: featuredHero.isLiked ? details.accentColor : (theme === 'dark' ? '#27272A' : '#E2E8F0'),
                            }
                        ]}
                    >
                        {details.tributeIcon === 'praying-hands' ? (
                            <FontAwesome5 name="praying-hands" size={14} color={featuredHero.isLiked ? details.accentColor : (theme === 'dark' ? '#71717A' : '#94A3B8')} />
                        ) : (
                            <Ionicons name={details.tributeIcon as any} size={15} color={featuredHero.isLiked ? details.accentColor : (theme === 'dark' ? '#71717A' : '#94A3B8')} />
                        )}
                        <ThemedText style={[styles.statsText, { color: featuredHero.isLiked ? details.accentColor : colors.textSecondary, fontWeight: featuredHero.isLiked ? '700' : '500' }]}>
                            {featuredHero.isLiked ? details.tributeLabelActive : details.tributeLabelInactive}
                        </ThemedText>
                    </TouchableOpacity>

                    <View style={styles.actionButton}>
                        <ThemedText style={[styles.actionText, { color: colors.primary }]}>
                            Read Full Story
                        </ThemedText>
                        <Ionicons name="arrow-forward" size={14} color={colors.primary} />
                    </View>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
});

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 20,
        marginBottom: 16,
        marginTop: 6,
    },
    card: {
        borderRadius: Layout.borderRadius + 4,
        padding: 16,
        borderWidth: 1,
        borderColor: Platform.OS === 'ios' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(0, 0, 0, 0.03)',

    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '700',
    },
    spotlightBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 155, 81, 0.08)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
        gap: 4,
    },
    spotlightText: {
        fontSize: 9,
        fontWeight: '800',
        color: '#FF9B51',
        letterSpacing: 0.5,
    },
    heroRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 14,
    },
    avatarContainer: {
        borderWidth: 2.5,
        borderRadius: 36,
        padding: 2,
    },
    textContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    heroName: {
        fontSize: 17,
        fontWeight: '700',
        lineHeight: 22,
    },
    heroTitle: {
        fontSize: 13,
        fontWeight: '500',
        marginTop: 2,
    },
    excerpt: {
        fontSize: 13.5,
        lineHeight: 20,
        marginBottom: 14,
        opacity: 0.85,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
    },
    stats: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
    },
    statsText: {
        fontSize: 12.5,
        fontWeight: '500',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    actionText: {
        fontSize: 12.5,
        fontWeight: '700',
    },
});
