import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Modal, TextInput, Alert, Platform } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ActionMenu, ActionMenuItem } from '@/components/common/ActionMenu';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { getUserReports, updateReport, deleteReport, ReportPayload } from '@/apis/report';
import Toast from 'react-native-toast-message';
import { LoaderOverlay } from '@/components/common/LoaderOverlay';
import dayjs from '@/utils/dayjs';

export default function ReportsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();
    const colors = Colors[theme];
    const queryClient = useQueryClient();

    const [editModalVisible, setEditModalVisible] = useState(false);
    const [selectedReport, setSelectedReport] = useState<any>(null);
    const [editReason, setEditReason] = useState('');
    const [editDescription, setEditDescription] = useState('');

    const { data: reportsResponse, isLoading, refetch, isRefetching } = useQuery({
        queryKey: ['my-reports'],
        queryFn: getUserReports
    });

    const reports = reportsResponse?.data || [];

    const deleteMutation = useMutation({
        mutationFn: deleteReport,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-reports'] });
            Toast.show({ type: 'success', text1: 'Deleted', text2: 'Report deleted successfully' });
        },
        onError: (error: any) => {
            Toast.show({ type: 'error', text1: 'Error', text2: error.response?.data?.message || 'Failed to delete report' });
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string, data: Partial<ReportPayload> }) => updateReport(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-reports'] });
            setEditModalVisible(false);
            Toast.show({ type: 'success', text1: 'Updated', text2: 'Report updated successfully' });
        },
        onError: (error: any) => {
            Toast.show({ type: 'error', text1: 'Error', text2: error.response?.data?.message || 'Failed to update report' });
        }
    });

    const handleEdit = (report: any) => {
        setSelectedReport(report);
        setEditReason(report.reason);
        setEditDescription(report.description || '');
        setEditModalVisible(true);
    };

    const handleDelete = (id: string) => {
        Alert.alert(
            "Delete Report",
            "Are you sure you want to delete this report?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: () => deleteMutation.mutate(id) }
            ]
        );
    };

    const handleSaveEdit = () => {
        if (!selectedReport) return;
        updateMutation.mutate({
            id: selectedReport._id,
            data: { reason: editReason, description: editDescription }
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return '#F59E0B';
            case 'REVIEWED': return '#3B82F6';
            case 'RESOLVED': return '#10B981';
            default: return '#64748B';
        }
    };

    const getTargetLabel = (type: string) => {
        switch (type) {
            case 'BUSINESS': return 'Business';
            case 'MARKETPLACE': return 'Marketplace Listing';
            case 'PLACE': return 'Place';
            default: return type;
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <Animated.View entering={FadeInUp.duration(600)} style={[styles.headerWrap, { backgroundColor: colors.primary }]}>
                <View style={[styles.headerTopRow, { paddingTop: insets.top + 8 }]}>
                    <TouchableOpacity
                        onPress={() => {
                            if (router.canGoBack()) router.back();
                            else router.replace('/settings');
                        }}
                        style={styles.backBtn}
                    >
                        <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
                    </TouchableOpacity>
                    <View style={styles.headerTitleWrap}>
                        <ThemedText style={styles.headerTitle}>My Reports</ThemedText>
                    </View>
                    <View style={{ width: 42 }} />
                </View>
                <View style={styles.headerSubtitleWrap}>
                    <ThemedText style={styles.headerSubtitle}>Monitor and manage your submissions</ThemedText>
                </View>
            </Animated.View>

            {/* Content */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
            >
                {isLoading ? (
                    <View style={styles.loaderWrap}>
                        <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                ) : reports.length === 0 ? (
                    <Animated.View entering={FadeIn.delay(300)} style={styles.emptyWrap}>
                        <Ionicons name="document-text-outline" size={64} color={theme === 'dark' ? 'rgba(255,255,255,0.1)' : '#CBD5E1'} />
                        <ThemedText style={[styles.emptyTitle, { color: colors.textSecondary }]}>No reports found</ThemedText>
                        <ThemedText style={[styles.emptySubtitle, { color: colors.icon }]}>Your submitted reports will appear here.</ThemedText>
                    </Animated.View>
                ) : (
                    reports.map((report: any, index: number) => {
                        const actions: ActionMenuItem[] = [];
                        if (report.status === 'PENDING') {
                            actions.push({
                                label: 'Edit',
                                icon: 'create-outline',
                                onPress: () => handleEdit(report)
                            });
                            actions.push({
                                label: 'Delete',
                                icon: 'trash-outline',
                                destructive: true,
                                onPress: () => handleDelete(report._id)
                            });
                        }

                        return (
                            <Animated.View key={report._id} entering={FadeInDown.delay(100 * index).duration(500)} style={[styles.reportCard, { backgroundColor: colors.card }]}>
                                <View style={styles.cardHeader}>
                                    <View style={[styles.targetBadge, { backgroundColor: colors.primary + '15' }]}>
                                        <ThemedText style={[styles.targetText, { color: colors.primary }]}>
                                            {getTargetLabel(report.targetType)}
                                        </ThemedText>
                                    </View>
                                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(report.status) + '20' }]}>
                                        <View style={[styles.statusDot, { backgroundColor: getStatusColor(report.status) }]} />
                                        <ThemedText style={[styles.statusText, { color: getStatusColor(report.status) }]}>
                                            {report.status}
                                        </ThemedText>
                                    </View>
                                </View>

                                <ThemedText style={[styles.reasonText, { color: colors.text }]}>{report.reason}</ThemedText>
                                {report.description && (
                                    <ThemedText style={[styles.descriptionText, { color: colors.textSecondary }]} numberOfLines={3}>
                                        {report.description}
                                    </ThemedText>
                                )}

                                <View style={[styles.cardFooter, { borderTopWidth: 1, borderTopColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#F1F5F9' }]}>
                                    <ThemedText style={[styles.dateText, { color: colors.icon }]}>
                                        {dayjs(report.createdAt).format('MMM DD, YYYY • hh:mm A')}
                                    </ThemedText>
                                    {actions.length > 0 && (
                                        <View style={{ position: 'relative' }}>
                                            <View style={styles.moreBtn}>
                                                <ActionMenu actions={actions} triggerIcon="ellipsis-vertical" />
                                            </View>
                                        </View>
                                    )}
                                </View>
                            </Animated.View>
                        );
                    })
                )}
            </ScrollView>

            {/* Edit Modal */}
            <Modal visible={editModalVisible} transparent animationType="slide">
                <View style={[styles.modalOverlay, { backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)' }]}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                        <View style={styles.modalHeader}>
                            <ThemedText style={[styles.modalTitle, { color: colors.text }]}>Edit Report</ThemedText>
                            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                                <Ionicons name="close" size={24} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <ThemedText style={[styles.inputLabel, { color: colors.textSecondary }]}>Reason</ThemedText>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.03)' : '#F1F5F9', color: colors.text }]}
                            value={editReason}
                            onChangeText={setEditReason}
                        />

                        <ThemedText style={[styles.inputLabel, { color: colors.textSecondary }]}>Additional Details</ThemedText>
                        <TextInput
                            style={[styles.input, styles.textArea, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.03)' : '#F1F5F9', color: colors.text }]}
                            value={editDescription}
                            onChangeText={setEditDescription}
                            multiline
                            textAlignVertical="top"
                        />

                        <TouchableOpacity 
                            style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                            onPress={handleSaveEdit}
                            disabled={updateMutation.isPending}
                        >
                            {updateMutation.isPending ? (
                                <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                                <ThemedText style={styles.saveBtnText}>Save Changes</ThemedText>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
            <LoaderOverlay
                visible={deleteMutation.isPending || updateMutation.isPending}
                text={deleteMutation.isPending ? 'Deleting report...' : 'Updating report...'}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    headerWrap: {
        paddingBottom: 20,
        borderBottomLeftRadius: Layout.headerBorderRadius,
        borderBottomRightRadius: Layout.headerBorderRadius,
        zIndex: 2 },
    headerTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16 },
    backBtn: {
        width: 42,
        height: 42,
        borderRadius: Layout.borderRadius,
        backgroundColor: 'rgba(255,255,255,0.18)',
        justifyContent: 'center',
        alignItems: 'center' },
    headerTitleWrap: { flex: 1, alignItems: 'center' },
    headerTitle: {
        fontSize: 16.5,
        fontWeight: '800',
        color: '#FFFFFF'
    },
    headerSubtitleWrap: { alignItems: 'center', marginTop: 12 },
    headerSubtitle: { fontSize: 12.5, color: '#FFFFFF', opacity: 0.9 },
    scrollView: { flex: 1, marginTop: -20 },
    scrollContent: { paddingHorizontal: 13, paddingTop: 36 },
    loaderWrap: { padding: 36, alignItems: 'center' },
    emptyWrap: { padding: 56, alignItems: 'center', justifyContent: 'center' },
    emptyTitle: { fontSize: 15.5, fontWeight: '700', marginTop: 16 },
    emptySubtitle: { fontSize: 12.5, marginTop: 8, textAlign: 'center' },
    reportCard: {
        borderRadius: Layout.borderRadius,
        padding: 13,
        marginBottom: 16 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    targetBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: Layout.borderRadius },
    targetText: { fontSize: 10.5, fontWeight: '700' },
    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: Layout.borderRadius },
    statusDot: { width: 6, height: 6, borderRadius: Layout.borderRadius, marginRight: 6 },
    statusText: { fontSize: 10, fontWeight: '700' },
    reasonText: { fontSize: 13.5, fontWeight: '700', marginBottom: 8 },
    descriptionText: { fontSize: 12.5, lineHeight: 20, marginBottom: 12 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10 },
    dateText: { fontSize: 10.5 },
    moreBtn: {
        padding: 4,
        borderRadius: Layout.borderRadius,
        justifyContent: 'center',
        alignItems: 'center' },
    menuPopover: {
        width: 160,
        borderRadius: Layout.borderRadius,
        paddingHorizontal: 5,
        paddingVertical: 5 },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 7,
        paddingHorizontal: 7,
        borderRadius: Layout.borderRadius,
        gap: 10 },
    menuIconBox: {
        width: 28,
        height: 28,
        borderRadius: Layout.borderRadius,
        justifyContent: 'center',
        alignItems: 'center' },
    menuItemText: {
        fontSize: 12.5,
        fontWeight: '600' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 16 },
    modalContent: { borderRadius: Layout.borderRadius, padding: 20 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 16.5, fontWeight: '700' },
    inputLabel: { fontSize: 12.5, fontWeight: '600', marginBottom: 8, marginTop: 16 },
    input: { borderRadius: Layout.borderRadius, padding: 10, fontSize: 12.5 },
    textArea: { height: 100 },
    saveBtn: { height: 50, borderRadius: Layout.borderRadius, justifyContent: 'center', alignItems: 'center', marginTop: 24 },
    saveBtnText: { color: '#FFFFFF', fontSize: 13.5, fontWeight: '700' }
});
