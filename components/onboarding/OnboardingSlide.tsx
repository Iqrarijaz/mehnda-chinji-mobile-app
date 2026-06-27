import React from 'react';
import { View, StyleSheet, Dimensions, Animated } from 'react-native';
import LottieView from 'lottie-react-native';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/colors';

const { width } = Dimensions.get('window');

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

    // Slide animations mapping scroll position
    const translateY = scrollX.interpolate({
        inputRange: [(index - 1) * width, index * width, (index + 1) * width],
        outputRange: [50, 0, -50],
        extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
        inputRange: [(index - 0.6) * width, index * width, (index + 0.6) * width],
        outputRange: [0, 1, 0],
        extrapolate: 'clamp',
    });

    const scale = scrollX.interpolate({
        inputRange: [(index - 1) * width, index * width, (index + 1) * width],
        outputRange: [0.85, 1, 0.85],
        extrapolate: 'clamp',
    });

    return (
        <View style={styles.container}>
            {/* Lottie Animation Display */}
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

            {/* Information Card Container (Flat with no shadow/elevation/border) */}
            <Animated.View
                style={[
                    styles.cardContainer,
                    {
                        opacity,
                        transform: [{ translateY }],
                        backgroundColor: colors.card,
                    }
                ]}
            >
                <ThemedText
                    type="urdu"
                    style={[
                        styles.title,
                        {
                            color: colors.primary,
                            textAlign: 'center'
                        }
                    ]}
                >
                    {item.title}
                </ThemedText>

                <View style={[styles.divider, { backgroundColor: colors.border }]} />

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
        paddingHorizontal: 28,
    },
    animationContainer: {
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    lottie: {
        width: width * 0.76,
        height: width * 0.76,
    },
    cardContainer: {
        width: '100%',
        borderRadius: 20,
        paddingVertical: 20,
        paddingHorizontal: 18,
        alignItems: 'center',
    },
    title: {
        fontSize: 20,
        lineHeight: 34,
        fontWeight: '800',
        paddingTop: 4,
        letterSpacing: 0.2,
    },
    divider: {
        width: 32,
        height: 2,
        borderRadius: 1,
        marginVertical: 12,
    },
    description: {
        fontSize: 12,
        textAlign: 'center',
        lineHeight: 18,
        fontWeight: '600',
        paddingHorizontal: 8,
    },
});
