import React, { forwardRef, useState, useMemo, useCallback, useEffect } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Keyboard,
    TouchableWithoutFeedback,
    Platform
} from 'react-native';
import {
    BottomSheetModal,
    BottomSheetBackdrop,
    BottomSheetScrollView,
    BottomSheetFooter
} from '@gorhom/bottom-sheet';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { ThemedText } from '@/components/themedText';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/colors';
import { submitReport, ReportPayload } from '@/apis/report';

const isAndroid = Platform.OS === 'android';

export type ReportModalRef = BottomSheetModal;

export interface ReportModalProps {
    targetId: string;
    targetType: ReportPayload['targetType'];
}

const REPORT_REASONS = [
    'Inappropriate Content',
    'Spam or Scam',
    'Fake Information',
    'Harassment or Abuse',
    'Misleading Details',
    'Other'
];

export const ReportModal = forwardRef<ReportModalRef, ReportModalProps>(
    ({ targetId, targetType }, ref) => {
        const { theme, isDark } = useTheme();
        const colors = Colors[theme];

        const [selectedReason, setSelectedReason] = useState<string | null>(null);
        const [description, setDescription] = useState('');
        const [isSubmitting, setIsSubmitting] = useState(false);
        const [keyboardHeight, setKeyboardHeight] = useState(0);

        useEffect(() => {
            if (!isAndroid) return;

            const showSubscription = Keyboard.addListener('keyboardDidShow', (e) => {
                setKeyboardHeight(e.endCoordinates.height);
            });
            const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
                setKeyboardHeight(0);
            });

            return () => {
                showSubscription.remove();
                hideSubscription.remove();
            };
        }, []);

        // Snap points for the bottom sheet
        const snapPoints = useMemo(() => ['70%', '90%'], []);

        // Handlers
        const handlePresentModalPress = useCallback(() => {
            (ref as React.RefObject<BottomSheetModal>)?.current?.present();
        }, [ref]);

        const handleCloseModalPress = useCallback(() => {
            (ref as React.RefObject<BottomSheetModal>)?.current?.dismiss();
            Keyboard.dismiss();

            // Reset state
            setTimeout(() => {
                setSelectedReason(null);
                setDescription('');
            }, 300);
        }, [ref]);

        const handleSubmit = async () => {
            if (!selectedReason) return;

            setIsSubmitting(true);
            try {
                await submitReport({
                    targetId,
                    targetType,
                    reason: selectedReason,
                    description: description.trim()
                });

                Toast.show({
                    type: 'success',
                    text1: 'Report Submitted',
                    text2: 'Thank you. We will review this shortly.'
                });

                handleCloseModalPress();
            } catch (error: any) {
                const errorMsg = error?.response?.data?.message || error.message || 'Failed to submit report';
                Toast.show({
                    type: 'error',
                    text1: 'Reporting Failed',
                    text2: errorMsg
                });
            } finally {
                setIsSubmitting(false);
            }
        };

        const renderBackdrop = useCallback(
            (props: any) => (
                <BottomSheetBackdrop
                    {...props}
                    disappearsOnIndex={-1}
                    appearsOnIndex={0}
                    opacity={0.5}
                />
            ),
            []
        );

        const renderFooter = useCallback(
            (props: any) => (
                <BottomSheetFooter {...props} bottomInset={0}>
                    <View style={[styles.footer, {
                        paddingBottom: isAndroid ? (keyboardHeight > 0 ? 20 : 16) : 28,
                        marginBottom: isAndroid ? keyboardHeight : 0,
                        backgroundColor: colors.background,
                        borderTopWidth: 1,
                        borderTopColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
                    }]}>
                        <TouchableOpacity
                            style={[
                                styles.submitButton,
                                {
                                    backgroundColor: selectedReason && !isSubmitting ? colors.primary : colors.icon,
                                    shadowOpacity: selectedReason ? 0.3 : 0.05
                                }
                            ]}
                            onPress={handleSubmit}
                            disabled={!selectedReason || isSubmitting}
                            activeOpacity={0.8}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <ThemedText style={styles.submitButtonText}>Submit Report</ThemedText>
                            )}
                        </TouchableOpacity>
                    </View>
                </BottomSheetFooter>
            ),
            [selectedReason, isSubmitting, colors, isDark, handleSubmit]
        );

        return (
            <BottomSheetModal
                ref={ref}
                index={0}
                snapPoints={snapPoints}
                backdropComponent={renderBackdrop}
                footerComponent={renderFooter}
                backgroundStyle={{ backgroundColor: colors.background }}
                handleIndicatorStyle={{ backgroundColor: colors.icon }}
                enablePanDownToClose={!isSubmitting}
                keyboardBehavior="interactive"
                keyboardBlurBehavior="restore"
                android_keyboardInputMode="adjustResize"
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={styles.container}>
                        {/* Header Section */}
                        <View style={styles.header}>
                            <View style={styles.headerLeft}>
                                <Ionicons name="warning-outline" size={24} color="#EF4444" style={styles.headerIcon} />
                                <View>
                                    <ThemedText style={styles.title}>Report</ThemedText>
                                    <ThemedText style={styles.subtitle}>Help us understand the issue</ThemedText>
                                </View>
                            </View>
                            <TouchableOpacity onPress={handleCloseModalPress} disabled={isSubmitting} style={styles.closeButton}>
                                <Ionicons name="close" size={24} color={colors.icon} />
                            </TouchableOpacity>
                        </View>
                        <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]} />

                        <BottomSheetScrollView
                            style={{ flex: 1 }}
                            contentContainerStyle={[
                                styles.scrollContent,
                                isAndroid && { paddingBottom: 80 + keyboardHeight }
                            ]}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                        >
                            {/* Reason Selection */}
                            <ThemedText style={styles.sectionTitle}>Select a Reason</ThemedText>
                            <View style={styles.reasonsContainer}>
                                {REPORT_REASONS.map((reason) => {
                                    const isSelected = selectedReason === reason;
                                    return (
                                        <TouchableOpacity
                                            key={reason}
                                            activeOpacity={0.7}
                                            onPress={() => setSelectedReason(reason)}
                                            style={[
                                                styles.reasonCard,
                                                {
                                                    borderColor: isSelected ? colors.primary : (isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0'),
                                                    backgroundColor: isSelected ? `${colors.primary}10` : (isDark ? 'rgba(255,255,255,0.03)' : '#FFFFFF')
                                                }
                                            ]}
                                        >
                                            <ThemedText style={[
                                                styles.reasonText,
                                                { color: isSelected ? colors.primary : colors.text, fontWeight: isSelected ? '600' : '400' }
                                            ]}>
                                                {reason}
                                            </ThemedText>
                                            {isSelected && (
                                                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            {/* Additional Details */}
                            <View style={styles.detailsContainer}>
                                <View style={styles.detailsHeader}>
                                    <ThemedText style={styles.sectionTitle}>Additional Details (Optional)</ThemedText>
                                    <ThemedText style={styles.charCount}>{description.length}/300</ThemedText>
                                </View>
                                <TextInput
                                    style={[
                                        styles.input,
                                        {
                                            color: colors.text,
                                            backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
                                            borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0'
                                        }
                                    ]}
                                    placeholder="Please provide any extra context..."
                                    placeholderTextColor={colors.icon}
                                    multiline
                                    maxLength={300}
                                    value={description}
                                    onChangeText={setDescription}
                                    textAlignVertical="top"
                                />
                            </View>

                            <ThemedText style={styles.anonymousText}>
                                <Ionicons name="shield-checkmark-outline" size={14} /> Your report is anonymous.
                            </ThemedText>
                        </BottomSheetScrollView>
                    </View>
                </TouchableWithoutFeedback>
            </BottomSheetModal>
        );
    }
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 16,
        paddingTop: 8,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerIcon: {
        marginRight: 12,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
    },
    subtitle: {
        fontSize: 13,
        opacity: 0.7,
        marginTop: 2,
    },
    closeButton: {
        padding: 4,
    },
    divider: {
        height: 1,
        width: '100%',
    },
    scrollContent: {
        padding: 20,
        paddingBottom: isAndroid ? 100 : 60,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 12,
        opacity: 0.8,
    },
    reasonsContainer: {
        gap: 10,
        marginBottom: 24,
    },
    reasonCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
    },
    reasonText: {
        fontSize: 15,
    },
    detailsContainer: {
        marginTop: 12,
        marginBottom: 32,
    },
    detailsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    charCount: {
        fontSize: 12,
        opacity: 0.6,
    },
    input: {
        height: 120,
        borderWidth: 1,
        borderRadius: 16,
        padding: 16,
        fontSize: 15,
    },
    anonymousText: {
        fontSize: 13,
        textAlign: 'center',
        opacity: 0.6,
        marginTop: 10,
        marginBottom: 20,
    },
    footer: {
        paddingHorizontal: 20,
        paddingTop: 8,
    },
    submitButton: {
        height: 46,
        borderRadius: 23,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
    },
});
