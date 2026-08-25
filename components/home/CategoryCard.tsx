import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { Layout } from '@/constants/layout';

interface CategoryCardProps {
    label: string;
    /**
     * A bundled asset (the number `require` returns), a remote image as
     * `{ uri }`, or an Ionicons name. The home layout is admin-editable, so any
     * of the three can arrive for the same card.
     */
    icon: any;
    onPress: () => void;
    isSelected?: boolean;
    compact?: boolean;
}

/** A remote `{ uri }`, string URL, and a bundled asset number all draw as images; otherwise an icon name glyph. */
function getImageSource(icon: any): any | null {
    if (typeof icon === 'number') return icon;
    if (icon && typeof icon === 'object' && typeof icon.uri === 'string') return icon;
    if (typeof icon === 'string') {
        const trimmed = icon.trim();
        if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
            return { uri: trimmed };
        }
    }
    return null;
}

export const CategoryCard = React.memo(({ label, icon, onPress, isSelected, compact }: CategoryCardProps) => {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const accentColor = colors.primary;
    const resolvedImageSource = getImageSource(icon);
    const isImageAsset = resolvedImageSource !== null;

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.7}
            style={styles.touchable}
        >
            <View style={[
                styles.card,
                { backgroundColor: colors.cardBg },
                compact && styles.cardCompact
            ]}>
                <View style={[styles.iconContainer, compact && styles.iconContainerCompact, { backgroundColor: isImageAsset ? 'transparent' : accentColor + '12' }]}>
                    {isImageAsset ? (
                        <Image
                            source={resolvedImageSource}
                            style={[styles.imageIcon, compact && styles.imageIconCompact]}
                            contentFit="contain"
                            cachePolicy="memory-disk"
                            transition={150}
                        />
                    ) : (
                        <Ionicons name={icon as any} size={compact ? 24 : 28} color={accentColor} />
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
        margin: 6 },
    card: {
        borderRadius: Layout.borderRadius - 2,
        padding: 12,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 80 },
    cardCompact: {
        padding: 8,
        minHeight: 60 },
    iconContainer: {
        width: 42,
        height: 42,
        borderRadius: Layout.borderRadius - 2,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8 },
    iconContainerCompact: {
        width: 36,
        height: 36,
        marginBottom: 4 },
    imageIcon: {
        width: 42,
        height: 42 },
    imageIconCompact: {
        width: 36,
        height: 36 },
    label: {
        fontSize: 11,
        fontWeight: '600',
        textAlign: 'center',
        lineHeight: 14 } });
