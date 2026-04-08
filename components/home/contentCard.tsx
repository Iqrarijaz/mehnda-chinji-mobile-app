import { ThemedText } from '@/components/themedText';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { SlideInLeft } from 'react-native-reanimated';

interface ContentCardProps {
    icon: keyof typeof Ionicons.glyphMap;
    iconColor?: string;
    title: string;
    subtitle: string;
    onPress: () => void;
    delay?: number;
}

export const ContentCard: React.FC<ContentCardProps> = ({
    icon,
    iconColor,
    title,
    subtitle,
    onPress,
    delay = 0,
}) => {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const accent = iconColor || colors.primary;

    return (
        <Animated.View entering={SlideInLeft.delay(delay).duration(400)}>
            <TouchableOpacity
                onPress={onPress}
                activeOpacity={0.7}
                style={[styles.card, { backgroundColor: colors.card }]}
            >
                <View style={[styles.iconWrap, { backgroundColor: accent + '12' }]}>
                    <Ionicons name={icon} size={22} color={accent} />
                </View>
                <View style={styles.textWrap}>
                    <ThemedText style={styles.title}>{title}</ThemedText>
                    <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</ThemedText>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: Layout.borderRadius,
        padding: Platform.OS === 'android' ? 12 : 16,
        marginHorizontal: 20,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconWrap: {
        width: 42,
        height: 42,
        borderRadius: Layout.borderRadius,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    textWrap: {
        flex: 1,
    },
    title: {
        fontSize: 15,
        fontWeight: '600',
    },
    subtitle: {
        fontSize: 12,
        fontWeight: '400',
        marginTop: 2,
    },
});
