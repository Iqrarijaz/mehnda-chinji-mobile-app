import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getPostDetail, PostData } from '@/apis/posts';
import { PostDetail } from '@/components/feed/PostDetail';
import { ThemedView } from '@/components/themedView';
import { ThemedText } from '@/components/themedText';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { ReportModal, ReportModalRef } from '@/components/common/ReportModal';

export default function DeepLinkedPostScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { theme } = useTheme();
    const colors = Colors[theme];
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { user } = useAuth();

    const [post, setPost] = useState<PostData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Reporting state
    const reportModalRef = React.useRef<ReportModalRef>(null);
    const [showReport, setShowReport] = useState(false);

    useEffect(() => {
        if (id) {
            fetchPost();
        }
    }, [id]);

    const fetchPost = async () => {
        try {
            setLoading(true);
            const response: any = await getPostDetail(id as string);
            if (response.success && response.data) {
                setPost(response.data);
            } else {
                setError('Post not found');
            }
        } catch (err) {
            setError('Failed to load post');
            console.error('Error fetching deep linked post:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <ThemedView style={styles.center}>
                <ActivityIndicator size="large" color={colors.primary} />
            </ThemedView>
        );
    }

    if (error || !post) {
        return (
            <ThemedView style={styles.center}>
                <Ionicons name="alert-circle-outline" size={48} color={colors.textSecondary} />
                <ThemedText style={styles.errorText}>{error || 'Post not found'}</ThemedText>
                <TouchableOpacity 
                    style={[styles.retryButton, { backgroundColor: colors.primary }]}
                    onPress={() => router.replace('/(drawer)/(tabs)/feed')}
                >
                    <ThemedText style={styles.retryText}>Go to Feed</ThemedText>
                </TouchableOpacity>
            </ThemedView>
        );
    }

    return (
        <ErrorBoundary>
            <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
                <Stack.Screen options={{ headerShown: false }} />
                
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => {
                            if (router.canGoBack()) {
                                router.back();
                            } else {
                                router.replace('/(drawer)/(tabs)/feed');
                            }
                        }}
                        style={styles.backButton}
                    >
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <ThemedText style={styles.headerTitle}>Shared Post</ThemedText>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                    <PostDetail
                        post={post}
                        onEdit={(updatedPost) => {
                            // Minimal edit handling for shared view
                            setPost(updatedPost);
                        }}
                        onDelete={() => {
                            router.replace('/(drawer)/(tabs)/feed');
                        }}
                        onReport={() => {
                            setShowReport(true);
                            reportModalRef.current?.present();
                        }}
                        isOwner={
                            !!user?.user?._id &&
                            !!post.createdBy?._id &&
                            String(user?.user?._id) === String(post.createdBy._id)
                        }
                    />
                </ScrollView>

                <ReportModal
                    ref={reportModalRef}
                    targetId={post._id}
                    targetType="POST"
                />
            </ThemedView>
        </ErrorBoundary>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    backButton: {
        padding: 4,
        marginRight: 12,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    errorText: {
        fontSize: 16,
        marginTop: 12,
        marginBottom: 24,
        textAlign: 'center',
        opacity: 0.7,
    },
    retryButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    retryText: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
});
