import { DONOR_QUERY_KEYS, registerAsDonor } from '@/apis/bloodDonation';
import { analyticsService, AnalyticsEvents } from '@/analytics';
import { ThemedText } from '@/components/themedText';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import citiesData from '@/data/cities.json';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
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
    Dimensions
} from 'react-native';
import Toast from 'react-native-toast-message';
import { SearchableDropdown } from '../common/searchableDropdown';
import { PremiumModal } from '../common/PremiumModal';
import { toastConfig } from '../toastConfig';

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
        mutationFn: registerAsDonor,
        onSuccess: (res: any) => {
            if (res.success) {
                analyticsService.trackEvent(AnalyticsEvents.DONOR_REGISTRATION_SUCCESS);
                queryClient.invalidateQueries({ queryKey: DONOR_QUERY_KEYS.all });
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

        if (!address || address.trim().length === 0) {
            Toast.show({
                type: 'error',
                text1: 'Address Required',
                text2: 'Please enter your address or local area.',
            });
            return;
        }

        if (address.length > 40) {
            Toast.show({
                type: 'error',
                text1: 'Address Too Long',
                text2: 'Address must be maximum 40 characters.',
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
        <PremiumModal
            visible={visible}
            onClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ width: '100%' }}
            >
                <View style={styles.modalContent}>
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
                                    style={[styles.inputBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC', borderColor: colors.border, height: Platform.OS === 'android' ? 48 : 52 }]}
                                    onPress={() => setGroupModalVisible(true)}
                                >
                                    <Ionicons name="water" size={18} color={selectedGroup ? "#ef4444" : colors.icon} style={{ marginRight: 10 }} />
                                    <ThemedText style={[styles.textInput, { color: selectedGroup ? colors.text : colors.icon, fontSize: Platform.OS === 'android' ? 13 : 14 }]}>
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
                                    style={[styles.inputBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC', borderColor: colors.border, height: Platform.OS === 'android' ? 48 : 52 }]}
                                    onPress={() => setCityModalVisible(true)}
                                >
                                    <Ionicons name="location" size={18} color={selectedCity ? "#ef4444" : colors.icon} style={{ marginRight: 10 }} />
                                    <ThemedText style={[styles.textInput, { color: selectedCity ? colors.text : colors.icon, fontSize: Platform.OS === 'android' ? 13 : 14 }]}>
                                        {selectedCity || 'Select City'}
                                    </ThemedText>
                                    <Ionicons name="chevron-down" size={16} color={colors.icon} />
                                </TouchableOpacity>
                            </View>

                            {/* Address Input */}
                            <View style={styles.inputField}>
                                <View style={styles.labelRow}>
                                    <ThemedText style={[styles.label, { color: colors.text }]}>
                                        ADDRESS / LOCAL AREA <ThemedText style={styles.required}>*</ThemedText>
                                    </ThemedText>
                                    <ThemedText style={[styles.charCount, address.length > 40 ? { color: '#ef4444' } : { color: colors.icon }]}>
                                        {address.length}/40
                                    </ThemedText>
                                </View>
                                <View style={[styles.inputBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC', borderColor: colors.border, height: Platform.OS === 'android' ? 48 : 52 }]}>
                                    <Ionicons name="home" size={18} color={colors.icon} style={{ marginRight: 10 }} />
                                    <TextInput
                                        placeholder="Enter address or area"
                                        placeholderTextColor={colors.icon}
                                        style={[styles.textInput, { color: colors.text, fontSize: Platform.OS === 'android' ? 13 : 14 }]}
                                        value={address}
                                        onChangeText={setAddress}
                                        autoCapitalize="words"
                                        maxLength={40}
                                    />
                                </View>
                            </View>

                            {/* Last Donation Date */}
                            <View style={styles.inputField}>
                                <ThemedText style={[styles.label, { color: colors.text }]}>LAST DONATION DATE</ThemedText>
                                <TouchableOpacity
                                    style={[styles.inputBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC', borderColor: colors.border, height: Platform.OS === 'android' ? 48 : 52 }]}
                                    onPress={() => setShowDatePicker(true)}
                                >
                                    <Ionicons name="calendar" size={18} color={lastDonationDate ? "#ef4444" : colors.icon} style={{ marginRight: 10 }} />
                                    <ThemedText style={[styles.textInput, { color: lastDonationDate ? colors.text : colors.icon, fontSize: Platform.OS === 'android' ? 13 : 14 }]}>
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

                        </View>
                    </ScrollView>

                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={[styles.actionBtnWrapper, { flex: 1 }]}
                            onPress={handleRegister}
                            disabled={registerMutation.isPending}
                        >
                            <LinearGradient
                                colors={['#ef4444', '#b91c1c']}
                                style={[styles.gradientBtn, { height: Platform.OS === 'android' ? 44 : 46 }]}
                            >
                                {registerMutation.isPending ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <ThemedText style={styles.btnText}>REGISTER</ThemedText>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={onClose} style={styles.cancelBtn} activeOpacity={0.7}>
                            <ThemedText style={styles.cancelText}>Cancel</ThemedText>
                        </TouchableOpacity>
                    </View>
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
        </PremiumModal>
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
        width: '100%',
        maxHeight: Dimensions.get('window').height * 0.85,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        textTransform: 'capitalize',
        color: '#0F172A',
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    formSection: {
        gap: 12,
    },
    inputField: {
        gap: 4,
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
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingRight: 4,
    },
    charCount: {
        fontSize: 10,
        fontWeight: '600',
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
        borderRadius: 14,
        overflow: 'hidden',
    },
    gradientBtn: {
        height: Platform.OS === 'android' ? 44 : 46,
        justifyContent: 'center',
        alignItems: 'center',
    },
    btnText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 16,
    },
    cancelBtn: {
        flex: 1,
        height: Platform.OS === 'android' ? 44 : 46,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 14,
    },
    cancelText: {
        fontSize: 14,
        color: '#94A3B8',
        fontWeight: '600',
    },
    // Date Modal
    dateModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dateModalContent: {
        width: '95%',
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
    modalSheet: {
        width: '95%',
        height: '65%',
        paddingTop: 0,
        paddingHorizontal: 0,
        paddingBottom: 16,
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: '#FFFFFF',
    },
    fieldWrap: { marginBottom: 8 },
    dropdownModalContent: {
        width: '95%',
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
