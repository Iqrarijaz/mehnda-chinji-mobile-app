import React from 'react';
import { StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeOut, ZoomIn, ZoomOut } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { ThemedText } from '@/components/themedText';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';

export type GuideVariant = 'clean' | 'flexible' | 'minimal' | 'structured';

interface GuidePromptProps {
    visible: boolean;
    onClose: () => void;
    variant: GuideVariant;
    action?: string;
    object?: string;
    benefit?: string;
    primaryAction?: string;
    secondaryAction?: string;
    title?: string;
    message?: string;
    cta?: string;
    style?: ViewStyle;
}

export const GuidePrompt: React.FC<GuidePromptProps> = ({
    visible,
    onClose,
    variant,
    action,
    object,
    benefit,
    primaryAction,
    secondaryAction,
    title,
    message,
    cta = "Got it",
    style
}) => {
    const { theme } = useTheme();
    const colors = Colors[theme];

    if (!visible) return null;

    const renderContent = () => {
        switch (variant) {
            case 'clean':
                return (
                    <ThemedText style={styles.message}>
                        Tap here to <ThemedText style={styles.highlight}>{action}</ThemedText> {object}.{"\n"}
                        This helps you {benefit}.
                    </ThemedText>
                );
            case 'flexible':
                return (
                    <ThemedText style={styles.message}>
                        Use this to <ThemedText style={styles.highlight}>{primaryAction}</ThemedText>.{"\n"}
                        You can also {secondaryAction}.
                    </ThemedText>
                );
            case 'minimal':
                return (
                    <ThemedText style={styles.message}>
                        <ThemedText style={styles.highlight}>{action}</ThemedText> {object} here.
                    </ThemedText>
                );
            case 'structured':
                return (
                    <View>
                        {title && <ThemedText style={styles.title}>{title}</ThemedText>}
                        <ThemedText style={styles.message}>{message}</ThemedText>
                    </View>
                );
            default:
                return null;
        }
    };

    return (
        <Animated.View
            entering={FadeIn.duration(400)}
            exiting={FadeOut.duration(300)}
            style={[styles.overlay, style]}
        >
            <Animated.View
                entering={ZoomIn.delay(200).springify()}
                exiting={ZoomOut.duration(200)}
            >
                <BlurView
                    intensity={theme === 'dark' ? 40 : 60}
                    tint={theme === 'dark' ? 'dark' : 'light'}
                    style={[
                        styles.container,
                        { borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }
                    ]}
                >
                    <View style={styles.contentRow}>
                        <View style={[styles.iconContainer, { backgroundColor: colors.primary }]}>
                            <Ionicons name="bulb" size={20} color="#FFF" />
                        </View>
                        <View style={styles.textContainer}>
                            {renderContent()}
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={20} color={theme === 'dark' ? '#94A3B8' : '#64748B'} />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity onPress={onClose} style={styles.ctaButton}>
                        <ThemedText style={[styles.ctaText, { color: colors.primary }]}>{cta}</ThemedText>
                    </TouchableOpacity>
                </BlurView>
            </Animated.View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
        zIndex: 1000,
        padding: 20,
    },
    container: {
        borderRadius: 24,
        padding: 20,
        width: '100%',
        maxWidth: 400,
        borderWidth: 1,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    contentRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 16,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 2,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 4,
    },
    message: {
        fontSize: 15,
        lineHeight: 22,
        color: '#64748B',
    },
    highlight: {
        fontWeight: '700',
        color: '#1E293B',
    },
    closeButton: {
        padding: 4,
    },
    ctaButton: {
        marginTop: 16,
        alignSelf: 'flex-end',
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    ctaText: {
        fontSize: 15,
        fontWeight: '700',
    }
});
