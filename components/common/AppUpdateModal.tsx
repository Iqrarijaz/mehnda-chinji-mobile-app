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

export const AppUpdateModal = React.memo(({
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
            onRequestClose={isMandatory ? () => { } : onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                    <View style={styles.animationContainer}>
                        <LottieView
                            source={require('@/public/json/loading.json')}
                            autoPlay
                            loop
                            renderMode="HARDWARE"
                            style={styles.lottie}
                        />
                    </View>

                    <ThemedText style={[styles.title, { color: colors.text }]}>
                        App Update Available
                    </ThemedText>

                    <ThemedText style={[styles.versionText, { color: colors.primary }]}>
                        Version {latestVersion} is now live!
                    </ThemedText>

                    {releaseNotes ? (
                        <View style={[styles.releaseNotesBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                            <ThemedText style={[styles.releaseNotesTitle, { color: colors.text }]}>What&apos;s New:</ThemedText>
                            <ThemedText style={[styles.releaseNotesText, { color: colors.textSecondary }]}>
                                {releaseNotes}
                            </ThemedText>
                        </View>
                    ) : (
                        <ThemedText style={[styles.description, { color: colors.textSecondary }]}>
                            We&apos;ve added new features, improved performance, and fixed bugs to give you a better experience.
                        </ThemedText>
                    )}

                    <View style={styles.actionRow}>
                        {!isMandatory && (
                            <TouchableOpacity
                                style={[styles.button, styles.cancelButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
                                onPress={onClose}
                            >
                                <ThemedText style={[styles.cancelText, { color: colors.textSecondary }]}>
                                    Later
                                </ThemedText>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={[
                                styles.button,
                                styles.updateButton,
                                { backgroundColor: colors.lime },
                                isMandatory && { flex: 1 }
                            ]}
                            onPress={handleUpdate}
                        >
                            <ThemedText style={styles.updateText}>
                                Update Now
                            </ThemedText>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
});

AppUpdateModal.displayName = 'AppUpdateModal';

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20 },
    modalContent: {
        width: '100%',
        borderRadius: Layout.borderRadius,
        padding: 20,
        alignItems: 'center' },
    animationContainer: {
        width: 180,
        height: 180,
        marginBottom: 16,
        justifyContent: 'center',
        alignItems: 'center' },
    lottie: {
        width: '100%',
        height: '100%' },
    title: {
        fontSize: 17,
        fontWeight: '800',
        textAlign: 'center' },
    versionText: {
        fontSize: 12.5,
        fontWeight: '700',
        marginTop: 4,
        marginBottom: 16,
        textAlign: 'center' },
    releaseNotesBox: {
        width: '100%',
        padding: 14,
        borderRadius: Layout.borderRadius,
        marginBottom: 20 },
    releaseNotesTitle: {
        fontSize: 11,
        fontWeight: '700',
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 0.5 },
    releaseNotesText: {
        fontSize: 12.5,
        lineHeight: 20 },
    description: {
        fontSize: 12.5,
        lineHeight: 20,
        textAlign: 'center',
        marginBottom: 20 },
    actionRow: {
        flexDirection: 'row',
        width: '100%',
        gap: 12 },
    button: {
        flex: 1,
        height: 46,
        borderRadius: Layout.borderRadius,
        justifyContent: 'center',
        alignItems: 'center' },
    cancelButton: {},
    cancelText: {
        fontSize: 13,
        fontWeight: '600' },
    updateButton: {},
    updateText: {
        color: '#1E293B',
        fontSize: 13,
        fontWeight: '700' }
});
