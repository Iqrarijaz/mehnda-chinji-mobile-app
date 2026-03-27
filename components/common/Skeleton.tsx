import React, { useEffect } from 'react';
import { View, StyleSheet, Animated, DimensionValue, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Reanimated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    interpolate
} from 'react-native-reanimated';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/colors';

interface SkeletonProps {
    width?: DimensionValue;
    height?: DimensionValue;
    borderRadius?: number;
    style?: any;
}

const AnimatedLinearGradient = Reanimated.createAnimatedComponent(LinearGradient);

const Skeleton: React.FC<SkeletonProps> = ({
    width = '100%',
    height = 20,
    borderRadius = 8,
    style
}) => {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const isDark = theme === 'dark';

    const translateX = useSharedValue(-1);

    useEffect(() => {
        translateX.value = withRepeat(
            withTiming(1, { duration: 1500 }),
            -1,
            false
        );
    }, []);

    const windowWidth = Dimensions.get('window').width;

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                {
                    translateX: interpolate(translateX.value, [-1, 1], [-windowWidth, windowWidth])
                }
            ]
        };
    });

    const baseColor = isDark ? '#1E293B' : '#E2E8F0';
    const highlightColor = isDark ? '#334155' : '#F1F5F9';

    return (
        <View
            style={[
                styles.container,
                { width, height, borderRadius, backgroundColor: baseColor },
                style
            ]}
        >
            <AnimatedLinearGradient
                colors={[baseColor, highlightColor, baseColor]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={[StyleSheet.absoluteFill, animatedStyle]}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        overflow: 'hidden',
        position: 'relative',
    },
});

export default React.memo(Skeleton);
