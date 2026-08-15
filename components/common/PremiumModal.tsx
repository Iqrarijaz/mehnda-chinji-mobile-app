import { BlurView } from 'expo-blur';
import React, { useEffect } from 'react';
import { Modal, StyleSheet, TouchableOpacity, View, ViewStyle, Platform } from 'react-native';
import Animated, {
    FadeInUp,
    useAnimatedProps,
    useSharedValue,
    withTiming } from 'react-native-reanimated';

import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';
import Toast from 'react-native-toast-message';
import { ToastConfig } from '../ToastConfig';

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);
const isAndroid = Platform.OS === 'android';

export interface PremiumModalProps {
    visible: boolean;
    onClose: () => void;
    children: React.ReactNode;
    type?: 'bottom-sheet' | 'centered' | 'fullscreen';
    sheetStyle?: ViewStyle;
    overlayStyle?: ViewStyle;
    closable?: boolean;
}

/**
 * PremiumModal
 * A reusable modal component that enforces the app's premium design system:
 * - Animated Blur (Expo Blur) background
 * - FadeInUp animations for both backdrop and sheet
 * - Consistent rounding and elevated sheet design
 */
export const PremiumModal: React.FC<PremiumModalProps> = React.memo(({
    visible,
    onClose,
    children,
    type = 'centered',
    sheetStyle,
    overlayStyle,
    closable = true }) => {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const blurIntensity = useSharedValue(0);

    useEffect(() => {
        if (visible) {
            blurIntensity.value = withTiming(40, { duration: 500 });
        } else {
            blurIntensity.value = 0;
        }
    }, [visible, blurIntensity]);

    const animatedBlurProps = useAnimatedProps(() => ({
        intensity: blurIntensity.value,
    }));

    if (!visible) return null;

    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={closable ? onClose : undefined}
        >
            <View style={[
                styles.overlay,
                type === 'centered' && styles.overlayCentered,
                type === 'fullscreen' && styles.overlayFullscreen,
                overlayStyle
            ]}>
                {!isAndroid && (
                    <AnimatedBlurView
                        tint={theme === 'dark' ? 'dark' : 'light'}
                        animatedProps={animatedBlurProps}
                        style={StyleSheet.absoluteFill}
                    />
                )}
                {isAndroid && (
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0, 0, 0, 0.75)' }]} />
                )}

                {/* 3. Tap-to-close Backdrop Area (Disabled if not closable or fullscreen) */}
                {type !== 'fullscreen' && closable && (
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
            <Toast config={ToastConfig} topOffset={Platform.OS === 'ios' ? 50 : 20} />
        </Modal>
    );
});

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'transparent',
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: isAndroid ? 20 : 30 },
    overlayCentered: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 0 },
    overlayFullscreen: {
        justifyContent: 'center',
        alignItems: 'stretch',
        paddingBottom: 0 },
    sheet: {
        width: '95%',
        borderRadius: Layout.borderRadius,
        paddingTop: 10,
        paddingHorizontal: 16,
        paddingBottom: isAndroid ? 24 : 36 },
    sheetCentered: {
        maxWidth: 500,
        paddingTop: 11,
        paddingBottom: 11,
        maxHeight: '85%' },
    sheetFullscreen: {
        width: '100%',
        flex: 1,
        borderRadius: Layout.borderRadius,
        paddingTop: 0,
        paddingHorizontal: 0,
        paddingBottom: 0 }
});
