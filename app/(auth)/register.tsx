import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
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

import { SIGNUP } from '../../apis/login';
import { CityPicker } from '../../components/CityPicker';
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
    });

    const [cityModalVisible, setCityModalVisible] = useState(false);
    const [genderModalVisible, setGenderModalVisible] = useState(false);

    const genders = [
        { label: 'Male', value: 'MALE' },
        { label: 'Female', value: 'FEMALE' },
        { label: 'Other', value: 'OTHER' },
    ];

    const handleRegister = async () => {
        const { fullName, email, phone, city, gender, password, confirmPassword } = formData;

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
            style={styles.container}
        >
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ flexGrow: 1 }}
                bounces={false}
            >
                {/* Header / Top Section */}
                <View style={[styles.headerSection, { paddingTop: insets.top }]}>
                    <LinearGradient
                        colors={['#1e293b', '#0F172A']}
                        style={StyleSheet.absoluteFill}
                    />
                    {/* Specular Edge Highlight */}
                    <LinearGradient
                        colors={['rgba(255, 255, 255, 0.2)', 'transparent']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        style={styles.glassEdge}
                    />
                    <View style={styles.headerContent}>
                        <ThemedText style={styles.headerTitle}>Create an{"\n"}Account</ThemedText>
                        {/* <ThemedText style={styles.headerSubtitle}>Join Mehnda Chinji Community today</ThemedText> */}
                    </View>
                </View>

                {/* Bottom Section / Card Container */}
                <View style={styles.bottomSection}>
                    <View style={styles.card}>
                        {/* Card Specular Highlight */}
                        <LinearGradient
                            colors={['rgba(255, 255, 255, 0.15)', 'transparent']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 0, y: 1 }}
                            style={styles.cardGlassEdge}
                        />

                        {/* Form Fields */}
                        <View style={styles.formSection}>
                            {/* Full Name */}
                            <View style={[styles.inputGroup, { borderBottomColor: 'rgba(255, 255, 255, 0.1)' }]}>
                                <Ionicons name="person-outline" size={20} color="rgba(255, 255, 255, 0.5)" style={{ marginRight: 12 }} />
                                <TextInput
                                    placeholder="Full Name"
                                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                                    value={formData.fullName}
                                    onChangeText={(fullName: string) => setFormData(prev => ({ ...prev, fullName }))}
                                    style={styles.input}
                                />
                            </View>

                            {/* Email */}
                            <View style={[styles.inputGroup, { borderBottomColor: 'rgba(255, 255, 255, 0.1)' }]}>
                                <Ionicons name="mail-outline" size={20} color="rgba(255, 255, 255, 0.5)" style={{ marginRight: 12 }} />
                                <TextInput
                                    placeholder="Email"
                                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                                    value={formData.email}
                                    onChangeText={(email: string) => setFormData(prev => ({ ...prev, email }))}
                                    style={styles.input}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>

                            {/* Phone */}
                            <View style={[styles.inputGroup, { borderBottomColor: 'rgba(255, 255, 255, 0.1)' }]}>
                                <Ionicons name="call-outline" size={20} color="rgba(255, 255, 255, 0.5)" style={{ marginRight: 12 }} />
                                <TextInput
                                    placeholder="Phone (03XXXXXXXXX)"
                                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                                    value={formData.phone}
                                    onChangeText={(phone: string) => setFormData(prev => ({ ...prev, phone: phone.replace(/[^0-9]/g, '') }))}
                                    style={styles.input}
                                    keyboardType="phone-pad"
                                    maxLength={11}
                                />
                            </View>

                            {/* City */}
                            <TouchableOpacity
                                style={[styles.inputGroup, { borderBottomColor: 'rgba(255, 255, 255, 0.1)' }]}
                                onPress={() => setCityModalVisible(true)}
                            >
                                <Ionicons name="location-outline" size={20} color="rgba(255, 255, 255, 0.5)" style={{ marginRight: 12 }} />
                                <ThemedText style={[styles.pickerText, { color: formData.city ? '#FFFFFF' : 'rgba(255, 255, 255, 0.4)' }]}>
                                    {formData.city || 'Select City'}
                                </ThemedText>
                                <Ionicons name="chevron-down" size={18} color="rgba(255, 255, 255, 0.3)" />
                            </TouchableOpacity>

                            {/* Gender */}
                            <TouchableOpacity
                                style={[styles.inputGroup, { borderBottomColor: 'rgba(255, 255, 255, 0.1)' }]}
                                onPress={() => setGenderModalVisible(true)}
                            >
                                <Ionicons name="people-outline" size={20} color="rgba(255, 255, 255, 0.5)" style={{ marginRight: 12 }} />
                                <ThemedText style={[styles.pickerText, { color: formData.gender ? '#FFFFFF' : 'rgba(255, 255, 255, 0.4)' }]}>
                                    {formData.gender ? genders.find(g => g.value === formData.gender)?.label : 'Select Gender'}
                                </ThemedText>
                                <Ionicons name="chevron-down" size={18} color="rgba(255, 255, 255, 0.3)" />
                            </TouchableOpacity>

                            {/* Password */}
                            <View style={[styles.inputGroup, { borderBottomColor: 'rgba(255, 255, 255, 0.1)' }]}>
                                <Ionicons name="lock-closed-outline" size={20} color="rgba(255, 255, 255, 0.5)" style={{ marginRight: 12 }} />
                                <TextInput
                                    placeholder="Password"
                                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                                    value={formData.password}
                                    onChangeText={(password: string) => setFormData(prev => ({ ...prev, password }))}
                                    style={styles.input}
                                    secureTextEntry={!formData.showPassword}
                                />
                                <TouchableOpacity
                                    onPress={() => setFormData(prev => ({ ...prev, showPassword: !prev.showPassword }))}
                                >
                                    <Ionicons
                                        name={formData.showPassword ? 'eye-outline' : 'eye-off-outline'}
                                        size={20}
                                        color="rgba(255, 255, 255, 0.5)"
                                    />
                                </TouchableOpacity>
                            </View>

                            {/* Confirm Password */}
                            <View style={styles.inputGroup}>
                                <Ionicons name="lock-closed-outline" size={20} color="rgba(255, 255, 255, 0.5)" style={{ marginRight: 12 }} />
                                <TextInput
                                    placeholder="Confirm Password"
                                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                                    value={formData.confirmPassword}
                                    onChangeText={(confirmPassword: string) => setFormData(prev => ({ ...prev, confirmPassword }))}
                                    style={styles.input}
                                    secureTextEntry={!formData.showPassword}
                                />
                            </View>
                        </View>

                        {/* Register Button */}
                        <TouchableOpacity
                            style={styles.registerButton}
                            onPress={handleRegister}
                            disabled={formData.loading}
                        >
                            <LinearGradient
                                colors={['#FF9B51', '#FF8E3D']}
                                style={StyleSheet.absoluteFill}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 0, y: 1 }}
                            />
                            {formData.loading ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <ThemedText style={styles.registerButtonText}>Sign Up</ThemedText>
                            )}
                        </TouchableOpacity>

                        {/* Divider */}
                        <View style={styles.dividerContainer}>
                            <View style={styles.divider} />
                            <ThemedText style={styles.dividerText}>or</ThemedText>
                            <View style={styles.divider} />
                        </View>

                        {/* Google Sign Up */}
                        <TouchableOpacity
                            style={styles.googleButton}
                            onPress={() => Alert.alert('Google Sign Up', 'Implementation coming soon!')}
                        >
                            <Image
                                source={require('../../assets/icons/google.png')}
                                style={styles.googleIcon}
                            />
                            <ThemedText style={styles.googleButtonText}>
                                Continue with Google
                            </ThemedText>
                        </TouchableOpacity>

                        {/* Footer */}
                        <View style={styles.footer}>
                            <ThemedText style={styles.footerText}>Already have an account? </ThemedText>
                            <TouchableOpacity onPress={() => router.push('/login' as any)}>
                                <ThemedText style={styles.footerLink}>Log In</ThemedText>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* City Selection Modal */}
            <CityPicker
                visible={cityModalVisible}
                onClose={() => setCityModalVisible(false)}
                onSelect={(city) => setFormData(prev => ({ ...prev, city }))}
                currentCity={formData.city}
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
                    <View style={styles.genderModalContent}>
                        <LinearGradient
                            colors={['#1e293b', '#0F172A']}
                            style={StyleSheet.absoluteFill}
                        />
                        <View style={styles.modalHeader}>
                            <ThemedText style={styles.modalTitle}>Select Gender</ThemedText>
                        </View>
                        {genders.map((g) => (
                            <TouchableOpacity
                                key={g.value}
                                style={styles.genderItem}
                                onPress={() => {
                                    setFormData(prev => ({ ...prev, gender: g.value }));
                                    setGenderModalVisible(false);
                                }}
                            >
                                <ThemedText style={styles.cityItemText}>{g.label}</ThemedText>
                                {formData.gender === g.value && (
                                    <Ionicons name="checkmark" size={20} color="#FF9B51" />
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
        backgroundColor: '#0F172A',
    },
    glassEdge: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        zIndex: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
    },
    headerSection: {
        height: 240,
        width: '100%',
    },
    headerContent: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 30,
        zIndex: 1,
    },
    headerTitle: {
        fontSize: 36,
        fontWeight: '800',
        color: '#FFFFFF',
        lineHeight: 44,
        marginBottom: 8,
    },
    headerSubtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.6)',
        lineHeight: 22,
    },
    bottomSection: {
        flex: 1,
        width: '100%',
        alignItems: 'center',
        paddingBottom: 40,
        backgroundColor: '#0F172A',
    },
    card: {
        width: '90%',
        maxWidth: 420,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 28,
        padding: 24,
        marginTop: -50, // Overlap effect
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        overflow: 'hidden',
    },
    cardGlassEdge: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 1.5,
    },
    formSection: {
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        overflow: 'hidden',
        marginBottom: 20,
    },
    inputGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 56,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: '#FFFFFF',
    },
    pickerText: {
        flex: 1,
        fontSize: 15,
    },
    registerButton: {
        height: 56,
        borderRadius: 18,
        backgroundColor: '#FF9B51',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        overflow: 'hidden',
        shadowColor: '#FF9B51',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    registerButtonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '800',
        zIndex: 1,
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 24,
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    dividerText: {
        marginHorizontal: 16,
        color: 'rgba(255, 255, 255, 0.4)',
        fontSize: 14,
        fontWeight: '500',
    },
    googleButton: {
        flexDirection: 'row',
        height: 56,
        borderRadius: 28,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
        marginBottom: 24,
    },
    googleIcon: {
        width: 24,
        height: 24,
    },
    googleButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 4,
    },
    footerText: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.5)',
    },
    footerLink: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FF9B51',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        height: '80%',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        padding: 24,
        overflow: 'hidden',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        zIndex: 1,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        height: 52,
        borderRadius: 16,
        paddingHorizontal: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        zIndex: 1,
    },
    searchInput: {
        flex: 1,
        marginLeft: 12,
        fontSize: 16,
        color: '#FFFFFF',
    },
    cityItem: {
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    cityItemText: {
        fontSize: 16,
        color: '#FFFFFF',
    },
    genderModalContent: {
        marginHorizontal: 20,
        marginBottom: 60,
        borderRadius: 28,
        padding: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    genderItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 18,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
});
