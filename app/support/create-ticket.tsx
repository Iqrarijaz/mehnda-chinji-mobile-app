import { createSupportTicket } from '@/apis/support';
import { SearchableDropdown } from '@/components/common/SearchableDropdown';
import { ThemedText } from '@/components/ThemedText';
import { FormInput } from '@/components/common/FormInput';
import { SubmitButton } from '@/components/common/SubmitButton';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

const PREDEFINED_SUBJECTS = [
    'Profile Update Issue',
    'Submit Places Issue',
    
    'Business Registration Issue',
    'Authentication / Login Issue',
    'General Feedback',
    'UI / UX Bug'
];

export default function CreateTicketScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();
    const colors = Colors[theme];
    const queryClient = useQueryClient();

    const handleBack = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/support' as any);
        }
    };

    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
    const [images, setImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
    const [subjectDropdownVisible, setSubjectDropdownVisible] = useState(false);

    const createTicketMutation = useMutation({
        mutationFn: async () => {
            const formData = new FormData();
            formData.append('subject', subject);
            formData.append('description', description);

            images.forEach((image, index) => {
                const uriParts = image.uri.split('.');
                const fileType = uriParts[uriParts.length - 1];

                // Constructing the file object in a way that Axios/FormData likes in React Native
                const file: any = {
                    uri: image.uri,
                    name: `attachment_${index}.${fileType}`,
                    type: `image/${fileType}`
                };
                formData.append('attachments', file);
            });

            return await createSupportTicket(formData);
        },
        onSuccess: () => {
            Toast.show({
                type: 'success',
                text1: 'Ticket Created',
                text2: 'Our team will review your request soon.'
            });
            setSubject('');
            setDescription('');
            setImages([]);
            queryClient.invalidateQueries({ queryKey: ['support_tickets'] });
            handleBack();
        },
        onError: (error: any) => {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.message || 'Failed to create ticket. Please try again.'
            });
        }
    });

    const pickImage = async () => {
        if (images.length >= 5) {
            Toast.show({
                type: 'info',
                text1: 'Limit reached',
                text2: 'You can attach up to 5 images.'
            });
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

    const handleSubmit = () => {
        if (!subject.trim() || !description.trim()) {
            Toast.show({
                type: 'error',
                text1: 'Validation Error',
                text2: 'Subject and description are required.'
            });
            return;
        }
        createTicketMutation.mutate();
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
            <Stack.Screen options={{ headerShown: false, presentation: 'modal', animation: 'slide_from_bottom' }} />
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <ThemedText style={styles.headerTitle}>Create New Ticket</ThemedText>
            </View>

            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                <View style={{ position: 'relative', justifyContent: 'center' }}>
                    <FormInput
                        label="SUBJECT"
                        required
                        placeholder="Briefly describe the issue"
                        value={subject}
                        onChangeText={setSubject}
                        maxLength={40}
                        containerStyle={{ marginBottom: 12 }}
                    />
                    <TouchableOpacity
                        style={{ position: 'absolute', right: 12, top: 38 }}
                        onPress={() => setSubjectDropdownVisible(true)}
                    >
                        <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                <SearchableDropdown
                    visible={subjectDropdownVisible}
                    onClose={() => setSubjectDropdownVisible(false)}
                    onSelect={(val) => setSubject(val)}
                    options={PREDEFINED_SUBJECTS}
                    title="Select Subject"
                    placeholder="Search issues..."
                    currentValue={subject}
                />

                <FormInput
                    label="DESCRIPTION"
                    required
                    placeholder="Provide details about your problem or question..."
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    maxLength={400}
                    containerStyle={{ marginBottom: 16 }}
                />

                <ThemedText style={styles.label}>Attachments (Max 5)</ThemedText>
                <View style={styles.imageSection}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {images.map((img, index) => (
                            <View key={index} style={styles.imageWrapper}>
                                <Image
                                    source={{ uri: img.uri }}
                                    style={styles.previewImage}
                                    contentFit="cover"
                                    transition={200}
                                />
                                <TouchableOpacity
                                    style={[styles.removeIcon, { backgroundColor: colors.card }]}
                                    onPress={() => removeImage(index)}
                                >
                                    <Ionicons name="close-circle" size={24} color="#FF5252" />
                                </TouchableOpacity>
                            </View>
                        ))}
                        {images.length < 5 && (
                            <TouchableOpacity
                                style={[styles.uploadButton, { backgroundColor: colors.card }]}
                                onPress={pickImage}
                            >
                                <Ionicons name="camera-outline" size={32} color={colors.primary} />
                                <ThemedText style={styles.uploadText}>Add Image</ThemedText>
                            </TouchableOpacity>
                        )}
                    </ScrollView>
                </View>

                <SubmitButton
                    title="Submit Ticket"
                    onPress={handleSubmit}
                    isLoading={createTicketMutation.isPending}
                    style={{ marginTop: 24, borderRadius: Layout.borderRadius + 2 }}
                    icon="paper-plane"
                />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12 },
    backButton: {
        padding: 4,
        marginRight: 12 },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold' },
    content: {
        paddingHorizontal: 20,
        paddingBottom: 32 },
    labelContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginTop: 16,
        marginBottom: 8 },
    label: {
        fontSize: 16,
        fontWeight: '600' },
    charCount: {
        fontSize: 12,
        fontWeight: '500' },
    input: {
        borderRadius: Layout.borderRadius,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 15 },
    textArea: {
        height: 150,
        textAlignVertical: 'top' },
    imageSection: {
        marginTop: 8,
        flexDirection: 'row' },
    imageWrapper: {
        marginRight: 12,
        position: 'relative' },
    previewImage: {
        width: 100,
        height: 100,
        borderRadius: Layout.borderRadius },
    removeIcon: {
        position: 'absolute',
        top: -10,
        right: -10,
        borderRadius: Layout.borderRadius },
    uploadButton: {
        width: 100,
        height: 100,
        borderRadius: Layout.borderRadius,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center' },
    uploadText: {
        fontSize: 12,
        marginTop: 4,
        opacity: 0.7 },
    submitButton: {
        marginTop: 32,
        paddingVertical: 16,
        borderRadius: Layout.borderRadius,
        alignItems: 'center' },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold' }
});
