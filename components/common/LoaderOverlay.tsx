import React, { memo } from 'react';
import { Modal, StyleSheet, View, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/colors';

interface LoaderOverlayProps {
    visible: boolean;
    text?: string;
}

/**
 * Premium LoaderOverlay Component
 * A flat, modern, non-intrusive full-screen loading modal with a centered card
 * featuring a horizontal wave dot loader and clean loading message.
 */
export const LoaderOverlay: React.FC<LoaderOverlayProps> = memo(({ visible, text }) => {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const isDark = theme === 'dark';

    if (!visible) return null;

    return (
        <Modal
            transparent
            animationType="fade"
            visible={visible}
            hardwareAccelerated
            statusBarTranslucent
            onRequestClose={() => { }}
        >
            <View style={[
                styles.backdrop,
                { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.65)' : 'rgba(0, 0, 0, 0.4)' }
            ]}>
                <View style={[
                    styles.card,
                    {
                        backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.96)',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'
                    }
                ]}>
                    <ActivityIndicator size="large" color={colors.primary} />

                    {/* Loading Message */}
                    {text ? (
                        <ThemedText
                            style={[
                                styles.messageText,
                                { color: isDark ? '#F1F5F9' : '#0F172A' }
                            ]}
                            numberOfLines={2}
                        >
                            {text}
                        </ThemedText>
                    ) : null}
                </View>
            </View>
        </Modal>
    );
});

LoaderOverlay.displayName = 'LoaderOverlay';

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
        zIndex: 9999
    },
    card: {
        width: '82%',
        maxWidth: 290,
        minHeight: 140,
        borderRadius: 26,
        paddingVertical: 26,
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        // Strictly flat design - no shadows or elevation
        elevation: 0,
        shadowColor: 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0
    },
    waveContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 36,
        gap: 12
    },
    dot: {
        width: 12,
        height: 12,
        borderRadius: 6
    },
    messageText: {
        marginTop: 18,
        fontSize: 13,
        fontWeight: '600',
        textAlign: 'center',
        letterSpacing: 0.3,
        lineHeight: 18
    }
});