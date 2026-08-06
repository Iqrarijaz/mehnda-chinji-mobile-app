import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from '../ThemedText';
import SwipeableNotificationItem from './SwipeableNotificationItem';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';

interface Props {
    title: string;
    items: any[];
    onPress: (item: any) => void;
    onDelete: (id: string) => void;
    deletingId?: string | null;
    startDelay?: number;
}

const NotificationSection = React.memo(({ title, items, onPress, onDelete, deletingId, startDelay = 0 }: Props) => {
    const { theme } = useTheme();
    const colors = Colors[theme];
    return (
        <View style={styles.section}>
            <ThemedText style={[styles.label, { color: colors.placeholder }]}>{title}</ThemedText>
            {items.map((item, i) => (
                <SwipeableNotificationItem
                    key={item._id}
                    item={item}
                    onPress={onPress}
                    onDelete={onDelete}
                    isDeleting={deletingId === item._id}
                    delay={startDelay + i * 50}
                />
            ))}
        </View>
    );
});

export default NotificationSection;

const styles = StyleSheet.create({
    section: { marginBottom: 8 },
    label: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 10,
        marginTop: 6,
        paddingHorizontal: 4 } });
