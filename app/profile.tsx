import { FormInput } from '@/components/common/FormInput';
import { ImageViewerModal } from '@/components/common/ImageViewerModal';
import { LoaderOverlay } from '@/components/common/LoaderOverlay';
import { ModalPickerTrigger } from '@/components/common/ModalPickerTrigger';
import { SearchableDropdown } from '@/components/common/SearchableDropdown';
import { SubmitButton } from '@/components/common/SubmitButton';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import citiesDataFallback from '@/data/cities.json';
import villagesDataFallback from '@/data/villages.json';
import { useBackHandler } from '@/hooks/useBackHandler';
import { useProfileAPI } from '@/hooks/useProfileAPI';
import { profileSchema } from '@/utils/validation';
import { Ionicons } from '@expo/vector-icons';

import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, {
    FadeInDown,
    FadeInUp,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import Toast from 'react-native-toast-message';

export default function ProfileScreen() {
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];
    const { user, updateUser } = useAuth();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const {
        citiesConfigQuery,
        villagesConfigQuery,
        profileMutation,
        uploadImageMutation,
        deleteImageMutation
    } = useProfileAPI({ updateUser });

    const { data: citiesConfigData } = citiesConfigQuery;
    const { data: villagesConfigData } = villagesConfigQuery;

    const citiesData: string[] = useMemo(
        () => citiesConfigData?.data?.data || citiesDataFallback,
        [citiesConfigData]
    );
    const villagesData: string[] = useMemo(
        () => villagesConfigData?.data?.data || villagesDataFallback,
        [villagesConfigData]
    );

    const toTitleCase = useCallback((str: string) => {
        if (!str) return '';
        return str.toLowerCase().replace(/\b\w/g, s => s.toUpperCase());
    }, []);

    const sanitizeName = useCallback((value: string) => {
        const cleaned = value.replace(/[^A-Za-z\s]/g, '').slice(0, 30);
        return cleaned.replace(/\s{2,}/g, ' ').trimStart();
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
    const [previewVisible, setPreviewVisible] = useState(false);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

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


    const pickImage = useCallback(async () => {
        if (Platform.OS === 'ios') {
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
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: 'images',
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            const asset = result.assets[0];

            // Compress and resize the image to exactly 300x300 pixels
            const manipResult = await ImageManipulator.manipulateAsync(
                asset.uri,
                [{ resize: { width: 300, height: 300 } }],
                { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG }
            );

            const uploadFormData = new FormData();

            const file: any = {
                uri: manipResult.uri,
                name: `profile_${user?.user?._id || Date.now()}.jpg`,
                type: `image/jpeg`,
            };

            uploadFormData.append('image', file);
            uploadImageMutation.mutate(uploadFormData);
        }
    }, [user?.user?._id, uploadImageMutation]);





    const handleUpdate = useCallback(async () => {
        try {
            setValidationErrors({});
            await profileSchema.validate(formData, { abortEarly: false });
            profileMutation.mutate({
                ...formData,
                gender: formData.gender || null
            });
        } catch (error: any) {
            if (error?.inner) {
                const errs = error.inner.reduce((acc: Record<string, string>, item: any) => {
                    if (item.path) acc[item.path] = item.message;
                    return acc;
                }, {});
                setValidationErrors(errs);
            } else {
                setValidationErrors({ form: error.message || 'Please fix the highlighted fields.' });
            }
        }
    }, [formData, profileMutation]);

    const handleBack = () => {
        if (router.canGoBack()) router.back();
        else router.replace('/(drawer)/(tabs)' as any);
        return true; // Indicate handled
    };

    useBackHandler(handleBack);

    return (
        <ErrorBoundary>
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                {/* Animated Header — premium account dashboard hero */}
                <Animated.View entering={FadeInUp.duration(450)} style={styles.header}>
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.primary }]} />
                    {/* Soft decor: circles, shield, brand accent dots */}
                    <Svg
                        style={StyleSheet.absoluteFill}
                        viewBox="0 0 375 220"
                        preserveAspectRatio="xMinYMin slice"
                    >
                        <Circle cx={355} cy={0} r={95} fill="rgba(255,255,255,0.06)" />
                        <Circle cx={5} cy={220} r={70} fill="rgba(255,255,255,0.05)" />
                        <Path
                            d="M300 140 l22 -9 l22 9 v16 c0 13 -10 23 -22 28 c-12 -5 -22 -15 -22 -28 z"
                            stroke="rgba(255,255,255,0.10)"
                            strokeWidth={2}
                            fill="none"
                        />
                        <Circle cx={120} cy={50} r={3.5} fill={colors.lime} opacity={0.5} />
                        <Circle cx={250} cy={72} r={3.5} fill={colors.secondary} opacity={0.55} />
                    </Svg>

                    <View style={[styles.headerTop, { paddingTop: insets.top + 10 }]}>
                        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
                        </TouchableOpacity>
                        <ThemedText style={styles.headerTitle}>My Account</ThemedText>
                        <View style={{ width: 42 }} />
                    </View>

                    <Animated.View entering={FadeInDown.delay(120).duration(450)} style={styles.headerIdentity}>
                        <ProfileAvatar
                            uri={user?.user?.profileImage}
                            name={user?.user?.name}
                            isUploading={uploadImageMutation.isPending}
                            isDeleting={deleteImageMutation.isPending}
                            onPickImage={pickImage}
                            onDeleteImage={() => deleteImageMutation.mutate()}
                            onPreviewOpen={() => setPreviewVisible(true)}
                        />
                        <View style={styles.nameRow}>
                            <ThemedText style={styles.userName} numberOfLines={1}>
                                {currentData.name || 'Welcome'}
                            </ThemedText>
                            {(currentData.otpVerified || currentData.emailVerified) && (
                                <View style={[styles.verifiedChip, { backgroundColor: colors.lime }]}>
                                    <Ionicons name="checkmark-circle" size={11} color="#1E293B" />
                                    <ThemedText style={styles.verifiedText}>Verified</ThemedText>
                                </View>
                            )}
                        </View>
                        <ThemedText style={styles.subtitleText}>
                            Keep your profile complete for better community trust
                        </ThemedText>
                    </Animated.View>
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

                        {/* Form Sections */}
                        <View style={styles.formSection}>

                            {/* Full Name */}
                            <Animated.View entering={FadeInDown.delay(300)}>
                                <FormInput
                                    label="FULL NAME"
                                    required
                                    icon="person-outline"
                                    placeholder="Enter your name"
                                    value={formData.name}
                                    onChangeText={(val) => {
                                        const sanitized = sanitizeName(val);
                                        setFormData(p => ({ ...p, name: toTitleCase(sanitized) }));
                                        setValidationErrors(prev => ({ ...prev, name: '' }));
                                    }}
                                    maxLength={30}
                                    autoCapitalize="words"
                                    autoCorrect={false}
                                    error={validationErrors.name}
                                />
                            </Animated.View>

                            {/* Email Address */}
                            <Animated.View entering={FadeInDown.delay(350)}>
                                <FormInput
                                    label="EMAIL ADDRESS"
                                    icon="mail-outline"
                                    value={formData.email}
                                    editable={false}
                                    containerStyle={{ opacity: 0.8 }}
                                />
                            </Animated.View>

                            {/* Phone Field */}
                            <Animated.View entering={FadeInDown.delay(400)}>
                                <FormInput
                                    label="PHONE NUMBER"
                                    required
                                    icon="call-outline"
                                    placeholder="03*********"
                                    keyboardType="phone-pad"
                                    value={formData.phone}
                                    onChangeText={(val) => {
                                        setFormData(p => ({ ...p, phone: val }));
                                        setValidationErrors(prev => ({ ...prev, phone: '' }));
                                    }}
                                    maxLength={11}
                                    error={validationErrors.phone}
                                />
                            </Animated.View>

                            {/* Gender Selector */}
                            <Animated.View entering={FadeInDown.delay(450)} style={styles.inputField}>
                                <ThemedText style={[styles.label, { color: colors.text }]}>GENDER</ThemedText>
                                <View style={styles.genderRow}>
                                    <TouchableOpacity
                                        onPress={() => setFormData(p => ({ ...p, gender: 'MALE' }))}
                                        style={[styles.genderPill, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.035)' }, formData.gender?.toUpperCase() === 'MALE' && { backgroundColor: colors.primary }]}
                                    >
                                        <Ionicons name="male" size={16} color={formData.gender?.toUpperCase() === 'MALE' ? '#FFF' : colors.icon} />
                                        <ThemedText style={[styles.genderText, formData.gender?.toUpperCase() === 'MALE' && { color: '#FFF' }, theme === 'dark' && { color: colors.textSecondary }]}>Male</ThemedText>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => setFormData(p => ({ ...p, gender: 'FEMALE' }))}
                                        style={[styles.genderPill, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.035)' }, formData.gender?.toUpperCase() === 'FEMALE' && { backgroundColor: colors.primary }]}
                                    >
                                        <Ionicons name="female" size={16} color={formData.gender?.toUpperCase() === 'FEMALE' ? '#FFF' : colors.icon} />
                                        <ThemedText style={[styles.genderText, formData.gender?.toUpperCase() === 'FEMALE' && { color: '#FFF' }, theme === 'dark' && { color: colors.textSecondary }]}>Female</ThemedText>
                                    </TouchableOpacity>
                                </View>
                            </Animated.View>

                            {/* City Picker */}
                            <View>
                                <ModalPickerTrigger
                                    label="CITY"
                                    required
                                    icon="location-outline"
                                    value={formData.city}
                                    placeholder="Select your city"
                                    onPress={() => setCityPickerVisible(true)}
                                    delay={500}
                                />
                                {validationErrors.city ? (
                                    <ThemedText style={styles.errorText}>{validationErrors.city}</ThemedText>
                                ) : null}
                            </View>

                            {/* Village Field */}
                            <View>
                                <ModalPickerTrigger
                                    label="VILLAGE / TOWN"
                                    required
                                    icon="business-outline"
                                    value={formData.village}
                                    placeholder="Select your village/town"
                                    onPress={() => setVillagePickerVisible(true)}
                                    delay={550}
                                />
                                {validationErrors.village ? (
                                    <ThemedText style={styles.errorText}>{validationErrors.village}</ThemedText>
                                ) : null}
                            </View>

                            {/* Why complete profile? */}
                            <View style={styles.infoTip}>
                                <Ionicons name="information-circle-outline" size={16} color="#64748B" />
                                <ThemedText style={styles.infoText}>A complete profile helps other community members find you more easily.</ThemedText>
                            </View>

                            {/* Update Button (Now Scrollable) */}
                            <View style={{ marginTop: 12, alignItems: 'center' }}>
                                <SubmitButton
                                    title="Update Profile"
                                    onPress={handleUpdate}
                                    disabled={!isModified}
                                    isLoading={profileMutation.isPending}
                                    style={{ alignSelf: 'center' }}
                                />
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>

                <SearchableDropdown
                    visible={cityPickerVisible}
                    onClose={() => setCityPickerVisible(false)}
                    onSelect={(city) => {
                        setFormData(prev => ({ ...prev, city }));
                        setValidationErrors(prev => ({ ...prev, city: '' }));
                    }}
                    currentValue={formData.city}
                    options={citiesData}
                    title="Select City"
                    placeholder="Search city..."
                />

                <SearchableDropdown
                    visible={villagePickerVisible}
                    onClose={() => setVillagePickerVisible(false)}
                    onSelect={(village) => {
                        setFormData(prev => ({ ...prev, village }));
                        setValidationErrors(prev => ({ ...prev, village: '' }));
                    }}
                    currentValue={formData.village}
                    options={villagesData}
                    title="Select Village"
                    placeholder="Search village/town..."
                />

                <ImageViewerModal
                    visible={previewVisible}
                    onClose={() => setPreviewVisible(false)}
                    uri={user?.user?.profileImage}
                    name={user?.user?.name}
                />

                <LoaderOverlay visible={profileMutation.isPending} />
            </View >
        </ErrorBoundary>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingBottom: 18,
        borderBottomLeftRadius: Layout.headerBorderRadius,
        borderBottomRightRadius: Layout.headerBorderRadius,
        overflow: 'hidden',
    },
    headerIdentity: {
        alignItems: 'center',
        marginTop: 2,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 8,
        paddingHorizontal: 24,
    },
    userName: {
        fontSize: 18,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 0.2,
        flexShrink: 1,
    },
    verifiedChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 999,
    },
    verifiedText: {
        fontSize: 9.5,
        fontWeight: '800',
        color: '#1E293B',
        textTransform: 'uppercase',
        letterSpacing: 0.4,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
    },
    backButton: {
        width: 42,
        height: 42,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFFFFF',
        textAlign: 'center',
    },
    subtitleText: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 4,
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
    errorText: {
        color: '#EF4444',
        fontSize: 11,
        marginLeft: 4,
        marginTop: 2,
    },
    charCount: {
        fontSize: 10,
        fontWeight: '600',
    },
    inputBox: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        paddingHorizontal: 14,
    },
    textInput: {
        flex: 1,
        fontWeight: '500',
    },
    dropdownTrigger: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 12,
        paddingHorizontal: 14,
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
        borderRadius: 12,
        gap: 6,
    },
    genderText: {
        fontSize: 12,
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
        fontSize: 11,
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
        fontSize: 12,
        fontWeight: '700',
        color: '#FFFFFF',
    },

});

