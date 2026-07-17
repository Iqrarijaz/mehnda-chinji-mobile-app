import React, { useState, useEffect, useMemo } from 'react';
import {
    StyleSheet,
    View,
    TouchableOpacity,
    Platform,
    ScrollView,
    Switch,
    Image,
    KeyboardAvoidingView,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';

import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { createMarketplaceListing, updateMarketplaceListing, MARKETPLACE_QUERY_KEYS } from '@/apis/marketplace';
import { uploadPublicImage, deletePublicImage } from '@/apis/public';
import { getAuthenticatedConfiguration, CONFIG_QUERY_KEYS } from '@/apis/configuration';
import citiesDataFallback from '@/data/cities.json';
import villagesDataFallback from '@/data/villages.json';
import { MarketplaceCategoryPicker } from './MarketplaceCategoryPicker';
import { FormInput } from '@/components/common/FormInput';
import { SubmitButton } from '@/components/common/SubmitButton';
import { ModalPickerTrigger } from '@/components/common/ModalPickerTrigger';
import { SearchableDropdown } from '@/components/common/SearchableDropdown';
import { LoaderOverlay } from '@/components/common/LoaderOverlay';
import { ThankYouModal } from '@/components/common/ThankYou';

interface CreateMarketplaceListingProps {
    visible?: boolean;
    onClose: () => void;
    onSuccess: () => void;
    listingToEdit?: any;
}

export const CreateMarketplaceListing: React.FC<CreateMarketplaceListingProps> = React.memo(({
    visible = true,
    onClose,
    onSuccess,
    listingToEdit,
}) => {
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const insets = useSafeAreaInsets();

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

    const citiesData: string[] = citiesConfigData?.data?.data || citiesDataFallback;
    const villagesData: string[] = villagesConfigData?.data?.data || villagesDataFallback;

    const [cityPickerVisible, setCityPickerVisible] = useState(false);
    const [villagePickerVisible, setVillagePickerVisible] = useState(false);
    const [showThankYou, setShowThankYou] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        price: '',
        categoryEn: '',
        categoryUr: '',
        typeEn: '',
        typeUr: '',
        negotiable: false,
        city: '',
        village: '',
        showPhoneNumber: true,
        phone: '',
        description: '',
        images: [] as string[],
        model: '',
        year: ''
    });

    const updateForm = React.useCallback((field: keyof typeof formData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    const handleTitleChange = React.useCallback((val: string) => updateForm('title', val), [updateForm]);
    const handlePriceChange = React.useCallback((val: string) => updateForm('price', val.replace(/[^0-9]/g, '')), [updateForm]);
    const handleModelChange = React.useCallback((val: string) => updateForm('model', val), [updateForm]);
    const handleYearChange = React.useCallback((val: string) => updateForm('year', val), [updateForm]);
    const handleDescriptionChange = React.useCallback((val: string) => updateForm('description', val), [updateForm]);
    const handleNegotiableToggle = React.useCallback((val: boolean) => updateForm('negotiable', val), [updateForm]);
    const handleCitySelect = React.useCallback((city: string) => updateForm('city', city), [updateForm]);
    const handleVillageSelect = React.useCallback((village: string) => updateForm('village', village), [updateForm]);
    const handlePhoneChange = React.useCallback((val: string) => updateForm('phone', val.replace(/[^0-9]/g, '')), [updateForm]);

    const [isPickerVisible, setIsPickerVisible] = useState(false);
    const [isUploadingImages, setIsUploadingImages] = useState(false);

    // Pre-fill form when editing
    useEffect(() => {
        if (visible && listingToEdit) {
            setFormData({
                title: listingToEdit.title || '',
                price: listingToEdit.price ? String(listingToEdit.price) : '',
                categoryEn: listingToEdit.category?.en || '',
                categoryUr: listingToEdit.category?.ur || '',
                typeEn: listingToEdit.type?.en || '',
                typeUr: listingToEdit.type?.ur || '',
                negotiable: !!listingToEdit.negotiable,
                city: listingToEdit.city || '',
                village: listingToEdit.village || '',
                showPhoneNumber: listingToEdit.showPhoneNumber !== false,
                phone: listingToEdit.sellerPhone || user?.user?.phone || '',
                description: listingToEdit.description || '',
                images: Array.isArray(listingToEdit.images)
                    ? [...listingToEdit.images]
                    : [],
                model: listingToEdit.metadata?.model || '',
                year: listingToEdit.metadata?.year ? String(listingToEdit.metadata.year) : ''
            });
        } else if (visible) {
            // Reset for new listing
            setFormData({
                title: '',
                price: '',
                categoryEn: '',
                categoryUr: '',
                typeEn: '',
                typeUr: '',
                negotiable: false,
                city: '',
                village: '',
                showPhoneNumber: true,
                phone: user?.user?.phone || '',
                description: '',
                images: [],
                model: '',
                year: ''
            });
        }
    }, [visible, listingToEdit, user]);

    const pickImages = async () => {
        if (formData.images.length >= 5) {
            Toast.show({ type: 'info', text1: 'Limit reached', text2: 'You can attach up to 5 images.' });
            return;
        }

        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            alert('We need camera roll permissions to select images.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsMultipleSelection: true,
            quality: 0.7,
            selectionLimit: 5 - formData.images.length
        });

        if (!result.canceled) {
            setIsUploadingImages(true);
            try {
                const uploadedUrls: string[] = [];
                for (const asset of result.assets) {
                    let compressedImage;
                    try {
                        compressedImage = await ImageManipulator.manipulateAsync(
                            asset.uri,
                            [{ resize: { width: 1080 } }],
                            { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
                        );
                    } catch (e) {
                        console.error('Image compression failed', e);
                        compressedImage = asset; // Fallback
                    }

                    const uploadFormData = new FormData();
                    const file: any = {
                        uri: compressedImage.uri,
                        name: `image_${Date.now()}.jpg`,
                        type: `image/jpeg`
                    };
                    uploadFormData.append('image', file);

                    const res: any = await uploadPublicImage(uploadFormData);
                    if (res?.data?.imageUrl) {
                        uploadedUrls.push(res.data.imageUrl);
                    }
                }
                updateForm('images', [...formData.images, ...uploadedUrls]);
            } catch (error) {
                console.error("Image upload failed:", error);
                Toast.show({ type: 'error', text1: 'Upload failed', text2: 'Failed to upload images. Please try again.' });
            } finally {
                setIsUploadingImages(false);
            }
        }
    };

    const removeImage = (index: number) => {
        const newImages = [...formData.images];
        const imgUrl = newImages[index];
        if (imgUrl) {
            deletePublicImage(imgUrl).catch((err) => console.log('Failed to delete image from server', err));
        }
        newImages.splice(index, 1);
        updateForm('images', newImages);
    };

    const mutation = useMutation({
        mutationFn: (payload: any) => {
            if (listingToEdit) {
                return updateMarketplaceListing(payload);
            }
            return createMarketplaceListing(payload);
        },
        onSuccess: (res: any) => {
            queryClient.invalidateQueries({ queryKey: MARKETPLACE_QUERY_KEYS.all });
            Toast.show({
                type: 'success',
                text1: listingToEdit ? 'Listing Updated' : 'Listing Submitted',
                text2: res.message || 'Your marketplace listing is pending admin audit!'
            });
            setShowThankYou(true);
        },
        onError: (err: any) => {
            setIsUploadingImages(false);
            Toast.show({
                type: 'error',
                text1: 'Submission Failed',
                text2: err?.response?.data?.message || 'Something went wrong. Please check your fields.'
            });
        }
    });

    const handleSubmit = async () => {
        const { title, price, city, village, categoryEn, typeEn, description, images, negotiable, showPhoneNumber, categoryUr, typeUr, model, year, phone } = formData;
        const sellerPhone = phone || user?.user?.phone || '';

        if (!title.trim() || !price.trim() || !city.trim() || !village.trim() || !categoryEn || !typeEn || !description.trim() || !sellerPhone.trim()) {
            Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Please fill all required fields.' });
            return;
        }

        if (!sellerPhone || sellerPhone.length !== 11 || !sellerPhone.startsWith('03')) {
            Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Valid phone number required.' });
            return;
        }

        const payload: any = {
            title,
            description,
            price: Number(price),
            city,
            village,
            sellerPhone,
            negotiable,
            showPhoneNumber,
            category: { en: categoryEn, ur: categoryUr },
            type: { en: typeEn, ur: typeUr },
            images: images
        };

        if (listingToEdit) {
            payload.listingId = listingToEdit._id;
        }

        if (categoryEn.toLowerCase() === 'vehicles') {
            const metadataObj: Record<string, any> = {};
            if (model.trim()) metadataObj.model = model;
            if (year.trim()) metadataObj.year = parseInt(year) || undefined;
            payload.metadata = metadataObj;
        } else {
            payload.metadata = {};
        }

        mutation.mutate(payload);
    };

    const isVehicle = formData.categoryEn.toLowerCase() === 'vehicles';

    const handleCategorySelect = (selectedCat: any, selectedType: any) => {
        setFormData(prev => ({
            ...prev,
            categoryEn: selectedCat.en,
            categoryUr: selectedCat.ur,
            typeEn: selectedType.en,
            typeUr: selectedType.ur
        }));
    };

    const handleThankYouClose = () => {
        setShowThankYou(false);
        onSuccess();
        onClose();
        if (user?.user?.role !== 'APP_ADMIN') {
            import('@/ads/interstitial.service').then(({ default: InterstitialService }) => {
                InterstitialService.getInstance().show(true);
            });
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { backgroundColor: colors.background }]}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
            <ThankYouModal
                visible={showThankYou}
                onClose={handleThankYouClose}
                animationSource={require('@/public/json/onboarding3.json')}
                animationWidth={260}
                animationHeight={200}
            >
                <ThemedText style={{ fontSize: 14, textAlign: 'center', lineHeight: 22, color: colors.textSecondary }}>
                    Dear <ThemedText style={{ fontWeight: 'bold', color: colors.text }}>{user?.user?.name ? user.user.name.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') : 'Seller'}</ThemedText>, {listingToEdit ? 'your item details have been updated successfully.' : 'thank you for listing your item! Our team will review and approve it shortly.'}
                </ThemedText>
            </ThankYouModal>
            {/* ── Hero Header ─────────────────────────────────────────── */}
            <Animated.View entering={FadeInUp.duration(500)} style={styles.header}>
                <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.primary }]} />

                {/* Nav row */}
                <View style={[styles.headerTop, { paddingTop: insets.top + (Platform.OS === 'android' ? 16 : 8) }]}>
                    <TouchableOpacity onPress={onClose} style={styles.backButton}>
                        <Ionicons name="close" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Animated.View entering={FadeIn.delay(200).duration(400)} style={{ flex: 1, alignItems: 'center' }}>
                        <ThemedText style={styles.headerNavTitle}>
                            {listingToEdit ? 'Edit Listing' : 'Sell Item'}
                        </ThemedText>
                    </Animated.View>
                    <View style={{ width: 42 }} />
                </View>

                {/* Hero icon + text */}
                <Animated.View entering={FadeInDown.delay(150).duration(500)} style={styles.heroContent}>
                    <View style={styles.heroIconWrap}>
                        <Ionicons name="pricetag" size={32} color="#0D9488" />
                    </View>
                    <ThemedText style={styles.heroTitle}>
                        {listingToEdit ? 'Update Your Listing' : 'Sell An Item'}
                    </ThemedText>
                    <ThemedText style={styles.heroSubtitle}>
                        {listingToEdit
                            ? 'Update your item details'
                            : 'List your item in the marketplace and reach local buyers'}
                    </ThemedText>
                </Animated.View>
            </Animated.View>

            {/* ── Form ────────────────────────────────────────────────── */}
            <ScrollView
                style={styles.scrollContainer}
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingBottom: Platform.OS === 'android' ? 80 : 60 }
                ]}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.formSection}>
                    {/* Title */}
                    <FormInput
                        delay={200}
                        label="TITLE"
                        required
                        icon="pricetag-outline"
                        placeholder="What are you selling?"
                        value={formData.title}
                        onChangeText={handleTitleChange}
                        maxLength={40}
                        showCharCount
                    />

                    {/* Price & Place */}
                    <Animated.View entering={FadeInDown.delay(250)} style={styles.row}>
                        <FormInput
                            containerStyle={{ flex: 1 }}
                            label="PRICE (RS.)"
                            required
                            icon="cash-outline"
                            keyboardType="number-pad"
                            placeholder="e.g. 25000"
                            value={formData.price}
                            onChangeText={handlePriceChange}
                            maxLength={8}
                        />
                        <ModalPickerTrigger
                            containerStyle={{ flex: 1, marginLeft: 12 }}
                            label="CITY"
                            required
                            icon="business-outline"
                            placeholder="Select City"
                            value={formData.city}
                            onPress={() => setCityPickerVisible(true)}
                        />
                    </Animated.View>

                    <Animated.View entering={FadeInDown.delay(260)} style={styles.inputField}>
                        <ModalPickerTrigger
                            label="VILLAGE"
                            required
                            icon="home-outline"
                            placeholder="Select Village"
                            value={formData.village}
                            onPress={() => setVillagePickerVisible(true)}
                        />
                    </Animated.View>

                    {/* Phone Number */}
                    <Animated.View entering={FadeInDown.delay(280)} style={styles.inputField}>
                        <FormInput
                            label="MOBILE NUMBER"
                            required
                            icon="call-outline"
                            keyboardType="phone-pad"
                            placeholder="e.g. 03001234567"
                            value={formData.phone}
                            onChangeText={handlePhoneChange}
                            maxLength={11}
                        />
                    </Animated.View>

                    {/* Category Dropdown Picker Trigger */}
                    <Animated.View entering={FadeInDown.delay(300)} style={styles.inputField}>
                        <ThemedText style={[styles.label, { color: colors.text }]}>
                            CATEGORY & TYPE <ThemedText style={styles.required}>*</ThemedText>
                        </ThemedText>
                        <TouchableOpacity
                            style={[styles.dropdownTrigger, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.035)' }]}
                            onPress={() => setIsPickerVisible(true)}
                        >
                            <View style={styles.triggerContent}>
                                <Ionicons name="grid-outline" size={18} color={colors.icon} style={{ marginRight: 10 }} />
                                <ThemedText style={[styles.triggerText, { color: formData.categoryEn ? colors.text : colors.textSecondary }]}>
                                    {formData.categoryEn ? `${formData.categoryEn} • ${formData.typeEn} (${formData.categoryUr} • ${formData.typeUr})` : 'Select Category & Type'}
                                </ThemedText>
                            </View>
                            <Ionicons name="chevron-down" size={16} color={colors.icon} />
                        </TouchableOpacity>
                    </Animated.View>

                    {/* Vehicle details section (Shown conditionally) */}
                    {isVehicle && (
                        <Animated.View entering={FadeInDown.delay(350)} style={[styles.vehicleSection, { borderColor: colors.border }]}>
                            <ThemedText style={[styles.sectionTitle, { color: colors.primary }]}>Vehicle Specifications</ThemedText>
                            <View style={styles.row}>
                                <FormInput
                                    containerStyle={{ flex: 1 }}
                                    label="MODEL"
                                    placeholder="Civic, Corolla"
                                    value={formData.model}
                                    onChangeText={handleModelChange}
                                />
                                <FormInput
                                    containerStyle={{ flex: 1, marginLeft: 12 }}
                                    label="YEAR"
                                    keyboardType="numeric"
                                    placeholder="e.g. 2021"
                                    value={formData.year}
                                    onChangeText={handleYearChange}
                                />
                            </View>
                        </Animated.View>
                    )}

                    {/* Switches */}
                    <Animated.View entering={FadeInDown.delay(450)} style={styles.switchGroup}>
                        <View style={[styles.switchRow, { borderBottomColor: colors.border }]}>
                            <View style={styles.switchLabelContainer}>
                                <ThemedText style={[styles.switchLabel, { color: colors.text }]}>Negotiable Price</ThemedText>
                                <ThemedText style={[styles.switchSub, { color: colors.textSecondary }]}>Allow buyers to negotiate prices</ThemedText>
                            </View>
                            <Switch value={formData.negotiable} onValueChange={handleNegotiableToggle} trackColor={{ true: colors.primary }} />
                        </View>

                        {/* <View style={[styles.switchRow, { borderBottomColor: colors.border }]}>
                            <View style={styles.switchLabelContainer}>
                                <ThemedText style={[styles.switchLabel, { color: colors.text }]}>Show Contact Publicly</ThemedText>
                                <ThemedText style={[styles.switchSub, { color: colors.textSecondary }]}>Let buyers see your number to call</ThemedText>
                            </View>
                            <Switch value={formData.showPhoneNumber} onValueChange={(val) => updateForm('showPhoneNumber', val)} trackColor={{ true: colors.primary }} />
                        </View> */}
                    </Animated.View>

                    {/* Description */}
                    <FormInput
                        delay={500}
                        label="DESCRIPTION"
                        required
                        multiline
                        placeholder="Describe condition, age, usage..."
                        value={formData.description}
                        onChangeText={handleDescriptionChange}
                    />

                    {/* Pick Images */}
                    <Animated.View entering={FadeInDown.delay(550)} style={styles.inputField}>
                        <ThemedText style={[styles.label, { color: colors.text }]}>Images (Max 5)</ThemedText>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesScroll} contentContainerStyle={{ paddingTop: 10, paddingRight: 10, paddingBottom: 10 }}>
                            {formData.images.map((imgUrl, idx) => (
                                <View key={imgUrl} style={styles.imageThumbnailContainer}>
                                    <Image source={{ uri: imgUrl }} style={styles.imageThumbnail} />
                                    <TouchableOpacity style={styles.removeImageBtn} onPress={() => removeImage(idx)}>
                                        <Ionicons name="close-circle" size={30} color="#FF5A5F" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                            {formData.images.length < 5 && (
                                <TouchableOpacity style={[styles.addImagesBtn, { borderColor: colors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.035)' }]} onPress={pickImages} disabled={isUploadingImages}>
                                    <Ionicons name="camera-outline" size={28} color={colors.primary} />
                                    <ThemedText style={[styles.addImagesText, { color: colors.primary }]}>{isUploadingImages ? 'Uploading...' : 'Add Photo'}</ThemedText>
                                </TouchableOpacity>
                            )}
                        </ScrollView>
                    </Animated.View>

                    {/* Footer Buttons inline */}
                    <Animated.View entering={FadeInUp.delay(600).springify()} style={styles.buttonsRow}>
                        <TouchableOpacity
                            style={[styles.cancelButton, { backgroundColor: isDark ? '#334155' : '#F1F5F9' }]}
                            onPress={onClose}
                            disabled={mutation.isPending || isUploadingImages}
                        >
                            <ThemedText style={[styles.cancelText, { color: colors.textSecondary }]}>
                                Cancel
                            </ThemedText>
                        </TouchableOpacity>
                        <SubmitButton
                            title={listingToEdit ? 'Update' : 'Post Now'}
                            onPress={handleSubmit}
                            isLoading={mutation.isPending || isUploadingImages}
                            style={{ width: 160, height: 40, borderRadius: 20 }}
                        />
                    </Animated.View>

                </View>
            </ScrollView>

            {/* Dynamic Categories Dropdown Picker Modal */}
            <MarketplaceCategoryPicker
                visible={isPickerVisible}
                onClose={() => setIsPickerVisible(false)}
                currentCategory={formData.categoryEn}
                currentType={formData.typeEn}
                onSelect={(selection) => handleCategorySelect(selection.category, selection.type)}
            />

            <SearchableDropdown
                visible={cityPickerVisible}
                onClose={() => setCityPickerVisible(false)}
                onSelect={handleCitySelect}
                currentValue={formData.city}
                options={citiesData}
                title="Select City"
                placeholder="Search city..."
            />

            <SearchableDropdown
                visible={villagePickerVisible}
                onClose={() => setVillagePickerVisible(false)}
                onSelect={handleVillageSelect}
                currentValue={formData.village}
                options={villagesData}
                title="Select Village"
                placeholder="Search village/town..."
            />

            <LoaderOverlay visible={mutation.isPending || isUploadingImages} />
        </KeyboardAvoidingView>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    // ── Hero Header ──────────────────────────────────────────────────────
    header: {
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        overflow: 'hidden',
        paddingBottom: 24,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 4,
    },
    backButton: {
        width: 42,
        height: 42,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerNavTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 0.2,
    },
    heroContent: {
        alignItems: 'center',
        paddingHorizontal: 24,
        marginTop: 16,
    },
    heroIconWrap: {
        width: 64,
        height: 64,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    heroTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFFFFF',
        textAlign: 'center',
        letterSpacing: 0.2,
    },
    heroSubtitle: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
        marginTop: 6,
        lineHeight: 18,
    },

    // ── Form ─────────────────────────────────────────────────────────────
    scrollContainer: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    formSection: {
        paddingHorizontal: 20,
        marginTop: 24,
        gap: 16,
    },
    inputField: {
        gap: 6,
    },
    label: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.5,
        marginLeft: 2,
    },
    required: {
        color: '#FF5A5F',
    },
    row: {
        flexDirection: 'row',
    },

    // ── Inputs (flat, borderless) ─────────────────────────────────────────
    dropdownTrigger: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 12,
        paddingHorizontal: 14,
        height: 48,
    },
    triggerContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    triggerText: {
        flex: 1,
        fontWeight: '500',
        fontSize: 13,
    },

    // ── Switches ─────────────────────────────────────────────────────────
    switchGroup: {
        gap: 8,
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    switchLabelContainer: {
        flex: 1,
    },
    switchLabel: {
        fontSize: 14,
        fontWeight: '600',
    },
    switchSub: {
        fontSize: 11,
        marginTop: 2,
    },

    // ── Images ───────────────────────────────────────────────────────────
    imagesScroll: {
        flexDirection: 'row',
        marginTop: 4,
    },
    imageThumbnailContainer: {
        position: 'relative',
        marginRight: 10,
    },
    imageThumbnail: {
        width: 90,
        height: 90,
        borderRadius: 12,
    },
    removeImageBtn: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: '#fff',
        borderRadius: 15,
        zIndex: 10,
    },
    addImagesBtn: {
        width: 90,
        height: 90,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addImagesText: {
        fontSize: 9,
        fontWeight: '700',
        marginTop: 4,
    },

    // ── Vehicle Section ──────────────────────────────────────────────────
    vehicleSection: {
        borderRadius: 12,
        padding: 12,
        borderStyle: 'dashed',
        borderWidth: 1,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 12,
    },

    // ── Buttons row ──────────────────────────────────────────────────────
    buttonsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        marginTop: 20,
    },
    cancelButton: {
        width: 120,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelText: {
        fontSize: 14,
        fontWeight: '600',
    },
});
