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

interface FAQItemProps {
    question: string;
    answer: string;
    isOpen: boolean;
    onToggle: () => void;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer, isOpen, onToggle }) => {
    const animation = useSharedValue(0);

    React.useEffect(() => {
        animation.value = withTiming(isOpen ? 1 : 0, { duration: 300 });
    }, [isOpen]);

    const chevronStyle = useAnimatedStyle(() => {
        const rotate = interpolate(animation.value, [0, 1], [0, 180]);
        return {
            transform: [{ rotate: `${rotate}deg` }],
        };
    });

    const bodyStyle = useAnimatedStyle(() => {
        const height = interpolate(animation.value, [0, 1], [0, 1]); // Simple toggle logic for Reanimated
        return {
            opacity: animation.value,
            display: isOpen ? 'flex' : 'none', // Fallback for height if not using measured height
        };
    });

    return (
        <View style={styles.container}>
            <TouchableOpacity
                activeOpacity={0.7}
                onPress={onToggle}
                style={[styles.header, isOpen && styles.headerOpen]}
            >
                <Text style={[styles.question, isOpen && styles.activeText]}>{question}</Text>
                <Animated.View style={chevronStyle}>
                    <Ionicons
                        name="chevron-down"
                        size={20}
                        color={isOpen ? "#009688" : "#64748B"}
                    />
                </Animated.View>
            </TouchableOpacity>

            {isOpen && (
                <Animated.View
                    entering={FadeIn.duration(300)}
                    exiting={FadeOut.duration(200)}
                    style={styles.answerContainer}
                >
                    <Text style={styles.answer}>{answer}</Text>
                </Animated.View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFFFF',
        borderRadius: Layout.borderRadius,
        marginBottom: 12,
        overflow: 'hidden',
        // Shadow for premium feel
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    headerOpen: {
        backgroundColor: '#f0fdfa', // Very light teal
    },
    question: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1E293B',
        flex: 1,
        marginRight: 12,
    },
    activeText: {
        color: '#009688',
    },
    answerContainer: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        paddingTop: 4,
    },
    answer: {
        fontSize: 14,
        lineHeight: 22,
        color: '#64748B',
    },
});

export default FAQItem;
