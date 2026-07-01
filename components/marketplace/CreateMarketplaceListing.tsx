import React, { useState, useEffect, useMemo } from 'react';
import {
    StyleSheet,
    View,
    TouchableOpacity,
    TextInput,
    Platform,
    ActivityIndicator,
    ScrollView,
    Switch,
    Image,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { createMarketplaceListing, updateMarketplaceListing, MARKETPLACE_QUERY_KEYS } from '@/apis/marketplace';
import { uploadPublicImage } from '@/apis/public';
import { MarketplaceCategoryPicker } from './MarketplaceCategoryPicker';

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
    const queryClient = useQueryClient();
    const insets = useSafeAreaInsets();

    const [title, setTitle] = useState('');
    const [price, setPrice] = useState('');

    // Selected category/type states
    const [categoryEn, setCategoryEn] = useState('');
    const [categoryUr, setCategoryUr] = useState('');
    const [typeEn, setTypeEn] = useState('');
    const [typeUr, setTypeUr] = useState('');

    const [negotiable, setNegotiable] = useState(false);
    const [place, setPlace] = useState('');
    const [sellerPhone, setSellerPhone] = useState('');
    const [showPhoneNumber, setShowPhoneNumber] = useState(true);
    const [description, setDescription] = useState('');
    const [images, setImages] = useState<ImagePicker.ImagePickerAsset[]>([]);

    // Vehicle-specific sub-states
    const [model, setModel] = useState('');
    const [year, setYear] = useState('');

    const [isPickerVisible, setIsPickerVisible] = useState(false);
    const [isUploadingImages, setIsUploadingImages] = useState(false);

    // Pre-fill form when editing
    useEffect(() => {
        if (visible && listingToEdit) {
            setTitle(listingToEdit.title || '');
            setPrice(listingToEdit.price ? String(listingToEdit.price) : '');

            setCategoryEn(listingToEdit.category?.en || '');
            setCategoryUr(listingToEdit.category?.ur || '');
            setTypeEn(listingToEdit.type?.en || '');
            setTypeUr(listingToEdit.type?.ur || '');

            setNegotiable(!!listingToEdit.negotiable);
            setPlace(listingToEdit.place || '');
            setSellerPhone(listingToEdit.sellerPhone || '');
            setShowPhoneNumber(listingToEdit.showPhoneNumber !== false);
            setDescription(listingToEdit.description || '');
            if (listingToEdit.images && Array.isArray(listingToEdit.images)) {
                setImages(listingToEdit.images.map((url: string) => ({ uri: url } as any)));
            } else {
                setImages([]);
            }
            // Populate vehicle details
            if (listingToEdit.metadata) {
                setModel(listingToEdit.metadata.model || '');
                setYear(listingToEdit.metadata.year ? String(listingToEdit.metadata.year) : '');
            } else {
                resetVehicleFields();
            }
        } else if (visible) {
            // Reset for new listing
            setTitle('');
            setPrice('');
            setCategoryEn('');
            setCategoryUr('');
            setTypeEn('');
            setTypeUr('');
            setNegotiable(false);
            setPlace('');
            setSellerPhone('');
            setShowPhoneNumber(true);
            setDescription('');
            setImages([]);
            resetVehicleFields();
        }
    }, [visible, listingToEdit]);

    const resetVehicleFields = () => {
        setModel('');
        setYear('');
    };

    const pickImages = async () => {
        if (images.length >= 5) {
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
            selectionLimit: 5 - images.length
        });

        if (!result.canceled) {
            setImages([...images, ...result.assets]);
        }
    };

    const removeImage = (index: number) => {
        const newImages = [...images];
        newImages.splice(index, 1);
        setImages(newImages);
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
            onSuccess();
            onClose();
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
        if (!title.trim() || !price.trim() || !place.trim() || !sellerPhone.trim() || !categoryEn || !typeEn || !description.trim()) {
            Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Please fill all required fields.' });
            return;
        }

        setIsUploadingImages(true);
        try {
            const finalImages: string[] = [];
            for (const img of images) {
                if (img.uri.startsWith('http')) {
                    finalImages.push(img.uri);
                } else {
                    const uploadFormData = new FormData();
                    const uriParts = img.uri.split('.');
                    const fileType = uriParts[uriParts.length - 1];
                    const file: any = {
                        uri: img.uri,
                        name: `image_${Date.now()}.${fileType}`,
                        type: `image/${fileType}`
                    };
                    uploadFormData.append('image', file);
                    
                    const res: any = await uploadPublicImage(uploadFormData);
                    if (res?.data?.imageUrl) {
                        finalImages.push(res.data.imageUrl);
                    }
                }
            }

            const payload: any = {
                title,
                description,
                price: Number(price),
                place,
                sellerPhone,
                negotiable,
                showPhoneNumber,
                category: { en: categoryEn, ur: categoryUr },
                type: { en: typeEn, ur: typeUr },
                images: finalImages
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
        } catch (error) {
            console.error("Image upload failed:", error);
            Toast.show({ type: 'error', text1: 'Upload failed', text2: 'Failed to upload images. Please try again.' });
            setIsUploadingImages(false);
        }
    };

    const isVehicle = categoryEn.toLowerCase() === 'vehicles';

    const handleCategorySelect = (selectedCat: any, selectedType: any) => {
        setCategoryEn(selectedCat.en);
        setCategoryUr(selectedCat.ur);
        setTypeEn(selectedType.en);
        setTypeUr(selectedType.ur);
    };

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                {/* Header */}
                <View style={[styles.header, { backgroundColor: colors.primary, paddingTop: insets.top + (Platform.OS === 'android' ? 16 : 20) }]}>
                    <ThemedText style={[styles.modalTitle, { color: '#FFFFFF' }]}>
                        {listingToEdit ? 'Edit Item Listing' : 'Sell An Item'}
                    </ThemedText>
                    <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                        <Ionicons name="close" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>

                {/* Form Elements */}
                <ScrollView
                    style={styles.scrollContainer}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.form}>
                        {/* Title */}
                        <View style={styles.inputGroup}>
                            <ThemedText style={[styles.label, { color: colors.textSecondary }]}>Title <ThemedText style={{ color: '#EF4444' }}>*</ThemedText></ThemedText>
                            <View style={[styles.inputBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.035)' }]}>
                                <TextInput
                                    style={[styles.input, { color: colors.text }]}
                                    value={title}
                                    onChangeText={setTitle}
                                    placeholder="What are you selling?"
                                    placeholderTextColor={colors.textSecondary}
                                />
                            </View>
                        </View>

                        {/* Price & Place */}
                        <View style={styles.row}>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <ThemedText style={[styles.label, { color: colors.textSecondary }]}>Price (Rs.) <ThemedText style={{ color: '#EF4444' }}>*</ThemedText></ThemedText>
                                <View style={[styles.inputBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.035)' }]}>
                                    <TextInput
                                        style={[styles.input, { color: colors.text }]}
                                        value={price}
                                        onChangeText={setPrice}
                                        keyboardType="numeric"
                                        placeholder="e.g. 25000"
                                        placeholderTextColor={colors.textSecondary}
                                    />
                                </View>
                            </View>
                            <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                                <ThemedText style={[styles.label, { color: colors.textSecondary }]}>Location / Place <ThemedText style={{ color: '#EF4444' }}>*</ThemedText></ThemedText>
                                <View style={[styles.inputBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.035)' }]}>
                                    <TextInput
                                        style={[styles.input, { color: colors.text }]}
                                        value={place}
                                        onChangeText={setPlace}
                                        placeholder="e.g. Karachi"
                                        placeholderTextColor={colors.textSecondary}
                                    />
                                </View>
                            </View>
                        </View>

                        {/* Category Dropdown Picker Trigger */}
                        <View style={styles.inputGroup}>
                            <ThemedText style={[styles.label, { color: colors.textSecondary }]}>Category & Type *</ThemedText>
                            <TouchableOpacity
                                style={[styles.dropdownTrigger, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.035)' }]}
                                onPress={() => setIsPickerVisible(true)}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                    <Ionicons name="grid-outline" size={18} color={colors.icon} style={{ marginRight: 10 }} />
                                    <ThemedText style={{ color: categoryEn ? colors.text : colors.textSecondary, fontSize: 13 }}>
                                        {categoryEn ? `${categoryEn} • ${typeEn} (${categoryUr} • ${typeUr})` : 'Select Category & Type'}
                                    </ThemedText>
                                </View>
                                <Ionicons name="chevron-down" size={16} color={colors.icon} />
                            </TouchableOpacity>
                        </View>

                        {/* Vehicle details section (Shown conditionally) */}
                        {isVehicle && (
                            <View style={[styles.vehicleSection, { borderColor: colors.border }]}>
                                <ThemedText style={[styles.sectionTitle, { color: colors.primary }]}>Vehicle Specifications</ThemedText>

                                <View style={styles.row}>
                                    <View style={[styles.inputGroup, { flex: 1 }]}>
                                        <ThemedText style={[styles.label, { color: colors.textSecondary }]}>Model</ThemedText>
                                        <View style={[styles.inputBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.035)' }]}>
                                            <TextInput
                                                style={[styles.input, { color: colors.text }]}
                                                value={model}
                                                onChangeText={setModel}
                                                placeholder="Civic, Corolla"
                                                placeholderTextColor={colors.textSecondary}
                                            />
                                        </View>
                                    </View>
                                    <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                                        <ThemedText style={[styles.label, { color: colors.textSecondary }]}>Year</ThemedText>
                                        <View style={[styles.inputBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.035)' }]}>
                                            <TextInput
                                                style={[styles.input, { color: colors.text }]}
                                                value={year}
                                                onChangeText={setYear}
                                                keyboardType="numeric"
                                                placeholder="e.g. 2021"
                                                placeholderTextColor={colors.textSecondary}
                                            />
                                        </View>
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* Phone Number */}
                        <View style={styles.inputGroup}>
                            <ThemedText style={[styles.label, { color: colors.textSecondary }]}>Contact Phone Number <ThemedText style={{ color: '#EF4444' }}>*</ThemedText></ThemedText>
                            <View style={[styles.inputBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.035)' }]}>
                                <TextInput
                                    style={[styles.input, { color: colors.text }]}
                                    value={sellerPhone}
                                    onChangeText={setSellerPhone}
                                    keyboardType="phone-pad"
                                    placeholder="e.g. 03001234567"
                                    placeholderTextColor={colors.textSecondary}
                                />
                            </View>
                        </View>

                        {/* Negotiable & Show Phone number switches */}
                        <View style={[styles.switchRow, { borderBottomColor: colors.border }]}>
                            <View style={styles.switchLabelContainer}>
                                <ThemedText style={[styles.switchLabel, { color: colors.text }]}>Negotiable Price</ThemedText>
                                <ThemedText style={[styles.switchSub, { color: colors.textSecondary }]}>Allow buyers to negotiate prices</ThemedText>
                            </View>
                            <Switch value={negotiable} onValueChange={setNegotiable} trackColor={{ true: colors.primary }} />
                        </View>

                        <View style={[styles.switchRow, { borderBottomColor: colors.border }]}>
                            <View style={styles.switchLabelContainer}>
                                <ThemedText style={[styles.switchLabel, { color: colors.text }]}>Show Contact Publicly</ThemedText>
                                <ThemedText style={[styles.switchSub, { color: colors.textSecondary }]}>Let buyers see your number to call</ThemedText>
                            </View>
                            <Switch value={showPhoneNumber} onValueChange={setShowPhoneNumber} trackColor={{ true: colors.primary }} />
                        </View>

                        {/* Description */}
                        <View style={styles.inputGroup}>
                            <ThemedText style={[styles.label, { color: colors.textSecondary }]}>Description <ThemedText style={{ color: '#EF4444' }}>*</ThemedText></ThemedText>
                            <View style={[styles.textAreaBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.035)' }]}>
                                <TextInput
                                    style={[styles.textArea, { color: colors.text }]}
                                    value={description}
                                    onChangeText={setDescription}
                                    multiline
                                    numberOfLines={4}
                                    placeholder="Describe condition, age, usage..."
                                    placeholderTextColor={colors.textSecondary}
                                />
                            </View>
                        </View>

                        {/* Pick Images */}
                        <View style={styles.inputGroup}>
                            <ThemedText style={[styles.label, { color: colors.textSecondary }]}>Images (Max 5)</ThemedText>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesScroll}>
                                {images.map((img, idx) => (
                                    <View key={img.uri} style={styles.imageThumbnailContainer}>
                                        <Image source={{ uri: img.uri }} style={styles.imageThumbnail} />
                                        <TouchableOpacity style={styles.removeImageBtn} onPress={() => removeImage(idx)}>
                                            <Ionicons name="close-circle" size={20} color="#EF4444" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                                {images.length < 5 && (
                                    <TouchableOpacity style={[styles.addImagesBtn, { borderColor: colors.border }]} onPress={pickImages}>
                                        <Ionicons name="camera-outline" size={28} color={colors.primary} />
                                        <ThemedText style={[styles.addImagesText, { color: colors.primary }]}>Add Photo</ThemedText>
                                    </TouchableOpacity>
                                )}
                            </ScrollView>
                        </View>
                    </View>
                </ScrollView>

                {/* Footer Buttons */}
                <View style={[styles.footer, { borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom + 12, 16) }]}>
                    <TouchableOpacity style={[styles.footerBtn, styles.cancelBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9' }]} onPress={onClose}>
                        <ThemedText style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Cancel</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.footerBtn, styles.submitBtn, { backgroundColor: colors.primary }]} onPress={handleSubmit} disabled={mutation.isPending || isUploadingImages}>
                        {(mutation.isPending || isUploadingImages) ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <ThemedText style={styles.submitBtnText}>{listingToEdit ? 'Update' : 'Post Now'}</ThemedText>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            {/* Dynamic Categories Dropdown Picker Modal */}
            <MarketplaceCategoryPicker
                visible={isPickerVisible}
                onClose={() => setIsPickerVisible(false)}
                currentCategory={categoryEn}
                currentType={typeEn}
                onSelect={(selection) => handleCategorySelect(selection.category, selection.type)}
            />
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        width: '100%',
        flex: 1,
        backgroundColor: 'transparent',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContainer: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 24,
        paddingTop: 12,
    },
    form: {
        marginTop: 6,
    },
    inputGroup: {
        marginBottom: 12,
    },
    row: {
        flexDirection: 'row',
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 6,
    },
    inputBox: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 48,
        borderRadius: 12,
        borderWidth: 0,
        paddingHorizontal: 12,
    },
    input: {
        flex: 1,
        fontSize: 14,
        height: '100%',
    },
    dropdownTrigger: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 48,
        borderRadius: 12,
        borderWidth: 0,
        paddingHorizontal: 12,
    },
    textAreaBox: {
        borderRadius: 12,
        borderWidth: 0,
        paddingHorizontal: 12,
        paddingVertical: 12,
    },
    textArea: {
        height: 80,
        fontSize: 14,
        textAlignVertical: 'top',
    },
    vehicleSection: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 10,
        marginBottom: 12,
        borderStyle: 'dashed',
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 12,
    },
    specChoice: {
        height: 36,
        borderRadius: 6,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    choiceGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    chipText: {
        fontSize: 12,
        fontWeight: '600',
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        marginBottom: 16,
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
    imagesScroll: {
        flexDirection: 'row',
        marginTop: 6,
    },
    imageThumbnailContainer: {
        position: 'relative',
        marginRight: 10,
    },
    imageThumbnail: {
        width: 70,
        height: 70,
        borderRadius: 6,
    },
    removeImageBtn: {
        position: 'absolute',
        top: -6,
        right: -6,
        backgroundColor: '#fff',
        borderRadius: 10,
    },
    addImagesBtn: {
        width: 70,
        height: 70,
        borderRadius: 6,
        borderWidth: 1.5,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    addImagesText: {
        fontSize: 9,
        fontWeight: '700',
        marginTop: 4,
    },
    footer: {
        flexDirection: 'row',
        paddingVertical: 12,
        borderTopWidth: 1,
        justifyContent: 'center',
        gap: 12,
    },
    footerBtn: {
        width: 100,
        height: 36,
        marginTop: 4,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelBtn: {
        borderWidth: 1,
        borderColor: 'transparent',
    },
    cancelBtnText: {
        fontWeight: '600',
        fontSize: 14,
    },
    submitBtn: {},
    submitBtnText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
});
