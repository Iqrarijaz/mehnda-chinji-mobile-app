import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { analyticsService, AnalyticsEvents } from '@/analytics';

interface MicroFeedbackProps {
    componentName: string;
}

export function MicroFeedback({ componentName }: MicroFeedbackProps) {
    const { theme } = useTheme();
    const colors = Colors[theme];

    const [submitted, setSubmitted] = useState<boolean>(false);
    const [showModal, setShowModal] = useState<boolean>(false);
    const [feedbackText, setFeedbackText] = useState<string>('');

    const handleFeedback = (isHelpful: boolean) => {
        analyticsService.trackEvent(AnalyticsEvents.MICRO_FEEDBACK_SUBMITTED, {
            component_name: componentName,
            is_helpful: isHelpful
        });

        if (!isHelpful) {
            setShowModal(true);
        } else {
            setSubmitted(true);
        }
    };

    const submitDetailedFeedback = () => {
        if (feedbackText.trim()) {
            analyticsService.trackEvent(AnalyticsEvents.GLOBAL_FEEDBACK_SUBMITTED, {
                component_name: componentName,
                text: feedbackText
            });
        }
        setShowModal(false);
        setSubmitted(true);
    };

    if (submitted) {
        return (
            <View style={styles.container}>
                <ThemedText style={[styles.title, { color: colors.text, opacity: 0.7 }]}>
                    Thank you for your feedback!
                </ThemedText>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ThemedText style={[styles.title, { color: colors.text }]}>Was this helpful?</ThemedText>
            <View style={styles.buttonRow}>
                <TouchableOpacity
                    style={[styles.button, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#F1F5F9' }]}
                    onPress={() => handleFeedback(true)}
                >
                    <Ionicons name="thumbs-up-outline" size={24} color={colors.primary} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#F1F5F9' }]}
                    onPress={() => handleFeedback(false)}
                >
                    <Ionicons name="thumbs-down-outline" size={24} color="#EF4444" />
                </TouchableOpacity>
            </View>

            <Modal visible={showModal} transparent animationType="fade">
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                        <View style={styles.modalHeader}>
                            <ThemedText style={[styles.modalTitle, { color: colors.text }]}>How can we improve?</ThemedText>
                            <TouchableOpacity onPress={() => { setShowModal(false); setSubmitted(true); }}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={[
                                styles.textInput,
                                {
                                    backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#F8FAFC',
                                    color: colors.text,
                                    borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : '#E2E8F0'
                                }
                            ]}
                            placeholder="Tell us what went wrong..."
                            placeholderTextColor={theme === 'dark' ? 'rgba(255,255,255,0.4)' : '#94A3B8'}
                            multiline
                            numberOfLines={4}
                            value={feedbackText}
                            onChangeText={setFeedbackText}
                            autoFocus
                        />

                        <TouchableOpacity
                            style={[styles.submitButton, { backgroundColor: colors.primary }]}
                            onPress={submitDetailedFeedback}
                        >
                            <ThemedText style={styles.submitButtonText}>Submit</ThemedText>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        paddingVertical: 24,
        marginTop: 16,
    },
    title: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 12,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 16,
    },
    button: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 24,
    },
    modalContent: {
        borderRadius: Layout.borderRadius,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    textInput: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        height: 100,
        textAlignVertical: 'top',
        fontSize: 14,
        marginBottom: 16,
    },
    submitButton: {
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    }
});
