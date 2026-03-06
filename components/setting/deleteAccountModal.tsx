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
import { ThemedText } from '@/components/themedText';
import { useAuth } from '@/context/AuthContext';
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
            const response = await deleteAccount({});
            if (response.success) {
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
        <PremiumModal visible={visible} onClose={resetAndClose}>
            <View style={styles.handle} />
            <View style={styles.modalHeader}>
                <ThemedText style={[styles.modalTitle, { color: '#ef4444' }]}>Delete Account</ThemedText>
                <TouchableOpacity onPress={resetAndClose}>
                    <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
                <ThemedText style={styles.warningText}>
                    This action is permanent and cannot be undone. All your data will be lost.
                </ThemedText>
                <ThemedText style={styles.inputLabel}>
                    Type <ThemedText style={{ fontWeight: '800', color: '#ef4444' }}>DELETE MY ACCOUNT</ThemedText> to confirm.
                </ThemedText>
                <TextInput
                    style={[styles.input, { color: colors.text, borderColor: '#ef4444' }]}
                    value={deleteConfirmation}
                    onChangeText={setDeleteConfirmation}
                    placeholder="DELETE MY ACCOUNT"
                    placeholderTextColor="#94a3b8"
                    autoCapitalize="characters"
                />
            </View>

            <TouchableOpacity
                style={[
                    styles.saveButton,
                    { backgroundColor: '#ef4444', opacity: deleteConfirmation === 'DELETE MY ACCOUNT' ? 1 : 0.5 }
                ]}
                onPress={handleDeleteAccount}
                disabled={isDeleting || deleteConfirmation !== 'DELETE MY ACCOUNT'}
            >
                {isDeleting ? (
                    <ActivityIndicator color="#FFFFFF" />
                ) : (
                    <ThemedText style={styles.saveButtonText}>Delete My Account</ThemedText>
                )}
            </TouchableOpacity>
        </PremiumModal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 24,
        paddingBottom: 40,
        shadowRadius: 10,
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#E2E8F0',
        alignSelf: 'center',
        marginBottom: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '800',
    },
    inputContainer: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#475569',
        letterSpacing: 0.5,
        marginBottom: 8,
        marginLeft: 2,
    },
    input: {
        height: 52,
        borderWidth: 1.5,
        borderRadius: 14,
        paddingHorizontal: 18,
        fontSize: 15,
        fontWeight: '500',
        backgroundColor: 'transparent',
    },
    saveButton: {
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    warningText: {
        color: '#ef4444',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: 20,
    },
});
