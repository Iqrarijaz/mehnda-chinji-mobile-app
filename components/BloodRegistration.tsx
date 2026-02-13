import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Toast from 'react-native-toast-message';

import {
    DONOR_QUERY_KEYS,
    GET_DONOR_STATUS,
    MANAGE_DONOR_STATUS,
    REGISTER_AS_DONOR,
    REMOVE_AS_DONOR
} from '@/apis/bloodDonation';
import { CityPicker } from '@/components/CityPicker';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { GlassCard } from './ui/GlassCard';
import { GlassConfirmationModal } from './ui/GlassConfirmationModal';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const BloodRegistration = React.memo(() => {
    const { user } = useAuth();
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];
    const queryClient = useQueryClient();

    const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
    const [selectedCity, setSelectedCity] = useState<string>(user?.user?.city || '');
    const [village, setVillage] = useState<string>(user?.user?.village || '');
    const [lastDonationDate, setLastDonationDate] = useState<Date | null>(null);

    // UI State
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [cityModalVisible, setCityModalVisible] = useState(false);
    const [groupModalVisible, setGroupModalVisible] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showStatusConfirmModal, setShowStatusConfirmModal] = useState(false);

    // Query
    const { data: statusRes, isLoading: loading } = useQuery({
        queryKey: DONOR_QUERY_KEYS.status(),
        queryFn: GET_DONOR_STATUS,
    });

    const donorData = statusRes?.data;
    const isRegistered = !!donorData;
    const isAvailable = donorData?.available ?? true;

    // Sync state with query data
    useEffect(() => {
        if (donorData) {
            setSelectedGroup(donorData.bloodGroup);
            setSelectedCity(donorData.city || user?.user?.city || '');
            setVillage(donorData.village || user?.user?.village || '');
            if (donorData.lastDonationDate) {
                setLastDonationDate(new Date(donorData.lastDonationDate));
            }
        }
    }, [donorData]);

    // Mutations
    const registerMutation = useMutation({
        mutationFn: REGISTER_AS_DONOR,
        onSuccess: (res) => {
            if (res.success) {
                queryClient.invalidateQueries({ queryKey: DONOR_QUERY_KEYS.all });
                Toast.show({
                    type: 'success',
                    text1: 'Success',
                    text2: 'Registered as donor successfully!',
                });
            }
        },
    });

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

    const isProcessing = registerMutation.isPending || removeMutation.isPending || manageStatusMutation.isPending;

    const handleToggleRegistration = () => {
        if (!isRegistered && !selectedGroup) {
            Toast.show({
                type: 'error',
                text1: 'Blood Group Required',
                text2: 'Please select your blood group to register.',
            });
            return;
        }

        if (!isRegistered && !selectedCity) {
            Toast.show({
                type: 'error',
                text1: 'City Required',
                text2: 'Please select your city to register.',
            });
            return;
        }

        if (isRegistered) {
            setShowConfirmModal(true);
            return;
        }

        registerMutation.mutate({
            bloodGroup: selectedGroup,
            city: selectedCity,
            village: village,
            lastDonationDate: lastDonationDate?.toISOString(),
        });
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

    const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
        const currentDate = selectedDate || lastDonationDate;
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            setLastDonationDate(currentDate);
        }
    };

    if (loading && !donorData) {
        return (
            <View style={[styles.container, styles.centerContent]}>
                <ActivityIndicator size="large" color="#ef4444" />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
            {/* Header */}
            <View style={styles.headerBox}>
                <ThemedText style={styles.headerTitle}>Blood Donor Portal</ThemedText>
            </View>

            {/* Main Liquid Glass Registration Card */}
            <GlassCard>

                <View style={styles.statusHeader}>
                    <View style={styles.statusLabelContainer}>
                        <ThemedText style={styles.statusLabel}>REGISTRATION</ThemedText>
                        <ThemedText style={[styles.statusValue, { color: isRegistered ? '#10B981' : '#64748b' }]}>
                            {isRegistered ? 'ACTIVE' : 'INACTIVE'}
                        </ThemedText>
                    </View>
                    <Ionicons
                        name={isRegistered ? "checkmark-circle" : "ellipse-outline"}
                        size={32}
                        color={isRegistered ? "#10B981" : isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}
                    />
                </View>

                {isRegistered ? (
                    <View style={styles.controlsSection}>
                        <View style={[styles.infoRow, { backgroundColor: 'transparent' }]}>
                            <View style={styles.infoItem}>
                                <ThemedText style={styles.infoLabel}>Blood Group</ThemedText>
                                <ThemedText style={styles.infoValue}>{selectedGroup}</ThemedText>
                            </View>
                            <View style={styles.infoDivider} />
                            <View style={styles.infoItem}>
                                <ThemedText style={styles.infoLabel}>Location</ThemedText>
                                <ThemedText style={styles.infoValue} numberOfLines={1}>{village}, {selectedCity}</ThemedText>
                            </View>
                        </View>

                        <View style={styles.row}>
                            <View style={{ flex: 1 }}>
                                <ThemedText style={styles.controlTitle}>Availability Status</ThemedText>
                                <ThemedText style={styles.controlDesc}>
                                    {isAvailable ? 'Visible to those in need' : 'Currently hidden'}
                                </ThemedText>
                            </View>
                            <Switch
                                value={isAvailable}
                                onValueChange={handleToggleAvailability}
                                trackColor={{ false: '#7f1d1d', true: '#064e3b' }}
                                thumbColor={isAvailable ? '#10B981' : '#ef4444'}
                                style={{ transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }] }}
                            />
                        </View>

                        <TouchableOpacity
                            style={styles.actionBtnWrapper}
                            onPress={handleToggleRegistration}
                            disabled={loading}
                        >
                            <LinearGradient
                                colors={['#ef4444', '#b91c1c']}
                                style={styles.gradientBtn}
                            >
                                <ThemedText style={styles.btnText}>
                                    {isProcessing ? 'Processing...' : 'UNREGISTER AS DONOR'}
                                </ThemedText>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.setupSection}>
                        {/* Blood Group Dropdown */}
                        <View style={styles.inputField}>
                            <ThemedText style={styles.setupLabel}>BLOOD GROUP</ThemedText>
                            <TouchableOpacity
                                style={[styles.dropdownTrigger, { backgroundColor: 'transparent' }]}
                                onPress={() => setGroupModalVisible(true)}
                            >
                                <View style={styles.triggerContent}>
                                    <Ionicons name="water" size={18} color="#ef4444" style={{ marginRight: 10 }} />
                                    <ThemedText style={[styles.triggerText, !selectedGroup && { opacity: 0.5 }]}>
                                        {selectedGroup || 'Select Blood Group'}
                                    </ThemedText>
                                </View>
                                <Ionicons name="chevron-down" size={16} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        {/* City Dropdown */}
                        <View style={styles.inputField}>
                            <ThemedText style={styles.setupLabel}>CITY</ThemedText>
                            <TouchableOpacity
                                style={[styles.dropdownTrigger, { backgroundColor: 'transparent' }]}
                                onPress={() => setCityModalVisible(true)}
                            >
                                <View style={styles.triggerContent}>
                                    <Ionicons name="location" size={18} color="#ef4444" style={{ marginRight: 10 }} />
                                    <ThemedText style={[styles.triggerText, !selectedCity && { opacity: 0.5 }]}>
                                        {selectedCity || 'Select City'}
                                    </ThemedText>
                                </View>
                                <Ionicons name="chevron-down" size={16} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        {/* Village Input */}
                        <View style={styles.inputField}>
                            <ThemedText style={styles.setupLabel}>VILLAGE / LOCAL AREA (OPTIONAL)</ThemedText>
                            <View style={[styles.dropdownTrigger, { backgroundColor: 'transparent', paddingLeft: 14 }]}>
                                <Ionicons name="home" size={18} color="#ef4444" style={{ marginRight: 10 }} />
                                <TextInput
                                    placeholder="Enter village or area"
                                    placeholderTextColor={isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)"}
                                    style={[styles.textInput, { color: colors.text }]}
                                    value={village}
                                    onChangeText={setVillage}
                                />
                            </View>
                        </View>

                        {/* Last Donation Date Selector */}
                        <View style={styles.inputField}>
                            <ThemedText style={styles.setupLabel}>LAST DONATION DATE</ThemedText>
                            <TouchableOpacity
                                style={[styles.dropdownTrigger, { backgroundColor: 'transparent' }]}
                                onPress={() => setShowDatePicker(true)}
                            >
                                <View style={styles.triggerContent}>
                                    <Ionicons name="calendar" size={18} color="#ef4444" style={{ marginRight: 10 }} />
                                    <ThemedText style={[styles.triggerText, !lastDonationDate && { opacity: 0.5 }]}>
                                        {lastDonationDate ? lastDonationDate.toLocaleDateString() : 'Tap to select date'}
                                    </ThemedText>
                                </View>
                                <Ionicons name="chevron-down" size={16} color="#64748b" />
                            </TouchableOpacity>

                            <Modal
                                visible={showDatePicker}
                                transparent={true}
                                animationType="fade"
                                onRequestClose={() => setShowDatePicker(false)}
                            >
                                <View style={styles.modalOverlay}>
                                    <View style={styles.dateModalContent}>
                                        <LinearGradient
                                            colors={['#1e293b', '#0F172A']}
                                            style={StyleSheet.absoluteFill}
                                        />
                                        <View style={styles.modalHeader}>
                                            <ThemedText style={styles.modalTitle}>Select Date</ThemedText>
                                        </View>

                                        <View style={styles.pickerContainer}>
                                            <DateTimePicker
                                                value={lastDonationDate || new Date()}
                                                mode="date"
                                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                                onChange={onDateChange}
                                                maximumDate={new Date()}
                                                textColor="#FFFFFF"
                                            />
                                        </View>

                                        <View style={styles.modalFooter}>
                                            <TouchableOpacity
                                                style={styles.modalBtn}
                                                onPress={() => setShowDatePicker(false)}
                                            >
                                                <ThemedText style={styles.modalBtnText}>Cancel</ThemedText>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[styles.modalBtn, styles.modalBtnPrimary]}
                                                onPress={() => setShowDatePicker(false)}
                                            >
                                                <ThemedText style={[styles.modalBtnText, { color: '#FF9B51' }]}>Confirm</ThemedText>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            </Modal>
                        </View>

                        <TouchableOpacity
                            style={styles.actionBtnWrapper}
                            onPress={handleToggleRegistration}
                            disabled={isProcessing}
                        >
                            <LinearGradient
                                colors={['#ef4444', '#b91c1c']}
                                style={styles.gradientBtn}
                            >
                                {isProcessing ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <ThemedText style={styles.btnText}>REGISTER AS DONOR</ThemedText>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                )}
            </GlassCard>

            {/* Donation Tips */}
            <View style={styles.tipsSection}>
                <ThemedText style={styles.tipsTitle}>Donation Guidelines</ThemedText>
                <View style={styles.tipItem}>
                    <Ionicons name="water" size={14} color="#ef4444" />
                    <ThemedText style={styles.tipText}>Stay hydrated before and after.</ThemedText>
                </View>
                <View style={styles.tipItem}>
                    <Ionicons name="restaurant" size={14} color="#ef4444" />
                    <ThemedText style={styles.tipText}>Eat a light, healthy meal before.</ThemedText>
                </View>
                <View style={styles.tipItem}>
                    <Ionicons name="moon" size={14} color="#ef4444" />
                    <ThemedText style={styles.tipText}>Get a good night's sleep before.</ThemedText>
                </View>
            </View>

            {/* City Picker Modal */}
            <CityPicker
                visible={cityModalVisible}
                onClose={() => setCityModalVisible(false)}
                onSelect={setSelectedCity}
                currentCity={selectedCity}
            />

            {/* Blood Group Modal */}
            <Modal
                visible={groupModalVisible}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setGroupModalVisible(false)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setGroupModalVisible(false)}
                >
                    <View style={styles.dropdownModalContent}>
                        <LinearGradient
                            colors={['#1e293b', '#0F172A']}
                            style={StyleSheet.absoluteFill}
                        />
                        <View style={styles.modalHeader}>
                            <ThemedText style={styles.modalTitle}>Select Blood Group</ThemedText>
                        </View>
                        {BLOOD_GROUPS.map((group) => (
                            <TouchableOpacity
                                key={group}
                                style={styles.groupItem}
                                onPress={() => {
                                    setSelectedGroup(group);
                                    setGroupModalVisible(false);
                                }}
                            >
                                <ThemedText style={[
                                    styles.itemText,
                                    selectedGroup === group && styles.selectedItemText
                                ]}>
                                    {group}
                                </ThemedText>
                                {selectedGroup === group && (
                                    <Ionicons name="checkmark" size={20} color="#FF9B51" />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </Pressable>
            </Modal>

            <GlassConfirmationModal
                visible={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                onConfirm={confirmRemoveRegistration}
                title="Unregister as Donor?"
                message="Are you sure you want to stop being a blood donor? You can always register again later."
                confirmText={isProcessing ? "Unregistering..." : "Yes, Unregister"}
                type="danger"
            />

            <GlassConfirmationModal
                visible={showStatusConfirmModal}
                onClose={() => setShowStatusConfirmModal(false)}
                onConfirm={confirmToggleStatus}
                title={isAvailable ? "Go Offline?" : "Go Online?"}
                message={isAvailable
                    ? "Other users won't be able to find you in the donor list. You can change this anytime."
                    : "You will be visible to users searching for blood donors. Ready to help?"}
                confirmText={isProcessing ? "Updating..." : (isAvailable ? "Yes, Go Offline" : "Yes, Go Online")}
                type={isAvailable ? "danger" : "info"}
            />
        </ScrollView >
    );
});

export default BloodRegistration;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 14,
        paddingBottom: 100,
    },
    headerBox: {
        marginBottom: 14,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    cardWrapper: {
        marginBottom: 20,
    },
    statusHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 12,
        borderBottomWidth: 4,
        borderBottomColor: 'rgba(255,255,255,0.08)',
        marginBottom: 12,
    },
    statusLabelContainer: {
        flex: 1,
    },
    statusLabel: {
        fontSize: 9,
        fontWeight: '800',
        color: '#64748b',
        letterSpacing: 1.2,
    },
    statusValue: {
        fontSize: 20,
        fontWeight: '900',
        marginTop: 1,
    },
    controlsSection: {
        gap: 14,
    },
    infoRow: {
        flexDirection: 'row',
        padding: 10,
        borderRadius: 12,
        marginBottom: 2,
    },
    infoItem: {
        flex: 1,
        alignItems: 'center',
    },
    infoLabel: {
        fontSize: 10,
        color: '#64748b',
        fontWeight: '700',
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 14,
        textTransform: 'capitalize',
        fontWeight: '600',
    },
    infoDivider: {
        width: 4,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginHorizontal: 12,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    controlTitle: {
        fontSize: 14,
        fontWeight: '700',
    },
    controlDesc: {
        fontSize: 11,
        color: '#64748b',
        marginTop: 1,
    },
    setupSection: {
        gap: 10,
    },
    inputField: {
        gap: 4,
    },
    setupLabel: {
        fontSize: 9,
        fontWeight: '800',
        color: '#64748b',
        letterSpacing: 0.8,
        marginLeft: 2,
    },
    dropdownTrigger: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 48,
        borderRadius: 14,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    triggerContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    triggerText: {
        fontSize: 14,
        fontWeight: '600',
    },
    textInput: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
    },
    actionBtnWrapper: {
        marginTop: 6,
        borderRadius: 14,
        overflow: 'hidden',
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 3,
    },
    gradientBtn: {
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    btnText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '800',
        letterSpacing: 0.4,
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
        color: '#64748b',
        fontWeight: '500',
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dropdownModalContent: {
        width: '85%',
        maxHeight: '60%',
        borderRadius: 24,
        padding: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    modalHeader: {
        marginBottom: 16,
        zIndex: 1,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#FFFFFF',
        textAlign: 'center',
    },
    groupItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    itemText: {
        fontSize: 16,
        color: '#FFFFFF',
    },
    selectedItemText: {
        color: '#FF9B51',
        fontWeight: '700',
    },
    dateModalContent: {
        width: '90%',
        backgroundColor: '#0F172A',
        borderRadius: 28,
        padding: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    pickerContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 10,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 16,
        padding: 10,
    },
    modalFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
        marginTop: 20,
    },
    modalBtn: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 12,
    },
    modalBtnPrimary: {
        backgroundColor: 'rgba(255, 155, 81, 0.1)',
    },
    modalBtnText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#64748b',
    },
});
