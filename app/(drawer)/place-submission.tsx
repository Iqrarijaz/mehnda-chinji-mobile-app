import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    BackHandler,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { getAuthenticatedConfiguration } from '@/apis/configuration';
import { submitEssential, updateRequest, uploadUserImage } from '@/apis/essentials';
import { TimePicker } from '@/components/common/TimePicker';
import { ThankYouModal } from '@/components/common/ThankYou';
import { ThemedText } from '@/components/ThemedText';
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
    const queryClient = useQueryClient();
    const { user } = useAuth();

    const editData = editDataParam ? JSON.parse(editDataParam) : null;
    const isEditing = !!editData;

    const { data: essentialsConfig } = useQuery({
        queryKey: ['configuration', 'ESSENTIALS_ICONS'],
        queryFn: () => getAuthenticatedConfiguration('ESSENTIALS_ICONS'),
        staleTime: 0, // Force fresh fetch to get newly added tags configuration
    });

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

    const [form, setForm] = useState({
        name: '',
        address: '',
        googleAddress: '',
        contact: [{ name: '', number: '' }] as { name: string; number: string }[],
        description: '',
        timing: '', // Health
        services: '', // Health
        type: '',
        images: [] as string[],
        tags: [] as { eng: string; ur: string }[],
        route: [{ city: '', time: '' }] as { city: string; time: string }[],
        metadata: {
            principalName: '',
            totalStudents: '',
            totalTeachers: '',
        }
    });

    const selectedTypeInfo = typesToRender.find((t: any) => t.key?.toLowerCase() === form.type?.toLowerCase());
    const availableTags = selectedTypeInfo?.tags || [];

    const [routePickerIndex, setRoutePickerIndex] = useState<number | null>(null);

    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isImageLoading, setIsImageLoading] = useState(false);
    const [servicesSelection, setServicesSelection] = useState({ start: 0, end: 0 });
    const [isOptimizingDesc, setIsOptimizingDesc] = useState(false);
    const [isOptimizingServices, setIsOptimizingServices] = useState(false);
    const [descriptionHeight, setDescriptionHeight] = useState(120);
    const [showThankYou, setShowThankYou] = useState(false);

    const handleOptimizeText = async (type: 'description' | 'services') => {
        const textToOptimize = type === 'description'
            ? (form.description.trim() || form.name.trim())
            : form.services.trim();
        const tagsToOptimize = form.tags || [];

        if (type === 'services' && !textToOptimize && tagsToOptimize.length === 0) {
            Toast.show({ type: 'info', text1: 'Input Required', text2: 'Please write some text or select some tags first to optimize.' });
            return;
        }

        if (type === 'description') {
            setIsOptimizingDesc(true);
        } else {
            setIsOptimizingServices(true);
        }

        try {
            const { optimizeText } = await import('@/apis/ai');
            const res = await optimizeText({
                module: 'essentials',
                category: category || 'general',
                type,
                text: textToOptimize,
                tags: tagsToOptimize,
            });

            if (res.success && res.optimizedText) {
                handleChange(type, res.optimizedText);
                Toast.show({ type: 'success', text1: 'AI Optimized!', text2: `${type === 'description' ? 'Description' : 'Services'} optimized.` });
            } else {
                Toast.show({ type: 'error', text1: 'Optimization Failed', text2: 'Could not optimize the text.' });
            }
        } catch (error: any) {
            console.error('AI Optimize error:', error);
            Toast.show({ type: 'error', text1: 'Error', text2: error.message || 'An error occurred during AI optimization.' });
        } finally {
            if (type === 'description') {
                setIsOptimizingDesc(false);
            } else {
                setIsOptimizingServices(false);
            }
        }
    };

    // Health Timing State
    const [fromTime, setFromTime] = useState('');
    const [toTime, setToTime] = useState('');
    const [showFromPicker, setShowFromPicker] = useState(false);
    const [showToPicker, setShowToPicker] = useState(false);

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

            return () =>
                subscription.remove();
        }, [])
    );

    // Initial state setup
    useEffect(() => {
        if (!isEditing && user?.user?.role !== 'APP_ADMIN') {
            import('@/ads/interstitial.service').then(({ default: InterstitialService }) => {
                InterstitialService.getInstance().load();
            });
        }
        if (editData) {
            const images = Array.isArray(editData.images) ? editData.images : [];
            setForm({
                name: editData.name || '',
                address: editData.address || '',
                googleAddress: editData.googleAddress || '',
                contact: editData.contact?.length ? editData.contact : [{ name: '', number: '' }],
                description: editData.description || '',
                timing: editData.timing || '',
                services: editData.services || '',
                type: editData.type || '',
                images: images,
                tags: editData.tags || [],
                route: editData.route || [{ city: '', time: '' }],
                metadata: {
                    principalName: editData.metadata?.principalName || '',
                    totalStudents: editData.metadata?.totalStudents?.toString() || '',
                    totalTeachers: editData.metadata?.totalTeachers?.toString() || '',
                }
            });

            // Parse timing for Health category
            if (editData.timing && editData.timing.includes(' - ')) {
                const [start, end] = editData.timing.split(' - ');
                setFromTime(start || '');
                setToTime(end || '');
            } else {
                setFromTime('');
                setToTime('');
            }

            if (images.length > 0) {
                setSelectedImage(images[0]);
                setUploadedImage(images[0]);
            } else {
                setSelectedImage(null);
                setUploadedImage(null);
            }
        } else {
            setForm({
                name: '',
                address: '',
                googleAddress: '',
                contact: [{ name: '', number: '' }],
                description: '',
                timing: '',
                services: '',
                type: '',
                images: [],
                tags: [],
                route: [{ city: '', time: '' }],
                metadata: {
                    principalName: '',
                    totalStudents: '',
                    totalTeachers: '',
                }
            });
            setFromTime('');
            setToTime('');
            setSelectedImage(null);
            setUploadedImage(null);
        }
    }, [editDataParam]);

    const handleChange = (key: string, value: string) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    const insertServicesFormatting = (tag: string) => {
        const { start, end } = servicesSelection;
        const currentText = form.services;
        const newText = currentText.substring(0, start) + tag + currentText.substring(end);
        setForm(prev => ({ ...prev, services: newText }));
    };

    const handleMetadataChange = (key: string, value: string) => {
        setForm(prev => ({
            ...prev,
            metadata: { ...prev.metadata, [key]: value }
        }));
    };

    const handleContactChange = (index: number, key: 'name' | 'number', value: string) => {
        const newContacts = [...form.contact];
        newContacts[index][key] = value;
        setForm(prev => ({ ...prev, contact: newContacts }));
    };

    const addContact = () => {
        if (form.contact.length < 3) {
            setForm(prev => ({
                ...prev,
                contact: [...prev.contact, { name: '', number: '' }]
            }));
        }
    };

    const removeContact = (index: number) => {
        const newContacts = form.contact.filter((_, i) => i !== index);
        setForm(prev => ({ ...prev, contact: newContacts }));
    };

    const addRoute = () => {
        if (form.route.length < 10) {
            setForm(prev => ({
                ...prev,
                route: [...prev.route, { city: '', time: '' }]
            }));
        }
    };

    const removeRoute = (index: number) => {
        const newRoutes = form.route.filter((_, i) => i !== index);
        setForm(prev => ({ ...prev, route: newRoutes }));
    };

    const handleRouteChange = (index: number, key: 'city' | 'time', value: string) => {
        const newRoutes = [...form.route];
        newRoutes[index][key] = value;
        setForm(prev => ({ ...prev, route: newRoutes }));
    };

    const pickImage = async () => {
        if (Platform.OS === 'ios') {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Toast.show({
                    type: 'error',
                    text1: 'Permission Denied',
                    text2: 'Camera roll permissions are required to upload photos.',
                });
                return;
            }
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.8,
        });

        if (!result.canceled) {
            const uri = result.assets[0].uri;
            setSelectedImage(uri);
            handleImageUpload(uri);
        }
    };

    const handleImageUpload = async (uri: string) => {
        setIsUploading(true);
        try {
            const formData = new FormData();
            const filename = uri.split('/').pop() || 'image.jpg';
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : `image`;

            // @ts-ignore
            formData.append('image', { uri, name: filename, type });

            if (uploadedImage) {
                formData.append('existingImageUrl', uploadedImage);
            }
            formData.append('category', category || '');
            formData.append('folderName', 'public');

            const response: any = await uploadUserImage(formData);
            if (response.success) {
                const imageUrl = response.data.imageUrl;
                setUploadedImage(imageUrl);
                setForm(prev => ({ ...prev, images: [imageUrl] }));
            }
        } catch (error) {
            console.error('Upload Error:', error);
            Toast.show({
                type: 'error',
                text1: 'Upload Failed',
                text2: 'Could not upload image. Please try again.',
            });
        } finally {
            setIsUploading(false);
        }
    };

    const submitMutation = useMutation({
        mutationFn: async (payload: any) => {
            if (isEditing) {
                return updateRequest(editData._id, payload);
            }
            return submitEssential(payload);
        },
        onSuccess: () => {
            Toast.show({
                type: 'success',
                text1: isEditing ? 'Updated' : 'Submitted',
                text2: isEditing ? 'Request updated successfully.' : 'Request submitted successfully pending approval.',
            });
            queryClient.invalidateQueries({ queryKey: ['my-essential-requests'] });
            if (!isEditing) {
                setShowThankYou(true);
            } else {
                handleGoBack();
            }
        },
        onError: (error: any) => {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error?.message || error || 'Something went wrong',
            });
        },
    });

    const isHealth = category === 'health';
    const isEducation = category === 'education';
    const isReligious = category?.toLowerCase() === 'religious' || category?.toLowerCase() === 'mosque';
    const isGovt = category?.toLowerCase() === 'govt' || category?.toLowerCase() === 'govt office';
    const isTravel = category?.toLowerCase() === 'travel';
    const isEmergency = category?.toLowerCase() === 'emergency';
    const isNoPhotoCategory = isReligious || isGovt;

    const handleSubmit = () => {
        if (isUploading) {
            Toast.show({
                type: 'info',
                text1: 'Upload in Progress',
                text2: 'Please wait for the photo to finish uploading.',
            });
            return;
        }

        if (!form.name.trim() || (!isTravel && !form.address.trim()) || (!isReligious && !isTravel && !isEmergency && !form.description.trim()) || !form.type.trim()) {
            Toast.show({
                type: 'error',
                text1: 'Validation Error',
                text2: `Name, ${!isTravel ? 'Address, ' : ''}${!isReligious && !isTravel && !isEmergency ? 'Description ' : ''}and Type are required.`,
            });
            return;
        }

        if (!isReligious && !isTravel && !isEmergency && form.description.trim().length < 100) {
            Toast.show({
                type: 'error',
                text1: 'Validation Error',
                text2: 'Description must be at least 100 characters.',
            });
            return;
        }

        if (isHealth || isGovt || isEducation) {
            if (!form.timing.trim()) {
                const categoryLabel = isHealth ? 'Health' : isEducation ? 'Education' : 'Govt';
                Toast.show({
                    type: 'error',
                    text1: 'Validation Error',
                    text2: `Timing is required for ${categoryLabel} category.`,
                });
                return;
            }

            if (form.services.trim() && form.services.trim().length < 50) {
                Toast.show({
                    type: 'error',
                    text1: 'Validation Error',
                    text2: 'Services description must be at least 50 characters.',
                });
                return;
            }
        }

        if (!form.contact[0]?.number.trim()) {
            Toast.show({
                type: 'error',
                text1: 'Validation Error',
                text2: 'At least one contact number is required.',
            });
            return;
        }

        const validContacts = form.contact.filter(c => c.number.trim() !== '');

        // Check for duplicates
        const numbers = validContacts.map(c => c.number.trim());
        const names = validContacts.map(c => (c.name || '').trim().toLowerCase()).filter(n => n !== '');

        if (new Set(numbers).size !== numbers.length) {
            Toast.show({
                type: 'error',
                text1: 'Validation Error',
                text2: 'Duplicate contact numbers are not allowed.',
            });
            return;
        }

        if (new Set(names).size !== names.length) {
            Toast.show({
                type: 'error',
                text1: 'Validation Error',
                text2: 'Duplicate contact names are not allowed.',
            });
            return;
        }

        // Validate 11 digits for each contact
        for (const contact of validContacts) {
            if (contact.number.trim().length !== 11) {
                Toast.show({
                    type: 'error',
                    text1: 'Validation Error',
                    text2: 'Contact number must be exactly 11 digits.',
                });
                return;
            }
        }

        const payload: any = {
            ...form,
            contact: validContacts.map(c => ({ name: c.name, number: c.number })),
            category: category,
            images: uploadedImage ? [uploadedImage] : [],
            tags: (form.tags || []).map((t: any) => ({ eng: t.eng, ur: t.ur })),
            route: isTravel
                ? form.route
                    .filter(r => r.city.trim() !== '' || r.time !== '')
                    .map(r => ({ city: r.city, time: r.time }))
                : [],
            metadata: isEducation ? form.metadata : {},
        };

        if (isTravel) {
            delete payload.address;
            delete payload.description;
        }

        submitMutation.mutate(payload);
    };

    const isPending = submitMutation.isPending;
    const title = isEditing ? `Edit ${category}` : `Submit ${category}`;

    const hasChanges = React.useMemo(() => {
        if (!isEditing) return true;

        const initialContacts = editData.contact?.length ? editData.contact : [{ name: '', number: '' }];
        const currentContacts = form.contact;

        const isMainChanged =
            form.name.trim() !== (editData.name || '').trim() ||
            form.address.trim() !== (editData.address || '').trim() ||
            form.googleAddress.trim() !== (editData.googleAddress || '').trim() ||
            form.description.trim() !== (editData.description || '').trim() ||
            form.timing.trim() !== (editData.timing || '').trim() ||
            form.services.trim() !== (editData.services || '').trim() ||
            form.type !== (editData.type || '') ||
            JSON.stringify(form.tags) !== JSON.stringify(editData.tags || []) ||
            JSON.stringify(form.route) !== JSON.stringify(editData.route || [{ city: '', time: '' }]) ||
            JSON.stringify(form.metadata) !== JSON.stringify(editData.metadata || { principalName: '', totalStudents: '', totalTeachers: '' });

        if (isMainChanged) return true;

        if (currentContacts.length !== initialContacts.length) return true;

        for (let i = 0; i < currentContacts.length; i++) {
            if (
                currentContacts[i].name.trim() !== (initialContacts[i].name || '').trim() ||
                currentContacts[i].number.trim() !== (initialContacts[i].number || '').trim()
            ) {
                return true;
            }
        }

        const initialImage = (editData.images && editData.images.length > 0) ? editData.images[0] : null;

        if (uploadedImage !== initialImage) return true;

        return false;
    }, [form, uploadedImage, editData, isEditing]);

    const handleThankYouClose = () => {
        setShowThankYou(false);
        router.replace('/user/requests');
        if (user?.user?.role !== 'APP_ADMIN') {
            import('@/ads/interstitial.service').then(({ default: InterstitialService }) => {
                InterstitialService.getInstance().show(true);
            });
        }
    };

    return (
        <View style={[styles.mainContainer, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{
                headerShown: false,
                gestureEnabled: true,
                animation: 'slide_from_right'
            }} />

            <ThankYouModal
                visible={showThankYou}
                onClose={handleThankYouClose}
                animationSource={require('@/public/json/onboarding1.json')}
                animationWidth={260}
                animationHeight={200}
            >
                <ThemedText style={{ fontSize: 14, textAlign: 'center', lineHeight: 22, color: colors.textSecondary }}>
                    Dear <ThemedText style={{ fontWeight: 'bold', color: colors.text }}>{user?.user?.name ? user.user.name.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') : 'Hero'}</ThemedText>, thank you for your submission! Our team will review and approve this place shortly.
                </ThemedText>
            </ThankYouModal>

            {/* Header */}
            <Animated.View entering={FadeInUp.duration(600)} style={[styles.headerWrap, { backgroundColor: colors.primary }]}>
                <View style={[styles.headerTopRow, { paddingTop: insets.top + 8 }]}>
                    <TouchableOpacity
                        onPress={handleGoBack}
                        style={styles.backBtn}
                    >
                        <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Animated.View entering={FadeIn.delay(200).duration(500)} style={styles.headerTitleWrap}>
                        <View style={styles.headerTitleRow}>
                            {!isEmergency && !isNoPhotoCategory && selectedImage && (
                                <Image
                                    source={{ uri: selectedImage }}
                                    style={styles.headerThumbnail}
                                />
                            )}
                            <ThemedText style={styles.headerTitle} numberOfLines={1}>
                                {title}
                            </ThemedText>
                        </View>
                    </Animated.View>
                    <View style={{ width: 42 }} />
                </View>
            </Animated.View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <View style={styles.content}>
                    <ScrollView
                        style={styles.scroll}
                        contentContainerStyle={[styles.scrollContent, { paddingTop: 16, paddingBottom: insets.bottom + 40 }]}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Image Section */}
                        {!isEmergency && !isNoPhotoCategory && (
                            <View style={styles.imageSection}>
                                {selectedImage ? (
                                    <View style={styles.imageHeaderWrapper}>
                                        <Image
                                            source={{ uri: selectedImage }}
                                            style={styles.imageHeader}
                                            contentFit="cover"
                                            onLoadStart={() => setIsImageLoading(true)}
                                            onLoadEnd={() => setIsImageLoading(false)}
                                            onError={() => setIsImageLoading(false)}
                                        />
                                        <TouchableOpacity
                                            style={styles.changeImageBtn}
                                            onPress={pickImage}
                                            disabled={isUploading}
                                        >
                                            <LinearGradient
                                                colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.3)']}
                                                style={styles.changeImageGradient}
                                            >
                                                <Ionicons name="camera" size={20} color="#FFF" />
                                                <ThemedText style={styles.changeImageText}>
                                                    {isUploading ? 'Uploading...' : 'Change Photo'}
                                                </ThemedText>
                                            </LinearGradient>
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <TouchableOpacity
                                        style={[styles.imagePlaceholder, { borderColor: colors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC' }]}
                                        onPress={pickImage}
                                        disabled={isUploading}
                                    >
                                        <View style={[styles.imageIconCircle, { backgroundColor: colors.primary + '15' }]}>
                                            <Ionicons name="image" size={32} color={colors.primary} />
                                        </View>
                                        <ThemedText style={[styles.imagePlaceholderText, { color: colors.textSecondary }]}>
                                            {isUploading ? 'Uploading...' : 'Add Photo'}
                                        </ThemedText>
                                    </TouchableOpacity>
                                )}
                                {(isUploading || isImageLoading) && (
                                    <View style={styles.uploadOverlay}>
                                        <ActivityIndicator size="large" color={colors.primary} />
                                        {isUploading && (
                                            <ThemedText style={{ color: '#FFF', fontSize: 12, fontWeight: '700', marginTop: 8 }}>
                                                UPLOADING...
                                            </ThemedText>
                                        )}
                                    </View>
                                )}
                            </View>
                        )}
                        <View style={styles.field}>
                            <View style={styles.labelRow}>
                                <ThemedText style={styles.label}>Name <ThemedText style={{ color: '#EF4444' }}>*</ThemedText></ThemedText>
                                <ThemedText style={[styles.charCount, form.name.length >= 100 && { color: '#EF4444' }]}>
                                    {form.name.length}/100
                                </ThemedText>
                            </View>
                            <TextInput
                                style={[styles.input, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.03)' : '#F1F5F9', color: colors.text, borderColor: colors.border }]}
                                placeholder="Enter name"
                                placeholderTextColor={colors.icon}
                                value={form.name}
                                onChangeText={(text) => handleChange('name', text)}
                                maxLength={100}
                            />
                        </View>

                        <View style={styles.field}>
                            <View style={styles.labelRow}>
                                <ThemedText style={styles.label}>Select Type <ThemedText style={{ color: '#EF4444' }}>*</ThemedText></ThemedText>
                            </View>
                            <ScrollView horizontal showsHorizontalScrollIndicator={true} contentContainerStyle={{ gap: 12, paddingBottom: 8 }}>
                                {typesToRender.map((t: any) => (
                                    <TouchableOpacity
                                        key={t.key}
                                        onPress={() => {
                                            setForm(prev => ({
                                                ...prev,
                                                type: t.key,
                                                tags: [],
                                                ...(isNoPhotoCategory && t.icon && typeof t.icon === 'string'
                                                    ? { images: [t.icon] }
                                                    : {})
                                            }));
                                            if (isNoPhotoCategory && t.icon && typeof t.icon === 'string') {
                                                setUploadedImage(t.icon);
                                                setSelectedImage(t.icon);
                                            }
                                        }}
                                        style={[
                                            styles.typeChip,
                                            { borderColor: colors.border },
                                            form.type === t.key && { backgroundColor: colors.primary, borderColor: colors.primary }
                                        ]}
                                    >
                                        {t.icon && typeof t.icon === 'string' && (
                                            <View style={styles.typeChipImageContainer}>
                                                <Image
                                                    source={{ uri: t.icon }}
                                                    style={{ width: '100%', height: '100%' }}
                                                    contentFit="cover"
                                                />
                                            </View>
                                        )}
                                        <View style={styles.typeChipTextContainer}>
                                            <ThemedText style={[
                                                styles.typeChipText,
                                                form.type === t.key && { color: '#FFFFFF' }
                                            ]} numberOfLines={1}>
                                                {t.label}
                                            </ThemedText>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        {/* Tags Selection */}
                        {availableTags && availableTags.length > 0 && (
                            <View style={styles.field}>
                                <ThemedText style={styles.label}>Select Services / Tags</ThemedText>
                                <View style={styles.tagsContainer}>
                                    {availableTags.map((tag: any) => {
                                        const isSelected = form.tags?.some((t: any) => t.eng?.toLowerCase() === tag.eng?.toLowerCase());
                                        return (
                                            <TouchableOpacity
                                                key={tag.eng}
                                                style={[
                                                    styles.tagChip,
                                                    {
                                                        backgroundColor: isSelected ? colors.primary : (isDark ? 'rgba(255,255,255,0.03)' : '#F1F5F9'),
                                                        borderColor: isSelected ? colors.primary : colors.border,
                                                    }
                                                ]}
                                                onPress={() => {
                                                    if (isSelected) {
                                                        setForm(prev => ({
                                                            ...prev,
                                                            tags: (prev.tags || []).filter((t: any) => t.eng?.toLowerCase() !== tag.eng?.toLowerCase())
                                                        }));
                                                    } else {
                                                        setForm(prev => ({
                                                            ...prev,
                                                            tags: [...(prev.tags || []), tag]
                                                        }));
                                                    }
                                                }}
                                                activeOpacity={0.8}
                                            >
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                                    {isSelected && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
                                                    <ThemedText
                                                        style={[
                                                            styles.tagChipText,
                                                            {
                                                                color: isSelected ? '#FFFFFF' : colors.text,
                                                                fontWeight: isSelected ? '700' : '600',
                                                            }
                                                        ]}
                                                    >
                                                        {tag.eng} | {tag.ur}
                                                    </ThemedText>
                                                </View>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>
                        )}

                        {!isTravel && (
                            <View style={styles.field}>
                                <View style={styles.labelRow}>
                                    <ThemedText style={styles.label}>Address <ThemedText style={{ color: '#EF4444' }}>*</ThemedText></ThemedText>
                                    <ThemedText style={[styles.charCount, form.address.length >= 150 && { color: '#EF4444' }]}>
                                        {form.address.length}/150
                                    </ThemedText>
                                </View>
                                <TextInput
                                    style={[styles.input, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.03)' : '#F1F5F9', color: colors.text, borderColor: colors.border }]}
                                    placeholder="Enter address"
                                    placeholderTextColor={colors.icon}
                                    value={form.address}
                                    onChangeText={(text) => handleChange('address', text)}
                                    maxLength={150}
                                />
                            </View>
                        )}

                        {!isTravel && (
                            <View style={styles.field}>
                                <View style={styles.labelRow}>
                                    <ThemedText style={styles.label}>Google Address (Optional)</ThemedText>
                                </View>
                                <TextInput
                                    style={[styles.input, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.03)' : '#F1F5F9', color: colors.text, borderColor: colors.border }]}
                                    placeholder="Enter Google Maps link or Google Address"
                                    placeholderTextColor={colors.icon}
                                    value={form.googleAddress}
                                    onChangeText={(text) => handleChange('googleAddress', text)}
                                />
                            </View>
                        )}

                        <View style={styles.field}>
                            <View style={styles.labelRow}>
                                <ThemedText style={styles.label}>Contacts (Max 3) <ThemedText style={{ color: '#EF4444' }}>*</ThemedText></ThemedText>
                                {form.contact.length < 3 && (
                                    <TouchableOpacity onPress={addContact}>
                                        <ThemedText style={{ color: colors.primary, fontSize: 13, fontWeight: '700' }}>+ Add Contact</ThemedText>
                                    </TouchableOpacity>
                                )}
                            </View>

                            {form.contact.map((contact, index) => (
                                <View key={index} style={{ marginBottom: 12 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                                        <View style={{ flex: 1, gap: 8 }}>
                                            <TextInput
                                                style={[styles.input, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.03)' : '#F1F5F9', color: colors.text, borderColor: colors.border }]}
                                                placeholder="Contact name (e.g. Admin)"
                                                placeholderTextColor={colors.icon}
                                                value={contact.name}
                                                onChangeText={(text) => handleContactChange(index, 'name', text)}
                                            />
                                            <TextInput
                                                style={[styles.input, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.03)' : '#F1F5F9', color: colors.text, borderColor: colors.border }]}
                                                placeholder="Phone number (e.g. 03000000000)"
                                                placeholderTextColor={colors.icon}
                                                value={contact.number}
                                                onChangeText={(text) => handleContactChange(index, 'number', text)}
                                                keyboardType="phone-pad"
                                                maxLength={11}
                                            />
                                        </View>
                                        {index > 0 && (
                                            <TouchableOpacity
                                                onPress={() => removeContact(index)}
                                                style={{ paddingTop: 14 }}
                                            >
                                                <Ionicons name="trash-outline" size={20} color="#EF4444" />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>
                            ))}
                        </View>

                        {isTravel && (
                            <View style={[styles.field, { marginBottom: 20 }]}>
                                <View style={styles.labelRow}>
                                    <ThemedText style={styles.label}>Route / Schedule (Optional)</ThemedText>
                                    {form.route.length < 10 && (
                                        <TouchableOpacity onPress={addRoute}>
                                            <ThemedText style={{ color: colors.primary, fontSize: 13, fontWeight: '700' }}>+ Add Stop</ThemedText>
                                        </TouchableOpacity>
                                    )}
                                </View>

                                {form.route.map((r, index) => (
                                    <View key={index} style={{ marginBottom: 12 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                            <TextInput
                                                style={[styles.input, { flex: 2, marginBottom: 0, backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.03)' : '#F1F5F9', color: colors.text, borderColor: colors.border }]}
                                                placeholder="City (e.g. Chinji)"
                                                placeholderTextColor={colors.icon}
                                                value={r.city}
                                                onChangeText={(val) => handleRouteChange(index, 'city', val)}
                                            />
                                            <TouchableOpacity
                                                onPress={() => setRoutePickerIndex(index)}
                                                style={[styles.input, { flex: 1.2, marginBottom: 0, justifyContent: 'center', backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.03)' : '#F1F5F9', borderColor: colors.border }]}
                                            >
                                                <ThemedText style={{ color: r.time ? colors.text : colors.icon, fontSize: 12, fontWeight: '600' }}>
                                                    {r.time || 'Time'}
                                                </ThemedText>
                                            </TouchableOpacity>

                                            {index > 0 && (
                                                <TouchableOpacity
                                                    onPress={() => removeRoute(index)}
                                                    style={{ padding: 4 }}
                                                >
                                                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    </View>
                                ))}

                                <TimePicker
                                    visible={routePickerIndex !== null}
                                    onClose={() => setRoutePickerIndex(null)}
                                    onSelect={(val) => {
                                        if (routePickerIndex !== null) {
                                            handleRouteChange(routePickerIndex, 'time', val);
                                        }
                                        setRoutePickerIndex(null);
                                    }}
                                    title="Departure Time"
                                    currentValue={routePickerIndex !== null ? form.route[routePickerIndex].time : ''}
                                />
                            </View>
                        )}

                        {!isReligious && !isTravel && (
                            <View style={styles.field}>
                                <View style={styles.labelRow}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                        <ThemedText style={styles.label}>Description {!isEmergency && <ThemedText style={{ color: '#EF4444' }}>*</ThemedText>}</ThemedText>
                                        <TouchableOpacity
                                            onPress={() => handleOptimizeText('description')}
                                            disabled={isOptimizingDesc || !form.name.trim() || !form.type}
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                gap: 4,
                                                paddingHorizontal: 8,
                                                paddingVertical: 3,
                                                borderRadius: 12,
                                                backgroundColor: (isOptimizingDesc || !form.name.trim() || !form.type) ? (isDark ? 'rgba(255,255,255,0.05)' : '#E2E8F0') : (colors.primary + '12'),
                                                marginLeft: 4,
                                                opacity: (isOptimizingDesc || !form.name.trim() || !form.type) ? 0.6 : 1
                                            }}
                                        >
                                            {isOptimizingDesc ? (
                                                <ActivityIndicator size="small" color={colors.primary} style={{ transform: [{ scale: 0.7 }] }} />
                                            ) : (
                                                <Ionicons name="sparkles" size={12} color={(isOptimizingDesc || !form.name.trim() || !form.type) ? colors.textSecondary : colors.primary} />
                                            )}
                                            <ThemedText style={{ fontSize: 9, fontWeight: '700', color: (isOptimizingDesc || !form.name.trim() || !form.type) ? colors.textSecondary : colors.primary }}>Write Description with AI</ThemedText>
                                        </TouchableOpacity>
                                    </View>
                                    <ThemedText style={[
                                        styles.charCount,
                                        (!isEmergency && form.description.length < 100) && { color: '#EF4444' }
                                    ]}>
                                        {form.description.length} chars {!isEmergency && '(Min 100)'}
                                    </ThemedText>
                                </View>

                                <TextInput
                                    style={[
                                        styles.input,
                                        styles.textArea,
                                        {
                                            backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.03)' : '#F1F5F9',
                                            color: colors.text,
                                            borderColor: colors.border,
                                            fontSize: 12,
                                            height: Math.max(120, descriptionHeight),
                                        }
                                    ]}
                                    placeholder={`Click "Write Description with AI" to generate a description for this place.`}
                                    placeholderTextColor={colors.icon}
                                    value={form.description}
                                    onChangeText={(text) => handleChange('description', text)}
                                    multiline
                                    scrollEnabled={false}
                                    onContentSizeChange={(e) => {
                                        setDescriptionHeight(e.nativeEvent.contentSize.height);
                                    }}
                                    editable={false}
                                />
                            </View>
                        )}

                        {isEducation && (
                            <View style={[styles.field, { gap: 12 }]}>
                                <View style={styles.labelRow}>
                                    <ThemedText style={styles.label}>School/College Details</ThemedText>
                                </View>

                                <View style={styles.inputWrap}>
                                    <ThemedText style={styles.inputLabel}>Principal Name</ThemedText>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.03)' : '#F1F5F9', color: colors.text, borderColor: colors.border }]}
                                        placeholder="Enter Principal Name"
                                        placeholderTextColor={colors.icon}
                                        value={form.metadata.principalName}
                                        onChangeText={(text) => handleMetadataChange('principalName', text)}
                                    />
                                </View>

                                <View style={{ flexDirection: 'row', gap: 12 }}>
                                    <View style={{ flex: 1 }}>
                                        <ThemedText style={styles.inputLabel}>Total Students</ThemedText>
                                        <TextInput
                                            style={[styles.input, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.03)' : '#F1F5F9', color: colors.text, borderColor: colors.border }]}
                                            placeholder="e.g. 500"
                                            placeholderTextColor={colors.icon}
                                            value={form.metadata.totalStudents}
                                            onChangeText={(text) => handleMetadataChange('totalStudents', text.replace(/[^0-9]/g, ''))}
                                            keyboardType="number-pad"
                                        />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <ThemedText style={styles.inputLabel}>Total Teachers</ThemedText>
                                        <TextInput
                                            style={[styles.input, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.03)' : '#F1F5F9', color: colors.text, borderColor: colors.border }]}
                                            placeholder="e.g. 25"
                                            placeholderTextColor={colors.icon}
                                            value={form.metadata.totalTeachers}
                                            onChangeText={(text) => handleMetadataChange('totalTeachers', text.replace(/[^0-9]/g, ''))}
                                            keyboardType="number-pad"
                                        />
                                    </View>
                                </View>
                            </View>
                        )}

                        {(isHealth || isEducation || isGovt) && (
                            <View style={styles.field}>
                                <View style={styles.labelRow}>
                                    <ThemedText style={styles.label}>Timing <ThemedText style={{ color: '#EF4444' }}>*</ThemedText></ThemedText>
                                </View>
                                <View style={{ flexDirection: 'row', gap: 12 }}>
                                    <TouchableOpacity
                                        onPress={() => setShowFromPicker(true)}
                                        style={[styles.input, { flex: 1, justifyContent: 'center', backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F1F5F9', borderColor: colors.border }]}
                                    >
                                        <ThemedText style={{ color: fromTime ? colors.text : colors.icon, fontSize: 13, fontWeight: '600' }}>
                                            {fromTime || 'From'}
                                        </ThemedText>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => setShowToPicker(true)}
                                        style={[styles.input, { flex: 1, justifyContent: 'center', backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F1F5F9', borderColor: colors.border }]}
                                    >
                                        <ThemedText style={{ color: toTime ? colors.text : colors.icon, fontSize: 13, fontWeight: '600' }}>
                                            {toTime || 'To'}
                                        </ThemedText>
                                    </TouchableOpacity>
                                </View>

                                <TimePicker
                                    visible={showFromPicker}
                                    onClose={() => setShowFromPicker(false)}
                                    onSelect={(val) => {
                                        setFromTime(val);
                                        if (toTime) {
                                            handleChange('timing', `${val} - ${toTime}`);
                                        } else {
                                            handleChange('timing', val);
                                        }
                                    }}
                                    title="Opening Time"
                                    currentValue={fromTime}
                                />
                                <TimePicker
                                    visible={showToPicker}
                                    onClose={() => setShowToPicker(false)}
                                    onSelect={(val) => {
                                        setToTime(val);
                                        if (fromTime) {
                                            handleChange('timing', `${fromTime} - ${val}`);
                                        } else {
                                            handleChange('timing', val);
                                        }
                                    }}
                                    title="Closing Time"
                                    currentValue={toTime}
                                />
                            </View>
                        )}

                        {(isHealth || isGovt || isEducation) && (
                            <View style={styles.field}>
                                <View style={styles.labelRow}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                        <ThemedText style={styles.label}>Services <ThemedText style={{ color: colors.textSecondary, fontSize: 10, fontWeight: 'normal' }}>(Optional)</ThemedText></ThemedText>
                                        <TouchableOpacity
                                            onPress={() => handleOptimizeText('services')}
                                            disabled={isOptimizingServices || !form.name.trim() || !form.type}
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                gap: 4,
                                                paddingHorizontal: 8,
                                                paddingVertical: 3,
                                                borderRadius: 12,
                                                backgroundColor: (isOptimizingServices || !form.name.trim() || !form.type) ? (isDark ? 'rgba(255,255,255,0.05)' : '#E2E8F0') : (colors.primary + '12'),
                                                marginLeft: 4,
                                                opacity: (isOptimizingServices || !form.name.trim() || !form.type) ? 0.6 : 1
                                            }}
                                        >
                                            {isOptimizingServices ? (
                                                <ActivityIndicator size="small" color={colors.primary} style={{ transform: [{ scale: 0.7 }] }} />
                                            ) : (
                                                <Ionicons name="sparkles" size={12} color={(isOptimizingServices || !form.name.trim() || !form.type) ? colors.textSecondary : colors.primary} />
                                            )}
                                            <ThemedText style={{ fontSize: 9, fontWeight: '700', color: (isOptimizingServices || !form.name.trim() || !form.type) ? colors.textSecondary : colors.primary }}>AI Optimize</ThemedText>
                                        </TouchableOpacity>
                                    </View>
                                    <ThemedText style={styles.charCount}>
                                        {form.services.length} chars
                                    </ThemedText>
                                </View>

                                <View style={styles.formatToolbar}>
                                    <TouchableOpacity
                                        onPress={() => insertServicesFormatting('# ')}
                                        style={[styles.formatBtn, { backgroundColor: colors.primary + '12' }]}
                                    >
                                        <ThemedText style={[styles.formatBtnText, { color: colors.primary }]}>H1 Heading</ThemedText>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => insertServicesFormatting('## ')}
                                        style={[styles.formatBtn, { backgroundColor: colors.primary + '12' }]}
                                    >
                                        <ThemedText style={[styles.formatBtnText, { color: colors.primary }]}>H2 Subheading</ThemedText>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => insertServicesFormatting('• ')}
                                        style={[styles.formatBtn, { backgroundColor: colors.primary + '12' }]}
                                    >
                                        <ThemedText style={[styles.formatBtnText, { color: colors.primary }]}>• Bullet</ThemedText>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => insertServicesFormatting('\n')}
                                        style={[styles.formatBtn, { backgroundColor: colors.primary + '12' }]}
                                    >
                                        <ThemedText style={[styles.formatBtnText, { color: colors.primary }]}>↵ Line Break</ThemedText>
                                    </TouchableOpacity>
                                </View>

                                <TextInput
                                    style={[styles.input, styles.textArea, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.03)' : '#F1F5F9', color: colors.text, borderColor: colors.border, fontSize: 12 }]}
                                    placeholder={`e.g.\n# Our Services\nWe offer high quality services to the community.\n\n- Service details 1\n- Service details 2`}
                                    placeholderTextColor={colors.icon}
                                    value={form.services}
                                    onChangeText={(text) => handleChange('services', text)}
                                    multiline
                                    numberOfLines={7}
                                    onSelectionChange={(e) => setServicesSelection(e.nativeEvent.selection)}
                                />
                            </View>
                        )}

                        {/* Footer Actions */}
                        <View style={styles.footer}>
                            <TouchableOpacity
                                style={[styles.submitBtn, (isPending || isUploading || (isEditing && !hasChanges)) && { opacity: 0.6 }]}
                                onPress={handleSubmit}
                                disabled={isPending || isUploading || (isEditing && !hasChanges)}
                            >
                                <LinearGradient
                                    colors={[colors.primary, colors.primary]}
                                    style={styles.gradient}
                                >
                                    {isUploading ? (
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                            <ActivityIndicator color="#FFF" size="small" />
                                            <ThemedText style={styles.submitText}>UPLOADING PHOTO...</ThemedText>
                                        </View>
                                    ) : isPending ? (
                                        <ActivityIndicator color="#FFF" />
                                    ) : (
                                        <ThemedText style={styles.submitText}>
                                            {isEditing ? 'UPDATE REQUEST' : 'SUBMIT REQUEST'}
                                        </ThemedText>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={handleGoBack}
                                style={[styles.cancelBtn, { borderColor: colors.border }]}
                                activeOpacity={0.7}
                            >
                                <ThemedText style={styles.cancelText}>Cancel</ThemedText>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
};

export default PlaceSubmissionScreen;

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
    },
    headerWrap: {
        paddingBottom: 16,
        borderBottomLeftRadius: Layout.headerBorderRadius,
        borderBottomRightRadius: Layout.headerBorderRadius,
        overflow: 'hidden',
        zIndex: 2,
    },
    headerTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    backBtn: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: 'rgba(255,255,255,0.18)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitleWrap: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 10,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
        textTransform: 'capitalize',
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 22,
    },
    field: {
        marginBottom: 12,
    },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    label: {
        fontSize: 10,
        fontWeight: '800',
        color: '#64748B',
        letterSpacing: 0.5,
    },
    charCount: {
        fontSize: 11,
        opacity: 0.6,
        fontWeight: '500',
    },
    input: {
        height: 48,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 12,
        marginBottom: 12,
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 6,
        opacity: 0.7,
        marginLeft: 4,
    },
    inputWrap: {
        marginBottom: 4,
    },
    textArea: {
        height: 270,
        textAlignVertical: 'top',
        paddingTop: 10,
    },
    typeChip: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        borderRadius: 12,
        borderWidth: 0,
        backgroundColor: 'transparent',
        width: 80,
        height: 85,
        overflow: 'hidden',
    },
    typeChipImageContainer: {
        height: 60,
        width: '100%',
    },
    typeChipTextContainer: {
        height: 25,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 2,
    },
    typeChipText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#64748B',
        textAlign: 'center',
    },
    footer: {
        marginTop: 12,
        flexDirection: 'row',
        gap: 12,
    },
    submitBtn: {
        flex: 1.5,
        borderRadius: Layout.borderRadius,
        overflow: 'hidden',
    },
    cancelBtn: {
        flex: 1,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: Layout.borderRadius,
    },
    cancelText: {
        fontSize: 13,
        color: '#94A3B8',
        fontWeight: '600',
    },
    gradient: {
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    submitText: {
        color: '#FFFFFF',
        fontWeight: '900',
        fontSize: 14,
        letterSpacing: 1,
    },
    imageSection: {
        marginTop: 20,
        marginBottom: 20,
    },
    imageHeaderWrapper: {
        height: 200,
        width: '100%',
        borderRadius: Layout.borderRadius,
        overflow: 'hidden',
        position: 'relative',
    },
    imageHeader: {
        width: '100%',
        height: '100%',
    },
    changeImageBtn: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        borderRadius: 20,
        overflow: 'hidden',
    },
    changeImageGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        gap: 8,
    },
    changeImageText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '700',
    },
    imagePlaceholder: {
        height: 200,
        width: '100%',
        borderRadius: Layout.borderRadius,
        borderWidth: 2,
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    imageIconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    imagePlaceholderText: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },
    imagePlaceholderSub: {
        fontSize: 12,
        textAlign: 'center',
    },
    uploadOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: Layout.borderRadius,
    },
    headerTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    headerThumbnail: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    formatToolbar: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 8,
        marginTop: 4,
    },
    formatBtn: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    formatBtnText: {
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginTop: 4,
        marginBottom: 8,
    },
    tagChip: {
        borderRadius: 20,
        borderWidth: 1,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    tagChipText: {
        fontSize: 11,
    },
});
