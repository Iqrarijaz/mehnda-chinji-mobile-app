import React from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    TextInput,
    ActivityIndicator,
    Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themedText';
import moment from 'moment';

const MONTHS = [
    { name: 'Jan', value: '01' },
    { name: 'Feb', value: '02' },
    { name: 'Mar', value: '03' },
    { name: 'Apr', value: '04' },
    { name: 'May', value: '05' },
    { name: 'Jun', value: '06' },
    { name: 'Jul', value: '07' },
    { name: 'Aug', value: '08' },
    { name: 'Sep', value: '09' },
    { name: 'Oct', value: '10' },
    { name: 'Nov', value: '11' },
    { name: 'Dec', value: '12' },
];

interface BillsTabProps {
    bills: any[];
    billStats: { totalBills: number; totalAmount: number; paidBills: number; paidAmount: number; unpaidBills: number; unpaidAmount: number };
    billStatusFilter: string | null;
    setBillStatusFilter: (status: string | null) => void;
    billMonthFilter: string;
    setBillMonthFilter: (month: string) => void;
    loading: boolean;
    refreshing: boolean;
    onRefresh: () => void;
    onBulkPress: () => void;
    onPayPress: (bill: any) => void;
    onEditPress: (bill: any) => void;
    onDeletePress: (billId: string) => void;
    isDark: boolean;
    colors: any;
    onLoadMore?: () => void;
    isFetchingNextPage?: boolean;
}

const BillCard = React.memo(({
    item,
    isDark,
    colors,
    onPayPress,
    onEditPress,
    onDeletePress
}: {
    item: any;
    isDark: boolean;
    colors: any;
    onPayPress: (bill: any) => void;
    onEditPress: (bill: any) => void;
    onDeletePress: (billId: string) => void;
}) => {
    const isPaid = item.status === 'PAID';
    const statusColor = isPaid ? '#10b981' : '#ef4444';
    const rawConnName = item.connection?.name || item.connectionId?.name || 'Unknown Connection';
    const connName = React.useMemo(() => {
        return rawConnName
            ? rawConnName.split(' ').map((w: any) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
            : 'Unknown Connection';
    }, [rawConnName]);
    const connId = item.connection?.connectionId || item.connectionId?.connectionId || '-';

    return (
        <View style={[styles.dataCard, { backgroundColor: isDark ? '#1e293b' : '#FFF', borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
                <View>
                    <ThemedText style={styles.cardTitle}>{connName}</ThemedText>
                    <ThemedText style={[styles.cardSubtitle, { color: colors.textSecondary }]}>{connId} • {item.billingMonth}</ThemedText>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                    <ThemedText style={{ color: statusColor, fontSize: 9, fontWeight: '700' }}>{item.status}</ThemedText>
                </View>
            </View>

            <View style={styles.cardBody}>
                <View style={styles.infoLine}>
                    <Ionicons name="cash-outline" size={13} color={colors.textSecondary} />
                    <ThemedText style={[styles.infoValue, { fontWeight: '700', fontSize: 13 }]}>PKR {item.amount}</ThemedText>
                </View>
                {isPaid ? (
                    <View style={styles.infoLine}>
                        <Ionicons name="checkmark-circle-outline" size={13} color="#10b981" />
                        <ThemedText style={styles.infoValue}>Paid via {item.paymentMode || 'CASH'} on {moment(item.paidOn).format('DD MMM YYYY')}</ThemedText>
                    </View>
                ) : null}
            </View>

            <View style={[styles.cardActions, { borderTopColor: colors.border, alignItems: 'center' }]}>
                {!isPaid ? (
                    <TouchableOpacity
                        onPress={() => onPayPress(item)}
                        style={[styles.markPaidPill, { backgroundColor: '#10b98115', borderColor: '#10b98130' }]}
                    >
                        <Ionicons name="checkmark-done" size={12} color="#10b981" />
                        <ThemedText style={[styles.markPaidPillText, { color: '#10b981' }]}>Mark Paid</ThemedText>
                    </TouchableOpacity>
                ) : (
                    <View style={{ width: 10 }} />
                )}

                <View style={styles.rightActions}>
                    {!isPaid ? (
                        <TouchableOpacity
                            onPress={() => onEditPress(item)}
                            style={styles.actionBtn}
                        >
                            <Ionicons name="create-outline" size={13} color="#3b82f6" />
                            <ThemedText style={[styles.smallActionBtnText, { color: '#3b82f6' }]}>Edit</ThemedText>
                        </TouchableOpacity>
                    ) : null}

                    <TouchableOpacity
                        onPress={() => onDeletePress(item._id)}
                        style={styles.actionBtn}
                    >
                        <Ionicons name="trash-outline" size={13} color="#ef4444" />
                        <ThemedText style={[styles.smallActionBtnText, { color: '#ef4444' }]}>Delete</ThemedText>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
});

const BillsTab = React.memo(({
    bills,
    billStats,
    billStatusFilter,
    setBillStatusFilter,
    billMonthFilter,
    setBillMonthFilter,
    loading,
    refreshing,
    onRefresh,
    onBulkPress,
    onPayPress,
    onEditPress,
    onDeletePress,
    isDark,
    colors,
    onLoadMore,
    isFetchingNextPage
}: BillsTabProps) => {
    const [showDatePicker, setShowDatePicker] = React.useState(false);
    const [pickerYear, setPickerYear] = React.useState(moment(billMonthFilter || undefined).year());

    const handleOpenPicker = React.useCallback(() => {
        setPickerYear(moment(billMonthFilter || undefined).year());
        setShowDatePicker(true);
    }, [billMonthFilter]);

    const handleMonthSelect = React.useCallback((monthVal: string) => {
        const formattedMonth = `${pickerYear}-${monthVal}`;
        setBillMonthFilter(formattedMonth);
        setShowDatePicker(false);
    }, [pickerYear, setBillMonthFilter]);

    const stats = React.useMemo(() => [
        { label: 'Unpaid', value: `PKR ${billStats.unpaidAmount || 0}`, count: `${billStats.unpaidBills} Bills`, color: '#ef4444', bgLight: 'rgba(239, 68, 68, 0.08)', bgDark: 'rgba(239, 68, 68, 0.15)' },
        { label: 'Paid', value: `PKR ${billStats.paidAmount || 0}`, count: `${billStats.paidBills} Bills`, color: '#10b981', bgLight: 'rgba(16, 185, 129, 0.08)', bgDark: 'rgba(16, 185, 129, 0.15)' },
        { label: 'Total', value: `PKR ${billStats.totalAmount || 0}`, count: `${billStats.totalBills} Bills`, color: '#3b82f6', bgLight: 'rgba(59, 130, 246, 0.08)', bgDark: 'rgba(59, 130, 246, 0.15)' },
    ], [billStats.unpaidAmount, billStats.unpaidBills, billStats.paidAmount, billStats.paidBills, billStats.totalAmount, billStats.totalBills]);

    const renderBillItem = React.useCallback(({ item }: { item: any }) => (
        <BillCard
            item={item}
            isDark={isDark}
            colors={colors}
            onPayPress={onPayPress}
            onEditPress={onEditPress}
            onDeletePress={onDeletePress}
        />
    ), [isDark, colors, onPayPress, onEditPress, onDeletePress]);

    const getItemLayout = React.useCallback((data: any, index: number) => ({
        length: 120,
        offset: 120 * index,
        index,
    }), []);

    return (
        <View style={{ flex: 1 }}>
            {/* Stats Row */}
            <View style={styles.statsContainer}>
                {stats.map((st, i) => (
                    <View
                        key={i}
                        style={[
                            styles.billStatCard,
                            {
                                backgroundColor: isDark ? st.bgDark : st.bgLight,
                                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                                borderWidth: 1,
                            }
                        ]}
                    >
                        <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>{st.label}</ThemedText>
                        <ThemedText style={[styles.billStatVal, { color: isDark ? '#FFF' : '#0f172a', marginTop: 0 }]}>
                            {st.value} <ThemedText style={[styles.statCount, { color: st.color, fontSize: 8 }]}>({st.count.split(' ')[0]})</ThemedText>
                        </ThemedText>
                    </View>
                ))}
            </View>

            {/* Filters Row */}
            <View style={styles.actionRow}>
                <TouchableOpacity
                    onPress={handleOpenPicker}
                    activeOpacity={0.7}
                    style={[styles.searchBox, { flex: 1, backgroundColor: isDark ? '#1e293b' : '#FFF', borderColor: colors.border }]}
                >
                    <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
                    <ThemedText style={[styles.searchInputText, { color: billMonthFilter ? colors.text : colors.textSecondary }]}>
                        {billMonthFilter ? moment(billMonthFilter, 'YYYY-MM').format('MMMM YYYY') : 'Select Month'}
                    </ThemedText>
                    {billMonthFilter ? (
                        <TouchableOpacity onPress={(e) => {
                            e.stopPropagation();
                            setBillMonthFilter('');
                        }}>
                            <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
                        </TouchableOpacity>
                    ) : null}
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => setBillStatusFilter(billStatusFilter === 'PENDING' ? null : 'PENDING')}
                    style={[
                        styles.filterBtn,
                        {
                            backgroundColor: billStatusFilter === 'PENDING' ? '#ef4444' : (isDark ? '#1e293b' : '#FFF'),
                            borderColor: billStatusFilter === 'PENDING' ? '#ef4444' : colors.border
                        }
                    ]}
                >
                    <ThemedText style={{ color: billStatusFilter === 'PENDING' ? '#FFF' : colors.text, fontSize: 11, fontWeight: '700' }}>Unpaid Only</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={onBulkPress}
                    style={[styles.bulkBtn, { backgroundColor: colors.secondary }]}
                >
                    <Ionicons name="flash-outline" size={14} color="#FFF" />
                    <ThemedText style={styles.bulkBtnText}>Bulk</ThemedText>
                </TouchableOpacity>
            </View>

            {loading && !refreshing ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={bills}
                    keyExtractor={(item, index) => `${item._id || ''}-${index}`}
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    contentContainerStyle={{ paddingBottom: 80 }}
                    onEndReached={onLoadMore}
                    onEndReachedThreshold={0.3}
                    renderItem={renderBillItem}
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
                            <Ionicons name="receipt-outline" size={48} color={colors.textSecondary} />
                            <ThemedText style={{ color: colors.textSecondary, marginTop: 12 }}>No bills found for this month</ThemedText>
                        </View>
                    }
                />
            )}

            {/* Custom Month Picker Modal */}
            <Modal
                visible={showDatePicker}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowDatePicker(false)}
            >
                <View style={styles.dateModalOverlay}>
                    <View style={[styles.dateModalContent, { backgroundColor: isDark ? '#1e293b' : '#FFF', borderColor: colors.border }]}>
                        <View style={styles.modalHeader}>
                            <ThemedText style={styles.modalTitle}>Select Month & Year</ThemedText>
                        </View>

                        {/* Year Selector */}
                        <View style={styles.yearSelectorRow}>
                            <TouchableOpacity onPress={() => setPickerYear(p => p - 1)} style={[styles.yearArrow, { borderColor: colors.border }]}>
                                <Ionicons name="chevron-back" size={18} color={colors.text} />
                            </TouchableOpacity>
                            <ThemedText style={[styles.yearText, { color: colors.text }]}>{pickerYear}</ThemedText>
                            <TouchableOpacity onPress={() => setPickerYear(p => p + 1)} style={[styles.yearArrow, { borderColor: colors.border }]}>
                                <Ionicons name="chevron-forward" size={18} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        {/* Months Grid */}
                        <View style={styles.monthsGrid}>
                            {MONTHS.map((m) => {
                                const isSelected = billMonthFilter === `${pickerYear}-${m.value}`;
                                return (
                                    <TouchableOpacity
                                        key={m.value}
                                        onPress={() => handleMonthSelect(m.value)}
                                        style={[
                                            styles.monthGridItem,
                                            {
                                                backgroundColor: isSelected ? colors.primary : (isDark ? '#334155' : 'rgba(0,0,0,0.03)'),
                                                borderColor: isSelected ? colors.primary : colors.border
                                            }
                                        ]}
                                    >
                                        <ThemedText style={{ color: isSelected ? '#FFF' : colors.text, fontWeight: '700', fontSize: 13 }}>
                                            {m.name}
                                        </ThemedText>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={styles.modalBtn}
                                onPress={() => setShowDatePicker(false)}
                            >
                                <ThemedText style={[styles.modalBtnText, { color: colors.textSecondary }]}>Cancel</ThemedText>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
});

export default BillsTab;

const styles = StyleSheet.create({
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 6,
        marginBottom: 12,
    },
    billStatCard: {
        flex: 1,
        borderRadius: 6,
        paddingVertical: 3,
        paddingHorizontal: 2,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0,
    },
    statLabel: {
        fontSize: 8,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.1,
    },
    billStatVal: {
        fontSize: 10,
        fontWeight: '800',
    },
    statCount: {
        fontSize: 8,
        fontWeight: '700',
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
    },
    searchInput: {
        flex: 1,
        marginLeft: 6,
        fontSize: 12,
        height: '100%',
        padding: 0,
    },
    filterBtn: {
        height: 38,
        paddingHorizontal: 8,
        borderRadius: 10,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bulkBtn: {
        height: 38,
        paddingHorizontal: 10,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
    },
    bulkBtnText: {
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
    rightActions: {
        flexDirection: 'row',
        gap: 4,
        alignItems: 'center',
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
    smallActionBtnText: {
        fontSize: 11,
        fontWeight: '600',
    },
    markPaidPill: {
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 3,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        borderWidth: 1,
    },
    markPaidPillText: {
        fontSize: 10,
        fontWeight: '700',
    },
    dateModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dateModalContent: {
        width: '90%',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
    },
    modalHeader: {
        marginBottom: 16,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: '800',
    },
    pickerContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 10,
        borderRadius: 12,
        padding: 10,
    },
    modalFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
        marginTop: 10,
    },
    modalBtn: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    modalBtnPrimary: {
        backgroundColor: 'rgba(255, 155, 81, 0.1)',
    },
    modalBtnText: {
        fontSize: 14,
        fontWeight: '700',
    },
    searchInputText: {
        flex: 1,
        marginLeft: 6,
        fontSize: 12,
    },
    yearSelectorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        marginBottom: 16,
    },
    yearArrow: {
        width: 32,
        height: 32,
        borderRadius: 8,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    yearText: {
        fontSize: 16,
        fontWeight: '800',
    },
    monthsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 8,
        marginBottom: 16,
    },
    monthGridItem: {
        width: '30%',
        height: 38,
        borderRadius: 8,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 2,
    },
});
