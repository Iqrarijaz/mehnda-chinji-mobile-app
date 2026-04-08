import { BlurView } from 'expo-blur';
import React, { useEffect } from 'react';
import { Modal, StyleSheet, TouchableOpacity, View, ViewStyle, Platform } from 'react-native';
import Animated, {
    FadeInUp,
    useAnimatedProps,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);
const isAndroid = Platform.OS === 'android';

export interface PremiumModalProps {
    visible: boolean;
    onClose: () => void;
    children: React.ReactNode;
    type?: 'bottom-sheet' | 'centered' | 'fullscreen';
    sheetStyle?: ViewStyle;
    overlayStyle?: ViewStyle;
}

/**
 * PremiumModal
 * A reusable modal component that enforces the app's premium design system:
 * - Animated Blur (Expo Blur) background
 * - FadeInUp animations for both backdrop and sheet
 * - Consistent rounding and elevated sheet design
 */
export const PremiumModal: React.FC<PremiumModalProps> = ({
    visible,
    onClose,
    children,
    type = 'centered',
    sheetStyle,
    overlayStyle,
}) => {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const blurIntensity = useSharedValue(0);

    useEffect(() => {
        if (visible) {
            blurIntensity.value = withTiming(40, { duration: 500 });
        } else {
            blurIntensity.value = withTiming(0, { duration: 300 });
        }
    }, [visible]);

    const animatedProps = useAnimatedProps(() => ({
        intensity: blurIntensity.value,
    } as any));

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={onClose}
        >
            <View style={[
                styles.overlay,
                type === 'centered' && styles.overlayCentered,
                type === 'fullscreen' && styles.overlayFullscreen,
                overlayStyle
            ]}>
                {/* 1. Animated Blur Backdrop */}
                <AnimatedBlurView
                    tint={theme === 'dark' ? 'dark' : 'light'}
                    style={StyleSheet.absoluteFill}
                    animatedProps={animatedProps}
                />

                {/* 2. Extra Dimming Layer (Animated) */}
                <Animated.View
                    entering={FadeInUp.duration(400)}
                    style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.3)' }]}
                />

                {/* 3. Tap-to-close Backdrop Area (Disabled for fullscreen) */}
                {type !== 'fullscreen' && (
                    <TouchableOpacity
                        style={StyleSheet.absoluteFill}
                        onPress={onClose}
                        activeOpacity={1}
                    />
                )}

                {/* 4. Animated Sheet */}
                <Animated.View
                    entering={FadeInUp.duration(500)}
                    style={[
                        styles.sheet,
                        { backgroundColor: colors.card },
                        type === 'centered' && styles.sheetCentered,
                        type === 'fullscreen' && styles.sheetFullscreen,
                        sheetStyle
                    ]}
                >
                    {children}
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'transparent',
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: isAndroid ? 20 : 30,
    },
    overlayCentered: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 0,
    },
    overlayFullscreen: {
        justifyContent: 'center',
        alignItems: 'stretch',
        paddingBottom: 0,
    },
    sheet: {
        width: '95%',
        borderRadius: Layout.borderRadius,
        paddingTop: 12,
        paddingHorizontal: 20,
        paddingBottom: isAndroid ? 24 : 36,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
    },
    sheetCentered: {
        maxWidth: 500,
        paddingTop: 14,
        paddingBottom: 14,
        maxHeight: '85%',
    },
    sheetFullscreen: {
        width: '100%',
        flex: 1,
        borderRadius: 0,
        paddingTop: 0,
        paddingHorizontal: 0,
        paddingBottom: 0,
    }
});
