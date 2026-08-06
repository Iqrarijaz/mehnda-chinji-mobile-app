import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
    interpolate,
    FadeIn,
    FadeOut
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Layout } from '@/constants/layout';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';

interface FAQItemProps {
    question: string;
    answer: string;
    isOpen: boolean;
    onToggle: () => void;
}

const FAQItem: React.FC<FAQItemProps> = React.memo(({ question, answer, isOpen, onToggle }) => {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const animation = useSharedValue(0);

    React.useEffect(() => {
        animation.value = withTiming(isOpen ? 1 : 0, { duration: 300 });
    }, [isOpen]);

    const chevronStyle = useAnimatedStyle(() => {
        const rotate = interpolate(animation.value, [0, 1], [0, 180]);
        return {
            transform: [{ rotate: `${rotate}deg` }] };
    });

    const bodyStyle = useAnimatedStyle(() => {
        const height = interpolate(animation.value, [0, 1], [0, 1]); // Simple toggle logic for Reanimated
        return {
            opacity: animation.value,
            display: isOpen ? 'flex' : 'none', // Fallback for height if not using measured height
        };
    });

    return (
        <View style={[styles.container, { backgroundColor: colors.card }]}>
            <TouchableOpacity
                activeOpacity={0.7}
                onPress={onToggle}
                style={[styles.header, isOpen && { backgroundColor: `${colors.primary}14` }]}
            >
                <Text allowFontScaling={false} style={[styles.question, { color: isOpen ? colors.primary : colors.text }]}>{question}</Text>
                <Animated.View style={chevronStyle}>
                    <Ionicons
                        name="chevron-down"
                        size={20}
                        color={isOpen ? colors.primary : colors.textSecondary}
                    />
                </Animated.View>
            </TouchableOpacity>

            {isOpen && (
                <Animated.View
                    entering={FadeIn.duration(300)}
                    exiting={FadeOut.duration(200)}
                    style={styles.answerContainer}
                >
                    <Text allowFontScaling={false} style={[styles.answer, { color: colors.textSecondary }]}>{answer}</Text>
                </Animated.View>
            )}
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        borderRadius: Layout.borderRadius,
        marginBottom: 12,
        overflow: 'hidden' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 13 },
    question: {
        fontSize: 12.5,
        fontWeight: '600',
        flex: 1,
        marginRight: 12 },
    answerContainer: {
        paddingHorizontal: 13,
        paddingBottom: 13,
        paddingTop: 4 },
    answer: {
        fontSize: 12.5,
        lineHeight: 22 } });

export default FAQItem;
