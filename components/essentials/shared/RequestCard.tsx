import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ActivityIndicator,
    Platform,
    StyleSheet,
    View } from 'react-native';
import { ActionMenu, ActionMenuItem } from '@/components/common/ActionMenu';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/colors';
import { TintedCard } from '@/components/ui/TintedCard';
import { Layout } from '@/constants/layout';

interface RequestCardProps {
    item: any;
    categoryColor: string;
    isDeleting?: boolean;
    onEdit: (item: any) => void;
    onDelete: (id: string, name: string) => void;
}

const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
        case 'APPROVED': return '#10B981';
        case 'REJECTED': return '#EF4444';
        default: return '#F59E0B';
    }
};

const isAndroid = Platform.OS === 'android';

const RequestCard = React.memo(({
    item,
    categoryColor,
    isDeleting,
    onEdit,
    onDelete }: RequestCardProps) => {
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];

    const status = item.status?.toUpperCase();
    const statusColor = getStatusColor(status);
    const isPending = status === 'PENDING';

    const address = (item.address || '').toLowerCase();

    const actions: ActionMenuItem[] = [];
    if (isPending || status === 'APPROVED') {
        actions.push({
            label: 'Edit',
            icon: 'create',
            onPress: () => onEdit(item) });
    }
    actions.push({
        label: 'Delete',
        icon: 'trash',
        destructive: true,
        onPress: () => onDelete(item._id, item.name) });

    return (
        <TintedCard
            tintColor={categoryColor}
            bgColor={colors.card}
            style={styles.card}
        >
            {/* HEADER: name + status */}
            <View style={styles.cardHeader}>
                <View style={styles.nameStatusRow}>
                    <ThemedText style={[styles.name, { color: colors.text }]} numberOfLines={1}>
                        {item.name}
                    </ThemedText>

                    <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
                        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                        <ThemedText style={[styles.statusText, { color: statusColor }]}>
                            {status}
                        </ThemedText>
                    </View>
                </View>
            </View>

            {/* BODY */}
            <View style={styles.cardBody}>
                {/* Category + Type row */}
                <View style={styles.categoryRow}>
                    <View style={styles.catLeft}>
                        <Ionicons name="apps-outline" size={14} color={categoryColor} style={{ opacity: 0.8 }} />
                        <ThemedText style={[styles.metaText, { color: colors.text, opacity: 0.8, textTransform: 'capitalize' }]}>
                            {item.category}
                        </ThemedText>
                    </View>
                    {item.type && (
                        <View style={[styles.typePill, { backgroundColor: categoryColor + '18' }]}>
                            <ThemedText style={[styles.typeText, { color: categoryColor }]}>
                                {item.type.toUpperCase()}
                            </ThemedText>
                        </View>
                    )}
                </View>

                {/* Address */}
                {address ? (
                    <View style={styles.infoRow}>
                        <Ionicons name="location" size={13} color={categoryColor} style={{ opacity: 0.6, paddingTop: isAndroid ? 2 : 3 }} />
                        <ThemedText style={[styles.infoText, { color: colors.text, opacity: 0.8 }]}>
                            {address}
                        </ThemedText>
                    </View>
                ) : null}

            </View>

            {/* FOOTER */}
            <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : (categoryColor + '15') }]} />
            <View style={styles.cardFooter}>
                <View style={styles.footerLeft}>
                    <Ionicons name="calendar-outline" size={12} color={colors.text} style={{ opacity: 0.5 }} />
                    <ThemedText style={[styles.dateText, { color: colors.text, opacity: 0.6 }]}>
                        {new Date(item.createdAt || Date.now()).toLocaleDateString('en-US', {
                            day: 'numeric', month: 'short', year: 'numeric'
                        })}
                    </ThemedText>
                </View>

                <View style={{ position: 'relative', zIndex: 100 }}>
                    {isDeleting ? (
                        <View style={styles.moreBtn}>
                            <ActivityIndicator size="small" color="#EF4444" />
                        </View>
                    ) : (
                        <View style={styles.moreBtn}>
                            <ActionMenu
                                actions={actions}
                                triggerIconColor={categoryColor}
                                triggerIcon="ellipsis-horizontal"
                            />
                        </View>
                    )}
                </View>
            </View>
        </TintedCard>
    );
});

RequestCard.displayName = 'RequestCard';
export default RequestCard;

const styles = StyleSheet.create({
    card: {
        paddingHorizontal: 10,
        paddingVertical: 8,
        marginBottom: 10 },
    cardHeader: {
        marginBottom: 6 },
    nameStatusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center' },
    name: {
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
        gap: 5 },
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
        gap: 5 },
    metaText: {
        fontSize: 10,
        fontWeight: '600' },
    typePill: {
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: Layout.borderRadius },
    typeText: {
        fontSize: 9,
        fontWeight: '700',
        letterSpacing: 0.5 },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 5 },
    infoText: {
        fontSize: 10,
        fontWeight: '500',
        flex: 1,
        textTransform: 'capitalize' },
    divider: {
        height: 1,
        width: '100%',
        marginBottom: 8,
        opacity: 0.5 },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center' },
    footerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4 },
    dateText: {
        fontSize: 10,
        fontWeight: '600' },
    moreBtn: {
        padding: 4,
        borderRadius: Layout.borderRadius,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent' } });