import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';

interface StatusBadgeProps {
    status: 'UPCOMING' | 'LIVE' | 'COMPLETED' | 'ABANDONED';
    size?: 'small' | 'medium';
}

export const StatusBadge = React.memo(function StatusBadge({ status, size = 'small' }: StatusBadgeProps) {
    const { theme } = useTheme();
    const colors = Colors[theme];

    const getStatusColor = () => {
        switch (status) {
            case 'LIVE': return '#EF4444';
            case 'UPCOMING': return colors.primary;
            case 'COMPLETED': return colors.textSecondary;
            case 'ABANDONED': return colors.danger;
            default: return colors.textSecondary;
        }
    };

    const statusColor = getStatusColor();
    const isMedium = size === 'medium';

    return (
        <View style={styles.badge}>
            {status === 'LIVE' && <View style={[styles.liveDot, { backgroundColor: statusColor }]} />}
            <ThemedText style={[styles.text, { color: statusColor }, isMedium && styles.textMedium]}>
                {status}
            </ThemedText>
        </View>
    );
});

const styles = StyleSheet.create({
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        alignSelf: 'flex-start',
        backgroundColor: 'transparent'
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3
    },
    text: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.4
    },
    textMedium: {
        fontSize: 11.5
    }
});
