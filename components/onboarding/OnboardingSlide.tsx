import React from 'react';
import { View, StyleSheet, Dimensions, Animated, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { ThemedText } from '@/components/themedText';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/colors';

const { width } = Dimensions.get('window');

interface OnboardingSlideProps {
    item: {
        id: string;
        title: string;
        description: string;
        animation: any;
        isPrivacy?: boolean;
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
                {item.id === '3' && ( // Placeholder for any other button if needed, but currently removing location
                    null
                )}

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
        fontSize: 22,
        fontFamily: 'NotoNastaliqUrdu-Regular',
        textAlign: 'center',
        paddingTop: 12,
        paddingBottom: 0,
        lineHeight: 45,
    },
    description: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: 10,
        fontWeight: '500',
        marginTop: -5,
    },
    permissionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 14,
        marginTop: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    permissionButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
});
