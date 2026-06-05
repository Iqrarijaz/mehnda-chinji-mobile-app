import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Modal,
    TextInput,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themedText';

interface ConnectionModalProps {
    visible: boolean;
    onClose: () => void;
    mode: 'add' | 'edit';
    initialData?: any;
    onSubmit: (data: { name: string; phoneNumber: string; address: string; status?: string }) => Promise<boolean>;
    isDark: boolean;
    colors: any;
}

export default function ConnectionModal({
    visible,
    onClose,
    mode,
    initialData,
    onSubmit,
    isDark,
    colors
}: ConnectionModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        phoneNumber: '',
        address: '',
        status: 'ACTIVE'
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (visible) {
            if (mode === 'edit' && initialData) {
                setFormData({
                    name: initialData.name || '',
                    phoneNumber: initialData.phoneNumber || '',
                    address: initialData.address || '',
                    status: initialData.status || 'ACTIVE'
                });
            } else {
                setFormData({
                    name: '',
                    phoneNumber: '',
                    address: '',
                    status: 'ACTIVE'
                });
            }
            setErrors({});
        }
    }, [visible, mode, initialData]);

    const handleSave = async () => {
        const errs: Record<string, string> = {};
        if (!formData.name.trim()) errs.name = 'Name is required';
        if (!formData.phoneNumber.trim()) {
            errs.phoneNumber = 'Phone number is required';
        } else if (!/^03\d{9}$/.test(formData.phoneNumber)) {
            errs.phoneNumber = 'Must be exactly 11 digits starting with 03';
        }
        if (!formData.address.trim()) errs.address = 'Address is required';

        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            return;
        }

        setSubmitting(true);
        const success = await onSubmit({
            name: formData.name,
            phoneNumber: formData.phoneNumber,
            address: formData.address,
            status: mode === 'edit' ? formData.status : undefined
        });
        setSubmitting(false);
        if (success) {
            onClose();
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent={true}
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: isDark ? '#1e293b' : '#FFF' }]}>
                        <View style={styles.modalHeader}>
                            <ThemedText style={styles.modalTitle}>
                                {mode === 'add' ? 'Add Water Connection' : 'Edit Connection'}
                            </ThemedText>
                            <TouchableOpacity onPress={onClose} disabled={submitting}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
                            <View style={styles.formGroup}>
                                <ThemedText style={styles.fieldLabel}>Full Name *</ThemedText>
                                <TextInput
                                    placeholder="e.g. John Doe"
                                    placeholderTextColor={colors.textSecondary}
                                    value={formData.name}
                                    onChangeText={(txt) => setFormData(prev => ({ ...prev, name: txt }))}
                                    editable={!submitting}
                                    style={[styles.modalInput, { color: colors.text, borderColor: errors.name ? '#ef4444' : colors.border }]}
                                />
                                {errors.name ? <ThemedText style={styles.errorText}>{errors.name}</ThemedText> : null}
                            </View>

                            <View style={styles.formGroup}>
                                <ThemedText style={styles.fieldLabel}>Phone Number *</ThemedText>
                                <TextInput
                                    placeholder="03XXXXXXXXX"
                                    placeholderTextColor={colors.textSecondary}
                                    keyboardType="phone-pad"
                                    maxLength={11}
                                    value={formData.phoneNumber}
                                    onChangeText={(txt) => setFormData(prev => ({ ...prev, phoneNumber: txt }))}
                                    editable={!submitting}
                                    style={[styles.modalInput, { color: colors.text, borderColor: errors.phoneNumber ? '#ef4444' : colors.border }]}
                                />
                                {errors.phoneNumber ? <ThemedText style={styles.errorText}>{errors.phoneNumber}</ThemedText> : null}
                            </View>

                            <View style={styles.formGroup}>
                                <ThemedText style={styles.fieldLabel}>Address *</ThemedText>
                                <TextInput
                                    placeholder="Enter detailed address"
                                    placeholderTextColor={colors.textSecondary}
                                    value={formData.address}
                                    onChangeText={(txt) => setFormData(prev => ({ ...prev, address: txt }))}
                                    editable={!submitting}
                                    style={[styles.modalInput, { color: colors.text, borderColor: errors.address ? '#ef4444' : colors.border }]}
                                />
                                {errors.address ? <ThemedText style={styles.errorText}>{errors.address}</ThemedText> : null}
                            </View>

                            {mode === 'edit' ? (
                                <View style={styles.formGroup}>
                                    <ThemedText style={styles.fieldLabel}>Status *</ThemedText>
                                    <View style={styles.statusOptions}>
                                        {['ACTIVE', 'SUSPENDED', 'CANCELLED'].map((st) => (
                                            <TouchableOpacity
                                                key={st}
                                                onPress={() => setFormData(prev => ({ ...prev, status: st }))}
                                                disabled={submitting}
                                                style={[
                                                    styles.statusOptBtn,
                                                    {
                                                        backgroundColor: formData.status === st ? colors.primary : 'transparent',
                                                        borderColor: colors.border
                                                    }
                                                ]}
                                            >
                                                <ThemedText style={{ color: formData.status === st ? '#FFF' : colors.text, fontSize: 12 }}>
                                                    {st}
                                                </ThemedText>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            ) : null}

                            <TouchableOpacity
                                onPress={handleSave}
                                disabled={submitting}
                                style={[styles.modalSubmitBtn, { backgroundColor: colors.primary }]}
                            >
                                <ThemedText style={styles.modalSubmitBtnText}>
                                    {submitting ? 'Processing...' : mode === 'add' ? 'Add Connection' : 'Save Changes'}
                                </ThemedText>
                            </TouchableOpacity>
                            <View style={{ height: 40 }} />
                        </ScrollView>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        borderRadius: 20,
        padding: 20,
        width: '100%',
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 16,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    modalForm: {
        marginVertical: 10,
    },
    formGroup: {
        marginBottom: 16,
    },
    fieldLabel: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 6,
    },
    modalInput: {
        borderWidth: 2,
        borderRadius: 10,
        height: 44,
        paddingHorizontal: 12,
        fontSize: 14,
    },
    errorText: {
        color: '#ef4444',
        fontSize: 10,
        marginTop: 4,
        fontWeight: '600',
    },
    statusOptions: {
        flexDirection: 'row',
        gap: 8,
    },
    statusOptBtn: {
        flex: 1,
        height: 38,
        borderRadius: 8,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalSubmitBtn: {
        height: 46,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    modalSubmitBtnText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '700',
    },
});
