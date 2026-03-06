import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themedText';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';

interface CategoryCardProps {
    label: string;
    icon: string;
    onPress: () => void;
    color?: string;
}

export const CategoryCard = React.memo(({ label, icon, color, onPress }: CategoryCardProps) => {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const accentColor = color || colors.primary;

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.7}
            style={styles.touchable}
        >
            <View style={styles.card}>
                <View style={[styles.iconContainer, { backgroundColor: accentColor + '12' }]}>
                    <Ionicons name={icon as any} size={24} color={accentColor} />
                </View>
                <ThemedText
                    style={[styles.label, { color: colors.text }]}
                    numberOfLines={2}
                    adjustsFontSizeToFit
                    minimumFontScale={0.8}
                >
                    {String(label)}
                </ThemedText>
            </View>
        </TouchableOpacity>
    );
});

const styles = StyleSheet.create({
    touchable: {
        flex: 1,
        margin: 6,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 12,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 80,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    label: {
        fontSize: 11,
        fontWeight: '600',
        textAlign: 'center',
        lineHeight: 14,
    },
});
