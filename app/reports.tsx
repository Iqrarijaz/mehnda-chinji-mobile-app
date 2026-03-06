import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Modal, TextInput, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { ThemedText } from '@/components/themedText';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/colors';
import { getUserReports, updateReport, deleteReport, ReportPayload } from '@/apis/report';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { format } from 'date-fns';

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

    const reports = reportsResponse?.data?.data || [];

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
            case 'DONOR': return 'Donor';
            case 'PLACE': return 'Place';
            default: return type;
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: '#F8FAFC' }]}>
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
                        <Ionicons name="document-text-outline" size={64} color="#CBD5E1" />
                        <ThemedText style={styles.emptyTitle}>No reports found</ThemedText>
                        <ThemedText style={styles.emptySubtitle}>Your submitted reports will appear here.</ThemedText>
                    </Animated.View>
                ) : (
                    reports.map((report: any, index: number) => (
                        <Animated.View key={report._id} entering={FadeInDown.delay(100 * index).duration(500)} style={styles.reportCard}>
                            <View style={styles.cardHeader}>
                                <View style={[styles.targetBadge, { backgroundColor: colors.primary + '10' }]}>
                                    <ThemedText style={[styles.targetText, { color: colors.primary }]}>
                                        {getTargetLabel(report.targetType)}
                                    </ThemedText>
                                </View>
                                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(report.status) + '15' }]}>
                                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(report.status) }]} />
                                    <ThemedText style={[styles.statusText, { color: getStatusColor(report.status) }]}>
                                        {report.status}
                                    </ThemedText>
                                </View>
                            </View>

                            <ThemedText style={styles.reasonText}>{report.reason}</ThemedText>
                            {report.description && (
                                <ThemedText style={styles.descriptionText} numberOfLines={3}>
                                    {report.description}
                                </ThemedText>
                            )}

                            <View style={styles.cardFooter}>
                                <ThemedText style={styles.dateText}>
                                    {format(new Date(report.createdAt), 'MMM dd, yyyy • hh:mm a')}
                                </ThemedText>
                                {report.status === 'PENDING' && (
                                    <View style={styles.actionRow}>
                                        <TouchableOpacity onPress={() => handleEdit(report)} style={styles.iconBtn}>
                                            <Ionicons name="create-outline" size={18} color="#64748B" />
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => handleDelete(report._id)} style={styles.iconBtn}>
                                            <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        </Animated.View>
                    ))
                )}
            </ScrollView>

            {/* Edit Modal */}
            <Modal visible={editModalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <ThemedText style={styles.modalTitle}>Edit Report</ThemedText>
                            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        <ThemedText style={styles.inputLabel}>Reason</ThemedText>
                        <TextInput
                            style={styles.input}
                            value={editReason}
                            onChangeText={setEditReason}
                            placeholder="Enter reason"
                            placeholderTextColor="#94A3B8"
                        />

                        <ThemedText style={styles.inputLabel}>Additional Details</ThemedText>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={editDescription}
                            onChangeText={setEditDescription}
                            placeholder="Enter description"
                            placeholderTextColor="#94A3B8"
                            multiline
                            numberOfLines={4}
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
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    headerWrap: {
        paddingBottom: 24,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        zIndex: 2,
    },
    headerTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    backBtn: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: 'rgba(255,255,255,0.18)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitleWrap: { flex: 1, alignItems: 'center' },
    headerTitle: {
        fontSize: Platform.OS === 'android' ? 19 : 21,
        fontWeight: '700',
        color: '#FFFFFF'
    },
    headerSubtitleWrap: { alignItems: 'center', marginTop: 12 },
    headerSubtitle: { fontSize: 14, color: '#FFFFFF', opacity: 0.9 },
    scrollView: { flex: 1, marginTop: -20 },
    scrollContent: { paddingHorizontal: 16, paddingTop: 40 },
    loaderWrap: { padding: 40, alignItems: 'center' },
    emptyWrap: { padding: 60, alignItems: 'center', justifyContent: 'center' },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: '#64748B', marginTop: 16 },
    emptySubtitle: { fontSize: 14, color: '#94A3B8', marginTop: 8, textAlign: 'center' },
    reportCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    targetBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    targetText: { fontSize: 12, fontWeight: '700' },
    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
    statusText: { fontSize: 11, fontWeight: '700' },
    reasonText: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 8 },
    descriptionText: { fontSize: 14, color: '#64748B', lineHeight: 20, marginBottom: 12 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 12 },
    dateText: { fontSize: 12, color: '#94A3B8' },
    actionRow: { flexDirection: 'row', gap: 12 },
    iconBtn: { padding: 4 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: '700' },
    inputLabel: { fontSize: 14, fontWeight: '600', color: '#64748B', marginBottom: 8, marginTop: 16 },
    input: { backgroundColor: '#F1F5F9', borderRadius: 12, padding: 12, fontSize: 15, color: '#0F172A' },
    textArea: { height: 100 },
    saveBtn: { height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 24 },
    saveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' }
});
