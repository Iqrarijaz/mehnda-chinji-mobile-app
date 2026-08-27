import React from 'react';
import {
    Modal,
    View,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';

interface CricketNotificationModalProps {
    visible: boolean;
    onClose: () => void;
    isSubscribed: boolean;
    onToggle: () => void;
    isSaving?: boolean;
}

export const CricketNotificationModal = React.memo(function CricketNotificationModal({
    visible,
    onClose,
    isSubscribed,
    onToggle,
    isSaving = false
}: CricketNotificationModalProps) {
    const { theme } = useTheme();
    const colors = Colors[theme];

    if (!visible) return null;

    return (
        <Modal
            transparent
            visible={visible}
            onRequestClose={onClose}
            animationType="fade"
            statusBarTranslucent
        >
            <Animated.View
                entering={FadeIn.duration(200)}
                style={[styles.modalOverlay, { backgroundColor: colors.backdrop }]}
            >
                <Animated.View
                    entering={ZoomIn.duration(250)}
                    style={[
                        styles.modalContent,
                        { backgroundColor: colors.modalBackground }
                    ]}
                >
                    {/* Top Icon */}
                    <View style={styles.iconWrapper}>
                        <Ionicons
                            name={isSubscribed ? "notifications" : "notifications-off-outline"}
                            size={34}
                            color={isSubscribed ? colors.primary : colors.textSecondary}
                        />
                    </View>

                    {/* Title & Subtitle */}
                    <ThemedText style={[styles.modalTitle, { color: colors.text }]}>
                        Cricket Notifications
                    </ThemedText>

                    <ThemedText style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                        Stay updated with real-time push alerts whenever new tournaments are announced or match fixtures are scheduled.
                    </ThemedText>

                    {/* Feature Highlights */}
                    <View style={[styles.featuresBox, { backgroundColor: colors.surface }]}>
                        <View style={styles.featureItem}>
                            <Ionicons name="trophy-outline" size={16} color={colors.primary} />
                            <ThemedText style={[styles.featureText, { color: colors.text }]}>
                                New tournament announcements
                            </ThemedText>
                        </View>
                        <View style={styles.featureItem}>
                            <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                            <ThemedText style={[styles.featureText, { color: colors.text }]}>
                                Match fixtures & schedule alerts
                            </ThemedText>
                        </View>
                        <View style={styles.featureItem}>
                            <Ionicons name="flame-outline" size={16} color={colors.primary} />
                            <ThemedText style={[styles.featureText, { color: colors.text }]}>
                                Live game & score updates
                            </ThemedText>
                        </View>
                    </View>

                    {/* Status Pill */}
                    <View style={[
                        styles.statusPill,
                        { backgroundColor: isSubscribed ? `${colors.success}18` : `${colors.danger}18` }
                    ]}>
                        <Ionicons
                            name={isSubscribed ? "checkmark-circle" : "close-circle"}
                            size={14}
                            color={isSubscribed ? colors.success : colors.danger}
                        />
                        <ThemedText style={[
                            styles.statusPillText,
                            { color: isSubscribed ? colors.success : colors.danger }
                        ]}>
                            {isSubscribed ? 'Subscribed to Cricket Topic' : 'Notifications are Turned Off'}
                        </ThemedText>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionRow}>
                        <TouchableOpacity
                            style={[
                                styles.cancelBtn,
                                { backgroundColor: colors.inputBackground }
                            ]}
                            onPress={onClose}
                            activeOpacity={0.7}
                            disabled={isSaving}
                        >
                            <ThemedText style={[styles.cancelBtnText, { color: colors.text }]}>
                                Close
                            </ThemedText>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.primaryBtn,
                                { backgroundColor: isSubscribed ? colors.danger : colors.primary }
                            ]}
                            onPress={onToggle}
                            activeOpacity={0.8}
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <ThemedText style={styles.primaryBtnText}>
                                    {isSubscribed ? 'Turn Off' : 'Subscribe Now'}
                                </ThemedText>
                            )}
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
});

CricketNotificationModal.displayName = 'CricketNotificationModal';

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24
    },
    modalContent: {
        width: '100%',
        maxWidth: 340,
        borderRadius: Layout.borderRadius * 1.2,
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 18,
        alignItems: 'center',
        gap: 12,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8
    },
    iconWrapper: {
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 2
    },
    modalTitle: {
        fontSize: 17,
        fontWeight: '800',
        textAlign: 'center'
    },
    modalSubtitle: {
        fontSize: 11.5,
        lineHeight: 16,
        textAlign: 'center'
    },
    featuresBox: {
        width: '100%',
        borderRadius: Layout.borderRadius,
        padding: 10,
        gap: 8,
        marginVertical: 2
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    featureText: {
        fontSize: 11,
        fontWeight: '600',
        flex: 1
    },
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12
    },
    statusPillText: {
        fontSize: 11,
        fontWeight: '700'
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        marginTop: 4
    },
    cancelBtn: {
        flex: 1,
        height: Layout.buttonHeight,
        borderRadius: Layout.borderRadius,
        alignItems: 'center',
        justifyContent: 'center'
    },
    cancelBtnText: {
        fontSize: 12.5,
        fontWeight: '700'
    },
    primaryBtn: {
        flex: 1.4,
        height: Layout.buttonHeight,
        borderRadius: Layout.borderRadius,
        alignItems: 'center',
        justifyContent: 'center'
    },
    primaryBtnText: {
        color: '#FFFFFF',
        fontSize: 12.5,
        fontWeight: '800'
    }
});
