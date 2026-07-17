import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View, Image } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';
import { PressableScale } from '@/components/ui/PressableScale';

interface CategoryCardProps {
    label: string;
    icon: any;
    onPress: () => void;
    isSelected?: boolean;
    compact?: boolean;
}

/**
 * Premium flat category card — white surface, softly tinted icon squircle,
 * label beneath. Hierarchy from surface contrast only (no borders/shadows).
 */
export const CategoryCard = React.memo(({ label, icon, onPress, isSelected, compact }: CategoryCardProps) => {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const isImageAsset = typeof icon !== 'string';

    return (
        <PressableScale
            onPress={onPress}
            pressedScale={0.97}
            style={styles.touchable}
        >
            <View style={[
                styles.card,
                { backgroundColor: isSelected ? colors.limeSoft : colors.card },
                compact && styles.cardCompact,
            ]}>
                <View style={[
                    styles.iconContainer,
                    compact && styles.iconContainerCompact,
                    { backgroundColor: isImageAsset ? 'transparent' : colors.limeSoft },
                    isSelected && { backgroundColor: colors.card },
                ]}>
                    {isImageAsset ? (
                        <Image
                            source={icon}
                            style={[styles.imageIcon, compact && styles.imageIconCompact]}
                            resizeMode="contain"
                        />
                    ) : (
                        <Ionicons name={icon as any} size={compact ? 20 : 24} color={colors.primary} />
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
        </PressableScale>
    );
});

const styles = StyleSheet.create({
    touchable: {
        flex: 1,
        margin: 5,
    },
    card: {
        borderRadius: Layout.cardBorderRadius,
        paddingVertical: 14,
        paddingHorizontal: 8,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 96,
    },
    cardCompact: {
        paddingVertical: 10,
        minHeight: 72,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        overflow: 'hidden',
    },
    iconContainerCompact: {
        width: 38,
        height: 38,
        borderRadius: 12,
        marginBottom: 6,
    },
    imageIcon: {
        width: 40,
        height: 40,
    },
    imageIconCompact: {
        width: 32,
        height: 32,
    },
    label: {
        fontSize: 11,
        fontWeight: '600',
        textAlign: 'center',
        lineHeight: 14,
    },
});
