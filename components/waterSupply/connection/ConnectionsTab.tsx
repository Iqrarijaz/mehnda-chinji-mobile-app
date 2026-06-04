import React from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    TextInput,
    ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themedText';
import moment from 'moment';

interface ConnectionsTabProps {
    connections: any[];
    connectionStats: { total: number; active: number; suspended: number; cancelled: number };
    connSearch: string;
    setConnSearch: (search: string) => void;
    connStatusFilter: string | null;
    setConnStatusFilter: (status: string | null) => void;
    loading: boolean;
    refreshing: boolean;
    onRefresh: () => void;
    onAddPress: () => void;
    onEditPress: (conn: any) => void;
    onDeletePress: (connId: string, name: string) => void;
    onGenerateBillPress: (conn: any) => void;
    isDark: boolean;
    colors: any;
    onLoadMore?: () => void;
    isFetchingNextPage?: boolean;
}

const ConnectionCard = React.memo(({
    item,
    isDark,
    colors,
    onEditPress,
    onDeletePress,
    onGenerateBillPress
}: {
    item: any;
    isDark: boolean;
    colors: any;
    onEditPress: (item: any) => void;
    onDeletePress: (id: string, name: string) => void;
    onGenerateBillPress: (item: any) => void;
}) => {
    const statusColor = item.status === 'ACTIVE' ? '#10b981' : item.status === 'SUSPENDED' ? '#f59e0b' : '#ef4444';
    const capitalizedName = React.useMemo(() => {
        return item.name
            ? item.name.split(' ').map((w: any) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
            : '';
    }, [item.name]);

    return (
        <View style={[styles.dataCard, { backgroundColor: isDark ? '#1e293b' : '#FFF', borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
                <View>
                    <ThemedText style={styles.cardTitle}>{capitalizedName}</ThemedText>
                    <ThemedText style={[styles.cardSubtitle, { color: colors.textSecondary }]}>{item.connectionId}</ThemedText>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                    <ThemedText style={{ color: statusColor, fontSize: 9, fontWeight: '700' }}>{item.status}</ThemedText>
                </View>
            </View>

            <View style={styles.cardBody}>
                <View style={styles.infoRow}>
                    {item.phoneNumber ? (
                        <View style={styles.infoLine}>
                            <Ionicons name="call-outline" size={13} color={colors.textSecondary} />
                            <ThemedText style={styles.infoValue}>{item.phoneNumber}</ThemedText>
                        </View>
                    ) : null}
                    <View style={styles.infoLine}>
                        <Ionicons name="calendar-outline" size={13} color={colors.textSecondary} />
                        <ThemedText style={styles.infoValue}>{moment(item.installationDate).format('DD MMM YYYY')}</ThemedText>
                    </View>
                </View>
                {item.address ? (
                    <View style={styles.infoLine}>
                        <Ionicons name="location-outline" size={13} color={colors.textSecondary} />
                        <ThemedText style={styles.infoValue}>{item.address}</ThemedText>
                    </View>
                ) : null}
            </View>

            <View style={[styles.cardActions, { borderTopColor: colors.border, alignItems: 'center' }]}>
                <TouchableOpacity
                    onPress={() => onGenerateBillPress(item)}
                    style={[styles.generateBillPill, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}
                >
                    <Ionicons name="receipt-outline" size={12} color={colors.primary} />
                    <ThemedText style={[styles.generateBillPillText, { color: colors.primary }]}>Generate Bill</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => onEditPress(item)}
                    style={styles.actionBtn}
                >
                    <Ionicons name="create-outline" size={13} color="#3b82f6" />
                    <ThemedText style={[styles.smallActionBtnText, { color: '#3b82f6' }]}>Edit</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => onDeletePress(item._id, item.name)}
                    style={styles.actionBtn}
                >
                    <Ionicons name="trash-outline" size={13} color="#ef4444" />
                    <ThemedText style={[styles.smallActionBtnText, { color: '#ef4444' }]}>Delete</ThemedText>
                </TouchableOpacity>
            </View>
        </View>
    );
});

const ConnectionsTab = React.memo(({
    connections,
    connectionStats,
    connSearch,
    setConnSearch,
    connStatusFilter,
    setConnStatusFilter,
    loading,
    refreshing,
    onRefresh,
    onAddPress,
    onEditPress,
    onDeletePress,
    onGenerateBillPress,
    isDark,
    colors,
    onLoadMore,
    isFetchingNextPage
}: ConnectionsTabProps) => {
    const [localSearch, setLocalSearch] = React.useState(connSearch);

    React.useEffect(() => {
        setLocalSearch(connSearch);
    }, [connSearch]);

    React.useEffect(() => {
        const handler = setTimeout(() => {
            setConnSearch(localSearch);
        }, 300);
        return () => clearTimeout(handler);
    }, [localSearch, setConnSearch]);

    const stats = React.useMemo(() => [
        { label: 'Total', count: connectionStats.total, color: '#3b82f6', bgLight: 'rgba(59, 130, 246, 0.08)', bgDark: 'rgba(59, 130, 246, 0.15)', activeKey: null },
        { label: 'Active', count: connectionStats.active, color: '#22c55e', bgLight: 'rgba(34, 197, 94, 0.08)', bgDark: 'rgba(34, 197, 94, 0.15)', activeKey: 'ACTIVE' },
        { label: 'Suspended', count: connectionStats.suspended, color: '#f97316', bgLight: 'rgba(249, 115, 22, 0.08)', bgDark: 'rgba(249, 115, 22, 0.15)', activeKey: 'SUSPENDED' },
        { label: 'Cancelled', count: connectionStats.cancelled, color: '#ef4444', bgLight: 'rgba(239, 68, 68, 0.08)', bgDark: 'rgba(239, 68, 68, 0.15)', activeKey: 'CANCELLED' },
    ], [connectionStats.total, connectionStats.active, connectionStats.suspended, connectionStats.cancelled]);

    const renderConnectionItem = React.useCallback(({ item }: { item: any }) => (
        <ConnectionCard
            item={item}
            isDark={isDark}
            colors={colors}
            onEditPress={onEditPress}
            onDeletePress={onDeletePress}
            onGenerateBillPress={onGenerateBillPress}
        />
    ), [isDark, colors, onEditPress, onDeletePress, onGenerateBillPress]);

    const getItemLayout = React.useCallback((data: any, index: number) => ({
        length: 134,
        offset: 134 * index,
        index,
    }), []);

    return (
        <View style={{ flex: 1 }}>
            {/* Stats Row */}
            <View style={styles.statsContainer}>
                {stats.map((st, i) => {
                    const isCurrent = connStatusFilter === st.activeKey;
                    const cardBg = isCurrent
                        ? st.color
                        : (isDark ? st.bgDark : st.bgLight);
                    return (
                        <TouchableOpacity
                            key={i}
                            onPress={() => setConnStatusFilter(st.activeKey)}
                            style={[
                                styles.statCard,
                                {
                                    backgroundColor: cardBg,
                                    borderColor: isCurrent ? st.color : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'),
                                    borderWidth: 1,
                                }
                            ]}
                        >
                            <ThemedText style={[styles.statLabel, { color: isCurrent ? '#FFF' : (isDark ? '#cbd5e1' : '#64748b') }]}>
                                {st.label}
                            </ThemedText>
                            <ThemedText style={[styles.statCount, { color: isCurrent ? '#FFF' : (isDark ? '#FFF' : '#0f172a') }]}>
                                {st.count}
                            </ThemedText>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* Filter and Add Row */}
            <View style={styles.actionRow}>
                <View style={[styles.searchBox, { backgroundColor: isDark ? '#1e293b' : '#FFF', borderColor: colors.border }]}>
                    <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
                    <TextInput
                        placeholder="Search name/phone/address"
                        placeholderTextColor={colors.textSecondary}
                        value={localSearch}
                        onChangeText={setLocalSearch}
                        style={[styles.searchInput, { color: colors.text }]}
                    />
                    {localSearch ? (
                        <TouchableOpacity onPress={() => setLocalSearch('')}>
                            <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
                        </TouchableOpacity>
                    ) : null}
                </View>

                <TouchableOpacity
                    onPress={onAddPress}
                    style={[styles.primaryAddBtn, { backgroundColor: colors.primary }]}
                >
                    <Ionicons name="add" size={14} color="#FFF" />
                </TouchableOpacity>
            </View>

            {loading && !refreshing ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={connections}
                    keyExtractor={(item, index) => `${item._id || ''}-${index}`}
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    contentContainerStyle={{ paddingBottom: 80 }}
                    onEndReached={onLoadMore}
                    onEndReachedThreshold={0.3}
                    renderItem={renderConnectionItem}
                    getItemLayout={getItemLayout}
                    removeClippedSubviews={true}
                    maxToRenderPerBatch={10}
                    windowSize={5}
                    initialNumToRender={8}
                    ListFooterComponent={
                        isFetchingNextPage ? (
                            <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 12 }} />
                        ) : null
                    }
                    ListEmptyComponent={
                        <View style={styles.centered}>
                            <Ionicons name="people-outline" size={48} color={colors.textSecondary} />
                            <ThemedText style={{ color: colors.textSecondary, marginTop: 12 }}>No water connections found</ThemedText>
                        </View>
                    }
                />
            )}
        </View>
    );
});

export default ConnectionsTab;

const styles = StyleSheet.create({
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 6,
        marginBottom: 12,
    },
    statCard: {
        flex: 1,
        borderRadius: 6,
        paddingVertical: 2,
        paddingHorizontal: 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
    },
    statLabel: {
        fontSize: 8,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.1,
    },
    statCount: {
        fontSize: 10,
        fontWeight: '800',
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 2,
        borderRadius: 10,
        paddingHorizontal: 10,
        height: 38,
        flex: 1,
    },
    searchInput: {
        flex: 1,
        marginLeft: 6,
        fontSize: 12,
        height: '100%',
        padding: 0,
    },
    primaryAddBtn: {
        width: 38,
        height: 38,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    primaryAddBtnText: {
        color: '#FFF',
        fontSize: 11,
        fontWeight: '700',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    dataCard: {
        borderRadius: 12,
        borderWidth: 2,
        padding: 10,
        marginBottom: 12,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: '700',
    },
    cardSubtitle: {
        fontSize: 11,
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    cardBody: {
        marginVertical: 6,
        gap: 4,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    infoLine: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    infoValue: {
        fontSize: 11,
    },
    cardActions: {
        flexDirection: 'row',
        borderTopWidth: 1,
        paddingTop: 8,
        justifyContent: 'space-between',
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 4,
        paddingHorizontal: 6,
    },
    actionBtnText: {
        fontSize: 12,
        fontWeight: '700',
    },
    generateBillPill: {
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 3,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        borderWidth: 1,
    },
    generateBillPillText: {
        fontSize: 10,
        fontWeight: '700',
    },
    smallActionBtnText: {
        fontSize: 11,
        fontWeight: '600',
    },
});
