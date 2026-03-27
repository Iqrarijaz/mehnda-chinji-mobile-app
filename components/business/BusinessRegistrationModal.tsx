import { BUSINESS_QUERY_KEYS, registerBusiness, updateBusiness } from '@/apis/business';
import { analyticsService, AnalyticsEvents } from '@/analytics';
import { ThemedText } from '@/components/themedText';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
    Dimensions
} from 'react-native';
import Toast from 'react-native-toast-message';
import { PremiumModal } from '../common/PremiumModal';
import { ProfessionPicker } from '../common/professionPicker';
import { toastConfig } from '../toastConfig';

interface BusinessRegistrationModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editData?: any;
}

const BusinessRegistrationModal = ({ visible, onClose, onSuccess, editData }: BusinessRegistrationModalProps) => {
    const { user } = useAuth();
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];
    const queryClient = useQueryClient();

    const [data, setData] = useState({
        name: '',
        description: '',
        phone: user?.user?.phone || '',
        address: '',
        category: null as any,
    });

    const [professionModalVisible, setProfessionModalVisible] = useState(false);

    // Helper to format address
    const toTitleCase = (str: string) => {
        if (!str) return '';
        return str.toLowerCase().replace(/\b\w/g, s => s.toUpperCase());
    };

    // Reset form when opening/closing
    React.useEffect(() => {
        if (!visible) {
            setData({
                name: '',
                description: '',
                phone: user?.user?.phone || '',
                address: toTitleCase(user?.user?.address || user?.user?.village || ''),
                category: null as any,
            });
        } else {
            if (editData) {
                setData({
                    name: editData.name,
                    description: editData.description,
                    phone: editData.phone,
                    address: toTitleCase(editData.address),
                    category: {
                        name_eng: editData.categoryEn,
                        name_ur: editData.categoryUr
                    } as any
                });
            } else {
                setData(prev => ({
                    ...prev,
                    phone: user?.user?.phone || prev.phone,
                    address: toTitleCase(user?.user?.address || user?.user?.village || prev.address)
                }));
            }
        }
    }, [visible, user, editData]);

    const handleInputChange = (key: string, value: any) => {
        setData(prev => ({ ...prev, [key]: value }));
    };

    const registerMutation = useMutation({
        mutationFn: registerBusiness,
        onSuccess: (res: any) => {
            if (res.success) {
                analyticsService.trackEvent(AnalyticsEvents.BUSINESS_REGISTRATION_SUCCESS, { action: 'create' });
                queryClient.invalidateQueries({ queryKey: BUSINESS_QUERY_KEYS.myBusiness() });
                Toast.show({
                    type: 'success',
                    text1: 'Success',
                    text2: 'Business registered successfully!',
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

    const updateMutation = useMutation({
        mutationFn: updateBusiness,
        onSuccess: (res: any) => {
            if (res.success) {
                analyticsService.trackEvent(AnalyticsEvents.BUSINESS_REGISTRATION_SUCCESS, { action: 'update' });
                queryClient.invalidateQueries({ queryKey: BUSINESS_QUERY_KEYS.myBusiness() });
                Toast.show({
                    type: 'success',
                    text1: 'Success',
                    text2: 'Business updated successfully!',
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

    const handleRegister = async () => {
        const { name, category, phone, address, description } = data;

        if (!name || !category || !phone || !address || !description) {
            Toast.show({
                type: 'error',
                text1: 'Fields Required',
                text2: 'Please fill in all required fields.',
            });
            return;
        }

        if (phone.length !== 11) {
            Toast.show({
                type: 'error',
                text1: 'Invalid Phone',
                text2: 'Phone number must be exactly 11 characters.',
            });
            return;
        }

        if (name.length > 30) {
            Toast.show({
                type: 'error',
                text1: 'Name Too Long',
                text2: 'Business name cannot exceed 30 characters.',
            });
            return;
        }

        if (address.length > 40) {
            Toast.show({
                type: 'error',
                text1: 'Address Too Long',
                text2: 'Address cannot exceed 40 characters.',
            });
            return;
        }

        if (description.length < 50) {
            Toast.show({
                type: 'error',
                text1: 'Description Too Short',
                text2: 'Description must be at least 50 characters.',
            });
            return;
        }

        if (description.length > 200) {
            Toast.show({
                type: 'error',
                text1: 'Description Too Long',
                text2: 'Description cannot exceed 200 characters.',
            });
            return;
        }

        if (editData) {
            updateMutation.mutate({
                businessId: editData._id,
                name: data.name,
                categoryEn: data.category.name_eng,
                categoryUr: data.category.name_ur,
                description: data.description,
                phone: data.phone,
                address: data.address,
            });
        } else {
            registerMutation.mutate({
                name: data.name,
                categoryEn: data.category.name_eng,
                categoryUr: data.category.name_ur,
                description: data.description,
                phone: data.phone,
                address: data.address,
            });
        }
    };

    const isPending = registerMutation.isPending || updateMutation.isPending;



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
                        <ThemedText style={styles.title}>{editData ? 'Update Business' : 'Register Business'}</ThemedText>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        <View style={styles.formSection}>
                            {/* Business Name */}
                            <View style={styles.inputField}>
                                <View style={styles.labelContainer}>
                                    <ThemedText style={[styles.label, { color: colors.text }]}>
                                        BUSINESS NAME <ThemedText style={styles.required}>*</ThemedText>
                                    </ThemedText>
                                    <ThemedText style={[styles.charCount, data.name.length > 30 ? { color: '#EF4444' } : { color: colors.icon }]}>
                                        {data.name.length}/30
                                    </ThemedText>
                                </View>
                                <View style={[styles.inputBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC', borderColor: colors.border, height: Platform.OS === 'android' ? 48 : 52 }]}>
                                    <Ionicons name="business" size={18} color={colors.icon} style={{ marginRight: 10 }} />
                                    <TextInput
                                        placeholder="e.g. Al-Madina Auto Repair"
                                        placeholderTextColor={colors.icon}
                                        style={[styles.textInput, { color: colors.text, fontSize: Platform.OS === 'android' ? 13 : 14 }]}
                                        value={data.name}
                                        onChangeText={(val) => handleInputChange('name', val)}
                                        maxLength={30}
                                    />
                                </View>
                            </View>

                            {/* Profession Dropdown */}
                            <View style={styles.inputField}>
                                <ThemedText style={[styles.label, { color: colors.text }]}>
                                    PROFESSION <ThemedText style={styles.required}>*</ThemedText>
                                </ThemedText>
                                <TouchableOpacity
                                    style={[styles.dropdownTrigger, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC', borderColor: colors.border, height: Platform.OS === 'android' ? 48 : 52 }]}
                                    onPress={() => setProfessionModalVisible(true)}
                                >
                                    <View style={styles.triggerContent}>
                                        <Ionicons name="construct" size={18} color={data.category ? colors.primary : colors.icon} style={{ marginRight: 10 }} />
                                        <ThemedText style={[styles.triggerText, !data.category ? { color: colors.icon } : { color: colors.text, textTransform: 'capitalize' }, { fontSize: Platform.OS === 'android' ? 13 : 14 }]}>
                                            {data.category ? `${data.category.name_eng} - ${data.category.name_ur} ` : 'Select Profession'}
                                        </ThemedText>
                                    </View>
                                    <Ionicons name="chevron-down" size={16} color={colors.icon} />
                                </TouchableOpacity>
                            </View>

                            {/* Address Input */}
                            <View style={styles.inputField}>
                                <View style={styles.labelContainer}>
                                    <ThemedText style={[styles.label, { color: colors.text }]}>
                                        ADDRESS <ThemedText style={styles.required}>*</ThemedText>
                                    </ThemedText>
                                    <ThemedText style={[styles.charCount, data.address.length > 40 ? { color: '#EF4444' } : { color: colors.icon }]}>
                                        {data.address.length}/40
                                    </ThemedText>
                                </View>
                                <View style={[styles.inputBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC', borderColor: colors.border, height: Platform.OS === 'android' ? 48 : 52 }]}>
                                    <Ionicons name="location" size={18} color={colors.icon} style={{ marginRight: 10 }} />
                                    <TextInput
                                        placeholder="Enter address or area"
                                        placeholderTextColor={colors.icon}
                                        style={[styles.textInput, { color: colors.text, fontSize: Platform.OS === 'android' ? 13 : 14 }]}
                                        value={data.address}
                                        onChangeText={(val) => handleInputChange('address', val)}
                                        autoCapitalize="words"
                                        maxLength={40}
                                    />
                                </View>
                            </View>

                            {/* Phone Input */}
                            <View style={styles.inputField}>
                                <View style={styles.labelContainer}>
                                    <ThemedText style={[styles.label, { color: colors.text }]}>
                                        CONTACT PHONE <ThemedText style={styles.required}>*</ThemedText>
                                    </ThemedText>
                                    <ThemedText style={[styles.charCount, data.phone.length > 0 && data.phone.length !== 11 ? { color: '#EF4444' } : { color: colors.icon }]}>
                                        {data.phone.length}/11
                                    </ThemedText>
                                </View>
                                <View style={[styles.inputBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC', borderColor: colors.border, height: Platform.OS === 'android' ? 48 : 52 }]}>
                                    <Ionicons name="call" size={18} color={colors.icon} style={{ marginRight: 10 }} />
                                    <TextInput
                                        placeholder="+92 300 1234567"
                                        placeholderTextColor={colors.icon}
                                        style={[styles.textInput, { color: colors.text, fontSize: Platform.OS === 'android' ? 13 : 14 }]}
                                        value={data.phone}
                                        onChangeText={(val) => handleInputChange('phone', val)}
                                        keyboardType="phone-pad"
                                        maxLength={11}
                                    />
                                </View>
                            </View>

                            <View style={styles.inputField}>
                                <View style={styles.labelContainer}>
                                    <ThemedText style={[styles.label, { color: colors.text }]}>
                                        DESCRIPTION / SERVICES <ThemedText style={styles.required}>*</ThemedText>
                                    </ThemedText>
                                    <ThemedText style={[styles.charCount, (data.description.length > 0 && data.description.length < 50) || data.description.length > 200 ? { color: '#EF4444' } : { color: colors.icon }]}>
                                        {data.description.length}/200
                                    </ThemedText>
                                </View>
                                <View style={[styles.inputBox, styles.textArea, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC', borderColor: colors.border }]}>
                                    <TextInput
                                        placeholder="اپنے کاروبار کی خدمات اور پیشکش کی تفصیل لکھیں"
                                        placeholderTextColor={colors.icon}
                                        style={[styles.textInput, { textAlignVertical: 'top', color: colors.text, fontSize: Platform.OS === 'android' ? 13 : 14 }]}
                                        value={data.description}
                                        onChangeText={(val) => handleInputChange('description', val)}
                                        multiline
                                        numberOfLines={4}
                                        maxLength={200}
                                    />
                                </View>
                            </View>

                        </View>
                    </ScrollView>

                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={[styles.actionBtnWrapper, { flex: 1 }]}
                            onPress={handleRegister}
                            disabled={isPending}
                        >
                            <LinearGradient
                                colors={[colors.primary, colors.primary]}
                                style={[styles.gradientBtn, { height: Platform.OS === 'android' ? 44 : 46 }]}
                            >
                                {isPending ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <ThemedText style={styles.btnText}>
                                        {editData ? 'UPDATE' : 'REGISTER'}
                                    </ThemedText>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={onClose} style={styles.cancelBtn} activeOpacity={0.7}>
                            <ThemedText style={styles.cancelText}>Cancel</ThemedText>
                        </TouchableOpacity>
                    </View>
                </View >
            </KeyboardAvoidingView >

            <ProfessionPicker
                visible={professionModalVisible}
                onClose={() => setProfessionModalVisible(false)}
                onSelect={(prof: any) => {
                    handleInputChange('category', prof);
                    setProfessionModalVisible(false);
                }}
            />
            <Toast config={toastConfig} topOffset={50} />
        </PremiumModal >
    );
};

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
        marginBottom: 14,
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
        paddingBottom: 20,
    },
    formSection: {
        gap: 12,
    },
    inputField: {
        gap: 4,
    },
    labelContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingRight: 4,
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
    charCount: {
        fontSize: 10,
        fontWeight: '600',
    },
    inputBox: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 52,
        borderRadius: 14,
        paddingHorizontal: 14,
        borderWidth: 1,
    },
    textArea: {
        height: 100,
        alignItems: 'flex-start',
        paddingVertical: 12,
    },
    textInput: {
        flex: 1,
        fontSize: 14,
        fontWeight: '500',
    },
    dropdownTrigger: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 52,
        borderRadius: 14,
        paddingHorizontal: 14,
        borderWidth: 1,
    },
    triggerContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    triggerText: {
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
});

export default BusinessRegistrationModal;
