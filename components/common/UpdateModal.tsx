import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Modal,
    StyleSheet,
    TouchableOpacity,
    View,
    Platform,
    Linking
} from 'react-native';
import { ThemedText } from '../themedText';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/colors';
import { analyticsService, AnalyticsEvents } from '@/analytics';

interface UpdateModalProps {
    visible: boolean;
    isMandatory: boolean;
    latestVersion: string;
    onClose: () => void;
    updateUrl: string;
    releaseNotes?: string;
}

export const UpdateModal = ({
    visible,
    isMandatory,
    latestVersion,
    onClose,
    updateUrl,
    releaseNotes
}: UpdateModalProps) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const colors = Colors[theme];

    const handleUpdate = () => {
        analyticsService.trackEvent(AnalyticsEvents.UPDATE_CLICKED, {
            version: latestVersion,
            isMandatory
        });
        if (updateUrl) {
            Linking.openURL(updateUrl).catch(err => console.error("Couldn't load page", err));
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            hardwareAccelerated
        >
            <View style={styles.overlay}>
                <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
                    <View style={[styles.iconContainer, { backgroundColor: isMandatory ? '#FEF2F2' : '#EFF6FF' }]}>
                        <Ionicons
                            name={isMandatory ? "alert-circle" : "cloud-download-outline"}
                            size={40}
                            color={isMandatory ? "#EF4444" : "#3B82F6"}
                        />
                    </View>

                    <ThemedText style={styles.title}>
                        {isMandatory ? "Update Required" : "New Version Available"}
                    </ThemedText>

                    <ThemedText style={[styles.subtitle, { color: isDark ? 'rgba(255, 255, 255, 0.7)' : '#64748B' }]}>
                        A new version {latestVersion} is available. {isMandatory ? "Please update to continue using the app." : "Would you like to update now?"}
                    </ThemedText>

                    {releaseNotes && (
                        <View style={[styles.notesContainer, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F8FAFC' }]}>
                            <ThemedText style={styles.notesTitle}>What's New:</ThemedText>
                            <ThemedText style={[styles.notesText, { color: isDark ? 'rgba(255, 255, 255, 0.6)' : '#475569' }]}>
                                {releaseNotes}
                            </ThemedText>
                        </View>
                    )}

                    <View style={styles.buttonContainer}>
                        {!isMandatory && (
                            <TouchableOpacity
                                style={[styles.button, styles.secondaryButton]}
                                onPress={onClose}
                            >
                                <ThemedText style={[styles.buttonText, { color: '#64748B' }]}>Later</ThemedText>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={[
                                styles.button,
                                styles.primaryButton,
                                !isMandatory && { flex: 1.5 },
                                { backgroundColor: isMandatory ? '#EF4444' : '#006666' }
                            ]}
                            onPress={handleUpdate}
                        >
                            <ThemedText style={[styles.buttonText, { color: '#FFFFFF' }]}>Update Now</ThemedText>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '95%',
        borderRadius: Layout.borderRadius,
        padding: 24,
        alignItems: 'center',
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        marginBottom: 12,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 15,
        lineHeight: 22,
        textAlign: 'center',
        marginBottom: 24,
    },
    notesContainer: {
        width: '100%',
        padding: 16,
        borderRadius: Layout.borderRadius,
        marginBottom: 24,
    },
    notesTitle: {
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    notesText: {
        fontSize: 14,
        lineHeight: 20,
    },
    buttonContainer: {
        flexDirection: 'row',
        width: '100%',
        gap: 12,
    },
    button: {
        height: 52,
        borderRadius: Layout.borderRadius,
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
    },
    primaryButton: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    secondaryButton: {
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '700',
    },
});
