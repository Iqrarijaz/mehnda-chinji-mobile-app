import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { Layout } from '@/constants/layout';
import { useAddPost, useUpdatePost, useDeletePostImage } from '@/hooks/usePosts';
import { usePostCategories } from '@/hooks/useConfiguration';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
    KeyboardAvoidingView
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { ThemedText } from '../themedText';
import { ThemedView } from '../themedView';
import Toast from 'react-native-toast-message';

interface PostModalProps {
    visible: boolean;
    onClose: () => void;
    editingPost?: any; // If provided, we are in edit mode
}

type PostFormState = {
    content: string;
    type: string;
    subType: 'YOUTH_PRIDE' | 'LIVING_LEGEND' | 'DECEASED';
    fullName: string;
    profileTitle: string;
    dateOfBirth: string;
    dateOfDeath: string;
    achievementsText: string;
};



export const PostModal = ({ visible, onClose, editingPost }: PostModalProps) => {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const insets = useSafeAreaInsets();

    const [form, setForm] = useState<PostFormState>({
        content: '',
        type: 'General',
        subType: 'LIVING_LEGEND',
        fullName: '',
        profileTitle: '',
        dateOfBirth: '',
        dateOfDeath: '',
        achievementsText: '',
    });
    const [images, setImages] = useState<any[]>([]);
    const [profileImage, setProfileImage] = useState<any | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDropdownVisible, setIsDropdownVisible] = useState(false);
    const updateForm = <K extends keyof PostFormState>(key: K, value: PostFormState[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const { data: categoriesData, isLoading: categoriesLoading } = usePostCategories();
    // The array is nested inside categoriesData.data.data based on the backend response format
    const categories = categoriesData?.data?.data || [];

    const addPostMutation = useAddPost();
    const updatePostMutation = useUpdatePost();
    const deleteImageMutation = useDeletePostImage();

    useEffect(() => {
        if (editingPost) {
            const isPride = editingPost.category === 'PRIDE' || editingPost.type === 'VILLAGE_PRIDE';
            setForm({
                content: editingPost.content || '',
                type: isPride ? 'VILLAGE_PRIDE' : (editingPost.type || 'General'),
                subType: (isPride ? (editingPost.type !== 'VILLAGE_PRIDE' ? editingPost.type : editingPost.metadata?.subType) : 'LIVING_LEGEND') || 'LIVING_LEGEND',
                fullName: editingPost.metadata?.fullName || '',
                profileTitle: editingPost.metadata?.title || '',
                dateOfBirth: editingPost.metadata?.dateOfBirth || '',
                dateOfDeath: editingPost.metadata?.dateOfDeath || '',
                achievementsText: (editingPost.metadata?.achievements || []).join('\n'),
            });
            setImages(editingPost.images || []);
            setProfileImage(editingPost.metadata?.profileImage || null);
        } else {
            setForm({
                content: '',
                type: 'General',
                subType: 'LIVING_LEGEND',
                fullName: '',
                profileTitle: '',
                dateOfBirth: '',
                dateOfDeath: '',
                achievementsText: '',
            });
            setImages([]);
            setProfileImage(null);
        }
    }, [editingPost, visible]);

    useEffect(() => {
        if (!editingPost && categories.length > 0 && form.type === 'General') {
            const hasGeneral = categories.some((c: any) => c.name === 'General');
            if (!hasGeneral) {
                updateForm('type', categories[0].name);
            }
        }
    }, [categories, editingPost, form.type, visible]);

    const selectedCategory = categories.find((c: any) => c.name === form.type);
    const isVillagePride = form.type === 'VILLAGE_PRIDE';

    const pickProfileImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsMultipleSelection: false,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled && result.assets?.[0]) {
            setProfileImage(result.assets[0]);
        }
    };

    const pickImage = async () => {
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

    const removeImage = async (index: number) => {
        const image = images[index];

        // If it's an existing image (string URL), delete it from backend
        if (typeof image === 'string' && editingPost) {
            try {
                await deleteImageMutation.mutateAsync({
                    postId: editingPost._id,
                    imageUrl: image
                });
                Toast.show({ type: 'success', text1: 'Image removed' });
            } catch (error: any) {
                Toast.show({ type: 'error', text1: 'Delete failed', text2: error.message });
                return;
            }
        }

        setImages(images.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!form.content.trim()) {
            Toast.show({ type: 'error', text1: 'Content Required', text2: 'Please enter something for the post.' });
            return;
        }
        if (isVillagePride) {
            if (!form.fullName.trim() || !form.profileTitle.trim()) {
                Toast.show({
                    type: 'error',
                    text1: 'Missing fields',
                    text2: 'Please provide full name and title for Village Pride.',
                });
                return;
            }
            if (form.subType === 'DECEASED' && !form.dateOfDeath.trim()) {
                Toast.show({
                    type: 'error',
                    text1: 'Date of death required',
                    text2: 'Please add date of death for In Memoriam.',
                });
                return;
            }
            if (!profileImage) {
                Toast.show({
                    type: 'error',
                    text1: 'Profile Image Required',
                    text2: 'Please add a profile image for the Pride card.',
                });
                return;
            }
        }

        setIsSubmitting(true);
        const formData = new FormData();
        formData.append('content', form.content);
        
        const category = isVillagePride ? 'PRIDE' : 'FEED';
        const postType = isVillagePride ? form.subType : form.type;
        
        formData.append('category', category);
        formData.append('type', postType);

        if (isVillagePride) {
            formData.append('metadata[fullName]', form.fullName.trim());
            formData.append('metadata[title]', form.profileTitle.trim());
            if (form.dateOfBirth.trim()) {
                formData.append('metadata[dateOfBirth]', form.dateOfBirth.trim());
            }
            if (form.subType === 'DECEASED' && form.dateOfDeath.trim()) {
                formData.append('metadata[dateOfDeath]', form.dateOfDeath.trim());
            }
            form.achievementsText
                .split('\n')
                .map((line) => line.trim())
                .filter(Boolean)
                .forEach((line, idx) => {
                    formData.append(`metadata[achievements][${idx}]`, line);
                });
            
            if (profileImage?.uri) {
                const uriParts = profileImage.uri.split('.');
                const fileType = uriParts[uriParts.length - 1];
                const file: any = {
                    uri: profileImage.uri,
                    name: `profileImage.${fileType}`,
                    type: `image/${fileType}`
                };
                formData.append('profileImage', file);
            } else if (typeof profileImage === 'string') {
                formData.append('metadata[profileImage]', profileImage);
            }
        }

        images.forEach((image, index) => {
            if (image.uri) {
                const uriParts = image.uri.split('.');
                const fileType = uriParts[uriParts.length - 1];
                const file: any = {
                    uri: image.uri,
                    name: `image_${index}.${fileType}`,
                    type: `image/${fileType}`
                };
                formData.append('images', file);
            } else if (typeof image === 'string') {
                // Keep existing images if editing
                formData.append('existingImages', image);
            }
        });

        try {
            if (editingPost) {
                await updatePostMutation.mutateAsync({ postId: editingPost._id, formData });
                Toast.show({ type: 'success', text1: 'Post Updated' });
            } else {
                await addPostMutation.mutateAsync(formData);
                Toast.show({ type: 'success', text1: 'Post Created' });
            }
            onClose();
        } catch (error: any) {
            Toast.show({ type: 'error', text1: 'Submission Failed', text2: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={false}
            onRequestClose={onClose}
        >
            <ThemedView style={styles.container}>
                <View style={[styles.header, { paddingTop: Math.max(insets.top, 20), borderBottomColor: colors.border }]}>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <ThemedText style={styles.headerTitle}>{editingPost ? 'Edit Post' : 'Create News Post'}</ThemedText>
                    <View style={{ width: 32 }} />
                </View>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
                        {/* Category Selection Dropdown */}
                        <ThemedText style={styles.sectionLabel}>News Category</ThemedText>
                        <TouchableOpacity 
                            style={[styles.dropdownTrigger, { borderColor: colors.border, backgroundColor: colors.card }]}
                            onPress={() => setIsDropdownVisible(true)}
                        >
                            <View style={styles.dropdownValue}>
                                {selectedCategory ? (
                                    <>
                                        <View style={styles.categoryIconColumn}>
                                            <Image 
                                                source={{ uri: selectedCategory.icon }} 
                                                style={styles.categoryIcon}
                                                contentFit="contain"
                                            />
                                        </View>
                                        <ThemedText style={styles.dropdownText}>{selectedCategory.name}</ThemedText>
                                    </>
                                ) : (
                                    <ThemedText style={[styles.dropdownText, { color: colors.textSecondary }]}>Select Category</ThemedText>
                                )}
                            </View>
                            <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
                        </TouchableOpacity>

                        {/* Category Modal */}
                        <Modal
                            visible={isDropdownVisible}
                            transparent={true}
                            animationType="fade"
                            onRequestClose={() => setIsDropdownVisible(false)}
                        >
                            <TouchableOpacity 
                                style={styles.modalOverlay} 
                                activeOpacity={1} 
                                onPress={() => setIsDropdownVisible(false)}
                            >
                                <View style={[styles.dropdownMenu, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                    <View style={styles.menuHeader}>
                                        <ThemedText style={styles.menuTitle}>Select Category</ThemedText>
                                        <TouchableOpacity onPress={() => setIsDropdownVisible(false)}>
                                            <Ionicons name="close" size={24} color={colors.text} />
                                        </TouchableOpacity>
                                    </View>
                                    {categoriesLoading ? (
                                        <ActivityIndicator size="small" color={colors.primary} style={{ margin: 20 }} />
                                    ) : (
                                        <ScrollView bounces={false} style={{ maxHeight: 350 }}>
                                            {categories.map((cat: any) => (
                                                <TouchableOpacity
                                                    key={cat.name}
                                                    style={[
                                                        styles.menuItem,
                                                        form.type === cat.name && { backgroundColor: colors.primary + '10' }
                                                    ]}
                                                    onPress={() => {
                                                        updateForm('type', cat.name);
                                                        setIsDropdownVisible(false);
                                                    }}
                                                >
                                                    <View style={styles.categoryIconColumn}>
                                                        <Image source={{ uri: cat.icon }} style={styles.categoryIcon} contentFit="contain" />
                                                    </View>
                                                    <ThemedText style={[
                                                        styles.menuItemText,
                                                        form.type === cat.name && { color: colors.primary, fontWeight: '700' }
                                                    ]}>
                                                        {cat.name}
                                                    </ThemedText>
                                                    {form.type === cat.name && (
                                                        <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                                                    )}
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    )}
                                </View>
                            </TouchableOpacity>
                        </Modal>

                        {/* Content Input */}
                        <TextInput
                            style={[styles.input, { color: colors.text, backgroundColor: colors.card }]}
                            placeholder="What's the news?"
                            placeholderTextColor={colors.textSecondary}
                            multiline
                            value={form.content}
                            onChangeText={(value) => updateForm('content', value)}
                            autoFocus={!editingPost}
                        />

                        {isVillagePride && (
                            <View style={styles.prideFieldsContainer}>
                                <ThemedText style={styles.sectionLabel}>Pride Metadata</ThemedText>
                                
                                {/* Profile Image Picker at the start */}
                                <View style={styles.profileImageContainer}>
                                    <View style={styles.profileImageInner}>
                                        <TouchableOpacity
                                            onPress={profileImage ? undefined : pickProfileImage}
                                            style={[styles.profileImageWrapper, { 
                                                borderColor: colors.border, 
                                                backgroundColor: colors.card,
                                                borderStyle: profileImage ? 'solid' : 'dashed' 
                                            }]}
                                            activeOpacity={profileImage ? 1 : 0.8}
                                        >
                                            {profileImage ? (
                                                <Image source={{ uri: profileImage.uri || profileImage }} style={styles.profilePreviewImage} contentFit="cover" />
                                            ) : (
                                                <View style={styles.profileUploadPlaceholder}>
                                                    <Ionicons name="person-add-outline" size={26} color={colors.primary} />
                                                    <ThemedText style={[styles.profileUploadText, { color: colors.textSecondary }]}>
                                                        Upload Photo
                                                    </ThemedText>
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                        {profileImage && (
                                            <TouchableOpacity 
                                                style={[styles.profileRemoveIcon, { zIndex: 99 }]} 
                                                onPress={() => setProfileImage(null)}
                                            >
                                                <Ionicons name="trash" size={16} color="#FFFFFF" />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                    <ThemedText style={[styles.fieldLabelText, { textAlign: 'center', marginTop: 8 }]}>
                                        Profile Hero Image <ThemedText style={{ color: '#FF5252' }}>*</ThemedText>
                                    </ThemedText>
                                </View>
                                <View style={[styles.segmented, { borderColor: colors.border, backgroundColor: colors.card }]}>
                                    {(['LIVING_LEGEND', 'DECEASED'] as const).map((option) => {
                                        const active = option === form.subType;
                                        const label = option === 'DECEASED' ? 'In Memoriam' : 'Our Pride Legends';
                                        return (
                                            <TouchableOpacity
                                                key={option}
                                                style={[styles.segmentBtn, active && { backgroundColor: colors.primary }]}
                                                onPress={() => updateForm('subType', option)}
                                            >
                                                <ThemedText style={[styles.segmentBtnText, { color: active ? '#FFFFFF' : colors.textSecondary }]}>
                                                    {label}
                                                </ThemedText>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>

                                <TextInput
                                    style={[styles.metaInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
                                    placeholder="Full name"
                                    placeholderTextColor={colors.textSecondary}
                                    value={form.fullName}
                                    onChangeText={(value) => updateForm('fullName', value)}
                                />
                                <TextInput
                                    style={[styles.metaInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
                                    placeholder="Title / designation"
                                    placeholderTextColor={colors.textSecondary}
                                    value={form.profileTitle}
                                    onChangeText={(value) => updateForm('profileTitle', value)}
                                />
                                <TextInput
                                    style={[styles.metaInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
                                    placeholder="Date of birth (YYYY-MM-DD)"
                                    placeholderTextColor={colors.textSecondary}
                                    value={form.dateOfBirth}
                                    onChangeText={(value) => updateForm('dateOfBirth', value)}
                                />
                                {form.subType === 'DECEASED' && (
                                    <TextInput
                                        style={[styles.metaInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
                                        placeholder="Date of death (YYYY-MM-DD)"
                                        placeholderTextColor={colors.textSecondary}
                                        value={form.dateOfDeath}
                                        onChangeText={(value) => updateForm('dateOfDeath', value)}
                                    />
                                )}
                                <TextInput
                                    style={[styles.metaTextArea, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
                                    placeholder="Key achievements (one per line)"
                                    placeholderTextColor={colors.textSecondary}
                                    value={form.achievementsText}
                                    onChangeText={(value) => updateForm('achievementsText', value)}
                                    multiline
                                    textAlignVertical="top"
                                />
                            </View>
                        )}

                        {/* Image Selection */}
                        <ThemedText style={styles.sectionLabel}>Media</ThemedText>
                        <View style={styles.imageSection}>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={{ paddingRight: 20, paddingTop: 10, paddingLeft: 4 }}
                            >
                                {images.map((img, index) => (
                                    <View key={index} style={styles.imageWrapper}>
                                        <Image
                                            source={{ uri: img.uri || img }}
                                            style={styles.previewImage}
                                            contentFit="cover"
                                        />
                                        <TouchableOpacity
                                            style={styles.removeIcon}
                                            onPress={() => removeImage(index)}
                                        >
                                            <Ionicons name="close-circle" size={24} color="#FF5252" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                                {images.length < 5 && (
                                    <TouchableOpacity
                                        style={[styles.uploadButton, { borderColor: colors.border, backgroundColor: colors.card }]}
                                        onPress={pickImage}
                                    >
                                        <Ionicons name="camera-outline" size={32} color={colors.primary} />
                                        <ThemedText style={styles.uploadText}>Add Image</ThemedText>
                                    </TouchableOpacity>
                                )}
                            </ScrollView>
                        </View>
                    </ScrollView>

                    {/* Fixed Footer with Post Button */}
                    <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                        <TouchableOpacity
                            onPress={handleSubmit}
                            disabled={isSubmitting || !form.content.trim()}
                            style={[
                                styles.mainPostButton,
                                { backgroundColor: form.content.trim() ? colors.primary : colors.border }
                            ]}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <View style={styles.buttonContent}>
                                    <Ionicons name={editingPost ? "save-outline" : "send"} size={20} color="#fff" style={{ marginRight: 8 }} />
                                    <ThemedText style={styles.mainPostButtonText}>
                                        {editingPost ? 'Update News' : 'Share News Now'}
                                    </ThemedText>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </ThemedView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    closeButton: {
        padding: 4,
    },
    postButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: Layout.borderRadius,
        minWidth: 70,
        alignItems: 'center',
    },
    postButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 14,
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    sectionLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 12,
        opacity: 0.7,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    dropdownTrigger: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 56,
        borderRadius: Layout.borderRadius,
        borderWidth: 1,
        paddingHorizontal: 12,
        marginBottom: 24,
    },
    dropdownValue: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dropdownText: {
        fontSize: 15,
        fontWeight: '600',
        marginLeft: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    dropdownMenu: {
        width: '100%',
        borderRadius: Layout.borderRadius,
        borderWidth: 1,
        paddingVertical: 12,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
    },
    menuHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(0,0,0,0.1)',
        marginBottom: 8,
    },
    menuTitle: {
        fontSize: 16,
        fontWeight: '800',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    menuItemText: {
        flex: 1,
        fontSize: 15,
        marginLeft: 12,
    },
    categoryIconColumn: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    categoryIcon: {
        width: 28,
        height: 28,
    },
    categoryText: {
        fontSize: 12,
        fontWeight: '600',
    },
    input: {
        fontSize: 17,
        minHeight: 120,
        textAlignVertical: 'top',
        borderRadius: Layout.borderRadius,
        padding: 16,
        marginBottom: 24,
    },
    prideFieldsContainer: {
        marginBottom: 20,
    },
    segmented: {
        borderWidth: 1,
        borderRadius: Layout.borderRadius + 6,
        padding: 4,
        flexDirection: 'row',
        marginBottom: 10,
    },
    segmentBtn: {
        flex: 1,
        minHeight: 40,
        borderRadius: Layout.borderRadius + 3,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 8,
    },
    segmentBtnText: {
        fontSize: 12.5,
        fontWeight: '700',
    },
    metaInput: {
        minHeight: 44,
        borderWidth: 1,
        borderRadius: Layout.borderRadius,
        paddingHorizontal: 12,
        fontSize: 14,
        marginBottom: 10,
    },
    metaTextArea: {
        minHeight: 84,
        borderWidth: 1,
        borderRadius: Layout.borderRadius,
        paddingHorizontal: 12,
        paddingTop: 10,
        fontSize: 13,
    },
    imageSection: {
        flexDirection: 'row',
    },
    imageWrapper: {
        marginRight: 20,
        marginTop: 10,
        position: 'relative',
    },
    previewImage: {
        width: 110,
        height: 110,
        borderRadius: 14,
    },
    removeIcon: {
        position: 'absolute',
        top: -10,
        right: -10,
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 4,
        zIndex: 10,
    },
    uploadButton: {
        width: 110,
        height: 110,
        marginTop: 10,
        borderRadius: 14,
        borderWidth: 1,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
    },
    uploadText: {
        fontSize: 11,
        marginTop: 4,
        opacity: 0.7,
        fontWeight: '600',
    },
    footer: {
        padding: 16,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: 'rgba(0,0,0,0.1)',
        backgroundColor: 'transparent',
    },
    mainPostButton: {
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 5,
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    mainPostButtonText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 16,
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
        elevation: 5,
    },
    fieldLabelText: {
        fontSize: 12.5,
        fontWeight: '700',
        marginBottom: 6,
        opacity: 0.85,
    },
});
