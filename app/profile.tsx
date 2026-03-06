import { AUTH_QUERY_KEYS } from '@/apis/login';
import { updateProfile, uploadProfileImage, deleteProfileImage } from '@/apis/profile';
import { SearchableDropdown } from '@/components/common/searchableDropdown';
import { ProfileProgress } from '@/components/profile/ProfileProgress';
import { ThemedText } from '@/components/themedText';
import Avatar from '@/components/ui/avatar';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import citiesData from '@/data/cities.json';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { ErrorBoundary } from '@/components/common/errorBoundary';
import Animated, {

    FadeInDown,
    FadeInUp,
    useAnimatedStyle,
    useSharedValue,
    withSpring
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

export default function ProfileScreen() {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const { user, updateUser } = useAuth();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const queryClient = useQueryClient();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        gender: '',
        city: '',
        village: '',
        emailVerified: false,
        otpVerified: false,
    });

    const [cityPickerVisible, setCityPickerVisible] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [previewVisible, setPreviewVisible] = useState(false);
    const [isModified, setIsModified] = useState(false);

    const buttonScale = useSharedValue(1);

    useEffect(() => {
        if (user?.user) {
            const initialData = {
                name: user.user.name || '',
                email: user.user.email || '',
                phone: user.user.phone || '',
                gender: user.user.gender || '',
                city: user.user.city || '',
                village: user.user.village || '',
                emailVerified: user.user.emailVerified || false,
                otpVerified: user.user.otpVerified || false,
            };
            setFormData(initialData);
        }
    }, [user]);

    // Check for modifications to enable save button
    useEffect(() => {
        if (!user?.user) return;
        const currentData = {
            name: user.user.name || '',
            email: user.user.email || '',
            phone: user.user.phone || '',
            gender: user.user.gender || '',
            city: user.user.city || '',
            village: user.user.village || '',
            emailVerified: user.user.emailVerified || false,
            otpVerified: user.user.otpVerified || false,
        };
        const hasChanges = JSON.stringify(formData) !== JSON.stringify(currentData);
        setIsModified(hasChanges);
    }, [formData, user]);

    const calculatePercentage = () => {
        let pct = 50;
        if (formData.gender && formData.gender !== 'N/A') pct += 5;
        if (formData.city) pct += 5;
        if (formData.village) pct += 5;
        if (user?.user?.isBusiness) pct += 25;
        // Simplified mapping for UI (Donor logic might need backend fetch or flag)
        if (user?.user?.isDonor) pct += 10;
        return Math.min(pct, 100);
    };

    const remainingFields = () => {
        let count = 0;
        if (!formData.gender || formData.gender === 'N/A') count++;
        if (!formData.city) count++;
        if (!formData.village) count++;
        return count;
    };

    const profileMutation = useMutation({
        mutationFn: updateProfile,
        onSuccess: async (response) => {
            if (response) {
                await updateUser(response);
                queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.user });
                Toast.show({
                    type: 'success',
                    text1: 'Success!',
                    text2: 'Profile updated successfully',
                });
            }
        },
        onError: (error: any) => {
            Toast.show({
                type: 'error',
                text1: 'Update Failed',
                text2: error?.response?.data?.message || 'Something went wrong',
            });
        }
    });

    const uploadImageMutation = useMutation({
        mutationFn: uploadProfileImage,
        onSuccess: async (response) => {
            const newUrl = response?.data?.profileImage;
            if (newUrl) {
                await updateUser({ profileImage: newUrl });
                queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.user });
                Toast.show({ type: 'success', text1: 'Success', text2: 'Profile image updated' });
            }
        },
        onError: (error: any) => {
            Toast.show({ type: 'error', text1: 'Upload Failed', text2: 'Failed to upload image' });
        }
    });

    const pickImage = async () => {
        // Request media library permissions
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== 'granted') {
            Toast.show({
                type: 'error',
                text1: 'Permission Denied',
                text2: 'We need gallery permissions to update your profile picture.'
            });
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: 'images',
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            const asset = result.assets[0];
            const formData = new FormData();

            // Extract file extension
            const uriParts = asset.uri.split('.');
            const fileType = uriParts[uriParts.length - 1];

            const file: any = {
                uri: asset.uri,
                name: `profile_${user?.user?.id || Date.now()}.${fileType}`,
                type: `image/${fileType}`,
            };

            formData.append('image', file);
            uploadImageMutation.mutate(formData);
        }
    };

    const deleteImageMutation = useMutation({
        mutationFn: deleteProfileImage,
        onSuccess: async () => {
            await updateUser({ profileImage: null });
            queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.user });
            Toast.show({ type: 'success', text1: 'Success', text2: 'Profile image removed' });
        },
        onError: (error: any) => {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.response?.data?.message || 'Failed to remove image'
            });
        }
    });

    const handleUpdate = () => {
        buttonScale.value = withSpring(0.9, { damping: 10 }, () => {
            buttonScale.value = withSpring(1);
        });

        if (!formData.name || !formData.phone || !formData.city) {
            Toast.show({ type: 'error', text1: 'Required', text2: 'Name, Phone and City are required' });
            return;
        }

        // Phone validation logic
        const cleanPhone = formData.phone.replace(/[^\d+]/g, '');
        let isValid = false;
        let errorMsg = '';

        if (cleanPhone.startsWith('03')) {
            isValid = cleanPhone.length === 11;
            errorMsg = 'Phone starting with 03 must be 11 digits';
        } else if (cleanPhone.startsWith('+92')) {
            isValid = cleanPhone.length === 13;
            errorMsg = 'Phone starting with +92 must be 13 characters';
        } else {
            // Generic international validation
            const phoneRegex = /^\+(?:[0-9] ?){1,4}[0-9]{4,15}$/;
            isValid = phoneRegex.test(cleanPhone) && cleanPhone.length >= 8;
            errorMsg = 'Invalid phone format. Use +[country code][number]';
        }

        if (!isValid) {
            Toast.show({
                type: 'error',
                text1: 'Invalid Phone',
                text2: errorMsg
            });
            return;
        }

        profileMutation.mutate(formData);
    };

    const handleBack = () => {
        if (router.canGoBack()) router.back();
        else router.replace('/(tabs)');
    };

    const animatedButtonStyle = useAnimatedStyle(() => ({
        transform: [{ scale: buttonScale.value }]
    }));

    return (
        <ErrorBoundary>
            <View style={[styles.container, { backgroundColor: theme === 'dark' ? '#0F172A' : '#F5F6FA' }]}>
                {/* Animated Header */}
                <Animated.View entering={FadeInUp.duration(600)} style={styles.header}>
                    <LinearGradient
                        colors={[colors.primary, '#0D9488']}
                        style={StyleSheet.absoluteFill}
                    />
                    <View style={[styles.headerTop, { paddingTop: insets.top + 10 }]}>
                        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                        <ThemedText style={styles.headerTitle}>Update Profile</ThemedText>
                        <View style={{ width: 44 }} />
                    </View>

                    <View style={styles.avatarContainer}>
                        <View style={styles.imageWrapper}>
                            {uploadImageMutation.isPending ? (
                                <View style={styles.loaderOverlay}>
                                    <ActivityIndicator color="#FFFFFF" />
                                </View>
                            ) : (
                                <TouchableOpacity activeOpacity={0.9} onPress={() => setPreviewVisible(true)}>
                                    <Avatar uri={user?.user?.profileImage} name={user?.user?.name} size={80} style={styles.avatar} />
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity style={styles.cameraIcon} onPress={pickImage}>
                                <Ionicons name="camera" size={16} color="#FFFFFF" />
                            </TouchableOpacity>

                            {user?.user?.profileImage && !uploadImageMutation.isPending && (
                                <TouchableOpacity
                                    style={styles.deleteIcon}
                                    onPress={() => deleteImageMutation.mutate()}
                                    disabled={deleteImageMutation.isPending}
                                >
                                    {deleteImageMutation.isPending ? (
                                        <ActivityIndicator size="small" color="#FFFFFF" />
                                    ) : (
                                        <Ionicons name="trash" size={14} color="#FFFFFF" />
                                    )}
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                    <ThemedText style={styles.welcomeText}>Complete Your Profile</ThemedText>
                    <ThemedText style={styles.subtitleText}>Maintain your profile for better community trust</ThemedText>
                </Animated.View>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
                    keyboardVerticalOffset={Platform.OS === 'android' ? 0 : 0}
                    style={{ flex: 1 }}
                >
                    <ScrollView
                        contentContainerStyle={[
                            styles.scrollContent,
                            { paddingBottom: Platform.OS === 'android' ? 160 : 140 }
                        ]}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >

                        {/* Progress Component */}
                        <Animated.View entering={FadeInDown.delay(200).duration(600)}>
                            <ProfileProgress percentage={calculatePercentage()} remainingFields={remainingFields()} />
                        </Animated.View>

                        {/* Form Sections */}
                        <View style={styles.formContainer}>

                            {/* Name Field */}
                            <Animated.View entering={FadeInDown.delay(300)} style={styles.fieldCard}>
                                <ThemedText style={styles.fieldLabel}>Full Name</ThemedText>
                                <View style={styles.inputWrapper}>
                                    <Ionicons name="person-outline" size={20} color="#94A3B8" />
                                    <TextInput
                                        value={formData.name}
                                        onChangeText={(val) => setFormData(p => ({ ...p, name: val }))}
                                        style={styles.input}
                                        placeholder="Enter your name"
                                    />
                                </View>
                            </Animated.View>

                            {/* Email Field (ReadOnly) */}
                            <Animated.View entering={FadeInDown.delay(350)} style={[styles.fieldCard, { backgroundColor: '#F8FAFC' }]}>
                                <View style={styles.labelRow}>
                                    <ThemedText style={styles.fieldLabel}>Email Address</ThemedText>
                                    <View style={[styles.badge, formData.emailVerified ? styles.verifiedBadge : styles.unverifiedBadge]}>
                                        <Ionicons name={formData.emailVerified ? "checkmark-circle" : "alert-circle"} size={12} color={formData.emailVerified ? "#10B981" : "#F59E0B"} />
                                        <ThemedText style={[styles.badgeText, { color: formData.emailVerified ? "#10B981" : "#F59E0B" }]}>
                                            {formData.emailVerified ? "Verified" : "Unverified"}
                                        </ThemedText>
                                    </View>
                                </View>
                                <View style={styles.inputWrapper}>
                                    <Ionicons name="mail-outline" size={20} color="#94A3B8" />
                                    <TextInput
                                        value={formData.email}
                                        editable={false}
                                        style={[styles.input, { color: '#64748B' }]}
                                    />
                                    <Ionicons name="lock-closed-outline" size={16} color="#94A3B8" />
                                </View>
                            </Animated.View>

                            {/* Phone Field */}
                            <Animated.View entering={FadeInDown.delay(400)} style={styles.fieldCard}>
                                <View style={styles.labelRow}>
                                    <ThemedText style={styles.fieldLabel}>Phone Number</ThemedText>
                                    <View style={[styles.badge, formData.otpVerified ? styles.verifiedBadge : styles.unverifiedBadge]}>
                                        <Ionicons name={formData.otpVerified ? "checkmark-circle" : "alert-circle"} size={12} color={formData.otpVerified ? "#10B981" : "#F59E0B"} />
                                        <ThemedText style={[styles.badgeText, { color: formData.otpVerified ? "#10B981" : "#F59E0B" }]}>
                                            {formData.otpVerified ? "Verified" : "Unverified"}
                                        </ThemedText>
                                    </View>
                                </View>
                                <View style={styles.inputWrapper}>
                                    <Ionicons name="call-outline" size={20} color="#94A3B8" />
                                    <TextInput
                                        value={formData.phone}
                                        onChangeText={(val) => setFormData(p => ({ ...p, phone: val }))}
                                        style={styles.input}
                                        placeholder="+923001234567"
                                        keyboardType="phone-pad"
                                    />
                                </View>
                            </Animated.View>

                            {/* Gender Selector */}
                            <Animated.View entering={FadeInDown.delay(450)} style={styles.fieldCard}>
                                <ThemedText style={styles.fieldLabel}>Gender</ThemedText>
                                <View style={styles.genderRow}>
                                    <TouchableOpacity
                                        onPress={() => setFormData(p => ({ ...p, gender: 'MALE' }))}
                                        style={[styles.genderPill, formData.gender?.toUpperCase() === 'MALE' && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                                    >
                                        <Ionicons name="male" size={18} color={formData.gender?.toUpperCase() === 'MALE' ? '#FFF' : '#64748B'} />
                                        <ThemedText style={[styles.genderText, formData.gender?.toUpperCase() === 'MALE' && { color: '#FFF' }]}>Male</ThemedText>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => setFormData(p => ({ ...p, gender: 'FEMALE' }))}
                                        style={[styles.genderPill, formData.gender?.toUpperCase() === 'FEMALE' && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                                    >
                                        <Ionicons name="female" size={18} color={formData.gender?.toUpperCase() === 'FEMALE' ? '#FFF' : '#64748B'} />
                                        <ThemedText style={[styles.genderText, formData.gender?.toUpperCase() === 'FEMALE' && { color: '#FFF' }]}>Female</ThemedText>
                                    </TouchableOpacity>
                                </View>
                            </Animated.View>

                            {/* City Picker */}
                            <Animated.View entering={FadeInDown.delay(500)} style={styles.fieldCard}>
                                <ThemedText style={styles.fieldLabel}>City</ThemedText>
                                <TouchableOpacity onPress={() => setCityPickerVisible(true)} style={styles.inputWrapper}>
                                    <Ionicons name="location-outline" size={20} color="#94A3B8" />
                                    <ThemedText style={styles.inputText}>{formData.city || "Select your city"}</ThemedText>
                                    <Ionicons name="chevron-down" size={18} color="#94A3B8" />
                                </TouchableOpacity>
                            </Animated.View>

                            {/* Village Field */}
                            <Animated.View entering={FadeInDown.delay(550)} style={styles.fieldCard}>
                                <ThemedText style={styles.fieldLabel}>Village / Town</ThemedText>
                                <View style={styles.inputWrapper}>
                                    <Ionicons name="business-outline" size={20} color="#94A3B8" />
                                    <TextInput
                                        value={formData.village}
                                        onChangeText={(val) => setFormData(p => ({ ...p, village: val }))}
                                        style={styles.input}
                                        placeholder="Enter your village/town"
                                    />
                                </View>
                            </Animated.View>

                            {/* Why complete profile? */}
                            <View style={styles.infoTip}>
                                <Ionicons name="information-circle-outline" size={16} color="#64748B" />
                                <ThemedText style={styles.infoText}>A complete profile helps other community members find you more easily.</ThemedText>
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>

                {/* Sticky Footer Button */}
                <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                    <Animated.View style={animatedButtonStyle}>
                        <TouchableOpacity
                            style={[styles.updateButton, !isModified && { opacity: 0.6 }]}
                            onPress={handleUpdate}
                            disabled={!isModified || profileMutation.isPending}
                        >
                            <LinearGradient colors={['#0D9488', '#0F766E']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
                            {profileMutation.isPending ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <View style={styles.buttonContent}>
                                    <ThemedText style={styles.updateButtonText}>Update Profile</ThemedText>
                                    <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                                </View>
                            )}
                        </TouchableOpacity>
                    </Animated.View>
                </View>

                <SearchableDropdown
                    visible={cityPickerVisible}
                    onClose={() => setCityPickerVisible(false)}
                    onSelect={(city) => setFormData(prev => ({ ...prev, city }))}
                    currentValue={formData.city}
                    options={citiesData}
                    title="Select City"
                    placeholder="Search city..."
                />
            </View >
        </ErrorBoundary>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        height: Platform.OS === 'android' ? 260 : 280,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        overflow: 'hidden',
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
        textAlign: 'center',
    },
    avatarContainer: {
        alignItems: 'center',
        marginTop: 4,
        marginBottom: 4,
    },
    imageWrapper: {
        position: 'relative',
        padding: 3,
        borderRadius: 45,
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    avatar: {
        borderRadius: 40,
        borderWidth: 2.5,
        borderColor: '#FFFFFF',
    },
    cameraIcon: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        backgroundColor: '#0D9488',
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    deleteIcon: {
        position: 'absolute',
        bottom: -2,
        left: -2,
        backgroundColor: '#EF4444',
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    loaderOverlay: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    welcomeText: {
        fontSize: 18,
        fontWeight: '800',
        color: '#FFFFFF',
        marginTop: 6,
        marginBottom: 6,
        textAlign: 'center',
    },
    subtitleText: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 2,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    scrollContent: {
        paddingBottom: 140,
    },
    formContainer: {
        paddingHorizontal: 20,
        marginTop: 20,
    },
    fieldCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 10,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    fieldLabel: {
        fontSize: Platform.OS === 'android' ? 11 : 13,
        fontWeight: '700',
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
    },
    verifiedBadge: {
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
    },
    unverifiedBadge: {
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        height: Platform.OS === 'android' ? 44 : 48,
        gap: 12,
    },
    input: {
        flex: 1,
        fontSize: Platform.OS === 'android' ? 14 : 16,
        color: '#1E293B',
        fontWeight: '500',
    },
    inputText: {
        flex: 1,
        fontSize: Platform.OS === 'android' ? 14 : 16,
        color: '#1E293B',
        fontWeight: '500',
    },
    genderRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 4,
    },
    genderPill: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: Platform.OS === 'android' ? 42 : 46,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        gap: 8,
    },
    genderText: {
        fontSize: Platform.OS === 'android' ? 13 : 15,
        fontWeight: '600',
        color: '#64748B',
    },
    infoTip: {
        flexDirection: 'row',
        gap: 8,
        paddingHorizontal: 8,
        marginTop: 4,
        alignItems: 'center',
    },
    infoText: {
        fontSize: 12,
        color: '#64748B',
        flex: 1,
        lineHeight: 18,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
        backgroundColor: 'rgba(245, 246, 250, 0.95)',
        paddingTop: Platform.OS === 'android' ? 10 : 12,
        paddingBottom: Platform.OS === 'android' ? 10 : 12,
    },
    updateButton: {
        height: Platform.OS === 'android' ? 44 : 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        shadowColor: '#0D9488',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    updateButtonText: {
        fontSize: Platform.OS === 'android' ? 14 : 15,
        fontWeight: '700',
        color: '#FFFFFF',
    }
});

