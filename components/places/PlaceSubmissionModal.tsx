import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

import { submitPlace, updateRequest } from '@/apis/places';
import { ThemedText } from '@/components/themedText';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';

interface PlaceSubmissionModalProps {
    visible: boolean;
    onClose: () => void;
    category: string;
    onSuccess: () => void;
    editData?: any;
}

const PlaceSubmissionModal = ({ visible, onClose, category, onSuccess, editData }: PlaceSubmissionModalProps) => {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const queryClient = useQueryClient();
    const isEditing = !!editData;

    const [form, setForm] = useState({
        name: '',
        address: '',
        contact: [{ name: '', number: '' }],
        description: '', // Education
        timing: '', // Health
        services: '', // Health
    });

    React.useEffect(() => {
        if (editData && visible) {
            setForm({
                name: editData.name || '',
                address: editData.address || '',
                contact: editData.contact?.length ? editData.contact : [{ name: '', number: '' }],
                description: editData.description || '',
                timing: editData.timing || '',
                services: editData.services || '',
            });
        } else if (!visible) {
            setForm({
                name: '',
                address: '',
                contact: [{ name: '', number: '' }],
                description: '',
                timing: '',
                services: '',
            });
        }
    }, [editData, visible]);

    const handleChange = (key: string, value: string) => {
        setForm(prev => ({ ...prev, [key]: value }));
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

    const submitMutation = useMutation({
        mutationFn: async (payload: any) => {
            if (isEditing) {
                return updateRequest(editData._id, payload);
            }
            return submitPlace(payload);
        },
        onSuccess: () => {
            onClose(); // Close first so Toast is visible
            Toast.show({
                type: 'success',
                text1: isEditing ? 'Updated' : 'Submitted',
                text2: isEditing ? 'Request updated successfully.' : 'Request submitted successfully pending approval.',
            });
            queryClient.invalidateQueries({ queryKey: ['my-place-requests'] });
            onSuccess();
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

    const handleSubmit = () => {
        if (!form.name.trim() || !form.address.trim() || !form.description.trim()) {
            Toast.show({
                type: 'error',
                text1: 'Validation Error',
                text2: 'Name, Address and Description are required.',
            });
            return;
        }

        if (form.description.trim().length < 50) {
            Toast.show({
                type: 'error',
                text1: 'Validation Error',
                text2: 'Description must be at least 50 characters.',
            });
            return;
        }

        if (isHealth) {
            if (!form.timing.trim() || !form.services.trim()) {
                Toast.show({
                    type: 'error',
                    text1: 'Validation Error',
                    text2: 'Timing and Services are required for Health category.',
                });
                return;
            }

            if (form.services.trim().length < 50) {
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

        submitMutation.mutate({
            ...form,
            contact: validContacts,
            category: category,
        });
    };



    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.modalOverlay}
            >
                <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                    <View style={styles.header}>
                        <ThemedText style={styles.title}>{isEditing ? 'Edit' : 'Submit'} {category} Request</ThemedText>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        <View style={styles.formGroup}>
                            <View style={styles.labelRow}>
                                <ThemedText style={styles.label}>Name <ThemedText style={{ color: '#EF4444' }}>*</ThemedText></ThemedText>
                                <ThemedText style={[styles.charCount, form.name.length >= 40 && { color: '#EF4444' }]}>
                                    {form.name.length}/40
                                </ThemedText>
                            </View>
                            <TextInput
                                style={[styles.input, { backgroundColor: theme === 'dark' ? '#1E293B' : '#F1F5F9', color: colors.text }]}
                                placeholder="Enter name"
                                placeholderTextColor="#94A3B8"
                                value={form.name}
                                onChangeText={(text) => handleChange('name', text)}
                                maxLength={40}
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <View style={styles.labelRow}>
                                <ThemedText style={styles.label}>Address <ThemedText style={{ color: '#EF4444' }}>*</ThemedText></ThemedText>
                                <ThemedText style={[styles.charCount, form.address.length >= 50 && { color: '#EF4444' }]}>
                                    {form.address.length}/50
                                </ThemedText>
                            </View>
                            <TextInput
                                style={[styles.input, { backgroundColor: theme === 'dark' ? '#1E293B' : '#F1F5F9', color: colors.text }]}
                                placeholder="Enter address"
                                placeholderTextColor="#94A3B8"
                                value={form.address}
                                onChangeText={(text) => handleChange('address', text)}
                                maxLength={50}
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <ThemedText style={styles.label}>Contacts (Max 3) <ThemedText style={{ color: '#EF4444' }}>*</ThemedText></ThemedText>
                                {form.contact.length < 3 && (
                                    <TouchableOpacity onPress={addContact}>
                                        <ThemedText style={{ color: colors.primary, fontSize: 14 }}>+ Add Contact</ThemedText>
                                    </TouchableOpacity>
                                )}
                            </View>

                            {form.contact.map((contact, index) => (
                                <View key={index} style={{ marginBottom: 12 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                                        <View style={{ flex: 1, gap: 8 }}>
                                            <TextInput
                                                style={[styles.input, { backgroundColor: theme === 'dark' ? '#1E293B' : '#F1F5F9', color: colors.text }]}
                                                placeholder="Contact name (e.g. Admin)"
                                                placeholderTextColor="#94A3B8"
                                                value={contact.name}
                                                onChangeText={(text) => handleContactChange(index, 'name', text)}
                                            />
                                            <TextInput
                                                style={[styles.input, { backgroundColor: theme === 'dark' ? '#1E293B' : '#F1F5F9', color: colors.text }]}
                                                placeholder="Phone number (e.g. 0300 0000000)"
                                                placeholderTextColor="#94A3B8"
                                                value={contact.number}
                                                onChangeText={(text) => handleContactChange(index, 'number', text)}
                                                keyboardType="phone-pad"
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

                        <View style={styles.formGroup}>
                            <View style={styles.labelRow}>
                                <ThemedText style={styles.label}>Description <ThemedText style={{ color: '#EF4444' }}>*</ThemedText></ThemedText>
                                <ThemedText style={[
                                    styles.charCount,
                                    (form.description.length < 50 || form.description.length >= 500) && { color: '#EF4444' }
                                ]}>
                                    {form.description.length}/500 (Min 50)
                                </ThemedText>
                            </View>
                            <TextInput
                                style={[styles.input, styles.textArea, { backgroundColor: theme === 'dark' ? '#1E293B' : '#F1F5F9', color: colors.text }]}
                                placeholder="Enter descriptive details (Min 50 chars)..."
                                placeholderTextColor="#94A3B8"
                                value={form.description}
                                onChangeText={(text) => handleChange('description', text)}
                                multiline
                                numberOfLines={3}
                                maxLength={500}
                            />
                        </View>

                        {isHealth && (
                            <>
                                <View style={styles.formGroup}>
                                    <View style={styles.labelRow}>
                                        <ThemedText style={styles.label}>Timing <ThemedText style={{ color: '#EF4444' }}>*</ThemedText></ThemedText>
                                    </View>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: theme === 'dark' ? '#1E293B' : '#F1F5F9', color: colors.text }]}
                                        placeholder="e.g., 9:00 AM - 5:00 PM"
                                        placeholderTextColor="#94A3B8"
                                        value={form.timing}
                                        onChangeText={(text) => handleChange('timing', text)}
                                    />
                                </View>
                                <View style={styles.formGroup}>
                                    <View style={styles.labelRow}>
                                        <ThemedText style={styles.label}>Services <ThemedText style={{ color: '#EF4444' }}>*</ThemedText></ThemedText>
                                        <ThemedText style={[
                                            styles.charCount,
                                            (form.services.length < 50 || form.services.length >= 500) && { color: '#EF4444' }
                                        ]}>
                                            {form.services.length}/500 (Min 50)
                                        </ThemedText>
                                    </View>
                                    <TextInput
                                        style={[styles.input, styles.textArea, { backgroundColor: theme === 'dark' ? '#1E293B' : '#F1F5F9', color: colors.text }]}
                                        placeholder="Enter services offered (Min 50 chars)..."
                                        placeholderTextColor="#94A3B8"
                                        value={form.services}
                                        onChangeText={(text) => handleChange('services', text)}
                                        multiline
                                        numberOfLines={3}
                                        maxLength={500}
                                    />
                                </View>
                            </>
                        )}


                        <TouchableOpacity
                            style={[styles.submitButton, { backgroundColor: colors.primary }]}
                            onPress={handleSubmit}
                            disabled={submitMutation.isPending}
                        >
                            {submitMutation.isPending ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <ThemedText style={styles.submitButtonText}>{isEditing ? 'Update Request' : 'Submit Request'}</ThemedText>
                            )}
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

export default PlaceSubmissionModal;

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: '80%',
        paddingTop: 20,
        paddingHorizontal: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        textTransform: 'capitalize',
    },
    closeButton: {
        padding: 4,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    formGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        opacity: 0.8,
    },
    input: {
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    charCount: {
        fontSize: 12,
        opacity: 0.6,
        fontWeight: '500',
    },
    submitButton: {
        marginTop: 20,
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
