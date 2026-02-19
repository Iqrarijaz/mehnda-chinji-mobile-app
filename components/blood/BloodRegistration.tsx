import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Switch,
    TouchableOpacity,
    View,
} from 'react-native';
import Toast from 'react-native-toast-message';

import {
    DONOR_QUERY_KEYS,
    GET_DONOR_STATUS,
    MANAGE_DONOR_STATUS,
    REMOVE_AS_DONOR
} from '@/apis/bloodDonation';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { CleanConfirmationModal } from '../common/CleanConfirmationModal';
import BloodRegistrationModal from './BloodRegistrationModal';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const BloodRegistration = React.memo(() => {
    const { user } = useAuth();
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];
    const queryClient = useQueryClient();

    const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
    const [selectedCity, setSelectedCity] = useState<string>(user?.user?.city || '');
    const [address, setAddress] = useState<string>(user?.user?.address || user?.user?.village || '');
    const [lastDonationDate, setLastDonationDate] = useState<Date | null>(null);

    // UI State
    const [modalVisible, setModalVisible] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [cityModalVisible, setCityModalVisible] = useState(false);
    const [groupModalVisible, setGroupModalVisible] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showStatusConfirmModal, setShowStatusConfirmModal] = useState(false);

    // Query
    const { data: statusRes, isLoading: loading, refetch } = useQuery({
        queryKey: DONOR_QUERY_KEYS.status(),
        queryFn: GET_DONOR_STATUS,
    });

    const donorData = statusRes?.data;
    const isRegistered = !!donorData;
    const isAvailable = donorData?.available ?? true;

    // Mutations
    const removeMutation = useMutation({
        mutationFn: REMOVE_AS_DONOR,
        onSuccess: (res) => {
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
        mutationFn: MANAGE_DONOR_STATUS,
        onSuccess: (res) => {
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
                <ActivityIndicator size="large" color="#ef4444" />
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
                    {!isRegistered && (
                        <TouchableOpacity
                            style={[styles.addButton]}
                            onPress={handleRegisterOpen}
                        >
                            <Ionicons name="add" size={24} color="#FFF" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Donor Card or Empty State */}
                {isRegistered ? (
                    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <View style={styles.cardHeader}>
                            <View style={styles.nameStatusRow}>
                                <ThemedText style={[styles.bizName, { color: colors.text }]}>{user?.user?.name || "My Donor Profile"}</ThemedText>
                                <View style={[
                                    styles.statusBadge,
                                    { backgroundColor: isAvailable ? '#DCFCE7' : '#FEE2E2' }
                                ]}>
                                    <View style={[
                                        styles.statusDot,
                                        { backgroundColor: isAvailable ? '#16A34A' : '#DC2626' }
                                    ]} />
                                    <ThemedText style={[
                                        styles.statusText,
                                        { color: isAvailable ? '#166534' : '#991B1B' }
                                    ]}>
                                        {isAvailable ? 'ONLINE' : 'OFFLINE'}
                                    </ThemedText>
                                </View>
                            </View>
                        </View>

                        <View style={styles.cardBody}>
                            <View style={styles.categoryRow}>
                                <View style={styles.catLeft}>
                                    <Ionicons name="water" size={14} color="#EF4444" />
                                    <ThemedText style={[styles.bizCategory, { color: '#EF4444' }]}>{donorData.bloodGroup}</ThemedText>
                                </View>
                            </View>

                            <View style={styles.bizInfoRow}>
                                <Ionicons name="location" size={14} color={colors.icon} />
                                <ThemedText style={[styles.bizInfoText, { color: colors.icon, textTransform: 'capitalize' }]} numberOfLines={1}>
                                    {(donorData.address || donorData.village || 'N/A').toLowerCase()}
                                </ThemedText>
                            </View>
                        </View>

                        <View style={[styles.divider, { backgroundColor: colors.border }]} />

                        <View style={styles.cardFooter}>
                            <View style={styles.dateContainer}>
                                <Ionicons name="calendar-outline" size={14} color={colors.icon} />
                                <ThemedText style={[styles.dateText, { color: colors.icon }]}>
                                    Last Donated: {donorData.lastDonationDate ? new Date(donorData.lastDonationDate).toLocaleDateString() : 'Never'}
                                </ThemedText>
                            </View>

                            <View style={styles.actionButtons}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginRight: 10 }}>
                                    <ThemedText style={{ fontSize: 10, color: colors.icon }}>Visible</ThemedText>
                                    <Switch
                                        value={isAvailable}
                                        onValueChange={handleToggleAvailability}
                                        trackColor={{ false: '#ef4444', true: '#10B981' }}
                                        thumbColor={'#FFFFFF'}
                                        style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                                    />
                                </View>

                                <TouchableOpacity
                                    style={[styles.actionBtn, { backgroundColor: '#FEE2E2' }]}
                                    onPress={() => setShowConfirmModal(true)}
                                    disabled={isProcessing}
                                >
                                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
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
                    <ThemedText style={styles.tipsTitle}>Donation Guidelines</ThemedText>
                    <View style={styles.tipItem}>
                        <Ionicons name="water" size={14} color="#ef4444" />
                        <ThemedText style={[styles.tipText, { color: colors.icon }]}>Stay hydrated before and after.</ThemedText>
                    </View>
                    <View style={styles.tipItem}>
                        <Ionicons name="restaurant" size={14} color="#ef4444" />
                        <ThemedText style={[styles.tipText, { color: colors.icon }]}>Eat a light, healthy meal before.</ThemedText>
                    </View>
                    <View style={styles.tipItem}>
                        <Ionicons name="moon" size={14} color="#ef4444" />
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
        elevation: 4,
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
    cardHeader: {
        marginBottom: 8,
    },
    nameStatusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    bizName: {
        fontSize: 16,
        fontWeight: '700',
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
    cardBody: {
        gap: 6,
        marginBottom: 12,
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
        fontWeight: '700',
    },
    bizInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    bizInfoText: {
        fontSize: 13,
        fontWeight: '500',
        flex: 1,
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
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    dateText: {
        fontSize: 12,
        fontWeight: '500',
    },
    actionButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    actionBtn: {
        padding: 6,
        borderRadius: 8,
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
        borderRadius: 12,
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
