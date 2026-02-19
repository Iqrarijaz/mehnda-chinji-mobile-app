import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
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
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { SearchableDropdown } from '@/components/common/SearchableDropdown';
import citiesData from '@/data/cities.json';
import { SIGNUP } from '../../apis/login';
import { ThemedText } from '../../components/themed-text';
import { Colors } from '../../constants/colors';
import { useTheme } from '../../context/ThemeContext';

export default function RegisterScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { theme } = useTheme();

    const isDark = theme === 'dark';
    const colors = Colors[theme];

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        city: '',
        gender: '',
        password: '',
        confirmPassword: '',
        showPassword: false,
        loading: false,
        latitude: 0,
        longitude: 0,
    });

    const [cityModalVisible, setCityModalVisible] = useState(false);
    const [genderModalVisible, setGenderModalVisible] = useState(false);

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Toast.show({
                    type: 'error',
                    text1: 'Permission Denied',
                    text2: 'Permission to access location was denied',
                });
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            setFormData(prev => ({
                ...prev,
                latitude: location.coords.latitude,
                longitude: location.coords.longitude
            }));
        })();
    }, []);

    const genders = [
        { label: 'Male', value: 'MALE' },
        { label: 'Female', value: 'FEMALE' },
        { label: 'Other', value: 'OTHER' },
    ];

    const handleRegister = async () => {
        const { fullName, email, phone, city, gender, password, confirmPassword, latitude, longitude } = formData;

        if (!fullName || !email || !phone || !city || !gender || !password || !confirmPassword) {
            Toast.show({
                type: 'error',
                text1: 'Required Fields',
                text2: 'Please fill in all mandatory fields',
            });
            return;
        }

        if (phone.length !== 11) {
            Toast.show({
                type: 'error',
                text1: 'Invalid Phone',
                text2: 'Phone number must be exactly 11 digits',
            });
            return;
        }

        if (password !== confirmPassword) {
            Toast.show({
                type: 'error',
                text1: 'Password Mismatch',
                text2: 'The passwords you entered do not match',
            });
            return;
        }

        setFormData(prev => ({ ...prev, loading: true }));

        try {
            await SIGNUP({
                name: fullName,
                email,
                phone,
                city,
                gender,
                password,
                confirm: confirmPassword,
                location: {
                    type: "Point",
                    coordinates: [longitude, latitude] // Note: GeoJSON uses [long, lat]
                }
            });
            Toast.show({
                type: 'success',
                text1: 'Success!',
                text2: 'Account created successfully',
            });
            router.replace('/login' as any);
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: 'Registration Failed',
                text2: error?.response?.data?.message || error?.message || 'Something went wrong',
            });
        } finally {
            setFormData(prev => ({ ...prev, loading: false }));
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { backgroundColor: colors.background }]}
        >
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ flexGrow: 1, backgroundColor: colors.background, paddingBottom: 20 }}
                bounces={false}
            >
                {/* Header / Top Section */}
                <View style={[styles.headerSection, { paddingTop: insets.top, backgroundColor: '#004030' }]}>
                    <View style={styles.headerContent}>
                        <ThemedText style={styles.headerTitle}>Create an{"\n"}Account</ThemedText>
                        <ThemedText style={styles.headerSubtitle}>Join Mehnda Chinji Community today</ThemedText>
                    </View>
                </View>

                {/* Form Card */}
                <View style={styles.formContainer}>
                    <View style={[styles.formCard, { backgroundColor: colors.card }]}>
                        {/* Full Name */}
                        <View style={styles.inputField}>
                            <ThemedText style={[styles.label, isDark && { color: '#E2E8F0' }]}>FULL NAME <ThemedText style={styles.required}>*</ThemedText></ThemedText>
                            <View style={[styles.inputBox, {
                                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F8FAFC',
                                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0'
                            }]}>
                                <Ionicons name="person-outline" size={20} color={isDark ? 'rgba(255, 255, 255, 0.5)' : '#64748B'} style={{ marginRight: 12 }} />
                                <TextInput
                                    placeholder="Enter your full name"
                                    placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.4)' : '#94A3B8'}
                                    value={formData.fullName}
                                    onChangeText={(fullName: string) => setFormData(prev => ({ ...prev, fullName }))}
                                    style={[styles.input, { color: colors.text }]}
                                />
                            </View>
                        </View>

                        {/* Email */}
                        <View style={styles.inputField}>
                            <ThemedText style={[styles.label, isDark && { color: '#E2E8F0' }]}>EMAIL <ThemedText style={styles.required}>*</ThemedText></ThemedText>
                            <View style={[styles.inputBox, {
                                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F8FAFC',
                                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0'
                            }]}>
                                <Ionicons name="mail-outline" size={20} color={isDark ? 'rgba(255, 255, 255, 0.5)' : '#64748B'} style={{ marginRight: 12 }} />
                                <TextInput
                                    placeholder="Enter your email"
                                    placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.4)' : '#94A3B8'}
                                    value={formData.email}
                                    onChangeText={(email: string) => setFormData(prev => ({ ...prev, email }))}
                                    style={[styles.input, { color: colors.text }]}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>
                        </View>

                        {/* Phone */}
                        <View style={styles.inputField}>
                            <ThemedText style={[styles.label, isDark && { color: '#E2E8F0' }]}>PHONE <ThemedText style={styles.required}>*</ThemedText></ThemedText>
                            <View style={[styles.inputBox, {
                                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F8FAFC',
                                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0'
                            }]}>
                                <Ionicons name="call-outline" size={20} color={isDark ? 'rgba(255, 255, 255, 0.5)' : '#64748B'} style={{ marginRight: 12 }} />
                                <TextInput
                                    placeholder="03XXXXXXXXX"
                                    placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.4)' : '#94A3B8'}
                                    value={formData.phone}
                                    onChangeText={(phone: string) => setFormData(prev => ({ ...prev, phone: phone.replace(/[^0-9]/g, '') }))}
                                    style={[styles.input, { color: colors.text }]}
                                    keyboardType="phone-pad"
                                    maxLength={11}
                                />
                            </View>
                        </View>

                        {/* City */}
                        <View style={styles.inputField}>
                            <ThemedText style={[styles.label, isDark && { color: '#E2E8F0' }]}>CITY <ThemedText style={styles.required}>*</ThemedText></ThemedText>
                            <TouchableOpacity
                                style={[styles.inputBox, {
                                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F8FAFC',
                                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0'
                                }]}
                                onPress={() => setCityModalVisible(true)}
                            >
                                <Ionicons name="location-outline" size={20} color={isDark ? 'rgba(255, 255, 255, 0.5)' : '#64748B'} style={{ marginRight: 12 }} />
                                <ThemedText style={[styles.pickerText, {
                                    color: formData.city ? colors.text : (isDark ? 'rgba(255, 255, 255, 0.4)' : '#94A3B8'),
                                    flex: 1
                                }]}>
                                    {formData.city || 'Select City'}
                                </ThemedText>
                                <Ionicons name="chevron-down" size={18} color={isDark ? 'rgba(255, 255, 255, 0.3)' : '#64748B'} />
                            </TouchableOpacity>
                        </View>

                        {/* Gender */}
                        <View style={styles.inputField}>
                            <ThemedText style={[styles.label, isDark && { color: '#E2E8F0' }]}>GENDER <ThemedText style={styles.required}>*</ThemedText></ThemedText>
                            <TouchableOpacity
                                style={[styles.inputBox, {
                                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F8FAFC',
                                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0'
                                }]}
                                onPress={() => setGenderModalVisible(true)}
                            >
                                <Ionicons name="people-outline" size={20} color={isDark ? 'rgba(255, 255, 255, 0.5)' : '#64748B'} style={{ marginRight: 12 }} />
                                <ThemedText style={[styles.pickerText, {
                                    color: formData.gender ? colors.text : (isDark ? 'rgba(255, 255, 255, 0.4)' : '#94A3B8'),
                                    flex: 1
                                }]}>
                                    {formData.gender ? genders.find(g => g.value === formData.gender)?.label : 'Select Gender'}
                                </ThemedText>
                                <Ionicons name="chevron-down" size={18} color={isDark ? 'rgba(255, 255, 255, 0.3)' : '#64748B'} />
                            </TouchableOpacity>
                        </View>

                        {/* Password */}
                        <View style={styles.inputField}>
                            <ThemedText style={[styles.label, isDark && { color: '#E2E8F0' }]}>PASSWORD <ThemedText style={styles.required}>*</ThemedText></ThemedText>
                            <View style={[styles.inputBox, {
                                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F8FAFC',
                                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0'
                            }]}>
                                <Ionicons name="lock-closed-outline" size={20} color={isDark ? 'rgba(255, 255, 255, 0.5)' : '#64748B'} style={{ marginRight: 12 }} />
                                <TextInput
                                    placeholder="Enter your password"
                                    placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.4)' : '#94A3B8'}
                                    value={formData.password}
                                    onChangeText={(password: string) => setFormData(prev => ({ ...prev, password }))}
                                    style={[styles.input, { color: colors.text }]}
                                    secureTextEntry={!formData.showPassword}
                                />
                                <TouchableOpacity
                                    onPress={() => setFormData(prev => ({ ...prev, showPassword: !prev.showPassword }))}
                                >
                                    <Ionicons
                                        name={formData.showPassword ? 'eye-outline' : 'eye-off-outline'}
                                        size={20}
                                        color={isDark ? 'rgba(255, 255, 255, 0.5)' : '#64748B'}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Confirm Password */}
                        <View style={styles.inputField}>
                            <ThemedText style={[styles.label, isDark && { color: '#E2E8F0' }]}>CONFIRM PASSWORD <ThemedText style={styles.required}>*</ThemedText></ThemedText>
                            <View style={[styles.inputBox, {
                                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F8FAFC',
                                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0'
                            }]}>
                                <Ionicons name="lock-closed-outline" size={20} color={isDark ? 'rgba(255, 255, 255, 0.5)' : '#64748B'} style={{ marginRight: 12 }} />
                                <TextInput
                                    placeholder="Confirm your password"
                                    placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.4)' : '#94A3B8'}
                                    value={formData.confirmPassword}
                                    onChangeText={(confirmPassword: string) => setFormData(prev => ({ ...prev, confirmPassword }))}
                                    style={[styles.input, { color: colors.text }]}
                                    secureTextEntry={!formData.showPassword}
                                />
                            </View>
                        </View>

                        {/* Register Button */}
                        <TouchableOpacity
                            style={[styles.registerButton, { backgroundColor: '#004030' }]}
                            onPress={handleRegister}
                            disabled={formData.loading}
                        >
                            {formData.loading ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <ThemedText style={styles.registerButtonText}>Sign Up</ThemedText>
                            )}
                        </TouchableOpacity>

                        {/* Footer */}
                        <View style={styles.footer}>
                            <ThemedText style={[styles.footerText, { color: isDark ? 'rgba(255, 255, 255, 0.6)' : '#64748B' }]}>
                                Already have an account?{' '}
                            </ThemedText>
                            <TouchableOpacity onPress={() => router.push('/login' as any)}>
                                <ThemedText style={[styles.footerLink, { color: isDark ? '#FFFFFF' : '#004030', fontWeight: 'bold' }]}>Log In</ThemedText>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* City Selection Modal */}
            <SearchableDropdown
                visible={cityModalVisible}
                onClose={() => setCityModalVisible(false)}
                onSelect={(city) => setFormData(prev => ({ ...prev, city }))}
                currentValue={formData.city}
                options={citiesData}
                title="Select City"
                placeholder="Search city..."
            />

            {/* Gender Selection Modal */}
            <Modal
                visible={genderModalVisible}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setGenderModalVisible(false)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setGenderModalVisible(false)}
                >
                    <View style={[styles.genderModalContent, { backgroundColor: colors.card }]}>
                        <View style={styles.modalHeader}>
                            <ThemedText style={[styles.modalTitle, { color: colors.text }]}>Select Gender</ThemedText>
                        </View>
                        {genders.map((g) => (
                            <TouchableOpacity
                                key={g.value}
                                style={[styles.genderItem, {
                                    borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9'
                                }]}
                                onPress={() => {
                                    setFormData(prev => ({ ...prev, gender: g.value }));
                                    setGenderModalVisible(false);
                                }}
                            >
                                <ThemedText style={[styles.cityItemText, { color: colors.text }]}>{g.label}</ThemedText>
                                {formData.gender === g.value && (
                                    <Ionicons name="checkmark" size={20} color="#004030" />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </Pressable>
            </Modal>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerSection: {
        paddingBottom: 40,
        borderBottomLeftRadius: 36,
        borderBottomRightRadius: 36,
        overflow: 'hidden',
    },
    headerContent: {
        paddingHorizontal: 24,
        paddingTop: 40,
    },
    headerTitle: {
        fontSize: 28, // Reduced from 32
        fontWeight: '800',
        color: '#FFFFFF',
        lineHeight: 40,
        marginBottom: 8,
    },
    headerSubtitle: {
        fontSize: 15,
        color: 'rgba(255, 255, 255, 0.9)',
        lineHeight: 22,
    },
    formContainer: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 32,
        paddingBottom: 40,
    },
    formCard: {
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    inputField: {
        marginBottom: 26,
    },
    label: {
        fontSize: 11,
        fontWeight: '700',
        color: '#475569',
        letterSpacing: 0.5,
        marginBottom: 8,
        marginLeft: 2,
    },
    required: {
        color: '#EF4444',
    },
    inputBox: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 52,
        borderRadius: 14,
        paddingHorizontal: 14,
        borderWidth: 1,
    },
    input: {
        flex: 1,
        fontSize: 14,
        fontWeight: '500',
    },
    pickerText: {
        fontSize: 14,
        fontWeight: '500',
    },
    registerButton: {
        height: 52,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 20,
        overflow: 'hidden',
        shadowColor: '#004030',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    registerButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
    },
    footerText: {
        fontSize: 14,
        fontWeight: '500',
    },
    footerLink: {
        fontSize: 14,
        fontWeight: '700',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '800',
    },
    cityItemText: {
        fontSize: 16,
    },
    genderModalContent: {
        marginHorizontal: 20,
        marginBottom: 60,
        borderRadius: 24,
        padding: 24,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
    },
    genderItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
});
