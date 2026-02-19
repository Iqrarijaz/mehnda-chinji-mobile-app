import { REGISTER_AS_DONOR } from '@/apis/bloodDonation';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import citiesData from '@/data/cities.json';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { toastConfig } from '../ToastConfig';
import { SearchableDropdown } from '../common/SearchableDropdown';

interface BloodRegistrationModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const BloodRegistrationModal = ({ visible, onClose, onSuccess }: BloodRegistrationModalProps) => {
    const { user } = useAuth();
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];
    const queryClient = useQueryClient();

    const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
    const [selectedCity, setSelectedCity] = useState<string>(user?.user?.city || '');
    const [address, setAddress] = useState<string>(user?.user?.address || user?.user?.village || '');
    const [lastDonationDate, setLastDonationDate] = useState<Date | null>(null);

    // UI State
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [cityModalVisible, setCityModalVisible] = useState(false);
    const [groupModalVisible, setGroupModalVisible] = useState(false);

    // Helper to format address
    const toTitleCase = (str: string) => {
        if (!str) return '';
        return str.toLowerCase().replace(/\b\w/g, s => s.toUpperCase());
    };

    useEffect(() => {
        if (!visible) {
            // Reset form
            setSelectedGroup(null);
            setSelectedCity(user?.user?.city || '');
            setAddress(toTitleCase(user?.user?.address || user?.user?.village || ''));
            setLastDonationDate(null);
        } else {
            setAddress(toTitleCase(user?.user?.address || user?.user?.village || ''));
        }
    }, [visible, user]);

    const registerMutation = useMutation({
        mutationFn: REGISTER_AS_DONOR,
        onSuccess: (res) => {
            if (res.success) {
                // Invalidate keys
                // We might need to invalidate 'donor-status' or similar
                queryClient.invalidateQueries({ queryKey: ['donor-status'] });
                Toast.show({
                    type: 'success',
                    text1: 'Success',
                    text2: 'Registered as donor successfully!',
                });
                onSuccess();
                onClose();
            }
        },
        onError: (error: any) => {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error?.message || 'Something went wrong',
            });
        }
    });

    const handleRegister = () => {
        if (!selectedGroup) {
            Toast.show({
                type: 'error',
                text1: 'Blood Group Required',
                text2: 'Please select your blood group.',
            });
            return;
        }

        if (!selectedCity) {
            Toast.show({
                type: 'error',
                text1: 'City Required',
                text2: 'Please select your city.',
            });
            return;
        }

        registerMutation.mutate({
            bloodGroup: selectedGroup,
            city: selectedCity,
            address: address,
            lastDonationDate: lastDonationDate?.toISOString(),
        });
    };

    const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
        const currentDate = selectedDate || lastDonationDate;
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            setLastDonationDate(currentDate);
        }
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.modalOverlay}
            >
                <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                    <View style={styles.header}>
                        <ThemedText style={styles.title}>Register as Donor</ThemedText>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        <View style={styles.formSection}>
                            {/* Blood Group Dropdown */}
                            <View style={styles.inputField}>
                                <ThemedText style={[styles.label, { color: colors.text }]}>
                                    BLOOD GROUP <ThemedText style={styles.required}>*</ThemedText>
                                </ThemedText>
                                <TouchableOpacity
                                    style={[styles.inputBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC', borderColor: colors.border }]}
                                    onPress={() => setGroupModalVisible(true)}
                                >
                                    <Ionicons name="water" size={18} color={selectedGroup ? "#ef4444" : colors.icon} style={{ marginRight: 10 }} />
                                    <ThemedText style={[styles.textInput, { color: selectedGroup ? colors.text : colors.icon }]}>
                                        {selectedGroup || 'Select Blood Group'}
                                    </ThemedText>
                                    <Ionicons name="chevron-down" size={16} color={colors.icon} />
                                </TouchableOpacity>
                            </View>

                            {/* City Dropdown */}
                            <View style={styles.inputField}>
                                <ThemedText style={[styles.label, { color: colors.text }]}>
                                    CITY <ThemedText style={styles.required}>*</ThemedText>
                                </ThemedText>
                                <TouchableOpacity
                                    style={[styles.inputBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC', borderColor: colors.border }]}
                                    onPress={() => setCityModalVisible(true)}
                                >
                                    <Ionicons name="location" size={18} color={selectedCity ? "#ef4444" : colors.icon} style={{ marginRight: 10 }} />
                                    <ThemedText style={[styles.textInput, { color: selectedCity ? colors.text : colors.icon }]}>
                                        {selectedCity || 'Select City'}
                                    </ThemedText>
                                    <Ionicons name="chevron-down" size={16} color={colors.icon} />
                                </TouchableOpacity>
                            </View>

                            {/* Address Input */}
                            <View style={styles.inputField}>
                                <ThemedText style={[styles.label, { color: colors.text }]}>ADDRESS / LOCAL AREA</ThemedText>
                                <View style={[styles.inputBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC', borderColor: colors.border }]}>
                                    <Ionicons name="home" size={18} color={colors.icon} style={{ marginRight: 10 }} />
                                    <TextInput
                                        placeholder="Enter address or area"
                                        placeholderTextColor={colors.icon}
                                        style={[styles.textInput, { color: colors.text }]}
                                        value={address}
                                        onChangeText={setAddress}
                                        autoCapitalize="words"
                                    />
                                </View>
                            </View>

                            {/* Last Donation Date */}
                            <View style={styles.inputField}>
                                <ThemedText style={[styles.label, { color: colors.text }]}>LAST DONATION DATE</ThemedText>
                                <TouchableOpacity
                                    style={[styles.inputBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC', borderColor: colors.border }]}
                                    onPress={() => setShowDatePicker(true)}
                                >
                                    <Ionicons name="calendar" size={18} color={lastDonationDate ? "#ef4444" : colors.icon} style={{ marginRight: 10 }} />
                                    <ThemedText style={[styles.textInput, { color: lastDonationDate ? colors.text : colors.icon }]}>
                                        {lastDonationDate ? lastDonationDate.toLocaleDateString() : 'Tap to select date'}
                                    </ThemedText>
                                    <Ionicons name="chevron-down" size={16} color={colors.icon} />
                                </TouchableOpacity>

                                <Modal
                                    visible={showDatePicker}
                                    transparent={true}
                                    animationType="fade"
                                    onRequestClose={() => setShowDatePicker(false)}
                                >
                                    <View style={styles.dateModalOverlay}>
                                        <View style={[styles.dateModalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                            <View style={styles.modalHeader}>
                                                <ThemedText style={[styles.modalTitle, { color: colors.text }]}>Select Date</ThemedText>
                                            </View>

                                            <View style={[styles.pickerContainer, { backgroundColor: colors.background }]}>
                                                <DateTimePicker
                                                    value={lastDonationDate || new Date()}
                                                    mode="date"
                                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                                    onChange={onDateChange}
                                                    maximumDate={new Date()}
                                                    textColor={colors.text}
                                                />
                                            </View>

                                            <View style={styles.modalFooter}>
                                                <TouchableOpacity
                                                    style={styles.modalBtn}
                                                    onPress={() => setShowDatePicker(false)}
                                                >
                                                    <ThemedText style={[styles.modalBtnText, { color: colors.icon }]}>Cancel</ThemedText>
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
                                style={[styles.actionBtnWrapper]}
                                onPress={handleRegister}
                                disabled={registerMutation.isPending}
                            >
                                <LinearGradient
                                    colors={['#ef4444', '#b91c1c']}
                                    style={styles.gradientBtn}
                                >
                                    {registerMutation.isPending ? (
                                        <ActivityIndicator size="small" color="#FFFFFF" />
                                    ) : (
                                        <ThemedText style={styles.btnText}>REGISTER AS DONOR</ThemedText>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>

            {/* City Picker Modal */}
            <SearchableDropdown
                visible={cityModalVisible}
                onClose={() => setCityModalVisible(false)}
                onSelect={(city: string) => {
                    setSelectedCity(city);
                    // setCityModalVisible(false); // Handled inside if needed
                }}
                currentValue={selectedCity}
                options={citiesData}
                title="Select City"
                placeholder="Search city..."
            />

            {/* Blood Group Modal */}
            <Modal
                visible={groupModalVisible}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setGroupModalVisible(false)}
            >
                <Pressable
                    style={styles.dateModalOverlay}
                    onPress={() => setGroupModalVisible(false)}
                >
                    <View style={[styles.dropdownModalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <View style={styles.modalHeader}>
                            <ThemedText style={[styles.modalTitle, { color: colors.text }]}>Select Blood Group</ThemedText>
                        </View>
                        {BLOOD_GROUPS.map((group) => (
                            <TouchableOpacity
                                key={group}
                                style={[styles.groupItem, { borderBottomColor: colors.border }]}
                                onPress={() => {
                                    setSelectedGroup(group);
                                    setGroupModalVisible(false);
                                }}
                            >
                                <ThemedText style={[
                                    styles.itemText,
                                    { color: colors.text },
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

            <Toast config={toastConfig} topOffset={50} />
        </Modal>
    );
};

export default BloodRegistrationModal;

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: '90%',
        paddingTop: 20,
        paddingHorizontal: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        textTransform: 'capitalize',
    },
    closeButton: {
        padding: 4,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    formSection: {
        gap: 16,
    },
    inputField: {
        gap: 8,
    },
    label: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.5,
        marginLeft: 2,
    },
    required: {
        color: '#EF4444',
    },
    inputBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 52,
        borderRadius: 14,
        paddingHorizontal: 14,
        borderWidth: 1,
    },
    textInput: {
        flex: 1,
        fontSize: 14,
        fontWeight: '500',
    },
    actionBtnWrapper: {
        marginTop: 8,
        borderRadius: 16,
        overflow: 'hidden',
    },
    gradientBtn: {
        height: 52,
        justifyContent: 'center',
        alignItems: 'center',
    },
    btnText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    // Date Modal
    dateModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dateModalContent: {
        width: '90%',
        borderRadius: 28,
        padding: 24,
        overflow: 'hidden',
        borderWidth: 1,
    },
    modalHeader: {
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '800',
        textAlign: 'center',
    },
    pickerContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 10,
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
    },
    // Dropdown Modal
    dropdownModalContent: {
        width: '85%',
        maxHeight: '60%',
        borderRadius: 24,
        padding: 20,
        paddingBottom: 40,
        overflow: 'hidden',
        borderWidth: 1,
    },
    groupItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
    },
    itemText: {
        fontSize: 16,
    },
    selectedItemText: {
        fontWeight: '700',
    },
});
