import React, { useCallback, useEffect } from 'react';
import {
    Modal,
    StyleSheet,
    TouchableOpacity,
    View,
    Platform,
    Linking,
} from 'react-native';
import Animated, {
    FadeIn,
    FadeInDown,
    FadeInUp,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withRepeat,
    withSequence,
    withTiming,
    useAnimatedProps,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themedText';

const PRIMARY = '#009688';
const isAndroid = Platform.OS === 'android';

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

interface NoInternetModalProps {
    visible: boolean;
    onRetry: () => void;
}

const NoInternetModal = React.memo(({ visible, onRetry }: NoInternetModalProps) => {
    const iconScale = useSharedValue(1);
    const retryScale = useSharedValue(1);
    const settingsScale = useSharedValue(1);
    const blurIntensity = useSharedValue(0);

    useEffect(() => {
        if (visible) {
            blurIntensity.value = withTiming(20, { duration: 500 });
            iconScale.value = withRepeat(
                withSequence(
                    withSpring(1.1, { damping: 10, stiffness: 100 }),
                    withSpring(1, { damping: 10, stiffness: 100 })
                ),
                -1,
                true
            );
        } else {
            blurIntensity.value = withTiming(0, { duration: 300 });
            iconScale.value = 1;
        }
    }, [visible]);

    const animatedProps = useAnimatedProps(() => ({
        intensity: blurIntensity.value,
    } as any));

    const iconAnimStyle = useAnimatedStyle(() => ({
        transform: [{ scale: iconScale.value }],
    }));

    const retryAnimStyle = useAnimatedStyle(() => ({
        transform: [{ scale: retryScale.value }],
    }));

    const settingsAnimStyle = useAnimatedStyle(() => ({
        transform: [{ scale: settingsScale.value }],
    }));

    const openSettings = useCallback(() => {
        if (isAndroid) {
            Linking.sendIntent('android.settings.WIFI_SETTINGS');
        } else {
            Linking.openURL('App-Prefs:root=WIFI');
        }
    }, []);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            statusBarTranslucent
        >
            <View style={styles.overlay}>
                <AnimatedBlurView
                    tint="dark"
                    style={StyleSheet.absoluteFill}
                    animatedProps={animatedProps}
                />
                <Animated.View
                    entering={FadeInUp.duration(400)}
                    style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.3)' }]}
                />

                <Animated.View
                    entering={FadeInUp.springify().damping(20).stiffness(150)}
                    style={styles.sheet}
                >
                    <View style={styles.handle} />

                    <View style={styles.content}>
                        <Animated.View style={[styles.iconContainer, iconAnimStyle]}>
                            <View style={[styles.iconCircle, { backgroundColor: `${PRIMARY}15` }]}>
                                <Ionicons name="wifi-outline" size={48} color={PRIMARY} />
                                <View style={styles.offIndicator}>
                                    <Ionicons name="close" size={16} color="#FFFFFF" />
                                </View>
                            </View>
                        </Animated.View>

                        <ThemedText style={styles.title}>No Internet Connection</ThemedText>
                        <ThemedText style={styles.subtitle}>
                            Please check your connection and try again to continue using the app.
                        </ThemedText>

                        <View style={styles.actions}>
                            <Animated.View style={[styles.buttonWrapper, settingsAnimStyle]}>
                                <TouchableOpacity
                                    activeOpacity={1}
                                    onPress={openSettings}
                                    onPressIn={() => (settingsScale.value = withTiming(0.96, { duration: 100 }))}
                                    onPressOut={() => (settingsScale.value = withSpring(1))}
                                    style={[styles.primaryButton, { backgroundColor: PRIMARY }]}
                                >
                                    <Ionicons name="settings-outline" size={20} color="#FFFFFF" />
                                    <ThemedText style={styles.primaryButtonText}>Network Settings</ThemedText>
                                </TouchableOpacity>
                            </Animated.View>

                            <Animated.View style={[styles.buttonWrapper, retryAnimStyle]}>
                                <TouchableOpacity
                                    activeOpacity={1}
                                    onPress={onRetry}
                                    onPressIn={() => (retryScale.value = withTiming(0.96, { duration: 100 }))}
                                    onPressOut={() => (retryScale.value = withSpring(1))}
                                    style={styles.secondaryButton}
                                >
                                    <ThemedText style={styles.secondaryButtonText}>Retry</ThemedText>
                                </TouchableOpacity>
                            </Animated.View>
                        </View>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
});



const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 12,
        paddingHorizontal: 24,
        paddingBottom: isAndroid ? 32 : 48,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#E5E7EB',
        alignSelf: 'center',
        marginBottom: 32,
    },
    content: {
        alignItems: 'center',
    },
    iconContainer: {
        marginBottom: 24,
    },
    iconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    offIndicator: {
        position: 'absolute',
        top: 20,
        right: 20,
        backgroundColor: '#EF4444',
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: '#111827',
        textAlign: 'center',
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 15,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: 20,
        marginBottom: 32,
    },
    actions: {
        width: '100%',
        gap: 12,
    },
    buttonWrapper: {
        width: '100%',
    },
    primaryButton: {
        height: 56,
        borderRadius: 28,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        shadowColor: PRIMARY,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    secondaryButton: {
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    secondaryButtonText: {
        color: '#6B7280',
        fontSize: 15,
        fontWeight: '600',
    },
});

export default NoInternetModal;
