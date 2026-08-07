import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import EssentialSubmitForm from '@/components/essentials/EssentialSubmitForm';
import {
    ActivityIndicator,
    BackHandler,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { TravelHeroHeader } from '@/components/essentials/travel/TravelHeroHeader';
import { EmergencyHeroHeader } from '@/components/essentials/emergency/EmergencyHeroHeader';
import { HealthHeroHeader } from '@/components/essentials/health/HealthHeroHeader';
import { ReligiousHeroHeader } from '@/components/essentials/religious/ReligiousHeroHeader';
import { BankHeroHeader } from '@/components/essentials/bank/BankHeroHeader';
import { GovtHeroHeader } from '@/components/essentials/govt/GovtHeroHeader';
import { EducationHeroHeader } from '@/components/essentials/education/EducationHeroHeader';

import { getAuthenticatedConfiguration } from '@/apis/configuration';
import { uploadUserImage } from '@/apis/essentials';
import { ThankYouModal } from '@/components/common/ThankYou';
import { ThemedText } from '@/components/ThemedText';
import { BackButton } from '@/components/common/BackButton';
import { getCategoryTypes } from '@/constants/categoryTypes';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

const PlaceSubmissionScreen = () => {
    const router = useRouter();
    const { category, editData: editDataParam } = useLocalSearchParams<{ category: string; editData?: string }>();
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();
    const colors = Colors[theme];
    const isDark = theme === 'dark';
    const { user } = useAuth();

    const editData = editDataParam ? JSON.parse(editDataParam) : null;
    const isEditing = !!editData;

    const { data: essentialsConfig } = useQuery({
        queryKey: ['configuration', 'ESSENTIALS_ICONS'],
        queryFn: () => getAuthenticatedConfiguration('ESSENTIALS_ICONS'),
        staleTime: 0 });

    const getConfigArray = (resp: any) => {
        let val = resp?.data?.data || resp?.data?.value || resp?.data || resp;
        if (val && typeof val === 'object' && val.value) val = val.value;
        if (typeof val === 'string') {
            try { val = JSON.parse(val); } catch (e) { }
        }
        return Array.isArray(val) ? val : [];
    };

    const configData = getConfigArray(essentialsConfig);
    const categoryConfig = configData.find((c: any) => c.category === category?.toLowerCase() || c.key === category?.toLowerCase());
    const dynamicTypes = categoryConfig?.types || [];

    const typesToRender = dynamicTypes.length > 0
        ? dynamicTypes
        : getCategoryTypes(category || '').map(t => ({ key: t, label: t.charAt(0).toUpperCase() + t.slice(1) }));

    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isImageLoading, setIsImageLoading] = useState(false);

    const [showThankYou, setShowThankYou] = useState(false);

    const handleGoBack = () => {
        router.back();
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
        if (!isEditing && user?.user?.role !== 'APP_ADMIN') {
            import('@/ads/interstitial.service').then(({ default: InterstitialService }) => {
                InterstitialService.getInstance().load();
            });
        }
        if (editData) {
            const images = Array.isArray(editData.images) ? editData.images : [];
            if (images.length > 0) {
                setSelectedImage(images[0]);
                setUploadedImage(images[0]);
            }
        }
    }, [editData]);

    const pickImage = async () => {
        if (Platform.OS === 'ios') {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Toast.show({
                    type: 'error',
                    text1: 'Permission Denied',
                    text2: 'Camera roll permissions are required to upload photos.' });
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
        setIsUploading(true);
        try {
            const formData = new FormData();
            // @ts-ignore
            formData.append('image', { uri, name: `image_${Date.now()}.jpg`, type: 'image/jpeg' });
            if (uploadedImage) {
                formData.append('existingImageUrl', uploadedImage);
            }
            formData.append('category', category || '');
            formData.append('folderName', 'public');

            const response: any = await uploadUserImage(formData);
            if (response.success) {
                const imageUrl = response.data.imageUrl;
                setUploadedImage(imageUrl);
            }
        } catch (error) {
            console.error('Upload Error:', error);
            Toast.show({
                type: 'error',
                text1: 'Upload Failed',
                text2: 'Could not upload image. Please try again.' });
        } finally {
            setIsUploading(false);
        }
    };

    const isReligious = category?.toLowerCase() === 'religious';
    const isGovt = category?.toLowerCase() === 'govt';
    const isEmergency = category?.toLowerCase() === 'emergency';
    const isHealth = category?.toLowerCase() === 'health';
    const isTravel = category?.toLowerCase() === 'travel';
    const isEducation = category?.toLowerCase() === 'education';
    const isBank = category?.toLowerCase() === 'bank';
    const isNoPhotoCategory = isReligious || isGovt;

    // Fake place object for hero headers (they only need name, type, images, timing)
    const heroPlace = {
        type: editData?.type || '',
        timing: editData?.timing || '',
        images: selectedImage ? [selectedImage] : [],
        village: '',
        city: '' };
    const heroPlaceName = isEditing ? (editData?.name || 'Edit Submission') : `Add ${category ? category.charAt(0).toUpperCase() + category.slice(1) : 'Place'}`;
    const noop = () => { };

    const handleThankYouClose = () => {
        setShowThankYou(false);
        if (user?.user?.role !== 'APP_ADMIN') {
            import('@/ads/interstitial.service').then(({ default: InterstitialService }) => {
                InterstitialService.getInstance().show(true);
            });
        }
        if (category) {
            router.replace({ pathname: '/listing/[category]', params: { category, tab: 'requests' } });
        } else {
            router.back();
        }
    };

    return (
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
                animationSource={require('@/public/json/onboarding1.json')}
                animationWidth={260}
                animationHeight={200}
            >
                <ThemedText style={{ fontSize: 12.5, textAlign: 'center', lineHeight: 22, color: colors.textSecondary }}>
                    Dear <ThemedText style={{ fontWeight: 'bold', color: colors.text }}>{user?.user?.name ? user.user.name.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') : 'Hero'}</ThemedText>, thank you for your submission! Our team will review and approve this place shortly.
                </ThemedText>
            </ThankYouModal>

            {/* ── Category Hero Header ─────────────────────────────────── */}
            {isTravel ? (
                <TravelHeroHeader
                    place={heroPlace}
                    placeName={heroPlaceName}
                    isOwner={false}
                    onBack={handleGoBack}
                    onReport={noop}
                    onEdit={noop}
                />
            ) : isEmergency ? (
                <EmergencyHeroHeader
                    place={heroPlace}
                    placeName={heroPlaceName}
                    isOwner={false}
                    onBack={handleGoBack}
                    onReport={noop}
                    onEdit={noop}
                />
            ) : isHealth ? (
                <HealthHeroHeader
                    place={heroPlace}
                    placeName={heroPlaceName}
                    isOwner={false}
                    onBack={handleGoBack}
                    onReport={noop}
                    onEdit={noop}
                />
            ) : isReligious ? (
                <ReligiousHeroHeader
                    place={heroPlace}
                    placeName={heroPlaceName}
                    isOwner={false}
                    onBack={handleGoBack}
                    onReport={noop}
                    onEdit={noop}
                />
            ) : isBank ? (
                <BankHeroHeader
                    place={heroPlace}
                    placeName={heroPlaceName}
                    isOwner={false}
                    onBack={handleGoBack}
                    onReport={noop}
                    onEdit={noop}
                />
            ) : isGovt ? (
                <GovtHeroHeader
                    place={heroPlace}
                    placeName={heroPlaceName}
                    isOwner={false}
                    onBack={handleGoBack}
                    onReport={noop}
                    onEdit={noop}
                />
            ) : isEducation ? (
                <EducationHeroHeader
                    place={heroPlace}
                    placeName={heroPlaceName}
                    isOwner={false}
                    onBack={handleGoBack}
                    onReport={noop}
                    onEdit={noop}
                />
            ) : (
                <Animated.View entering={FadeInUp.duration(500)} style={styles.headerWrap}>
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.primary }]} />
                    <View style={[styles.headerTopRow, { paddingTop: insets.top + 8 }]}>
                        <BackButton backgroundColor="rgba(255,255,255,0.18)" color="#FFFFFF" size={22} />
                        <View style={{ width: 42 }} />
                    </View>

                    <Animated.View entering={FadeInDown.delay(150).duration(500)} style={styles.heroContent}>
                        <View style={styles.heroIconWrap}>
                            {selectedImage ? (
                                <Image source={{ uri: selectedImage }} style={{ width: 32, height: 32, borderRadius: Layout.borderRadius }} contentFit="cover" />
                            ) : (
                                <Ionicons name="location" size={24} color="#0D9488" />
                            )}
                        </View>
                        <ThemedText style={styles.heroTitle}>
                            {isEditing ? 'Update Your Submission' : 'Submit a Place'}
                        </ThemedText>
                        <ThemedText style={styles.heroSubtitle}>
                            Fill in the details below to list this place in the community directory
                        </ThemedText>
                    </Animated.View>
                </Animated.View>
            )}

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <View style={styles.content}>
                    <ScrollView
                        style={styles.scroll}
                        contentContainerStyle={[styles.scrollContent, { paddingTop: 13, paddingBottom: insets.bottom + 40 }]}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        {!isEmergency && !isNoPhotoCategory && (
                            <Animated.View entering={FadeInDown.delay(100)} style={{ marginBottom: 24, gap: 6 }}>
                                <ThemedText style={{ fontSize: 10, fontWeight: '700', letterSpacing: 0.5, marginLeft: 2, color: colors.text }}>PLACE IMAGE</ThemedText>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
                                    <TouchableOpacity 
                                        style={{ width: 80, height: 80, borderRadius: Layout.borderRadius, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.035)', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }} 
                                        onPress={pickImage} 
                                        disabled={isUploading}
                                    >
                                        {(isUploading || isImageLoading) ? (
                                            <ActivityIndicator color={colors.primary} />
                                        ) : selectedImage ? (
                                            <Image 
                                                source={{ uri: selectedImage }} 
                                                style={{ width: '100%', height: '100%' }}
                                                contentFit="cover"
                                                onLoadStart={() => setIsImageLoading(true)}
                                                onLoadEnd={() => setIsImageLoading(false)}
                                                onError={() => setIsImageLoading(false)} 
                                            />
                                        ) : (
                                            <Ionicons name="camera-outline" size={30} color={colors.icon} />
                                        )}
                                    </TouchableOpacity>
                                    <View style={{ flex: 1 }}>
                                        <ThemedText style={{ color: colors.textSecondary, fontSize: 11.5 }}>Add a photo of this place (Optional).</ThemedText>
                                        <ThemedText style={{ color: colors.textSecondary, fontSize: 10, marginTop: 4 }}>If no image is provided, category icon will be used.</ThemedText>
                                    </View>
                                </View>
                            </Animated.View>
                        )}
                        <EssentialSubmitForm
                            category={category || 'general'}
                            editData={editData}
                            typesToRender={typesToRender}
                            uploadedImage={uploadedImage}
                            isUploading={isUploading}
                            onSuccess={() => {
                                if (!isEditing) setShowThankYou(true);
                                else handleGoBack();
                            }}
                            onCancel={handleGoBack}
                        />
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
};

export default PlaceSubmissionScreen;

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1 },
    container: {
        flex: 1 },
    content: {
        flex: 1 },

    headerWrap: {
        borderBottomLeftRadius: Layout.headerBorderRadius,
        borderBottomRightRadius: Layout.headerBorderRadius,
        overflow: 'hidden',
        paddingBottom: 20 },
    headerTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 13,
        paddingBottom: 4 },
    backBtn: {
        width: 42,
        height: 42,
        borderRadius: Layout.borderRadius,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center' },
    heroContent: {
        alignItems: 'center',
        paddingHorizontal: 20,
        marginTop: 0 },
    heroIconWrap: {
        width: 44,
        height: 44,
        borderRadius: Layout.borderRadius,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6 },
    heroTitle: {
        fontSize: 16.5,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 4,
        textAlign: 'center',
        letterSpacing: 0.5 },
    heroSubtitle: {
        fontSize: 11.5,
        color: 'rgba(255,255,255,0.85)',
        textAlign: 'center',
        lineHeight: 18,
        fontWeight: '500',
        maxWidth: '90%' },

    scroll: {
        flex: 1 },
    scrollContent: {
        paddingHorizontal: 16 },

    imageSection: {
        marginBottom: 24 },
    imageHeaderWrapper: {
        width: '100%',
        height: 180,
        borderRadius: Layout.borderRadius,
        overflow: 'hidden',
        backgroundColor: '#F1F5F9' },
    imageHeader: {
        width: '100%',
        height: '100%' },
    changeImageBtn: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0 },
    changeImageGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        gap: 8 },
    changeImageText: {
        color: '#FFFFFF',
        fontSize: 11.5,
        fontWeight: '600' },
    imagePlaceholder: {
        width: '100%',
        height: 160,
        borderRadius: Layout.borderRadius,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12 },
    imageIconCircle: {
        width: 64,
        height: 64,
        borderRadius: Layout.borderRadius,
        justifyContent: 'center',
        alignItems: 'center' },
    imagePlaceholderText: {
        fontSize: 12.5,
        fontWeight: '600' },
    uploadOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: Layout.borderRadius,
        zIndex: 10 } });
