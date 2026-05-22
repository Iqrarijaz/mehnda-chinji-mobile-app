import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Skeleton from './Skeleton';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/colors';

const { width } = Dimensions.get('window');

/**
 * BusinessCardSkeleton matches the layout of components/business/businessCard.tsx
 */
export const BusinessCardSkeleton = () => {
    const { theme } = useTheme();
    const colors = Colors[theme];
    return (
        <View style={[styles.businessCard, { backgroundColor: colors.card }]}>
            <View style={styles.row}>
                <Skeleton width={60} height={60} borderRadius={14} />
                <View style={styles.content}>
                    <Skeleton width="60%" height={18} borderRadius={4} style={{ marginBottom: 8 }} />
                    <Skeleton width="30%" height={24} borderRadius={8} style={{ marginBottom: 8 }} />
                    <Skeleton width="80%" height={14} borderRadius={4} />
                </View>
                <Skeleton width={44} height={44} borderRadius={22} style={{ marginLeft: 10 }} />
            </View>
        </View>
    );
};

/**
 * PostCardSkeleton matches the layout of components/feed/postCard.tsx
 */
export const PostCardSkeleton = () => {
    const { theme } = useTheme();
    const colors = Colors[theme];
    return (
        <View style={[styles.postCard, { backgroundColor: colors.card }]}>
            <View style={styles.header}>
                <Skeleton width={80} height={24} borderRadius={8} />
                <View style={{ flex: 1 }} />
                <Skeleton width={60} height={14} borderRadius={4} />
            </View>
            <View style={styles.contentContainer}>
                <Skeleton width="90%" height={16} borderRadius={4} style={{ marginBottom: 8 }} />
                <Skeleton width="100%" height={16} borderRadius={4} style={{ marginBottom: 8 }} />
                <Skeleton width="40%" height={16} borderRadius={4} style={{ marginBottom: 12 }} />
                <Skeleton width="100%" height={width * 0.5} borderRadius={12} />
            </View>
            <View style={[styles.footer, { borderTopColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
                <Skeleton width={50} height={20} borderRadius={4} />
                <Skeleton width={50} height={20} borderRadius={4} style={{ marginLeft: 24 }} />
                <View style={{ flex: 1 }} />
                <Skeleton width={20} height={20} borderRadius={10} />
            </View>
        </View>
    );
};

/**
 * DonorCardSkeleton matches the layout of components/blood/donorCard.tsx
 */
export const DonorCardSkeleton = () => {
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];
    return (
        <View style={[styles.donorCard, { backgroundColor: colors.card, borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9' }]}>
            <View style={styles.row}>
                <Skeleton width={30} height={30} borderRadius={15} style={{ marginRight: 10 }} />
                <View style={styles.content}>
                    <Skeleton width="50%" height={18} borderRadius={4} style={{ marginBottom: 6 }} />
                    <Skeleton width="70%" height={14} borderRadius={4} />
                </View>
                <Skeleton width={36} height={36} borderRadius={18} style={{ marginLeft: 10 }} />
            </View>
        </View>
    );
};

/**
 * ChatCardSkeleton matches the layout of app/(drawer)/(tabs)/chat.tsx
 */
export const ChatCardSkeleton = () => {
    const { theme } = useTheme();
    const colors = Colors[theme];
    return (
        <View style={[styles.chatCard, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.5)' }]}>
            <Skeleton width={50} height={50} borderRadius={25} />
            <View style={styles.content}>
                <View style={[styles.row, { justifyContent: 'space-between', marginBottom: 8 }]}>
                    <Skeleton width="40%" height={16} borderRadius={4} />
                    <Skeleton width="15%" height={12} borderRadius={4} />
                </View>
                <Skeleton width="70%" height={14} borderRadius={4} />
            </View>
        </View>
    );
};

/**
 * RequestCardSkeleton matches the layout of components/places/RequestCard.tsx
 */
export const RequestCardSkeleton = () => {
    const { theme } = useTheme();
    const colors = Colors[theme];
    return (
        <View style={[styles.requestCard, { backgroundColor: colors.card }]}>
            <View style={styles.row}>
                <Skeleton width={80} height={80} borderRadius={16} />
                <View style={styles.content}>
                    <View style={[styles.row, { justifyContent: 'space-between', marginBottom: 8, alignItems: 'flex-start' }]}>
                        <Skeleton width="60%" height={18} borderRadius={4} />
                        <Skeleton width={75} height={24} borderRadius={12} />
                    </View>
                    <Skeleton width="40%" height={14} borderRadius={4} style={{ marginBottom: 12 }} />
                    <View style={styles.row}>
                        <Skeleton width={100} height={12} borderRadius={4} />
                        <View style={{ flex: 1 }} />
                        <Skeleton width={24} height={24} borderRadius={12} />
                        <Skeleton width={24} height={24} borderRadius={12} style={{ marginLeft: 8 }} />
                    </View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    businessCard: {
        borderRadius: 16,
        padding: 14,
        marginBottom: 12,
    },
    postCard: {
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 16,
    },
    donorCard: {
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 16,
        borderWidth: 1,
    },
    chatCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 16,
        marginBottom: 8,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    content: {
        flex: 1,
        marginLeft: 12,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    contentContainer: {
        marginBottom: 12,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 8,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    requestCard: {
        borderRadius: 20,
        padding: 12,
        marginBottom: 16,
        marginHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
});
