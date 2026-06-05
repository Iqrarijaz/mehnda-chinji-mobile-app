import React from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Modal,
    FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import moment from 'moment';
import { ThemedText } from '@/components/themedText';
import Animated, {
    useSharedValue,
    useAnimatedScrollHandler,
    useAnimatedStyle,
} from 'react-native-reanimated';

interface ReportTabProps {
    reportData: any;
    reportMonths: number;
    setReportMonths: (months: number) => void;
    reportMonthFilter: string;
    setReportMonthFilter: (month: string) => void;
    loading: boolean;
    isDark: boolean;
    colors: any;
    onGenerateReport: (month: string) => void;
    isGeneratingReport?: boolean;
}

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
    { name: 'Dec', value: '12' }
];

interface MonthDetailCardProps {
    item: any;
    isDark: boolean;
    colors: any;
}

const MonthDetailCard = React.memo(({ item, isDark, colors }: MonthDetailCardProps) => {
    const isProfit = (item.net || 0) >= 0;
    return (
        <View style={[styles.reportRowCard, { backgroundColor: isDark ? '#1e293b' : '#FFF' }]}>
            <View style={styles.reportRowHeader}>
                <ThemedText style={styles.reportRowMonth}>{item.month}</ThemedText>
                <View style={[styles.netBadge, { backgroundColor: (isProfit ? '#10b981' : '#ef4444') + '20' }]}>
                    <ThemedText style={{ color: isProfit ? '#10b981' : '#ef4444', fontWeight: '700', fontSize: 11 }}>
                        Net: PKR {item.net}
                    </ThemedText>
                </View>
            </View>

            <View style={styles.reportRowDetail}>
                <View style={styles.reportDetailItem}>
                    <ThemedText style={styles.reportItemLabel}>Income</ThemedText>
                    <ThemedText style={[styles.reportItemVal, { color: '#10b981' }]}>+PKR {item.income || 0}</ThemedText>
                </View>
                <View style={styles.reportDetailItem}>
                    <ThemedText style={styles.reportItemLabel}>Expense</ThemedText>
                    <ThemedText style={[styles.reportItemVal, { color: '#ef4444' }]}>-PKR {item.expense || 0}</ThemedText>
                </View>
            </View>
        </View>
    );
});

interface ReportTabHeaderProps {
    reportMonths: number;
    summary: { totalIncome: number; totalExpense: number; netProfit: number };
    isDark: boolean;
    colors: any;
    setReportMonths: (months: number) => void;
}

const ReportTabHeader = React.memo(({
    reportMonths,
    summary,
    isDark,
    colors,
    setReportMonths,
}: ReportTabHeaderProps) => {
    const [contentWidth, setContentWidth] = React.useState(1);
    const [layoutWidth, setLayoutWidth] = React.useState(1);

    const scrollX = useSharedValue(0);

    const handleScroll = useAnimatedScrollHandler((event) => {
        scrollX.value = event.contentOffset.x;
    });

    const animatedIndicatorStyle = useAnimatedStyle(() => {
        const maxScroll = contentWidth - layoutWidth;
        const translateX = maxScroll > 0 ? (scrollX.value / maxScroll) * 25 : 0;
        return {
            transform: [{ translateX }],
        };
    });

    return (
        <View>
            {/* Financial Summary Card */}
            <View style={[styles.reportSummaryCard, { backgroundColor: isDark ? '#1e293b' : '#FFF' }]}>
                <ThemedText style={styles.reportSummaryTitle}>Financial Overview ({reportMonths} Months)</ThemedText>

                <View style={styles.summaryGrid}>
                    <View style={styles.summaryCol}>
                        <ThemedText style={styles.summaryLabel}>Total Income</ThemedText>
                        <ThemedText style={[styles.summaryValText, { color: '#10b981' }]}>PKR {summary.totalIncome}</ThemedText>
                    </View>
                    <View style={styles.summaryCol}>
                        <ThemedText style={styles.summaryLabel}>Total Expenses</ThemedText>
                        <ThemedText style={[styles.summaryValText, { color: '#ef4444' }]}>PKR {summary.totalExpense}</ThemedText>
                    </View>
                </View>

                <View style={[styles.netProfitContainer, { borderTopColor: colors.border }]}>
                    <ThemedText style={styles.summaryLabel}>Net Profit/Loss</ThemedText>
                    <ThemedText style={[styles.netProfitVal, { color: summary.netProfit >= 0 ? '#10b981' : '#ef4444' }]}>
                        PKR {summary.netProfit}
                    </ThemedText>
                </View>
            </View>

            {/* Filter / Months Selection */}
            <View style={styles.monthSelectRow}>
                <ThemedText style={styles.trendDurationHeading}>Trend Duration</ThemedText>
                <Animated.ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.monthBtnsScroll}
                    style={styles.monthScrollStyle}
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                    onContentSizeChange={(w) => setContentWidth(w)}
                    onLayout={(e) => setLayoutWidth(e.nativeEvent.layout.width)}
                >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                        <TouchableOpacity
                            key={m}
                            onPress={() => setReportMonths(m)}
                            style={[
                                styles.monthBtn,
                                {
                                    backgroundColor: reportMonths === m ? colors.primary : (isDark ? '#334155' : '#FFF'),
                                    borderColor: reportMonths === m ? colors.primary : colors.border
                                }
                            ]}
                        >
                            <ThemedText style={{ color: reportMonths === m ? '#FFF' : colors.text, fontSize: 11, fontWeight: '700' }}>
                                {m} {m === 1 ? 'Month' : 'Months'}
                            </ThemedText>
                        </TouchableOpacity>
                    ))}
                </Animated.ScrollView>
                {contentWidth > layoutWidth && (
                    <View style={[styles.scrollTrack, { backgroundColor: isDark ? '#334155' : '#e2e8f0' }]}>
                        <Animated.View
                            style={[
                                styles.scrollIndicator,
                                {
                                    backgroundColor: colors.primary,
                                },
                                animatedIndicatorStyle,
                            ]}
                        />
                    </View>
                )}
            </View>

            {/* Monthly Breakdowns */}
            <ThemedText style={styles.sectionHeader}>Monthly Breakdowns</ThemedText>
        </View>
    );
});

const ReportTab = React.memo(({
    reportData,
    reportMonths,
    setReportMonths,
    reportMonthFilter,
    setReportMonthFilter,
    loading,
    isDark,
    colors,
    onGenerateReport,
    isGeneratingReport = false
}: ReportTabProps) => {
    const [showDatePicker, setShowDatePicker] = React.useState(false);
    const [pickerYear, setPickerYear] = React.useState(moment(reportMonthFilter || undefined).year());

    const handleOpenPicker = React.useCallback(() => {
        setPickerYear(moment(reportMonthFilter || undefined).year());
        setShowDatePicker(true);
    }, [reportMonthFilter]);

    const handleMonthSelect = React.useCallback((monthVal: string) => {
        const formattedMonth = `${pickerYear}-${monthVal}`;
        setReportMonthFilter(formattedMonth);
        setShowDatePicker(false);
    }, [pickerYear, setReportMonthFilter]);

    const summary = React.useMemo(() => {
        return reportData?.summary || { totalIncome: 0, totalExpense: 0, netProfit: 0 };
    }, [reportData?.summary]);

    const details = React.useMemo(() => {
        return reportData?.monthlyDetails || [];
    }, [reportData?.monthlyDetails]);

    const handleClearFilter = React.useCallback((e: any) => {
        e.stopPropagation();
        setReportMonthFilter('');
    }, [setReportMonthFilter]);

    const renderItem = React.useCallback(({ item }: { item: any }) => (
        <MonthDetailCard item={item} isDark={isDark} colors={colors} />
    ), [isDark, colors]);

    const listHeader = React.useMemo(() => (
        <ReportTabHeader
            reportMonths={reportMonths}
            summary={summary}
            isDark={isDark}
            colors={colors}
            setReportMonths={setReportMonths}
        />
    ), [reportMonths, summary, isDark, colors, setReportMonths]);

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={{ flex: 1 }}>
            {/* Filter and Add Row */}
            <View style={styles.actionRow}>
                <TouchableOpacity
                    onPress={handleOpenPicker}
                    activeOpacity={0.7}
                    style={[styles.searchBox, { flex: 1, backgroundColor: isDark ? '#1e293b' : '#FFF', borderColor: colors.border }]}
                >
                    <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
                    <ThemedText style={[styles.searchInputText, { color: reportMonthFilter ? colors.text : colors.textSecondary }]}>
                        {reportMonthFilter ? moment(reportMonthFilter, 'YYYY-MM').format('MMMM YYYY') : 'Select Month'}
                    </ThemedText>
                    {reportMonthFilter ? (
                        <TouchableOpacity onPress={handleClearFilter}>
                            <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
                        </TouchableOpacity>
                    ) : null}
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => onGenerateReport(reportMonthFilter || moment().format('YYYY-MM'))}
                    disabled={isGeneratingReport}
                    activeOpacity={0.8}
                    style={[styles.generateBtn, { backgroundColor: colors.primary }]}
                >
                    {isGeneratingReport ? (
                        <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                        <>
                            <Ionicons name="download-outline" size={18} color="#FFF" />
                            <ThemedText style={styles.generateBtnText}>PDF</ThemedText>
                        </>
                    )}
                </TouchableOpacity>
            </View>

            <FlatList
                data={details}
                keyExtractor={(item, index) => item.month || index.toString()}
                renderItem={renderItem}
                ListHeaderComponent={listHeader}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 80 }}
            />

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
                                const isSelected = reportMonthFilter === `${pickerYear}-${m.value}`;
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

export default ReportTab;

const styles = StyleSheet.create({
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    reportSummaryCard: {
        borderRadius: 12,
        padding: 10,
        marginBottom: 12,
    },
    reportSummaryTitle: {
        fontSize: 12,
        fontWeight: '800',
        marginBottom: 8,
    },
    summaryGrid: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    summaryCol: {
        flex: 1,
    },
    summaryLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: '#64748b',
    },
    summaryValText: {
        fontSize: 14,
        fontWeight: '800',
        marginTop: 2,
    },
    netProfitContainer: {
        borderTopWidth: 1,
        paddingTop: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    netProfitVal: {
        fontSize: 14,
        fontWeight: '900',
    },
    monthSelectRow: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    trendDurationHeading: {
        fontSize: 12,
        fontWeight: '800',
    },
    monthBtnsScroll: {
        gap: 6,
        paddingHorizontal: 16,
    },
    monthScrollStyle: {
        marginHorizontal: -16,
        marginTop: 6,
    },
    monthBtn: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollTrack: {
        height: 3,
        width: 40,
        borderRadius: 1.5,
        alignSelf: 'center',
        marginTop: 6,
        overflow: 'hidden',
    },
    scrollIndicator: {
        height: 3,
        width: 15,
        borderRadius: 1.5,
    },
    sectionHeader: {
        fontSize: 15,
        fontWeight: '800',
        marginBottom: 12,
    },
    reportRowCard: {
        borderRadius: 14,
        padding: 14,
        marginBottom: 12,
    },
    reportRowHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    reportRowMonth: {
        fontSize: 14,
        fontWeight: '800',
    },
    netBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    reportRowDetail: {
        flexDirection: 'row',
        gap: 16,
    },
    reportDetailItem: {
        flex: 1,
    },
    reportItemLabel: {
        fontSize: 11,
    },
    reportItemVal: {
        fontSize: 13,
        fontWeight: '700',
        marginTop: 2,
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 2,
        borderRadius: 10,
        paddingHorizontal: 12,
        height: 38,
    },
    searchInputText: {
        flex: 1,
        marginLeft: 6,
        fontSize: 12,
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
        fontSize: 18,
        fontWeight: '700',
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
    generateBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10,
        paddingHorizontal: 12,
        height: 38,
        gap: 6,
    },
    generateBtnText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '700',
    },
});
