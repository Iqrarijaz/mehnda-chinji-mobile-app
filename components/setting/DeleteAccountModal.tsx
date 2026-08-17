import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Platform,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import Toast from 'react-native-toast-message';

import { deleteAccount } from '@/apis/profile';
import { LoaderOverlay } from '@/components/common/LoaderOverlay';
import { clientStorage } from '@/utils/storage';
import { ThemedText } from '@/components/ThemedText';
import { useAuth } from '@/context/AuthContext';
import { Layout } from '@/constants/layout';
import { PremiumModal } from '../common/PremiumModal';

interface DeleteAccountModalProps {
    visible: boolean;
    onClose: () => void;
    colors: any;
}

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({ visible, onClose, colors }) => {
    const { logout } = useAuth();
    const [deleteConfirmation, setDeleteConfirmation] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteAccount = async () => {
        if (deleteConfirmation !== 'DELETE MY ACCOUNT') return;

        setIsDeleting(true);
        try {
            const response = await deleteAccount({}) as any;
            if (response.success) {
                try {
                    await clientStorage.removeItem('remember_email');
                    await clientStorage.removeItem('remember_password');
                } catch (e) {
                    // Ignore storage errors on cleanup
                }
                Toast.show({ type: 'success', text1: 'Account Deleted', text2: 'Your account has been successfully deleted.' });
                resetAndClose();
                logout();
            } else {
                Toast.show({ type: 'error', text1: 'Error', text2: response.message });
            }
        } catch (error: any) {
            const message = error.response?.data?.message || 'Failed to delete account';
            Toast.show({ type: 'error', text1: 'Error', text2: message });
        } finally {
            setIsDeleting(false);
        }
    };

    const resetAndClose = () => {
        setDeleteConfirmation('');
        onClose();
    };

    return (
        <>
        <PremiumModal visible={visible} onClose={resetAndClose} type="centered">
            <View style={styles.modalHeader}>
                <ThemedText style={[styles.modalTitle, { color: colors.text }]}>Delete Account</ThemedText>
                <TouchableOpacity onPress={onClose} style={[styles.closeButton, { backgroundColor: colors.inputBackground }]}>
                    <Ionicons name="close" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
                <ThemedText style={[styles.warningText, { color: colors.danger }]}>
                    This action is permanent and cannot be undone. All your data will be lost.
                </ThemedText>
                <ThemedText style={[styles.inputLabel, { color: colors.textSecondary }]}>
                    Type <ThemedText style={{ fontWeight: '800', color: colors.danger }}>DELETE MY ACCOUNT</ThemedText> to confirm.
                </ThemedText>
                <TextInput
                    style={[styles.input, { color: colors.text, backgroundColor: colors.inputBackground }]}
                    placeholder="DELETE MY ACCOUNT"
                    placeholderTextColor={colors.placeholder}
                    value={deleteConfirmation}
                    onChangeText={setDeleteConfirmation}
                />
            </View>
            <View style={styles.footer}>
                <TouchableOpacity
                    onPress={handleDeleteAccount}
                    disabled={deleteConfirmation !== 'DELETE MY ACCOUNT' || isDeleting}
                    style={[
                        styles.saveButton,
                        { backgroundColor: '#ef4444', opacity: deleteConfirmation === 'DELETE MY ACCOUNT' ? 1 : 0.5, flex: 1, marginTop: 0 }
                    ]}
                >
                    {isDeleting ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <ThemedText style={styles.saveButtonText}>Delete</ThemedText>
                    )}
                </TouchableOpacity>

                <TouchableOpacity onPress={onClose} style={styles.cancelBtn} activeOpacity={0.7}>
                    <ThemedText style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</ThemedText>
                </TouchableOpacity>
            </View>
        </PremiumModal>
        <LoaderOverlay visible={isDeleting} text="Deleting your account..." />
        </>
    );
};

const styles = StyleSheet.create({
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16 },
    modalTitle: {
        fontSize: 15.5,
        fontWeight: '700',
        color: '#0F172A' },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: Layout.borderRadius,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center' },
    inputContainer: {
        marginBottom: 12 },
    inputLabel: {
        fontSize: 11.5,
        fontWeight: '600',
        color: '#475569',
        letterSpacing: 0.5,
        marginBottom: 4,
        marginLeft: 2 },
    input: {
        height: Platform.OS === 'android' ? 48 : 52,
        borderRadius: Layout.borderRadius,
        paddingHorizontal: 15,
        fontSize: 12.5,
        fontWeight: '500',
        backgroundColor: 'transparent' },
    saveButton: {
        height: Platform.OS === 'android' ? 48 : 52,
        borderRadius: Layout.borderRadius,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10 },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 13.5,
        fontWeight: '700' },
    warningText: {
        color: '#ef4444',
        fontSize: 12.5,
        textAlign: 'center',
        marginBottom: 12,
        lineHeight: 20 },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 12 },
    cancelBtn: {
        flex: 1,
        height: Platform.OS === 'android' ? 48 : 52,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: Layout.borderRadius },
    cancelText: {
        fontSize: 12.5,
        color: '#94A3B8',
        fontWeight: '600' } });
