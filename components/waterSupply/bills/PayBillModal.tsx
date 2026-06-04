import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Modal,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themedText';

interface PayBillModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (paymentMode: string) => Promise<boolean>;
    isDark: boolean;
    colors: any;
}

export default function PayBillModal({
    visible,
    onClose,
    onSubmit,
    isDark,
    colors
}: PayBillModalProps) {
    const [paymentMode, setPaymentMode] = useState('CASH');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (visible) {
            setPaymentMode('CASH');
        }
    }, [visible]);

    const handleSave = async () => {
        setSubmitting(true);
        const success = await onSubmit(paymentMode);
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
            <View style={styles.modalOverlay}>
                <View style={[styles.payModalContent, { backgroundColor: isDark ? '#1e293b' : '#FFF' }]}>
                    <View style={styles.modalHeader}>
                        <ThemedText style={styles.modalTitle}>Record Payment</ThemedText>
                        <TouchableOpacity onPress={onClose} disabled={submitting}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    <ThemedText style={styles.fieldLabel}>Select Payment Mode *</ThemedText>
                    <View style={{ flexDirection: 'row', gap: 10, marginVertical: 16 }}>
                        {['CASH', 'BANK_TRANSFER', 'APP'].map((mode) => (
                            <TouchableOpacity
                                key={mode}
                                onPress={() => setPaymentMode(mode)}
                                disabled={submitting}
                                style={[
                                    styles.payModeBtn,
                                    {
                                        backgroundColor: paymentMode === mode ? colors.primary : (isDark ? '#334155' : '#FFF'),
                                        borderColor: colors.border,
                                        flex: 1
                                    }
                                ]}
                            >
                                <ThemedText style={{ color: paymentMode === mode ? '#FFF' : colors.text, fontSize: 12, fontWeight: '700' }}>
                                    {mode.replace('_', ' ')}
                                </ThemedText>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity
                        onPress={handleSave}
                        disabled={submitting}
                        style={[styles.modalSubmitBtn, { backgroundColor: '#10b981' }]}
                    >
                        <ThemedText style={styles.modalSubmitBtnText}>
                            {submitting ? 'Updating...' : 'Mark as PAID'}
                        </ThemedText>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    payModalContent: {
        borderRadius: 20,
        padding: 20,
        width: '85%',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
            },
            android: {
                elevation: 8,
            }
        }),
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 16,
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: '800',
    },
    fieldLabel: {
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 6,
    },
    payModeBtn: {
        height: 40,
        borderRadius: 10,
        borderWidth: 1,
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
