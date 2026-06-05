import React from 'react';
import { View, Switch, StyleSheet, Platform } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { ThemedText } from '@/components/themedText';

interface NotificationToggleRowProps {
    label: string;
    description: string;
    icon: keyof typeof Ionicons.glyphMap;
    color?: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
    index: number;
    isLast?: boolean;
}

const NotificationToggleRow: React.FC<NotificationToggleRowProps> = ({
    label,
    description,
    icon,
    color = '#009688',
    value,
    onValueChange,
    index,
    isLast = false,
}) => {
    const { theme } = useTheme();
    const colors = Colors[theme];

    return (
        <Animated.View
            entering={FadeInRight.delay(index * 100).duration(400)}
            style={[styles.container, { borderBottomColor: colors.border }, isLast && { borderBottomWidth: 0 }]}
        >
            <View style={[styles.iconContainer, { backgroundColor: `${color}18` }]}>
                <Ionicons name={icon} size={22} color={color} />
            </View>
            <View style={styles.content}>
                <ThemedText style={[styles.label, { color: colors.text }]}>{label}</ThemedText>
                <ThemedText style={[styles.descriptionText, { color: colors.textSecondary }]} numberOfLines={2}>
                    {description}
                </ThemedText>
            </View>
            <Switch
                value={value}
                onValueChange={onValueChange}
                trackColor={{ false: colors.border, true: `${color}50` }}
                thumbColor={value ? color : (theme === 'dark' ? colors.card : '#f5f5f5')}
                ios_backgroundColor={colors.border}
            />
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    content: {
        flex: 1,
        marginRight: 10,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 2,
    },
    descriptionText: {
        fontSize: 11,
        lineHeight: 16,
    },
});

export default NotificationToggleRow;
