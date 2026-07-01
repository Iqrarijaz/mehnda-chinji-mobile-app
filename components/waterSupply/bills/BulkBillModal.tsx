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
import moment from '@/utils/dayjs';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MONTHS = [
    { name: 'Jan', value: '01' },
    { name: 'Feb', value: '02' },
    { name: 'Mar', value: '03' },
    { name: 'Apr', value: '04' },
    { name: 'May', value: '05' },
    { name: 'Jun', value: '06' },
    { name: 'Jul', value: '07' },
    { name: 'Aug', value: '08' },
    { name: 'Sep', value: '09' },
    { name: 'Oct', value: '10' },
    { name: 'Nov', value: '11' },
    { name: 'Dec', value: '12' },
];

interface BulkBillModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (data: { billingMonth: string; amount: number }) => Promise<boolean>;
    isDark: boolean;
    colors: any;
}

export default function BulkBillModal({
    visible,
    onClose,
    onSubmit,
    isDark,
    colors
}: BulkBillModalProps) {
    const [formData, setFormData] = useState({
        billingMonth: moment().format('YYYY-MM'),
        amount: '1000'
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [pickerYear, setPickerYear] = useState(moment().year());

    useEffect(() => {
        if (visible) {
            setFormData({
                billingMonth: moment().format('YYYY-MM'),
                amount: '1000'
            });
            setErrors({});
            setPickerYear(moment().year());
        }
    }, [visible]);

    const handleOpenPicker = () => {
        setPickerYear(moment(formData.billingMonth || undefined).year());
        setShowDatePicker(true);
    };

    const handleMonthSelect = (monthVal: string) => {
        const formattedMonth = `${pickerYear}-${monthVal}`;
        setFormData(prev => ({ ...prev, billingMonth: formattedMonth }));
        setShowDatePicker(false);
    };

    const handleSave = async () => {
        const errs: Record<string, string> = {};
        if (!formData.billingMonth || !/^\d{4}-\d{2}$/.test(formData.billingMonth)) {
            errs.billingMonth = 'Month must be selected';
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
                            <ThemedText style={styles.modalTitle}>Bulk Generate Bills</ThemedText>
                            <TouchableOpacity onPress={onClose} disabled={submitting}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
                            <ThemedText style={{ color: colors.textSecondary, marginBottom: 16 }}>
                                This will generate bills for all ACTIVE water connections that do not already have a bill for the specified month.
                            </ThemedText>

                            <View style={styles.formGroup}>
                                <ThemedText style={styles.fieldLabel}>Billing Month *</ThemedText>
                                <TouchableOpacity
                                    onPress={handleOpenPicker}
                                    disabled={submitting}
                                    style={[styles.modalInput, {
                                        borderColor: errors.billingMonth ? '#ef4444' : colors.border,
                                        justifyContent: 'center'
                                    }]}
                                >
                                    <ThemedText style={{ color: formData.billingMonth ? colors.text : colors.textSecondary, fontSize: 14 }}>
                                        {formData.billingMonth ? moment(formData.billingMonth, 'YYYY-MM').format('MMMM YYYY') : 'Select Month'}
                                    </ThemedText>
                                </TouchableOpacity>
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
                                    {submitting ? 'Generating...' : 'Generate Bulk Bills'}
                                </ThemedText>
                            </TouchableOpacity>
                            <View style={{ height: 40 }} />
                        </ScrollView>
                    </View>
                </View>
            </KeyboardAvoidingView>

            {/* Custom Month Picker Modal */}
            <Modal
                visible={showDatePicker}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowDatePicker(false)}
            >
                <View style={styles.dateModalOverlay}>
                    <View style={[styles.dateModalContent, { backgroundColor: isDark ? '#1e293b' : '#FFF', borderColor: colors.border }]}>
                        <View style={styles.modalHeader}>
                            <ThemedText style={styles.modalTitle}>Select Month & Year</ThemedText>
                        </View>

                        {/* Year Selector */}
                        <View style={styles.yearSelectorRow}>
                            <TouchableOpacity onPress={() => setPickerYear(p => p - 1)} style={[styles.yearArrow, { borderColor: colors.border }]}>
                                <Ionicons name="chevron-back" size={18} color={colors.text} />
                            </TouchableOpacity>
                            <ThemedText style={[styles.yearText, { color: colors.text }]}>{pickerYear}</ThemedText>
                            <TouchableOpacity onPress={() => setPickerYear(p => p + 1)} style={[styles.yearArrow, { borderColor: colors.border }]}>
                                <Ionicons name="chevron-forward" size={18} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        {/* Months Grid */}
                        <View style={styles.monthsGrid}>
                            {MONTHS.map((m) => {
                                const isSelected = formData.billingMonth === `${pickerYear}-${m.value}`;
                                return (
                                    <TouchableOpacity
                                        key={m.value}
                                        onPress={() => handleMonthSelect(m.value)}
                                        style={[
                                            styles.monthGridItem,
                                            {
                                                backgroundColor: isSelected ? colors.primary : (isDark ? '#334155' : 'rgba(0,0,0,0.03)'),
                                                borderColor: isSelected ? colors.primary : colors.border
                                            }
                                        ]}
                                    >
                                        <ThemedText style={{ color: isSelected ? '#FFF' : colors.text, fontWeight: '700', fontSize: 13 }}>
                                            {m.name}
                                        </ThemedText>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={styles.modalBtn}
                                onPress={() => setShowDatePicker(false)}
                            >
                                <ThemedText style={[styles.modalBtnText, { color: colors.textSecondary }]}>Cancel</ThemedText>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
        height: 42,
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
    modalBtnText: {
        fontSize: 14,
        fontWeight: '700',
    },
    yearSelectorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        marginBottom: 16,
    },
    yearArrow: {
        width: 32,
        height: 32,
        borderRadius: 8,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    yearText: {
        fontSize: 16,
        fontWeight: '800',
    },
    monthsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 8,
        marginBottom: 16,
    },
    monthGridItem: {
        width: '30%',
        height: 38,
        borderRadius: 8,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 2,
    },
});
