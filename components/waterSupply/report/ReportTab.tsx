import React from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator
} from 'react-native';
import { ThemedText } from '@/components/themedText';

interface ReportTabProps {
    reportData: any;
    reportMonths: number;
    setReportMonths: (months: number) => void;
    loading: boolean;
    isDark: boolean;
    colors: any;
}

const ReportTab = React.memo(({
    reportData,
    reportMonths,
    setReportMonths,
    loading,
    isDark,
    colors
}: ReportTabProps) => {
    const [scrollPercent, setScrollPercent] = React.useState(0);
    const [contentWidth, setContentWidth] = React.useState(1);
    const [layoutWidth, setLayoutWidth] = React.useState(1);

    const summary = React.useMemo(() => {
        return reportData?.summary || { totalIncome: 0, totalExpense: 0, netProfit: 0 };
    }, [reportData?.summary]);

    const details = React.useMemo(() => {
        return reportData?.monthlyDetails || [];
    }, [reportData?.monthlyDetails]);

    const handleScroll = React.useCallback((event: any) => {
        const x = event.nativeEvent.contentOffset.x;
        const maxScroll = contentWidth - layoutWidth;
        if (maxScroll > 0) {
            setScrollPercent(Math.min(Math.max(x / maxScroll, 0), 1));
        }
    }, [contentWidth, layoutWidth]);

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>
            {/* Financial Summary Card */}
            <View style={[styles.reportSummaryCard, { backgroundColor: isDark ? '#1e293b' : '#FFF', borderColor: colors.border }]}>
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
                <ScrollView
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
                </ScrollView>
                {contentWidth > layoutWidth && (
                    <View style={[styles.scrollTrack, { backgroundColor: isDark ? '#334155' : '#e2e8f0' }]}>
                        <View
                            style={[
                                styles.scrollIndicator,
                                {
                                    backgroundColor: colors.primary,
                                    transform: [{ translateX: scrollPercent * 25 }]
                                }
                            ]}
                        />
                    </View>
                )}
            </View>

            {/* Monthly Breakdowns */}
            <ThemedText style={styles.sectionHeader}>Monthly Breakdowns</ThemedText>
            {details.map((dt: any, i: number) => {
                const isProfit = (dt.net || 0) >= 0;
                return (
                    <View key={i} style={[styles.reportRowCard, { backgroundColor: isDark ? '#1e293b' : '#FFF', borderColor: colors.border }]}>
                        <View style={styles.reportRowHeader}>
                            <ThemedText style={styles.reportRowMonth}>{dt.month}</ThemedText>
                            <View style={[styles.netBadge, { backgroundColor: (isProfit ? '#10b981' : '#ef4444') + '20' }]}>
                                <ThemedText style={{ color: isProfit ? '#10b981' : '#ef4444', fontWeight: '700', fontSize: 11 }}>
                                    Net: PKR {dt.net}
                                </ThemedText>
                            </View>
                        </View>

                        <View style={styles.reportRowDetail}>
                            <View style={styles.reportDetailItem}>
                                <ThemedText style={styles.reportItemLabel}>Income</ThemedText>
                                <ThemedText style={[styles.reportItemVal, { color: '#10b981' }]}>+PKR {dt.income || 0}</ThemedText>
                            </View>
                            <View style={styles.reportDetailItem}>
                                <ThemedText style={styles.reportItemLabel}>Expense</ThemedText>
                                <ThemedText style={[styles.reportItemVal, { color: '#ef4444' }]}>-PKR {dt.expense || 0}</ThemedText>
                            </View>
                        </View>
                    </View>
                );
            })}
        </ScrollView>
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
        borderWidth: 2,
        padding: 10,
        marginBottom: 12,
    },
    reportSummaryTitle: {
        fontSize: 12,
        fontWeight: '700',
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
        fontWeight: '700',
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
        borderWidth: 2,
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
        fontWeight: '700',
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
});
