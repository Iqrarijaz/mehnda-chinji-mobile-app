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

interface ExpensesTabProps {
    expenses: any[];
    expenseMonthFilter: string;
    setExpenseMonthFilter: (month: string) => void;
    expenseSearch: string;
    setExpenseSearch: (search: string) => void;
    loading: boolean;
    refreshing: boolean;
    onRefresh: () => void;
    onAddPress: () => void;
    onEditPress: (exp: any) => void;
    onDeletePress: (expenseId: string) => void;
    isDark: boolean;
    colors: any;
    onLoadMore?: () => void;
    isFetchingNextPage?: boolean;
}

const ExpenseCard = React.memo(({
    item,
    isDark,
    colors,
    onEditPress,
    onDeletePress
}: {
    item: any;
    isDark: boolean;
    colors: any;
    onEditPress: (exp: any) => void;
    onDeletePress: (expenseId: string) => void;
}) => {
    return (
        <View style={[styles.dataCard, { backgroundColor: isDark ? '#1e293b' : '#FFF', borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                    <ThemedText style={styles.cardTitle}>{item.title}</ThemedText>
                    <ThemedText style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                        Logged on {moment(item.expenseDate).format('DD MMM YYYY')}
                    </ThemedText>
                </View>
                <ThemedText style={[styles.cardTitle, { color: '#ef4444' }]}>PKR {item.amount}</ThemedText>
            </View>

            <View style={[styles.cardActions, { borderTopColor: colors.border, marginTop: 8 }]}>
                <TouchableOpacity
                    onPress={() => onEditPress(item)}
                    style={styles.actionBtn}
                >
                    <Ionicons name="create-outline" size={13} color="#3b82f6" />
                    <ThemedText style={[styles.smallActionBtnText, { color: '#3b82f6' }]}>Edit</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => onDeletePress(item._id)}
                    style={styles.actionBtn}
                >
                    <Ionicons name="trash-outline" size={13} color="#ef4444" />
                    <ThemedText style={[styles.smallActionBtnText, { color: '#ef4444' }]}>Delete</ThemedText>
                </TouchableOpacity>
            </View>
        </View>
    );
});

const ExpensesTab = React.memo(({
    expenses,
    expenseMonthFilter,
    setExpenseMonthFilter,
    expenseSearch,
    setExpenseSearch,
    loading,
    refreshing,
    onRefresh,
    onAddPress,
    onEditPress,
    onDeletePress,
    isDark,
    colors,
    onLoadMore,
    isFetchingNextPage
}: ExpensesTabProps) => {
    const [localSearch, setLocalSearch] = React.useState(expenseSearch);

    React.useEffect(() => {
        setLocalSearch(expenseSearch);
    }, [expenseSearch]);

    React.useEffect(() => {
        const handler = setTimeout(() => {
            setExpenseSearch(localSearch);
        }, 300);
        return () => clearTimeout(handler);
    }, [localSearch, setExpenseSearch]);

    const [showDatePicker, setShowDatePicker] = React.useState(false);
    const [pickerYear, setPickerYear] = React.useState(moment(expenseMonthFilter || undefined).year());

    const handleOpenPicker = React.useCallback(() => {
        setPickerYear(moment(expenseMonthFilter || undefined).year());
        setShowDatePicker(true);
    }, [expenseMonthFilter]);

    const handleMonthSelect = React.useCallback((monthVal: string) => {
        const formattedMonth = `${pickerYear}-${monthVal}`;
        setExpenseMonthFilter(formattedMonth);
        setShowDatePicker(false);
    }, [pickerYear, setExpenseMonthFilter]);

    const totalExp = React.useMemo(() => {
        return expenses.reduce((acc, cur) => acc + (cur.amount || 0), 0);
    }, [expenses]);

    const renderExpenseItem = React.useCallback(({ item }: { item: any }) => (
        <ExpenseCard
            item={item}
            isDark={isDark}
            colors={colors}
            onEditPress={onEditPress}
            onDeletePress={onDeletePress}
        />
    ), [isDark, colors, onEditPress, onDeletePress]);

    const getItemLayout = React.useCallback((data: any, index: number) => ({
        length: 86,
        offset: 86 * index,
        index,
    }), []);

    return (
        <View style={{ flex: 1 }}>
            {/* Stats Header */}
            <View style={[styles.summaryCard, { backgroundColor: colors.primary }]}>
                <ThemedText style={styles.summaryLabel}>Total Monthly Expenses</ThemedText>
                <ThemedText style={styles.summaryValue}>PKR {totalExp}</ThemedText>
                <ThemedText style={styles.summarySub}>{expenseMonthFilter}</ThemedText>
            </View>

            {/* Filters and Log */}
            <View style={styles.actionRow}>
                <TouchableOpacity
                    onPress={handleOpenPicker}
                    activeOpacity={0.7}
                    style={[styles.searchBox, { flex: 1, backgroundColor: isDark ? '#1e293b' : '#FFF', borderColor: colors.border }]}
                >
                    <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
                    <ThemedText style={[styles.searchInputText, { color: expenseMonthFilter ? colors.text : colors.textSecondary }]}>
                        {expenseMonthFilter ? moment(expenseMonthFilter, 'YYYY-MM').format('MMMM YYYY') : 'Select Month'}
                    </ThemedText>
                    {expenseMonthFilter ? (
                        <TouchableOpacity onPress={(e) => {
                            e.stopPropagation();
                            setExpenseMonthFilter('');
                        }}>
                            <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
                        </TouchableOpacity>
                    ) : null}
                </TouchableOpacity>

                <View style={[styles.searchBox, { flex: 1.2, backgroundColor: isDark ? '#1e293b' : '#FFF', borderColor: colors.border }]}>
                    <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
                    <TextInput
                        placeholder="Search title"
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
                    <Ionicons name="add" size={20} color="#FFF" />
                </TouchableOpacity>
            </View>

            {loading && !refreshing ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={expenses}
                    keyExtractor={(item, index) => `${item._id || ''}-${index}`}
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    contentContainerStyle={{ paddingBottom: 80 }}
                    onEndReached={onLoadMore}
                    onEndReachedThreshold={0.3}
                    renderItem={renderExpenseItem}
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
                            <Ionicons name="card-outline" size={48} color={colors.textSecondary} />
                            <ThemedText style={{ color: colors.textSecondary, marginTop: 12 }}>No expenses logged for this month</ThemedText>
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
                                const isSelected = expenseMonthFilter === `${pickerYear}-${m.value}`;
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

export default ExpensesTab;

const styles = StyleSheet.create({
    summaryCard: {
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    summaryLabel: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
        fontWeight: '600',
    },
    summaryValue: {
        color: '#FFF',
        fontSize: 28,
        fontWeight: '800',
        marginVertical: 4,
    },
    summarySub: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 12,
        fontWeight: '600',
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
        paddingHorizontal: 12,
        height: 38,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 13,
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
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    dataCard: {
        borderRadius: 10,
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
    cardActions: {
        flexDirection: 'row',
        borderTopWidth: 1,
        paddingTop: 6,
        justifyContent: 'flex-end',
        gap: 12,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        paddingVertical: 3,
        paddingHorizontal: 4,
    },
    actionBtnText: {
        fontSize: 12,
        fontWeight: '700',
    },
    smallActionBtnText: {
        fontSize: 11,
        fontWeight: '600',
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
