import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { LinearGradient } from 'expo-linear-gradient';

import { addEvent, updateEvent, uploadUserImage } from '@/apis/essentials';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { SearchableDropdown } from '@/components/common/SearchableDropdown';
import { Layout } from '@/constants/layout';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';

const EVENT_TYPES = [
    { label: 'Admission', value: 'ADMISSION' },
    { label: 'Sports', value: 'SPORTS' },
    { label: 'Holiday', value: 'HOLIDAY' },
    { label: 'Exam', value: 'EXAM' },
    { label: 'Other', value: 'OTHER' },
];

const EventForm = () => {
    const { essentialId, editData: editDataParam } = useLocalSearchParams<{ essentialId: string; editData?: string }>();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();
    const colors = Colors[theme];
    const isDark = theme === 'dark';
    const queryClient = useQueryClient();

    const editData = editDataParam ? JSON.parse(editDataParam) : null;
    const isEditing = !!editData;

    const [form, setForm] = useState({
        name: '',
        description: '',
        date: '',
        type: 'OTHER',
        images: [] as string[],
        externalLink: '',
    });

    const [isUploading, setIsUploading] = useState(false);
    const [selectedImages, setSelectedImages] = useState<string[]>([]);
    const [showTypePicker, setShowTypePicker] = useState(false);

    useEffect(() => {
        if (editData) {
            setForm({
                name: editData.name || '',
                description: editData.description || '',
                date: editData.date || '',
                type: editData.type || 'OTHER',
                images: editData.images || [],
                externalLink: editData.externalLink || '',
            });
            setSelectedImages(editData.images || []);
        }
    }, [editDataParam]);

    const handleGoBack = () => router.back();

    const pickImage = async () => {
        if (isUploading) return;

        if (Platform.OS === 'ios') {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Toast.show({ type: 'error', text1: 'Permission Denied' });
                return;
            }
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: 'images',
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.8,
        });

        if (!result.canceled) {
            const uri = result.assets[0].uri;
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
            formData.append('folderName', 'events');

            const response: any = await uploadUserImage(formData);
            if (response.success) {
                const newUrl = response.data.imageUrl;
                setSelectedImages(prev => [...prev, newUrl]);
                setForm(prev => ({ ...prev, images: [...prev.images, newUrl] }));
            }
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Upload Failed' });
        } finally {
            setIsUploading(false);
        }
    };

    const removeImage = (index: number) => {
        setSelectedImages(prev => prev.filter((_, i) => i !== index));
        setForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
    };

    const mutation = useMutation({
        mutationFn: (payload: any) => {
            if (isEditing) {
                return updateEvent(essentialId, editData._id, payload);
            }
            return addEvent(essentialId, payload);
        },
        onSuccess: () => {
            Toast.show({ type: 'success', text1: isEditing ? 'Updated' : 'Added' });
            queryClient.invalidateQueries({ queryKey: ['my-essential-request', essentialId] });
            handleGoBack();
        },
        onError: (error: any) => {
            Toast.show({ type: 'error', text1: 'Error', text2: error?.message || 'Something went wrong' });
        }
    });

    const handleSubmit = () => {
        if (!form.name.trim() || !form.date.trim() || !form.description.trim()) {
            Toast.show({ type: 'error', text1: 'Required', text2: 'Name, Date, and Description are required' });
            return;
        }
        mutation.mutate(form);
    };

    return (
        <View style={[styles.mainContainer, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Animated Header */}
            <Animated.View entering={FadeInUp.duration(600)} style={styles.header}>
                <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.primary }]} />
                <View style={[styles.headerTop, { paddingTop: insets.top + 10 }]}>
                    <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={isDark ? colors.text : '#FFFFFF'} />
                    </TouchableOpacity>
                    <ThemedText style={[styles.headerTitle, { color: isDark ? colors.text : '#FFFFFF' }]}>
                        {isEditing ? 'Edit Event' : 'Add New Event'}
                    </ThemedText>
                    <View style={{ width: 42 }} />
                </View>
            </Animated.View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={[styles.content, { paddingBottom: Platform.OS === 'android' ? 160 : 140 }]} keyboardShouldPersistTaps="handled">

                    <View style={styles.formSection}>
                        {/* Event Title */}
                        <Animated.View entering={FadeInDown.delay(300)} style={styles.inputField}>
                            <View style={styles.labelContainer}>
                                <ThemedText style={[styles.label, { color: colors.text }]}>
                                    EVENT TITLE <ThemedText style={styles.required}>*</ThemedText>
                                </ThemedText>
                            </View>
                            <View style={[styles.inputBox, { backgroundColor: colors.card, borderColor: colors.border, height: Platform.OS === 'android' ? 48 : 52 }]}>
                                <Ionicons name="document-text-outline" size={18} color={colors.icon} style={{ marginRight: 10 }} />
                                <TextInput
                                    style={[styles.textInput, { color: colors.text, fontSize: Platform.OS === 'android' ? 13 : 14 }]}
                                    value={form.name}
                                    onChangeText={val => setForm(p => ({ ...p, name: val }))}
                                    placeholder="e.g. Annual Sports Day"
                                    placeholderTextColor={colors.icon}
                                />
                            </View>
                        </Animated.View>

                        {/* Event Type Dropdown */}
                        <Animated.View entering={FadeInDown.delay(350)} style={styles.inputField}>
                            <View style={styles.labelContainer}>
                                <ThemedText style={[styles.label, { color: colors.text }]}>
                                    EVENT TYPE <ThemedText style={styles.required}>*</ThemedText>
                                </ThemedText>
                            </View>
                            <TouchableOpacity
                                style={[styles.dropdownTrigger, { backgroundColor: colors.card, borderColor: colors.border, height: Platform.OS === 'android' ? 48 : 52 }]}
                                onPress={() => setShowTypePicker(true)}
                            >
                                <View style={styles.triggerContent}>
                                    <Ionicons name="pricetag-outline" size={18} color={form.type ? colors.primary : colors.icon} style={{ marginRight: 10 }} />
                                    <ThemedText style={[styles.triggerText, !form.type ? { color: colors.icon } : { color: colors.text, textTransform: 'capitalize' }, { fontSize: Platform.OS === 'android' ? 13 : 14 }]}>
                                        {EVENT_TYPES.find(t => t.value === form.type)?.label || 'Select Type'}
                                    </ThemedText>
                                </View>
                                <Ionicons name="chevron-down" size={16} color={colors.icon} />
                            </TouchableOpacity>
                            <SearchableDropdown
                                visible={showTypePicker}
                                onClose={() => setShowTypePicker(false)}
                                options={EVENT_TYPES}
                                onSelect={val => setForm(p => ({ ...p, type: val }))}
                                currentValue={form.type}
                                title="Select Event Type"
                            />
                        </Animated.View>

                        {/* Date / Time Field */}
                        <Animated.View entering={FadeInDown.delay(400)} style={styles.inputField}>
                            <View style={styles.labelContainer}>
                                <ThemedText style={[styles.label, { color: colors.text }]}>
                                    DATE / TIME <ThemedText style={styles.required}>*</ThemedText>
                                </ThemedText>
                            </View>
                            <View style={[styles.inputBox, { backgroundColor: colors.card, borderColor: colors.border, height: Platform.OS === 'android' ? 48 : 52 }]}>
                                <Ionicons name="calendar-outline" size={18} color={colors.icon} style={{ marginRight: 10 }} />
                                <TextInput
                                    style={[styles.textInput, { color: colors.text, fontSize: Platform.OS === 'android' ? 13 : 14 }]}
                                    value={form.date}
                                    onChangeText={val => setForm(p => ({ ...p, date: val }))}
                                    placeholder="e.g. 25th Dec, 10:00 AM"
                                    placeholderTextColor={colors.icon}
                                />
                            </View>
                        </Animated.View>

                        {/* External Link */}
                        <Animated.View entering={FadeInDown.delay(450)} style={styles.inputField}>
                            <View style={styles.labelContainer}>
                                <ThemedText style={[styles.label, { color: colors.text }]}>
                                    EXTERNAL LINK
                                </ThemedText>
                            </View>
                            <View style={[styles.inputBox, { backgroundColor: colors.card, borderColor: colors.border, height: Platform.OS === 'android' ? 48 : 52 }]}>
                                <Ionicons name="link-outline" size={18} color={colors.icon} style={{ marginRight: 10 }} />
                                <TextInput
                                    style={[styles.textInput, { color: colors.text, fontSize: Platform.OS === 'android' ? 13 : 14 }]}
                                    value={form.externalLink}
                                    onChangeText={val => setForm(p => ({ ...p, externalLink: val }))}
                                    placeholder="https://..."
                                    autoCapitalize="none"
                                    placeholderTextColor={colors.icon}
                                />
                            </View>
                        </Animated.View>

                        {/* Description */}
                        <Animated.View entering={FadeInDown.delay(500)} style={styles.inputField}>
                            <View style={styles.labelContainer}>
                                <ThemedText style={[styles.label, { color: colors.text }]}>
                                    DESCRIPTION <ThemedText style={styles.required}>*</ThemedText>
                                </ThemedText>
                            </View>
                            <View style={[styles.inputBox, { backgroundColor: colors.card, borderColor: colors.border, height: 100, alignItems: 'flex-start', paddingTop: 12 }]}>
                                <Ionicons name="information-circle-outline" size={18} color={colors.icon} style={{ marginRight: 10 }} />
                                <TextInput
                                    style={[styles.textInput, { color: colors.text, fontSize: Platform.OS === 'android' ? 13 : 14, height: '100%', textAlignVertical: 'top' }]}
                                    value={form.description}
                                    onChangeText={val => setForm(p => ({ ...p, description: val }))}
                                    placeholder="Tell more about this event..."
                                    multiline
                                    numberOfLines={4}
                                    placeholderTextColor={colors.icon}
                                />
                            </View>
                        </Animated.View>

                        {/* Event Photos */}
                        <Animated.View entering={FadeInDown.delay(550)} style={styles.inputField}>
                            <View style={styles.labelContainer}>
                                <ThemedText style={[styles.label, { color: colors.text }]}>
                                    EVENT PHOTOS (MAX 5)
                                </ThemedText>
                            </View>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageList}>
                                {selectedImages.map((uri, idx) => (
                                    <View key={idx} style={styles.imageWrapper}>
                                        <Image source={{ uri }} style={styles.eventImage} />
                                        <TouchableOpacity style={styles.deleteImgBtn} onPress={() => removeImage(idx)}>
                                            <Ionicons name="close-circle" size={24} color="#EF4444" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                                {selectedImages.length < 5 && (
                                    <TouchableOpacity
                                        style={[styles.addImgBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
                                        onPress={pickImage}
                                        disabled={isUploading}
                                    >
                                        {isUploading ? (
                                            <ActivityIndicator color={colors.primary} />
                                        ) : (
                                            <>
                                                <Ionicons name="camera" size={24} color={colors.icon} />
                                                <ThemedText style={[styles.addImgText, { color: colors.textSecondary }]}>Add</ThemedText>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                )}
                            </ScrollView>
                        </Animated.View>

                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Sticky Footer Button */}
            <View style={[styles.footer, {
                backgroundColor: isDark ? colors.card : 'rgba(245, 246, 250, 0.95)',
                borderTopColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                borderTopWidth: 1,
                paddingBottom: Math.max(insets.bottom, 20)
            }]}>
                <TouchableOpacity
                    style={styles.updateButton}
                    onPress={handleSubmit}
                    disabled={mutation.isPending || isUploading}
                >
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.primary }]} />
                    {mutation.isPending ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <View style={styles.buttonContent}>
                            <ThemedText style={styles.updateButtonText}>{isEditing ? 'Save Event' : 'Post Event'}</ThemedText>
                            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                        </View>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default EventForm;

const styles = StyleSheet.create({
    mainContainer: { flex: 1 },
    header: {
        height: Platform.OS === 'android' ? 100 : 110,
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
        width: 42,
        height: 42,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        textAlign: 'center',
    },
    headerContentWrapper: {
        alignItems: 'center',
        marginTop: 20,
    },
    welcomeText: {
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 6,
        textAlign: 'center',
    },
    subtitleText: {
        fontSize: 12,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    content: { paddingBottom: 140 },
    formSection: {
        paddingHorizontal: 20,
        marginTop: 20,
        gap: 16,
    },
    inputField: { gap: 6 },
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
    required: { color: '#EF4444' },
    inputBox: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: Layout.borderRadius,
        paddingHorizontal: 14,
    },
    textInput: { flex: 1, fontWeight: '500' },
    dropdownTrigger: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: Layout.borderRadius,
        paddingHorizontal: 14,
    },
    triggerContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    triggerText: {
        fontWeight: '500',
    },
    imageList: { flexDirection: 'row', marginTop: 4 },
    imageWrapper: { width: 90, height: 90, borderRadius: Layout.borderRadius, overflow: 'hidden', marginRight: 12 },
    eventImage: { width: '100%', height: '100%' },
    deleteImgBtn: { position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 12 },
    addImgBtn: {
        width: 90,
        height: 90,
        borderRadius: Layout.borderRadius,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
    },
    addImgText: { fontSize: 11, fontWeight: '600', marginTop: 4 },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'android' ? 10 : 12,
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
