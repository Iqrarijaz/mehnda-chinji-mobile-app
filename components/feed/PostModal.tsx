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



export const PostModal = ({ visible, onClose, editingPost }: PostModalProps) => {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const insets = useSafeAreaInsets();

    const [content, setContent] = useState('');
    const [type, setType] = useState('General');
    const [images, setImages] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDropdownVisible, setIsDropdownVisible] = useState(false);

    const { data: categoriesData, isLoading: categoriesLoading } = usePostCategories();
    // The array is nested inside categoriesData.data.data based on the backend response format
    const categories = categoriesData?.data?.data || [];

    const addPostMutation = useAddPost();
    const updatePostMutation = useUpdatePost();
    const deleteImageMutation = useDeletePostImage();

    useEffect(() => {
        if (editingPost) {
            setContent(editingPost.content || '');
            setType(editingPost.type || 'General');
            setImages(editingPost.images || []);
        } else {
            setContent('');
            setType('General');
            setImages([]);
        }
    }, [editingPost, visible]);

    useEffect(() => {
        if (!editingPost && categories.length > 0 && type === 'General') {
            const hasGeneral = categories.some((c: any) => c.name === 'General');
            if (!hasGeneral) {
                setType(categories[0].name);
            }
        }
    }, [categories, editingPost, visible]);

    const selectedCategory = categories.find((c: any) => c.name === type);

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
        if (!content.trim()) {
            Toast.show({ type: 'error', text1: 'Content Required', text2: 'Please enter something for the post.' });
            return;
        }

        setIsSubmitting(true);
        const formData = new FormData();
        formData.append('content', content);
        formData.append('type', type);

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
                                                        type === cat.name && { backgroundColor: colors.primary + '10' }
                                                    ]}
                                                    onPress={() => {
                                                        setType(cat.name);
                                                        setIsDropdownVisible(false);
                                                    }}
                                                >
                                                    <View style={styles.categoryIconColumn}>
                                                        <Image source={{ uri: cat.icon }} style={styles.categoryIcon} contentFit="contain" />
                                                    </View>
                                                    <ThemedText style={[
                                                        styles.menuItemText,
                                                        type === cat.name && { color: colors.primary, fontWeight: '700' }
                                                    ]}>
                                                        {cat.name}
                                                    </ThemedText>
                                                    {type === cat.name && (
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
                            value={content}
                            onChangeText={setContent}
                            autoFocus={!editingPost}
                        />

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
                            disabled={isSubmitting || !content.trim()}
                            style={[
                                styles.mainPostButton,
                                { backgroundColor: content.trim() ? colors.primary : colors.border }
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
});
