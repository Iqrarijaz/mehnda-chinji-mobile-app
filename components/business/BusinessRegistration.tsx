import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import Toast from 'react-native-toast-message';

import {
    BUSINESS_QUERY_KEYS,
    DELETE_BUSINESS,
    GET_BUSINESS_STATUS
} from '@/apis/business';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { CleanConfirmationModal } from '../common/CleanConfirmationModal';
import BusinessRegistrationModal from './BusinessRegistrationModal';

const BusinessRegistration = React.memo(() => {
    const { user } = useAuth();
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];
    const queryClient = useQueryClient();
    const { data: businesses = [], isLoading: isBusinessLoading } = useQuery({
        queryKey: BUSINESS_QUERY_KEYS.myBusiness(),
        queryFn: async () => {
            const res = await GET_BUSINESS_STATUS();
            if (res.success) return res.data;
            return [];
        },
    });
    const loading = isBusinessLoading;

    // UI State
    const [modalVisible, setModalVisible] = useState(false);
    const [editData, setEditData] = useState<any>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [businessToDelete, setBusinessToDelete] = useState<string | null>(null);

    const deleteMutation = useMutation({
        mutationFn: DELETE_BUSINESS,
        onSuccess: (res) => {
            if (res.success) {
                queryClient.invalidateQueries({ queryKey: BUSINESS_QUERY_KEYS.myBusiness() });
                setShowDeleteModal(false);
                setBusinessToDelete(null);
                Toast.show({
                    type: 'success',
                    text1: 'Deleted',
                    text2: 'Business removed successfully.',
                });
            }
        },
    });

    const isDeleting = deleteMutation.isPending;

    const pendingCount = businesses.filter((b: any) => b.status === 'PENDING').length;
    const canRegister = pendingCount < 3;

    const confirmDelete = async () => {
        if (!businessToDelete) return;
        deleteMutation.mutate(businessToDelete);
    };

    if (loading && businesses.length === 0) {
        return (
            <View style={[styles.container, styles.centerContent]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <BusinessRegistrationModal
                visible={modalVisible}
                onClose={() => {
                    setModalVisible(false);
                    setEditData(null);
                }}
                onSuccess={() => { }}
                editData={editData}
            />

            <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
                {/* Header with Add Button */}
                <View style={styles.headerRow}>
                    <View style={styles.headerBox}>
                        <ThemedText style={[styles.headerTitle, { color: colors.text }]}>My Businesses</ThemedText>
                        <ThemedText style={[styles.headerSubtitle, { color: colors.icon }]}>Manage your directory listings</ThemedText>
                    </View>
                    <TouchableOpacity
                        style={[styles.addButton, !canRegister && styles.disabledButton]}
                        onPress={() => {
                            if (canRegister) {
                                setEditData(null);
                                setModalVisible(true);
                            }
                            else Toast.show({
                                type: 'info',
                                text1: 'Limit Reached',
                                text2: 'You can have max 3 pending requests.',
                            });
                        }}
                        disabled={!canRegister}
                    >
                        <Ionicons name="add" size={24} color="#FFF" />
                    </TouchableOpacity>
                </View>

                {/* My Businesses List */}
                {businesses.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="business-outline" size={64} color={colors.icon} style={{ opacity: 0.5 }} />
                        <ThemedText style={[styles.emptyStateText, { color: colors.icon }]}>
                            No businesses registered yet.
                        </ThemedText>
                        <TouchableOpacity
                            style={[styles.emptyStateBtn, { backgroundColor: colors.primary }]}
                            onPress={() => {
                                setEditData(null);
                                setModalVisible(true);
                            }}
                        >
                            <ThemedText style={{ color: '#FFF', fontWeight: 'bold' }}>Register Now</ThemedText>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.listContainer}>
                        {businesses.map((biz: any) => (
                            <View key={biz._id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                <View style={styles.cardHeader}>
                                    <View style={styles.nameStatusRow}>
                                        <ThemedText style={[styles.bizName, { color: colors.text }]}>{biz.name}</ThemedText>
                                        <View style={[
                                            styles.statusBadge,
                                            { backgroundColor: biz.status === 'APPROVED' ? '#DCFCE7' : biz.status === 'REJECTED' ? '#FEE2E2' : '#FEF3C7' }
                                        ]}>
                                            <View style={[
                                                styles.statusDot,
                                                { backgroundColor: biz.status === 'APPROVED' ? '#16A34A' : biz.status === 'REJECTED' ? '#DC2626' : '#D97706' }
                                            ]} />
                                            <ThemedText style={[
                                                styles.statusText,
                                                { color: biz.status === 'APPROVED' ? '#166534' : biz.status === 'REJECTED' ? '#991B1B' : '#92400E' }
                                            ]}>
                                                {biz.status}
                                            </ThemedText>
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.cardBody}>
                                    <View style={styles.categoryRow}>
                                        <View style={styles.catLeft}>
                                            <Ionicons name="briefcase-outline" size={14} color={colors.icon} />
                                            <ThemedText style={[styles.bizCategory, { color: colors.icon, textTransform: 'capitalize' }]}>{biz.categoryEn || biz.category?.en}</ThemedText>
                                        </View>
                                        <ThemedText style={[styles.bizCategory, styles.urduCat, { color: colors.icon }]}>{biz.categoryUr || biz.category?.ur}</ThemedText>
                                    </View>

                                    {biz.description && (
                                        <View style={styles.descriptionRow}>
                                            <Ionicons name="information-circle-outline" size={14} color={colors.icon} />
                                            <ThemedText style={[styles.descriptionText, { color: colors.icon }]} numberOfLines={2}>
                                                {biz.description}
                                            </ThemedText>
                                        </View>
                                    )}

                                    <View style={styles.bizInfoRow}>
                                        <Ionicons name="location" size={14} color={colors.icon} />
                                        <ThemedText style={[styles.bizInfoText, { color: colors.icon, textTransform: 'capitalize' }]} numberOfLines={1}>
                                            {(biz.address || biz.village || 'N/A').toLowerCase()}
                                        </ThemedText>
                                    </View>
                                </View>

                                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                                <View style={styles.cardFooter}>
                                    <View style={styles.dateContainer}>
                                        <Ionicons name="time-outline" size={14} color={colors.icon} />
                                        <ThemedText style={[styles.dateText, { color: colors.icon }]}>
                                            {new Date(biz.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}  {new Date(biz.createdAt).toLocaleDateString()}
                                        </ThemedText>
                                    </View>

                                    {(biz.status === 'PENDING' || biz.status === 'REJECTED') && (
                                        <View style={styles.actionButtons}>
                                            <TouchableOpacity
                                                style={[styles.actionBtn, { backgroundColor: '#DBEAFE' }]}
                                                onPress={() => {
                                                    setEditData(biz);
                                                    setModalVisible(true);
                                                }}
                                                disabled={isDeleting}
                                            >
                                                <Ionicons name="create-outline" size={16} color="#2563EB" />
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[styles.actionBtn, { backgroundColor: '#FEE2E2' }]}
                                                onPress={() => {
                                                    setBusinessToDelete(biz._id);
                                                    setShowDeleteModal(true);
                                                }}
                                                disabled={isDeleting}
                                            >
                                                <Ionicons name="trash-outline" size={16} color="#EF4444" />
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </View>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>

            <CleanConfirmationModal
                visible={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={confirmDelete}
                title="Delete Registration?"
                message="Are you sure you want to delete this business registration? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                type="danger"
                isLoading={isDeleting}
            />
        </View >
    );
});

export { BusinessRegistration };

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 100,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    headerBox: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '800',
        paddingBottom: 2,
        letterSpacing: -0.5,
        color: '#1E293B',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#64748b',
        fontWeight: '500',
        marginTop: 4,
    },
    addButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#004030',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    disabledButton: {
        backgroundColor: '#94A3B8',
        opacity: 0.7,
    },
    card: {
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        shadowColor: "#64748B",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 60,
        gap: 12,
    },
    emptyStateText: {
        fontSize: 16,
        fontWeight: '500',
    },
    emptyStateBtn: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 12,
        marginTop: 10,
    },
    listContainer: {
        marginTop: 10,
    },
    cardHeader: {
        marginBottom: 8,
    },
    nameStatusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardBody: {
        gap: 6,
        marginBottom: 12,
    },
    divider: {
        height: 1,
        width: '100%',
        marginBottom: 12,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    bizName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
        textTransform: 'capitalize',
        flex: 1,
        marginRight: 8,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        gap: 6,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    actionBtn: {
        padding: 6,
        borderRadius: 8,
    },
    categoryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    catLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    bizCategory: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
    },
    urduCat: {
        fontSize: 14,
    },
    descriptionRow: {
        flexDirection: 'row',
        gap: 6,
        paddingLeft: 2, // Slight indent to align text with icons
    },
    descriptionText: {
        fontSize: 13,
        color: '#64748B',
        fontStyle: 'italic',
        flex: 1,
        lineHeight: 18,
    },
    bizInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    bizInfoText: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '500',
        flex: 1,
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    dateText: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '500',
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
