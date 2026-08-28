import React from 'react';
import { View, Switch, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { ThemedText } from '@/components/ThemedText';

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

const NotificationToggleRow: React.FC<NotificationToggleRowProps> = React.memo(({
    label,
    description,
    icon,
    color = '#009688',
    value,
    onValueChange,
    index,
    isLast = false }) => {
    const { theme } = useTheme();
    const colors = Colors[theme];

    return (
        <View style={styles.container}>
            <Ionicons name={icon} size={26} color={color} style={styles.icon} />
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
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 11 },
    icon: {
        marginRight: 14 },
    content: {
        flex: 1,
        marginRight: 10 },
    label: {
        fontSize: 11.5,
        fontWeight: '600',
        marginBottom: 2 },
    descriptionText: {
        fontSize: 10,
        lineHeight: 16 } });

export default NotificationToggleRow;
