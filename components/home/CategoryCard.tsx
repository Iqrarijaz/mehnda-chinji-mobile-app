import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View, Image } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { Layout } from '@/constants/layout';

interface CategoryCardProps {
    label: string;
    icon: any;
    onPress: () => void;
}

export const CategoryCard = React.memo(({ label, icon, onPress }: CategoryCardProps) => {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const accentColor = colors.primary;
    const isImageAsset = typeof icon !== 'string';

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.7}
            style={styles.touchable}
        >
            <View style={[styles.card, { backgroundColor: colors.card }]}>
                <View style={[styles.iconContainer, { backgroundColor: isImageAsset ? 'transparent' : accentColor + '12' }]}>
                    {isImageAsset ? (
                        <Image
                            source={icon}
                            style={styles.imageIcon}
                            resizeMode="contain"
                        />
                    ) : (
                        <Ionicons name={icon as any} size={28} color={accentColor} />
                    )}
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
        borderRadius: Layout.borderRadius,
        padding: 12,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 80,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: Layout.borderRadius,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    imageIcon: {
        width: 44,
        height: 44,
    },
    label: {
        fontSize: 11,
        fontWeight: '600',
        textAlign: 'center',
        lineHeight: 14,
    },
});
