import React from 'react';
import { View, StyleSheet, Dimensions, Animated } from 'react-native';
import LottieView from 'lottie-react-native';
import { ThemedText } from '@/components/themedText';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/colors';

const { width, height } = Dimensions.get('window');

interface OnboardingSlideProps {
    item: {
        id: string;
        title: string;
        description: string;
        animation: any;
    };
    index: number;
    scrollX: Animated.Value;
}

export const OnboardingSlide: React.FC<OnboardingSlideProps> = ({ item, index, scrollX }) => {
    const { theme } = useTheme();
    const colors = Colors[theme];

    // Elite touch: Entrance animations for text
    const translateY = scrollX.interpolate({
        inputRange: [(index - 1) * width, index * width, (index + 1) * width],
        outputRange: [50, 0, -50],
        extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
        inputRange: [(index - 0.7) * width, index * width, (index + 0.7) * width],
        outputRange: [0, 1, 0],
        extrapolate: 'clamp',
    });

    const scale = scrollX.interpolate({
        inputRange: [(index - 1) * width, index * width, (index + 1) * width],
        outputRange: [0.8, 1, 0.8],
        extrapolate: 'clamp',
    });

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.animationContainer, { transform: [{ scale }] }]}>
                <LottieView
                    source={item.animation}
                    autoPlay
                    loop
                    style={styles.lottie}
                    hardwareAccelerationAndroid
                    renderMode="HARDWARE"
                />
            </Animated.View>
            <Animated.View style={[styles.textContainer, { opacity, transform: [{ translateY }] }]}>
                <ThemedText type="defaultSemiBold" style={[styles.title, { color: colors.text }]}>
                    {item.title}
                </ThemedText>
                <ThemedText style={[styles.description, { color: colors.textSecondary }]}>
                    {item.description}
                </ThemedText>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width,
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
    },
    animationContainer: {
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    lottie: {
        width: width * 0.9,
        height: width * 0.9,
    },
    textContainer: {
        alignItems: 'center',
        marginTop: 30,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 12,
        lineHeight: 38,
        letterSpacing: -0.5,
    },
    description: {
        fontSize: 17,
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: 10,
    },
});
