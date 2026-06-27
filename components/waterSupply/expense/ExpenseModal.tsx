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
import { ThemedText } from '@/components/ThemedText';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import moment from '@/utils/dayjs';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ExpenseModalProps {
    visible: boolean;
    onClose: () => void;
    mode: 'add' | 'edit';
    initialData?: any;
    onSubmit: (data: { title: string; amount: number; expenseDate: string }) => Promise<boolean>;
    isDark: boolean;
    colors: any;
}

export default function ExpenseModal({
    visible,
    onClose,
    mode,
    initialData,
    onSubmit,
    isDark,
    colors
}: ExpenseModalProps) {
    const [formData, setFormData] = useState({
        title: '',
        amount: '',
        expenseDate: moment().format('YYYY-MM-DD')
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);

    useEffect(() => {
        if (visible) {
            if (mode === 'edit' && initialData) {
                setFormData({
                    title: initialData.title || '',
                    amount: String(initialData.amount || ''),
                    expenseDate: initialData.expenseDate ? moment(initialData.expenseDate).format('YYYY-MM-DD') : moment().format('YYYY-MM-DD')
                });
            } else {
                setFormData({
                    title: '',
                    amount: '',
                    expenseDate: moment().format('YYYY-MM-DD')
                });
            }
            setErrors({});
        }
    }, [visible, mode, initialData]);

    const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
        }
        if (selectedDate) {
            setFormData(prev => ({
                ...prev,
                expenseDate: moment(selectedDate).format('YYYY-MM-DD')
            }));
        }
    };

    const handleSave = async () => {
        const errs: Record<string, string> = {};
        if (!formData.title.trim()) errs.title = 'Title is required';
        if (!formData.amount.trim() || isNaN(Number(formData.amount))) {
            errs.amount = 'Invalid amount';
        }
        if (!formData.expenseDate || !/^\d{4}-\d{2}-\d{2}$/.test(formData.expenseDate)) {
            errs.expenseDate = 'Date must be in YYYY-MM-DD format';
        }

        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            return;
        }

        setSubmitting(true);
        const success = await onSubmit({
            title: formData.title,
            amount: Number(formData.amount),
            expenseDate: formData.expenseDate
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
                                {mode === 'add' ? 'Log Water Expense' : 'Edit Expense'}
                            </ThemedText>
                            <TouchableOpacity onPress={onClose} disabled={submitting}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
                            <View style={styles.formGroup}>
                                <ThemedText style={styles.fieldLabel}>Expense Title *</ThemedText>
                                <TextInput
                                    placeholder="e.g. Pump repair, electricity bill"
                                    placeholderTextColor={colors.textSecondary}
                                    value={formData.title}
                                    onChangeText={(txt) => setFormData(prev => ({ ...prev, title: txt }))}
                                    editable={!submitting}
                                    style={[styles.modalInput, { color: colors.text, borderColor: errors.title ? '#ef4444' : colors.border }]}
                                />
                                {errors.title ? <ThemedText style={styles.errorText}>{errors.title}</ThemedText> : null}
                            </View>

                            <View style={styles.formGroup}>
                                <ThemedText style={styles.fieldLabel}>Amount (PKR) *</ThemedText>
                                <TextInput
                                    placeholder="5000"
                                    placeholderTextColor={colors.textSecondary}
                                    keyboardType="numeric"
                                    value={formData.amount}
                                    onChangeText={(txt) => setFormData(prev => ({ ...prev, amount: txt }))}
                                    editable={!submitting}
                                    style={[styles.modalInput, { color: colors.text, borderColor: errors.amount ? '#ef4444' : colors.border }]}
                                />
                                {errors.amount ? <ThemedText style={styles.errorText}>{errors.amount}</ThemedText> : null}
                            </View>

                            <View style={styles.formGroup}>
                                <ThemedText style={styles.fieldLabel}>Expense Date *</ThemedText>
                                <TouchableOpacity
                                    onPress={() => setShowDatePicker(true)}
                                    disabled={submitting}
                                    style={[styles.modalInput, {
                                        borderColor: errors.expenseDate ? '#ef4444' : colors.border,
                                        justifyContent: 'center'
                                    }]}
                                >
                                    <ThemedText style={{ color: formData.expenseDate ? colors.text : colors.textSecondary, fontSize: 14 }}>
                                        {formData.expenseDate ? moment(formData.expenseDate).format('DD MMM YYYY') : 'Select Date'}
                                    </ThemedText>
                                </TouchableOpacity>
                                {errors.expenseDate ? <ThemedText style={styles.errorText}>{errors.expenseDate}</ThemedText> : null}
                            </View>

                            <TouchableOpacity
                                onPress={handleSave}
                                disabled={submitting}
                                style={[styles.modalSubmitBtn, { backgroundColor: colors.primary }]}
                            >
                                <ThemedText style={styles.modalSubmitBtnText}>
                                    {submitting ? 'Saving...' : mode === 'add' ? 'Log Expense' : 'Save Changes'}
                                </ThemedText>
                            </TouchableOpacity>
                            <View style={{ height: 40 }} />
                        </ScrollView>
                    </View>
                </View>
            </KeyboardAvoidingView>

            {showDatePicker && (Platform.OS === 'ios' ? (
                <Modal
                    visible={showDatePicker}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setShowDatePicker(false)}
                >
                    <View style={styles.dateModalOverlay}>
                        <View style={[styles.dateModalContent, { backgroundColor: isDark ? '#1e293b' : '#FFF', borderColor: colors.border }]}>
                            <View style={styles.modalHeader}>
                                <ThemedText style={styles.modalTitle}>Select Expense Date</ThemedText>
                            </View>

                            <View style={[styles.pickerContainer, { backgroundColor: isDark ? '#1e293b' : '#FFF' }]}>
                                <DateTimePicker
                                    value={formData.expenseDate ? moment(formData.expenseDate, 'YYYY-MM-DD').toDate() : new Date()}
                                    mode="date"
                                    display="spinner"
                                    onChange={onDateChange}
                                    textColor={colors.text}
                                />
                            </View>

                            <View style={styles.modalFooter}>
                                <TouchableOpacity
                                    style={styles.modalBtn}
                                    onPress={() => setShowDatePicker(false)}
                                >
                                    <ThemedText style={[styles.modalBtnText, { color: colors.textSecondary }]}>Cancel</ThemedText>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.modalBtn, styles.modalBtnPrimary]}
                                    onPress={() => setShowDatePicker(false)}
                                >
                                    <ThemedText style={[styles.modalBtnText, { color: colors.primary }]}>Confirm</ThemedText>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            ) : (
                <DateTimePicker
                    value={formData.expenseDate ? moment(formData.expenseDate, 'YYYY-MM-DD').toDate() : new Date()}
                    mode="date"
                    display="default"
                    onChange={onDateChange}
                />
            ))}
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
    dateModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dateModalContent: {
        width: '90%',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
    },
    pickerContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 10,
        borderRadius: 12,
        padding: 10,
    },
    modalFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
        marginTop: 10,
    },
    modalBtn: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    modalBtnPrimary: {
        backgroundColor: 'rgba(255, 155, 81, 0.1)',
    },
    modalBtnText: {
        fontSize: 14,
        fontWeight: '700',
    },
});
