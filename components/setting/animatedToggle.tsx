import React, { useEffect } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from 'react-native-reanimated';

const TOGGLE_WIDTH = 52;
const TOGGLE_HEIGHT = 30;
const THUMB_SIZE = 24;
const THUMB_TRAVEL = TOGGLE_WIDTH - THUMB_SIZE - 6;

interface AnimatedToggleProps {
    value: boolean;
    onValueChange: (v: boolean) => void;
    primaryColor?: string;
}

export const AnimatedToggle: React.FC<AnimatedToggleProps> = ({
    value,
    onValueChange,
    primaryColor = '#003D36',
}) => {
    const offset = useSharedValue(value ? THUMB_TRAVEL : 0);
    const bgProgress = useSharedValue(value ? 1 : 0);

    useEffect(() => {
        offset.value = withSpring(value ? THUMB_TRAVEL : 0, { damping: 15, stiffness: 180, mass: 0.8 });
        bgProgress.value = withTiming(value ? 1 : 0, { duration: 250 });
    }, [value]);

    const trackStyle = useAnimatedStyle(() => ({
        backgroundColor: bgProgress.value > 0.5 ? primaryColor : '#D1D5DB',
    }));

    const thumbStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: offset.value }],
    }));

    return (
        <TouchableOpacity activeOpacity={0.8} onPress={() => onValueChange(!value)}>
            <Animated.View style={[styles.toggleTrack, trackStyle]}>
                <Animated.View style={[styles.toggleThumb, thumbStyle]} />
            </Animated.View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    toggleTrack: {
        width: TOGGLE_WIDTH,
        height: TOGGLE_HEIGHT,
        borderRadius: TOGGLE_HEIGHT / 2,
        justifyContent: 'center',
        paddingHorizontal: 3,
    },
    toggleThumb: {
        width: THUMB_SIZE,
        height: THUMB_SIZE,
        borderRadius: THUMB_SIZE / 2,
        backgroundColor: '#FFFFFF',
    },
});
