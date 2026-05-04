import { AUTH_QUERY_KEYS } from '@/apis/login';
import { uploadProfileImage, deleteProfileImage, updateProfile } from '@/apis/profile';
import { getAuthenticatedConfiguration, CONFIG_QUERY_KEYS } from '@/apis/configuration';
import { analyticsService, AnalyticsEvents } from '@/analytics';
import { profileSchema } from '@/utils/validation';
import { SearchableDropdown } from '@/components/common/SearchableDropdown';
import { ImageViewerModal } from '@/components/common/ImageViewerModal';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar';
import { ThemedText } from '@/components/themedText';
import Avatar from '@/components/ui/avatar';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import citiesDataFallback from '@/data/cities.json';
import villagesDataFallback from '@/data/villages.json';
import { Ionicons } from '@expo/vector-icons';
import { useBackHandler } from '@/hooks/useBackHandler';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';

import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState, useMemo } from 'react';
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
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
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

    // Fetch cities and villages dynamically from configuration API
    const { data: citiesConfigData } = useQuery({
        queryKey: CONFIG_QUERY_KEYS.cities,
        queryFn: () => getAuthenticatedConfiguration('CITIES'),
        staleTime: 1000 * 60 * 60 * 24, // 24 hours
    });

    const { data: villagesConfigData } = useQuery({
        queryKey: CONFIG_QUERY_KEYS.villages,
        queryFn: () => getAuthenticatedConfiguration('VILLAGES'),
        staleTime: 1000 * 60 * 60 * 24, // 24 hours
    });

    // Use API data with fallback to static JSON
    const citiesData: string[] = citiesConfigData?.data?.data || citiesDataFallback;
    const villagesData: string[] = villagesConfigData?.data?.data || villagesDataFallback;

    const buttonScale = useSharedValue(1);

    const toTitleCase = useCallback((str: string) => {
        if (!str) return '';
        return str.toLowerCase().replace(/\b\w/g, s => s.toUpperCase());
    }, []);

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
    const [villagePickerVisible, setVillagePickerVisible] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [previewVisible, setPreviewVisible] = useState(false);

    // Derive stable baseline data from user object
    const currentData = useMemo(() => {
        return {
            name: toTitleCase(user?.user?.name || ''),
            email: user?.user?.email || '',
            phone: user?.user?.phone || '',
            gender: user?.user?.gender || '',
            city: user?.user?.city || '',
            village: toTitleCase(user?.user?.village || ''),
            emailVerified: user?.user?.emailVerified || false,
            otpVerified: user?.user?.otpVerified || false,
        };
    }, [user, toTitleCase]);

    // Initialize form only when currentData changes (e.g., initial load or backend refresh)
    useEffect(() => {
        setFormData(currentData);
    }, [currentData]);

    // Derive isModified during render (O(1) superficial check instead of JSON.stringify)
    const isModified =
        formData.name !== currentData.name ||
        formData.phone !== currentData.phone ||
        formData.gender !== currentData.gender ||
        formData.city !== currentData.city ||
        formData.village !== currentData.village;

    const calculatePercentage = useCallback(() => {
        let pct = 50;
        if (formData.gender && formData.gender !== 'N/A') pct += 5;
        if (formData.city) pct += 5;
        if (formData.village) pct += 5;
        if (user?.user?.isBusiness) pct += 25;
        // Simplified mapping for UI (Donor logic might need backend fetch or flag)
        if (user?.user?.isDonor) pct += 10;
        return Math.min(pct, 100);
    }, [formData.gender, formData.city, formData.village, user?.user?.isBusiness, user?.user?.isDonor]);

    const remainingFields = useCallback(() => {
        let count = 0;
        if (!formData.gender || formData.gender === 'N/A') count++;
        if (!formData.city) count++;
        if (!formData.village) count++;
        return count;
    }, [formData.gender, formData.city, formData.village]);

    const profileMutation = useMutation({
        mutationFn: updateProfile,
        onSuccess: async (response) => {
            if (response) {
                analyticsService.trackEvent(AnalyticsEvents.PROFILE_UPDATED);
                await updateUser(response);
                queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.user });
                Toast.show({
                    type: 'success',
                    text1: 'Success!',
                    text2: 'Profile updated successfully',
                });
                router.replace('/(drawer)/(tabs)' as any);
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
                analyticsService.trackEvent(AnalyticsEvents.AVATAR_CHANGED, { action: 'upload' });
                await updateUser({ profileImage: newUrl });
                queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.user });
                Toast.show({ type: 'success', text1: 'Success', text2: 'Profile image updated' });
            }
        },
        onError: (error: any) => {
            Toast.show({ type: 'error', text1: 'Upload Failed', text2: 'Failed to upload image' });
        }
    });

    const pickImage = useCallback(async () => {
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
            const uploadFormData = new FormData();

            // Extract file extension
            const uriParts = asset.uri.split('.');
            const fileType = uriParts[uriParts.length - 1];

            const file: any = {
                uri: asset.uri,
                name: `profile_${user?.user?._id || Date.now()}.${fileType}`,
                type: `image/${fileType}`,
            };

            uploadFormData.append('image', file);
            uploadImageMutation.mutate(uploadFormData);
        }
    }, [user?.user?._id, uploadImageMutation]);

    const deleteImageMutation = useMutation({
        mutationFn: deleteProfileImage,
        onSuccess: async () => {
            analyticsService.trackEvent(AnalyticsEvents.AVATAR_CHANGED, { action: 'delete' });
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



    const handleUpdate = useCallback(async () => {
        buttonScale.value = withSpring(0.9, { damping: 10 }, () => {
            buttonScale.value = withSpring(1);
        });

        try {
            await profileSchema.validate(formData);
            profileMutation.mutate({
                ...formData,
                gender: formData.gender || null
            });
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: 'Validation Error',
                text2: error.message
            });
        }
    }, [formData, profileMutation, buttonScale]);

    const handleBack = () => {
        if (router.canGoBack()) router.back();
        else router.replace('/(drawer)/(tabs)' as any);
        return true; // Indicate handled
    };

    useBackHandler(handleBack);

    const animatedButtonStyle = useAnimatedStyle(() => ({
        transform: [{ scale: buttonScale.value }]
    }));

    return (
        <ErrorBoundary>
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                {/* Animated Header */}
                <Animated.View entering={FadeInUp.duration(600)} style={styles.header}>
                    <LinearGradient
                        colors={[colors.primary, '#0D9488']}
                        style={StyleSheet.absoluteFill}
                    />
                    <View style={[styles.headerTop, { paddingTop: insets.top + 10 }]}>
                        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color={theme === 'dark' ? colors.text : '#FFFFFF'} />
                        </TouchableOpacity>
                        <ThemedText style={[styles.headerTitle, { color: theme === 'dark' ? colors.text : '#FFFFFF' }]}>Update Profile</ThemedText>
                        <View style={{ width: 44 }} />
                    </View>

                    <ProfileAvatar
                        uri={user?.user?.profileImage}
                        name={user?.user?.name}
                        isUploading={uploadImageMutation.isPending}
                        isDeleting={deleteImageMutation.isPending}
                        onPickImage={pickImage}
                        onDeleteImage={() => deleteImageMutation.mutate()}
                        onPreviewOpen={() => setPreviewVisible(true)}
                    />
                    <ThemedText style={[styles.welcomeText, { color: theme === 'dark' ? colors.text : '#FFFFFF' }]}>Complete Your Profile</ThemedText>
                    <ThemedText style={[styles.subtitleText, { color: theme === 'dark' ? colors.textSecondary : 'rgba(255,255,255,0.8)' }]}>Maintain your profile for better community trust</ThemedText>
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
                        {/* <Animated.View entering={FadeInDown.delay(200).duration(600)}>
                            <ProfileProgress percentage={calculatePercentage()} remainingFields={remainingFields()} />
                        </Animated.View> */}

                        {/* Form Sections */}
                        <View style={styles.formSection}>

                            {/* Full Name */}
                            <Animated.View entering={FadeInDown.delay(300)} style={styles.inputField}>
                                <View style={styles.labelContainer}>
                                    <ThemedText style={[styles.label, { color: colors.text }]}>
                                        FULL NAME <ThemedText style={styles.required}>*</ThemedText>
                                    </ThemedText>
                                    <ThemedText style={[styles.charCount, formData.name.length > 30 ? { color: '#EF4444' } : { color: colors.icon }]}>
                                        {formData.name.length}/30
                                    </ThemedText>
                                </View>
                                <View style={[styles.inputBox, { backgroundColor: colors.card, borderColor: colors.border, height: Platform.OS === 'android' ? 48 : 52 }]}>
                                    <Ionicons name="person-outline" size={18} color={colors.icon} style={{ marginRight: 10 }} />
                                    <TextInput
                                        placeholder="Enter your name"
                                        placeholderTextColor={colors.icon + '70'}
                                        style={[styles.textInput, { color: colors.text, fontSize: Platform.OS === 'android' ? 13 : 14 }]}
                                        value={formData.name}
                                        onChangeText={(val) => setFormData(p => ({ ...p, name: toTitleCase(val) }))}
                                        maxLength={30}
                                    />
                                </View>
                            </Animated.View>

                            {/* Email Address */}
                            <Animated.View entering={FadeInDown.delay(350)} style={styles.inputField}>
                                <View style={styles.labelContainer}>
                                    <ThemedText style={[styles.label, { color: colors.text }]}>
                                        EMAIL ADDRESS
                                    </ThemedText>
                                </View>
                                <View style={[styles.inputBox, { backgroundColor: colors.card, borderColor: colors.border, height: Platform.OS === 'android' ? 48 : 52, opacity: 0.8 }]}>
                                    <Ionicons name="mail-outline" size={18} color={colors.icon} style={{ marginRight: 10 }} />
                                    <TextInput
                                        style={[styles.textInput, { color: colors.text, fontSize: Platform.OS === 'android' ? 13 : 14 }]}
                                        value={formData.email}
                                        editable={false}
                                    />
                                    <Ionicons name="lock-closed-outline" size={16} color={colors.icon} />
                                </View>
                            </Animated.View>

                            {/* Phone Field */}
                            <Animated.View entering={FadeInDown.delay(400)} style={styles.inputField}>
                                <View style={styles.labelContainer}>
                                    <ThemedText style={[styles.label, { color: colors.text }]}>
                                        PHONE NUMBER <ThemedText style={styles.required}>*</ThemedText>
                                    </ThemedText>
                                    <ThemedText style={[styles.charCount, formData.phone.length > 0 && formData.phone.length !== 11 ? { color: '#EF4444' } : { color: colors.icon }]}>
                                        {formData.phone.length}/11
                                    </ThemedText>
                                </View>
                                <View style={[styles.inputBox, { backgroundColor: colors.card, borderColor: colors.border, height: Platform.OS === 'android' ? 48 : 52 }]}>
                                    <Ionicons name="call-outline" size={18} color={colors.icon} style={{ marginRight: 10 }} />
                                    <TextInput
                                        placeholder="03*********"
                                        placeholderTextColor={colors.icon + '70'}
                                        style={[styles.textInput, { color: colors.text, fontSize: Platform.OS === 'android' ? 13 : 14 }]}
                                        value={formData.phone}
                                        onChangeText={(val) => setFormData(p => ({ ...p, phone: val }))}
                                        keyboardType="phone-pad"
                                        maxLength={11}
                                    />
                                </View>
                            </Animated.View>

                            {/* Gender Selector */}
                            <Animated.View entering={FadeInDown.delay(450)} style={styles.inputField}>
                                <ThemedText style={[styles.label, { color: colors.text }]}>GENDER</ThemedText>
                                <View style={styles.genderRow}>
                                    <TouchableOpacity
                                        onPress={() => setFormData(p => ({ ...p, gender: 'MALE' }))}
                                        style={[styles.genderPill, { borderColor: colors.border }, formData.gender?.toUpperCase() === 'MALE' && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                                    >
                                        <Ionicons name="male" size={16} color={formData.gender?.toUpperCase() === 'MALE' ? '#FFF' : colors.icon} />
                                        <ThemedText style={[styles.genderText, formData.gender?.toUpperCase() === 'MALE' && { color: '#FFF' }, theme === 'dark' && { color: colors.textSecondary }]}>Male</ThemedText>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => setFormData(p => ({ ...p, gender: 'FEMALE' }))}
                                        style={[styles.genderPill, { borderColor: colors.border }, formData.gender?.toUpperCase() === 'FEMALE' && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                                    >
                                        <Ionicons name="female" size={16} color={formData.gender?.toUpperCase() === 'FEMALE' ? '#FFF' : colors.icon} />
                                        <ThemedText style={[styles.genderText, formData.gender?.toUpperCase() === 'FEMALE' && { color: '#FFF' }, theme === 'dark' && { color: colors.textSecondary }]}>Female</ThemedText>
                                    </TouchableOpacity>
                                </View>
                            </Animated.View>

                            {/* City Picker */}
                            <Animated.View entering={FadeInDown.delay(500)} style={styles.inputField}>
                                <View style={styles.labelContainer}>
                                    <ThemedText style={[styles.label, { color: colors.text }]}>
                                        CITY <ThemedText style={styles.required}>*</ThemedText>
                                    </ThemedText>
                                </View>
                                <TouchableOpacity
                                    style={[styles.dropdownTrigger, { backgroundColor: colors.card, borderColor: colors.border, height: Platform.OS === 'android' ? 48 : 52 }]}
                                    onPress={() => setCityPickerVisible(true)}
                                >
                                    <View style={styles.triggerContent}>
                                        <Ionicons name="location-outline" size={18} color={formData.city ? colors.primary : colors.icon} style={{ marginRight: 10 }} />
                                        <ThemedText style={[styles.triggerText, !formData.city ? { color: colors.icon + '70' } : { color: colors.text, textTransform: 'capitalize' }, { fontSize: Platform.OS === 'android' ? 13 : 14 }]}>
                                            {formData.city || "Select your city"}
                                        </ThemedText>
                                    </View>
                                    <Ionicons name="chevron-down" size={16} color={colors.icon} />
                                </TouchableOpacity>
                            </Animated.View>

                            {/* Village Field */}
                            <Animated.View entering={FadeInDown.delay(550)} style={styles.inputField}>
                                <View style={styles.labelContainer}>
                                    <ThemedText style={[styles.label, { color: colors.text }]}>
                                        VILLAGE / TOWN <ThemedText style={styles.required}>*</ThemedText>
                                    </ThemedText>
                                </View>
                                <TouchableOpacity
                                    style={[styles.dropdownTrigger, { backgroundColor: colors.card, borderColor: colors.border, height: Platform.OS === 'android' ? 48 : 52 }]}
                                    onPress={() => setVillagePickerVisible(true)}
                                >
                                    <View style={styles.triggerContent}>
                                        <Ionicons name="business-outline" size={18} color={formData.village ? colors.primary : colors.icon} style={{ marginRight: 10 }} />
                                        <ThemedText style={[styles.triggerText, !formData.village ? { color: colors.icon + '70' } : { color: colors.text, textTransform: 'capitalize' }, { fontSize: Platform.OS === 'android' ? 13 : 14 }]}>
                                            {formData.village || "Select your village/town"}
                                        </ThemedText>
                                    </View>
                                    <Ionicons name="chevron-down" size={16} color={colors.icon} />
                                </TouchableOpacity>
                            </Animated.View>

                        {/* Why complete profile? */}
                        <View style={styles.infoTip}>
                            <Ionicons name="information-circle-outline" size={16} color="#64748B" />
                            <ThemedText style={styles.infoText}>A complete profile helps other community members find you more easily.</ThemedText>
                        </View>

                        {/* Update Button (Now Scrollable) */}
                        <Animated.View style={[animatedButtonStyle, { marginTop: 24 }]}>
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
                </ScrollView>
            </KeyboardAvoidingView>

                <SearchableDropdown
                    visible={cityPickerVisible}
                    onClose={() => setCityPickerVisible(false)}
                    onSelect={(city) => setFormData(prev => ({ ...prev, city }))}
                    currentValue={formData.city}
                    options={citiesData}
                    title="Select City"
                    placeholder="Search city..."
                />

                <SearchableDropdown
                    visible={villagePickerVisible}
                    onClose={() => setVillagePickerVisible(false)}
                    onSelect={(village) => setFormData(prev => ({ ...prev, village }))}
                    currentValue={formData.village}
                    options={villagesData}
                    title="Select Village/Town"
                    placeholder="Search village/town..."
                />

                <ImageViewerModal
                    visible={previewVisible}
                    onClose={() => setPreviewVisible(false)}
                    uri={user?.user?.profileImage}
                    name={user?.user?.name}
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
        borderBottomLeftRadius: Layout.headerBorderRadius,
        borderBottomRightRadius: Layout.headerBorderRadius,
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
        paddingBottom: 40,
    },
    formSection: {
        paddingHorizontal: 20,
        marginTop: 20,
        gap: 16,
    },
    inputField: {
        gap: 6,
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
        borderRadius: Layout.borderRadius,
        paddingHorizontal: 14,
        borderWidth: 1,
    },
    textInput: {
        flex: 1,
        fontWeight: '500',
    },
    dropdownTrigger: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: Layout.borderRadius,
        paddingHorizontal: 14,
        borderWidth: 1,
    },
    triggerContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    triggerText: {
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
        height: Platform.OS === 'android' ? 48 : 52,
        borderRadius: Layout.borderRadius,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        gap: 6,
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
    updateButton: {
        height: Platform.OS === 'android' ? 48 : 52,
        borderRadius: Layout.borderRadius,
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
    },

});

