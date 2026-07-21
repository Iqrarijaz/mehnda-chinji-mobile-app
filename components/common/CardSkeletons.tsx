import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Skeleton from './Skeleton';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';

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
                <Skeleton width={42} height={42} borderRadius={22} style={{ marginLeft: 10 }} />
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
        <View style={[styles.donorCard, { backgroundColor: colors.card }]}>
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
        borderRadius: Layout.borderRadius,
        padding: 14,
        marginBottom: 12 },

    donorCard: {
        borderRadius: Layout.borderRadius,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 16 },
    row: {
        flexDirection: 'row',
        alignItems: 'center' },
    content: {
        flex: 1,
        marginLeft: 12 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12 },
    contentContainer: {
        marginBottom: 12 },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 8 },
    requestCard: {
        borderRadius: Layout.borderRadius,
        padding: 12,
        marginBottom: 16,
        marginHorizontal: 16 } });
