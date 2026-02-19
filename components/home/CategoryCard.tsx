import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

interface CategoryCardProps {
    label: string;
    icon: string; // Ionicons name
    onPress: () => void;
    color?: string; // Optional accent color (not used in new design)
}

export function CategoryCard({ label, icon, color, onPress }: CategoryCardProps) {
    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.7}
            style={styles.touchable}
        >
            <View style={styles.card}>

                {/* Icon */}
                <View style={[styles.iconContainer, { backgroundColor: (color || '#004030') + '15', padding: 8, borderRadius: 12 }]}>
                    <Ionicons name={icon as any} size={24} color={color || '#004030'} />
                </View>

                {/* Label */}
                <ThemedText
                    style={styles.label}
                    numberOfLines={2}
                    adjustsFontSizeToFit={true}
                    minimumFontScale={0.8}
                >
                    {String(label)}
                </ThemedText>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    touchable: {
        flex: 1,
        margin: 6, // Increased from 4 for more spacing
    },
    card: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)', // Semi-transparent for shadow visibility
        borderRadius: 8,
        padding: 8,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 70,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3, // Reset to reasonable value
        elevation: 3,
        borderWidth: 0,
        overflow: 'hidden',
    },
    // glossOverlay removed
    iconContainer: {
        marginBottom: 6,
    },
    label: {
        fontSize: 10, // Smaller font
        fontWeight: '600',
        color: '#000000', // Black text
        textAlign: 'center',
        lineHeight: 12,
    },
});
