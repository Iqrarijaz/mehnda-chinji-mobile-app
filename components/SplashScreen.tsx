import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
    FadeIn,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/colors';

const { width } = Dimensions.get('window');
const LOGO_SIZE = width * 0.7;

const logoImg = require('../public/logo_with_text.png');

export default function SplashScreen() {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const isDark = theme === 'dark';

    const scale = useSharedValue(0.8);
    const opacity = useSharedValue(0);

    useEffect(() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 100 });
        opacity.value = withTiming(1, { duration: 800 });
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <LinearGradient
                colors={isDark ? ['#0F172A', '#1E293B'] : ['#F8FAFC', '#EEF2F7']}
                style={StyleSheet.absoluteFill}
            />

            <Animated.View style={[styles.logoContainer, animatedStyle]}>
                <Image
                    source={logoImg}
                    style={styles.logo}
                    contentFit="contain"
                    transition={300}
                />
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoContainer: {
        alignItems: 'center',
        gap: 20,
    },
    logo: {
        width: LOGO_SIZE,
        height: LOGO_SIZE,
    },
});

