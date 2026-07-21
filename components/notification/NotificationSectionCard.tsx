import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Layout } from '@/constants/layout';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { ThemedText } from '@/components/ThemedText';

interface NotificationSectionCardProps {
    title: string;
    children: React.ReactNode;
}

const NotificationSectionCard: React.FC<NotificationSectionCardProps> = React.memo(({ title, children }) => {
    const { theme } = useTheme();
    const colors = Colors[theme];

    return (
        <View style={styles.container}>
            <ThemedText style={[styles.title, { color: colors.textSecondary }]}>{title}</ThemedText>
            <View style={[styles.card, { backgroundColor: colors.card }]}>
                {children}
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        marginBottom: 24 },
    title: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 10,
        marginLeft: 4 },
    card: {
        borderRadius: Layout.borderRadius,
        paddingHorizontal: 16,
        paddingVertical: 4 } });

export default NotificationSectionCard;
