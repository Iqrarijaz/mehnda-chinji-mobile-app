import { BUSINESS_QUERY_KEYS, REGISTER_BUSINESS, UPDATE_BUSINESS } from '@/apis/business';
import { ThemedText } from '@/components/themed-text';
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
    View
} from 'react-native';
import Toast from 'react-native-toast-message';
import { ProfessionPicker } from '../common/ProfessionPicker';
import { toastConfig } from '../ToastConfig';

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
        mutationFn: REGISTER_BUSINESS,
        onSuccess: (res) => {
            if (res.success) {
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
        mutationFn: UPDATE_BUSINESS,
        onSuccess: (res) => {
            if (res.success) {
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
        const { name, category, phone, description, address } = data;
        if (!name || !category || !phone) {
            Toast.show({
                type: 'error',
                text1: 'Fields Required',
                text2: 'Please fill in all required fields.',
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

        if (description.length > 100) {
            Toast.show({
                type: 'error',
                text1: 'Description Too Long',
                text2: 'Description cannot exceed 100 characters.',
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
                                    <ThemedText style={[styles.charCount, data.name.length > 30 ? { color: '#ef4444' } : { color: colors.icon }]}>
                                        {data.name.length}/30
                                    </ThemedText>
                                </View>
                                <View style={[styles.inputBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC', borderColor: colors.border }]}>
                                    <Ionicons name="business" size={18} color={colors.icon} style={{ marginRight: 10 }} />
                                    <TextInput
                                        placeholder="e.g. Chinji Auto Repair"
                                        placeholderTextColor={colors.icon}
                                        style={[styles.textInput, { color: colors.text }]}
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
                                    style={[styles.dropdownTrigger, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC', borderColor: colors.border }]}
                                    onPress={() => setProfessionModalVisible(true)}
                                >
                                    <View style={styles.triggerContent}>
                                        <Ionicons name="construct" size={18} color={data.category ? colors.primary : colors.icon} style={{ marginRight: 10 }} />
                                        <ThemedText style={[styles.triggerText, !data.category ? { color: colors.icon } : { color: colors.text, textTransform: 'capitalize' }]}>
                                            {data.category ? `${data.category.name_eng} - ${data.category.name_ur} ` : 'Select Profession'}
                                        </ThemedText>
                                    </View>
                                    <Ionicons name="chevron-down" size={16} color={colors.icon} />
                                </TouchableOpacity>
                            </View>

                            {/* Address Input */}
                            <View style={styles.inputField}>
                                <ThemedText style={[styles.label, { color: colors.text }]}> ADDRESS</ThemedText>
                                <View style={[styles.inputBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC', borderColor: colors.border }]}>
                                    <Ionicons name="location" size={18} color={colors.icon} style={{ marginRight: 10 }} />
                                    <TextInput
                                        placeholder="Enter address or area"
                                        placeholderTextColor={colors.icon}
                                        style={[styles.textInput, { color: colors.text }]}
                                        value={data.address}
                                        onChangeText={(val) => handleInputChange('address', val)}
                                        autoCapitalize="words"
                                    />
                                </View>
                            </View>

                            {/* Phone Input */}
                            <View style={styles.inputField}>
                                <ThemedText style={[styles.label, { color: colors.text }]}>
                                    CONTACT PHONE <ThemedText style={styles.required}>*</ThemedText>
                                </ThemedText>
                                <View style={[styles.inputBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC', borderColor: colors.border }]}>
                                    <Ionicons name="call" size={18} color={colors.icon} style={{ marginRight: 10 }} />
                                    <TextInput
                                        placeholder="+92 300 1234567"
                                        placeholderTextColor={colors.icon}
                                        style={[styles.textInput, { color: colors.text }]}
                                        value={data.phone}
                                        onChangeText={(val) => handleInputChange('phone', val)}
                                        keyboardType="phone-pad"
                                    />
                                </View>
                            </View>

                            {/* Description */}
                            <View style={styles.inputField}>
                                <View style={styles.labelContainer}>
                                    <ThemedText style={[styles.label, { color: colors.text }]}>DESCRIPTION / SERVICES</ThemedText>
                                    <ThemedText style={[styles.charCount, data.description.length > 100 ? { color: '#ef4444' } : { color: colors.icon }]}>
                                        {data.description.length}/100
                                    </ThemedText>
                                </View>
                                <View style={[styles.inputBox, styles.textArea, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC', borderColor: colors.border }]}>
                                    <TextInput
                                        placeholder="Describe your services..."
                                        placeholderTextColor={colors.icon}
                                        style={[styles.textInput, { textAlignVertical: 'top', color: colors.text }]}
                                        value={data.description}
                                        onChangeText={(val) => handleInputChange('description', val)}
                                        multiline
                                        numberOfLines={4}
                                        maxLength={100}
                                    />
                                </View>
                            </View>

                            <TouchableOpacity
                                style={[styles.actionBtnWrapper]}
                                onPress={handleRegister}
                                disabled={isPending}
                            >
                                <LinearGradient
                                    colors={['#004030', '#004030']}
                                    style={styles.gradientBtn}
                                >
                                    {isPending ? (
                                        <ActivityIndicator size="small" color="#FFFFFF" />
                                    ) : (
                                        <ThemedText style={styles.btnText}>
                                            {editData ? 'UPDATE BUSINESS' : 'SUBMIT REGISTRATION'}
                                        </ThemedText>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
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
        </Modal >
    );
};

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
});

export default BusinessRegistrationModal;
