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
            case 'LIVE': return colors.danger;
            case 'UPCOMING': return colors.primary;
            case 'COMPLETED': return colors.success;
            default: return colors.icon;
        }
    };

    const statusColor = getStatusColor();
    const isMedium = size === 'medium';

    return (
        <View style={[
            styles.badge,
            isMedium && styles.badgeMedium,
            { backgroundColor: statusColor }
        ]}>
            {status === 'LIVE' && <View style={styles.liveDot} />}
            <ThemedText style={[styles.text, isMedium && styles.textMedium]}>{status}</ThemedText>
        </View>
    );
});

const styles = StyleSheet.create({
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: 12,
        gap: 3,
        alignSelf: 'flex-start'
    },
    badgeMedium: {
        paddingHorizontal: 9,
        paddingVertical: 4
    },
    liveDot: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: '#FFFFFF'
    },
    text: {
        color: '#FFFFFF',
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 0.3
    },
    textMedium: {
        fontSize: 10.5
    }
});
