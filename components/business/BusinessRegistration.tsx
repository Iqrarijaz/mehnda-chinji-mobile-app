import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
    RefreshControl,
} from 'react-native';
import Toast from 'react-native-toast-message';

import {
    BUSINESS_QUERY_KEYS,
    deleteBusiness,
    getBusinessStatus,
    manageBusinessSearch
} from '@/apis/business';
import { ThemedText } from '@/components/ThemedText';
import { AnalyticsEvents, analyticsService } from '@/analytics';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Layout } from '@/constants/layout';
import { CleanConfirmationModal } from '../common/CleanConfirmationModal';
import MyRegisteredBusinessCard from './myRegisteredBusinessCard';


const BusinessRegistration = React.memo(() => {
    const { user } = useAuth();
    const { theme } = useTheme();
    const colors = Colors[theme];
    const queryClient = useQueryClient();
    const router = useRouter();

    // UI State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [businessToDelete, setBusinessToDelete] = useState<string | null>(null);
    const [showVisibilityModal, setShowVisibilityModal] = useState(false);
    const [visibilityTarget, setVisibilityTarget] = useState<{ id: string; name: string; nextValue: boolean } | null>(null);

    // Queries
    const { data: statusRes, isLoading: loading, refetch, isRefetching } = useQuery({
        queryKey: BUSINESS_QUERY_KEYS.myBusiness(),
        queryFn: getBusinessStatus,
    });

    const businesses = statusRes?.data || [];

    // Mutations
    const deleteMutation = useMutation({
        mutationFn: deleteBusiness,
        onSuccess: (res: any) => {
            if (res.success) {
                queryClient.invalidateQueries({ queryKey: BUSINESS_QUERY_KEYS.all });
                setShowDeleteModal(false);
                setBusinessToDelete(null);
                Toast.show({
                    type: 'success',
                    text1: 'Deleted',
                    text2: 'Business registration removed.',
                });
            }
        },
    });

    const manageSearchMutation = useMutation({
        mutationFn: ({ businessId, search }: { businessId: string; search: boolean }) =>
            manageBusinessSearch(businessId, search),
        onSuccess: (res: any) => {
            if (res.success) {
                queryClient.invalidateQueries({ queryKey: BUSINESS_QUERY_KEYS.all });
                setShowVisibilityModal(false);
                setVisibilityTarget(null);
                Toast.show({
                    type: 'success',
                    text1: 'Status Updated',
                    text2: 'Business visibility updated.',
                });
            }
        },
    });

    const isDeleting = deleteMutation.isPending;

    const confirmDelete = () => {
        if (businessToDelete) {
            deleteMutation.mutate(businessToDelete);
        }
    };

    if (loading && businesses.length === 0) {
        return (
            <View style={[styles.container, styles.centerContent]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    const handleAddBusiness = () => {
        analyticsService.trackEvent(AnalyticsEvents.BUSINESS_REGISTRATION_CLICKED);
        router.push('/business-registration');
    };

    const handleEditBusiness = (biz: any) => {
        router.push({
            pathname: '/business-registration',
            params: { editData: JSON.stringify(biz) }
        });
    };

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefetching}
                        onRefresh={refetch}
                        colors={[colors.primary]}
                        tintColor={colors.primary}
                    />
                }
            >
                {/* Header with Add Button */}
                <View style={styles.headerRow}>
                    <View style={styles.headerBox}>
                        <ThemedText style={[styles.headerTitle, { color: colors.text }]}>My Businesses</ThemedText>
                        <ThemedText style={[styles.headerSubtitle, { color: colors.icon }]}>Manage your professional registrations</ThemedText>
                    </View>
                    <TouchableOpacity
                        style={[
                            styles.addButton,
                            { backgroundColor: colors.primary },
                            businesses.length >= 3 && [styles.disabledButton, { backgroundColor: colors.icon }]
                        ]}
                        onPress={handleAddBusiness}
                        disabled={businesses.length >= 3}
                    >
                        <Ionicons name="add" size={20} color="#FFF" />
                    </TouchableOpacity>
                </View>

                {businesses.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="business-outline" size={64} color={colors.icon} style={{ opacity: 0.5 }} />
                        <ThemedText style={[styles.emptyStateText, { color: colors.icon }]}>No businesses registered yet.</ThemedText>
                        <TouchableOpacity
                            style={[styles.emptyStateBtn, { backgroundColor: colors.primary }]}
                            onPress={handleAddBusiness}
                        >
                            <ThemedText style={{ color: '#FFF', fontWeight: 'bold' }}>Register Your Business</ThemedText>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.listContainer}>
                        {businesses.map((biz: any) => (
                            <MyRegisteredBusinessCard
                                key={biz._id}
                                business={biz}
                                onEdit={handleEditBusiness}
                                onDelete={(id) => {
                                    setBusinessToDelete(id);
                                    setShowDeleteModal(true);
                                }}
                                onToggleSearch={(id, name, nextValue) => {
                                    setVisibilityTarget({ id, name, nextValue });
                                    setShowVisibilityModal(true);
                                }}
                                isDeleting={isDeleting}
                                isManageSearchPending={manageSearchMutation.isPending}
                            />
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
            <CleanConfirmationModal
                visible={showVisibilityModal}
                onClose={() => setShowVisibilityModal(false)}
                onConfirm={() => {
                    if (visibilityTarget) {
                        manageSearchMutation.mutate({
                            businessId: visibilityTarget.id,
                            search: visibilityTarget.nextValue
                        });
                    }
                }}
                title={visibilityTarget?.nextValue ? "Show in Directory?" : "Hide from Directory?"}
                message={`Are you sure you want to ${visibilityTarget?.nextValue ? "show" : "hide"} "${visibilityTarget?.name}" in the public directory?`}
                confirmText={visibilityTarget?.nextValue ? "Show" : "Hide"}
                cancelText="Cancel"
                type={visibilityTarget?.nextValue ? "success" : "warning"}
                isLoading={manageSearchMutation.isPending}
            />
        </View>
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
        fontSize: 18,
        fontWeight: '800',
        paddingBottom: 2,
        letterSpacing: -0.3,
    },
    headerSubtitle: {
        fontSize: 12,
        fontWeight: '500',
        marginTop: 2,
    },
    addButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    disabledButton: {
        opacity: 0.7,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 60,
        gap: 12,
    },
    emptyStateText: {
        fontSize: 12,
        fontWeight: '500',
    },
    emptyStateBtn: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: Layout.borderRadius,
        marginTop: 10,
    },
    listContainer: {
        marginTop: 10,
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
