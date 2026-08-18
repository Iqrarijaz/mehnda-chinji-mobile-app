import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    BackHandler,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
    Image,
    ActivityIndicator
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { AnalyticsEvents, analyticsService } from '@/analytics';
import { useBusinessAPI } from '@/hooks/useBusinessAPI';
import { ProfessionPicker } from '@/components/common/ProfessionPicker';
import { TimePicker } from '@/components/common/TimePicker';
import { ThankYouModal } from '@/components/common/ThankYou';
import { ThemedText } from '@/components/ThemedText';
import { LoaderOverlay } from '@/components/common/LoaderOverlay';
import { FormInput } from '@/components/common/FormInput';
import { SubmitButton } from '@/components/common/SubmitButton';
import { CancelButton } from '@/components/common/CancelButton';
import { BusinessRegistrationHeroHeader } from '@/components/business/BusinessRegistrationHeroHeader';
import { LocationPicker, LocationValue } from '@/components/common/LocationPicker';
import { resolveLocationForSubmit } from '@/utils/locationService';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

import * as yup from 'yup';
import { businessSchema } from '@/utils/validation';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { uploadUserImage, deleteUserImage } from '@/apis/essentials';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

const BusinessRegistrationScreen = React.memo(() => {
    const router = useRouter();
    const { editData: editDataParam } = useLocalSearchParams<{ editData?: string }>();
    const { user } = useAuth();
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const editData = editDataParam ? JSON.parse(editDataParam) : null;

    const {
        professionsConfigQuery,
        registerMutation,
        updateMutation
    } = useBusinessAPI({
        enabledList: false
    });

    const { data: configData } = professionsConfigQuery;

    const professionsList = configData?.data?.data || [];

    const [form, setForm] = useState({
        name: '',
        description: '',
        phone: '',
        address: '',
        category: null as any,
        tags: [] as { eng: string; ur: string }[],
        timing: '' });

    const [professionModalVisible, setProfessionModalVisible] = useState(false);
    const [showThankYou, setShowThankYou] = useState(false);
    const [location, setLocation] = useState<LocationValue | null>(null);

    const [openTime, setOpenTime] = useState('09:00 AM');
    const [closeTime, setCloseTime] = useState('09:00 PM');
    const [openTimePickerVisible, setOpenTimePickerVisible] = useState(false);
    const [closeTimePickerVisible, setCloseTimePickerVisible] = useState(false);

    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [isUploadingImage, setIsUploadingImage] = useState(false);

    const resetForm = () => {
        setForm({
            name: '',
            description: '',
            phone: user?.user?.phone || '',
            address: user?.user?.address || user?.user?.village || '',
            category: null as any,
            tags: [],
            timing: ''
        });
        setOpenTime('09:00 AM');
        setCloseTime('09:00 PM');
        setLocation(null);
        setSelectedImage(null);
        setUploadedImage(null);
        setErrors({});
    };

    const selectedProfessionInfo = professionsList.find(
        (p: any) => p && p.name_eng?.toLowerCase() === form.category?.name_eng?.toLowerCase()
    );
    const availableTags = selectedProfessionInfo?.tags || form.category?.tags || [];

    const handleGoBack = (tab?: string) => {
        if (tab) {
            router.replace({ pathname: '/(drawer)/(tabs)/business', params: { tab } });
        } else {
            router.replace('/(drawer)/(tabs)/business');
        }
        return true;
    };

    useFocusEffect(
        React.useCallback(() => {
            const onBackPress = () => {
                handleGoBack();
                return true;
            };

            const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
            return () => subscription.remove();
        }, [])
    );

    useEffect(() => {
        if (user?.user?.role !== 'APP_ADMIN') {
            import('@/ads/interstitial.service').then(({ default: InterstitialService }) => {
                InterstitialService.getInstance().load(true);
            });
        }
        if (editData) {
            let initialOpenTime = '09:00 AM';
            let initialCloseTime = '09:00 PM';
            if (editData.timing && editData.timing.includes(' - ')) {
                const parts = editData.timing.split(' - ');
                if (parts[0] && parts[1]) {
                    initialOpenTime = parts[0];
                    initialCloseTime = parts[1];
                }
            }
            setOpenTime(initialOpenTime);
            setCloseTime(initialCloseTime);

            setForm({
                name: editData.name || '',
                description: editData.description || '',
                phone: editData.phone || '',
                address: editData.address || '',
                category: {
                    name_eng: editData.categoryEn,
                    name_ur: editData.categoryUr,
                    icon: editData.logo || (editData.images && editData.images.length > 0 ? editData.images[0] : undefined)
                } as any,
                tags: editData.tags || [],
                timing: editData.timing || '' });
            const coords = editData.location?.coordinates;
            if (Array.isArray(coords) && coords.length === 2 && !(coords[0] === 0 && coords[1] === 0)) {
                setLocation({ latitude: coords[1], longitude: coords[0] });
            } else {
                setLocation(null);
            }
            if (editData.images && editData.images.length > 0) {
                const img = editData.images[0];
                setSelectedImage(img);
                setUploadedImage(img);
            }
        } else {
            setOpenTime('09:00 AM');
            setCloseTime('09:00 PM');
            setForm({
                name: '',
                description: '',
                phone: user?.user?.phone || '',
                address: user?.user?.address || user?.user?.village || '',
                category: null,
                tags: [],
                timing: '' });
            setLocation(null);
            setSelectedImage(null);
            setUploadedImage(null);
        }
    }, [editDataParam, user]);

    const pickImage = async () => {
        if (Platform.OS === 'ios') {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Toast.show({ type: 'error', text1: 'Permission Denied', text2: 'Camera roll permissions are required.' });
                return;
            }
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.8 });
        if (!result.canceled) {
            const asset = result.assets[0];
            let finalUri = asset.uri;
            try {
                const manipResult = await ImageManipulator.manipulateAsync(
                    asset.uri,
                    [{ resize: { width: 1080 } }],
                    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
                );
                finalUri = manipResult.uri;
            } catch (e) {
                console.error('Image compression failed', e);
            }
            setSelectedImage(finalUri);
            handleImageUpload(finalUri);
        }
    };

    const handleImageUpload = async (uri: string) => {
        setIsUploadingImage(true);
        try {
            const filename = uri.split('/').pop() || 'image.jpg';
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : `image`;
            const formData = new FormData();
            formData.append('image', { uri, name: filename, type } as any);
            const res: any = await uploadUserImage(formData);
            const imageUrl = res?.data?.imageUrl || res?.imageUrl;
            if (imageUrl) {
                setUploadedImage(imageUrl);
            } else {
                setSelectedImage(null);
                setUploadedImage(null);
                Toast.show({ type: 'error', text1: 'Upload Failed', text2: 'Could not upload image.' });
            }
        } catch (error) {
            setSelectedImage(null);
            setUploadedImage(null);
            Toast.show({ type: 'error', text1: 'Upload Failed', text2: 'Something went wrong.' });
        } finally {
            setIsUploadingImage(false);
        }
    };

    const handleDeleteImage = async () => {
        const imageToDelete = uploadedImage;
        setUploadedImage(null);
        setSelectedImage(null);
        if (imageToDelete) {
            try {
                await deleteUserImage(imageToDelete);
            } catch (error) {
                console.error('Failed to delete image from server:', error);
            }
        }
    };

    const handleSubmit = async () => {
        try {
            await businessSchema.validate(form, { abortEarly: false });
            setErrors({});

            const { name, category, phone, address } = form;

            const payload: any = {
                name,
                categoryEn: category.name_eng,
                categoryUr: category.name_ur,
                description: form.description,
                phone,
                address,
                logo: uploadedImage || category.icon || null,
                images: uploadedImage ? [uploadedImage] : (category.icon ? [category.icon] : []),
                tags: form.tags.map((t: any) => ({ eng: t.eng, ur: t.ur })),
                timing: `${openTime} - ${closeTime}` };

            // Attach coordinates: manual selection, else silent current-location
            // capture (only if permission already granted). Absent → saved without.
            const coords = await resolveLocationForSubmit(location);
            if (coords) {
                payload.latitude = coords.latitude;
                payload.longitude = coords.longitude;
            }

            if (editData) {
                updateMutation.mutate({ ...payload, businessId: editData._id }, {
                    onSuccess: (res: any) => {
                        if (res.success) {
                            analyticsService.trackEvent(AnalyticsEvents.BUSINESS_REGISTRATION_SUCCESS, { action: 'update' });
                            handleGoBack();
                        }
                    }
                });
            } else {
                registerMutation.mutate(payload, {
                    onSuccess: (res: any) => {
                        if (res.success) {
                            analyticsService.trackEvent(AnalyticsEvents.BUSINESS_REGISTRATION_SUCCESS, { action: 'create' });
                            resetForm();
                            setShowThankYou(true);
                        }
                    }
                });
            }
        } catch (err: any) {
            if (err instanceof yup.ValidationError) {
                const newErrors: { [key: string]: string } = {};
                err.inner.forEach((validationError) => {
                    if (validationError.path) {
                        newErrors[validationError.path] = validationError.message;
                    }
                });
                setErrors(newErrors);
            }
        }
    };

    const isPending = registerMutation.isPending || updateMutation.isPending;

    const handleThankYouClose = () => {
        setShowThankYou(false);
        if (user?.user?.role !== 'APP_ADMIN') {
            import('@/ads/interstitial.service').then(({ default: InterstitialService }) => {
                InterstitialService.getInstance().show(true);
            });
        }
        handleGoBack('portal');
    };

    return (
        <ErrorBoundary>
        <View style={[styles.mainContainer, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{
                headerShown: false,
                gestureEnabled: true,
                presentation: 'modal',
                animation: 'slide_from_bottom'
            }} />

            <ThankYouModal
                visible={showThankYou}
                onClose={handleThankYouClose}
                animationSource={require('@/public/json/onboarding3.json')}
                animationWidth={260}
                animationHeight={200}
            >
                <ThemedText style={{ fontSize: 12.5, textAlign: 'center', lineHeight: 22, color: colors.textSecondary }}>
                    Dear <ThemedText style={{ fontWeight: 'bold', color: colors.text }}>{user?.user?.name ? user.user.name.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') : 'Entrepreneur'}</ThemedText>, {editData ? 'your business details have been updated successfully.' : 'thank you for registering! Our team will review and approve your business shortly.'}
                </ThemedText>
            </ThankYouModal>

            {/* ── Hero Header ─────────────────────────────────────────── */}
            <BusinessRegistrationHeroHeader
                isEditing={!!editData}
                onBack={handleGoBack}
            />

            {/* ── Form ────────────────────────────────────────────────── */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView
                    contentContainerStyle={[
                        styles.scrollContent,
                        { paddingBottom: Platform.OS === 'android' ? 80 : 60 }
                    ]}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.formSection}>
                        
                        {/* Image Upload */}
                        <View style={styles.inputField}>
                            <ThemedText style={[styles.label, { color: colors.text }]}>BUSINESS IMAGE</ThemedText>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
                                <View style={{ position: 'relative' }}>
                                    <TouchableOpacity 
                                        style={[{ width: 80, height: 80, borderRadius: Layout.borderRadius, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.035)', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }]} 
                                        onPress={pickImage} 
                                        disabled={isUploadingImage}
                                    >
                                        {isUploadingImage ? (
                                            <ActivityIndicator color={colors.primary} />
                                        ) : (uploadedImage || selectedImage) ? (
                                            <Image source={{ uri: (uploadedImage || selectedImage)! }} style={{ width: '100%', height: '100%' }} />
                                        ) : (
                                            <Ionicons name="camera-outline" size={30} color={colors.icon} />
                                        )}
                                    </TouchableOpacity>
                                    
                                    {(uploadedImage || selectedImage) && !isUploadingImage && (
                                        <TouchableOpacity
                                            style={{
                                                position: 'absolute',
                                                bottom: -4,
                                                left: -4,
                                                backgroundColor: '#EF4444',
                                                width: 26,
                                                height: 26,
                                                borderRadius: Layout.borderRadius,
                                                justifyContent: 'center',
                                                alignItems: 'center'
                                            }}
                                            onPress={handleDeleteImage}
                                        >
                                            <Ionicons name="trash" size={14} color="#FFFFFF" />
                                        </TouchableOpacity>
                                    )}
                                </View>
                                <View style={{ flex: 1 }}>
                                    <ThemedText style={{ color: colors.textSecondary, fontSize: 11.5 }}>Add a photo of your business (Optional).</ThemedText>
                                    <ThemedText style={{ color: colors.textSecondary, fontSize: 10, marginTop: 4 }}>If no image is provided, category icon will be used.</ThemedText>
                                </View>
                            </View>
                        </View>

                        {/* Business Name */}
                        <FormInput
                            label="BUSINESS NAME"
                            required
                            icon="storefront-outline"
                            placeholder="Your business name"
                            value={form.name}
                            onChangeText={(text) => {
                                const cleanedText = text.replace(/[^a-zA-Z\s]/g, '');
                                setForm(prev => ({ ...prev, name: cleanedText }));
                                setErrors(prev => ({ ...prev, name: '' }));
                            }}
                            error={errors.name}
                        />

                        {/* Category */}
                        <View style={styles.inputField}>
                            <ThemedText style={[styles.label, { color: colors.text }]}>
                                CATEGORY <ThemedText style={styles.required}>*</ThemedText>
                            </ThemedText>
                            <TouchableOpacity
                                style={[styles.dropdownTrigger, {
                                    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.035)',
                                    height: Platform.OS === 'android' ? 46 : 50
                                }]}
                                onPress={() => setProfessionModalVisible(true)}
                            >
                                <View style={styles.triggerContent}>
                                    <ThemedText style={[
                                        styles.triggerText,
                                        { color: form.category ? colors.text : colors.icon, fontSize: 12.5 }
                                    ]}>
                                        {form.category
                                            ? `${form.category.name_eng} - ${form.category.name_ur}`
                                            : 'Select category'}
                                    </ThemedText>
                                </View>
                                <Ionicons name="chevron-down" size={16} color={colors.icon} />
                            </TouchableOpacity>
                            {errors.category ? (
                                <ThemedText style={{ color: '#EF4444', fontSize: 10, marginLeft: 4, marginTop: 2 }}>
                                    {errors.category}
                                </ThemedText>
                            ) : null}
                        </View>

                        {/* Address */}
                        <View style={styles.inputField}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                    <ThemedText style={[styles.label, { color: colors.text }]}>ADDRESS <ThemedText style={styles.required}>*</ThemedText></ThemedText>
                                    <LocationPicker
                                        label='Open Map'
                                        value={location}
                                        variant="button"
                                        onChange={(loc) => {
                                            setLocation(loc);
                                            if (loc?.address) {
                                                setForm(prev => ({ ...prev, address: loc.address || '' }));
                                                setErrors(prev => ({ ...prev, address: '' }));
                                            }
                                        }}
                                    />
                                </View>
                                <ThemedText style={[{ fontSize: 9, fontWeight: '700', color: colors.icon }, form.address.length >= 150 && { color: '#EF4444' }]}>
                                    {form.address.length}/150
                                </ThemedText>
                            </View>
                            <View style={[styles.inputBox, {
                                backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.035)',
                                minHeight: 80,
                                alignItems: 'flex-start',
                                paddingVertical: 10 }]}
                            >
                                <TextInput
                                    style={[styles.textInput, { color: colors.text, textAlignVertical: 'top', minHeight: 60, fontSize: 12.5 }]}
                                    placeholder="Shop #, Street, Area"
                                    placeholderTextColor={colors.icon}
                                    value={form.address}
                                    onChangeText={(text) => {
                                        setForm(prev => ({ ...prev, address: text }));
                                        setErrors(prev => ({ ...prev, address: '' }));
                                    }}
                                    maxLength={150}
                                    multiline
                                />
                            </View>
                            {errors.address ? (
                                <ThemedText style={{ color: '#EF4444', fontSize: 10, marginLeft: 4, marginTop: 2 }}>
                                    {errors.address}
                                </ThemedText>
                            ) : null}
                        </View>

                        {/* Phone */}
                        <FormInput
                            label="PRIMARY PHONE"
                            required
                            icon="call-outline"
                            placeholder="e.g. 03xx xxxxxxx"
                            value={form.phone}
                            onChangeText={(text) => {
                                const sanitized = text.replace(/[^0-9]/g, '');
                                setForm(prev => ({ ...prev, phone: sanitized }));
                                setErrors(prev => ({ ...prev, phone: '' }));
                            }}
                            keyboardType="phone-pad"
                            maxLength={11}
                            error={errors.phone}
                        />

                        {/* Timings */}
                        <View style={styles.inputField}>
                            <ThemedText style={[styles.label, { color: colors.text }]}>BUSINESS TIMINGS</ThemedText>
                            <View style={{ flexDirection: 'row', gap: 12 }}>
                                {/* Open */}
                                <View style={{ flex: 1 }}>
                                    <ThemedText style={[styles.subLabel, { color: colors.icon }]}>OPENS AT</ThemedText>
                                    <TouchableOpacity
                                        style={[styles.dropdownTrigger, {
                                            backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.035)',
                                            height: Platform.OS === 'android' ? 46 : 50 }]}
                                        onPress={() => setOpenTimePickerVisible(true)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.triggerContent}>
                                            <Ionicons name="time-outline" size={18} color={colors.icon} style={{ marginRight: 8 }} />
                                            <ThemedText style={[styles.triggerText, { color: colors.text, fontSize: 12.5 }]}>
                                                {openTime}
                                            </ThemedText>
                                        </View>
                                        <Ionicons name="chevron-down" size={16} color={colors.icon} />
                                    </TouchableOpacity>
                                </View>
                                {/* Close */}
                                <View style={{ flex: 1 }}>
                                    <ThemedText style={[styles.subLabel, { color: colors.icon }]}>CLOSES AT</ThemedText>
                                    <TouchableOpacity
                                        style={[styles.dropdownTrigger, {
                                            backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.035)',
                                            height: Platform.OS === 'android' ? 46 : 50 }]}
                                        onPress={() => setCloseTimePickerVisible(true)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.triggerContent}>
                                            <Ionicons name="time-outline" size={18} color={colors.icon} style={{ marginRight: 8 }} />
                                            <ThemedText style={[styles.triggerText, { color: colors.text, fontSize: 12.5 }]}>
                                                {closeTime}
                                            </ThemedText>
                                        </View>
                                        <Ionicons name="chevron-down" size={16} color={colors.icon} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>

{/* Tags */}
                        {availableTags && availableTags.length > 0 && (
                            <View style={styles.inputField}>
                                <ThemedText style={[styles.label, { color: colors.text }]}>SELECT SERVICES / TAGS</ThemedText>
                                <View style={styles.tagsContainer}>
                                    {availableTags.map((tag: any) => {
                                        const isSelected = form.tags.some((t: any) => t.eng?.toLowerCase() === tag.eng?.toLowerCase());
                                        return (
                                            <TouchableOpacity
                                                key={tag.eng}
                                                style={[
                                                    styles.tagChip,
                                                    {
                                                        backgroundColor: isSelected
                                                            ? `${colors.primary}1E`
                                                            : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.035)') }
                                                ]}
                                                onPress={() => {
                                                    if (isSelected) {
                                                        setForm(prev => ({
                                                            ...prev,
                                                            tags: prev.tags.filter((t: any) => t.eng?.toLowerCase() !== tag.eng?.toLowerCase())
                                                        }));
                                                    } else {
                                                        setForm(prev => ({
                                                            ...prev,
                                                            tags: [...prev.tags, tag]
                                                        }));
                                                    }
                                                }}
                                                activeOpacity={0.8}
                                            >
                                                {isSelected && <View style={[styles.tagChipDot, { backgroundColor: colors.primary }]} />}
                                                <ThemedText style={[
                                                    styles.tagChipText,
                                                    { color: isSelected ? colors.primary : colors.textSecondary, fontWeight: isSelected ? '700' : '600' }
                                                ]}>
                                                    {tag.eng} | {tag.ur}
                                                </ThemedText>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>
                        )}

                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 20 }}>
                            <CancelButton
                                onPress={() => handleGoBack()}
                                disabled={isPending || isUploadingImage}
                                style={{ backgroundColor: isDark ? '#334155' : '#F1F5F9', height: 38 }}
                            />
                            <SubmitButton
                                title={editData ? 'Update' : 'Post Now'}
                                onPress={handleSubmit}
                                isLoading={isPending || isUploadingImage}
                                style={{ width: 160, height: 38, borderRadius: 28 }}
                            />
                        </View>

                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* ── Modals ──────────────────────────────────────────────── */}
            <ProfessionPicker
                visible={professionModalVisible}
                onClose={() => setProfessionModalVisible(false)}
                onSelect={(cat: any) => {
                    setForm(prev => ({ ...prev, category: cat, tags: [] }));
                    setErrors(prev => ({ ...prev, category: '' }));
                    setProfessionModalVisible(false);
                }}
            />

            <TimePicker
                visible={openTimePickerVisible}
                onClose={() => setOpenTimePickerVisible(false)}
                onSelect={(time) => setOpenTime(time)}
                title="Select Opening Time"
                currentValue={openTime}
            />

            <TimePicker
                visible={closeTimePickerVisible}
                onClose={() => setCloseTimePickerVisible(false)}
                onSelect={(time) => setCloseTime(time)}
                title="Select Closing Time"
                currentValue={closeTime}
            />

            <LoaderOverlay visible={isPending} />
        </View>
        </ErrorBoundary>
    );
});

export default BusinessRegistrationScreen;

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1 },

    // ── Hero Header ──────────────────────────────────────────────────────
    header: {
        borderBottomLeftRadius: Layout.headerBorderRadius,
        borderBottomRightRadius: Layout.headerBorderRadius,
        overflow: 'hidden',
        paddingBottom: 20 },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 13,
        paddingBottom: 4 },
    backButton: {
        width: 42,
        height: 42,
        borderRadius: Layout.borderRadius,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center' },
    headerNavTitle: {
        fontSize: 14.5,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 0.2 },
    heroContent: {
        alignItems: 'center',
        paddingHorizontal: 20,
        marginTop: 16 },
    heroIconWrap: {
        width: 64,
        height: 64,
        borderRadius: Layout.borderRadius,
        backgroundColor: 'rgba(255,255,255,0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12 },
    heroTitle: {
        fontSize: 16.5,
        fontWeight: '800',
        color: '#FFFFFF',
        textAlign: 'center',
        letterSpacing: 0.2 },
    heroSubtitle: {
        fontSize: 10.5,
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
        marginTop: 6,
        lineHeight: 18 },

    // ── Form ─────────────────────────────────────────────────────────────
    scrollContent: {
        paddingBottom: 36 },
    formSection: {
        paddingHorizontal: 16,
        marginTop: 24,
        gap: 16 },
    inputField: {
        gap: 6 },
    label: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5,
        marginLeft: 2 },
    required: {
        color: '#EF4444' },
    subLabel: {
        fontSize: 9,
        fontWeight: '700',
        letterSpacing: 0.6,
        marginBottom: 4,
        marginLeft: 2 },

    // ── Inputs (flat, borderless — mirrors profile.tsx) ──────────────────
    inputBox: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: Layout.borderRadius,
        paddingHorizontal: 11 },
    textInput: {
        flex: 1,
        fontWeight: '500',
        paddingVertical: 0 },
    dropdownTrigger: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: Layout.borderRadius - 2,
        paddingHorizontal: 11 },
    triggerContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center' },
    triggerText: {
        flex: 1,
        fontWeight: '500' },

    // ── Tags ─────────────────────────────────────────────────────────────
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 4 },
    tagChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: Layout.borderRadius },
    tagChipText: {
        fontSize: 10,
        letterSpacing: 0.2 },
    tagChipDot: {
        width: 5,
        height: 5,
        borderRadius: Layout.borderRadius },

    // ── Buttons row ──────────────────────────────────────────────────────
});
