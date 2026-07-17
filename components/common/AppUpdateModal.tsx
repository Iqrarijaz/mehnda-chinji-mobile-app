import React from 'react';
import {
    Modal,
    StyleSheet,
    TouchableOpacity,
    View,
    Platform,
    Linking
} from 'react-native';
import LottieView from 'lottie-react-native';
import { ThemedText } from '../ThemedText';
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

export const AppUpdateModal = ({
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
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                    <View style={styles.lottieContainer}>
                        <LottieView
                            source={require('@/public/json/loading.json')}
                            autoPlay
                            loop
                            style={styles.lottie}
                        />
                    </View>

                    <View style={styles.textContainer}>
                        <ThemedText style={styles.title}>
                            {isMandatory ? "Update Required" : "New Version Available"}
                        </ThemedText>

                        <ThemedText style={[styles.subtitle, { color: isDark ? 'rgba(255, 255, 255, 0.7)' : '#6B7B73' }]}>
                            A new version {latestVersion} is available. {isMandatory ? "Please update to continue using the app." : "Would you like to update now?"}
                        </ThemedText>

                        {releaseNotes ? (
                            <View style={[styles.notesContainer, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F8FAFC' }]}>
                                <ThemedText style={styles.notesTitle}>What's New:</ThemedText>
                                <ThemedText style={[styles.notesText, { color: isDark ? 'rgba(255, 255, 255, 0.6)' : '#4F5F57' }]}>
                                    {releaseNotes}
                                </ThemedText>
                            </View>
                        ) : null}
                    </View>

                    <View style={styles.buttonContainer}>
                        {!isMandatory && (
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: 'transparent' }]}
                                onPress={onClose}
                            >
                                <ThemedText style={[styles.modalButtonText, { color: colors.textSecondary }]}>Later</ThemedText>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={[styles.modalButton, { backgroundColor: colors.primary }]}
                            onPress={handleUpdate}
                        >
                            <ThemedText style={styles.modalButtonText}>Update Now</ThemedText>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContent: {
        width: '100%',
        borderRadius: Layout.borderRadius,
        padding: 24,
        alignItems: 'center',
    },
    lottieContainer: {
        width: 180,
        height: 180,
        marginBottom: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    lottie: {
        width: '100%',
        height: '100%',
    },
    textContainer: {
        marginBottom: 24,
        alignItems: 'center',
        width: '100%',
    },
    title: {
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        lineHeight: 20,
        textAlign: 'center',
    },
    notesContainer: {
        width: '100%',
        padding: 12,
        borderRadius: Layout.borderRadius,
        marginTop: 16,
    },
    notesTitle: {
        fontSize: 11,
        fontWeight: '700',
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    notesText: {
        fontSize: 11,
        lineHeight: 16,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    modalButton: {
        width: 120,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    }
});
