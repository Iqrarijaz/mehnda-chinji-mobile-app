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
    TextInput,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as yup from 'yup';

import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { ScreenHeader } from '@/components/common/ScreenHeader';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { createMarketplaceListing, updateMarketplaceListing, MARKETPLACE_QUERY_KEYS } from '@/apis/marketplace';
import { uploadPublicImage, deletePublicImage } from '@/apis/public';
import { getAuthenticatedConfiguration, CONFIG_QUERY_KEYS } from '@/apis/configuration';

import { MarketplaceCategoryPicker } from './MarketplaceCategoryPicker';
import { FormInput } from '@/components/common/FormInput';
import { SubmitButton } from '@/components/common/SubmitButton';
import { ModalPickerTrigger } from '@/components/common/ModalPickerTrigger';
import { SearchableDropdown } from '@/components/common/SearchableDropdown';
import { LoaderOverlay } from '@/components/common/LoaderOverlay';
import { ThankYouModal } from '@/components/common/ThankYou';
import { LocationPicker, LocationValue } from '@/components/common/LocationPicker';
import { resolveLocationForSubmit } from '@/utils/locationService';
import { marketplaceListingSchema } from '@/utils/validation';

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

    const [showThankYou, setShowThankYou] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        price: '',
        categoryEn: '',
        categoryUr: '',
        typeEn: '',
        typeUr: '',
        negotiable: false,
        address: '',
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
    const handleAddressChange = React.useCallback((val: string) => updateForm('address', val), [updateForm]);
    const handleCityChange = React.useCallback((val: string) => updateForm('city', val.replace(/\b\w/g, l => l.toUpperCase())), [updateForm]);
    const handleVillageChange = React.useCallback((val: string) => updateForm('village', val.replace(/\b\w/g, l => l.toUpperCase())), [updateForm]);
    const handlePhoneChange = React.useCallback((val: string) => updateForm('phone', val.replace(/[^0-9]/g, '')), [updateForm]);

    const [isPickerVisible, setIsPickerVisible] = useState(false);
    const [isUploadingImages, setIsUploadingImages] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [location, setLocation] = useState<LocationValue | null>(null);

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
                address: listingToEdit.place || listingToEdit.address || '',
                city: listingToEdit.city || user?.user?.city || '',
                village: listingToEdit.village || user?.user?.village || '',
                showPhoneNumber: listingToEdit.showPhoneNumber !== false,
                phone: listingToEdit.sellerPhone || user?.user?.phone || '',
                description: listingToEdit.description || '',
                images: Array.isArray(listingToEdit.images)
                    ? [...listingToEdit.images]
                    : [],
                model: listingToEdit.metadata?.model || '',
                year: listingToEdit.metadata?.year ? String(listingToEdit.metadata.year) : ''
            });
            const coords = listingToEdit.location?.coordinates;
            if (Array.isArray(coords) && coords.length === 2 && !(coords[0] === 0 && coords[1] === 0)) {
                setLocation({ latitude: coords[1], longitude: coords[0] });
            } else {
                setLocation(null);
            }
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
                address: '',
                city: user?.user?.city || '',
                village: user?.user?.village || '',
                showPhoneNumber: true,
                phone: user?.user?.phone || '',
                description: '',
                images: [],
                model: '',
                year: ''
            });
            setLocation(null);
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
                if (uploadedUrls.length > 0) {
                    setErrors(prev => ({ ...prev, images: '' }));
                }
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
        const { title, price, address, city, village, categoryEn, typeEn, description, images, negotiable, showPhoneNumber, categoryUr, typeUr, model, year, phone } = formData;
        const sellerPhone = phone || user?.user?.phone || '';

        // Image validation (yup) — shown inline below the images picker.
        try {
            await marketplaceListingSchema.validate({ images }, { abortEarly: false });
            setErrors({});
        } catch (err: any) {
            if (err instanceof yup.ValidationError) {
                const newErrors: { [key: string]: string } = {};
                err.inner.forEach((validationError) => {
                    if (validationError.path) {
                        newErrors[validationError.path] = validationError.message;
                    }
                });
                setErrors(newErrors);
                return;
            }
        }

        if (!title.trim() || !price.trim() || !city.trim() || !village.trim() || !address.trim() || !categoryEn || !typeEn || !description.trim() || !sellerPhone.trim()) {
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
            place: address,
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

        // Attach coordinates: manual selection, else silent current-location
        // capture (only if permission already granted). Absent → saved without.
        const coords = await resolveLocationForSubmit(location);
        if (coords) {
            payload.latitude = coords.latitude;
            payload.longitude = coords.longitude;
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
            {/* ── Hero Header — the shared ScreenHeader, marketplace theme ── */}
            <ScreenHeader
                showMenuIcon={false}
                onBackPress={onClose}
                backIcon="close"
                hideAccountActions
                decor="marketplace"
                hero={{
                    title: listingToEdit ? 'Update Your Listing' : 'Sell An Item',
                    subtitle: listingToEdit
                        ? 'Update your item details'
                        : 'List your item in the marketplace and reach local buyers',
                }}
            />

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

                    {/* Price */}
                    <Animated.View entering={FadeInDown.delay(250)} style={styles.inputField}>
                        <FormInput
                            label="PRICE (RS.)"
                            required
                            icon="cash-outline"
                            keyboardType="number-pad"
                            placeholder="e.g. 25000"
                            value={formData.price}
                            onChangeText={handlePriceChange}
                            maxLength={8}
                        />
                    </Animated.View>


                    {/* Address Map Picker */}
                    <Animated.View entering={FadeInDown.delay(260)} style={styles.inputField}>
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
                                            handleAddressChange(loc.address);
                                            setErrors(prev => ({ ...prev, address: '' }));
                                        }
                                    }}
                                />
                            </View>
                            <ThemedText style={[{ fontSize: 10, fontWeight: '700', color: colors.icon }, formData.address.length >= 150 && { color: '#EF4444' }]}>
                                {formData.address.length}/150
                            </ThemedText>
                        </View>
                        <View style={[{
                            backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.035)',
                            borderRadius: 12,
                            paddingHorizontal: 14,
                            minHeight: 80,
                            alignItems: 'flex-start',
                            paddingVertical: 12,
                            borderColor: errors.address ? '#EF4444' : 'transparent',
                            borderWidth: errors.address ? 1 : 0,
                            marginTop: 6,
                        }]}>
                            <TextInput
                                style={[styles.textInput, { color: colors.text, textAlignVertical: 'top', minHeight: 60, fontSize: 14 }]}
                                placeholder="Shop #, Street, Area"
                                placeholderTextColor={colors.icon}
                                value={formData.address}
                                onChangeText={(text) => {
                                    handleAddressChange(text);
                                    setErrors(prev => ({ ...prev, address: '' }));
                                }}
                                maxLength={150}
                                multiline
                            />
                        </View>
                        {errors.address ? (
                            <ThemedText style={{ color: '#EF4444', fontSize: 11, marginLeft: 4, marginTop: 2 }}>
                                {errors.address}
                            </ThemedText>
                        ) : null}
                    </Animated.View>

                    {/* City & Village */}
                    <Animated.View entering={FadeInDown.delay(265)} style={styles.row}>
                        <FormInput
                            containerStyle={{ flex: 1 }}
                            label="CITY"
                            required
                            icon="business-outline"
                            placeholder="e.g. Talagang"
                            value={formData.city}
                            onChangeText={handleCityChange}
                            maxLength={30}
                            autoCapitalize="words"
                        />
                        <FormInput
                            containerStyle={{ flex: 1, marginLeft: 12 }}
                            label="VILLAGE"
                            required
                            icon="home-outline"
                            placeholder="e.g. Chinji"
                            value={formData.village}
                            onChangeText={handleVillageChange}
                            maxLength={30}
                            autoCapitalize="words"
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
                        <ThemedText style={[styles.label, { color: colors.text }]}>
                            Images (Max 5) <ThemedText style={styles.required}>*</ThemedText>
                        </ThemedText>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesScroll} contentContainerStyle={{ paddingTop: 10, paddingRight: 10, paddingBottom: 10 }}>
                            {formData.images.map((imgUrl, idx) => (
                                <View key={imgUrl} style={styles.imageThumbnailContainer}>
                                    <Image source={{ uri: imgUrl }} style={styles.imageThumbnail} />
                                    <TouchableOpacity style={styles.removeImageBtn} onPress={() => removeImage(idx)}>
                                        <Ionicons name="close-circle" size={30} color="#EF4444" />
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
                        {errors.images ? (
                            <ThemedText style={styles.errorText}>{errors.images}</ThemedText>
                        ) : null}
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



            <LoaderOverlay visible={mutation.isPending || isUploadingImages} />
        </KeyboardAvoidingView>
    );
});

CreateMarketplaceListing.displayName = 'CreateMarketplaceListing';

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    textInput: {
        width: '100%',
        padding: 0,
        margin: 0,
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
        color: '#EF4444',
    },
    errorText: {
        color: '#EF4444',
        fontSize: 12,
        fontWeight: '500',
        marginTop: 4,
        marginLeft: 2,
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
