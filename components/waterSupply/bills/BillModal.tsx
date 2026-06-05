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
import moment from 'moment';

interface BillModalProps {
    visible: boolean;
    onClose: () => void;
    mode: 'add' | 'edit';
    initialData?: any;
    connections: any[];
    onSubmit: (data: { connectionId: string; billingMonth: string; amount: number }) => Promise<boolean>;
    isDark: boolean;
    colors: any;
}

export default function BillModal({
    visible,
    onClose,
    mode,
    initialData,
    connections,
    onSubmit,
    isDark,
    colors
}: BillModalProps) {
    const [formData, setFormData] = useState({
        connectionId: '',
        billingMonth: moment().format('YYYY-MM'),
        amount: '500'
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);

    const hasPreselectedConnection = (mode === 'add' && initialData?._id) || mode === 'edit';

    const connName = mode === 'edit'
        ? (initialData?.connection?.name || initialData?.connectionId?.name || 'Unknown Connection')
        : (initialData?.name || 'Unknown Connection');

    const connId = mode === 'edit'
        ? (initialData?.connection?.connectionId || initialData?.connectionId?.connectionId || '-')
        : (initialData?.connectionId || '-');

    useEffect(() => {
        if (visible) {
            if (mode === 'edit' && initialData) {
                setFormData({
                    connectionId: initialData.connectionId?._id || initialData.connectionId || '',
                    billingMonth: initialData.billingMonth || '',
                    amount: String(initialData.amount || '1000')
                });
            } else {
                setFormData({
                    connectionId: initialData?._id || '',
                    billingMonth: moment().format('YYYY-MM'),
                    amount: initialData?.monthlyRate ? String(initialData.monthlyRate) : '1000'
                });
            }
            setErrors({});
        }
    }, [visible, mode, initialData]);

    const handleSave = async () => {
        const errs: Record<string, string> = {};
        if (!formData.connectionId) errs.connectionId = 'Connection is required';
        if (!formData.billingMonth || !/^\d{4}-\d{2}$/.test(formData.billingMonth)) {
            errs.billingMonth = 'Month must be in YYYY-MM format';
        }
        if (!formData.amount.trim() || isNaN(Number(formData.amount))) {
            errs.amount = 'Invalid amount';
        }

        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            return;
        }

        setSubmitting(true);
        const success = await onSubmit({
            connectionId: formData.connectionId,
            billingMonth: formData.billingMonth,
            amount: Number(formData.amount)
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
                                {mode === 'add' ? 'Generate Water Bill' : 'Edit Bill'}
                            </ThemedText>
                            <TouchableOpacity onPress={onClose} disabled={submitting}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
                            {hasPreselectedConnection ? (
                                <View style={styles.formGroup}>
                                    <ThemedText style={styles.fieldLabel}>Connection Details</ThemedText>
                                    <View style={[styles.readOnlyCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', borderColor: colors.border }]}>
                                        <ThemedText style={[styles.readOnlyName, { color: colors.text }]}>{connName}</ThemedText>
                                        <ThemedText style={[styles.readOnlySub, { color: colors.textSecondary }]}>ID: {connId}</ThemedText>
                                    </View>
                                </View>
                            ) : (
                                <View style={styles.formGroup}>
                                    <ThemedText style={styles.fieldLabel}>Select Connection *</ThemedText>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 8 }}>
                                        {connections.map((c) => (
                                            <TouchableOpacity
                                                key={c._id}
                                                onPress={() => {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        connectionId: c._id,
                                                        amount: String(c.monthlyRate || 1000)
                                                    }));
                                                }}
                                                disabled={submitting}
                                                style={[
                                                    styles.selectOption,
                                                    {
                                                        backgroundColor: formData.connectionId === c._id ? colors.primary : (isDark ? '#334155' : '#FFF'),
                                                        borderColor: colors.border
                                                    }
                                                ]}
                                            >
                                                <ThemedText style={{ color: formData.connectionId === c._id ? '#FFF' : colors.text, fontWeight: '600' }}>{c.name}</ThemedText>
                                                <ThemedText style={{ color: formData.connectionId === c._id ? '#FFF' : colors.textSecondary, fontSize: 10 }}>{c.connectionId}</ThemedText>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                    {errors.connectionId ? <ThemedText style={styles.errorText}>{errors.connectionId}</ThemedText> : null}
                                </View>
                            )}

                            <View style={styles.formGroup}>
                                <ThemedText style={styles.fieldLabel}>Billing Month (YYYY-MM) *</ThemedText>
                                <TextInput
                                    placeholder="e.g. 2026-06"
                                    placeholderTextColor={colors.textSecondary}
                                    value={formData.billingMonth}
                                    onChangeText={(txt) => setFormData(prev => ({ ...prev, billingMonth: txt }))}
                                    editable={!submitting}
                                    style={[styles.modalInput, { color: colors.text, borderColor: errors.billingMonth ? '#ef4444' : colors.border }]}
                                />
                                {errors.billingMonth ? <ThemedText style={styles.errorText}>{errors.billingMonth}</ThemedText> : null}
                            </View>

                            <View style={styles.formGroup}>
                                <ThemedText style={styles.fieldLabel}>Amount (PKR) *</ThemedText>
                                <TextInput
                                    placeholder="1000"
                                    placeholderTextColor={colors.textSecondary}
                                    keyboardType="numeric"
                                    value={formData.amount}
                                    onChangeText={(txt) => setFormData(prev => ({ ...prev, amount: txt }))}
                                    editable={!submitting}
                                    style={[styles.modalInput, { color: colors.text, borderColor: errors.amount ? '#ef4444' : colors.border }]}
                                />
                                {errors.amount ? <ThemedText style={styles.errorText}>{errors.amount}</ThemedText> : null}
                            </View>

                            <TouchableOpacity
                                onPress={handleSave}
                                disabled={submitting}
                                style={[styles.modalSubmitBtn, { backgroundColor: colors.primary }]}
                            >
                                <ThemedText style={styles.modalSubmitBtnText}>
                                    {submitting ? 'Processing...' : mode === 'add' ? 'Generate Bill' : 'Save Changes'}
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
    selectOption: {
        borderWidth: 2,
        borderRadius: 10,
        padding: 10,
        marginRight: 8,
        minWidth: 120,
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
    readOnlyCard: {
        borderWidth: 2,
        borderRadius: 10,
        padding: 12,
        marginTop: 4,
    },
    readOnlyName: {
        fontSize: 14,
        fontWeight: '700',
    },
    readOnlySub: {
        fontSize: 11,
        marginTop: 2,
        fontWeight: '600',
    },
});
