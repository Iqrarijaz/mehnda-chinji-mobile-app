import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View, Image } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
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
 * Category chip — round butter-cream icon well with the label underneath,
 * matching the reference design's category carousel.
 */
export const CategoryCard = React.memo(({ label, icon, onPress, isSelected, compact }: CategoryCardProps) => {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const isImageAsset = typeof icon !== 'string';

    return (
        <PressableScale
            onPress={onPress}
            pressedScale={0.92}
            style={styles.touchable}
        >
            <View style={[styles.card, compact && styles.cardCompact]}>
                <View
                    style={[
                        styles.iconContainer,
                        compact && styles.iconContainerCompact,
                        { backgroundColor: isSelected ? colors.limeSoft : colors.cream },
                    ]}
                >
                    {isImageAsset ? (
                        <Image
                            source={icon}
                            style={[styles.imageIcon, compact && styles.imageIconCompact]}
                            resizeMode="contain"
                        />
                    ) : (
                        <Ionicons
                            name={icon as any}
                            size={compact ? 22 : 26}
                            color={isSelected ? colors.limeDark : colors.primary}
                        />
                    )}
                </View>
                <ThemedText
                    style={[styles.label, { color: isSelected ? colors.primary : colors.text }]}
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
        margin: 6,
    },
    card: {
        paddingVertical: 10,
        paddingHorizontal: 4,
        alignItems: 'center',
        justifyContent: 'flex-start',
        minHeight: 88,
    },
    cardCompact: {
        paddingVertical: 6,
        minHeight: 66,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        overflow: 'hidden',
    },
    iconContainerCompact: {
        width: 44,
        height: 44,
        borderRadius: 22,
        marginBottom: 6,
    },
    imageIcon: {
        width: 36,
        height: 36,
    },
    imageIconCompact: {
        width: 28,
        height: 28,
    },
    label: {
        fontSize: 11,
        fontWeight: '600',
        textAlign: 'center',
        lineHeight: 14,
    },
});
