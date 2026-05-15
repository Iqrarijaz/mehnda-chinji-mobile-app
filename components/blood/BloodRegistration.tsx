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
    DONOR_QUERY_KEYS,
    getDonorStatus,
    manageDonorStatus,
    removeAsDonor
} from '@/apis/bloodDonation';
import { ThemedText } from '@/components/themedText';
import { AnalyticsEvents, analyticsService } from '@/analytics';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Layout } from '@/constants/layout';
import { CleanConfirmationModal } from '../common/CleanConfirmationModal';
import BloodRegistrationModal from './BloodRegistrationModal';
import MyBloodDonorRegistrationCard from './MyBloodDonorRegistrationCard';



const BloodRegistration = React.memo(() => {
    const { user } = useAuth();
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];
    const queryClient = useQueryClient();

    // UI State
    const [modalVisible, setModalVisible] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showStatusConfirmModal, setShowStatusConfirmModal] = useState(false);

    // Query
    const { data: statusRes, isLoading: loading, refetch } = useQuery({
        queryKey: DONOR_QUERY_KEYS.status(),
        queryFn: getDonorStatus,
    });

    const donorData = statusRes?.data;
    const isRegistered = !!donorData;
    const isAvailable = donorData?.available ?? true;

    // Mutations
    const removeMutation = useMutation({
        mutationFn: removeAsDonor,
        onSuccess: (res: any) => {
            if (res.success) {
                queryClient.invalidateQueries({ queryKey: DONOR_QUERY_KEYS.all });
                setShowConfirmModal(false);
                Toast.show({
                    type: 'success',
                    text1: 'Success',
                    text2: 'Removed from donor list.',
                });
            }
        },
    });

    const manageStatusMutation = useMutation({
        mutationFn: manageDonorStatus,
        onSuccess: (res: any) => {
            if (res.success) {
                queryClient.invalidateQueries({ queryKey: DONOR_QUERY_KEYS.all });
                setShowStatusConfirmModal(false);
                Toast.show({
                    type: 'success',
                    text1: 'Status Updated',
                    text2: `You are now ${!isAvailable ? 'available' : 'unavailable'} for donation.`,
                });
            }
        },
    });

    const isProcessing = removeMutation.isPending || manageStatusMutation.isPending;

    const handleRegisterOpen = () => {
        analyticsService.trackEvent(AnalyticsEvents.DONOR_REGISTRATION_CLICKED);
        setModalVisible(true);
    };

    const confirmRemoveRegistration = () => {
        removeMutation.mutate();
    };

    const handleToggleAvailability = () => {
        setShowStatusConfirmModal(true);
    };

    const confirmToggleStatus = () => {
        manageStatusMutation.mutate();
    };

    if (loading && !donorData) {
        return (
            <View style={[styles.container, styles.centerContent]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <BloodRegistrationModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onSuccess={() => {
                    refetch();
                }}
            />

            <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
                {/* Header with Add Button */}
                <View style={styles.headerRow}>
                    <View style={styles.headerBox}>
                        <ThemedText style={[styles.headerTitle, { color: colors.text }]}>Blood Donor Portal</ThemedText>
                        <ThemedText style={[styles.headerSubtitle, { color: colors.icon }]}>Help save lives by donating blood</ThemedText>
                    </View>
                </View>

                {/* Donor Card or Empty State */}
                {isRegistered ? (
                    <MyBloodDonorRegistrationCard
                        user={user}
                        donorData={donorData}
                        isAvailable={isAvailable}
                        onToggleAvailability={handleToggleAvailability}
                        onDelete={() => setShowConfirmModal(true)}
                        isProcessing={isProcessing}
                    />
                ) : (
                    <View style={styles.emptyState}>
                        <Ionicons name="water-outline" size={64} color={colors.icon} style={{ opacity: 0.5 }} />
                        <ThemedText style={[styles.emptyStateText, { color: colors.icon }]}>
                            You are not registered as a donor.
                        </ThemedText>
                        <TouchableOpacity
                            style={[styles.emptyStateBtn, { backgroundColor: '#ef4444' }]}
                            onPress={handleRegisterOpen}
                        >
                            <ThemedText style={{ color: '#FFF', fontWeight: 'bold' }}>Register Now</ThemedText>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Donation Tips */}
                <View style={styles.tipsSection}>
                    <ThemedText style={[styles.tipsTitle, { color: colors.primary }]}>Donation Guidelines</ThemedText>
                    <View style={styles.tipItem}>
                        <Ionicons name="water" size={14} color={colors.primary} />
                        <ThemedText style={[styles.tipText, { color: colors.icon }]}>Stay hydrated before and after.</ThemedText>
                    </View>
                    <View style={styles.tipItem}>
                        <Ionicons name="restaurant" size={14} color={colors.primary} />
                        <ThemedText style={[styles.tipText, { color: colors.icon }]}>Eat a light, healthy meal before.</ThemedText>
                    </View>
                    <View style={styles.tipItem}>
                        <Ionicons name="moon" size={14} color={colors.primary} />
                        <ThemedText style={[styles.tipText, { color: colors.icon }]}>Get a good night's sleep before.</ThemedText>
                    </View>
                </View>
            </ScrollView>

            <CleanConfirmationModal
                visible={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                onConfirm={confirmRemoveRegistration}
                title="Unregister as Donor?"
                message="Are you sure you want to stop being a blood donor? You can always register again later."
                confirmText="Unregister"
                cancelText="Cancel"
                type="danger"
                isLoading={removeMutation.isPending}
            />

            <CleanConfirmationModal
                visible={showStatusConfirmModal}
                onClose={() => setShowStatusConfirmModal(false)}
                onConfirm={confirmToggleStatus}
                title={isAvailable ? "Go Offline?" : "Go Online?"}
                message={isAvailable
                    ? "Other users won't be able to find you in the donor list. You can change this anytime."
                    : "You will be visible to users searching for blood donors. Ready to help?"}
                confirmText={isAvailable ? "Go Offline" : "Go Online"}
                cancelText="Cancel"
                type={isAvailable ? "danger" : "info"}
                isLoading={manageStatusMutation.isPending}
            />
        </View >
    );
});

export default BloodRegistration;

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
        color: '#1E293B',
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        fontSize: 14,
        marginTop: 4,
    },
    addButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#ef4444',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    actionButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    actionBtn: {
        padding: 6,
        borderRadius: Layout.borderRadius,
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        gap: 16,
    },
    emptyStateText: {
        fontSize: 16,
        textAlign: 'center',
    },
    emptyStateBtn: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: Layout.borderRadius,
    },
    tipsSection: {
        marginTop: 20,
        paddingHorizontal: 4,
    },
    tipsTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#ef4444',
    },
    tipItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        gap: 8,
    },
    tipText: {
        fontSize: 12,
        fontWeight: '500',
    },
});
