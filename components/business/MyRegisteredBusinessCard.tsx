import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Platform,
    StyleSheet,
    Switch,
    View } from 'react-native';
import { ActionMenu, ActionMenuItem } from '@/components/common/ActionMenu';

import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/context/ThemeContext';
import { Layout } from '@/constants/layout';
import { Colors } from '@/constants/colors';
import { TintedCard } from '../ui/TintedCard';

interface MyRegisteredBusinessCardProps {
    business: any;
    onEdit: (biz: any) => void;
    onDelete: (id: string) => void;
    onToggleSearch: (id: string, name: string, nextValue: boolean) => void;
    isDeleting?: boolean;
    isManageSearchPending?: boolean;
}

const MyRegisteredBusinessCard = React.memo(({
    business,
    onEdit,
    onDelete,
    onToggleSearch,
    isDeleting,
    isManageSearchPending
}: MyRegisteredBusinessCardProps) => {
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];
    const isAndroid = Platform.OS === 'android';

    const status = business.status?.toUpperCase();

    // Status-based colors
    const statusColor =
        status === 'APPROVED' ? '#10B981' :
            status === 'REJECTED' ? '#EF4444' :
                '#F59E0B'; // PENDING

    const primaryColor = colors.text;
    const softBg = isDark ? 'rgba(255,255,255,0.05)' : (primaryColor + '08');


    const bizName = business.name || 'Business Name';
    const description = business.description;
    const category = business.categoryEn || business.category?.en || 'Category';
    const urduCategory = business.categoryUr || business.category?.ur;
    const address = (business.address || business.village || 'N/A').toLowerCase();

    const actions: ActionMenuItem[] = [];
    if (status === 'PENDING' || status === 'APPROVED') {
        actions.push({
            label: 'Edit',
            icon: 'create',
            onPress: () => onEdit(business)
        });
    }
    actions.push({
        label: 'Delete',
        icon: 'trash',
        destructive: true,
        onPress: () => onDelete(business._id)
    });

    return (
        <TintedCard
            tintColor={colors.primary}
            bgColor={colors.cardBg}
            style={styles.card}
        >
            <View style={styles.cardHeader}>
                <View style={styles.nameStatusRow}>
                    <ThemedText style={[styles.bizName, { color: primaryColor }]} numberOfLines={1}>
                        {bizName}
                    </ThemedText>

                    <View style={[
                        styles.statusBadge,
                        { backgroundColor: statusColor + '15' }
                    ]}>
                        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                        <ThemedText style={[styles.statusText, { color: statusColor }]}>
                            {status}
                        </ThemedText>
                    </View>
                </View>
            </View>

            <View style={styles.cardBody}>
                <View style={styles.categoryRow}>
                    <View style={styles.catLeft}>
                        <Ionicons name="briefcase-outline" size={14} color={primaryColor} style={{ opacity: 0.7 }} />
                        <ThemedText style={[styles.bizCategory, { color: primaryColor, opacity: 0.8, textTransform: 'capitalize' }]}>
                            {category}
                        </ThemedText>
                    </View>
                    {urduCategory && (
                        <ThemedText style={[styles.bizCategory, styles.urduCat, { color: primaryColor, opacity: 0.8 }]}>
                            {urduCategory}
                        </ThemedText>
                    )}
                </View>

                {description && (
                    <View style={styles.descriptionRow}>
                        <Ionicons name="information-circle-outline" size={14} color={primaryColor} style={{ opacity: 0.5 }} />
                        <ThemedText style={[styles.descriptionText, { color: primaryColor, opacity: 0.7 }]} numberOfLines={2}>
                            {description}
                        </ThemedText>
                    </View>
                )}

                <View style={styles.bizInfoRow}>
                    <Ionicons name="location" size={14} color={primaryColor} style={{ opacity: 0.6, paddingTop: isAndroid ? 2 : 4 }} />
                    <ThemedText style={[styles.bizInfoText, { color: primaryColor, opacity: 0.8, textTransform: 'capitalize' }]} numberOfLines={2}>
                        {address}
                    </ThemedText>
                </View>
            </View>

            {status !== 'REJECTED' && (
                <>
                    <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : (primaryColor + '15') }]} />

                    <View style={styles.cardFooter}>
                        <View style={styles.footerLeft}>
                            <Ionicons name="calendar-outline" size={12} color={primaryColor} style={{ opacity: 0.5 }} />
                            <ThemedText style={[styles.dateText, { color: primaryColor, opacity: 0.6 }]}>
                                {new Date(business.createdAt || Date.now()).toLocaleDateString()}
                            </ThemedText>
                        </View>

                        <View style={styles.footerRight}>
                            {status === 'APPROVED' && (
                                <View style={styles.searchToggleContainer}>
                                    <ThemedText style={[styles.searchText, { color: primaryColor, opacity: 0.8 }]}>Search</ThemedText>
                                    <Switch
                                        value={business.search}
                                        onValueChange={(val) => onToggleSearch(business._id, business.name, val)}
                                        trackColor={{ false: '#767577', true: colors.primary + '80' }}
                                        thumbColor={business.search ? colors.primary : '#f4f3f4'}
                                        disabled={isManageSearchPending}
                                        style={{ transform: [{ scaleX: 0.7 }, { scaleY: 0.7 }] }}
                                    />
                                </View>
                            )}

                            <View style={{ position: 'relative', zIndex: 100 }}>
                                {isDeleting ? (
                                    <View style={styles.moreBtn}>
                                        <ActivityIndicator size="small" color="#EF4444" />
                                    </View>
                                ) : (
                                    <View style={styles.moreBtn}>
                                        <ActionMenu actions={actions} triggerIconColor={primaryColor} triggerIcon="ellipsis-horizontal" />
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>
                </>
            )}
        </TintedCard>
    );
});

export default MyRegisteredBusinessCard;

const isAndroid = Platform.OS === 'android';

const styles = StyleSheet.create({
    card: {
        paddingHorizontal: isAndroid ? 14 : 16,
        paddingVertical: isAndroid ? 10 : 12,
        marginBottom: isAndroid ? 10 : 12 },
    cardHeader: {
        marginBottom: 8 },
    nameStatusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center' },
    bizName: {
        fontSize: 12.5,
        fontWeight: '800',
        textTransform: 'capitalize',
        flex: 1,
        marginRight: 8 },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 7,
        paddingVertical: 4,
        borderRadius: Layout.borderRadius,
        gap: 6 },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: Layout.borderRadius },
    statusText: {
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 0.5 },
    cardBody: {
        gap: 6,
        marginBottom: 10 },
    categoryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center' },
    catLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6 },
    bizCategory: {
        fontSize: 9,
        fontWeight: '600' },
    urduCat: {
        fontSize: 10 },
    descriptionRow: {
        flexDirection: 'row',
        gap: 6,
        alignItems: 'flex-start' },
    descriptionText: {
        fontSize: 10,
        fontStyle: 'italic',
        flex: 1,
        lineHeight: 16 },
    bizInfoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 6 },
    bizInfoText: {
        fontSize: 10,
        fontWeight: '500',
        flex: 1 },
    divider: {
        height: 1,
        width: '100%',
        marginBottom: 8,
        opacity: 0.5 },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4 },
    footerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4 },
    footerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12 },
    dateText: {
        fontSize: 10,
        fontWeight: '600' },
    searchToggleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2 },
    searchText: {
        fontSize: 10,
        fontWeight: '700' },
    moreBtn: {
        padding: 4,
        borderRadius: Layout.borderRadius,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent' } });
