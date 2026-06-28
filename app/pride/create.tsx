import React, { useMemo, useState } from 'react';
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
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useAddPost } from '@/hooks/usePosts';

type CategoryType = 'LIVING_LEGEND' | 'DECEASED';
type PrideFormState = {
    subType: CategoryType;
    fullName: string;
    title: string;
    content: string;
    achievements: string[];
    dateOfBirth: string;
    dateOfDeath: string;
    images: any[];
    profileImage: any | null;
};

export default function CreatePridePostScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();
    const { user } = useAuth();
    const colors = Colors[theme];
    const { subType } = useLocalSearchParams<{ subType?: CategoryType }>();

    const isAdmin = user?.user?.role === 'APP_ADMIN';

    const initialSubType: CategoryType = subType === 'DECEASED' ? 'DECEASED' : 'LIVING_LEGEND';
    const [form, setForm] = useState<PrideFormState>({
        subType: initialSubType,
        fullName: '',
        title: '',
        content: '',
        achievements: [],
        dateOfBirth: '',
        dateOfDeath: '',
        images: [],
        profileImage: null,
    });
    const updateForm = <K extends keyof PrideFormState>(key: K, value: PrideFormState[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const addPostMutation = useAddPost();
    const [newAchievement, setNewAchievement] = useState('');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [activeDateField, setActiveDateField] = useState<'dateOfBirth' | 'dateOfDeath' | null>(null);

    const addAchievementTile = () => {
        if (newAchievement.trim()) {
            updateForm('achievements', [...form.achievements, newAchievement.trim()]);
            setNewAchievement('');
        }
    };

    const removeAchievementTile = (index: number) => {
        updateForm('achievements', form.achievements.filter((_, i) => i !== index));
    };

    const formatDate = (date: Date) => date.toISOString().slice(0, 10);

    const openDatePicker = (field: 'dateOfBirth' | 'dateOfDeath') => {
        setActiveDateField(field);
        setShowDatePicker(true);
    };

    const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
        if (event.type === 'dismissed') {
            setShowDatePicker(false);
            return;
        }
        if (selectedDate && activeDateField) {
            updateForm(activeDateField, formatDate(selectedDate));
        }
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
        }
    };

    const pickProfileImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsMultipleSelection: false,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled && result.assets?.[0]) {
            updateForm('profileImage', result.assets[0]);
        }
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsMultipleSelection: true,
            quality: 0.7,
            selectionLimit: Math.max(1, 5 - form.images.length),
        });

        if (!result.canceled) {
            updateForm('images', [...form.images, ...result.assets]);
        }
    };

    const removeImage = (index: number) => {
        updateForm('images', form.images.filter((_, i) => i !== index));
    };

    const submitDisabled = useMemo(() => {
        const missingRequiredBase = !form.fullName.trim() || !form.title.trim() || !form.content.trim() || !form.profileImage;
        const missingDeathDate = form.subType === 'DECEASED' && !form.dateOfDeath.trim();
        return missingRequiredBase || missingDeathDate || addPostMutation.isPending;
    }, [addPostMutation.isPending, form]);

    const handleSubmit = async () => {
        if (submitDisabled) return;

        const formData = new FormData();
        formData.append('category', 'PRIDE');
        formData.append('type', form.subType);
        formData.append('content', form.content.trim());
        formData.append('metadata[fullName]', form.fullName.trim());
        formData.append('metadata[title]', form.title.trim());
        if (form.dateOfBirth.trim()) {
            formData.append('metadata[dateOfBirth]', form.dateOfBirth.trim());
        }
        if (form.subType === 'DECEASED' && form.dateOfDeath.trim()) {
            formData.append('metadata[dateOfDeath]', form.dateOfDeath.trim());
        }

        form.achievements
            .filter(Boolean)
            .forEach((line, idx) => {
                formData.append(`metadata[achievements][${idx}]`, line);
            });

        if (form.profileImage?.uri) {
            const uriParts = form.profileImage.uri.split('.');
            const fileType = uriParts[uriParts.length - 1];
            const file: any = {
                uri: form.profileImage.uri,
                name: `profileImage.${fileType}`,
                type: `image/${fileType}`,
            };
            formData.append('profileImage', file);
        }

        form.images.forEach((image: any, index: number) => {
            if (image?.uri) {
                const uriParts = image.uri.split('.');
                const fileType = uriParts[uriParts.length - 1];
                const file: any = {
                    uri: image.uri,
                    name: `pride_${index}.${fileType}`,
                    type: `image/${fileType}`,
                };
                formData.append('images', file);
            }
        });

        try {
            await addPostMutation.mutateAsync(formData);
            Toast.show({ type: 'success', text1: 'Pride profile created' });
            router.back();
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: 'Could not create profile',
                text2: error?.message || 'Please try again.',
            });
        }
    };

    if (!isAdmin) {
        return (
            <View style={[styles.center, { backgroundColor: colors.background }]}>
                <ThemedText style={styles.deniedTitle}>Admin access required</ThemedText>
                <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { borderColor: colors.border }]}>
                    <ThemedText style={{ color: colors.text }}>Go Back</ThemedText>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={[styles.container, { backgroundColor: colors.background }]}
        >
            <Stack.Screen options={{ headerShown: false }} />

            <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerIcon}>
                    <Ionicons name="arrow-back" size={20} color={colors.text} />
                </TouchableOpacity>
                <ThemedText style={styles.headerTitle}>Add Pride Entry</ThemedText>
                <View style={styles.headerIcon} />
            </View>

            <ScrollView
                style={styles.form}
                contentContainerStyle={{ paddingBottom: 40 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <View style={[styles.segmented, { backgroundColor: theme === 'dark' ? colors.card : '#FFFFFF', borderColor: colors.border }]}>
                    {(['LIVING_LEGEND', 'DECEASED'] as CategoryType[]).map((type) => {
                        const active = type === form.subType;
                        const label = type === 'DECEASED' ? 'In Memoriam' : 'Our Pride Legends';
                        return (
                            <TouchableOpacity
                                key={type}
                                onPress={() => updateForm('subType', type)}
                                style={[
                                    styles.segment,
                                    active && { backgroundColor: colors.primary },
                                ]}
                            >
                                <ThemedText style={[styles.segmentText, { color: active ? '#FFFFFF' : colors.textSecondary }]}>
                                    {label}
                                </ThemedText>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Profile Image Picker at the start */}
                <View style={styles.profileImageContainer}>
                    <View style={styles.profileImageInner}>
                        <TouchableOpacity
                            onPress={form.profileImage ? undefined : pickProfileImage}
                            style={[styles.profileImageWrapper, {
                                borderColor: colors.border,
                                backgroundColor: theme === 'dark' ? colors.card : '#FFFFFF',
                                borderStyle: form.profileImage ? 'solid' : 'dashed'
                            }]}
                            activeOpacity={form.profileImage ? 1 : 0.8}
                        >
                            {form.profileImage ? (
                                <Image source={{ uri: form.profileImage.uri }} style={styles.profilePreviewImage} contentFit="cover" />
                            ) : (
                                <View style={styles.profileUploadPlaceholder}>
                                    <Ionicons name="person-add-outline" size={26} color={colors.primary} />
                                    <ThemedText style={[styles.profileUploadText, { color: colors.textSecondary }]}>
                                        Upload Photo
                                    </ThemedText>
                                </View>
                            )}
                        </TouchableOpacity>
                        {form.profileImage && (
                            <TouchableOpacity
                                style={[styles.profileRemoveIcon, { zIndex: 99 }]}
                                onPress={() => updateForm('profileImage', null)}
                            >
                                <Ionicons name="trash" size={16} color="#FFFFFF" />
                            </TouchableOpacity>
                        )}
                    </View>
                    <ThemedText style={[styles.fieldLabel, { textAlign: 'center', marginTop: 8 }]}>
                        Profile Hero Image <ThemedText style={styles.required}>*</ThemedText>
                    </ThemedText>
                </View>

                <ThemedText style={styles.fieldLabel}>
                    Full Name <ThemedText style={styles.required}>*</ThemedText>
                </ThemedText>
                <TextInput
                    style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: theme === 'dark' ? colors.card : '#FFFFFF' }]}
                    placeholder="Full name"
                    placeholderTextColor={colors.textSecondary}
                    value={form.fullName}
                    onChangeText={(value) => updateForm('fullName', value)}
                />
                <ThemedText style={styles.fieldLabel}>
                    Title / Designation <ThemedText style={styles.required}>*</ThemedText>
                </ThemedText>
                <TextInput
                    style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: theme === 'dark' ? colors.card : '#FFFFFF' }]}
                    placeholder="Title / designation"
                    placeholderTextColor={colors.textSecondary}
                    value={form.title}
                    onChangeText={(value) => updateForm('title', value)}
                />
                <ThemedText style={styles.fieldLabel}>Date of Birth</ThemedText>
                <TouchableOpacity
                    style={[styles.input, styles.dateInput, { borderColor: colors.border, backgroundColor: theme === 'dark' ? colors.card : '#FFFFFF' }]}
                    onPress={() => openDatePicker('dateOfBirth')}
                    activeOpacity={0.8}
                >
                    <Ionicons name="calendar-outline" size={17} color={colors.primary} />
                    <ThemedText style={[styles.dateValue, { color: form.dateOfBirth ? colors.text : colors.textSecondary }]}>
                        {form.dateOfBirth || 'Select date of birth'}
                    </ThemedText>
                    <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
                {form.subType === 'DECEASED' && (
                    <>
                        <ThemedText style={styles.fieldLabel}>
                            Date of Death <ThemedText style={styles.required}>*</ThemedText>
                        </ThemedText>
                        <TouchableOpacity
                            style={[styles.input, styles.dateInput, { borderColor: colors.border, backgroundColor: theme === 'dark' ? colors.card : '#FFFFFF' }]}
                            onPress={() => openDatePicker('dateOfDeath')}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="calendar-outline" size={17} color={colors.primary} />
                            <ThemedText style={[styles.dateValue, { color: form.dateOfDeath ? colors.text : colors.textSecondary }]}>
                                {form.dateOfDeath || 'Select date of death'}
                            </ThemedText>
                            <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </>
                )}
                <ThemedText style={styles.fieldLabel}>
                    Story / Bio <ThemedText style={styles.required}>*</ThemedText>
                </ThemedText>
                <TextInput
                    style={[styles.textArea, { color: colors.text, borderColor: colors.border, backgroundColor: theme === 'dark' ? colors.card : '#FFFFFF' }]}
                    placeholder="Inspiring story / bio"
                    placeholderTextColor={colors.textSecondary}
                    value={form.content}
                    onChangeText={(value) => updateForm('content', value)}
                    multiline
                    textAlignVertical="top"
                />
                <ThemedText style={styles.fieldLabel}>Key Contributions</ThemedText>

                {/* Achievements Tiles */}
                <View style={styles.tilesContainer}>
                    {form.achievements.map((item, index) => (
                        <View key={index} style={[styles.tile, { backgroundColor: theme === 'dark' ? '#27272A' : '#F1F5F9', borderColor: colors.border }]}>
                            <ThemedText style={[styles.tileText, { color: colors.text }]}>{item}</ThemedText>
                            <TouchableOpacity onPress={() => removeAchievementTile(index)} style={styles.tileRemove}>
                                <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                    ))}
                    {form.achievements.length === 0 && (
                        <ThemedText style={[styles.tilePlaceholderText, { color: colors.textSecondary }]}>
                            No contributions added yet. Add tiles below!
                        </ThemedText>
                    )}
                </View>

                {/* Inline Tile Add Row */}
                <View style={[styles.addTileRow, { borderColor: colors.border, backgroundColor: theme === 'dark' ? colors.card : '#FFFFFF' }]}>
                    <TextInput
                        style={[styles.addTileInput, { color: colors.text }]}
                        placeholder="Click to add new tile..."
                        placeholderTextColor={colors.textSecondary}
                        value={newAchievement}
                        onChangeText={setNewAchievement}
                        onSubmitEditing={addAchievementTile}
                    />
                    <TouchableOpacity onPress={addAchievementTile} style={[styles.addTileBtn, { backgroundColor: colors.primary }]}>
                        <Ionicons name="add" size={18} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>

                <ThemedText style={styles.fieldLabel}>Upload Images</ThemedText>
                <View style={styles.imageSection}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 6 }}>
                        {form.images.map((img: any, index: number) => (
                            <View key={`${img.uri}-${index}`} style={styles.imageWrapper}>
                                <Image source={{ uri: img.uri }} style={styles.previewImage} contentFit="cover" />
                                <TouchableOpacity style={styles.removeIcon} onPress={() => removeImage(index)}>
                                    <Ionicons name="close-circle" size={22} color="#FF5252" />
                                </TouchableOpacity>
                            </View>
                        ))}
                        {form.images.length < 5 && (
                            <TouchableOpacity
                                style={[styles.uploadButton, { borderColor: colors.border, backgroundColor: theme === 'dark' ? colors.card : '#FFFFFF' }]}
                                onPress={pickImage}
                            >
                                <Ionicons name="camera-outline" size={28} color={colors.primary} />
                                <ThemedText style={[styles.uploadText, { color: colors.textSecondary }]}>Add Image</ThemedText>
                            </TouchableOpacity>
                        )}
                    </ScrollView>
                </View>

                {/* Submit button placed inside ScrollView */}
                <View style={[styles.footerInside, { borderTopColor: colors.border }]}>
                    <TouchableOpacity
                        onPress={handleSubmit}
                        disabled={submitDisabled}
                        style={[styles.submitBtn, { backgroundColor: submitDisabled ? colors.border : colors.primary }]}
                    >
                        {addPostMutation.isPending ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <>
                                <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
                                <ThemedText style={styles.submitText}>Create Entry</ThemedText>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {showDatePicker && activeDateField && (
                <View style={styles.datePickerOverlay}>
                    <View style={[styles.datePickerCard, { backgroundColor: theme === 'dark' ? colors.card : '#FFFFFF', borderColor: colors.border }]}>
                        <View style={[styles.datePickerHeader, { borderBottomColor: colors.border }]}>
                            <ThemedText style={styles.datePickerTitle}>
                                {activeDateField === 'dateOfBirth' ? 'Select Date of Birth' : 'Select Date of Death'}
                            </ThemedText>
                            <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                                <Ionicons name="close" size={20} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                        <DateTimePicker
                            value={
                                new Date(
                                    (activeDateField === 'dateOfBirth' ? form.dateOfBirth : form.dateOfDeath) || new Date()
                                )
                            }
                            mode="date"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={onDateChange}
                            maximumDate={new Date()}
                            textColor={colors.text}
                        />
                    </View>
                </View>
            )}
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
    deniedTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
    backBtn: { borderWidth: 1, borderRadius: Layout.borderRadius, paddingHorizontal: 12, paddingVertical: 8 },
    header: {
        minHeight: 56,
        borderBottomWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
    },
    headerIcon: {
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10,
    },
    headerTitle: { fontSize: 17, fontWeight: '800' },
    form: { paddingHorizontal: 16, paddingTop: 16, flex: 1 },
    fieldLabel: {
        fontSize: 12.5,
        fontWeight: '700',
        marginBottom: 6,
        marginTop: 4,
        opacity: 0.85,
    },
    required: {
        color: '#EF4444',
        fontWeight: '800',
    },
    segmented: {
        borderWidth: 1,
        borderRadius: Layout.borderRadius + 8,
        padding: 4,
        flexDirection: 'row',
        marginBottom: 8,
    },
    segment: {
        flex: 1,
        minHeight: 42,
        borderRadius: Layout.borderRadius + 4,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 8,
    },
    segmentText: {
        fontSize: 12.5,
        fontWeight: '700',
    },
    input: {
        minHeight: 46,
        borderWidth: 1,
        borderRadius: Layout.borderRadius,
        paddingHorizontal: 12,
        fontSize: 14,
        marginBottom: 8,
    },
    dateInput: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    dateValue: {
        flex: 1,
        marginLeft: 10,
        fontSize: 14,
    },
    textArea: {
        minHeight: 120,
        borderWidth: 1,
        borderRadius: Layout.borderRadius,
        paddingHorizontal: 12,
        paddingTop: 12,
        fontSize: 14,
        marginBottom: 8,
    },
    textAreaSmall: {
        minHeight: 90,
        borderWidth: 1,
        borderRadius: Layout.borderRadius,
        paddingHorizontal: 12,
        paddingTop: 12,
        fontSize: 13,
        marginBottom: 8,
    },
    imageSection: {
        marginBottom: 8,
    },
    imageWrapper: {
        marginRight: 14,
        marginTop: 4,
        position: 'relative',
    },
    previewImage: {
        width: 96,
        height: 96,
        borderRadius: 12,
    },
    removeIcon: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
    },
    uploadButton: {
        width: 96,
        height: 96,
        borderRadius: 12,
        borderWidth: 1,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 4,
    },
    uploadText: {
        fontSize: 11,
        marginTop: 4,
        fontWeight: '600',
    },
    footer: {
        borderTopWidth: 1,
        paddingHorizontal: 16,
        paddingTop: 10,
    },
    submitBtn: {
        height: 48,
        borderRadius: Layout.borderRadius + 2,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
    },
    submitText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
    tilesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 12,
        marginTop: 4,
    },
    tile: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 18,
        paddingLeft: 12,
        paddingRight: 6,
        paddingVertical: 5,
        gap: 6,
    },
    tileText: {
        fontSize: 13,
        fontWeight: '600',
    },
    tilePlaceholderText: {
        fontSize: 13,
        fontStyle: 'italic',
        opacity: 0.6,
        marginVertical: 4,
    },
    tileRemove: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    addTileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: Layout.borderRadius,
        minHeight: 46,
        paddingLeft: 12,
        paddingRight: 4,
        marginBottom: 16,
    },
    addTileInput: {
        flex: 1,
        fontSize: 13.5,
        paddingVertical: 8,
    },
    addTileBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    footerInside: {
        borderTopWidth: 1,
        paddingTop: 16,
        marginTop: 24,
        marginBottom: 20,
    },
    datePickerOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.35)',
        justifyContent: 'center',
        padding: 20,
    },
    datePickerCard: {
        borderRadius: Layout.borderRadius + 4,
        borderWidth: 1,
        overflow: 'hidden',
    },
    datePickerHeader: {
        minHeight: 44,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        borderBottomWidth: 1,
    },
    datePickerTitle: {
        fontSize: 14,
        fontWeight: '700',
    },
    profileImageContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 16,
    },
    profileImageInner: {
        width: 100,
        height: 100,
        position: 'relative',
    },
    profileImageWrapper: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    profilePreviewImage: {
        width: '100%',
        height: '100%',
        borderRadius: 50,
    },
    profileUploadPlaceholder: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        borderRadius: 50,
    },
    profileUploadText: {
        fontSize: 10.5,
        fontWeight: '700',
        marginTop: 4,
    },
    profileRemoveIcon: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: '#FF5252',
        borderRadius: 16,
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.5,
    },
});
