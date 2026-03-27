import { ThemedText } from '@/components/themedText';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { PostCardSkeleton } from '../common/CardSkeletons';

interface FeedEmptyStateProps {
    colors: any;
    isLoading: boolean;
    isRefetching?: boolean;
    isError: boolean;
    error: any;
    refetch: () => void;
    postsCount: number;
}

export const FeedEmptyState: React.FC<FeedEmptyStateProps> = React.memo(({
    colors,
    isLoading,
    isRefetching,
    isError,
    error,
    refetch,
    postsCount
}) => {
    const loading = isLoading || isRefetching;
    if (loading && postsCount === 0) {
        return (
            <View style={{ paddingTop: 10 }}>
                {[1, 2, 3].map((i) => (
                    <PostCardSkeleton key={i} />
                ))}
            </View>
        );
    }

    if (isError && postsCount === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Ionicons name="alert-circle-outline" size={64} color={colors.primary} />
                <ThemedText style={styles.emptyText}>Failed to load posts</ThemedText>
                <ThemedText style={styles.emptySubText}>{error?.message || 'Something went wrong'}</ThemedText>
                <TouchableOpacity
                    style={[styles.retryButton, { backgroundColor: colors.primary }]}
                    onPress={refetch}
                >
                    <ThemedText style={styles.retryText}>Retry</ThemedText>
                </TouchableOpacity>
            </View>
        );
    }

    if (postsCount === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Ionicons name="newspaper-outline" size={64} color={colors.icon} />
                <ThemedText style={styles.emptyText}>No posts found</ThemedText>
                <ThemedText style={styles.emptySubText}>Be the first to share something!</ThemedText>
            </View>
        );
    }

    return null;
});

const styles = StyleSheet.create({
    emptyContainer: {
        paddingTop: 100,
        alignItems: 'center',
    },
    emptyText: {
        marginTop: 16,
        fontSize: 18,
        fontWeight: 'bold',
    },
    emptySubText: {
        marginTop: 8,
        opacity: 0.5,
    },
    retryButton: {
        marginTop: 20,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
    },
    retryText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    loaderContainer: {
        paddingTop: 100,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        opacity: 0.6,
        fontWeight: '600',
    }
});
