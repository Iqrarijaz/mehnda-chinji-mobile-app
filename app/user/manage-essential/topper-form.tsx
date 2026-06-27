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

import { addTopper, updateTopper, uploadUserImage } from '@/apis/essentials';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { Layout } from '@/constants/layout';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { SearchableDropdown } from '@/components/common/SearchableDropdown';

const ACADEMIC_CLASSES = [
    { label: 'Playgroup / Nursery', value: 'playgroup_nursery' },
    { label: 'Prep / Kindergarten', value: 'prep_kindergarten' },
    { label: 'Grade 1', value: 'grade_1' },
    { label: 'Grade 2', value: 'grade_2' },
    { label: 'Grade 3', value: 'grade_3' },
    { label: 'Grade 4', value: 'grade_4' },
    { label: 'Grade 5', value: 'grade_5' },
    { label: 'Grade 6', value: 'grade_6' },
    { label: 'Grade 7', value: 'grade_7' },
    { label: 'Grade 8', value: 'grade_8' },
    { label: 'Grade 9 / Matric Part-I', value: 'grade_9_matric_1' },
    { label: 'Grade 10 / Matric Part-II', value: 'grade_10_matric_2' },
    { label: 'O-Levels', value: 'o_levels' },
    { label: 'A-Levels', value: 'a_levels' },
    { label: 'FSc Pre-Medical', value: 'fsc_pre_medical' },
    { label: 'FSc Pre-Engineering', value: 'fsc_pre_engineering' },
    { label: 'ICS', value: 'ics' },
    { label: 'I.Com', value: 'icom' },
    { label: 'FA', value: 'fa' },
    { label: 'Other', value: 'other' },
];

const TopperForm = () => {
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
        fatherName: '',
        className: '',
        passingYear: '',
        totalMarks: '',
        obtainedMarks: '',
        image: '',
    });

    const [isUploading, setIsUploading] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [showClassPicker, setShowClassPicker] = useState(false);

    useEffect(() => {
        if (editData) {
            setForm({
                name: editData.name || '',
                fatherName: editData.fatherName || '',
                className: editData.className || '',
                passingYear: editData.passingYear || '',
                totalMarks: editData.totalMarks?.toString() || '',
                obtainedMarks: editData.obtainedMarks?.toString() || '',
                image: editData.image || '',
            });
            setSelectedImage(editData.image || null);
        }
    }, [editDataParam]);

    const handleGoBack = () => router.back();

    const pickImage = async () => {
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
            aspect: [1, 1],
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
            formData.append('folderName', 'toppers');

            const response: any = await uploadUserImage(formData);
            if (response.success) {
                setForm(prev => ({ ...prev, image: response.data.imageUrl }));
            }
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Upload Failed' });
        } finally {
            setIsUploading(false);
        }
    };

    const mutation = useMutation({
        mutationFn: (payload: any) => {
            if (isEditing) {
                return updateTopper(essentialId, editData._id, payload);
            }
            return addTopper(essentialId, payload);
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
        if (!form.name.trim() || !form.fatherName.trim() || !form.className || !form.passingYear.trim() || !form.totalMarks || !form.obtainedMarks) {
            Toast.show({ type: 'error', text1: 'Required', text2: 'Please fill all required info' });
            return;
        }
        mutation.mutate({
            ...form,
            totalMarks: Number(form.totalMarks),
            obtainedMarks: Number(form.obtainedMarks),
        });
    };

    return (
        <View style={[styles.mainContainer, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Animated Header */}
            <Animated.View entering={FadeInUp.duration(600)} style={styles.header}>
                <LinearGradient
                    colors={[colors.primary, '#0D9488']}
                    style={StyleSheet.absoluteFill}
                />
                <View style={[styles.headerTop, { paddingTop: insets.top + 10 }]}>
                    <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={isDark ? colors.text : '#FFFFFF'} />
                    </TouchableOpacity>
                    <ThemedText style={[styles.headerTitle, { color: isDark ? colors.text : '#FFFFFF' }]}>
                        {isEditing ? 'Edit Topper' : 'Add New Topper'}
                    </ThemedText>
                    <View style={{ width: 44 }} />
                </View>

                {/* Avatar integrated in header */}
                <View style={styles.avatarContainer}>
                    <View style={{ width: 90, height: 90 }}>
                        <TouchableOpacity style={styles.imageCircle} onPress={pickImage} disabled={isUploading}>
                            {selectedImage ? (
                                <Image source={{ uri: selectedImage }} style={styles.fullImage} />
                            ) : (
                                <View style={[styles.fullImage, { backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' }]}>
                                    <Ionicons name="camera" size={32} color="#FFF" />
                                </View>
                            )}
                            {isUploading && (
                                <View style={styles.loaderOverlay}>
                                    <ActivityIndicator color="#FFF" />
                                </View>
                            )}
                        </TouchableOpacity>
                        {!!selectedImage && !isUploading && (
                            <TouchableOpacity
                                style={styles.deleteAvatarBtn}
                                onPress={() => {
                                    setSelectedImage(null);
                                    setForm(prev => ({ ...prev, image: '' }));
                                }}
                            >
                                <Ionicons name="close-circle" size={24} color="#EF4444" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
                <ThemedText style={[styles.welcomeText, { color: isDark ? colors.text : '#FFFFFF' }]}>Topper Portrait</ThemedText>
                <ThemedText style={[styles.subtitleText, { color: isDark ? colors.textSecondary : 'rgba(255,255,255,0.8)' }]}>
                    Upload a high quality portrait of the student
                </ThemedText>
            </Animated.View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={[styles.content, { paddingBottom: Platform.OS === 'android' ? 160 : 140 }]} keyboardShouldPersistTaps="handled">

                    <View style={styles.formSection}>
                        {/* Name Field */}
                        <Animated.View entering={FadeInDown.delay(300)} style={styles.inputField}>
                            <View style={styles.labelContainer}>
                                <ThemedText style={[styles.label, { color: colors.text }]}>
                                    FULL NAME <ThemedText style={styles.required}>*</ThemedText>
                                </ThemedText>
                            </View>
                            <View style={[styles.inputBox, { backgroundColor: colors.card, borderColor: colors.border, height: Platform.OS === 'android' ? 48 : 52 }]}>
                                <Ionicons name="person-outline" size={18} color={colors.icon} style={{ marginRight: 10 }} />
                                <TextInput
                                    style={[styles.textInput, { color: colors.text, fontSize: Platform.OS === 'android' ? 13 : 14 }]}
                                    value={form.name}
                                    onChangeText={val => setForm(p => ({ ...p, name: val }))}
                                    placeholder="Student Name"
                                    placeholderTextColor={colors.icon}
                                />
                            </View>
                        </Animated.View>

                        {/* Father Name Field */}
                        <Animated.View entering={FadeInDown.delay(350)} style={styles.inputField}>
                            <View style={styles.labelContainer}>
                                <ThemedText style={[styles.label, { color: colors.text }]}>
                                    FATHER'S NAME <ThemedText style={styles.required}>*</ThemedText>
                                </ThemedText>
                            </View>
                            <View style={[styles.inputBox, { backgroundColor: colors.card, borderColor: colors.border, height: Platform.OS === 'android' ? 48 : 52 }]}>
                                <Ionicons name="people-outline" size={18} color={colors.icon} style={{ marginRight: 10 }} />
                                <TextInput
                                    style={[styles.textInput, { color: colors.text, fontSize: Platform.OS === 'android' ? 13 : 14 }]}
                                    value={form.fatherName}
                                    onChangeText={val => setForm(p => ({ ...p, fatherName: val }))}
                                    placeholder="Father's Name"
                                    placeholderTextColor={colors.icon}
                                />
                            </View>
                        </Animated.View>

                        {/* Class Dropdown */}
                        <Animated.View entering={FadeInDown.delay(375)} style={styles.inputField}>
                            <View style={styles.labelContainer}>
                                <ThemedText style={[styles.label, { color: colors.text }]}>
                                    CLASS <ThemedText style={styles.required}>*</ThemedText>
                                </ThemedText>
                            </View>
                            <TouchableOpacity
                                style={[styles.dropdownTrigger, { backgroundColor: colors.card, borderColor: colors.border, height: Platform.OS === 'android' ? 48 : 52 }]}
                                onPress={() => setShowClassPicker(true)}
                            >
                                <View style={styles.triggerContent}>
                                    <Ionicons name="school-outline" size={18} color={form.className ? colors.primary : colors.icon} style={{ marginRight: 10 }} />
                                    <ThemedText style={[styles.triggerText, !form.className ? { color: colors.icon } : { color: colors.text, textTransform: 'capitalize' }, { fontSize: Platform.OS === 'android' ? 13 : 14 }]}>
                                        {ACADEMIC_CLASSES.find(t => t.value === form.className)?.label || 'Select Class'}
                                    </ThemedText>
                                </View>
                                <Ionicons name="chevron-down" size={16} color={colors.icon} />
                            </TouchableOpacity>
                            <SearchableDropdown
                                visible={showClassPicker}
                                onClose={() => setShowClassPicker(false)}
                                options={ACADEMIC_CLASSES}
                                onSelect={val => setForm(p => ({ ...p, className: val }))}
                                currentValue={form.className}
                                title="Select Class"
                            />
                        </Animated.View>

                        {/* Passing Year Field */}
                        <Animated.View entering={FadeInDown.delay(400)} style={styles.inputField}>
                            <View style={styles.labelContainer}>
                                <ThemedText style={[styles.label, { color: colors.text }]}>
                                    PASSING YEAR <ThemedText style={styles.required}>*</ThemedText>
                                </ThemedText>
                            </View>
                            <View style={[styles.inputBox, { backgroundColor: colors.card, borderColor: colors.border, height: Platform.OS === 'android' ? 48 : 52 }]}>
                                <Ionicons name="calendar-outline" size={18} color={colors.icon} style={{ marginRight: 10 }} />
                                <TextInput
                                    style={[styles.textInput, { color: colors.text, fontSize: Platform.OS === 'android' ? 13 : 14 }]}
                                    value={form.passingYear}
                                    onChangeText={val => setForm(p => ({ ...p, passingYear: val }))}
                                    placeholder="e.g. 2023"
                                    keyboardType="number-pad"
                                    placeholderTextColor={colors.icon}
                                />
                            </View>
                        </Animated.View>

                        {/* Marks Range Fields */}
                        <Animated.View entering={FadeInDown.delay(450)} style={styles.inputField}>
                            <View style={styles.labelContainer}>
                                <ThemedText style={[styles.label, { color: colors.text }]}>
                                    OBTAINED / TOTAL MARKS <ThemedText style={styles.required}>*</ThemedText>
                                </ThemedText>
                            </View>
                            <View style={{ flexDirection: 'row', gap: 12 }}>
                                <View style={[styles.inputBox, { flex: 1, backgroundColor: colors.card, borderColor: colors.border, height: Platform.OS === 'android' ? 48 : 52 }]}>
                                    <Ionicons name="star-outline" size={18} color={colors.icon} style={{ marginRight: 10 }} />
                                    <TextInput
                                        style={[styles.textInput, { color: colors.text, fontSize: Platform.OS === 'android' ? 13 : 14 }]}
                                        value={form.obtainedMarks}
                                        onChangeText={val => setForm(p => ({ ...p, obtainedMarks: val }))}
                                        placeholder="Obtained"
                                        keyboardType="number-pad"
                                        placeholderTextColor={colors.icon}
                                    />
                                </View>
                                <View style={[styles.inputBox, { flex: 1, backgroundColor: colors.card, borderColor: colors.border, height: Platform.OS === 'android' ? 48 : 52 }]}>
                                    <TextInput
                                        style={[styles.textInput, { color: colors.text, fontSize: Platform.OS === 'android' ? 13 : 14 }]}
                                        value={form.totalMarks}
                                        onChangeText={val => setForm(p => ({ ...p, totalMarks: val }))}
                                        placeholder="Out of"
                                        keyboardType="number-pad"
                                        placeholderTextColor={colors.icon}
                                    />
                                </View>
                            </View>
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
                    <LinearGradient colors={['#0D9488', '#0F766E']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
                    {mutation.isPending ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <View style={styles.buttonContent}>
                            <ThemedText style={styles.updateButtonText}>{isEditing ? 'Save Changes' : 'Add Topper'}</ThemedText>
                            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                        </View>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default TopperForm;

const styles = StyleSheet.create({
    mainContainer: { flex: 1 },
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
        textAlign: 'center',
    },
    welcomeText: {
        fontSize: 18,
        fontWeight: '800',
        marginTop: 6,
        marginBottom: 6,
        textAlign: 'center',
    },
    subtitleText: {
        fontSize: 12,
        marginTop: 2,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    avatarContainer: {
        alignItems: 'center',
        marginTop: 15,
    },
    imageCircle: {
        width: 90,
        height: 90,
        borderRadius: 45,
        borderWidth: 3,
        borderColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    fullImage: { width: '100%', height: '100%' },
    loaderOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
    deleteAvatarBtn: {
        position: 'absolute',
        top: -2,
        right: -2,
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: 12,
    },
    cameraBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFF',
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
        borderWidth: 1,
    },
    textInput: { flex: 1, fontWeight: '500' },
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
