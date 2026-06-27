import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, FlatList, ActivityIndicator, Dimensions, Platform } from 'react-native';
import { Stack, useRouter, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { DrawerActions } from '@react-navigation/native';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { Layout as LayoutConst } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { usePosts, useLikePost } from '@/hooks/usePosts';
import Avatar from '@/components/ui/avatar';
import { PostCardSkeleton } from '@/components/common/CardSkeletons';
import { PrideHeader } from '@/components/pride/PrideHeader';
import { PrideSegmentedTabs, PrideTabType } from '@/components/pride/PrideSegmentedTabs';

const { width } = Dimensions.get('window');

type CategoryType = 'YOUTH_PRIDE' | 'LIVING_LEGEND' | 'DECEASED';

export default function VillagePrideScreen() {
    const router = useRouter();
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();
    const { user } = useAuth();
    const colors = Colors[theme];

    const [activeTab, setActiveTab] = useState<PrideTabType>('LEGENDS');
    const [searchVal, setSearchVal] = useState('');

    const likeMutation = useLikePost();
    const handleLike = useCallback((postId: string) => {
        likeMutation.mutate(postId);
    }, [likeMutation]);

    // Fetch Village Pride posts from server
    const {
        data,
        isLoading,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        refetch,
        isRefetching
    } = usePosts({ category: 'PRIDE', searchQuery: searchVal });

    // Gather live posts
    const pages = data?.pages;
    const livePosts = pages?.flatMap(page => page.data) || [];

    // Filter items based on active subcategory tab
    const filteredPosts = useMemo(() => {
        return livePosts.filter((post) => {
            const subType = post.type || post.metadata?.subType || 'LIVING_LEGEND';
            if (activeTab === 'MEMORIAM') {
                return subType === 'DECEASED';
            }
            return subType === 'LIVING_LEGEND' || subType === 'YOUTH_PRIDE';
        });
    }, [activeTab, livePosts]);

    const toggleDrawer = useCallback(() => {
        navigation.dispatch(DrawerActions.toggleDrawer());
    }, [navigation]);

    const isAdmin = user?.user?.role === 'APP_ADMIN';

    const handlePressAdd = useCallback(() => {
        const defaultSubType: CategoryType = activeTab === 'MEMORIAM' ? 'DECEASED' : 'LIVING_LEGEND';
        router.push({ pathname: '/pride/create', params: { subType: defaultSubType } } as any);
    }, [activeTab, router]);

    const handleLoadMore = () => {
        if (hasNextPage && !isFetchingNextPage && !isLoading) {
            fetchNextPage();
        }
    };

    const getTabMeta = (tab: CategoryType) => {
        switch (tab) {
            case 'YOUTH_PRIDE':
                return { label: 'Our Pride', icon: 'ribbon-outline', accent: '#10B981' };
            case 'DECEASED':
                return { label: 'In Memoriam', icon: 'rose-outline', accent: theme === 'dark' ? '#94A3B8' : '#64748B' };
            case 'LIVING_LEGEND':
            default:
                return { label: 'Legends', icon: 'sparkles-outline', accent: '#FF9B51' };
        }
    };

    const renderCard = useCallback(({ item, index }: { item: any; index: number }) => {
        const subType = item.metadata?.subType || 'LIVING_LEGEND';
        const fullName = item.metadata?.fullName || 'Community Hero';
        const title = item.metadata?.title || 'Honored Villager';
        const meta = getTabMeta(subType);

        return (
            <Animated.View
                entering={FadeInUp.delay(index * 100).duration(450)}
                style={styles.cardWrapper}
            >
                <TouchableOpacity
                    onPress={() => router.push(`/pride/${item._id}` as any)}
                    activeOpacity={0.8}
                    style={[
                        styles.card,
                        {
                            backgroundColor: theme === 'dark' ? colors.card : '#FFFFFF',
                        }
                    ]}
                >
                    <View style={styles.cardHeader}>
                        <View style={[styles.tabBadge, { backgroundColor: meta.accent + '15' }]}>
                            <Ionicons name={meta.icon as any} size={11} color={meta.accent} style={{ marginRight: 4 }} />
                            <ThemedText style={[styles.tabBadgeText, { color: meta.accent }]}>
                                {meta.label.toUpperCase()}
                            </ThemedText>
                        </View>

                        {subType === 'DECEASED' && (
                            <ThemedText style={[styles.deceasedDate, { color: colors.textSecondary }]}>
                                Late 🌹
                            </ThemedText>
                        )}
                    </View>

                    <View style={styles.cardHeroInfo}>
                        <View style={[styles.avatarBorder, { borderColor: meta.accent + '30' }]}>
                            <Avatar uri={item.metadata?.profileImage || item.images?.[0]} name={fullName} size={44} />
                        </View>
                        <View style={styles.heroTextWrap}>
                            <ThemedText style={styles.heroName} numberOfLines={1}>
                                {fullName}
                            </ThemedText>
                            <ThemedText style={[styles.heroTitle, { color: colors.textSecondary }]} numberOfLines={1}>
                                {title}
                            </ThemedText>
                        </View>
                    </View>

                    <ThemedText style={[styles.cardExcerpt, { color: colors.text }]} numberOfLines={2}>
                        {item.content}
                    </ThemedText>

                    <View style={[styles.cardFooter, { borderTopColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#F1F5F9' }]}>
                        <TouchableOpacity
                            onPress={(e) => {
                                e.stopPropagation();
                                handleLike(item._id);
                            }}
                            activeOpacity={0.7}
                            style={[
                                styles.cardStat,
                                {
                                    backgroundColor: item.isLiked
                                        ? (meta.accent + '15')
                                        : (theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)')
                                }
                            ]}
                        >
                            <Ionicons
                                name={item.isLiked
                                    ? (subType === 'DECEASED' ? 'heart' : 'ribbon')
                                    : (subType === 'DECEASED' ? 'heart-outline' : 'ribbon-outline')
                                }
                                size={14}
                                color={item.isLiked ? meta.accent : colors.textSecondary}
                            />
                            <ThemedText style={[
                                styles.statText,
                                {
                                    color: item.isLiked ? meta.accent : colors.textSecondary,
                                    fontWeight: item.isLiked ? '700' : '600'
                                }
                            ]}>
                                {item.likesCount || 0} {subType === 'DECEASED' ? 'Duas' : (subType === 'YOUTH_PRIDE' ? 'Salutes' : 'Respects')}
                            </ThemedText>
                        </TouchableOpacity>

                        <View style={styles.readMoreCTA}>
                            <ThemedText style={[styles.readMoreText, { color: colors.primary }]}>
                                Read Story
                            </ThemedText>
                            <Ionicons name="chevron-forward" size={14} color={colors.primary} />
                        </View>
                    </View>
                </TouchableOpacity>
            </Animated.View>
        );
    }, [theme, colors, router, handleLike]);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ headerShown: false }} />

            <PrideHeader
                title="Mehnda Chinji"
                searchVal={searchVal}
                onChangeSearch={setSearchVal}
                onClearSearch={() => setSearchVal('')}
                onPressMenu={toggleDrawer}
                onPressAdd={handlePressAdd}
                showAddButton={isAdmin}
                colors={colors}
                insets={insets}
            />

            <PrideSegmentedTabs
                activeTab={activeTab}
                onChangeTab={setActiveTab}
                colors={colors}
                theme={theme}
            />

            {/* Main Content list */}
            {isLoading && !isRefetching ? (
                <View style={{ flex: 1, padding: 16 }}>
                    <PostCardSkeleton />
                    <PostCardSkeleton />
                </View>
            ) : (
                <FlatList
                    data={filteredPosts}
                    keyExtractor={(item) => item._id}
                    renderItem={renderCard}
                    contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 40 }]}
                    showsVerticalScrollIndicator={false}
                    onRefresh={refetch}
                    refreshing={isRefetching}
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.2}
                    ListEmptyComponent={
                        <Animated.View entering={FadeIn.duration(400)} style={styles.emptyWrap}>
                            <Ionicons name="trophy-outline" size={54} color={colors.textSecondary} style={{ opacity: 0.3 }} />
                            <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
                                No spotlight entries found in this category yet.
                            </ThemedText>
                        </Animated.View>
                    }
                    ListFooterComponent={
                        isFetchingNextPage ? (
                            <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 12 }} />
                        ) : null
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    listContent: {
        paddingTop: 6,
        paddingHorizontal: 16,
    },
    cardWrapper: {
        marginBottom: 10,
    },
    card: {
        borderRadius: LayoutConst.borderRadius + 2,
        borderWidth: 0,
        padding: 10,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    tabBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
    },
    tabBadgeText: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    deceasedDate: {
        fontSize: 11,
        fontWeight: '700',
    },
    cardHeroInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 12,
    },
    avatarBorder: {
        borderWidth: 2,
        borderRadius: 25,
        padding: 1.5,
    },
    heroTextWrap: {
        flex: 1,
    },
    heroName: {
        fontSize: 13,
        fontWeight: '700',
    },
    heroTitle: {
        fontSize: 11,
        fontWeight: '500',
        marginTop: 1,
    },
    cardExcerpt: {
        fontSize: 11,
        lineHeight: 16,
        opacity: 0.85,
        marginBottom: 12,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 10,
        borderTopWidth: 1,
    },
    cardStat: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 12,
    },
    statText: {
        fontSize: 11,
        fontWeight: '600',
    },
    readMoreCTA: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    readMoreText: {
        fontSize: 11,
        fontWeight: '700',
    },
    emptyWrap: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
        gap: 12,
    },
    emptyText: {
        fontSize: 11,
        fontWeight: '500',
        textAlign: 'center',
        paddingHorizontal: 40,
        opacity: 0.7,
    },
});
