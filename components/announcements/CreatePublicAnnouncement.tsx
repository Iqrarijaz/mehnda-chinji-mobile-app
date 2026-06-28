import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    TouchableOpacity,
    TextInput,
    Platform,
    ActivityIndicator,
    Modal,
    ScrollView,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LoaderOverlay } from '@/components/common/LoaderOverlay';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { PremiumModal } from '../common/PremiumModal';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';
import { createAnnouncement, updateAnnouncement, ANNOUNCEMENT_QUERY_KEYS } from '@/apis/announcements';
import { useAuth } from '@/context/AuthContext';

interface CreatePublicAnnouncementProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
    announcementToEdit?: any;
}

export const CreatePublicAnnouncement: React.FC<CreatePublicAnnouncementProps> = React.memo(({
    visible,
    onClose,
    onSuccess,
    announcementToEdit,
}) => {
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];
    const { user } = useAuth();

    const [formData, setFormData] = useState({
        title: '',
        message: '',
        eventDate: undefined as Date | undefined,
        showDatePicker: false,
        expiryDays: 'never' as 'never' | '1' | '2' | '3' | '4' | '5',
        essentialId: '',
    });

    const updateFormField = <K extends keyof typeof formData>(key: K, value: typeof formData[K]) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    useEffect(() => {
        if (visible) {
            const managed = user?.user?.managedEssentials || [];
            const isPublicAnnouncer = user?.user?.isPublicAnnouncer;
            let defaultEssentialId = '';
            if (managed.length > 0 && !isPublicAnnouncer) {
                const firstPlace = managed[0];
                defaultEssentialId = firstPlace?._id || firstPlace || '';
            }

            if (announcementToEdit) {
                let expiryDays: 'never' | '1' | '2' | '3' | '4' | '5' = 'never';
                if (announcementToEdit.expiresAt && announcementToEdit.createdAt) {
                    const diffTime = new Date(announcementToEdit.expiresAt).getTime() - new Date(announcementToEdit.createdAt).getTime();
                    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
                    if (diffDays >= 1 && diffDays <= 5) {
                        expiryDays = String(diffDays) as any;
                    }
                }
                setFormData({
                    title: announcementToEdit.title || '',
                    message: announcementToEdit.message || '',
                    eventDate: announcementToEdit.eventDate ? new Date(announcementToEdit.eventDate) : undefined,
                    showDatePicker: false,
                    expiryDays,
                    essentialId: announcementToEdit.essentialId?._id || announcementToEdit.essentialId || '',
                });
            } else {
                setFormData({
                    title: '',
                    message: '',
                    eventDate: undefined,
                    showDatePicker: false,
                    expiryDays: 'never',
                    essentialId: defaultEssentialId,
                });
            }
        }
    }, [visible, announcementToEdit, user]);

    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: (data: FormData) => {
            if (announcementToEdit) {
                data.append('announcementId', announcementToEdit._id);
                return updateAnnouncement(data);
            }
            return createAnnouncement(data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ANNOUNCEMENT_QUERY_KEYS.all });
            Toast.show({
                type: 'success',
                text1: 'Success',
                text2: announcementToEdit ? 'Announcement updated successfully!' : 'Announcement created successfully!'
            });
            setFormData({
                title: '',
                message: '',
                eventDate: undefined,
                showDatePicker: false,
                expiryDays: 'never',
                essentialId: '',
            });
            onSuccess();
            onClose();
        },
        onError: (error: any) => {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.message || `Failed to ${announcementToEdit ? 'update' : 'create'} announcement. Please try again.`
            });
        }
    });

    const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
        setFormData(prev => ({
            ...prev,
            showDatePicker: Platform.OS === 'ios',
            eventDate: selectedDate || prev.eventDate,
        }));
    };

    const handleSubmit = () => {
        const titleTrimmed = formData.title.trim();
        const messageTrimmed = formData.message.trim();

        if (!titleTrimmed) {
            Toast.show({ type: 'error', text1: 'Required', text2: 'Please enter a title for the announcement.' });
            return;
        }
        if (titleTrimmed.length < 10) {
            Toast.show({ type: 'error', text1: 'Title Too Short', text2: 'Title must be at least 10 characters.' });
            return;
        }
        if (titleTrimmed.length > 45) {
            Toast.show({ type: 'error', text1: 'Title Too Long', text2: 'Title can be at most 45 characters.' });
            return;
        }

        if (!messageTrimmed) {
            Toast.show({ type: 'error', text1: 'Required', text2: 'Please enter a message for the announcement.' });
            return;
        }
        if (messageTrimmed.length < 150) {
            Toast.show({ type: 'error', text1: 'Message Too Short', text2: `Message must be at least 150 characters (currently ${messageTrimmed.length}).` });
            return;
        }
        if (messageTrimmed.length > 300) {
            Toast.show({ type: 'error', text1: 'Message Too Long', text2: 'Message can be at most 300 characters.' });
            return;
        }

        const data = new FormData();
        data.append('title', titleTrimmed);
        data.append('message', messageTrimmed);

        const selectedEssential = user?.user?.managedEssentials?.find((e: any) => (e._id || e) === formData.essentialId);
        if (selectedEssential && typeof selectedEssential === 'object') {
            data.append('essentialId', formData.essentialId);
            data.append('type', selectedEssential.category || selectedEssential.type || 'public');
        } else {
            data.append('type', 'public');
        }

        if (formData.eventDate) {
            data.append('eventDate', formData.eventDate.toISOString());
        }

        if (formData.expiryDays !== 'never') {
            const days = parseInt(formData.expiryDays);
            const expiryDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
            data.append('expiresAt', expiryDate.toISOString());
        } else {
            data.append('expiresAt', '');
        }

        mutation.mutate(data);
    };

    return (
        <PremiumModal
            visible={visible}
            onClose={onClose}
            type="centered"
        >
            <View style={styles.modalContent}>
                <View style={styles.header}>
                    <ThemedText style={[styles.title, { color: colors.text }]}>
                        {announcementToEdit ? 'Edit Announcement' : 'Create Announcement'}
                    </ThemedText>
                    <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9' }]}>
                        <Ionicons name="close" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                {/* Form fields */}
                <ScrollView
                    style={styles.scrollContainer}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.form}>
                        {user?.user?.managedEssentials && user.user.managedEssentials.length > 0 && (
                            <View style={styles.inputGroup}>
                                <ThemedText style={[styles.label, { color: colors.textSecondary }]}>Post Announcement As</ThemedText>
                                <View style={styles.chipRow}>
                                    {user.user.isPublicAnnouncer && (
                                        <TouchableOpacity
                                            style={[
                                                styles.expiryChip,
                                                {
                                                    backgroundColor: formData.essentialId === '' ? colors.primary : (isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC'),
                                                    borderColor: formData.essentialId === '' ? colors.primary : colors.border
                                                }
                                            ]}
                                            onPress={() => updateFormField('essentialId', '')}
                                            activeOpacity={0.7}
                                        >
                                            <ThemedText
                                                style={[
                                                    styles.expiryChipText,
                                                    { color: formData.essentialId === '' ? '#FFFFFF' : colors.textSecondary }
                                                ]}
                                            >
                                                Public Announcement
                                            </ThemedText>
                                        </TouchableOpacity>
                                    )}
                                    {user.user.managedEssentials.map((place: any) => {
                                        if (!place || typeof place !== 'object') return null;
                                        const placeId = place._id || place;
                                        const isSelected = formData.essentialId === placeId;
                                        const placeName = place.name || 'Unnamed Place';
                                        const placeType = place.type || place.category || 'Essential';
                                        const displayLabel = `${placeName} ( ${placeType.toUpperCase()} )`;

                                        return (
                                            <TouchableOpacity
                                                key={placeId}
                                                style={[
                                                    styles.expiryChip,
                                                    {
                                                        backgroundColor: isSelected ? colors.primary : (isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC'),
                                                        borderColor: isSelected ? colors.primary : colors.border
                                                    }
                                                ]}
                                                onPress={() => updateFormField('essentialId', placeId)}
                                                activeOpacity={0.7}
                                            >
                                                <ThemedText
                                                    style={[
                                                        styles.expiryChipText,
                                                        { color: isSelected ? '#FFFFFF' : colors.textSecondary }
                                                    ]}
                                                >
                                                    {displayLabel}
                                                </ThemedText>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>
                        )}
                        <View style={styles.inputGroup}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <ThemedText style={[styles.label, { color: colors.textSecondary }]}>
                                    Title <ThemedText style={{ color: '#EF4444' }}>*</ThemedText>
                                </ThemedText>
                                <ThemedText style={{ fontSize: 10, color: colors.textSecondary }}>
                                    {formData.title.length}/45
                                </ThemedText>
                            </View>
                            <TextInput
                                style={[
                                    styles.input,
                                    {
                                        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC',
                                        borderColor: colors.border,
                                        color: colors.text
                                    }
                                ]}
                                placeholder="Enter announcement title..."
                                placeholderTextColor="#94A3B8"
                                value={formData.title}
                                onChangeText={(text) => updateFormField('title', text)}
                                maxLength={45}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <ThemedText style={[styles.label, { color: colors.textSecondary }]}>
                                    Message <ThemedText style={{ color: '#EF4444' }}>*</ThemedText>
                                </ThemedText>
                                <ThemedText style={{ fontSize: 10, color: colors.textSecondary }}>
                                    {formData.message.length}/300
                                </ThemedText>
                            </View>
                            <TextInput
                                style={[
                                    styles.input,
                                    styles.textArea,
                                    {
                                        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC',
                                        borderColor: colors.border,
                                        color: colors.text
                                    }
                                ]}
                                placeholder="Enter announcement details (minimum 150 characters)..."
                                placeholderTextColor="#94A3B8"
                                value={formData.message}
                                onChangeText={(text) => updateFormField('message', text)}
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                                maxLength={300}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <ThemedText style={[styles.label, { color: colors.textSecondary }]}>Event Date (Optional)</ThemedText>
                            <TouchableOpacity
                                style={[
                                    styles.datePickerBtn,
                                    {
                                        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC',
                                        borderColor: colors.border,
                                    }
                                ]}
                                onPress={() => updateFormField('showDatePicker', true)}
                            >
                                <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
                                <ThemedText style={{ color: formData.eventDate ? colors.text : '#94A3B8', fontSize: 14 }}>
                                    {formData.eventDate ? formData.eventDate.toLocaleDateString() : 'Tap to select date'}
                                </ThemedText>
                                {formData.eventDate && (
                                    <TouchableOpacity
                                        onPress={(e) => {
                                            e.stopPropagation();
                                            updateFormField('eventDate', undefined);
                                        }}
                                        style={{ marginLeft: 'auto', padding: 2 }}
                                    >
                                        <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
                                    </TouchableOpacity>
                                )}
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputGroup}>
                            <ThemedText style={[styles.label, { color: colors.textSecondary }]}>Expiration Period (Optional)</ThemedText>
                            <View style={styles.chipRow}>
                                {([
                                    { value: 'never', label: 'Never' },
                                    { value: '1', label: '1 Day' },
                                    { value: '2', label: '2 Days' },
                                    { value: '3', label: '3 Days' },
                                    { value: '4', label: '4 Days' },
                                    { value: '5', label: '5 Days' }
                                ] as const).map(option => {
                                    const isSelected = formData.expiryDays === option.value;
                                    return (
                                        <TouchableOpacity
                                            key={option.value}
                                            style={[
                                                styles.expiryChip,
                                                {
                                                    backgroundColor: isSelected ? colors.primary : (isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC'),
                                                    borderColor: isSelected ? colors.primary : colors.border
                                                }
                                            ]}
                                            onPress={() => updateFormField('expiryDays', option.value)}
                                            activeOpacity={0.7}
                                        >
                                            <ThemedText
                                                style={[
                                                    styles.expiryChipText,
                                                    { color: isSelected ? '#FFFFFF' : colors.textSecondary }
                                                ]}
                                            >
                                                {option.label}
                                            </ThemedText>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>
                    </View>
                </ScrollView>

                {/* Submit button following the ThankYou pill button style */}
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.submitBtn, { backgroundColor: colors.primary }]}
                        onPress={handleSubmit}
                        disabled={mutation.isPending}
                        activeOpacity={0.8}
                    >
                        {mutation.isPending ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <ThemedText style={styles.submitBtnText}>
                                {announcementToEdit ? 'Save Changes' : 'Post Notice'}
                            </ThemedText>
                        )}
                    </TouchableOpacity>
                </View>

                {/* DateTimePicker modals */}
                {formData.showDatePicker && Platform.OS === 'android' && (
                    <DateTimePicker
                        value={formData.eventDate || new Date()}
                        mode="date"
                        display="default"
                        onChange={onDateChange}
                        minimumDate={new Date()}
                    />
                )}

                {formData.showDatePicker && Platform.OS === 'ios' && (
                    <Modal
                        visible={formData.showDatePicker}
                        transparent={true}
                        animationType="fade"
                        onRequestClose={() => updateFormField('showDatePicker', false)}
                    >
                        <View style={styles.iosDateModalOverlay}>
                            <View style={[styles.iosDateModalContent, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderColor: colors.border }]}>
                                <View style={[styles.iosModalHeader, { borderBottomColor: colors.border }]}>
                                    <ThemedText style={[styles.iosModalTitle, { color: colors.text }]}>Select Date</ThemedText>
                                </View>

                                <View style={[styles.iosPickerContainer, { backgroundColor: colors.background }]}>
                                    <DateTimePicker
                                        value={formData.eventDate || new Date()}
                                        mode="date"
                                        display="spinner"
                                        onChange={onDateChange}
                                        minimumDate={new Date()}
                                        textColor={colors.text}
                                    />
                                </View>

                                <View style={styles.iosModalFooter}>
                                    <TouchableOpacity
                                        style={styles.iosModalBtn}
                                        onPress={() => updateFormField('showDatePicker', false)}
                                    >
                                        <ThemedText style={[styles.iosModalBtnText, { color: colors.primary }]}>Confirm</ThemedText>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </Modal>
                )}
            </View>
            <LoaderOverlay visible={mutation.isPending} />
        </PremiumModal>
    );
});

CreatePublicAnnouncement.displayName = 'CreatePublicAnnouncement';

const styles = StyleSheet.create({
    modalContent: {
        width: '100%',
        paddingVertical: 4,
        flexShrink: 1,
    },
    scrollContainer: {
        width: '100%',
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 120,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    title: {
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: -0.4,
    },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    form: {
        gap: 16,
    },
    inputGroup: {
        gap: 6,
    },
    label: {
        fontSize: 12,
        fontWeight: '700',
    },
    input: {
        borderWidth: 1,
        borderRadius: Layout.borderRadius,
        paddingHorizontal: 12,
        height: 48,
        fontSize: 14,
    },
    textArea: {
        height: 100,
        paddingTop: 12,
    },
    datePickerBtn: {
        borderWidth: 1,
        borderRadius: Layout.borderRadius,
        paddingHorizontal: 12,
        height: 48,
        flexDirection: 'row',
        alignItems: 'center',
    },
    footer: {
        marginTop: 24,
        alignItems: 'center',
    },
    submitBtn: {
        width: 150,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    submitBtnText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    // iOS Date Picker Modal styles
    iosDateModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    iosDateModalContent: {
        width: '100%',
        borderRadius: Layout.borderRadius,
        padding: 20,
        alignItems: 'center',
        borderWidth: 1,
    },
    iosModalHeader: {
        width: '100%',
        paddingBottom: 10,
        borderBottomWidth: 1,
        alignItems: 'center',
        marginBottom: 16,
    },
    iosModalTitle: {
        fontSize: 16,
        fontWeight: '700',
    },
    iosPickerContainer: {
        width: '100%',
        borderRadius: Layout.borderRadius,
        overflow: 'hidden',
        marginBottom: 16,
    },
    iosModalFooter: {
        width: '100%',
        alignItems: 'center',
    },
    iosModalBtn: {
        paddingVertical: 10,
        paddingHorizontal: 20,
    },
    iosModalBtnText: {
        fontSize: 15,
        fontWeight: '700',
    },
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 4,
    },
    expiryChip: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    expiryChipText: {
        fontSize: 12,
        fontWeight: '700',
    },
});
