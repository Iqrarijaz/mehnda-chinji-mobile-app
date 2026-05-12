import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { Layout } from '@/constants/layout';
import { useAddPost, useUpdatePost, useDeletePostImage } from '@/hooks/usePosts';
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

const CATEGORIES = [
    { label: 'General', value: 'GENERAL', icon: 'newspaper-outline', color: '#007AFF' },
    { label: 'Sports', value: 'SPORTS', icon: 'football-outline', color: '#4CD964' },
    { label: 'Death', value: 'DEATH', icon: 'ribbon-outline', color: '#333333' },
    { label: 'Accident', value: 'ACCIDENT', icon: 'warning-outline', color: '#FF3B30' },
];

export const PostModal = ({ visible, onClose, editingPost }: PostModalProps) => {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const insets = useSafeAreaInsets();

    const [content, setContent] = useState('');
    const [type, setType] = useState('GENERAL');
    const [images, setImages] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const addPostMutation = useAddPost();
    const updatePostMutation = useUpdatePost();
    const deleteImageMutation = useDeletePostImage();

    useEffect(() => {
        if (editingPost) {
            setContent(editingPost.content || '');
            setType(editingPost.type || 'GENERAL');
            // For images, we might need to handle them differently if they are URLs vs assets
            setImages(editingPost.images || []);
        } else {
            setContent('');
            setType('GENERAL');
            setImages([]);
        }
    }, [editingPost, visible]);

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
                    <TouchableOpacity 
                        onPress={handleSubmit} 
                        disabled={isSubmitting} 
                        style={[styles.postButton, { backgroundColor: content.trim() ? colors.primary : colors.border }]}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <ThemedText style={styles.postButtonText}>{editingPost ? 'Update' : 'Post'}</ThemedText>
                        )}
                    </TouchableOpacity>
                </View>

                <KeyboardAvoidingView 
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
                        {/* Category Selection */}
                        <ThemedText style={styles.sectionLabel}>Select Category</ThemedText>
                        <View style={styles.categoryContainer}>
                            {CATEGORIES.map((cat) => (
                                <TouchableOpacity
                                    key={cat.value}
                                    onPress={() => setType(cat.value)}
                                    style={[
                                        styles.categoryItem,
                                        { 
                                            borderColor: type === cat.value ? cat.color : colors.border,
                                            backgroundColor: type === cat.value ? `${cat.color}15` : 'transparent'
                                        }
                                    ]}
                                >
                                    <Ionicons 
                                        name={cat.icon as any} 
                                        size={18} 
                                        color={type === cat.value ? cat.color : colors.textSecondary} 
                                    />
                                    <ThemedText 
                                        style={[
                                            styles.categoryText, 
                                            { color: type === cat.value ? cat.color : colors.textSecondary }
                                        ]}
                                    >
                                        {cat.label}
                                    </ThemedText>
                                </TouchableOpacity>
                            ))}
                        </View>

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
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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
    },
    sectionLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 12,
        opacity: 0.7,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    categoryContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 24,
        gap: 10,
    },
    categoryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: Layout.borderRadius,
        borderWidth: 1,
    },
    categoryText: {
        fontSize: 13,
        fontWeight: '600',
        marginLeft: 6,
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
        marginRight: 12,
        position: 'relative',
    },
    previewImage: {
        width: 100,
        height: 100,
        borderRadius: Layout.borderRadius,
    },
    removeIcon: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: '#FFFFFF',
        borderRadius: Layout.borderRadius,
    },
    uploadButton: {
        width: 100,
        height: 100,
        borderRadius: Layout.borderRadius,
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
});
